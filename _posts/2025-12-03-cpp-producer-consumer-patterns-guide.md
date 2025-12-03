---
layout: post
title: "C++ Producer-Consumer Patterns: Single/Multiple Producer and Consumer Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading producer-consumer patterns
permalink: /2025/12/03/cpp-producer-consumer-patterns-guide/
tags: [cpp, concurrency, multithreading, producer-consumer, queue, condition-variable, mutex, thread-safety, synchronization]
excerpt: "A comprehensive guide to C++ producer-consumer patterns covering single/multiple producer and consumer scenarios with thread-safe queue implementations, condition variables, and practical examples."
---

# C++ Producer-Consumer Patterns: Single/Multiple Producer and Consumer Examples

The producer-consumer pattern is a fundamental concurrency design pattern where one or more threads (producers) generate data and one or more threads (consumers) process that data. This guide covers all four combinations: single producer-single consumer, multiple producer-single consumer, single producer-multiple consumer, and multiple producer-multiple consumer.

## Table of Contents

1. [Overview](#overview)
2. [Thread-Safe Queue Implementation](#thread-safe-queue-implementation)
3. [Single Producer & Single Consumer](#single-producer--single-consumer)
4. [Multiple Producer & Single Consumer](#multiple-producer--single-consumer)
5. [Single Producer & Multiple Consumer](#single-producer--multiple-consumer)
6. [Multiple Producer & Multiple Consumer](#multiple-producer--multiple-consumer)
7. [Best Practices](#best-practices)
8. [Common Pitfalls](#common-pitfalls)

---

## Overview

The producer-consumer pattern solves the problem of coordinating work between threads that generate data and threads that process it. The pattern uses a shared buffer (typically a queue) to decouple producers from consumers.

### Key Components

- **Queue/Buffer**: Shared data structure to hold items
- **Mutex**: Protects the queue from race conditions
- **Condition Variable**: Signals when data is available or space is available
- **Producer Thread(s)**: Generate and enqueue data
- **Consumer Thread(s)**: Dequeue and process data

### Pattern Variations

1. **1 Producer, 1 Consumer (SPSC)**: Simplest case, minimal contention
2. **N Producers, 1 Consumer (MPSC)**: Multiple sources, single processor
3. **1 Producer, N Consumers (SPMC)**: Single source, parallel processing
4. **N Producers, M Consumers (MPMC)**: Most general case, maximum parallelism

---

## Thread-Safe Queue Implementation

First, let's implement a thread-safe queue that will be used in all examples:

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
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
    explicit ThreadSafeQueue(size_t max_size = 1000) 
        : max_size_(max_size), shutdown_(false) {}

    void push(const T& item) {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's space or shutdown
        not_full_.wait(lock, [this]() {
            return queue_.size() < max_size_ || shutdown_;
        });
        
        if (shutdown_) {
            return;
        }
        
        queue_.push(item);
        not_empty_.notify_one();
    }

    optional<T> pop() {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's data or shutdown
        not_empty_.wait(lock, [this]() {
            return !queue_.empty() || shutdown_;
        });
        
        if (shutdown_ && queue_.empty()) {
            return nullopt;
        }
        
        T item = queue_.front();
        queue_.pop();
        not_full_.notify_one();
        return item;
    }

    void shutdown() {
        lock_guard<mutex> lock(mtx_);
        shutdown_ = true;
        not_empty_.notify_all();
        not_full_.notify_all();
    }

    size_t size() const {
        lock_guard<mutex> lock(mtx_);
        return queue_.size();
    }
};
```

---

## Single Producer & Single Consumer

The simplest case: one producer thread generates data, one consumer thread processes it.

### Use Cases

- Logging systems
- Data streaming pipelines
- Simple task queues
- File processing

### Example Implementation

```cpp
#include <iostream>
#include <thread>
#include <chrono>
#include <atomic>
using namespace std;

void singleProducerSingleConsumer() {
    ThreadSafeQueue<int> queue(10);
    atomic<bool> done(false);

    // Producer thread
    thread producer([&queue, &done]() {
        for (int i = 1; i <= 20; ++i) {
            queue.push(i);
            cout << "Producer: pushed " << i << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        }
        done = true;
        queue.shutdown();
    });

    // Consumer thread
    thread consumer([&queue, &done]() {
        while (!done || queue.size() > 0) {
            auto item = queue.pop();
            if (item.has_value()) {
                int value = item.value();
                cout << "Consumer: processed " << value << endl;
                // Simulate processing time
                this_thread::sleep_for(chrono::milliseconds(150));
            }
        }
    });

    producer.join();
    consumer.join();
    cout << "SPSC completed" << endl;
}
```

### Characteristics

- **Low contention**: Only one thread accesses each end
- **Simple synchronization**: Minimal locking overhead
- **Deterministic**: Easy to reason about behavior
- **No load balancing needed**: Single consumer handles all work

---

## Multiple Producer & Single Consumer

Multiple producer threads generate data, one consumer thread processes it.

### Use Cases

- Event aggregation systems
- Log collection from multiple sources
- Sensor data collection
- Request queuing in web servers

### Example Implementation

```cpp
#include <vector>
#include <atomic>
using namespace std;

void multipleProducerSingleConsumer() {
    ThreadSafeQueue<string> queue(50);
    atomic<int> active_producers(3);
    atomic<bool> done(false);

    // Multiple producer threads
    vector<thread> producers;
    for (int p = 0; p < 3; ++p) {
        producers.emplace_back([&queue, p, &active_producers]() {
            for (int i = 1; i <= 10; ++i) {
                string msg = "Producer-" + to_string(p) + ": item-" + to_string(i);
                queue.push(msg);
                cout << msg << endl;
                this_thread::sleep_for(chrono::milliseconds(50 + p * 20));
            }
            active_producers--;
            if (active_producers == 0) {
                queue.shutdown();
            }
        });
    }

    // Single consumer thread
    thread consumer([&queue, &active_producers]() {
        int processed = 0;
        while (active_producers > 0 || queue.size() > 0) {
            auto item = queue.pop();
            if (item.has_value()) {
                cout << "Consumer: processed [" << item.value() << "]" << endl;
                processed++;
                this_thread::sleep_for(chrono::milliseconds(100));
            }
        }
        cout << "Consumer processed " << processed << " items" << endl;
    });

    for (auto& t : producers) {
        t.join();
    }
    consumer.join();
    cout << "MPSC completed" << endl;
}
```

### Characteristics

- **Producer contention**: Multiple threads compete to push
- **Consumer bottleneck**: Single thread may become overwhelmed
- **Load balancing**: Not needed (single consumer)
- **Throughput**: Limited by consumer processing speed

### Optimization Tips

```cpp
// Batch processing for better throughput
void optimizedMPSC() {
    ThreadSafeQueue<int> queue(100);
    const int BATCH_SIZE = 10;
    
    thread consumer([&queue]() {
        vector<int> batch;
        while (true) {
            // Collect a batch
            for (int i = 0; i < BATCH_SIZE; ++i) {
                auto item = queue.pop();
                if (item.has_value()) {
                    batch.push_back(item.value());
                } else {
                    break;
                }
            }
            
            if (batch.empty()) {
                break;
            }
            
            // Process batch
            processBatch(batch);
            batch.clear();
        }
    });
}
```

---

## Single Producer & Multiple Consumer

One producer thread generates data, multiple consumer threads process it in parallel.

### Use Cases

- Task distribution systems
- Parallel data processing
- Load balancing
- Worker thread pools

### Example Implementation

```cpp
#include <atomic>
using namespace std;

void singleProducerMultipleConsumer() {
    ThreadSafeQueue<int> queue(100);
    atomic<int> items_produced(0);
    atomic<int> items_consumed(0);
    const int TOTAL_ITEMS = 100;
    const int NUM_CONSUMERS = 4;

    // Single producer thread
    thread producer([&queue, &items_produced]() {
        for (int i = 1; i <= TOTAL_ITEMS; ++i) {
            queue.push(i);
            items_produced++;
            cout << "Producer: pushed " << i << endl;
            this_thread::sleep_for(chrono::milliseconds(10));
        }
        queue.shutdown();
    });

    // Multiple consumer threads
    vector<thread> consumers;
    for (int c = 0; c < NUM_CONSUMERS; ++c) {
        consumers.emplace_back([&queue, c, &items_consumed]() {
            int local_count = 0;
            while (true) {
                auto item = queue.pop();
                if (!item.has_value()) {
                    break;
                }
                
                int value = item.value();
                cout << "Consumer-" << c << ": processed " << value << endl;
                items_consumed++;
                local_count++;
                
                // Simulate variable processing time
                this_thread::sleep_for(chrono::milliseconds(20 + (value % 50)));
            }
            cout << "Consumer-" << c << " finished, processed " << local_count << " items" << endl;
        });
    }

    producer.join();
    for (auto& t : consumers) {
        t.join();
    }
    
    cout << "SPMC completed: produced=" << items_produced 
         << ", consumed=" << items_consumed << endl;
}
```

### Characteristics

- **Load balancing**: Work distributed across consumers
- **Parallel processing**: Multiple items processed simultaneously
- **Consumer contention**: Multiple threads compete to pop
- **Throughput**: Scales with number of consumers (up to a point)

### Load Balancing Example

```cpp
// Work-stealing for better load distribution
class WorkStealingQueue {
private:
    ThreadSafeQueue<int> shared_queue_;
    vector<queue<int>> local_queues_;
    mutex steal_mtx_;
    int num_consumers_;

public:
    WorkStealingQueue(int num_consumers) 
        : num_consumers_(num_consumers), local_queues_(num_consumers) {}

    void push(int item, int consumer_id) {
        local_queues_[consumer_id].push(item);
        if (local_queues_[consumer_id].size() > 10) {
            // Steal work to shared queue
            shared_queue_.push(item);
        }
    }

    optional<int> pop(int consumer_id) {
        // Try local queue first
        if (!local_queues_[consumer_id].empty()) {
            int item = local_queues_[consumer_id].front();
            local_queues_[consumer_id].pop();
            return item;
        }
        
        // Try shared queue
        return shared_queue_.pop();
    }
};
```

---

## Multiple Producer & Multiple Consumer

The most general case: multiple producers and multiple consumers.

### Use Cases

- High-throughput message queues
- Distributed task processing
- Real-time data processing systems
- Microservices communication

### Example Implementation

```cpp
void multipleProducerMultipleConsumer() {
    ThreadSafeQueue<string> queue(200);
    atomic<int> active_producers(5);
    atomic<int> total_produced(0);
    atomic<int> total_consumed(0);
    const int NUM_PRODUCERS = 5;
    const int NUM_CONSUMERS = 3;
    const int ITEMS_PER_PRODUCER = 20;

    // Multiple producer threads
    vector<thread> producers;
    for (int p = 0; p < NUM_PRODUCERS; ++p) {
        producers.emplace_back([&queue, p, &active_producers, &total_produced]() {
            for (int i = 1; i <= ITEMS_PER_PRODUCER; ++i) {
                string msg = "P" + to_string(p) + "-item" + to_string(i);
                queue.push(msg);
                total_produced++;
                this_thread::sleep_for(chrono::milliseconds(30 + (p * 5)));
            }
            active_producers--;
            if (active_producers == 0) {
                queue.shutdown();
            }
        });
    }

    // Multiple consumer threads
    vector<thread> consumers;
    for (int c = 0; c < NUM_CONSUMERS; ++c) {
        consumers.emplace_back([&queue, c, &active_producers, &total_consumed]() {
            int local_count = 0;
            while (active_producers > 0 || queue.size() > 0) {
                auto item = queue.pop();
                if (item.has_value()) {
                    cout << "C" << c << ": [" << item.value() << "]" << endl;
                    total_consumed++;
                    local_count++;
                    this_thread::sleep_for(chrono::milliseconds(50 + (c * 10)));
                }
            }
            cout << "Consumer-" << c << " finished: " << local_count << " items" << endl;
        });
    }

    // Wait for all producers
    for (auto& t : producers) {
        t.join();
    }
    
    // Wait for all consumers
    for (auto& t : consumers) {
        t.join();
    }
    
    cout << "MPMC completed: produced=" << total_produced 
         << ", consumed=" << total_consumed << endl;
}
```

### Characteristics

- **Maximum parallelism**: Both production and consumption parallelized
- **High contention**: Multiple threads compete on both ends
- **Complex synchronization**: Requires careful design
- **Scalability**: Can handle high throughput

### Advanced MPMC with Priority Queue

```cpp
#include <queue>
#include <functional>
using namespace std;

template<typename T>
class PriorityThreadSafeQueue {
private:
    priority_queue<T, vector<T>, greater<T>> queue_;
    mutex mtx_;
    condition_variable not_empty_;
    bool shutdown_;

public:
    void push(const T& item) {
        lock_guard<mutex> lock(mtx_);
        if (shutdown_) return;
        queue_.push(item);
        not_empty_.notify_one();
    }

    optional<T> pop() {
        unique_lock<mutex> lock(mtx_);
        not_empty_.wait(lock, [this]() {
            return !queue_.empty() || shutdown_;
        });
        
        if (shutdown_ && queue_.empty()) {
            return nullopt;
        }
        
        T item = queue_.top();
        queue_.pop();
        return item;
    }

    void shutdown() {
        lock_guard<mutex> lock(mtx_);
        shutdown_ = true;
        not_empty_.notify_all();
    }
};
```

---

## Best Practices

### 1. Proper Shutdown Handling

```cpp
class GracefulShutdown {
private:
    ThreadSafeQueue<int> queue_;
    atomic<bool> shutdown_requested_;
    
public:
    void shutdown() {
        shutdown_requested_ = true;
        queue_.shutdown();
        // Give consumers time to finish
        this_thread::sleep_for(chrono::milliseconds(100));
    }
};
```

### 2. Bounded Queue Size

Always use bounded queues to prevent memory exhaustion:

```cpp
ThreadSafeQueue<int> queue(1000);  // Limit to 1000 items
```

### 3. Error Handling

```cpp
bool tryPush(const T& item, chrono::milliseconds timeout) {
    unique_lock<mutex> lock(mtx_);
    if (not_full_.wait_for(lock, timeout, [this]() {
        return queue_.size() < max_size_ || shutdown_;
    })) {
        if (shutdown_) return false;
        queue_.push(item);
        not_empty_.notify_one();
        return true;
    }
    return false;  // Timeout
}
```

### 4. Performance Monitoring

```cpp
class MonitoredQueue {
private:
    atomic<size_t> total_pushed_{0};
    atomic<size_t> total_popped_{0};
    atomic<size_t> max_size_{0};
    
public:
    void push(const T& item) {
        // ... push logic ...
        total_pushed_++;
        size_t current = queue_.size();
        size_t max = max_size_.load();
        while (current > max && !max_size_.compare_exchange_weak(max, current)) {
            max = max_size_.load();
        }
    }
    
    void printStats() {
        cout << "Pushed: " << total_pushed_ 
             << ", Popped: " << total_popped_
             << ", Max size: " << max_size_ << endl;
    }
};
```

### 5. Use Lock-Free for High Performance

For extreme performance, consider lock-free queues:

```cpp
#include <atomic>

template<typename T>
class LockFreeQueue {
private:
    struct Node {
        atomic<T*> data;
        atomic<Node*> next;
    };
    
    atomic<Node*> head_;
    atomic<Node*> tail_;
    
public:
    void push(const T& item) {
        Node* new_node = new Node;
        new_node->data.store(new T(item));
        new_node->next.store(nullptr);
        
        Node* prev_tail = tail_.exchange(new_node);
        prev_tail->next.store(new_node);
    }
};
```

---

## Common Pitfalls

### 1. Deadlock from Multiple Locks

```cpp
// BAD: Potential deadlock
void badExample() {
    mutex mtx1, mtx2;
    thread t1([&]() {
        lock_guard<mutex> l1(mtx1);
        lock_guard<mutex> l2(mtx2);  // Different order
    });
    thread t2([&]() {
        lock_guard<mutex> l2(mtx2);
        lock_guard<mutex> l1(mtx1);  // Different order
    });
}

// GOOD: Always lock in same order
void goodExample() {
    mutex mtx1, mtx2;
    thread t1([&]() {
        lock(mtx1, mtx2);  // Lock both at once
        lock_guard<mutex> l1(mtx1, adopt_lock);
        lock_guard<mutex> l2(mtx2, adopt_lock);
    });
}
```

### 2. Lost Wake-ups

```cpp
// BAD: Lost wake-up
void badWait() {
    unique_lock<mutex> lock(mtx_);
    if (queue_.empty()) {
        lock.unlock();
        // Another thread might push here!
        lock.lock();
        not_empty_.wait(lock);  // May wait forever
    }
}

// GOOD: Use predicate
void goodWait() {
    unique_lock<mutex> lock(mtx_);
    not_empty_.wait(lock, [this]() {
        return !queue_.empty() || shutdown_;
    });
}
```

### 3. Race Condition in Shutdown

```cpp
// BAD: Race condition
void badShutdown() {
    shutdown_ = true;  // Not atomic!
    not_empty_.notify_all();
}

// GOOD: Proper synchronization
void goodShutdown() {
    {
        lock_guard<mutex> lock(mtx_);
        shutdown_ = true;
    }
    not_empty_.notify_all();
    not_full_.notify_all();
}
```

### 4. Unbounded Queue Growth

```cpp
// BAD: No size limit
queue<int> unbounded_queue;  // Can grow indefinitely

// GOOD: Bounded queue
ThreadSafeQueue<int> bounded_queue(1000);
```

### 5. Ignoring Return Values

```cpp
// BAD: Ignoring optional
queue.pop();  // Lost item if queue was empty

// GOOD: Check return value
auto item = queue.pop();
if (item.has_value()) {
    process(item.value());
}
```

---

## Summary

The producer-consumer pattern is essential for concurrent programming in C++. Choose the right variant based on your needs:

- **SPSC**: Simple, low overhead, deterministic
- **MPSC**: Multiple sources, single processor
- **SPMC**: Single source, parallel processing, load balancing
- **MPMC**: Maximum parallelism, high throughput

Key takeaways:
- Always use bounded queues
- Implement proper shutdown mechanisms
- Use condition variables with predicates
- Monitor performance and contention
- Consider lock-free implementations for extreme performance

By understanding these patterns and following best practices, you can build robust, scalable concurrent systems in C++.

