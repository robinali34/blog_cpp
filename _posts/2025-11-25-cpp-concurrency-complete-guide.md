---
layout: post
title: "C++ Concurrency Complete Guide: How It Works, Scenarios, Examples, and Common Practices"
date: 2025-11-25 00:00:00 -0700
categories: cpp concurrency multithreading parallel-programming async
permalink: /2025/11/25/cpp-concurrency-complete-guide/
tags: [cpp, concurrency, multithreading, parallel-programming, async, thread-pool, producer-consumer, race-condition, deadlock, lock-free]
excerpt: "A comprehensive guide to C++ concurrency covering execution models, synchronization primitives, common patterns, real-world scenarios, and best practices for writing safe and efficient concurrent code."
---

# C++ Concurrency Complete Guide: How It Works, Scenarios, Examples, and Common Practices

Concurrency in C++ allows multiple tasks to execute simultaneously, improving performance and responsiveness. This guide covers how concurrency works, when to use it, practical examples, and common patterns used in production code.

## Table of Contents

1. [How Concurrency Works](#how-concurrency-works)
2. [Concurrency Models](#concurrency-models)
3. [Common Scenarios](#common-scenarios)
4. [Practical Examples](#practical-examples)
5. [Common Patterns and Practices](#common-patterns-and-practices)
6. [Best Practices](#best-practices)
7. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## How Concurrency Works

### Understanding Concurrency vs Parallelism

**Concurrency**: Multiple tasks making progress (not necessarily simultaneously)
**Parallelism**: Multiple tasks executing simultaneously (requires multiple CPU cores)

```cpp
#include <iostream>
#include <thread>
#include <chrono>
using namespace std;

// Concurrent execution (tasks interleave)
void concurrentExample() {
    thread t1([]() {
        for (int i = 0; i < 5; ++i) {
            cout << "Task 1: " << i << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    });
    
    thread t2([]() {
        for (int i = 0; i < 5; ++i) {
            cout << "Task 2: " << i << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    });
    
    t1.join();
    t2.join();
    // Output interleaves: Task 1: 0, Task 2: 0, Task 1: 1, Task 2: 1...
}
```

### Execution Models

#### 1. Single-Threaded Execution

```cpp
void singleThreaded() {
    task1();  // Complete before task2 starts
    task2();  // Complete before task3 starts
    task3();
}
```

#### 2. Multi-Threaded Execution

```cpp
#include <thread>
#include <vector>
using namespace std;

void multiThreaded() {
    vector<thread> threads;
    
    threads.emplace_back(task1);
    threads.emplace_back(task2);
    threads.emplace_back(task3);
    
    for (auto& t : threads) {
        t.join();  // Wait for all to complete
    }
}
```

#### 3. Asynchronous Execution

```cpp
#include <future>
#include <iostream>
using namespace std;

void asyncExecution() {
    // Launch async task
    auto future = async(launch::async, []() {
        return computeExpensiveTask();
    });
    
    // Do other work while task runs
    doOtherWork();
    
    // Get result when ready
    int result = future.get();
}
```

### Thread Lifecycle

```cpp
#include <thread>
#include <iostream>
using namespace std;

void threadLifecycle() {
    thread t([]() {
        cout << "Thread running" << endl;
    });
    
    // Thread states:
    // 1. Created (t is constructed)
    // 2. Running (executing)
    // 3. Joinable (finished, can be joined)
    // 4. Detached (can't be joined)
    
    if (t.joinable()) {
        t.join();  // Wait for completion
    }
    
    // After join, thread is no longer joinable
}
```

### Memory Model and Visibility

```cpp
#include <atomic>
#include <thread>
#include <iostream>
using namespace std;

void memoryModel() {
    // Without synchronization: undefined behavior
    int unsafeCounter = 0;
    
    // With atomic: safe
    atomic<int> safeCounter{0};
    
    thread t1([&safeCounter]() {
        for (int i = 0; i < 1000; ++i) {
            safeCounter.fetch_add(1);
        }
    });
    
    thread t2([&safeCounter]() {
        for (int i = 0; i < 1000; ++i) {
            safeCounter.fetch_add(1);
        }
    });
    
    t1.join();
    t2.join();
    
    cout << "Counter: " << safeCounter << endl;  // Always 2000
}
```

---

## Concurrency Models

### 1. Shared Memory Model

Threads share the same memory space and communicate through shared variables:

```cpp
#include <mutex>
#include <thread>
#include <vector>
using namespace std;

class SharedMemoryCounter {
    int counter_ = 0;
    mutex mtx_;
    
public:
    void increment() {
        lock_guard<mutex> lock(mtx_);
        counter_++;
    }
    
    int get() {
        lock_guard<mutex> lock(mtx_);
        return counter_;
    }
};

void sharedMemoryExample() {
    SharedMemoryCounter counter;
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

### 2. Message Passing Model

Threads communicate by sending messages through queues:

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
using namespace std;

template<typename T>
class MessageQueue {
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
    
    T pop() {
        unique_lock<mutex> lock(mtx_);
        cv_.wait(lock, [this] { return !queue_.empty(); });
        T item = queue_.front();
        queue_.pop();
        return item;
    }
};

void messagePassingExample() {
    MessageQueue<int> queue;
    
    thread producer([&queue]() {
        for (int i = 0; i < 10; ++i) {
            queue.push(i);
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    });
    
    thread consumer([&queue]() {
        for (int i = 0; i < 10; ++i) {
            int value = queue.pop();
            cout << "Received: " << value << endl;
        }
    });
    
    producer.join();
    consumer.join();
}
```

### 3. Actor Model

Each actor processes messages sequentially:

```cpp
#include <queue>
#include <thread>
#include <functional>
#include <mutex>
using namespace std;

class Actor {
    queue<function<void()>> messages_;
    mutex mtx_;
    thread worker_;
    bool running_ = true;
    
    void processMessages() {
        while (running_) {
            function<void()> task;
            {
                lock_guard<mutex> lock(mtx_);
                if (!messages_.empty()) {
                    task = messages_.front();
                    messages_.pop();
                }
            }
            if (task) {
                task();
            } else {
                this_thread::sleep_for(chrono::milliseconds(10));
            }
        }
    }
    
public:
    Actor() : worker_(&Actor::processMessages, this) {}
    
    void send(function<void()> message) {
        lock_guard<mutex> lock(mtx_);
        messages_.push(message);
    }
    
    ~Actor() {
        running_ = false;
        worker_.join();
    }
};

void actorModelExample() {
    Actor actor;
    
    actor.send([]() { cout << "Message 1" << endl; });
    actor.send([]() { cout << "Message 2" << endl; });
    
    this_thread::sleep_for(chrono::milliseconds(100));
}
```

---

## Common Scenarios

### Scenario 1: Parallel Data Processing

Process large datasets in parallel:

```cpp
#include <vector>
#include <thread>
#include <algorithm>
#include <numeric>
using namespace std;

template<typename Iterator, typename Func>
void parallelForEach(Iterator begin, Iterator end, Func func, size_t numThreads) {
    size_t size = distance(begin, end);
    size_t chunkSize = size / numThreads;
    
    vector<thread> threads;
    auto it = begin;
    
    for (size_t i = 0; i < numThreads; ++i) {
        auto chunkEnd = (i == numThreads - 1) ? end : next(it, chunkSize);
        
        threads.emplace_back([it, chunkEnd, func]() {
            for_each(it, chunkEnd, func);
        });
        
        it = chunkEnd;
    }
    
    for (auto& t : threads) {
        t.join();
    }
}

void parallelProcessingExample() {
    vector<int> data(1000000);
    iota(data.begin(), data.end(), 1);
    
    // Square each element in parallel
    parallelForEach(data.begin(), data.end(), 
        [](int& n) { n = n * n; }, 
        thread::hardware_concurrency());
}
```

### Scenario 2: Producer-Consumer Pattern

One or more producers generate data, consumers process it:

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <vector>
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
    
    T consume() {
        unique_lock<mutex> lock(mtx_);
        notEmpty_.wait(lock, [this] { return !buffer_.empty() || done_; });
        
        if (buffer_.empty() && done_) {
            return T{};  // Sentinel value
        }
        
        T item = buffer_.front();
        buffer_.pop();
        notFull_.notify_one();
        return item;
    }
    
    void finish() {
        lock_guard<mutex> lock(mtx_);
        done_ = true;
        notEmpty_.notify_all();
    }
};

void producerConsumerExample() {
    ProducerConsumer<int> pc(10);
    
    thread producer([&pc]() {
        for (int i = 0; i < 100; ++i) {
            pc.produce(i);
            this_thread::sleep_for(chrono::milliseconds(10));
        }
        pc.finish();
    });
    
    vector<thread> consumers;
    for (int i = 0; i < 3; ++i) {
        consumers.emplace_back([&pc, i]() {
            while (true) {
                int item = pc.consume();
                if (item == 0 && pc.buffer_.empty()) break;
                cout << "Consumer " << i << " processed: " << item << endl;
            }
        });
    }
    
    producer.join();
    for (auto& c : consumers) {
        c.join();
    }
}
```

### Scenario 3: Thread Pool

Reuse threads to avoid creation overhead:

```cpp
#include <vector>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <future>
using namespace std;

class ThreadPool {
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex mtx_;
    condition_variable condition_;
    bool stop_ = false;
    
public:
    ThreadPool(size_t numThreads) {
        for (size_t i = 0; i < numThreads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(mtx_);
                        condition_.wait(lock, [this] { 
                            return stop_ || !tasks_.empty(); 
                        });
                        
                        if (stop_ && tasks_.empty()) return;
                        
                        task = move(tasks_.front());
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
    }
    
    template<typename F, typename... Args>
    auto enqueue(F&& f, Args&&... args) -> future<typename result_of<F(Args...)>::type> {
        using return_type = typename result_of<F(Args...)>::type;
        
        auto task = make_shared<packaged_task<return_type()>>(
            bind(forward<F>(f), forward<Args>(args)...)
        );
        
        future<return_type> result = task->get_future();
        {
            lock_guard<mutex> lock(mtx_);
            if (stop_) {
                throw runtime_error("enqueue on stopped ThreadPool");
            }
            tasks_.emplace([task]() { (*task)(); });
        }
        condition_.notify_one();
        return result;
    }
    
    ~ThreadPool() {
        {
            lock_guard<mutex> lock(mtx_);
            stop_ = true;
        }
        condition_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};

void threadPoolExample() {
    ThreadPool pool(4);
    vector<future<int>> results;
    
    for (int i = 0; i < 10; ++i) {
        results.emplace_back(pool.enqueue([i]() {
            this_thread::sleep_for(chrono::milliseconds(100));
            return i * i;
        }));
    }
    
    for (auto& result : results) {
        cout << "Result: " << result.get() << endl;
    }
}
```

### Scenario 4: Parallel Search

Search across multiple threads:

```cpp
#include <vector>
#include <thread>
#include <algorithm>
#include <atomic>
using namespace std;

template<typename Iterator, typename T>
Iterator parallelSearch(Iterator begin, Iterator end, const T& value, size_t numThreads) {
    size_t size = distance(begin, end);
    size_t chunkSize = size / numThreads;
    atomic<bool> found(false);
    atomic<Iterator> result(end);
    
    vector<thread> threads;
    auto it = begin;
    
    for (size_t i = 0; i < numThreads; ++i) {
        auto chunkEnd = (i == numThreads - 1) ? end : next(it, chunkSize);
        
        threads.emplace_back([it, chunkEnd, &value, &found, &result]() {
            auto localIt = find(it, chunkEnd, value);
            if (localIt != chunkEnd && !found.exchange(true)) {
                result = localIt;
            }
        });
        
        it = chunkEnd;
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    return result.load();
}

void parallelSearchExample() {
    vector<int> data(1000000);
    iota(data.begin(), data.end(), 1);
    
    auto it = parallelSearch(data.begin(), data.end(), 500000, 4);
    if (it != data.end()) {
        cout << "Found: " << *it << endl;
    }
}
```

### Scenario 5: Async I/O Operations

Handle multiple I/O operations concurrently:

```cpp
#include <future>
#include <vector>
#include <string>
#include <fstream>
#include <iostream>
using namespace std;

vector<string> readFilesAsync(const vector<string>& filenames) {
    vector<future<string>> futures;
    
    for (const auto& filename : filenames) {
        futures.push_back(async(launch::async, [filename]() {
            ifstream file(filename);
            if (!file.is_open()) {
                return string("Error reading " + filename);
            }
            string content((istreambuf_iterator<char>(file)),
                          istreambuf_iterator<char>());
            return content;
        }));
    }
    
    vector<string> results;
    for (auto& f : futures) {
        results.push_back(f.get());
    }
    
    return results;
}

void asyncIOExample() {
    vector<string> files = {"file1.txt", "file2.txt", "file3.txt"};
    auto contents = readFilesAsync(files);
    
    for (const auto& content : contents) {
        cout << "Content length: " << content.length() << endl;
    }
}
```

### Scenario 6: Parallel Reduction

Combine results from multiple threads:

```cpp
#include <vector>
#include <thread>
#include <numeric>
#include <algorithm>
using namespace std;

template<typename Iterator, typename T, typename BinaryOp>
T parallelReduce(Iterator begin, Iterator end, T init, BinaryOp op, size_t numThreads) {
    size_t size = distance(begin, end);
    size_t chunkSize = size / numThreads;
    
    vector<future<T>> futures;
    auto it = begin;
    
    for (size_t i = 0; i < numThreads; ++i) {
        auto chunkEnd = (i == numThreads - 1) ? end : next(it, chunkSize);
        
        futures.push_back(async(launch::async, [it, chunkEnd, init, op]() {
            return accumulate(it, chunkEnd, init, op);
        }));
        
        it = chunkEnd;
    }
    
    T result = init;
    for (auto& f : futures) {
        result = op(result, f.get());
    }
    
    return result;
}

void parallelReductionExample() {
    vector<int> data(1000000);
    iota(data.begin(), data.end(), 1);
    
    int sum = parallelReduce(data.begin(), data.end(), 0, 
        plus<int>(), thread::hardware_concurrency());
    
    cout << "Sum: " << sum << endl;
}
```

---

## Practical Examples

### Example 1: Concurrent Cache

Thread-safe cache with concurrent access:

```cpp
#include <unordered_map>
#include <mutex>
#include <shared_mutex>
#include <optional>
using namespace std;

template<typename Key, typename Value>
class ConcurrentCache {
    unordered_map<Key, Value> cache_;
    mutable shared_mutex mtx_;
    
public:
    optional<Value> get(const Key& key) const {
        shared_lock<shared_mutex> lock(mtx_);
        auto it = cache_.find(key);
        if (it != cache_.end()) {
            return it->second;
        }
        return nullopt;
    }
    
    void put(const Key& key, const Value& value) {
        unique_lock<shared_mutex> lock(mtx_);
        cache_[key] = value;
    }
    
    bool remove(const Key& key) {
        unique_lock<shared_mutex> lock(mtx_);
        return cache_.erase(key) > 0;
    }
    
    size_t size() const {
        shared_lock<shared_mutex> lock(mtx_);
        return cache_.size();
    }
};

void concurrentCacheExample() {
    ConcurrentCache<string, int> cache;
    vector<thread> threads;
    
    // Writers
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([&cache, i]() {
            for (int j = 0; j < 10; ++j) {
                cache.put("key" + to_string(i * 10 + j), i * 10 + j);
            }
        });
    }
    
    // Readers
    for (int i = 0; i < 3; ++i) {
        threads.emplace_back([&cache]() {
            for (int j = 0; j < 50; ++j) {
                auto value = cache.get("key" + to_string(j));
                // Process value...
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Cache size: " << cache.size() << endl;
}
```

### Example 2: Barrier Synchronization

Synchronize multiple threads at a point:

```cpp
#include <mutex>
#include <condition_variable>
using namespace std;

class Barrier {
    mutex mtx_;
    condition_variable cv_;
    size_t count_;
    size_t waiting_;
    size_t generation_;
    
public:
    explicit Barrier(size_t count) : count_(count), waiting_(0), generation_(0) {}
    
    void wait() {
        unique_lock<mutex> lock(mtx_);
        size_t gen = generation_;
        
        if (++waiting_ == count_) {
            generation_++;
            waiting_ = 0;
            cv_.notify_all();
        } else {
            cv_.wait(lock, [this, gen] { return gen != generation_; });
        }
    }
};

void barrierExample() {
    Barrier barrier(3);
    vector<thread> threads;
    
    for (int i = 0; i < 3; ++i) {
        threads.emplace_back([&barrier, i]() {
            cout << "Thread " << i << " before barrier" << endl;
            barrier.wait();
            cout << "Thread " << i << " after barrier" << endl;
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### Example 3: Read-Write Lock Pattern

Multiple readers, exclusive writers:

```cpp
#include <shared_mutex>
#include <vector>
#include <thread>
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

void readWriteExample() {
    ReadWriteData rwData;
    vector<thread> threads;
    
    // Multiple readers
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([&rwData, i]() {
            for (int j = 0; j < 10; ++j) {
                int value = rwData.read();
                cout << "Reader " << i << " read: " << value << endl;
            }
        });
    }
    
    // Single writer
    threads.emplace_back([&rwData]() {
        for (int i = 0; i < 5; ++i) {
            rwData.write(i);
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    });
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### Example 4: Lock-Free Counter

Atomic operations without mutexes:

```cpp
#include <atomic>
#include <vector>
#include <thread>
using namespace std;

class LockFreeCounter {
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

void lockFreeExample() {
    LockFreeCounter counter;
    vector<thread> threads;
    
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([&counter]() {
            for (int j = 0; j < 1000; ++j) {
                counter.increment();
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Final count: " << counter.get() << endl;  // 10000
}
```

---

## Common Patterns and Practices

### Pattern 1: Double-Checked Locking

Optimize initialization with minimal locking:

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

### Pattern 2: Scoped Locking

RAII for automatic lock management:

```cpp
#include <mutex>
using namespace std;

void scopedLockingExample() {
    mutex mtx1, mtx2;
    
    // Automatically locks both, unlocks on scope exit
    {
        scoped_lock lock(mtx1, mtx2);
        // Critical section
    }  // Both mutexes unlocked here
}
```

### Pattern 3: Guarded Suspension

Suspend thread until condition is met:

```cpp
#include <mutex>
#include <condition_variable>
using namespace std;

class GuardedSuspension {
    mutex mtx_;
    condition_variable cv_;
    bool ready_ = false;
    
public:
    void wait() {
        unique_lock<mutex> lock(mtx_);
        cv_.wait(lock, [this] { return ready_; });
    }
    
    void signal() {
        {
            lock_guard<mutex> lock(mtx_);
            ready_ = true;
        }
        cv_.notify_all();
    }
};
```

### Pattern 4: Future/Promise Pattern

Communicate results between threads:

```cpp
#include <future>
#include <thread>
using namespace std;

void futurePromiseExample() {
    promise<int> promise;
    future<int> future = promise.get_future();
    
    thread worker([&promise]() {
        // Do work
        int result = 42;
        promise.set_value(result);
    });
    
    // Do other work
    int result = future.get();  // Blocks until ready
    cout << "Result: " << result << endl;
    
    worker.join();
}
```

### Pattern 5: Pipeline Pattern

Process data through stages:

```cpp
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
using namespace std;

template<typename T>
class PipelineStage {
    queue<T> input_;
    queue<T> output_;
    mutex inputMtx_, outputMtx_;
    condition_variable inputCv_, outputCv_;
    function<T(T)> processor_;
    bool done_ = false;
    
public:
    PipelineStage(function<T(T)> processor) : processor_(processor) {}
    
    void process() {
        while (!done_) {
            T item;
            {
                unique_lock<mutex> lock(inputMtx_);
                inputCv_.wait(lock, [this] { return !input_.empty() || done_; });
                if (input_.empty() && done_) break;
                item = input_.front();
                input_.pop();
            }
            
            T result = processor_(item);
            
            {
                lock_guard<mutex> lock(outputMtx_);
                output_.push(result);
            }
            outputCv_.notify_one();
        }
    }
    
    void push(const T& item) {
        {
            lock_guard<mutex> lock(inputMtx_);
            input_.push(item);
        }
        inputCv_.notify_one();
    }
    
    T pop() {
        unique_lock<mutex> lock(outputMtx_);
        outputCv_.wait(lock, [this] { return !output_.empty(); });
        T item = output_.front();
        output_.pop();
        return item;
    }
    
    void finish() {
        {
            lock_guard<mutex> lock(inputMtx_);
            done_ = true;
        }
        inputCv_.notify_all();
    }
};
```

---

## Best Practices

### 1. Always Use RAII for Locks

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
void process() {
    int value;
    {
        lock_guard<mutex> lock(mtx_);
        value = sharedData_;
    }
    // Expensive computation outside lock
    int result = expensiveComputation(value);
}

// Bad: Large critical section
void process() {
    lock_guard<mutex> lock(mtx_);
    int value = sharedData_;
    int result = expensiveComputation(value);  // Blocks other threads
}
```

### 3. Avoid Deadlocks

```cpp
// Good: Consistent lock order
void function1() {
    lock_guard<mutex> lock1(mtx1_);
    lock_guard<mutex> lock2(mtx2_);
}

void function2() {
    lock_guard<mutex> lock1(mtx1_);  // Same order
    lock_guard<mutex> lock2(mtx2_);
}

// Bad: Different lock order (deadlock risk)
void function1() {
    lock_guard<mutex> lock1(mtx1_);
    lock_guard<mutex> lock2(mtx2_);
}

void function2() {
    lock_guard<mutex> lock2(mtx2_);  // Different order!
    lock_guard<mutex> lock1(mtx1_);
}
```

### 4. Use Atomic for Simple Operations

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

### 5. Prefer std::async for Simple Tasks

```cpp
// Good: High-level async
auto future = async(launch::async, computeTask);
int result = future.get();

// More complex: Manual thread management
promise<int> promise;
thread t([&promise]() {
    promise.set_value(computeTask());
});
int result = promise.get_future().get();
t.join();
```

### 6. Handle Exceptions in Threads

```cpp
// Good: Exception handling
thread t([&result]() {
    try {
        result = riskyOperation();
    } catch (const exception& e) {
        // Handle error
        result = defaultValue;
    }
});

// Bad: Unhandled exceptions terminate program
thread t([&result]() {
    result = riskyOperation();  // May throw
});
```

### 7. Use Thread-Local Storage When Appropriate

```cpp
#include <thread>
using namespace std;

thread_local int threadId = 0;

void threadLocalExample() {
    thread t1([]() {
        threadId = 1;
        cout << "Thread 1 ID: " << threadId << endl;
    });
    
    thread t2([]() {
        threadId = 2;
        cout << "Thread 2 ID: " << threadId << endl;
    });
    
    t1.join();
    t2.join();
}
```

---

## Anti-Patterns to Avoid

### 1. Data Races

```cpp
// Bad: Unsynchronized access
int counter = 0;
thread t1([&counter]() { counter++; });
thread t2([&counter]() { counter++; });
// Undefined behavior!

// Good: Synchronized access
mutex mtx;
int counter = 0;
thread t1([&counter, &mtx]() {
    lock_guard<mutex> lock(mtx);
    counter++;
});
```

### 2. Deadlocks

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

// Good: Consistent lock order or scoped_lock
void function1() {
    scoped_lock lock(mtx1_, mtx2_);
}
```

### 3. Race Conditions in Initialization

```cpp
// Bad: Check-then-act race
if (instance_ == nullptr) {  // Check
    instance_ = new Singleton();  // Act (race here!)
}

// Good: Synchronized initialization
mutex mtx;
if (instance_ == nullptr) {
    lock_guard<mutex> lock(mtx);
    if (instance_ == nullptr) {
        instance_ = new Singleton();
    }
}
```

### 4. Locking Too Much

```cpp
// Bad: Locking entire function
void process() {
    lock_guard<mutex> lock(mtx_);
    readData();      // Doesn't need lock
    compute();       // Doesn't need lock
    writeData();     // Needs lock
}

// Good: Lock only what's necessary
void process() {
    int data = readData();  // No lock needed
    int result = compute(data);  // No lock needed
    {
        lock_guard<mutex> lock(mtx_);
        writeData(result);  // Lock only here
    }
}
```

### 5. Forgetting to Join Threads

```cpp
// Bad: Thread not joined
void function() {
    thread t(worker);
    // t goes out of scope without join() - program terminates!
}

// Good: Always join or detach
void function() {
    thread t(worker);
    t.join();  // or t.detach()
}
```

---

## Summary

C++ concurrency enables:

- **Parallel execution**: Utilize multiple CPU cores
- **Responsive applications**: Non-blocking operations
- **Efficient resource usage**: Overlap I/O and computation
- **Scalability**: Handle multiple requests concurrently

Key takeaways:

1. **Understand the memory model**: Know when synchronization is needed
2. **Use RAII**: Always use `lock_guard`, `unique_lock`, etc.
3. **Minimize critical sections**: Keep locks held for minimal time
4. **Prefer high-level abstractions**: `std::async`, `std::future` over raw threads
5. **Avoid data races**: Always synchronize shared data access
6. **Prevent deadlocks**: Use consistent lock ordering or `scoped_lock`
7. **Handle exceptions**: Don't let exceptions escape threads unhandled

Concurrency in C++ is powerful but requires careful design to avoid race conditions, deadlocks, and performance issues. Follow these patterns and practices to write safe, efficient concurrent code.

