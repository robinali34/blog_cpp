---
layout: post
title: "Sharing Large Image Buffers from Firmware to SDK (Zero-Copy via POSIX Shared Memory)"
date: 2025-10-29 00:00:00 -0700
categories: cpp systems ipc shared-memory mmap
permalink: /2025/10/29/firmware-to-sdk-large-image-sharing/
tags: [cpp, ipc, shared-memory, mmap, semaphores, zero-copy, images]
---

# Sharing Large Image Buffers from Firmware to SDK (Zero-Copy)

This post demonstrates a practical, zero-copy pipeline to share large image buffers (e.g., 1920x1080 RGB) from a firmware process to an SDK process using POSIX shared memory and semaphores.

## Why Shared Memory?

- **Zero-copy** handoff of large buffers (avoid file I/O and socket copies)
- **Low latency** and **high throughput**
- Simple control via a small shared header + semaphore for synchronization

## Design Overview

- A shared memory object contains a small header and a large contiguous image buffer
- The firmware (producer) writes pixels into the buffer, flips a "ready" flag, and posts a semaphore
- The SDK (consumer) waits on the semaphore, reads header + buffer, processes, then resets the "ready" flag

```text
+----------------------------+  shm: /img_shm
| Header (metadata)         |
|  - width, height, stride  |
|  - payloadSize            |
|  - sequence               |
|  - ready (atomic)         |
+----------------------------+
| Image Buffer (bytes)      |
+----------------------------+

Semaphore: /img_sem  (named POSIX semaphore)
```

## Semaphore Primer (POSIX named semaphore)

We use a named POSIX semaphore (`/img_sem`) to signal frame readiness between processes:

- `sem_open(name, O_CREAT, mode, initial)` creates/opens a kernel semaphore by name
- `sem_post(sem)` increments the semaphore (producer signals a new frame is ready)
- `sem_wait(sem)` blocks until the semaphore is > 0, then decrements it (consumer waits for a frame)
- Multiple posts can queue up if the consumer is slower; each wait consumes one signal

Why both a semaphore and an atomic `ready` flag?
- The semaphore provides efficient blocking/wakeup without polling
- The atomic `ready` flag (with `release/acquire` ordering) publishes the buffer contents and protects against spurious or out-of-order observations

Initialization:
- We create the semaphore with initial count 0 so the consumer blocks until the first frame is produced
- The same name can be opened by multiple processes; the OS manages the underlying object

Lifecycle:
- Close with `sem_close` in each process when done
- Optionally remove the named object with `sem_unlink(name)` when the pipeline is being torn down

Alternatives:
- `eventfd` (Linux), futexes, or `condition_variable` (same-process) can serve similar roles
- For multi-slot pipelines, consider a ring buffer of headers and post once per filled slot

## Shared Header Definition

```cpp
// shared_header.h
#pragma once
#include <cstdint>
#include <atomic>

struct ImageHeader {
    uint32_t width;
    uint32_t height;
    uint32_t strideBytes;     // bytes per row
    uint32_t pixelFormat;     // e.g., 0=RGB888
    uint64_t payloadSize;     // bytes in buffer
    uint64_t sequence;        // frame counter
    std::atomic<uint32_t> ready; // 0=not ready, 1=ready
};

static constexpr const char* kShmName = "/img_shm";
static constexpr const char* kSemName = "/img_sem";
```

## Producer (Firmware) — Write Image into Shared Memory

```cpp
// producer.cpp
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <semaphore.h>
#include <unistd.h>
#include <cstring>
#include <cstdio>
#include "shared_header.h"

int main() {
    const uint32_t W = 1920, H = 1080, BPP = 3; // RGB888
    const uint64_t payload = static_cast<uint64_t>(W) * H * BPP;
    const size_t shmSize = sizeof(ImageHeader) + payload;

    // Create or open shared memory
    int fd = shm_open(kShmName, O_CREAT | O_RDWR, 0660);
    if (fd < 0) { perror("shm_open"); return 1; }
    if (ftruncate(fd, shmSize) != 0) { perror("ftruncate"); return 1; }

    void* base = mmap(nullptr, shmSize, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (base == MAP_FAILED) { perror("mmap"); return 1; }
    close(fd);

    auto* header = reinterpret_cast<ImageHeader*>(base);
    auto* buffer = reinterpret_cast<unsigned char*>(header + 1);

    // Create or open the semaphore
    sem_t* sem = sem_open(kSemName, O_CREAT, 0660, 0);
    if (sem == SEM_FAILED) { perror("sem_open"); return 1; }

    // Initialize header (once)
    header->width = W;
    header->height = H;
    header->strideBytes = W * BPP;
    header->pixelFormat = 0; // RGB888
    header->payloadSize = payload;
    header->sequence = 0;
    header->ready.store(0, std::memory_order_release);

    // Produce a few frames
    for (int frame = 0; frame < 10; ++frame) {
        // Fill buffer with a simple pattern (gradient)
        for (uint32_t y = 0; y < H; ++y) {
            unsigned char* row = buffer + y * header->strideBytes;
            for (uint32_t x = 0; x < W; ++x) {
                row[3*x + 0] = static_cast<unsigned char>((x + frame) % 256); // R
                row[3*x + 1] = static_cast<unsigned char>((y + frame) % 256); // G
                row[3*x + 2] = 0x80;                                          // B
            }
        }
        header->sequence++;
        header->ready.store(1, std::memory_order_release);

        // Signal consumer a frame is ready
        if (sem_post(sem) != 0) { perror("sem_post"); }
        printf("Produced frame %llu\n", (unsigned long long)header->sequence);
    }

    // Cleanup (keep shm and sem for consumer or remove if done)
    // sem_close(sem); sem_unlink(kSemName);
    // munmap(base, shmSize); shm_unlink(kShmName);
    return 0;
}
```

## Consumer (SDK) — Read Without Copy

```cpp
// consumer.cpp
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <semaphore.h>
#include <unistd.h>
#include <cstdio>
#include <cstdint>
#include "shared_header.h"

int main() {
    // Open existing shared memory
    int fd = shm_open(kShmName, O_RDWR, 0660);
    if (fd < 0) { perror("shm_open"); return 1; }

    // Map just the header first to discover size
    void* hmap = mmap(nullptr, sizeof(ImageHeader), PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (hmap == MAP_FAILED) { perror("mmap header"); return 1; }
    auto* header = reinterpret_cast<ImageHeader*>(hmap);

    const size_t shmSize = sizeof(ImageHeader) + header->payloadSize;
    munmap(hmap, sizeof(ImageHeader));

    void* base = mmap(nullptr, shmSize, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (base == MAP_FAILED) { perror("mmap full"); return 1; }
    close(fd);

    header = reinterpret_cast<ImageHeader*>(base);
    auto* buffer = reinterpret_cast<const unsigned char*>(header + 1);

    // Open semaphore
    sem_t* sem = sem_open(kSemName, 0);
    if (sem == SEM_FAILED) { perror("sem_open"); return 1; }

    for (;;) {
        // Wait for producer to signal a frame is ready
        if (sem_wait(sem) != 0) { perror("sem_wait"); return 1; }

        if (header->ready.load(std::memory_order_acquire) == 1) {
            // Access image without copying
            printf("SDK: frame %llu, WxH=%ux%u, stride=%u, payload=%llu\n",
                   (unsigned long long)header->sequence,
                   header->width, header->height, header->strideBytes,
                   (unsigned long long)header->payloadSize);

            // Example: read first pixel
            unsigned char r = buffer[0];
            unsigned char g = buffer[1];
            unsigned char b = buffer[2];
            (void)r; (void)g; (void)b;

            // Mark consumed
            header->ready.store(0, std::memory_order_release);
        }
    }

    // Cleanup (optional)
    // sem_close(sem);
    // munmap(base, shmSize);
    return 0;
}
```

## Forwarding From SDK to a Streaming Server

After the SDK maps and reads the frame from shared memory, it can forward the buffer to a streaming server. Below is a minimal example that sends the raw RGB frame over a TCP socket. In production, you may compress (e.g., JPEG/PNG) or packetize (e.g., RTP) before sending.

```cpp
// inside consumer loop after reading `buffer` and header fields
#include <sys/socket.h>
#include <arpa/inet.h>

int sock = socket(AF_INET, SOCK_STREAM, 0);
sockaddr_in addr{};
addr.sin_family = AF_INET;
addr.sin_port = htons(9000);             // streaming server port
inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr); // streaming server IP

if (connect(sock, (sockaddr*)&addr, sizeof(addr)) == 0) {
    // Optional: send simple header first
    struct {
        uint32_t width, height, stride, format; // same as header
        uint64_t payload;
        uint64_t sequence;
    } netHdr{header->width, header->height, header->strideBytes, header->pixelFormat,
             header->payloadSize, header->sequence};

    send(sock, &netHdr, sizeof(netHdr), 0);

    // Send payload in chunks to avoid large single send
    const unsigned char* p = buffer;
    uint64_t remaining = header->payloadSize;
    while (remaining > 0) {
        size_t chunk = static_cast<size_t>(std::min<uint64_t>(remaining, 1 << 16));
        ssize_t n = send(sock, p, chunk, 0);
        if (n <= 0) break;
        p += n;
        remaining -= static_cast<uint64_t>(n);
    }
}
close(sock);
```

Notes:
- For live video, prefer persistent connections and a proper container/codec (MJPEG over HTTP, RTP/RTSP, WebRTC, gRPC streaming, etc.)
- Consider converting RGB to a compressed format to reduce bandwidth
- Add framing/length-prefixing if the transport requires message boundaries

## Notes and Best Practices

- Use `std::memory_order_release/acquire` for the ready flag to publish and observe writes to the buffer
- Consider a **ring buffer** with multiple slots for continuous streaming
- If firmware runs on another core/SoC with caches, ensure **cache coherence** or explicit cache flush/invalidate around writes/reads
- For cross-platform Windows, use `CreateFileMapping` + `MapViewOfFile` and named events
- For huge images, consider **huge pages** (e.g., `madvise`, `MAP_HUGETLB`) to reduce TLB misses (Linux-specific)
- If you need back-pressure, maintain a state enum (EMPTY/READY/READING/DONE) or a slot queue

## Build

```bash
# Linux
g++ -std=c++20 -O2 -pthread producer.cpp -o producer
g++ -std=c++20 -O2 -pthread consumer.cpp -o consumer
```

## Cleanup Helpers

```bash
# If you need to remove shared objects manually
ls /dev/shm | grep img_
# In code: shm_unlink("/img_shm"); sem_unlink("/img_sem");
```

---

This approach avoids copying large images between processes and provides a simple, robust synchronization method that works well for high-throughput camera and vision pipelines.
