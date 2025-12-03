---
layout: post
title: "C++ Mutex: Complete Guide with Scenarios and Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading mutex synchronization
permalink: /2025/12/03/cpp-mutex-guide-scenarios/
tags: [cpp, concurrency, multithreading, mutex, lock, synchronization, thread-safety]
excerpt: "Complete guide to C++ mutex with scenarios, examples, and common use cases. Learn about mutex types, locking strategies, and thread synchronization."
---

# C++ Mutex: Complete Guide with Scenarios and Examples

Mutex (mutual exclusion) is a fundamental synchronization primitive that ensures only one thread can access a shared resource at a time.

## Table of Contents

1. [What is a Mutex?](#what-is-a-mutex)
2. [Mutex Types in C++](#mutex-types-in-c)
3. [Basic Usage](#basic-usage)
4. [Scenario 1: Protecting Shared Data](#scenario-1-protecting-shared-data)
5. [Scenario 2: Critical Sections](#scenario-2-critical-sections)
6. [Scenario 3: Thread-Safe Counter](#scenario-3-thread-safe-counter)
7. [Scenario 4: Singleton Pattern](#scenario-4-singleton-pattern)
8. [Scenario 5: Resource Pool](#scenario-5-resource-pool)
9. [Common Patterns and Best Practices](#common-patterns-and-best-practices)

---

## What is a Mutex?

A mutex provides:
- **Exclusive access**: Only one thread can hold the lock
- **Blocking**: Other threads wait until lock is released
- **Thread safety**: Prevents race conditions

### Mutex Operations

- **`lock()`**: Acquire lock (blocks if already locked)
- **`unlock()`**: Release lock
- **`try_lock()`**: Try to acquire (non-blocking)

---

## Mutex Types in C++

### 1. std::mutex

Basic mutex, non-recursive:

```cpp
#include <mutex>
using namespace std;

mutex mtx;
mtx.lock();
// Critical section
mtx.unlock();
```

### 2. std::recursive_mutex

Allows same thread to lock multiple times:

```cpp
recursive_mutex rmtx;
rmtx.lock();
rmtx.lock();  // OK - same thread
rmtx.unlock();
rmtx.unlock();
```

### 3. std::timed_mutex

Mutex with timeout support:

```cpp
timed_mutex tmtx;
if (tmtx.try_lock_for(chrono::seconds(1))) {
    // Got lock
    tmtx.unlock();
}
```

### 4. std::shared_mutex (C++17)

Allows shared (read) and exclusive (write) locks:

```cpp
shared_mutex smtx;
shared_lock<shared_mutex> read_lock(smtx);  // Multiple readers OK
unique_lock<shared_mutex> write_lock(smtx);  // Exclusive writer
```

---

## Basic Usage

### RAII Lock Guards

```cpp
#include <mutex>
using namespace std;

mutex mtx;

// GOOD: Automatic unlock
{
    lock_guard<mutex> lock(mtx);
    // Critical section
}  // Automatically unlocked

// BAD: Manual lock/unlock
mtx.lock();
// If exception occurs, lock never released!
mtx.unlock();
```

### Lock Types

- **`lock_guard`**: Simple RAII wrapper
- **`unique_lock`**: More flexible (can unlock early, supports condition variables)
- **`scoped_lock`** (C++17): Lock multiple mutexes

---

## Scenario 1: Protecting Shared Data

```cpp
#include <vector>
#include <thread>
#include <mutex>
using namespace std;

class ThreadSafeVector {
private:
    vector<int> data_;
    mutex mtx_;

public:
    void push(int value) {
        lock_guard<mutex> lock(mtx_);
        data_.push_back(value);
    }

    int get(size_t index) {
        lock_guard<mutex> lock(mtx_);
        return data_[index];
    }

    size_t size() {
        lock_guard<mutex> lock(mtx_);
        return data_.size();
    }
};
```

---

## Scenario 2: Critical Sections

```cpp
class BankAccount {
private:
    int balance_ = 0;
    mutex mtx_;

public:
    void deposit(int amount) {
        lock_guard<mutex> lock(mtx_);
        balance_ += amount;
    }

    bool withdraw(int amount) {
        lock_guard<mutex> lock(mtx_);
        if (balance_ >= amount) {
            balance_ -= amount;
            return true;
        }
        return false;
    }

    int getBalance() {
        lock_guard<mutex> lock(mtx_);
        return balance_;
    }
};
```

---

## Scenario 3: Thread-Safe Counter

```cpp
class ThreadSafeCounter {
private:
    int count_ = 0;
    mutex mtx_;

public:
    void increment() {
        lock_guard<mutex> lock(mtx_);
        ++count_;
    }

    void decrement() {
        lock_guard<mutex> lock(mtx_);
        --count_;
    }

    int get() {
        lock_guard<mutex> lock(mtx_);
        return count_;
    }
};
```

---

## Scenario 4: Singleton Pattern

```cpp
class Singleton {
private:
    static Singleton* instance_;
    static mutex mtx_;
    Singleton() {}

public:
    static Singleton* getInstance() {
        if (instance_ == nullptr) {
            lock_guard<mutex> lock(mtx_);
            if (instance_ == nullptr) {
                instance_ = new Singleton();
            }
        }
        return instance_;
    }
};

Singleton* Singleton::instance_ = nullptr;
mutex Singleton::mtx_;
```

---

## Scenario 5: Resource Pool

```cpp
template<typename T>
class ResourcePool {
private:
    vector<T> resources_;
    vector<bool> in_use_;
    mutex mtx_;

public:
    ResourcePool(size_t size) : resources_(size), in_use_(size, false) {}

    optional<size_t> acquire() {
        lock_guard<mutex> lock(mtx_);
        for (size_t i = 0; i < in_use_.size(); ++i) {
            if (!in_use_[i]) {
                in_use_[i] = true;
                return i;
            }
        }
        return nullopt;
    }

    void release(size_t index) {
        lock_guard<mutex> lock(mtx_);
        in_use_[index] = false;
    }
};
```

---

## Common Patterns and Best Practices

### 1. Always Use RAII

```cpp
// GOOD
lock_guard<mutex> lock(mtx);

// BAD
mtx.lock();
// ... if exception, never unlocked
mtx.unlock();
```

### 2. Lock Ordering

```cpp
// GOOD: Always lock in same order
lock(mtx1, mtx2);
lock_guard<mutex> l1(mtx1, adopt_lock);
lock_guard<mutex> l2(mtx2, adopt_lock);

// BAD: Different order causes deadlock
thread1: lock(mtx1), lock(mtx2)
thread2: lock(mtx2), lock(mtx1)  // Deadlock!
```

### 3. Minimize Lock Scope

```cpp
// GOOD: Small critical section
{
    lock_guard<mutex> lock(mtx);
    shared_data = value;
}
expensiveOperation();  // Outside lock

// BAD: Large critical section
lock_guard<mutex> lock(mtx);
shared_data = value;
expensiveOperation();  // Blocks other threads unnecessarily
```

### 4. Avoid Nested Locks

```cpp
// BAD: Potential deadlock
void func1() {
    lock_guard<mutex> l1(mtx1);
    func2();  // Also locks mtx1 - deadlock!
}

// GOOD: Use recursive_mutex if needed
recursive_mutex rmtx;
```

---

## Summary

Mutex is essential for thread-safe programming:

- **Protects shared data**: Prevents race conditions
- **Exclusive access**: Only one thread at a time
- **RAII wrappers**: Use lock_guard, unique_lock
- **Minimize scope**: Keep critical sections small
- **Lock ordering**: Prevent deadlocks

By following these patterns, you can safely share data between threads in C++.

