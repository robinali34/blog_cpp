---
layout: post
title: "C++ STL Concurrency Support Guide: Thread-Safe Containers, Atomic Operations, and Synchronization Primitives"
date: 2025-12-02 00:00:00 -0800
categories: cpp stl concurrency thread-safe atomic synchronization
permalink: /2025/12/02/cpp-stl-concurrency-support-guide/
tags: [cpp, stl, concurrency, thread-safe, atomic, mutex, condition_variable, shared_mutex, lock_guard, unique_lock]
excerpt: "A comprehensive guide to C++ STL concurrency support covering thread-safe primitives, atomic operations, synchronization mechanisms, scenarios, examples, and common practices."
---

# C++ STL Concurrency Support Guide: Thread-Safe Containers, Atomic Operations, and Synchronization Primitives

The C++ Standard Library provides comprehensive concurrency support through synchronization primitives, atomic operations, and thread-safe utilities. This guide covers all STL concurrency features, their use cases, practical examples, and best practices.

## Table of Contents

1. [Introduction to STL Concurrency](#introduction-to-stl-concurrency)
2. [Synchronization Primitives](#synchronization-primitives)
3. [Atomic Operations](#atomic-operations)
4. [Thread-Safe Patterns](#thread-safe-patterns)
5. [Common Scenarios](#common-scenarios)
6. [Practical Examples](#practical-examples)
7. [Common Practices](#common-practices)
8. [Common Pitfalls and Mistakes](#common-pitfalls-and-mistakes)

---

## Introduction to STL Concurrency

### What STL Provides for Concurrency

The C++ Standard Library includes:

1. **Synchronization Primitives**: `mutex`, `condition_variable`, `shared_mutex`
2. **Lock Management**: `lock_guard`, `unique_lock`, `scoped_lock`
3. **Atomic Operations**: `atomic<T>` for lock-free programming
4. **Thread Management**: `thread`, `this_thread`
5. **Async Operations**: `async`, `future`, `promise`
6. **Thread-Local Storage**: `thread_local`

### Thread Safety Guarantees

**STL Containers are NOT thread-safe by default:**
- Multiple threads reading: OK (if no writes)
- Multiple threads writing: Requires synchronization
- Mixed reads/writes: Requires synchronization

**STL Concurrency Primitives ARE thread-safe:**
- `std::mutex`, `std::atomic`, etc. are thread-safe
- Use them to protect shared data

---

## Synchronization Primitives

### std::mutex

Basic mutual exclusion lock:

```cpp
#include <mutex>
#include <thread>
#include <iostream>
using namespace std;

mutex mtx;
int sharedCounter = 0;

void increment() {
    for (int i = 0; i < 1000; ++i) {
        lock_guard<mutex> lock(mtx);
        sharedCounter++;
    }
}

void mutexExample() {
    thread t1(increment);
    thread t2(increment);
    
    t1.join();
    t2.join();
    
    cout << "Counter: " << sharedCounter << endl;  // 2000
}
```

### std::recursive_mutex

Allows same thread to lock multiple times:

```cpp
#include <mutex>
#include <iostream>
using namespace std;

recursive_mutex rmtx;

void recursiveFunction(int depth) {
    lock_guard<recursive_mutex> lock(rmtx);
    cout << "Depth: " << depth << endl;
    
    if (depth > 0) {
        recursiveFunction(depth - 1);  // Can lock again
    }
}

void recursiveMutexExample() {
    recursiveFunction(3);
}
```

### std::timed_mutex

Mutex with timeout support:

```cpp
#include <mutex>
#include <thread>
#include <chrono>
#include <iostream>
using namespace std;

timed_mutex tmtx;

void tryLockWithTimeout() {
    if (tmtx.try_lock_for(chrono::milliseconds(100))) {
        cout << "Lock acquired" << endl;
        this_thread::sleep_for(chrono::milliseconds(200));
        tmtx.unlock();
    } else {
        cout << "Failed to acquire lock" << endl;
    }
}

void timedMutexExample() {
    thread t1(tryLockWithTimeout);
    thread t2(tryLockWithTimeout);
    
    t1.join();
    t2.join();
}
```

### std::shared_mutex (C++17)

Allows multiple readers or exclusive writer:

```cpp
#include <shared_mutex>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

shared_mutex smtx;
int data = 0;

void reader(int id) {
    shared_lock<shared_mutex> lock(smtx);
    cout << "Reader " << id << " reads: " << data << endl;
}

void writer(int value) {
    unique_lock<shared_mutex> lock(smtx);
    data = value;
    cout << "Writer writes: " << value << endl;
}

void sharedMutexExample() {
    vector<thread> readers;
    
    // Multiple readers
    for (int i = 0; i < 5; ++i) {
        readers.emplace_back(reader, i);
    }
    
    // Single writer
    thread writerThread(writer, 42);
    
    for (auto& t : readers) {
        t.join();
    }
    writerThread.join();
}
```

### std::condition_variable

Synchronize threads based on conditions:

```cpp
#include <condition_variable>
#include <mutex>
#include <queue>
#include <thread>
#include <iostream>
using namespace std;

queue<int> dataQueue;
mutex mtx;
condition_variable cv;
bool done = false;

void producer() {
    for (int i = 0; i < 5; ++i) {
        {
            lock_guard<mutex> lock(mtx);
            dataQueue.push(i);
        }
        cv.notify_one();
        this_thread::sleep_for(chrono::milliseconds(100));
    }
    
    {
        lock_guard<mutex> lock(mtx);
        done = true;
    }
    cv.notify_all();
}

void consumer() {
    while (true) {
        unique_lock<mutex> lock(mtx);
        cv.wait(lock, [] { return !dataQueue.empty() || done; });
        
        if (dataQueue.empty() && done) break;
        
        if (!dataQueue.empty()) {
            int value = dataQueue.front();
            dataQueue.pop();
            lock.unlock();
            cout << "Consumed: " << value << endl;
        }
    }
}

void conditionVariableExample() {
    thread prod(producer);
    thread cons(consumer);
    
    prod.join();
    cons.join();
}
```

---

## Atomic Operations

### std::atomic Basics

Lock-free atomic operations:

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

atomic<int> counter{0};

void increment() {
    for (int i = 0; i < 1000; ++i) {
        counter.fetch_add(1, memory_order_relaxed);
    }
}

void atomicExample() {
    vector<thread> threads;
    
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back(increment);
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Counter: " << counter << endl;  // 10000
}
```

### Memory Ordering

```cpp
#include <atomic>
#include <thread>
#include <iostream>
using namespace std;

atomic<bool> ready{false};
atomic<int> data{0};

void producer() {
    data.store(42, memory_order_relaxed);
    ready.store(true, memory_order_release);  // Release semantics
}

void consumer() {
    while (!ready.load(memory_order_acquire)) {  // Acquire semantics
        this_thread::yield();
    }
    cout << "Data: " << data.load(memory_order_relaxed) << endl;
}

void memoryOrderingExample() {
    thread prod(producer);
    thread cons(consumer);
    
    prod.join();
    cons.join();
}
```

### Atomic Operations on Different Types

```cpp
#include <atomic>
#include <iostream>
using namespace std;

void atomicTypesExample() {
    // Integer types
    atomic<int> intAtomic{42};
    atomic<long> longAtomic{100L};
    
    // Boolean
    atomic<bool> boolAtomic{true};
    
    // Pointer
    int value = 42;
    atomic<int*> ptrAtomic{&value};
    
    // Operations
    intAtomic.fetch_add(1);
    boolAtomic.store(false);
    ptrAtomic.store(nullptr);
    
    // Compare and swap
    int expected = 42;
    bool success = intAtomic.compare_exchange_weak(expected, 100);
    cout << "CAS success: " << success << endl;
}
```

---

## Thread-Safe Patterns

### Lock Guards

RAII-based lock management:

```cpp
#include <mutex>
#include <vector>
#include <thread>
using namespace std;

mutex mtx;
vector<int> sharedData;

void safePush(int value) {
    lock_guard<mutex> lock(mtx);  // Automatically unlocks
    sharedData.push_back(value);
    // Lock released here
}

void lockGuardExample() {
    vector<thread> threads;
    
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back(safePush, i);
    }
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### Unique Lock

Flexible lock with manual control:

```cpp
#include <mutex>
#include <condition_variable>
using namespace std;

mutex mtx;
condition_variable cv;
bool ready = false;

void uniqueLockExample() {
    unique_lock<mutex> lock(mtx);
    
    // Can unlock manually
    lock.unlock();
    
    // Can lock again
    lock.lock();
    
    // Can use with condition variables
    cv.wait(lock, [] { return ready; });
    
    // Automatically unlocks
}
```

### Scoped Lock (C++17)

Lock multiple mutexes atomically:

```cpp
#include <mutex>
using namespace std;

mutex mtx1, mtx2;

void scopedLockExample() {
    // Locks both, unlocks both (prevents deadlock)
    scoped_lock lock(mtx1, mtx2);
    
    // Critical section
    // Both unlocked here
}
```

### Once Flag

Execute function exactly once:

```cpp
#include <mutex>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

once_flag flag;

void initialize() {
    cout << "Initialized once" << endl;
}

void callOnceExample() {
    vector<thread> threads;
    
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([]() {
            call_once(flag, initialize);
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    // "Initialized once" printed only once
}
```

---

## Common Scenarios

### Scenario 1: Thread-Safe Counter

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

class ThreadSafeCounter {
    atomic<int> count_{0};
    
public:
    void increment() {
        count_.fetch_add(1, memory_order_relaxed);
    }
    
    void decrement() {
        count_.fetch_sub(1, memory_order_relaxed);
    }
    
    int get() const {
        return count_.load(memory_order_acquire);
    }
};

void counterScenario() {
    ThreadSafeCounter counter;
    vector<thread> threads;
    
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([&counter]() {
            for (int j = 0; j < 100; ++j) {
                counter.increment();
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Final count: " << counter.get() << endl;  // 1000
}
```

### Scenario 2: Thread-Safe Queue

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
using namespace std;

template<typename T>
class ThreadSafeQueue {
    queue<T> queue_;
    mutex mtx_;
    condition_variable cv_;
    
public:
    void push(const T& item) {
        {
            lock_guard<mutex> lock(mtx_);
            queue_.push(item);
        }
        cv_.notify_one();
    }
    
    bool pop(T& item) {
        unique_lock<mutex> lock(mtx_);
        cv_.wait(lock, [this] { return !queue_.empty(); });
        
        item = queue_.front();
        queue_.pop();
        return true;
    }
    
    bool empty() const {
        lock_guard<mutex> lock(mtx_);
        return queue_.empty();
    }
};

void queueScenario() {
    ThreadSafeQueue<int> tsq;
    
    thread producer([&tsq]() {
        for (int i = 0; i < 10; ++i) {
            tsq.push(i);
        }
    });
    
    thread consumer([&tsq]() {
        int value;
        while (!tsq.empty() || true) {
            if (tsq.pop(value)) {
                cout << "Popped: " << value << endl;
            }
        }
    });
    
    producer.join();
    consumer.join();
}
```

### Scenario 3: Read-Write Lock Pattern

```cpp
#include <shared_mutex>
#include <thread>
#include <vector>
using namespace std;

class ReadWriteData {
    int data_ = 0;
    mutable shared_mutex mtx_;
    
public:
    int read() const {
        shared_lock<shared_mutex> lock(mtx_);
        return data_;
    }
    
    void write(int value) {
        unique_lock<shared_mutex> lock(mtx_);
        data_ = value;
    }
};

void readWriteScenario() {
    ReadWriteData rwData;
    vector<thread> readers;
    
    // Multiple readers
    for (int i = 0; i < 5; ++i) {
        readers.emplace_back([&rwData, i]() {
            for (int j = 0; j < 10; ++j) {
                int value = rwData.read();
                cout << "Reader " << i << " read: " << value << endl;
            }
        });
    }
    
    // Single writer
    thread writer([&rwData]() {
        for (int i = 0; i < 5; ++i) {
            rwData.write(i);
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    });
    
    for (auto& t : readers) {
        t.join();
    }
    writer.join();
}
```

### Scenario 4: Producer-Consumer with Condition Variable

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <iostream>
using namespace std;

template<typename T>
class ProducerConsumer {
    queue<T> buffer_;
    mutex mtx_;
    condition_variable notFull_;
    condition_variable notEmpty_;
    size_t maxSize_;
    bool done_ = false;
    
public:
    ProducerConsumer(size_t maxSize) : maxSize_(maxSize) {}
    
    void produce(const T& item) {
        unique_lock<mutex> lock(mtx_);
        notFull_.wait(lock, [this] { return buffer_.size() < maxSize_; });
        buffer_.push(item);
        notEmpty_.notify_one();
    }
    
    bool consume(T& item) {
        unique_lock<mutex> lock(mtx_);
        notEmpty_.wait(lock, [this] { return !buffer_.empty() || done_; });
        
        if (buffer_.empty() && done_) {
            return false;
        }
        
        item = buffer_.front();
        buffer_.pop();
        notFull_.notify_one();
        return true;
    }
    
    void finish() {
        lock_guard<mutex> lock(mtx_);
        done_ = true;
        notEmpty_.notify_all();
    }
};

void producerConsumerScenario() {
    ProducerConsumer<int> pc(5);
    
    thread producer([&pc]() {
        for (int i = 0; i < 10; ++i) {
            pc.produce(i);
            this_thread::sleep_for(chrono::milliseconds(50));
        }
        pc.finish();
    });
    
    thread consumer([&pc]() {
        int item;
        while (pc.consume(item)) {
            cout << "Consumed: " << item << endl;
        }
    });
    
    producer.join();
    consumer.join();
}
```

---

## Practical Examples

### Example 1: Thread-Safe Singleton

```cpp
#include <mutex>
#include <atomic>
using namespace std;

class Singleton {
    static atomic<Singleton*> instance_;
    static mutex mtx_;
    
    Singleton() = default;
    
public:
    static Singleton* getInstance() {
        Singleton* tmp = instance_.load(memory_order_acquire);
        if (tmp == nullptr) {
            lock_guard<mutex> lock(mtx_);
            tmp = instance_.load(memory_order_relaxed);
            if (tmp == nullptr) {
                tmp = new Singleton();
                instance_.store(tmp, memory_order_release);
            }
        }
        return tmp;
    }
};

atomic<Singleton*> Singleton::instance_{nullptr};
mutex Singleton::mtx_;
```

### Example 2: Thread Pool with Atomic Counter

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <functional>
#include <queue>
#include <mutex>
#include <condition_variable>
using namespace std;

class ThreadPool {
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> stop_{false};
    atomic<int> activeTasks_{0};
    
public:
    ThreadPool(size_t numThreads) {
        for (size_t i = 0; i < numThreads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(mtx_);
                        cv_.wait(lock, [this] { 
                            return stop_ || !tasks_.empty(); 
                        });
                        
                        if (stop_ && tasks_.empty()) return;
                        
                        task = move(tasks_.front());
                        tasks_.pop();
                        activeTasks_++;
                    }
                    task();
                    activeTasks_--;
                }
            });
        }
    }
    
    template<typename F>
    void enqueue(F&& f) {
        {
            lock_guard<mutex> lock(mtx_);
            tasks_.emplace(forward<F>(f));
        }
        cv_.notify_one();
    }
    
    int getActiveTasks() const {
        return activeTasks_.load();
    }
    
    ~ThreadPool() {
        stop_ = true;
        cv_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};
```

### Example 3: Lock-Free Stack

```cpp
#include <atomic>
#include <memory>
using namespace std;

template<typename T>
class LockFreeStack {
    struct Node {
        shared_ptr<T> data;
        Node* next;
        Node(const T& d) : data(make_shared<T>(d)) {}
    };
    
    atomic<Node*> head_{nullptr};
    
public:
    void push(const T& data) {
        Node* new_node = new Node(data);
        new_node->next = head_.load();
        
        while (!head_.compare_exchange_weak(new_node->next, new_node)) {
            // Retry
        }
    }
    
    shared_ptr<T> pop() {
        Node* old_head = head_.load();
        while (old_head && 
               !head_.compare_exchange_weak(old_head, old_head->next)) {
            // Retry
        }
        return old_head ? old_head->data : shared_ptr<T>();
    }
};
```

---

## Common Practices

### 1. Always Use RAII Locks

```cpp
// Good: Automatic unlock
{
    lock_guard<mutex> lock(mtx_);
    // Critical section
}

// Bad: Manual unlock (error-prone)
mtx_.lock();
// Critical section
mtx_.unlock();  // What if exception occurs?
```

### 2. Minimize Lock Scope

```cpp
// Good: Small critical section
void goodExample() {
    int value;
    {
        lock_guard<mutex> lock(mtx_);
        value = sharedData_;
    }
    // Expensive computation outside lock
    process(value);
}

// Bad: Large critical section
void badExample() {
    lock_guard<mutex> lock(mtx_);
    int value = sharedData_;
    process(value);  // Blocks other threads
}
```

### 3. Use Atomic for Simple Operations

```cpp
// Good: Atomic for simple counter
atomic<int> counter{0};
counter.fetch_add(1);

// Overkill: Mutex for simple operation
mutex mtx;
int counter = 0;
lock_guard<mutex> lock(mtx);
counter++;
```

### 4. Consistent Lock Ordering

```cpp
// Good: Always lock in same order
void function1() {
    scoped_lock lock(mtx1_, mtx2_);
}

void function2() {
    scoped_lock lock(mtx1_, mtx2_);  // Same order
}

// Bad: Different order (deadlock risk)
void bad1() {
    lock_guard<mutex> lock1(mtx1_);
    lock_guard<mutex> lock2(mtx2_);
}

void bad2() {
    lock_guard<mutex> lock2(mtx2_);  // Different order!
    lock_guard<mutex> lock1(mtx1_);
}
```

### 5. Use Condition Variables with Predicates

```cpp
// Good: Always use predicate
cv.wait(lock, [] { return condition; });

// Bad: Spurious wakeups possible
cv.wait(lock);  // May wake up without condition being true
```

---

## Common Pitfalls and Mistakes

### Pitfall 1: Data Races

```cpp
// Bad: Unsynchronized access
int counter = 0;
void increment() {
    counter++;  // Data race!
}

// Good: Synchronized
mutex mtx;
int counter = 0;
void increment() {
    lock_guard<mutex> lock(mtx);
    counter++;
}
```

### Pitfall 2: Deadlocks

```cpp
// Bad: Circular lock dependency
void function1() {
    lock_guard<mutex> lock1(mtx1_);
    lock_guard<mutex> lock2(mtx2_);
}

void function2() {
    lock_guard<mutex> lock2(mtx2_);  // Different order
    lock_guard<mutex> lock1(mtx1_);
}

// Good: Use scoped_lock or consistent order
void good1() {
    scoped_lock lock(mtx1_, mtx2_);
}

void good2() {
    scoped_lock lock(mtx1_, mtx2_);  // Same order
}
```

### Pitfall 3: Forgetting to Unlock

```cpp
// Bad: Exception may prevent unlock
void badExample() {
    mtx_.lock();
    riskyOperation();  // May throw
    mtx_.unlock();  // Never reached if exception
}

// Good: RAII automatically unlocks
void goodExample() {
    lock_guard<mutex> lock(mtx_);
    riskyOperation();  // Unlock guaranteed
}
```

### Pitfall 4: Spurious Wakeups

```cpp
// Bad: No predicate check
void badWait() {
    unique_lock<mutex> lock(mtx_);
    cv_.wait(lock);  // May wake up spuriously
    // Condition may not be true!
}

// Good: Always use predicate
void goodWait() {
    unique_lock<mutex> lock(mtx_);
    cv_.wait(lock, [] { return condition; });
    // Condition guaranteed to be true
}
```

### Pitfall 5: Atomic Doesn't Protect the Object

```cpp
// Bad: Atomic only protects the pointer, not the object
atomic<MyClass*> ptr{nullptr};

void badExample() {
    MyClass* obj = ptr.load();
    obj->modify();  // Not thread-safe!
}

// Good: Protect object access
void goodExample() {
    MyClass* obj = ptr.load();
    lock_guard<mutex> lock(objMtx_);
    obj->modify();  // Thread-safe
}
```

### Pitfall 6: Wrong Memory Ordering

```cpp
// Bad: May not see updates
void badExample() {
    atomic<bool> ready{false};
    int data = 0;
    
    thread t1([&]() {
        data = 42;
        ready.store(true, memory_order_relaxed);  // No ordering guarantee
    });
    
    thread t2([&]() {
        while (!ready.load(memory_order_relaxed)) {}
        // data may not be 42!
        cout << data << endl;
    });
}

// Good: Proper ordering
void goodExample() {
    atomic<bool> ready{false};
    int data = 0;
    
    thread t1([&]() {
        data = 42;
        ready.store(true, memory_order_release);  // Release semantics
    });
    
    thread t2([&]() {
        while (!ready.load(memory_order_acquire)) {}  // Acquire semantics
        cout << data << endl;  // Guaranteed to see 42
    });
}
```

### Pitfall 7: Race Condition in Initialization

```cpp
// Bad: Check-then-act race
if (instance_ == nullptr) {
    instance_ = new Singleton();  // Race condition!
}

// Good: Double-checked locking
Singleton* getInstance() {
    Singleton* tmp = instance_.load(memory_order_acquire);
    if (tmp == nullptr) {
        lock_guard<mutex> lock(mtx_);
        tmp = instance_.load(memory_order_relaxed);
        if (tmp == nullptr) {
            tmp = new Singleton();
            instance_.store(tmp, memory_order_release);
        }
    }
    return tmp;
}
```

---

## Summary

STL concurrency support provides:

- **Synchronization primitives**: `mutex`, `condition_variable`, `shared_mutex`
- **Lock management**: RAII-based `lock_guard`, `unique_lock`, `scoped_lock`
- **Atomic operations**: Lock-free programming with `atomic<T>`
- **Thread utilities**: `thread`, `this_thread`, `thread_local`

Key takeaways:

1. **STL containers are NOT thread-safe**: Protect with mutexes
2. **Always use RAII locks**: `lock_guard`, `unique_lock`, `scoped_lock`
3. **Minimize lock scope**: Keep critical sections small
4. **Use atomic for simple operations**: More efficient than mutexes
5. **Prevent deadlocks**: Use `scoped_lock` or consistent lock ordering
6. **Use predicates with condition variables**: Prevent spurious wakeups
7. **Understand memory ordering**: Choose appropriate memory order for atomics
8. **Avoid common pitfalls**: Data races, deadlocks, race conditions

STL concurrency primitives are powerful tools for writing safe, efficient concurrent code when used correctly.

