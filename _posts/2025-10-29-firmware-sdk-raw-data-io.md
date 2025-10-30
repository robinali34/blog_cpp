---
layout: post
title: "Raw Data Read/Write Between Firmware and SDK"
date: 2025-10-29 00:00:00 -0700
categories: cpp systems ipc binary-protocol
permalink: /2025/10/29/cpp-firmware-sdk-raw-data-io/
tags: [cpp, ipc, shared-memory, sockets, binary, endianness, alignment, checksum]
---

# C++ Raw Data Read/Write Between Firmware and SDK

Practical patterns for moving raw binary data between a firmware process and an SDK process with a minimal, versioned header, robust framing, and portable layout.

## Binary Frame Format

```text
+----------------------+  Frame Header (fixed-size, packed)
| magic (4B)          |
| version (2B)        |
| flags (2B)          |
| sequence (8B)       |
| payloadSize (8B)    |
| reserved (8B)       |
| crc32 (4B)          |  // header+payload CRC (optional)
+----------------------+
| Payload (payloadSize)
+----------------------+
```

- All multi-byte fields are little-endian unless negotiated
- `magic` distinguishes your frame (e.g., 'FWSD')
- `version` allows protocol evolution
- `sequence` detects drops/reordering
- `crc32` defends against corruption across transports

## Portable C++ Header Type (packed)

```cpp
#include <cstdint>
#include <cstring>

#pragma pack(push, 1)
struct FrameHeaderLE {
    uint32_t magic;       // 'F' 'W' 'S' 'D' => 0x44535746 LE
    uint16_t version;     // protocol version
    uint16_t flags;       // custom flags
    uint64_t sequence;    // frame counter
    uint64_t payloadSize; // bytes following header
    uint64_t reserved;    // future use
    uint32_t crc32;       // over header (crc32=0) + payload
};
#pragma pack(pop)

static constexpr uint32_t kMagic = 0x44535746u; // 'FWSD' LE
static constexpr uint16_t kVersion = 1;

static inline bool headerSane(const FrameHeaderLE& h, uint64_t maxPayload){
    if (h.magic != kMagic) return false;
    if (h.version == 0 || h.version > kVersion) return false;
    if (h.payloadSize > maxPayload) return false;
    return true;
}
```

Note: `#pragma pack` is compiler-specific; for maximum portability, serialize fields individually with `std::memcpy` to/from a byte buffer.

## Endianness Helpers

```cpp
#include <bit>
#include <cstdint>

static inline uint16_t le16(uint16_t v){
#if __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__
    return v;
#else
    return std::byteswap(v);
#endif
}
// Similarly le32, le64 as needed
```

## Shared Memory Variant (Zero-Copy)

- Use the same shared memory object for header+payload
- Synchronize with a semaphore or eventfd; publish with release/acquire

Producer (firmware):

```cpp
// write header then payload, compute crc; publish sequence
FrameHeaderLE h{};
h.magic = kMagic; h.version = kVersion; h.flags = 0;
h.sequence = ++seq; h.payloadSize = payload.size(); h.reserved = 0; h.crc32 = 0;
std::memcpy(shmBase, &h, sizeof(h));
std::memcpy(static_cast<uint8_t*>(shmBase)+sizeof(h), payload.data(), payload.size());
uint32_t crc = crc32_calc(static_cast<uint8_t*>(shmBase), sizeof(h)+payload.size());
std::memcpy(&static_cast<FrameHeaderLE*>(shmBase)->crc32, &crc, sizeof(crc));
// signal via semaphore/eventfd
```

Consumer (SDK):

```cpp
// wait on semaphore, then read header+payload atomically with acquire
FrameHeaderLE h; std::memcpy(&h, shmBase, sizeof(h));
if (!headerSane(h, kMaxPayload)) { /* handle error */ }
std::vector<uint8_t> buf(h.payloadSize);
std::memcpy(buf.data(), static_cast<uint8_t*>(shmBase)+sizeof(h), buf.size());
uint32_t crc = crc32_calc(static_cast<uint8_t*>(shmBase), sizeof(h)+buf.size());
if (crc != h.crc32) { /* drop frame */ }
```

## UNIX Domain Socket Variant (Framed I/O)

Transport-neutral framing: write header then payload; read exactly N bytes.

Sender:

```cpp
ssize_t sendAll(int fd, const void* p, size_t n){
    const uint8_t* b = static_cast<const uint8_t*>(p);
    size_t sent = 0; while (sent < n){
        ssize_t r = ::send(fd, b+sent, n-sent, 0);
        if (r <= 0) return r; sent += size_t(r);
    } return ssize_t(sent);
}

FrameHeaderLE h{/*init as above*/};
uint32_t crc = crc32_calc(&h, sizeof(h));
h.crc32 = crc32_finish(crc, payload.data(), payload.size());
sendAll(fd, &h, sizeof(h));
sendAll(fd, payload.data(), payload.size());
```

Receiver:

```cpp
ssize_t recvAll(int fd, void* p, size_t n){
    uint8_t* b = static_cast<uint8_t*>(p);
    size_t got = 0; while (got < n){
        ssize_t r = ::recv(fd, b+got, n-got, MSG_WAITALL);
        if (r <= 0) return r; got += size_t(r);
    } return ssize_t(got);
}

FrameHeaderLE h{};
if (recvAll(fd, &h, sizeof(h)) != sizeof(h)) { /* error */ }
if (!headerSane(h, kMaxPayload)) { /* error */ }
std::vector<uint8_t> buf(h.payloadSize);
if (recvAll(fd, buf.data(), buf.size()) != (ssize_t)buf.size()) { /* error */ }
uint32_t crc = crc32_calc(&h, sizeof(h));
crc = crc32_finish(crc, buf.data(), buf.size());
if (crc != h.crc32) { /* drop */ }
```

## Alignment & Padding

- Avoid assuming `sizeof(FrameHeaderLE)` layout across compilers/ABIs; serialize fields explicitly for portability
- If using packed structs, keep fields naturally aligned where possible

## Flow Control & Backpressure

- Shared memory: use ring buffer slots (HEAD/TAIL indexes) to decouple producer/consumer rates
- Sockets: implement windowing or drop policy when consumer lags; include `sequence` and `flags`

## Error Handling

- Validate `magic/version/payloadSize`
- Timeouts on reads/writes; exponential backoff on retries
- CRC/length mismatch → drop frame and resync at next `magic`

## Minimal CRC32 (placeholder)

```cpp
uint32_t crc32_calc(const void* data, size_t len){ /* impl or library */ return 0; }
uint32_t crc32_finish(uint32_t seed, const void* data, size_t len){ /* impl */ return seed; }
```

## Build (Linux)

```bash
g++ -std=c++20 -O2 -pthread sender.cpp -o sender
g++ -std=c++20 -O2 -pthread receiver.cpp -o receiver
```

---

Choose shared memory for zero-copy on the same host, and UNIX domain sockets/TCP for cross-process/network hops. Keep headers versioned, validate strictly, and make framing explicit to survive partial reads/writes and future protocol changes.
