---
layout: post
title: "C++ Atomic Operations: Complete Guide with Examples and Scenarios"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading atomic operations
permalink: /2025/12/03/cpp-atomic-operations-guide/
tags: [cpp, concurrency, multithreading, atomic, memory-ordering, lock-free, synchronization]
excerpt: "Complete guide to C++ atomic operations. Learn about atomic types, operations, memory ordering, and practical examples for lock-free programming."
---

# C++ Atomic Operations: Complete Guide with Examples and Scenarios

Atomic operations are the foundation of lock-free programming in C++. They provide thread-safe operations that are guaranteed to be indivisible.

## Table of Contents

1. [What are Atomic Operations?](#what-are-atomic-operations)
2. [std::atomic Types](#stdatomic-types)
3. [Atomic Operations](#atomic-operations)
4. [Memory Ordering](#memory-ordering)
5. [Common Patterns](#common-patterns)
6. [Example 1: Atomic Counter](#example-1-atomic-counter)
7. [Example 2: Atomic Flag](#example-2-atomic-flag)
8. [Example 3: Atomic Pointer](#example-3-atomic-pointer)
9. [Example 4: Atomic Operations with Memory Ordering](#example-4-atomic-operations-with-memory-ordering)
10. [Best Practices](#best-practices)

---

## What are Atomic Operations?

Atomic operations are indivisible - they complete entirely or not at all. Multiple threads can safely perform atomic operations on the same object without additional synchronization.

### Key Properties

- **Indivisible**: Operation completes entirely or not at all
- **Thread-safe**: No data races
- **Hardware support**: Typically implemented with CPU instructions
- **No locks**: Avoid mutex overhead

### When to Use

- **Counters**: Thread-safe increment/decrement
- **Flags**: Boolean flags shared between threads
- **Pointers**: Lock-free data structures
- **Lock-free algorithms**: Building blocks for complex structures

---

## std::atomic Types

### Basic Atomic Types

```cpp
#include <atomic>
using namespace std;

// Integer types
atomic<int> int_atomic{0};
atomic<long> long_atomic{0L};
atomic<long long> llong_atomic{0LL};

// Pointer types
atomic<int*> ptr_atomic{nullptr};

// Boolean
atomic<bool> bool_atomic{false};

// Character types
atomic<char> char_atomic{'\0'};
```

### Specialized Atomic Types

```cpp
// Atomic flag (most efficient)
atomic_flag flag = ATOMIC_FLAG_INIT;

// Atomic shared pointer (C++20)
atomic<shared_ptr<int>> shared_ptr_atomic;
```

### Custom Types

{% raw %}
```cpp
// Must be trivially copyable
struct Point {
    int x, y;
};

atomic<Point> point_atomic{{0, 0}};
```
{% endraw %}

---

## Atomic Operations

### Load and Store

```cpp
atomic<int> value{42};

// Load (read)
int read = value.load();                    // Default: seq_cst
int read2 = value.load(memory_order_acquire);

// Store (write)
value.store(100);                          // Default: seq_cst
value.store(100, memory_order_release);

// Operator overloads
int val = value;                           // Equivalent to load()
value = 50;                                // Equivalent to store(50)
```

### Exchange

```cpp
atomic<int> value{10};

// Exchange (read and write atomically)
int old = value.exchange(20);              // Set to 20, return old value
// value is now 20, old is 10
```

### Compare-and-Swap

```cpp
atomic<int> value{10};

// Weak version (may fail spuriously, faster)
int expected = 10;
bool success = value.compare_exchange_weak(expected, 20);
// If value == 10: set to 20, return true
// Otherwise: set expected to current value, return false

// Strong version (never fails spuriously, slower)
int expected2 = 10;
bool success2 = value.compare_exchange_strong(expected2, 20);

// Typical loop pattern
int expected = value.load();
do {
    int desired = expected + 1;
} while (!value.compare_exchange_weak(expected, desired));
```

### Read-Modify-Write Operations

```cpp
atomic<int> counter{0};

// Fetch and add
int old = counter.fetch_add(5);            // counter += 5, return old
counter += 5;                              // Same, but return new

// Fetch and subtract
int old2 = counter.fetch_sub(3);

// Fetch and bitwise operations
atomic<int> flags{0};
flags.fetch_and(0xFF);                     // flags &= 0xFF
flags.fetch_or(0x01);                      // flags |= 0x01
flags.fetch_xor(0x10);                     // flags ^= 0x10

// Pre/post increment/decrement
++counter;                                 // Pre-increment
counter++;                                 // Post-increment
--counter;                                 // Pre-decrement
counter--;                                 // Post-decrement
```

---

## Memory Ordering

Memory ordering controls synchronization between atomic operations and regular memory operations.

### Memory Order Options

```cpp
// Sequential consistency (default, strongest)
atomic<int> x{0};
x.store(1, memory_order_seq_cst);
int val = x.load(memory_order_seq_cst);

// Acquire (for loads) - can't reorder before this
int val2 = x.load(memory_order_acquire);

// Release (for stores) - can't reorder after this
x.store(1, memory_order_release);

// Acquire-Release (for RMW) - both acquire and release
x.fetch_add(1, memory_order_acq_rel);

// Relaxed (weakest) - no ordering guarantees
x.store(1, memory_order_relaxed);
int val3 = x.load(memory_order_relaxed);
```

### Memory Order Semantics

1. **`memory_order_relaxed`**: No synchronization, just atomicity
2. **`memory_order_acquire`**: Loads can't be reordered before this
3. **`memory_order_release`**: Stores can't be reordered after this
4. **`memory_order_acq_rel`**: Both acquire and release
5. **`memory_order_seq_cst`**: Sequential consistency (default, strongest)

### Release-Acquire Pattern

```cpp
atomic<bool> ready{false};
int data = 0;

// Thread 1: Producer
void producer() {
    data = 42;                              // Regular write
    ready.store(true, memory_order_release); // Release: all writes before this are visible
}

// Thread 2: Consumer
void consumer() {
    while (!ready.load(memory_order_acquire)) { // Acquire: see all writes before release
        // Wait
    }
    // data is guaranteed to be 42 here
    cout << data << endl;
}
```

### Sequential Consistency

```cpp
atomic<int> x{0}, y{0};

// Thread 1
void thread1() {
    x.store(1, memory_order_seq_cst);  // Sequentially consistent
    int r1 = y.load(memory_order_seq_cst);
}

// Thread 2
void thread2() {
    y.store(1, memory_order_seq_cst);
    int r2 = x.load(memory_order_seq_cst);
}

// With seq_cst, it's impossible for both r1 and r2 to be 0
```

---

## Common Patterns

### Pattern 1: Atomic Counter

```cpp
class AtomicCounter {
private:
    atomic<int> count_{0};

public:
    void increment() {
        count_.fetch_add(1, memory_order_relaxed);
    }

    void decrement() {
        count_.fetch_sub(1, memory_order_relaxed);
    }

    int get() const {
        return count_.load(memory_order_acquire);
    }

    int getAndReset() {
        return count_.exchange(0, memory_order_acq_rel);
    }
};
```

### Pattern 2: Atomic Flag

```cpp
class AtomicFlag {
private:
    atomic<bool> flag_{false};

public:
    void set() {
        flag_.store(true, memory_order_release);
    }

    bool test() {
        return flag_.load(memory_order_acquire);
    }

    bool testAndSet() {
        return flag_.exchange(true, memory_order_acq_rel);
    }

    void clear() {
        flag_.store(false, memory_order_release);
    }
};
```

### Pattern 3: Spin Lock

```cpp
class SpinLock {
private:
    atomic_flag locked_ = ATOMIC_FLAG_INIT;

public:
    void lock() {
        while (locked_.test_and_set(memory_order_acquire)) {
            // Spin until lock is acquired
            while (locked_.test(memory_order_relaxed)) {
                // CPU pause hint
                this_thread::yield();
            }
        }
    }

    void unlock() {
        locked_.clear(memory_order_release);
    }
};
```

---

## Example 1: Atomic Counter

```cpp
#include <iostream>
#include <thread>
#include <atomic>
#include <vector>
using namespace std;

void atomicCounterExample() {
    atomic<int> counter{0};
    const int NUM_THREADS = 10;
    const int INCREMENTS_PER_THREAD = 1000;

    vector<thread> threads;
    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back([&counter]() {
            for (int j = 0; j < INCREMENTS_PER_THREAD; ++j) {
                counter.fetch_add(1, memory_order_relaxed);
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    cout << "Final counter value: " << counter.load() << endl;
    cout << "Expected: " << NUM_THREADS * INCREMENTS_PER_THREAD << endl;
}
```

---

## Example 2: Atomic Flag

```cpp
void atomicFlagExample() {
    atomic<bool> ready{false};
    string message;

    thread producer([&]() {
        this_thread::sleep_for(chrono::milliseconds(100));
        message = "Hello from producer";
        ready.store(true, memory_order_release);
    });

    thread consumer([&]() {
        while (!ready.load(memory_order_acquire)) {
            this_thread::yield();
        }
        cout << "Message: " << message << endl;
    });

    producer.join();
    consumer.join();
}
```

---

## Example 3: Atomic Pointer

```cpp
void atomicPointerExample() {
    atomic<int*> ptr{nullptr};
    int* data = new int(42);

    thread writer([&]() {
        this_thread::sleep_for(chrono::milliseconds(50));
        ptr.store(data, memory_order_release);
    });

    thread reader([&]() {
        int* p;
        while (!(p = ptr.load(memory_order_acquire))) {
            this_thread::yield();
        }
        cout << "Read value: " << *p << endl;
    });

    writer.join();
    reader.join();

    delete data;
}
```

---

## Example 4: Atomic Operations with Memory Ordering

```cpp
void memoryOrderingExample() {
    atomic<int> data{0};
    atomic<bool> ready{false};

    // Thread 1: Producer
    thread producer([&]() {
        data.store(100, memory_order_relaxed);
        data.store(200, memory_order_relaxed);
        ready.store(true, memory_order_release);  // Release: all previous stores visible
    });

    // Thread 2: Consumer
    thread consumer([&]() {
        while (!ready.load(memory_order_acquire)) {  // Acquire: see all stores before release
            this_thread::yield();
        }
        // data is guaranteed to be 200 (or later value)
        cout << "Data: " << data.load(memory_order_relaxed) << endl;
    });

    producer.join();
    consumer.join();
}
```

---

## Best Practices

### 1. Use Appropriate Memory Ordering

```cpp
// GOOD: Correct ordering for synchronization
atomic<bool> flag{false};
int data = 0;

void set() {
    data = 42;
    flag.store(true, memory_order_release);
}

void get() {
    if (flag.load(memory_order_acquire)) {
        // data is guaranteed to be 42
    }
}

// BAD: Relaxed ordering (no synchronization)
void bad_set() {
    data = 42;
    flag.store(true, memory_order_relaxed);  // No ordering!
}
```

### 2. Prefer Weak CAS in Loops

```cpp
// GOOD: Weak CAS in loop (may be faster)
atomic<int> value{10};
int expected = value.load();
do {
    int desired = expected + 1;
} while (!value.compare_exchange_weak(expected, desired));

// Use strong CAS when not in loop
bool success = value.compare_exchange_strong(expected, desired);
```

### 3. Avoid False Sharing

```cpp
// BAD: False sharing (same cache line)
struct {
    atomic<int> counter1;
    atomic<int> counter2;  // Same cache line!
} counters;

// GOOD: Separate cache lines
alignas(64) atomic<int> counter1;
alignas(64) atomic<int> counter2;
```

### 4. Use atomic_flag for Flags

```cpp
// GOOD: Most efficient for boolean flags
atomic_flag flag = ATOMIC_FLAG_INIT;
flag.test_and_set();
flag.clear();

// Also OK, but less efficient
atomic<bool> flag2{false};
```

### Common Mistakes

1. **Wrong memory ordering**: Using relaxed when acquire/release needed
2. **Mixing atomic and non-atomic**: Accessing same data both ways
3. **False sharing**: Multiple atomics on same cache line
4. **ABA problem**: Not handling in CAS loops
5. **Infinite loops**: CAS loops without proper exit

---

## Summary

Atomic operations provide thread-safe, lock-free operations:

- **Indivisible operations**: Guaranteed atomicity
- **Memory ordering**: Control synchronization
- **Lock-free**: No mutex overhead
- **Performance**: Better scalability

Key takeaways:
- Use `std::atomic` for shared data
- Understand memory ordering semantics
- Use appropriate ordering for your needs
- Avoid false sharing
- Prefer weak CAS in loops

By mastering atomic operations, you can build efficient, lock-free concurrent systems in C++.

