---
layout: post
title: "C++ Thread Resource Sharing: Bus vs Queue and Other Approaches"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading resource-sharing synchronization
tags: cpp concurrency multithreading bus queue message-passing mutex atomic lock-free shared-memory
excerpt: "A comprehensive guide to resource sharing among threads in C++, comparing bus-based (shared memory) and queue-based (message passing) approaches, plus mutex, atomic, and lock-free techniques with practical examples."
---

# C++ Thread Resource Sharing: Bus vs Queue and Other Approaches

When multiple threads need to share resources in C++, choosing the right synchronization mechanism is crucial for both correctness and performance. This guide compares bus-based (shared memory), queue-based (message passing), and other approaches with practical examples.

## Overview of Approaches

1. **Bus-based (Shared Memory)**: Threads access shared data directly with synchronization primitives
2. **Queue-based (Message Passing)**: Threads communicate via message queues
3. **Mutex-based**: Traditional lock-based synchronization
4. **Atomic operations**: Lock-free synchronization for simple operations
5. **Lock-free data structures**: Advanced lock-free algorithms

---

## 1. Bus-Based Approach (Shared Memory)

In the bus-based approach, threads share a common memory region and use synchronization primitives to coordinate access. This is the traditional shared-memory model.

### Example: Shared Counter with Mutex

```cpp
#include <thread>
#include <mutex>
#include <vector>
#include <iostream>

class SharedCounter {
private:
    int count_ = 0;
    std::mutex mtx_;

public:
    void increment() {
        std::lock_guard<std::mutex> lock(mtx_);
        ++count_;
    }

    int get() {
        std::lock_guard<std::mutex> lock(mtx_);
        return count_;
    }
};

void worker(SharedCounter& counter, int iterations) {
    for (int i = 0; i < iterations; ++i) {
        counter.increment();
    }
}

int main() {
    SharedCounter counter;
    std::vector<std::thread> threads;
    
    // Launch 4 threads
    for (int i = 0; i < 4; ++i) {
        threads.emplace_back(worker, std::ref(counter), 1000);
    }
    
    // Wait for all threads
    for (auto& t : threads) {
        t.join();
    }
    
    std::cout << "Final count: " << counter.get() << std::endl;
    // Expected: 4000
}
```

### Pros and Cons of Bus-Based Approach

**Pros:**
- Direct access to shared data
- Low latency for frequent access
- Familiar programming model
- Good for read-heavy workloads

**Cons:**
- Requires careful synchronization (deadlock risk)
- Lock contention can reduce performance
- Complex to reason about with many threads
- Memory visibility issues across cores

---

## 2. Queue-Based Approach (Message Passing)

In the queue-based approach, threads communicate by sending messages through queues. This decouples threads and reduces direct shared state.

### Example: Producer-Consumer with Queue

```cpp
#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <iostream>
#include <vector>

template<typename T>
class ThreadSafeQueue {
private:
    std::queue<T> queue_;
    std::mutex mtx_;
    std::condition_variable cv_;
    bool shutdown_ = false;

public:
    void push(const T& item) {
        std::lock_guard<std::mutex> lock(mtx_);
        queue_.push(item);
        cv_.notify_one();
    }

    bool pop(T& item) {
        std::unique_lock<std::mutex> lock(mtx_);
        cv_.wait(lock, [this] { return !queue_.empty() || shutdown_; });
        
        if (shutdown_ && queue_.empty()) {
            return false;
        }
        
        item = queue_.front();
        queue_.pop();
        return true;
    }

    void shutdown() {
        std::lock_guard<std::mutex> lock(mtx_);
        shutdown_ = true;
        cv_.notify_all();
    }
};

void producer(ThreadSafeQueue<int>& queue, int id, int count) {
    for (int i = 0; i < count; ++i) {
        queue.push(id * 1000 + i);
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
}

void consumer(ThreadSafeQueue<int>& queue, int id) {
    int item;
    while (queue.pop(item)) {
        std::cout << "Consumer " << id << " processed: " << item << std::endl;
    }
}

int main() {
    ThreadSafeQueue<int> queue;
    
    // Start consumers
    std::vector<std::thread> consumers;
    for (int i = 0; i < 2; ++i) {
        consumers.emplace_back(consumer, std::ref(queue), i);
    }
    
    // Start producers
    std::vector<std::thread> producers;
    for (int i = 0; i < 3; ++i) {
        producers.emplace_back(producer, std::ref(queue), i, 10);
    }
    
    // Wait for producers
    for (auto& t : producers) {
        t.join();
    }
    
    // Shutdown queue and wait for consumers
    queue.shutdown();
    for (auto& t : consumers) {
        t.join();
    }
}
```

### Pros and Cons of Queue-Based Approach

**Pros:**
- Clear separation of concerns
- Natural backpressure handling
- Easier to reason about (fewer race conditions)
- Good for producer-consumer patterns
- Can be extended to distributed systems

**Cons:**
- Higher latency (message copying)
- Memory overhead (queue storage)
- More complex for simple operations
- Potential for queue overflow

---

## 3. Atomic Operations (Lock-Free)

For simple operations, atomic types provide lock-free synchronization with better performance than mutexes.

### Example: Lock-Free Counter

```cpp
#include <thread>
#include <atomic>
#include <vector>
#include <iostream>

class LockFreeCounter {
private:
    std::atomic<int> count_{0};

public:
    void increment() {
        count_.fetch_add(1, std::memory_order_relaxed);
    }

    int get() const {
        return count_.load(std::memory_order_relaxed);
    }
};

void worker(LockFreeCounter& counter, int iterations) {
    for (int i = 0; i < iterations; ++i) {
        counter.increment();
    }
}

int main() {
    LockFreeCounter counter;
    std::vector<std::thread> threads;
    
    for (int i = 0; i < 4; ++i) {
        threads.emplace_back(worker, std::ref(counter), 1000);
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    std::cout << "Final count: " << counter.get() << std::endl;
    // Expected: 4000, but much faster than mutex version
}
```

### Memory Ordering Options

```cpp
// Relaxed: No ordering guarantees, just atomicity
counter.fetch_add(1, std::memory_order_relaxed);

// Acquire-Release: Synchronization between threads
std::atomic<bool> ready{false};
std::atomic<int> data{0};

// Thread 1 (producer)
data.store(42, std::memory_order_relaxed);
ready.store(true, std::memory_order_release);

// Thread 2 (consumer)
if (ready.load(std::memory_order_acquire)) {
    int value = data.load(std::memory_order_relaxed);
    // Guaranteed to see data = 42
}

// Sequential Consistency (default, strongest)
counter.fetch_add(1); // Equivalent to memory_order_seq_cst
```

---

## 4. Lock-Free Data Structures

For more complex operations, lock-free data structures avoid locks entirely.

### Example: Lock-Free Stack

```cpp
#include <atomic>
#include <memory>

template<typename T>
class LockFreeStack {
private:
    struct Node {
        T data;
        Node* next;
        Node(const T& d) : data(d), next(nullptr) {}
    };

    std::atomic<Node*> head_{nullptr};

public:
    void push(const T& data) {
        Node* new_node = new Node(data);
        Node* old_head = head_.load();
        do {
            new_node->next = old_head;
        } while (!head_.compare_exchange_weak(old_head, new_node));
    }

    bool pop(T& result) {
        Node* old_head = head_.load();
        do {
            if (old_head == nullptr) {
                return false;
            }
        } while (!head_.compare_exchange_weak(old_head, old_head->next));
        
        result = old_head->data;
        delete old_head;
        return true;
    }
};
```

---

## 5. Comparison Table

| Approach | Latency | Throughput | Complexity | Use Cases |
|----------|---------|------------|------------|-----------|
| **Bus (Mutex)** | Low | Medium | Medium | Shared counters, simple shared state |
| **Queue** | Medium | High | Medium | Producer-consumer, pipeline processing |
| **Atomic** | Very Low | Very High | Low | Simple counters, flags, reference counting |
| **Lock-Free** | Low | High | High | High-performance data structures |

---

## 6. Hybrid Approaches

In practice, you often combine multiple approaches:

### Example: Shared State with Message Queue for Updates

```cpp
#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <map>

class HybridResourceManager {
private:
    // Shared state (bus-based)
    std::map<int, int> data_;
    std::mutex data_mtx_;
    
    // Update queue (queue-based)
    struct Update {
        int key;
        int value;
    };
    std::queue<Update> update_queue_;
    std::mutex queue_mtx_;
    std::condition_variable queue_cv_;
    
    // Status flag (atomic)
    std::atomic<bool> running_{true};

public:
    // Fast read path (bus-based with mutex)
    int get(int key) {
        std::lock_guard<std::mutex> lock(data_mtx_);
        auto it = data_.find(key);
        return (it != data_.end()) ? it->second : 0;
    }
    
    // Async update path (queue-based)
    void update_async(int key, int value) {
        std::lock_guard<std::mutex> lock(queue_mtx_);
        update_queue_.push({key, value});
        queue_cv_.notify_one();
    }
    
    // Worker thread processes updates
    void worker_thread() {
        while (running_ || !update_queue_.empty()) {
            std::unique_lock<std::mutex> lock(queue_mtx_);
            queue_cv_.wait(lock, [this] {
                return !update_queue_.empty() || !running_;
            });
            
            if (update_queue_.empty()) continue;
            
            Update update = update_queue_.front();
            update_queue_.pop();
            lock.unlock();
            
            // Apply update to shared state
            {
                std::lock_guard<std::mutex> data_lock(data_mtx_);
                data_[update.key] = update.value;
            }
        }
    }
    
    void shutdown() {
        running_ = false;
        queue_cv_.notify_all();
    }
};
```

---

## 7. Performance Considerations

### When to Use Each Approach

**Use Bus-Based (Mutex) when:**
- Simple shared state (counters, flags)
- Read-heavy workloads
- Low contention scenarios
- Need direct access to data

**Use Queue-Based when:**
- Producer-consumer patterns
- Need backpressure handling
- Want to decouple threads
- Processing pipelines
- Distributed system preparation

**Use Atomic when:**
- Simple operations (increment, compare-and-swap)
- High contention scenarios
- Performance is critical
- Lock-free algorithms

**Use Lock-Free when:**
- Maximum performance needed
- Can handle complexity
- Building reusable data structures
- Real-time systems

---

## 8. Best Practices

1. **Minimize shared state**: Prefer message passing when possible
2. **Use appropriate granularity**: Fine-grained locks vs coarse-grained
3. **Avoid lock contention**: Use lock-free for hot paths
4. **Profile before optimizing**: Measure actual performance
5. **Consider memory ordering**: Understand memory_order semantics
6. **Handle shutdown gracefully**: Clean thread termination
7. **Test thoroughly**: Concurrency bugs are hard to reproduce

---

## 9. Common Pitfalls

### Deadlock with Multiple Locks

```cpp
// BAD: Potential deadlock
void transfer(Account& from, Account& to, int amount) {
    std::lock_guard<std::mutex> lock1(from.mtx_);
    std::lock_guard<std::mutex> lock2(to.mtx_);
    // ...
}

// GOOD: Always lock in same order
void transfer(Account& from, Account& to, int amount) {
    auto lock1 = std::unique_lock<std::mutex>(from.mtx_, std::defer_lock);
    auto lock2 = std::unique_lock<std::mutex>(to.mtx_, std::defer_lock);
    std::lock(lock1, lock2); // Deadlock-safe
    // ...
}
```

### False Sharing

```cpp
// BAD: False sharing
struct Counter {
    int count1;  // Cache line
    int count2;  // Same cache line
};

// GOOD: Separate cache lines
struct Counter {
    alignas(64) int count1;  // Separate cache line
    alignas(64) int count2;  // Separate cache line
};
```

---

## 10. Real-World Example: Thread Pool with Work Queue

```cpp
#include <thread>
#include <vector>
#include <queue>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <future>

class ThreadPool {
private:
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex queue_mtx_;
    std::condition_variable condition_;
    bool stop_ = false;

public:
    ThreadPool(size_t num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this] {
                while (true) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lock(queue_mtx_);
                        condition_.wait(lock, [this] {
                            return stop_ || !tasks_.empty();
                        });
                        
                        if (stop_ && tasks_.empty()) {
                            return;
                        }
                        
                        task = std::move(tasks_.front());
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
    }

    template<typename F, typename... Args>
    auto enqueue(F&& f, Args&&... args) -> std::future<typename std::result_of<F(Args...)>::type> {
        using return_type = typename std::result_of<F(Args...)>::type;
        
        auto task = std::make_shared<std::packaged_task<return_type()>>(
            std::bind(std::forward<F>(f), std::forward<Args>(args)...)
        );
        
        std::future<return_type> result = task->get_future();
        {
            std::unique_lock<std::mutex> lock(queue_mtx_);
            if (stop_) {
                throw std::runtime_error("enqueue on stopped ThreadPool");
            }
            tasks_.emplace([task](){ (*task)(); });
        }
        condition_.notify_one();
        return result;
    }

    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mtx_);
            stop_ = true;
        }
        condition_.notify_all();
        for (std::thread& worker : workers_) {
            worker.join();
        }
    }
};
```

---

## Conclusion

Choosing the right resource sharing mechanism depends on your specific use case:

- **Bus-based (mutex)**: Simple, familiar, good for low-contention scenarios
- **Queue-based**: Decoupled, scalable, ideal for producer-consumer patterns
- **Atomic**: High-performance for simple operations
- **Lock-free**: Maximum performance for complex data structures

Consider your performance requirements, contention levels, and complexity tolerance when making the choice. Often, a hybrid approach combining multiple techniques works best.

