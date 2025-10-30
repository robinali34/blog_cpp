---
layout: post
title: "Mutex Patterns: All Common Cases and Best Practices"
date: 2025-10-29 00:00:00 -0700
categories: cpp concurrency mutex synchronization
permalink: /2025/10/29/cpp-mutex-patterns-and-cases/
tags: [cpp, concurrency, mutex, lock_guard, unique_lock, scoped_lock, timed_mutex, recursive_mutex, shared_mutex, condition_variable, call_once]
---

# C++ Mutex Patterns: All Common Cases and Best Practices

A practical guide to using C++ standard mutex primitives correctly and safely, with concise, runnable snippets.

## 1) Basic mutual exclusion: std::mutex + std::lock_guard

```cpp
#include <mutex>

std::mutex m;
int sharedValue = 0;

void safeIncrement() {
    std::lock_guard<std::mutex> lock(m); // RAII: unlocks when leaving scope
    ++sharedValue;
}
```

## 2) Flexible locking: std::unique_lock

- Allows explicit lock/unlock
- Works with `std::condition_variable`
- Supports `defer_lock`, `try_to_lock`, `adopt_lock`

```cpp
#include <mutex>

std::mutex m;

void work() {
    std::unique_lock<std::mutex> lock(m, std::defer_lock); // not locked yet
    // ... do non-critical work ...
    lock.lock();
    // critical section
    lock.unlock();
    // do other work without holding the lock
}
```

## 3) Try-lock semantics

```cpp
#include <mutex>
#include <chrono>

std::mutex m;

bool tryWork() {
    std::unique_lock<std::mutex> lock(m, std::try_to_lock);
    if (!lock.owns_lock()) {
        // lock not acquired, skip or backoff
        return false;
    }
    // critical section
    return true;
}
```

## 4) Lock multiple mutexes without deadlock: std::scoped_lock and std::lock

```cpp
#include <mutex>

std::mutex a, b;

void swapProtected(int& x, int& y) {
    std::scoped_lock lock(a, b); // locks both without deadlock
    std::swap(x, y);
}

void alsoSafe(int& x, int& y) {
    std::unique_lock<std::mutex> la(a, std::defer_lock);
    std::unique_lock<std::mutex> lb(b, std::defer_lock);
    std::lock(la, lb); // deadlock-free lock ordering
    std::swap(x, y);
}
```

## 5) Timed locking: std::timed_mutex, std::recursive_timed_mutex

```cpp
#include <mutex>
#include <chrono>

std::timed_mutex tm;

bool tryTimed() {
    if (tm.try_lock_for(std::chrono::milliseconds(10))) {
        // critical section
        tm.unlock();
        return true;
    }
    return false;
}
```

## 6) Recursive locking (use sparingly): std::recursive_mutex

```cpp
#include <mutex>

std::recursive_mutex rm;

void dfs(int depth) {
    std::lock_guard<std::recursive_mutex> lock(rm);
    if (depth == 0) return;
    dfs(depth - 1); // same thread re-locks safely
}
```

Note: Prefer restructuring to avoid recursion requiring the same mutex. Recursive mutexes can hide design issues.

## 7) Read-Write locking: std::shared_mutex (C++17)

- Multiple readers, single writer

```cpp
#include <shared_mutex>
#include <string>

std::shared_mutex rw;
std::string data;

std::string readData() {
    std::shared_lock<std::shared_mutex> lock(rw); // shared/read lock
    return data;
}

void writeData(std::string value) {
    std::unique_lock<std::shared_mutex> lock(rw); // exclusive/write lock
    data = std::move(value);
}
```

## 8) Condition variables: waiting and signaling

- Always wait with a predicate
- Use `std::unique_lock`

```cpp
#include <condition_variable>
#include <queue>
#include <mutex>

std::mutex qMutex;
std::condition_variable cv;
std::queue<int> q;

void producer() {
    for (int i = 0; i < 10; ++i) {
        {
            std::lock_guard<std::mutex> lock(qMutex);
            q.push(i);
        }
        cv.notify_one(); // notify after releasing lock
    }
}

void consumer() {
    for (int i = 0; i < 10; ++i) {
        std::unique_lock<std::mutex> lock(qMutex);
        cv.wait(lock, [] { return !q.empty(); }); // predicate guards against spurious wakeups
        int v = q.front(); q.pop();
        lock.unlock();
        // process v
    }
}
```

## 9) call_once + once_flag: thread-safe one-time init

```cpp
#include <mutex>
#include <memory>

std::once_flag initFlag;
std::unique_ptr<int> global;

void init() {
    global = std::make_unique<int>(42);
}

int getValue() {
    std::call_once(initFlag, init);
    return *global;
}
```

## 10) Adopt/defer patterns

```cpp
#include <mutex>

std::mutex m;

void adoptExample() {
    m.lock();
    std::lock_guard<std::mutex> guard(m, std::adopt_lock); // takes ownership of an already-locked mutex
    // critical section
}

void deferExample() {
    std::unique_lock<std::mutex> lock(m, std::defer_lock);
    // do some work...
    lock.lock();
    // critical section
}
```

## 11) Try-lock loops with backoff

```cpp
#include <mutex>
#include <thread>
#include <chrono>

std::mutex m;

void tryLoop() {
    for (int attempt = 0; attempt < 5; ++attempt) {
        std::unique_lock<std::mutex> lock(m, std::try_to_lock);
        if (lock.owns_lock()) {
            // critical section
            return;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(1 << attempt)); // exponential backoff
    }
    // fallback path
}
```

## 12) Guarding compound invariants (avoid atomics alone)

```cpp
#include <mutex>
#include <vector>

std::mutex m;
std::vector<int> buf;

void pushTwo(int a, int b) {
    std::lock_guard<std::mutex> lock(m);
    buf.push_back(a);
    buf.push_back(b); // both updates protected together
}
```

## 13) Common pitfalls checklist

- Do not access shared state without holding the correct lock (UB: data race)
- Keep critical sections minimal; avoid long blocking I/O while locked
- Maintain a consistent lock order when multiple mutexes are involved (or use `std::scoped_lock`)
- Always use a predicate with `condition_variable::wait`
- Prefer `shared_mutex` only when reads vastly outnumber writes
- Avoid `recursive_mutex` unless strictly necessary
- Ensure every `std::thread` is joined or detached before destruction

## 14) Choosing the right primitive

- Single-owner critical sections: `std::mutex` + `lock_guard`
- Needs flexible lock/unlock or CV: `std::unique_lock`
- Multiple mutexes: `std::scoped_lock` or `std::lock`
- Timed attempts: `std::timed_mutex`
- Many readers/few writers: `std::shared_mutex`
- One-time init: `std::call_once`

---

These patterns cover the majority of real-world locking scenarios. Combine them with careful design to keep critical sections small, avoid deadlocks, and preserve program invariants.
