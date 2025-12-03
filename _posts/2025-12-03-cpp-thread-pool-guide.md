---
layout: post
title: "C++ Thread Pool: Multi-Thread Task Execution Guide and Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading thread-pool task-execution
permalink: /2025/12/03/cpp-thread-pool-guide/
tags: [cpp, concurrency, multithreading, thread-pool, task-queue, worker-threads, async-execution]
excerpt: "Learn how to implement and use thread pools in C++ for efficient parallel task execution. Guide to worker threads, task queues, and managing concurrent workloads."
---

# C++ Thread Pool: Multi-Thread Task Execution Guide and Examples

A thread pool is a collection of worker threads that execute tasks from a queue. Instead of creating and destroying threads for each task, thread pools reuse threads, reducing overhead and improving performance for concurrent workloads.

## Table of Contents

1. [What is a Thread Pool?](#what-is-a-thread-pool)
2. [Why Use Thread Pools?](#why-use-thread-pools)
3. [Basic Thread Pool Implementation](#basic-thread-pool-implementation)
4. [Example 1: Simple Thread Pool](#example-1-simple-thread-pool)
5. [Example 2: Thread Pool with Futures](#example-2-thread-pool-with-futures)
6. [Example 3: Priority Thread Pool](#example-3-priority-thread-pool)
7. [Example 4: Dynamic Thread Pool](#example-4-dynamic-thread-pool)
8. [Example 5: Thread Pool with Callbacks](#example-5-thread-pool-with-callbacks)
9. [Best Practices and Common Pitfalls](#best-practices-and-common-pitfalls)

---

## What is a Thread Pool?

A thread pool consists of:

- **Worker Threads**: Pre-created threads that wait for tasks
- **Task Queue**: Queue of tasks waiting to be executed
- **Dispatcher**: Adds tasks to the queue
- **Scheduler**: Assigns tasks to worker threads

### Benefits

- **Reduced overhead**: Reuse threads instead of creating/destroying
- **Better resource management**: Control number of concurrent threads
- **Improved performance**: Avoid thread creation overhead
- **Load balancing**: Distribute work across available threads

---

## Why Use Thread Pools?

```cpp
// BAD: Creating thread for each task
for (int i = 0; i < 1000; ++i) {
    thread([i]() {
        processTask(i);
    }).detach();  // Creates 1000 threads!
}

// GOOD: Using thread pool
ThreadPool pool(4);  // Only 4 threads
for (int i = 0; i < 1000; ++i) {
    pool.enqueue([i]() {
        processTask(i);
    });
}
```

---

## Basic Thread Pool Implementation

```cpp
#include <thread>
#include <queue>
#include <vector>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <atomic>
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
            if (stop_) {
                return;
            }
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

## Example 1: Simple Thread Pool

Basic usage example:

```cpp
#include <iostream>
#include <chrono>
using namespace std;

void simpleThreadPoolExample() {
    ThreadPool pool(4);
    
    for (int i = 0; i < 10; ++i) {
        pool.enqueue([i]() {
            cout << "Task " << i << " executed by thread " 
                 << this_thread::get_id() << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        });
    }
    
    this_thread::sleep_for(chrono::seconds(2));
    cout << "All tasks submitted" << endl;
}
```

---

## Example 2: Thread Pool with Futures

Return results from tasks:

```cpp
#include <future>
#include <type_traits>
using namespace std;

template<typename T>
class FutureThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex queue_mutex_;
    condition_variable condition_;
    atomic<bool> stop_{false};

public:
    explicit FutureThreadPool(size_t num_threads) {
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

    template<class F, class... Args>
    auto enqueue(F&& f, Args&&... args) -> future<typename result_of<F(Args...)>::type> {
        using return_type = typename result_of<F(Args...)>::type;
        
        auto task = make_shared<packaged_task<return_type()>>(
            bind(forward<F>(f), forward<Args>(args)...)
        );
        
        future<return_type> result = task->get_future();
        {
            lock_guard<mutex> lock(queue_mutex_);
            if (stop_) {
                throw runtime_error("ThreadPool stopped");
            }
            tasks_.emplace([task]() { (*task)(); });
        }
        condition_.notify_one();
        return result;
    }

    ~FutureThreadPool() {
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

void futureThreadPoolExample() {
    FutureThreadPool<int> pool(4);
    vector<future<int>> results;
    
    for (int i = 0; i < 10; ++i) {
        results.push_back(pool.enqueue([i]() {
            return i * i;
        }));
    }
    
    for (auto& result : results) {
        cout << "Result: " << result.get() << endl;
    }
}
```

---

## Example 3: Priority Thread Pool

Thread pool with task priorities:

```cpp
#include <queue>
#include <functional>
using namespace std;

struct Task {
    function<void()> func;
    int priority;
    
    bool operator<(const Task& other) const {
        return priority < other.priority;  // Higher priority first
    }
};

class PriorityThreadPool {
private:
    vector<thread> workers_;
    priority_queue<Task> tasks_;
    mutex queue_mutex_;
    condition_variable condition_;
    atomic<bool> stop_{false};

public:
    explicit PriorityThreadPool(size_t num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    Task task;
                    {
                        unique_lock<mutex> lock(queue_mutex_);
                        condition_.wait(lock, [this]() {
                            return stop_ || !tasks_.empty();
                        });
                        
                        if (stop_ && tasks_.empty()) {
                            return;
                        }
                        
                        task = tasks_.top();
                        tasks_.pop();
                    }
                    task.func();
                }
            });
        }
    }

    void enqueue(function<void()> func, int priority) {
        {
            lock_guard<mutex> lock(queue_mutex_);
            tasks_.push({func, priority});
        }
        condition_.notify_one();
    }

    ~PriorityThreadPool() {
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

## Example 4: Dynamic Thread Pool

Thread pool that adjusts number of workers:

```cpp
class DynamicThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex queue_mutex_;
    condition_variable condition_;
    atomic<bool> stop_{false};
    atomic<size_t> active_workers_{0};
    size_t min_threads_;
    size_t max_threads_;

public:
    DynamicThreadPool(size_t min_threads, size_t max_threads)
        : min_threads_(min_threads), max_threads_(max_threads) {
        for (size_t i = 0; i < min_threads_; ++i) {
            addWorker();
        }
    }

    void addWorker() {
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
                    
                    active_workers_++;
                    task = tasks_.front();
                    tasks_.pop();
                }
                
                task();
                active_workers_--;
            }
        });
    }

    template<class F>
    void enqueue(F&& f) {
        {
            lock_guard<mutex> lock(queue_mutex_);
            tasks_.emplace(forward<F>(f));
            
            // Add worker if needed
            if (workers_.size() < max_threads_ && 
                active_workers_ == workers_.size() && 
                tasks_.size() > workers_.size()) {
                addWorker();
            }
        }
        condition_.notify_one();
    }

    ~DynamicThreadPool() {
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

## Example 5: Thread Pool with Callbacks

Thread pool that supports completion callbacks:

```cpp
template<typename Result>
class CallbackThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex queue_mutex_;
    condition_variable condition_;
    atomic<bool> stop_{false};

public:
    explicit CallbackThreadPool(size_t num_threads) {
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

    template<class F, class Callback>
    void enqueue(F&& task_func, Callback&& callback) {
        {
            lock_guard<mutex> lock(queue_mutex_);
            tasks_.emplace([task_func, callback]() {
                Result result = task_func();
                callback(result);
            });
        }
        condition_.notify_one();
    }

    ~CallbackThreadPool() {
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

## Best Practices and Common Pitfalls

### 1. Proper Shutdown

```cpp
// GOOD: Wait for all tasks to complete
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
```

### 2. Handle Exceptions in Tasks

```cpp
// GOOD: Catch exceptions in worker threads
workers_.emplace_back([this]() {
    while (true) {
        function<void()> task;
        // ... get task ...
        try {
            task();
        } catch (const exception& e) {
            // Log error, don't crash thread
            cerr << "Task error: " << e.what() << endl;
        }
    }
});
```

### 3. Optimal Thread Count

```cpp
// Use hardware concurrency
size_t num_threads = thread::hardware_concurrency();
ThreadPool pool(num_threads);
```

### 4. Avoid Task Queue Overflow

```cpp
// GOOD: Limit queue size
class BoundedThreadPool {
    // ... add max_queue_size_ ...
    void enqueue(F&& f) {
        unique_lock<mutex> lock(queue_mutex_);
        not_full_.wait(lock, [this]() {
            return tasks_.size() < max_queue_size_;
        });
        // ...
    }
};
```

### Common Mistakes

1. **Not joining threads**: Causes program termination issues
2. **Deadlock in tasks**: Tasks waiting on each other
3. **Too many threads**: Context switching overhead
4. **Unbounded queue**: Memory exhaustion
5. **Exception propagation**: Crashes worker threads

---

## Summary

Thread pools are essential for efficient concurrent task execution:

- **Reuse threads**: Avoid creation/destruction overhead
- **Control concurrency**: Limit number of simultaneous tasks
- **Better performance**: Optimal resource utilization
- **Scalable**: Handle many tasks with few threads

Key takeaways:
- Use appropriate number of threads (typically CPU count)
- Implement proper shutdown mechanism
- Handle exceptions in tasks
- Consider bounded queues for memory safety
- Use futures for task results when needed

By implementing thread pools correctly, you can build efficient, scalable concurrent applications in C++.

