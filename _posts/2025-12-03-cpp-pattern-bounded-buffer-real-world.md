---
layout: post
title: "C++ Bounded Buffer Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns bounded-buffer
permalink: /2025/12/03/cpp-pattern-bounded-buffer-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, bounded-buffer, backpressure, real-world]
excerpt: "Learn the Bounded Buffer pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Bounded Buffer Pattern: Real-World Engineering Guide

## Problem Solved

Control resource usage and provide backpressure when producers are faster than consumers.

## How It Works

- Queue with maximum capacity
- Producers block when full
- Consumers unblock producers when space available
- Prevents unbounded memory growth

## STL Usage

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <iostream>
using namespace std;

template<typename T>
class BoundedBuffer {
private:
    queue<T> buffer_;
    size_t capacity_;
    mutex mtx_;
    condition_variable not_full_;
    condition_variable not_empty_;

public:
    explicit BoundedBuffer(size_t capacity) : capacity_(capacity) {}

    void put(const T& item) {
        unique_lock<mutex> lock(mtx_);
        not_full_.wait(lock, [this]() { return buffer_.size() < capacity_; });
        buffer_.push(item);
        not_empty_.notify_one();
    }

    T get() {
        unique_lock<mutex> lock(mtx_);
        not_empty_.wait(lock, [this]() { return !buffer_.empty(); });
        T item = buffer_.front();
        buffer_.pop();
        not_full_.notify_one();
        return item;
    }

    size_t size() const {
        lock_guard<mutex> lock(mtx_);
        return buffer_.size();
    }
};
```

## Example

```cpp
#include <chrono>
using namespace std;

void boundedBufferExample() {
    BoundedBuffer<int> buffer(10);  // Capacity 10
    atomic<bool> done{false};

    // Fast producer
    thread producer([&]() {
        for (int i = 0; i < 100; ++i) {
            buffer.put(i);  // Blocks when full
            cout << "Produced: " << i << endl;
        }
        done = true;
    });

    // Slow consumer
    thread consumer([&]() {
        while (!done || buffer.size() > 0) {
            int item = buffer.get();
            cout << "Consumed: " << item << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    });

    producer.join();
    consumer.join();
}
```

## Use Cases

- **Rate limiting**: Control processing rate
- **Backpressure**: Prevent overwhelming consumers
- **Resource control**: Limit memory usage
- **Flow control**: Balance producer/consumer rates

## Key Takeaways

- Prevents unbounded growth
- Provides natural backpressure
- Controls resource usage
- Essential for production systems

## Things to Be Careful About

- **Deadlock**: Producers waiting on full buffer
- **Capacity sizing**: Too small causes blocking, too large wastes memory
- **Shutdown**: Ensure all items processed
- **Timeout**: Consider timeout for put/get operations

## Summary

Bounded buffers provide essential flow control and resource management, preventing memory issues and providing backpressure.

