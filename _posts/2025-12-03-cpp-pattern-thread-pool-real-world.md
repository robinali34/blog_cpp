---
layout: post
title: "C++ Thread Pool Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns thread-pool
permalink: /2025/12/03/cpp-pattern-thread-pool-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, thread-pool, real-world]
excerpt: "Learn the Thread Pool pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Thread Pool Pattern: Real-World Engineering Guide

## Problem Solved

Avoid the cost of creating/destroying threads for short tasks. Reuse threads to handle multiple tasks efficiently.

## How It Works

- A fixed or dynamic pool of worker threads waits for tasks
- Tasks are dispatched to the next available worker
- Workers process tasks and return to pool for next task

## STL Usage

```cpp
#include <thread>
#include <queue>
#include <vector>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <atomic>
using namespace std;

class ThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> stop_{false};

public:
    explicit ThreadPool(size_t num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(mtx_);
                        cv_.wait(lock, [this]() {
                            return stop_ || !tasks_.empty();
                        });
                        
                        if (stop_ && tasks_.empty()) return;
                        
                        task = tasks_.front();
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
    }

    template<class F>
    void enqueue(F&& f) {
        {
            lock_guard<mutex> lock(mtx_);
            tasks_.emplace(forward<F>(f));
        }
        cv_.notify_one();
    }

    ~ThreadPool() {
        {
            lock_guard<mutex> lock(mtx_);
            stop_ = true;
        }
        cv_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};
```

## Example

```cpp
#include <iostream>
#include <chrono>
using namespace std;

void threadPoolExample() {
    ThreadPool pool(4);
    
    for (int i = 0; i < 100; ++i) {
        pool.enqueue([i]() {
            cout << "Task " << i << " executed" << endl;
        });
    }
    
    this_thread::sleep_for(chrono::seconds(2));
}
```

## Use Cases

- **HTTP servers**: Handle requests with worker threads
- **Async frameworks**: Execute async operations
- **Task executors**: Process background tasks
- **Parallel algorithms**: Distribute computation

## Key Takeaways

- Reuses threads, avoiding creation overhead
- Predictable resource usage
- Scales well with task count
- Common in production systems

## Things to Be Careful About

- **Thread count**: Too many threads cause context switching overhead
- **Task exceptions**: Handle exceptions to prevent worker death
- **Shutdown**: Ensure all tasks complete before destruction
- **Queue overflow**: Bound queue size to prevent memory issues

## Summary

Thread pools are essential for efficient task execution, providing predictable performance and resource usage.

