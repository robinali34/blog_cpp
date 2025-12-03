---
layout: post
title: "C++ Producer-Consumer Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns producer-consumer
permalink: /2025/12/03/cpp-pattern-producer-consumer-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, producer-consumer, real-world]
excerpt: "Learn the Producer-Consumer pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Producer-Consumer Pattern: Real-World Engineering Guide

## Problem Solved

Decouple work generation from work processing. Allows producers to generate work at their own pace while consumers process it independently.

## How It Works

- **Producers** push tasks into a thread-safe queue
- **Consumers** take tasks from the queue and process them
- Uses blocking queues and condition variables for synchronization

## STL Usage

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
using namespace std;

template<typename T>
class ProducerConsumerQueue {
private:
    queue<T> queue_;
    mutex mtx_;
    condition_variable not_empty_;
    condition_variable not_full_;
    size_t max_size_;

public:
    explicit ProducerConsumerQueue(size_t max_size = 1000) 
        : max_size_(max_size) {}

    void push(const T& item) {
        unique_lock<mutex> lock(mtx_);
        not_full_.wait(lock, [this]() { return queue_.size() < max_size_; });
        queue_.push(item);
        not_empty_.notify_one();
    }

    T pop() {
        unique_lock<mutex> lock(mtx_);
        not_empty_.wait(lock, [this]() { return !queue_.empty(); });
        T item = queue_.front();
        queue_.pop();
        not_full_.notify_one();
        return item;
    }
};
```

## Example

```cpp
#include <atomic>
#include <iostream>
using namespace std;

void producerConsumerExample() {
    ProducerConsumerQueue<int> queue(100);
    atomic<bool> done{false};

    // Producer
    thread producer([&]() {
        for (int i = 0; i < 1000; ++i) {
            queue.push(i);
        }
        done = true;
    });

    // Consumer
    thread consumer([&]() {
        while (!done || !queue.empty()) {
            int item = queue.pop();
            processItem(item);
        }
    });

    producer.join();
    consumer.join();
}
```

## Use Cases

- **Logging systems**: Log producers write to queue, logger thread processes
- **Task queues**: Task generators enqueue, worker threads dequeue
- **Pipeline stages**: Each stage is producer for next, consumer of previous
- **Event processing**: Event generators → event processors

## Key Takeaways

- Decouples production and consumption rates
- Handles load spikes by buffering
- Supports multiple producers/consumers
- Essential for async processing

## Things to Be Careful About

- **Queue size**: Unbounded queues can cause memory issues
- **Shutdown**: Ensure all items processed before shutdown
- **Deadlock**: Multiple queues can cause circular waits
- **Lost items**: Handle exceptions in consumers carefully

## Summary

Producer-Consumer is the foundation of many concurrent systems, providing decoupling and buffering between work generation and processing.

