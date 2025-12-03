---
layout: post
title: "C++ Gate + Thread Pool + Callback Queue: Advanced Multi-Thread Pattern"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading gate thread-pool callback-queue
permalink: /2025/12/03/cpp-gate-thread-pool-callback-queue/
tags: [cpp, concurrency, multithreading, gate, thread-pool, callback-queue, synchronization, async-execution]
excerpt: "Learn how to combine gate control, thread pool, and callback queue for advanced multi-thread patterns. Guide to implementing controlled async execution with callbacks."
---

# C++ Gate + Thread Pool + Callback Queue: Advanced Multi-Thread Pattern

This pattern combines three powerful concepts: a gate (control mechanism), a thread pool (task execution), and a callback queue (result handling). This enables controlled asynchronous execution with result callbacks.

## Table of Contents

1. [Overview](#overview)
2. [Gate Implementation](#gate-implementation)
3. [Thread Pool Integration](#thread-pool-integration)
4. [Callback Queue](#callback-queue)
5. [Complete Implementation](#complete-implementation)
6. [Example 1: Basic Usage](#example-1-basic-usage)
7. [Example 2: Controlled Execution](#example-2-controlled-execution)
8. [Example 3: Async Operations with Callbacks](#example-3-async-operations-with-callbacks)
9. [Best Practices](#best-practices)

---

## Overview

### Components

1. **Gate**: Controls when tasks can be executed (enabled/disabled)
2. **Thread Pool**: Executes tasks asynchronously
3. **Callback Queue**: Queues callbacks to be executed after task completion

### Use Cases

- **Rate limiting**: Control execution rate
- **Resource management**: Enable/disable based on resource availability
- **State-dependent execution**: Only execute when system is ready
- **Async operations**: Execute tasks and handle results via callbacks

---

## Gate Implementation

```cpp
#include <mutex>
#include <condition_variable>
#include <atomic>
using namespace std;

class Gate {
private:
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> open_{true};

public:
    void open() {
        {
            lock_guard<mutex> lock(mtx_);
            open_ = true;
        }
        cv_.notify_all();
    }

    void close() {
        lock_guard<mutex> lock(mtx_);
        open_ = false;
    }

    void waitUntilOpen() {
        unique_lock<mutex> lock(mtx_);
        cv_.wait(lock, [this]() { return open_.load(); });
    }

    bool isOpen() const {
        return open_.load();
    }
};
```

---

## Thread Pool Integration

```cpp
#include <thread>
#include <queue>
#include <functional>
#include <vector>
using namespace std;

class ThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex queue_mutex_;
    condition_variable condition_;
    atomic<bool> stop_{false};

public:
    explicit ThreadPool(size_t num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(queue_mutex_);
                        condition_.wait(lock, [this]() {
                            return stop_ || !tasks_.empty();
                        });
                        
                        if (stop_ && tasks_.empty()) {
                            return;
                        }
                        
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
            lock_guard<mutex> lock(queue_mutex_);
            if (stop_) return;
            tasks_.emplace(forward<F>(f));
        }
        condition_.notify_one();
    }

    ~ThreadPool() {
        {
            lock_guard<mutex> lock(queue_mutex_);
            stop_ = true;
        }
        condition_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};
```

---

## Callback Queue

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
using namespace std;

template<typename Result>
class CallbackQueue {
private:
    queue<function<void(Result)>> callbacks_;
    queue<Result> results_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> stop_{false};
    thread callback_thread_;

public:
    CallbackQueue() : callback_thread_([this]() {
        while (true) {
            function<void(Result)> callback;
            Result result;
            {
                unique_lock<mutex> lock(mtx_);
                cv_.wait(lock, [this]() {
                    return stop_ || (!callbacks_.empty() && !results_.empty());
                });
                
                if (stop_ && (callbacks_.empty() || results_.empty())) {
                    return;
                }
                
                callback = callbacks_.front();
                callbacks_.pop();
                result = results_.front();
                results_.pop();
            }
            callback(result);
        }
    }) {}

    void enqueueCallback(function<void(Result)> callback, Result result) {
        {
            lock_guard<mutex> lock(mtx_);
            callbacks_.push(callback);
            results_.push(result);
        }
        cv_.notify_one();
    }

    ~CallbackQueue() {
        {
            lock_guard<mutex> lock(mtx_);
            stop_ = true;
        }
        cv_.notify_one();
        callback_thread_.join();
    }
};
```

---

## Complete Implementation

```cpp
#include <iostream>
#include <future>
#include <atomic>
using namespace std;

template<typename Result>
class GatedThreadPoolWithCallbacks {
private:
    Gate gate_;
    ThreadPool thread_pool_;
    CallbackQueue<Result> callback_queue_;
    atomic<int> pending_tasks_{0};

public:
    GatedThreadPoolWithCallbacks(size_t num_threads) 
        : thread_pool_(num_threads) {}

    template<class TaskFunc, class CallbackFunc>
    void executeAsync(TaskFunc&& task, CallbackFunc&& callback) {
        // Wait for gate to be open
        gate_.waitUntilOpen();
        
        pending_tasks_++;
        
        // Execute task in thread pool
        thread_pool_.enqueue([this, task, callback]() {
            try {
                Result result = task();
                pending_tasks_--;
                
                // Queue callback
                callback_queue_.enqueueCallback(callback, result);
            } catch (...) {
                pending_tasks_--;
                // Handle error callback if needed
            }
        });
    }

    void openGate() {
        gate_.open();
    }

    void closeGate() {
        gate_.close();
    }

    bool isGateOpen() const {
        return gate_.isOpen();
    }

    int getPendingTasks() const {
        return pending_tasks_.load();
    }
};

// Usage example
void example() {
    GatedThreadPoolWithCallbacks<int> system(4);
    
    // Close gate initially
    system.closeGate();
    
    // Submit tasks (will wait for gate to open)
    for (int i = 0; i < 10; ++i) {
        system.executeAsync(
            [i]() -> int {
                cout << "Task " << i << " executing" << endl;
                this_thread::sleep_for(chrono::milliseconds(100));
                return i * i;
            },
            [i](int result) {
                cout << "Callback for task " << i << ": result = " << result << endl;
            }
        );
    }
    
    // Open gate - all tasks can now execute
    system.openGate();
    
    this_thread::sleep_for(chrono::seconds(2));
}
```

---

## Example 1: Basic Usage

```cpp
void basicUsage() {
    GatedThreadPoolWithCallbacks<string> system(4);
    
    system.executeAsync(
        []() -> string {
            return "Hello from async task";
        },
        [](const string& result) {
            cout << "Received: " << result << endl;
        }
    );
    
    this_thread::sleep_for(chrono::milliseconds(500));
}
```

---

## Example 2: Controlled Execution

```cpp
void controlledExecution() {
    GatedThreadPoolWithCallbacks<int> system(4);
    
    // Close gate - tasks will queue
    system.closeGate();
    
    // Submit multiple tasks
    for (int i = 0; i < 5; ++i) {
        system.executeAsync(
            [i]() -> int {
                cout << "Task " << i << " running" << endl;
                return i;
            },
            [i](int result) {
                cout << "Task " << i << " completed: " << result << endl;
            }
        );
    }
    
    cout << "Tasks queued, waiting..." << endl;
    this_thread::sleep_for(chrono::milliseconds(500));
    
    // Open gate - tasks execute
    cout << "Opening gate..." << endl;
    system.openGate();
    
    this_thread::sleep_for(chrono::seconds(1));
}
```

---

## Example 3: Async Operations with Callbacks

```cpp
void asyncOperations() {
    GatedThreadPoolWithCallbacks<vector<int>> system(4);
    
    system.executeAsync(
        []() -> vector<int> {
            vector<int> data;
            for (int i = 0; i < 10; ++i) {
                data.push_back(i * i);
            }
            return data;
        },
        [](const vector<int>& result) {
            cout << "Processed " << result.size() << " items" << endl;
            for (int val : result) {
                cout << val << " ";
            }
            cout << endl;
        }
    );
    
    this_thread::sleep_for(chrono::milliseconds(500));
}
```

---

## Best Practices

1. **Gate Control**: Use gates to control when execution should happen
2. **Error Handling**: Handle exceptions in tasks and callbacks
3. **Resource Management**: Monitor pending tasks to prevent overload
4. **Shutdown**: Properly shutdown all components
5. **Thread Safety**: Ensure all operations are thread-safe

---

## Summary

The Gate + Thread Pool + Callback Queue pattern provides:

- **Controlled execution**: Gate controls when tasks run
- **Efficient processing**: Thread pool executes tasks
- **Result handling**: Callback queue processes results
- **Flexibility**: Can enable/disable execution dynamically

This pattern is useful for systems that need controlled async execution with result callbacks.

