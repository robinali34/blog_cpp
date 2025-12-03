---
layout: post
title: "C++ Condition Variable: Multi-Thread Synchronization Guide and Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading condition-variable synchronization
permalink: /2025/12/03/cpp-condition-variable-guide/
tags: [cpp, concurrency, multithreading, condition-variable, mutex, wait, notify, synchronization]
excerpt: "Learn about C++ condition variables for efficient thread synchronization. Guide to implementing wait/notify patterns, producer-consumer queues, and thread coordination with practical examples."
---

# C++ Condition Variable: Multi-Thread Synchronization Guide and Examples

Condition variables are synchronization primitives that allow threads to wait for specific conditions to become true. They enable efficient thread coordination without busy-waiting, making them essential for implementing producer-consumer patterns, thread pools, and other concurrent designs.

## Table of Contents

1. [What is a Condition Variable?](#what-is-a-condition-variable)
2. [Basic Usage and API](#basic-usage-and-api)
3. [Example 1: Simple Wait and Notify](#example-1-simple-wait-and-notify)
4. [Example 2: Producer-Consumer with Condition Variable](#example-2-producer-consumer-with-condition-variable)
5. [Example 3: Thread Coordination](#example-3-thread-coordination)
6. [Example 4: Bounded Buffer](#example-4-bounded-buffer)
7. [Example 5: Worker Thread Pattern](#example-5-worker-thread-pattern)
8. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
9. [Common Pitfalls](#common-pitfalls)

---

## What is a Condition Variable?

A condition variable allows threads to:
- **Wait** for a condition to become true (blocks until notified)
- **Notify** other threads when a condition changes
- **Avoid busy-waiting** by sleeping until woken up

### Key Components

- **`std::condition_variable`**: The condition variable itself
- **`std::mutex`**: Protects shared data and condition checking
- **Predicate**: Lambda/function that checks the condition
- **`wait()`**: Blocks until condition is true
- **`notify_one()`**: Wakes one waiting thread
- **`notify_all()`**: Wakes all waiting threads

### Why Use Condition Variables?

```cpp
// BAD: Busy-waiting (wastes CPU)
while (!condition) {
    // Spinning - wastes CPU cycles!
}

// GOOD: Condition variable (efficient)
unique_lock<mutex> lock(mtx);
cv.wait(lock, []() { return condition; });
```

---

## Basic Usage and API

### Basic API

```cpp
#include <condition_variable>
#include <mutex>
using namespace std;

class ConditionVariableExample {
private:
    mutex mtx_;
    condition_variable cv_;
    bool ready_ = false;

public:
    void waitForReady() {
        unique_lock<mutex> lock(mtx_);
        // Wait until ready_ becomes true
        cv_.wait(lock, [this]() { return ready_; });
    }

    void setReady() {
        {
            lock_guard<mutex> lock(mtx_);
            ready_ = true;
        }
        cv_.notify_one();  // Wake one waiting thread
    }

    void setReadyAll() {
        {
            lock_guard<mutex> lock(mtx_);
            ready_ = true;
        }
        cv_.notify_all();  // Wake all waiting threads
    }
};
```

### Key Methods

- **`wait(lock, predicate)`**: Wait until predicate returns true
- **`wait(lock)`**: Wait until notified (may have spurious wake-ups)
- **`wait_for(lock, duration, predicate)`**: Wait with timeout
- **`wait_until(lock, time_point, predicate)`**: Wait until specific time
- **`notify_one()`**: Wake one waiting thread
- **`notify_all()`**: Wake all waiting threads

---

## Example 1: Simple Wait and Notify

Basic example of thread coordination:

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <chrono>
using namespace std;

void simpleWaitNotify() {
    mutex mtx;
    condition_variable cv;
    bool data_ready = false;
    int shared_data = 0;

    // Producer thread
    thread producer([&]() {
        this_thread::sleep_for(chrono::milliseconds(500));
        
        {
            lock_guard<mutex> lock(mtx);
            shared_data = 42;
            data_ready = true;
            cout << "Producer: Data ready!" << endl;
        }
        
        cv.notify_one();  // Wake the consumer
    });

    // Consumer thread
    thread consumer([&]() {
        unique_lock<mutex> lock(mtx);
        cout << "Consumer: Waiting for data..." << endl;
        
        // Wait until data is ready
        cv.wait(lock, [&]() { return data_ready; });
        
        cout << "Consumer: Received data = " << shared_data << endl;
    });

    producer.join();
    consumer.join();
}
```

### Output

```
Consumer: Waiting for data...
Producer: Data ready!
Consumer: Received data = 42
```

---

## Example 2: Producer-Consumer with Condition Variable

Thread-safe queue using condition variables:

```cpp
#include <queue>
#include <optional>
using namespace std;

template<typename T>
class ThreadSafeQueue {
private:
    queue<T> queue_;
    mutex mtx_;
    condition_variable not_empty_;
    condition_variable not_full_;
    size_t max_size_;
    bool shutdown_;

public:
    explicit ThreadSafeQueue(size_t max_size = 100) 
        : max_size_(max_size), shutdown_(false) {}

    void push(const T& item) {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's space
        not_full_.wait(lock, [this]() {
            return queue_.size() < max_size_ || shutdown_;
        });
        
        if (shutdown_) return;
        
        queue_.push(item);
        not_empty_.notify_one();  // Wake one consumer
    }

    optional<T> pop() {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's data
        not_empty_.wait(lock, [this]() {
            return !queue_.empty() || shutdown_;
        });
        
        if (shutdown_ && queue_.empty()) {
            return nullopt;
        }
        
        T item = queue_.front();
        queue_.pop();
        not_full_.notify_one();  // Wake one producer
        return item;
    }

    void shutdown() {
        {
            lock_guard<mutex> lock(mtx_);
            shutdown_ = true;
        }
        not_empty_.notify_all();
        not_full_.notify_all();
    }
};
```

---

## Example 3: Thread Coordination

Coordinate multiple threads to start simultaneously:

```cpp
void threadCoordination() {
    mutex mtx;
    condition_variable cv;
    int ready_count = 0;
    const int NUM_THREADS = 5;
    const int REQUIRED = NUM_THREADS;

    vector<thread> threads;
    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back([&, i]() {
            // Preparation work
            this_thread::sleep_for(chrono::milliseconds(100 * (i + 1)));
            cout << "Thread " << i << " ready" << endl;
            
            {
                unique_lock<mutex> lock(mtx);
                ready_count++;
                
                // Wait until all threads are ready
                cv.wait(lock, [&]() { return ready_count >= REQUIRED; });
            }
            
            // All threads proceed together
            cout << "Thread " << i << " starting!" << endl;
        });
    }

    // Notify all when ready
    {
        unique_lock<mutex> lock(mtx);
        cv.wait(lock, [&]() { return ready_count >= REQUIRED; });
        cv.notify_all();
    }

    for (auto& t : threads) {
        t.join();
    }
}
```

---

## Example 4: Bounded Buffer

Bounded buffer with condition variables:

```cpp
template<typename T>
class BoundedBuffer {
private:
    vector<T> buffer_;
    size_t capacity_;
    size_t front_ = 0;
    size_t back_ = 0;
    size_t count_ = 0;
    mutex mtx_;
    condition_variable not_full_;
    condition_variable not_empty_;

public:
    explicit BoundedBuffer(size_t capacity) : capacity_(capacity) {
        buffer_.resize(capacity);
    }

    void put(const T& item) {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's space
        not_full_.wait(lock, [this]() { return count_ < capacity_; });
        
        buffer_[back_] = item;
        back_ = (back_ + 1) % capacity_;
        count_++;
        
        not_empty_.notify_one();
    }

    T get() {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's data
        not_empty_.wait(lock, [this]() { return count_ > 0; });
        
        T item = buffer_[front_];
        front_ = (front_ + 1) % capacity_;
        count_--;
        
        not_full_.notify_one();
        return item;
    }
};
```

---

## Example 5: Worker Thread Pattern

Worker threads waiting for tasks:

```cpp
#include <functional>
#include <atomic>
using namespace std;

class WorkerPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> stop_{false};

public:
    WorkerPool(size_t num_workers) {
        for (size_t i = 0; i < num_workers; ++i) {
            workers_.emplace_back([this, i]() {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(mtx_);
                        
                        // Wait for task or stop signal
                        cv_.wait(lock, [this]() {
                            return !tasks_.empty() || stop_;
                        });
                        
                        if (stop_ && tasks_.empty()) {
                            break;
                        }
                        
                        if (!tasks_.empty()) {
                            task = tasks_.front();
                            tasks_.pop();
                        }
                    }
                    
                    if (task) {
                        task();
                    }
                }
            });
        }
    }

    void enqueue(function<void()> task) {
        {
            lock_guard<mutex> lock(mtx_);
            tasks_.push(task);
        }
        cv_.notify_one();
    }

    ~WorkerPool() {
        stop_ = true;
        cv_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};
```

---

## Common Patterns and Best Practices

### 1. Always Use Predicates

```cpp
// GOOD: Prevents spurious wake-ups
cv.wait(lock, [this]() { return condition; });

// BAD: May wake up even when condition is false
cv.wait(lock);
if (!condition) { /* race condition! */ }
```

### 2. Lock Before Modifying Condition

```cpp
// GOOD: Lock before modifying
{
    lock_guard<mutex> lock(mtx);
    condition = true;
}
cv.notify_one();

// BAD: Race condition
condition = true;  // Not protected!
cv.notify_one();
```

### 3. Use notify_one() When Possible

```cpp
// GOOD: Only wake one thread (more efficient)
cv.notify_one();

// Use notify_all() only when necessary
cv.notify_all();  // Wakes all - use when multiple threads need to proceed
```

### 4. Timeout for Responsiveness

```cpp
bool waitWithTimeout(chrono::milliseconds timeout) {
    unique_lock<mutex> lock(mtx);
    return cv.wait_for(lock, timeout, [this]() { return ready_; });
}
```

### 5. Proper Shutdown

```cpp
void shutdown() {
    {
        lock_guard<mutex> lock(mtx);
        shutdown_ = true;
    }
    cv.notify_all();  // Wake all waiting threads
}
```

---

## Common Pitfalls

### 1. Lost Wake-up

```cpp
// BAD: Lost wake-up
unique_lock<mutex> lock(mtx);
if (!condition) {
    lock.unlock();
    // Another thread might set condition here!
    lock.lock();
    cv.wait(lock);  // May wait forever
}

// GOOD: Use predicate
cv.wait(lock, [this]() { return condition; });
```

### 2. Spurious Wake-ups

```cpp
// BAD: Assumes wake-up means condition is true
cv.wait(lock);
if (condition) { /* may be false! */ }

// GOOD: Always check condition
cv.wait(lock, [this]() { return condition; });
```

### 3. Holding Lock Too Long

```cpp
// BAD: Hold lock during notification
{
    lock_guard<mutex> lock(mtx);
    condition = true;
    cv.notify_one();  // Lock still held - inefficient
}

// GOOD: Release lock before notifying
{
    lock_guard<mutex> lock(mtx);
    condition = true;
}
cv.notify_one();  // Lock released - more efficient
```

### 4. Wrong Mutex Type

```cpp
// BAD: Using lock_guard with wait
lock_guard<mutex> lock(mtx);
cv.wait(lock);  // ERROR: lock_guard doesn't support unlock!

// GOOD: Use unique_lock
unique_lock<mutex> lock(mtx);
cv.wait(lock);  // OK: unique_lock supports unlock
```

### 5. Deadlock from Multiple Condition Variables

```cpp
// BAD: Potential deadlock
unique_lock<mutex> lock1(mtx1);
unique_lock<mutex> lock2(mtx2);
cv1.wait(lock1);
cv2.wait(lock2);

// GOOD: Always lock in same order
lock(mtx1, mtx2);
unique_lock<mutex> lock1(mtx1, adopt_lock);
unique_lock<mutex> lock2(mtx2, adopt_lock);
```

---

## Summary

Condition variables are essential for efficient thread synchronization:

- **Avoid busy-waiting**: Threads sleep until woken up
- **Efficient coordination**: Enable complex synchronization patterns
- **Predicate-based waiting**: Prevents spurious wake-ups
- **Flexible notification**: Wake one or all threads

Key takeaways:
- Always use predicates with `wait()`
- Lock before modifying condition variables
- Use `unique_lock` (not `lock_guard`) with `wait()`
- Release lock before notifying when possible
- Handle shutdown properly to avoid deadlocks

By following these patterns, you can implement efficient, correct concurrent programs using condition variables.

