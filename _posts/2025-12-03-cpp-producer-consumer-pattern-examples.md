---
layout: post
title: "C++ Producer-Consumer Pattern: Multi-Thread Examples and Implementation"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading producer-consumer
permalink: /2025/12/03/cpp-producer-consumer-pattern-examples/
tags: [cpp, concurrency, multithreading, producer-consumer, queue, condition-variable, mutex, thread-safety]
excerpt: "Learn the producer-consumer pattern in C++ with practical multi-thread examples. Step-by-step guide to implementing thread-safe queues, condition variables, and synchronization."
---

# C++ Producer-Consumer Pattern: Multi-Thread Examples and Implementation

The producer-consumer pattern is one of the most common multi-threading patterns in C++. It allows one or more threads (producers) to generate data while other threads (consumers) process that data concurrently, using a shared buffer for communication.

## Table of Contents

1. [What is Producer-Consumer Pattern?](#what-is-producer-consumer-pattern)
2. [Basic Implementation with Condition Variables](#basic-implementation-with-condition-variables)
3. [Example 1: Simple Producer-Consumer](#example-1-simple-producer-consumer)
4. [Example 2: Multiple Producers, Single Consumer](#example-2-multiple-producers-single-consumer)
5. [Example 3: Single Producer, Multiple Consumers](#example-3-single-producer-multiple-consumers)
6. [Example 4: Multiple Producers, Multiple Consumers](#example-4-multiple-producers-multiple-consumers)
7. [Complete Working Example](#complete-working-example)
8. [Key Concepts and Best Practices](#key-concepts-and-best-practices)

---

## What is Producer-Consumer Pattern?

The producer-consumer pattern decouples data production from data consumption:

- **Producer**: Thread that generates data and adds it to a shared buffer
- **Consumer**: Thread that removes data from the buffer and processes it
- **Buffer/Queue**: Shared data structure that holds items between production and consumption

### Why Use This Pattern?

- **Decoupling**: Producers and consumers work independently
- **Efficiency**: Producers can work while consumers process previous data
- **Load Balancing**: Multiple consumers can share the workload
- **Buffering**: Handles speed mismatches between producers and consumers

---

## Basic Implementation with Condition Variables

A thread-safe queue is the foundation of the producer-consumer pattern:

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <optional>
#include <iostream>
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

    // Producer calls this to add items
    void push(const T& item) {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's space in the queue
        not_full_.wait(lock, [this]() {
            return queue_.size() < max_size_ || shutdown_;
        });
        
        if (shutdown_) {
            return;
        }
        
        queue_.push(item);
        cout << "Pushed: " << item << " (queue size: " << queue_.size() << ")" << endl;
        
        // Notify one waiting consumer
        not_empty_.notify_one();
    }

    // Consumer calls this to get items
    optional<T> pop() {
        unique_lock<mutex> lock(mtx_);
        
        // Wait until there's data available
        not_empty_.wait(lock, [this]() {
            return !queue_.empty() || shutdown_;
        });
        
        if (shutdown_ && queue_.empty()) {
            return nullopt;
        }
        
        T item = queue_.front();
        queue_.pop();
        
        // Notify one waiting producer
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

### Key Components Explained

- **`mutex mtx_`**: Protects the queue from race conditions
- **`condition_variable not_empty_`**: Signals when data is available for consumers
- **`condition_variable not_full_`**: Signals when space is available for producers
- **`wait()` with predicate**: Prevents spurious wake-ups and lost signals

---

## Example 1: Simple Producer-Consumer

One producer, one consumer - the simplest case:

```cpp
#include <thread>
#include <chrono>
#include <atomic>
using namespace std;

void simpleProducerConsumer() {
    ThreadSafeQueue<int> queue(10);
    atomic<bool> producer_done(false);

    // Producer thread
    thread producer([&queue, &producer_done]() {
        for (int i = 1; i <= 20; ++i) {
            queue.push(i);
            this_thread::sleep_for(chrono::milliseconds(100));
        }
        producer_done = true;
        queue.shutdown();
        cout << "Producer finished" << endl;
    });

    // Consumer thread
    thread consumer([&queue, &producer_done]() {
        int count = 0;
        while (!producer_done || queue.size() > 0) {
            auto item = queue.pop();
            if (item.has_value()) {
                int value = item.value();
                cout << "Consumed: " << value << endl;
                count++;
                // Simulate processing time
                this_thread::sleep_for(chrono::milliseconds(150));
            }
        }
        cout << "Consumer finished. Processed " << count << " items" << endl;
    });

    producer.join();
    consumer.join();
    cout << "Simple producer-consumer completed!" << endl;
}

int main() {
    simpleProducerConsumer();
    return 0;
}
```

### Output Example

```
Pushed: 1 (queue size: 1)
Consumed: 1
Pushed: 2 (queue size: 1)
Pushed: 3 (queue size: 2)
Consumed: 2
Pushed: 4 (queue size: 2)
...
Producer finished
Consumer finished. Processed 20 items
Simple producer-consumer completed!
```

---

## Example 2: Multiple Producers, Single Consumer

Multiple threads producing data, one thread consuming:

```cpp
#include <vector>
using namespace std;

void multipleProducersSingleConsumer() {
    ThreadSafeQueue<string> queue(50);
    atomic<int> active_producers(3);
    const int NUM_PRODUCERS = 3;
    const int ITEMS_PER_PRODUCER = 10;

    // Create multiple producer threads
    vector<thread> producers;
    for (int p = 0; p < NUM_PRODUCERS; ++p) {
        producers.emplace_back([&queue, p, &active_producers]() {
            for (int i = 1; i <= ITEMS_PER_PRODUCER; ++i) {
                string item = "Producer-" + to_string(p) + "-Item-" + to_string(i);
                queue.push(item);
                this_thread::sleep_for(chrono::milliseconds(50 + p * 10));
            }
            active_producers--;
            cout << "Producer " << p << " finished" << endl;
            
            // Last producer shuts down the queue
            if (active_producers == 0) {
                queue.shutdown();
            }
        });
    }

    // Single consumer thread
    thread consumer([&queue, &active_producers]() {
        int total_processed = 0;
        while (active_producers > 0 || queue.size() > 0) {
            auto item = queue.pop();
            if (item.has_value()) {
                cout << "Consumer processed: " << item.value() << endl;
                total_processed++;
                this_thread::sleep_for(chrono::milliseconds(100));
            }
        }
        cout << "Consumer finished. Total processed: " << total_processed << endl;
    });

    // Wait for all producers
    for (auto& t : producers) {
        t.join();
    }
    
    // Wait for consumer
    consumer.join();
    
    cout << "Multiple producers, single consumer completed!" << endl;
}
```

### Use Cases

- **Event aggregation**: Multiple sources generating events, single processor
- **Log collection**: Multiple services logging to a central processor
- **Sensor data**: Multiple sensors feeding data to one analyzer

---

## Example 3: Single Producer, Multiple Consumers

One producer, multiple consumers for parallel processing:

```cpp
void singleProducerMultipleConsumers() {
    ThreadSafeQueue<int> queue(100);
    atomic<int> items_produced(0);
    atomic<int> items_consumed(0);
    const int TOTAL_ITEMS = 50;
    const int NUM_CONSUMERS = 4;

    // Single producer
    thread producer([&queue, &items_produced]() {
        for (int i = 1; i <= TOTAL_ITEMS; ++i) {
            queue.push(i);
            items_produced++;
            this_thread::sleep_for(chrono::milliseconds(20));
        }
        queue.shutdown();
        cout << "Producer finished. Produced " << items_produced << " items" << endl;
    });

    // Multiple consumers
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
                cout << "Consumer-" << c << " processed: " << value << endl;
                items_consumed++;
                local_count++;
                
                // Variable processing time
                this_thread::sleep_for(chrono::milliseconds(30 + (value % 40)));
            }
            cout << "Consumer-" << c << " finished. Processed " << local_count << " items" << endl;
        });
    }

    producer.join();
    for (auto& t : consumers) {
        t.join();
    }
    
    cout << "Total produced: " << items_produced 
         << ", Total consumed: " << items_consumed << endl;
    cout << "Single producer, multiple consumers completed!" << endl;
}
```

### Benefits

- **Parallel processing**: Multiple items processed simultaneously
- **Load distribution**: Work automatically distributed across consumers
- **Scalability**: Add more consumers to increase throughput

---

## Example 4: Multiple Producers, Multiple Consumers

The most general case - maximum parallelism:

```cpp
void multipleProducersMultipleConsumers() {
    ThreadSafeQueue<string> queue(200);
    atomic<int> active_producers(5);
    atomic<int> total_produced(0);
    atomic<int> total_consumed(0);
    const int NUM_PRODUCERS = 5;
    const int NUM_CONSUMERS = 3;
    const int ITEMS_PER_PRODUCER = 15;

    // Multiple producers
    vector<thread> producers;
    for (int p = 0; p < NUM_PRODUCERS; ++p) {
        producers.emplace_back([&queue, p, &active_producers, &total_produced]() {
            for (int i = 1; i <= ITEMS_PER_PRODUCER; ++i) {
                string item = "P" + to_string(p) + "-" + to_string(i);
                queue.push(item);
                total_produced++;
                this_thread::sleep_for(chrono::milliseconds(25 + p * 5));
            }
            active_producers--;
            if (active_producers == 0) {
                queue.shutdown();
            }
        });
    }

    // Multiple consumers
    vector<thread> consumers;
    for (int c = 0; c < NUM_CONSUMERS; ++c) {
        consumers.emplace_back([&queue, c, &active_producers, &total_consumed]() {
            int local_count = 0;
            while (active_producers > 0 || queue.size() > 0) {
                auto item = queue.pop();
                if (item.has_value()) {
                    cout << "C" << c << ": " << item.value() << endl;
                    total_consumed++;
                    local_count++;
                    this_thread::sleep_for(chrono::milliseconds(40 + c * 10));
                }
            }
            cout << "Consumer-" << c << " finished: " << local_count << " items" << endl;
        });
    }

    // Wait for all threads
    for (auto& t : producers) {
        t.join();
    }
    for (auto& t : consumers) {
        t.join();
    }
    
    cout << "MPMC completed! Produced: " << total_produced 
         << ", Consumed: " << total_consumed << endl;
}
```

### Characteristics

- **High throughput**: Maximum parallelism on both ends
- **Complex synchronization**: Requires careful design
- **Real-world applications**: Message queues, task schedulers, data pipelines

---

## Complete Working Example

Here's a complete, runnable example combining all concepts:

```cpp
#include <iostream>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <optional>
#include <thread>
#include <chrono>
#include <atomic>
#include <vector>
#include <string>
using namespace std;

template<typename T>
class ThreadSafeQueue {
private:
    queue<T> queue_;
    mutable mutex mtx_;
    condition_variable not_empty_;
    condition_variable not_full_;
    size_t max_size_;
    atomic<bool> shutdown_;

public:
    explicit ThreadSafeQueue(size_t max_size = 100) 
        : max_size_(max_size), shutdown_(false) {}

    void push(const T& item) {
        unique_lock<mutex> lock(mtx_);
        not_full_.wait(lock, [this]() {
            return queue_.size() < max_size_ || shutdown_.load();
        });
        
        if (shutdown_.load()) return;
        
        queue_.push(item);
        not_empty_.notify_one();
    }

    optional<T> pop() {
        unique_lock<mutex> lock(mtx_);
        not_empty_.wait(lock, [this]() {
            return !queue_.empty() || shutdown_.load();
        });
        
        if (shutdown_.load() && queue_.empty()) {
            return nullopt;
        }
        
        T item = queue_.front();
        queue_.pop();
        not_full_.notify_one();
        return item;
    }

    void shutdown() {
        shutdown_ = true;
        lock_guard<mutex> lock(mtx_);
        not_empty_.notify_all();
        not_full_.notify_all();
    }

    size_t size() const {
        lock_guard<mutex> lock(mtx_);
        return queue_.size();
    }
};

int main() {
    cout << "=== Producer-Consumer Pattern Demo ===" << endl << endl;

    ThreadSafeQueue<int> queue(10);
    atomic<bool> done(false);

    // Producer
    thread producer([&queue, &done]() {
        for (int i = 1; i <= 15; ++i) {
            queue.push(i);
            cout << "[Producer] Pushed: " << i << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        }
        done = true;
        queue.shutdown();
        cout << "[Producer] Finished" << endl;
    });

    // Consumer
    thread consumer([&queue, &done]() {
        int count = 0;
        while (!done || queue.size() > 0) {
            auto item = queue.pop();
            if (item.has_value()) {
                cout << "[Consumer] Processed: " << item.value() << endl;
                count++;
                this_thread::sleep_for(chrono::milliseconds(150));
            }
        }
        cout << "[Consumer] Finished. Processed " << count << " items" << endl;
    });

    producer.join();
    consumer.join();

    cout << endl << "Demo completed!" << endl;
    return 0;
}
```

### Compilation

```bash
g++ -std=c++17 -pthread producer_consumer.cpp -o producer_consumer
./producer_consumer
```

---

## Key Concepts and Best Practices

### 1. Always Use Bounded Queues

```cpp
// GOOD: Prevents memory exhaustion
ThreadSafeQueue<int> queue(1000);

// BAD: Can grow indefinitely
queue<int> unbounded_queue;
```

### 2. Proper Shutdown Sequence

```cpp
void gracefulShutdown() {
    // Signal shutdown
    queue.shutdown();
    
    // Wait for threads to finish
    producer.join();
    consumer.join();
}
```

### 3. Use Condition Variables with Predicates

```cpp
// GOOD: Prevents spurious wake-ups
not_empty_.wait(lock, [this]() {
    return !queue_.empty() || shutdown_;
});

// BAD: Can wake up even when queue is empty
not_empty_.wait(lock);
if (queue_.empty()) { /* race condition! */ }
```

### 4. Check Optional Return Values

```cpp
// GOOD: Handle empty queue
auto item = queue.pop();
if (item.has_value()) {
    process(item.value());
}

// BAD: Assumes item always exists
int value = queue.pop().value();  // May crash!
```

### 5. Avoid Deadlocks

- Always lock mutexes in the same order
- Use `lock_guard` or `unique_lock` for automatic unlocking
- Never hold a lock while waiting on a condition variable (use `unique_lock`)

### 6. Performance Considerations

- **Batch processing**: Process multiple items at once
- **Lock-free queues**: For extreme performance (advanced)
- **Thread affinity**: Pin threads to CPU cores for cache efficiency
- **Monitor queue size**: Track max size to detect bottlenecks

### Common Mistakes to Avoid

1. **Lost wake-ups**: Always use predicates with `wait()`
2. **Race conditions**: Protect all shared data with mutexes
3. **Unbounded growth**: Always limit queue size
4. **Improper shutdown**: Ensure all threads can exit cleanly
5. **Ignoring return values**: Always check `optional` return values

---

## Summary

The producer-consumer pattern is essential for concurrent programming in C++:

- **Decouples** production from consumption
- **Enables** parallel processing and load balancing
- **Handles** speed mismatches between producers and consumers
- **Scales** from simple (1-1) to complex (N-M) scenarios

Key implementation points:
- Use `mutex` for thread safety
- Use `condition_variable` for efficient waiting
- Always use bounded queues
- Implement proper shutdown mechanisms
- Check return values and handle edge cases

By following these examples and best practices, you can implement robust, scalable producer-consumer systems in C++.

