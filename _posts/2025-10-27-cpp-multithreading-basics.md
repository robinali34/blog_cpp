---
layout: post
title: "C++ Multithreading Basics: thread, future, mutex, condition_variable, atomic"
date: 2025-10-27 21:12:00 -0700
categories: cpp concurrency multithreading
permalink: /2025/10/27/cpp-multithreading-basics/
tags: [cpp, concurrency, multithreading, thread, future, mutex, condition_variable, atomic]
---

# C++ Multithreading Basics: thread, future, mutex, condition_variable, atomic

This guide shows how to use the standard C++ concurrency primitives safely and idiomatically with concise examples.

## std::thread — launching and joining

```cpp
#include <thread>
#include <vector>
#include <iostream>

void work(int id) {
    std::cout << "worker " << id << " says hi\n";
}

int main() {
    std::vector<std::thread> threads;
    for (int i = 0; i < 4; ++i) {
        threads.emplace_back(work, i);
    }
    for (auto &t : threads) {
        if (t.joinable()) t.join();
    }
}
```

## std::mutex + std::lock_guard — protect shared state

```cpp
#include <mutex>
#include <thread>
#include <vector>

int counter = 0;
std::mutex counterMutex;

void incrementMany(int times) {
    for (int i = 0; i < times; ++i) {
        std::lock_guard<std::mutex> lock(counterMutex);
        ++counter;
    }
}

int main() {
    std::thread a(incrementMany, 100000);
    std::thread b(incrementMany, 100000);
    a.join(); b.join();
    // counter == 200000
}
```

## std::unique_lock + std::condition_variable — waiting and signaling

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>

std::queue<int> q;
std::mutex qMutex;
std::condition_variable qCv;

void producer() {
    for (int i = 1; i <= 5; ++i) {
        {
            std::lock_guard<std::mutex> lock(qMutex);
            q.push(i);
        }
        qCv.notify_one();
    }
}

void consumer() {
    for (int i = 0; i < 5; ++i) {
        std::unique_lock<std::mutex> lock(qMutex);
        qCv.wait(lock, [] { return !q.empty(); });
        int v = q.front(); q.pop();
        lock.unlock();
        // process v
    }
}

int main() {
    std::thread p(producer);
    std::thread c(consumer);
    p.join(); c.join();
}
```

## std::future/std::async — task-based concurrency

```cpp
#include <future>
#include <numeric>
#include <vector>

int sumRange(const std::vector<int>& v, size_t l, size_t r) {
    return std::accumulate(v.begin() + l, v.begin() + r, 0);
}

int main() {
    std::vector<int> data(1'000'000, 1);
    auto f1 = std::async(std::launch::async, sumRange, std::cref(data), 0, data.size()/2);
    auto f2 = std::async(std::launch::async, sumRange, std::cref(data), data.size()/2, data.size());
    int total = f1.get() + f2.get();
}
```

## std::atomic — lock-free counters and flags

```cpp
#include <atomic>
#include <thread>

std::atomic<int> atomicCounter{0};

void addMany(int times) {
    for (int i = 0; i < times; ++i) {
        atomicCounter.fetch_add(1, std::memory_order_relaxed);
    }
}

int main() {
    std::thread a(addMany, 100000);
    std::thread b(addMany, 100000);
    a.join(); b.join();
    // atomicCounter == 200000
}
```

## Common patterns and tips

- Prefer high-level tasks (`std::async`) for simple parallel work; use `std::thread` for fine control.
- Use RAII: `std::lock_guard` and `std::unique_lock` to manage locks.
- Always join or detach threads; never leave a `std::thread` unjoined when destroying.
- For producer/consumer, combine `std::mutex` + `std::condition_variable` with a predicate.
- Use `std::atomic` for simple counters/flags; otherwise prefer mutexes for compound invariants.
- Choose memory orders carefully; `memory_order_relaxed` is fine for independent counters.

## Pitfalls

- Data races: any unsynchronized read/write to shared memory is UB.
- Deadlocks: keep lock scope minimal; maintain a consistent lock order.
- Spurious wakeups: always wait with a predicate.
- Exceptions: `std::async` propagates via `future::get()`. Threads require manual try/catch within the thread function.
