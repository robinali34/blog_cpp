---
layout: post
title: "C++ volatile: What It Is, What It Isn't, and Real-World Scenarios"
date: 2025-10-29 00:00:00 -0700
categories: cpp low-level memory-model embedded
permalink: /2025/10/29/cpp-volatile-guide-and-scenarios/
tags: [cpp, volatile, memory-model, embedded, atomics, registers]
---

# C++ volatile: What It Is, What It Isn't, and Real-World Scenarios

`volatile` tells the compiler an object can change "outside normal code flow" and must not be optimized away, cached in registers, or have accesses elided/reordered (as-if within the same thread). It is NOT a synchronization primitive and does NOT make code thread-safe.

- Guarantees each read/write is an observable side-effect at the abstract machine level
- Prevents certain compiler optimizations on that object
- Does NOT provide atomicity, inter-thread happens-before, or fences

Use `std::atomic<T>` for inter-thread synchronization; use `volatile` for hardware/OS-driven changes like memory-mapped I/O or signal handlers.

## Scenario 1: Memory-Mapped I/O (MMIO)

```cpp
#include <cstdint>

static volatile uint32_t* const UART_STATUS = reinterpret_cast<volatile uint32_t*>(0x4000'0000);
static volatile uint32_t* const UART_TX     = reinterpret_cast<volatile uint32_t*>(0x4000'0004);

void uartWrite(uint8_t byte) {
    // Spin until TX empty
    while ( (*UART_STATUS & 0x01u) == 0 ) {
        // Each read must hit the device register, not a cached value
    }
    *UART_TX = byte; // write-through to the device
}
```

Why volatile: Device registers can change independently of your code. The compiler must not eliminate polling loops or cache previous values.

## Scenario 2: DMA/Shared Buffer Status Flags from Hardware

```cpp
struct DmaDesc { volatile uint32_t status; volatile uint32_t length; }; 

bool isComplete(volatile DmaDesc* d) {
    return (d->status & 0x1u) != 0; // always re-read hardware-updated status
}
```

Note: Volatile ensures each access is made, but cache coherency is a separate hardware concern.

## Scenario 3: Spin on a Flag Set by a Signal Handler (same process)

```cpp
#include <csignal>
#include <atomic>

// Preferred: atomic for signal-safe flags
volatile sig_atomic_t g_stop = 0; // portable signal-safe integer type

void onSigint(int){ g_stop = 1; }

int main(){
    std::signal(SIGINT, onSigint);
    while (!g_stop) {
        // do work, loop exits when signal handler flips flag
    }
}
```

Use `sig_atomic_t` with `volatile` in signal handlers. For thread coordination, prefer `std::atomic<bool>`.

## Scenario 4: Prevent Elision of Busy-Wait Delays (device timing)

```cpp
static volatile int sink;

void shortDelay(volatile int cycles){
    for (volatile int i = 0; i < cycles; ++i) {
        sink = i; // side effect prevents total loop elimination
    }
}
```

Note: Prefer precise timers; this is for low-level bring-up/testing.

## Scenario 5: Contrast — Wrong Use for Thread Communication

```cpp
#include <thread>
#include <cassert>

volatile bool ready = false; // WRONG for threads
int data;

void producer(){ data = 42; ready = true; }
void consumer(){ while(!ready){} /* spin */ assert(data == 42); }

int main(){ std::thread a(producer), b(consumer); a.join(); b.join(); }
```

This has a data race and undefined behavior. `volatile` does not create a happens-before edge. Use `std::atomic`:

```cpp
#include <atomic>

std::atomic<bool> ready{false};
int data;

void producer(){ data = 42; ready.store(true, std::memory_order_release); }
void consumer(){ while(!ready.load(std::memory_order_acquire)){} assert(data == 42); }
```

## Scenario 6: Inline Assembly and Volatile Accesses

```cpp
// Inform compiler that memory could be clobbered by asm
int foo(int* p){
    int x;
#if defined(__GNUC__)
    __asm__ volatile ("" : "=r"(x) : "0"(*p) : "memory");
#else
    x = *p;
#endif
    return x;
}
```

`volatile` on the asm statement plus the `memory` clobber prevents reordering across the barrier.

## Scenario 7: const volatile for Read-Only Changing Locations

```cpp
extern const volatile uint32_t RTC_SECONDS; // hardware RTC seconds register
uint32_t now(){ return RTC_SECONDS; } // always read from the register
```

`const volatile` means your code cannot modify it, but reads cannot be optimized away.

## Scenario 8: Bitfields Backed by Device Register

```cpp
struct Reg {
    volatile unsigned READY : 1;
    volatile unsigned ERROR : 1;
    volatile unsigned RESERVED : 30;
};

static volatile Reg* const STATUS = reinterpret_cast<volatile Reg*>(0x5000'0000);

bool deviceReady(){ return STATUS->READY; }
```

Be careful: Bitfield layout is implementation-defined. Prefer masks/shifts on integral volatiles for portability.

## Scenario 9: setjmp/longjmp or Exception Boundaries with Volatile Locals

```cpp
#include <csetjmp>

std::jmp_buf jb;

void g(){ std::longjmp(jb, 1); }

int f(){
    volatile int critical = 7; // force store/load around non-local jump
    if (setjmp(jb) == 0) { g(); }
    return critical; // value is reloaded
}
```

Volatile ensures the variable remains observable across non-local control flow changes. Use sparingly.

## Scenario 10: Compiler Barriers vs Volatile

- `volatile` constrains optimization of accesses to that object
- A compiler barrier (e.g., `std::atomic_signal_fence`, inline asm with `memory` clobber) constrains instruction motion
- A hardware fence (`std::atomic_thread_fence`) constrains CPU reordering

Choose the right tool for the job.

---

## Quick Checklist

- Use `volatile` for: memory-mapped I/O, signal-handler flags (`sig_atomic_t`), special timing/polling, read-only changing registers
- Do NOT use `volatile` for: thread synchronization, protecting shared data, ensuring atomicity or ordering across threads
- Prefer `std::atomic`, mutexes, and condition variables for concurrency

## References

- C++ Standard (volatile, memory model)
- ISO C++ FAQ: volatile
- Compiler docs on `volatile` semantics and inline assembly barriers
