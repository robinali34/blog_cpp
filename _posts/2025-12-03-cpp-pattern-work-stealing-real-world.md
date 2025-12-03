---
layout: post
title: "C++ Work Stealing Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns work-stealing
permalink: /2025/12/03/cpp-pattern-work-stealing-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, work-stealing, load-balancing, real-world]
excerpt: "Learn the Work Stealing pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Work Stealing Pattern: Real-World Engineering Guide

## Problem Solved

Balance load across worker threads dynamically, minimizing contention and maximizing CPU utilization.

## How It Works

- Each worker has its own queue
- Idle workers "steal" tasks from others' queues
- Reduces contention and improves load balancing

## STL Usage

```cpp
#include <deque>
#include <mutex>
#include <thread>
#include <vector>
#include <functional>
#include <atomic>
#include <iostream>
using namespace std;

class WorkStealingQueue {
private:
    deque<function<void()>> tasks_;
    mutable mutex mtx_;

public:
    void push(function<void()> task) {
        lock_guard<mutex> lock(mtx_);
        tasks_.push_back(move(task));
    }

    bool tryPop(function<void()>& task) {
        lock_guard<mutex> lock(mtx_);
        if (tasks_.empty()) return false;
        task = move(tasks_.back());
        tasks_.pop_back();
        return true;
    }

    bool trySteal(function<void()>& task) {
        lock_guard<mutex> lock(mtx_);
        if (tasks_.empty()) return false;
        task = move(tasks_.front());
        tasks_.pop_front();
        return true;
    }
};

class WorkStealingThreadPool {
private:
    vector<WorkStealingQueue> queues_;
    vector<thread> workers_;
    atomic<bool> stop_{false};
    size_t num_threads_;

public:
    explicit WorkStealingThreadPool(size_t num_threads) 
        : queues_(num_threads), num_threads_(num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this, i]() {
                while (!stop_) {
                    function<void()> task;
                    
                    // Try own queue first
                    if (queues_[i].tryPop(task)) {
                        task();
                        continue;
                    }
                    
                    // Steal from other queues
                    bool stolen = false;
                    for (size_t j = 0; j < num_threads_; ++j) {
                        if (i != j && queues_[j].trySteal(task)) {
                            task();
                            stolen = true;
                            break;
                        }
                    }
                    
                    if (!stolen) {
                        this_thread::yield();
                    }
                }
            });
        }
    }

    void enqueue(function<void()> task, size_t thread_id = 0) {
        queues_[thread_id % num_threads_].push(task);
    }

    ~WorkStealingThreadPool() {
        stop_ = true;
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};
```

## Example

```cpp
void workStealingExample() {
    WorkStealingThreadPool pool(4);
    
    // Enqueue tasks (some threads may be busier)
    for (int i = 0; i < 100; ++i) {
        pool.enqueue([i]() {
            cout << "Task " << i << " executed" << endl;
        }, i % 2);  // Most tasks go to threads 0 and 1
    }
    
    this_thread::sleep_for(chrono::seconds(2));
}
```

## Use Cases

- **CPU-bound tasks**: Maximize CPU utilization
- **Unbalanced workloads**: Dynamic load balancing
- **Parallel algorithms**: Divide and conquer
- **Task schedulers**: High-performance task execution

## Key Takeaways

- Excellent load balancing
- Minimizes contention
- High CPU utilization
- Used in high-performance libraries (TBB, ForkJoinPool)

## Things to Be Careful About

- **Stealing overhead**: Stealing has synchronization cost
- **Cache locality**: Stealing may hurt cache performance
- **Queue design**: Need efficient steal operation
- **Fairness**: May need to ensure fair stealing

## Summary

Work stealing provides excellent load balancing for parallel workloads, maximizing CPU utilization and minimizing contention.

