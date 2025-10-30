---
layout: post
title: "STL Cheat Sheet for Embedded/System Design"
date: 2025-10-29 00:00:00 -0700
categories: cpp embedded systems cheat-sheet
permalink: /2025/10/29/cpp-stl-embedded-cheat-sheet/
tags: [cpp, embedded, stl, containers, threading, atomics, memory, chrono]
---

# C++ STL Cheat Sheet for Embedded/System Design

Practical STL usage patterns tuned for firmware/RTOS/Linux-embedded: safe containers, memory control, timing, concurrency, and low-overhead utilities.

## Build & Runtime Constraints

- Prefer `-fno-exceptions -fno-rtti` where required; avoid throwing STL APIs
- Use `-ffunction-sections -fdata-sections -Wl,--gc-sections` to reduce image size
- Favor `-O2`/`-Os` for speed/size; enable LTO where available

## Containers (RAM-aware usage)

- `std::array<T,N>`: fixed-size, no allocation
- `std::vector<T>`: dynamic; pre-`reserve(N)`, beware iterator invalidation
- `std::deque<T>`: block-based growth, stable-ish ends
- `std::string`/`std::string_view`: view is zero-copy, non-owning
- `std::span<T>` (C++20): non-owning, bounds-aware view
- `std::optional<T>`: inline storage for maybe-present

```cpp
#include <array>
#include <vector>

std::array<uint8_t, 256> rxBuf;         // no heap
std::vector<uint8_t> frame; frame.reserve(1500); // pre-size capacity
```

### Fixed-Capacity Pattern

```cpp
// Ring buffer with fixed capacity using array indices
#include <array>

template<size_t N>
struct Ring {
    std::array<uint8_t,N> buf{}; size_t r=0,w=0,cnt=0;
    bool push(uint8_t v){ if(cnt==N) return false; buf[w]=(v); w=(w+1)%N; ++cnt; return true; }
    bool pop(uint8_t& v){ if(!cnt) return false; v=buf[r]; r=(r+1)%N; --cnt; return true; }
};
```

## Memory & Allocation

- Avoid unbounded allocations; centralize allocs at startup
- Prefer placement/new over per-packet heap churn
- Consider custom allocators for `vector`/`string` with static pools

```cpp
#include <memory>
#include <vector>

struct PoolAlloc : std::allocator<uint8_t> { /* pool-backed impl */ };
std::vector<uint8_t, PoolAlloc> pkt(PoolAlloc{});
```

## Time & Timers

- `std::chrono` for type-safe durations; store steady timestamps

```cpp
#include <chrono>

using namespace std::chrono;
auto t0 = steady_clock::now();
// ...
auto dt = duration_cast<milliseconds>(steady_clock::now()-t0);
```

## Concurrency (RTOS/Linux-embedded)

- Single-core RTOS: prefer queues/mailboxes; on Linux use STL threads/locks
- Avoid blocking while holding locks; keep critical sections tiny

### Threads & Locks

```cpp
#include <thread>
#include <mutex>
#include <condition_variable>

std::mutex m; std::condition_variable cv; bool ready=false;

void worker(){
    std::unique_lock<std::mutex> lk(m);
    cv.wait(lk, []{return ready;});
    // do work
}

void start(){
    std::thread th(worker);
    {
        std::lock_guard<std::mutex> g(m); ready=true;
    }
    cv.notify_one(); th.join();
}
```

### Atomics (flags/counters)

```cpp
#include <atomic>

std::atomic<uint32_t> dropped{0};
std::atomic<bool> stop{false};

void loop(){
    while(!stop.load(std::memory_order_acquire)){
        // process
    }
}
```

- Use `memory_order_release/acquire` for simple flag handshakes
- Prefer atomics for scalars; mutex for compound invariants

## I/O & Parsing

- Avoid heavyweight iostreams in tiny images; use `snprintf`, lightweight loggers
- `std::from_chars` (C++17) for fast, locale-free parse

```cpp
#include <charconv>

int v{}; auto [p,ec] = std::from_chars(str, str+len, v);
```

## Error Handling

- No exceptions build: return error codes or `expected`-like pattern

```cpp
#include <optional>

std::optional<int> readReg(){ /*...*/ return 0; } // empty = error
```

## Utilities

- `std::bitset`, `std::byte`, `std::endian` (C++20), `std::clamp`, `std::exchange`
- `std::span`/`string_view` for zero-copy API boundaries

## Firmware Patterns

- Double-buffering: producer fills back buffer, swaps atomically
- Lock-free single-producer single-consumer ring (careful with ABA/caches)
- Zero-copy interfaces via `span`/`string_view`

```cpp
#include <atomic>
#include <array>
#include <span>

template<size_t N>
struct DoubleBuf {
    std::array<uint8_t,N> a{}, b{}; std::atomic<bool> useA{true};
    std::span<uint8_t> front(){ return useA.load() ? std::span<uint8_t>(a) : std::span<uint8_t>(b); }
    std::span<uint8_t> back(){  return useA.load() ? std::span<uint8_t>(b) : std::span<uint8_t>(a); }
    void swap(){ useA.store(!useA.load(), std::memory_order_release); }
};
```

## Size/Latency Tips

- Pre-`reserve` vectors; prefer `array` for fixed buffers
- Avoid `std::function` in hot paths; use templates or function pointers
- Use `-fno-math-errno -fno-exceptions` where sane; avoid `<regex>`/heavy headers

## Checklist

- [ ] No hidden dynamic allocation in hot paths
- [ ] Bounded memory use under all inputs
- [ ] Deterministic timing for ISR/RTOS regions
- [ ] Explicit ownership (`span`, `string_view`, `optional`)
- [ ] Thread-safe handoffs with atomics/CV

---

Keep STL simple, predictable, and allocation-aware. Favor views and fixed-size structures, and reserve dynamic growth for initialization or low-rate control paths.

