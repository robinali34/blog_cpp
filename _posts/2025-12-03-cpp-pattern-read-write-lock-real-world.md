---
layout: post
title: "C++ Read-Write Lock Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns read-write-lock
permalink: /2025/12/03/cpp-pattern-read-write-lock-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, read-write-lock, shared-mutex, real-world]
excerpt: "Learn the Read-Write Lock pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Read-Write Lock Pattern: Real-World Engineering Guide

## Problem Solved

Optimize concurrent access to shared data that is read frequently but rarely written.

## How It Works

- Multiple readers allowed at the same time
- Writers must be exclusive (no readers, no other writers)
- Uses shared locks for reads, exclusive locks for writes

## STL Usage

```cpp
#include <shared_mutex>
#include <map>
#include <string>
#include <vector>
#include <thread>
using namespace std;

class ThreadSafeMap {
private:
    map<string, int> data_;
    shared_mutex rw_mutex_;

public:
    // Read operation - shared lock
    int get(const string& key) {
        shared_lock<shared_mutex> lock(rw_mutex_);
        auto it = data_.find(key);
        return (it != data_.end()) ? it->second : -1;
    }

    // Write operation - exclusive lock
    void set(const string& key, int value) {
        unique_lock<shared_mutex> lock(rw_mutex_);
        data_[key] = value;
    }

    // Read operation
    bool contains(const string& key) {
        shared_lock<shared_mutex> lock(rw_mutex_);
        return data_.find(key) != data_.end();
    }
};
```

## Example

```cpp
#include <iostream>
#include <chrono>
using namespace std;

void readWriteLockExample() {
    ThreadSafeMap cache;
    
    // Multiple readers
    vector<thread> readers;
    for (int i = 0; i < 10; ++i) {
        readers.emplace_back([&cache, i]() {
            for (int j = 0; j < 100; ++j) {
                cache.get("key" + to_string(j % 10));
            }
        });
    }
    
    // Single writer
    thread writer([&cache]() {
        for (int i = 0; i < 10; ++i) {
            cache.set("key" + to_string(i), i);
            this_thread::sleep_for(chrono::milliseconds(10));
        }
    });
    
    for (auto& t : readers) t.join();
    writer.join();
}
```

## Use Cases

- **Caches**: Frequently read, occasionally updated
- **Configuration stores**: Read-heavy, rare updates
- **File metadata**: Many readers, few writers
- **Lookup tables**: Read operations dominate

## Key Takeaways

- Significant performance improvement for read-heavy workloads
- Allows concurrent reads
- Exclusive writes ensure consistency
- C++17 `std::shared_mutex` support

## Things to Be Careful About

- **Writer starvation**: Readers can starve writers
- **Upgrade deadlock**: Can't upgrade read lock to write lock
- **Fairness**: May need fair locks for balanced access
- **Overhead**: More complex than simple mutex

## Summary

Read-Write locks optimize concurrent access for read-heavy workloads, providing significant performance improvements.

