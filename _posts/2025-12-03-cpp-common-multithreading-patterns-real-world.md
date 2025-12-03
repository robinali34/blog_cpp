---
layout: post
title: "C++ Common Multi-Threading Patterns: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns real-world
permalink: /2025/12/03/cpp-common-multithreading-patterns-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, producer-consumer, thread-pool, future, map-reduce, actor-model, real-world]
excerpt: "Complete guide to 12 most common multi-threading patterns used in real-world engineering. Learn what problems they solve, how they work, STL usage, examples, and best practices."
---

# C++ Common Multi-Threading Patterns: Real-World Engineering Guide

This guide covers the 12 most common multi-threading patterns used in real-world engineering, explaining what problems they solve, how they work, STL usage, examples, and best practices.

## Table of Contents

1. [Producer-Consumer](#1-producer-consumer)
2. [Thread Pool](#2-thread-pool)
3. [Future / Promise (Async Task Result)](#3-future--promise-async-task-result)
4. [Map-Reduce](#4-map-reduce)
5. [Read-Write Lock Pattern](#5-read-write-lock-pattern)
6. [Work Stealing](#6-work-stealing)
7. [Pipeline / Staged Execution](#7-pipeline--staged-execution)
8. [Reactor Pattern](#8-reactor-pattern)
9. [Active Object Pattern](#9-active-object-pattern)
10. [Bounded Buffer](#10-bounded-buffer)
11. [Actor Model](#11-actor-model)
12. [Fork-Join](#12-fork-join)

---

## 1. Producer-Consumer

### Problem Solved

Decouple work generation from work processing. Allows producers to generate work at their own pace while consumers process it independently.

### How It Works

- **Producers** push tasks into a thread-safe queue
- **Consumers** take tasks from the queue and process them
- Uses blocking queues and condition variables for synchronization

### STL Usage

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
using namespace std;

template<typename T>
class ProducerConsumerQueue {
private:
    queue<T> queue_;
    mutex mtx_;
    condition_variable not_empty_;
    condition_variable not_full_;
    size_t max_size_;

public:
    explicit ProducerConsumerQueue(size_t max_size = 1000) 
        : max_size_(max_size) {}

    void push(const T& item) {
        unique_lock<mutex> lock(mtx_);
        not_full_.wait(lock, [this]() { return queue_.size() < max_size_; });
        queue_.push(item);
        not_empty_.notify_one();
    }

    T pop() {
        unique_lock<mutex> lock(mtx_);
        not_empty_.wait(lock, [this]() { return !queue_.empty(); });
        T item = queue_.front();
        queue_.pop();
        not_full_.notify_one();
        return item;
    }
};
```

### Example

```cpp
void producerConsumerExample() {
    ProducerConsumerQueue<int> queue(100);
    atomic<bool> done{false};

    // Producer
    thread producer([&]() {
        for (int i = 0; i < 1000; ++i) {
            queue.push(i);
        }
        done = true;
    });

    // Consumer
    thread consumer([&]() {
        while (!done || !queue.empty()) {
            int item = queue.pop();
            processItem(item);
        }
    });

    producer.join();
    consumer.join();
}
```

### Use Cases

- **Logging systems**: Log producers write to queue, logger thread processes
- **Task queues**: Task generators enqueue, worker threads dequeue
- **Pipeline stages**: Each stage is producer for next, consumer of previous
- **Event processing**: Event generators → event processors

### Key Takeaways

- Decouples production and consumption rates
- Handles load spikes by buffering
- Supports multiple producers/consumers
- Essential for async processing

### Things to Be Careful About

- **Queue size**: Unbounded queues can cause memory issues
- **Shutdown**: Ensure all items processed before shutdown
- **Deadlock**: Multiple queues can cause circular waits
- **Lost items**: Handle exceptions in consumers carefully

### Summary

Producer-Consumer is the foundation of many concurrent systems, providing decoupling and buffering between work generation and processing.

---

## 2. Thread Pool

### Problem Solved

Avoid the cost of creating/destroying threads for short tasks. Reuse threads to handle multiple tasks efficiently.

### How It Works

- A fixed or dynamic pool of worker threads waits for tasks
- Tasks are dispatched to the next available worker
- Workers process tasks and return to pool for next task

### STL Usage

```cpp
#include <thread>
#include <queue>
#include <vector>
#include <functional>
#include <mutex>
#include <condition_variable>
using namespace std;

class ThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> stop_{false};

public:
    explicit ThreadPool(size_t num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(mtx_);
                        cv_.wait(lock, [this]() {
                            return stop_ || !tasks_.empty();
                        });
                        
                        if (stop_ && tasks_.empty()) return;
                        
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
            lock_guard<mutex> lock(mtx_);
            tasks_.emplace(forward<F>(f));
        }
        cv_.notify_one();
    }

    ~ThreadPool() {
        {
            lock_guard<mutex> lock(mtx_);
            stop_ = true;
        }
        cv_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};
```

### Example

```cpp
void threadPoolExample() {
    ThreadPool pool(4);
    
    for (int i = 0; i < 100; ++i) {
        pool.enqueue([i]() {
            cout << "Task " << i << " executed" << endl;
        });
    }
    
    this_thread::sleep_for(chrono::seconds(2));
}
```

### Use Cases

- **HTTP servers**: Handle requests with worker threads
- **Async frameworks**: Execute async operations
- **Task executors**: Process background tasks
- **Parallel algorithms**: Distribute computation

### Key Takeaways

- Reuses threads, avoiding creation overhead
- Predictable resource usage
- Scales well with task count
- Common in production systems

### Things to Be Careful About

- **Thread count**: Too many threads cause context switching overhead
- **Task exceptions**: Handle exceptions to prevent worker death
- **Shutdown**: Ensure all tasks complete before destruction
- **Queue overflow**: Bound queue size to prevent memory issues

### Summary

Thread pools are essential for efficient task execution, providing predictable performance and resource usage.

---

## 3. Future / Promise (Async Task Result)

### Problem Solved

Retrieve the result of asynchronous operations without blocking the calling thread unnecessarily.

### How It Works

- A thread starts a task and returns a Future object immediately
- The caller can wait (blocking or non-blocking) for the result
- Promise sets the result, Future retrieves it

### STL Usage

```cpp
#include <future>
#include <thread>
#include <iostream>
using namespace std;

int computeTask(int input) {
    this_thread::sleep_for(chrono::milliseconds(100));
    return input * input;
}

void futurePromiseExample() {
    // Using async
    future<int> fut = async(launch::async, computeTask, 10);
    
    // Do other work
    cout << "Doing other work..." << endl;
    
    // Get result (blocks until ready)
    int result = fut.get();
    cout << "Result: " << result << endl;
}

// Using promise/future directly
void promiseFutureExample() {
    promise<int> prom;
    future<int> fut = prom.get_future();
    
    thread worker([&prom]() {
        int result = computeTask(5);
        prom.set_value(result);
    });
    
    int result = fut.get();
    cout << "Result: " << result << endl;
    
    worker.join();
}
```

### Example

```cpp
class AsyncTaskExecutor {
public:
    template<typename F, typename... Args>
    auto execute(F&& f, Args&&... args) -> future<typename result_of<F(Args...)>::type> {
        using return_type = typename result_of<F(Args...)>::type;
        
        auto task = make_shared<packaged_task<return_type()>>(
            bind(forward<F>(f), forward<Args>(args)...)
        );
        
        future<return_type> result = task->get_future();
        
        thread([task]() { (*task)(); }).detach();
        
        return result;
    }
};

void asyncExecutorExample() {
    AsyncTaskExecutor executor;
    
    auto fut1 = executor.execute([]() { return 42; });
    auto fut2 = executor.execute([]() { return string("Hello"); });
    
    cout << fut1.get() << endl;
    cout << fut2.get() << endl;
}
```

### Use Cases

- **Async I/O**: File/network operations
- **Parallel computation**: Multiple independent tasks
- **UI frameworks**: Non-blocking background work
- **Web services**: Async request handling

### Key Takeaways

- Non-blocking async operations
- Clean result retrieval
- Composable with other futures
- Standard library support (C++11+)

### Things to Be Careful About

- **Single get()**: Future can only be read once
- **Exception propagation**: Exceptions thrown in async tasks
- **Thread lifetime**: Ensure promise is set before future is destroyed
- **Shared state**: Futures share state, be careful with copying

### Summary

Futures and promises provide a clean way to handle async results, essential for modern concurrent programming.

---

## 4. Map-Reduce

### Problem Solved

Parallelize independent computations then aggregate results efficiently.

### How It Works

- **Map phase**: Split work into parallel chunks, process independently
- **Reduce phase**: Merge results (sum, max, combine objects)
- Each phase can run in parallel

### STL Usage

```cpp
#include <vector>
#include <thread>
#include <numeric>
#include <algorithm>
#include <future>
using namespace std;

template<typename InputIt, typename MapFunc, typename ReduceFunc>
auto mapReduce(InputIt first, InputIt last, MapFunc map_func, ReduceFunc reduce_func, size_t num_threads)
    -> decltype(reduce_func(map_func(*first), map_func(*first))) {
    
    using MapResult = decltype(map_func(*first));
    using ReduceResult = decltype(reduce_func(MapResult{}, MapResult{}));
    
    size_t total = distance(first, last);
    size_t chunk_size = total / num_threads;
    
    vector<future<MapResult>> futures;
    
    // Map phase: parallel processing
    for (size_t i = 0; i < num_threads; ++i) {
        auto chunk_start = first + i * chunk_size;
        auto chunk_end = (i == num_threads - 1) ? last : chunk_start + chunk_size;
        
        futures.push_back(async(launch::async, [=]() {
            MapResult result{};
            for (auto it = chunk_start; it != chunk_end; ++it) {
                result = reduce_func(result, map_func(*it));
            }
            return result;
        }));
    }
    
    // Reduce phase: combine results
    ReduceResult final_result{};
    for (auto& fut : futures) {
        final_result = reduce_func(final_result, fut.get());
    }
    
    return final_result;
}
```

### Example

```cpp
void mapReduceExample() {
    vector<int> data(1000);
    iota(data.begin(), data.end(), 1);
    
    // Map: square each number, Reduce: sum all
    int result = mapReduce(
        data.begin(), data.end(),
        [](int x) { return x * x; },  // Map function
        [](int a, int b) { return a + b; },  // Reduce function
        4  // Number of threads
    );
    
    cout << "Sum of squares: " << result << endl;
}
```

### Use Cases

- **Data processing**: Process large datasets in parallel
- **Parallel algorithms**: Divide and conquer
- **Big data**: Distributed computation
- **Scientific computing**: Parallel numerical operations

### Key Takeaways

- Excellent for parallelizable computations
- Scales well with data size
- Two-phase approach: map then reduce
- Common in distributed systems

### Things to Be Careful About

- **Data dependencies**: Map operations must be independent
- **Reduce associativity**: Reduce function must be associative
- **Load balancing**: Ensure even work distribution
- **Memory usage**: Large intermediate results

### Summary

Map-Reduce is powerful for parallel data processing, enabling efficient parallelization of independent computations.

---

## 5. Read-Write Lock Pattern

### Problem Solved

Optimize concurrent access to shared data that is read frequently but rarely written.

### How It Works

- Multiple readers allowed at the same time
- Writers must be exclusive (no readers, no other writers)
- Uses shared locks for reads, exclusive locks for writes

### STL Usage

```cpp
#include <shared_mutex>
#include <map>
#include <string>
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

### Example

```cpp
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

### Use Cases

- **Caches**: Frequently read, occasionally updated
- **Configuration stores**: Read-heavy, rare updates
- **File metadata**: Many readers, few writers
- **Lookup tables**: Read operations dominate

### Key Takeaways

- Significant performance improvement for read-heavy workloads
- Allows concurrent reads
- Exclusive writes ensure consistency
- C++17 `std::shared_mutex` support

### Things to Be Careful About

- **Writer starvation**: Readers can starve writers
- **Upgrade deadlock**: Can't upgrade read lock to write lock
- **Fairness**: May need fair locks for balanced access
- **Overhead**: More complex than simple mutex

### Summary

Read-Write locks optimize concurrent access for read-heavy workloads, providing significant performance improvements.

---

## 6. Work Stealing

### Problem Solved

Balance load across worker threads dynamically, minimizing contention and maximizing CPU utilization.

### How It Works

- Each worker has its own queue
- Idle workers "steal" tasks from others' queues
- Reduces contention and improves load balancing

### STL Usage

```cpp
#include <deque>
#include <mutex>
#include <thread>
#include <vector>
#include <functional>
#include <atomic>
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

### Example

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

### Use Cases

- **CPU-bound tasks**: Maximize CPU utilization
- **Unbalanced workloads**: Dynamic load balancing
- **Parallel algorithms**: Divide and conquer
- **Task schedulers**: High-performance task execution

### Key Takeaways

- Excellent load balancing
- Minimizes contention
- High CPU utilization
- Used in high-performance libraries (TBB, ForkJoinPool)

### Things to Be Careful About

- **Stealing overhead**: Stealing has synchronization cost
- **Cache locality**: Stealing may hurt cache performance
- **Queue design**: Need efficient steal operation
- **Fairness**: May need to ensure fair stealing

### Summary

Work stealing provides excellent load balancing for parallel workloads, maximizing CPU utilization and minimizing contention.

---

## 7. Pipeline / Staged Execution

### Problem Solved

Break complex work into sequential stages, each running in a dedicated thread or thread pool, exploiting parallelism across stages.

### How It Works

- Stage 1 → Queue → Stage 2 → Queue → Stage 3 → ...
- Each stage processes items and passes to next
- Stages run in parallel on different items

### STL Usage

```cpp
#include <queue>
#include <thread>
#include <vector>
#include <functional>
#include <mutex>
#include <condition_variable>
using namespace std;

template<typename T>
class PipelineStage {
private:
    queue<T> input_queue_;
    mutex mtx_;
    condition_variable cv_;
    function<T(T)> processor_;
    thread worker_;
    atomic<bool> stop_{false};

public:
    PipelineStage(function<T(T)> processor) : processor_(processor) {
        worker_ = thread([this]() {
            while (!stop_) {
                T item;
                {
                    unique_lock<mutex> lock(mtx_);
                    cv_.wait(lock, [this]() { return stop_ || !input_queue_.empty(); });
                    if (stop_ && input_queue_.empty()) break;
                    item = input_queue_.front();
                    input_queue_.pop();
                }
                
                T result = processor_(item);
                if (next_stage_) {
                    next_stage_->enqueue(result);
                }
            }
        });
    }

    void enqueue(const T& item) {
        {
            lock_guard<mutex> lock(mtx_);
            input_queue_.push(item);
        }
        cv_.notify_one();
    }

    PipelineStage<T>* next_stage_ = nullptr;

    ~PipelineStage() {
        stop_ = true;
        cv_.notify_one();
        worker_.join();
    }
};

template<typename T>
class Pipeline {
private:
    vector<unique_ptr<PipelineStage<T>>> stages_;

public:
    void addStage(function<T(T)> processor) {
        stages_.push_back(make_unique<PipelineStage<T>>(processor));
        if (stages_.size() > 1) {
            stages_[stages_.size() - 2]->next_stage_ = stages_.back().get();
        }
    }

    void process(const T& item) {
        if (!stages_.empty()) {
            stages_[0]->enqueue(item);
        }
    }
};
```

### Example

```cpp
void pipelineExample() {
    Pipeline<string> pipeline;
    
    // Stage 1: Read
    pipeline.addStage([](string input) {
        return "Read: " + input;
    });
    
    // Stage 2: Process
    pipeline.addStage([](string input) {
        return "Processed: " + input;
    });
    
    // Stage 3: Write
    pipeline.addStage([](string input) {
        cout << "Output: " << input << endl;
        return input;
    });
    
    for (int i = 0; i < 10; ++i) {
        pipeline.process("Item " + to_string(i));
    }
    
    this_thread::sleep_for(chrono::seconds(2));
}
```

### Use Cases

- **Image processing**: Capture → process → compress → upload
- **Data pipelines**: Extract → transform → load
- **Video processing**: Decode → filter → encode
- **Log processing**: Parse → filter → aggregate → store

### Key Takeaways

- Exploits parallelism across stages
- Each stage can process different items simultaneously
- Good for sequential processing pipelines
- High throughput for streaming data

### Things to Be Careful About

- **Backpressure**: Slow stages can fill queues
- **Error handling**: Errors in one stage affect pipeline
- **Shutdown**: Ensure all items processed
- **Bottlenecks**: Slowest stage limits throughput

### Summary

Pipelines enable efficient parallel processing of sequential stages, maximizing throughput for streaming workloads.

---

## 8. Reactor Pattern

### Problem Solved

High-performance, event-driven I/O with few threads, handling many concurrent connections efficiently.

### How It Works

- A single (or small number of) event loop(s) waits for I/O events
- Handlers respond asynchronously
- Non-blocking I/O with event notification

### STL Usage

```cpp
#include <functional>
#include <map>
#include <vector>
#include <thread>
#include <atomic>
#include <sys/epoll.h>  // Linux-specific, use platform-appropriate API
using namespace std;

class Reactor {
private:
    map<int, function<void()>> handlers_;
    atomic<bool> running_{false};
    thread event_loop_;

    void eventLoop() {
        while (running_) {
            // Wait for events (epoll, select, etc.)
            vector<int> ready_fds = waitForEvents();
            
            for (int fd : ready_fds) {
                if (handlers_.find(fd) != handlers_.end()) {
                    handlers_[fd]();
                }
            }
        }
    }

    vector<int> waitForEvents() {
        // Platform-specific event waiting
        // Returns file descriptors ready for I/O
        return {};
    }

public:
    void registerHandler(int fd, function<void()> handler) {
        handlers_[fd] = handler;
    }

    void start() {
        running_ = true;
        event_loop_ = thread([this]() { eventLoop(); });
    }

    void stop() {
        running_ = false;
        event_loop_.join();
    }
};
```

### Example

```cpp
class AsyncIOReactor {
private:
    Reactor reactor_;
    ThreadPool handler_pool_;

public:
    AsyncIOReactor() : handler_pool_(4) {
        reactor_.start();
    }

    void handleConnection(int socket_fd) {
        reactor_.registerHandler(socket_fd, [this, socket_fd]() {
            handler_pool_.enqueue([socket_fd]() {
                // Process I/O
                processIO(socket_fd);
            });
        });
    }

    void processIO(int fd) {
        // Read/write data
    }
};
```

### Use Cases

- **Web servers**: Nginx, high-performance HTTP servers
- **Network frameworks**: Netty, event-driven networking
- **Database servers**: Handle many connections
- **Real-time systems**: Low-latency event handling

### Key Takeaways

- Handles many connections with few threads
- Event-driven, non-blocking I/O
- High throughput and low latency
- Common in high-performance servers

### Things to Be Careful About

- **Platform-specific**: Requires platform I/O APIs (epoll, kqueue, IOCP)
- **Complexity**: More complex than thread-per-connection
- **CPU-bound tasks**: Should use thread pool for CPU work
- **Error handling**: Must handle I/O errors gracefully

### Summary

Reactor pattern enables high-performance event-driven I/O, essential for scalable network servers and real-time systems.

---

## 9. Active Object Pattern

### Problem Solved

Avoid shared-state bugs by pushing tasks into an object's private thread, ensuring sequential message processing.

### How It Works

- Each object has its own thread and an event queue
- Method calls become messages queued to the object
- Object processes messages sequentially in its thread

### STL Usage

```cpp
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
using namespace std;

class ActiveObject {
private:
    queue<function<void()>> message_queue_;
    mutex mtx_;
    condition_variable cv_;
    thread active_thread_;
    atomic<bool> running_{true};

    void run() {
        while (running_) {
            function<void()> message;
            {
                unique_lock<mutex> lock(mtx_);
                cv_.wait(lock, [this]() { return !message_queue_.empty() || !running_; });
                
                if (!running_ && message_queue_.empty()) break;
                
                message = message_queue_.front();
                message_queue_.pop();
            }
            message();
        }
    }

public:
    ActiveObject() : active_thread_([this]() { run(); }) {}

    void send(function<void()> message) {
        {
            lock_guard<mutex> lock(mtx_);
            message_queue_.push(message);
        }
        cv_.notify_one();
    }

    ~ActiveObject() {
        running_ = false;
        cv_.notify_one();
        active_thread_.join();
    }
};

// Example active object
class BankAccount {
private:
    ActiveObject active_;
    int balance_ = 0;

public:
    void deposit(int amount) {
        active_.send([this, amount]() {
            balance_ += amount;
        });
    }

    void withdraw(int amount, function<void(bool)> callback) {
        active_.send([this, amount, callback]() {
            bool success = balance_ >= amount;
            if (success) balance_ -= amount;
            callback(success);
        });
    }

    void getBalance(function<void(int)> callback) {
        active_.send([this, callback]() {
            callback(balance_);
        });
    }
};
```

### Example

```cpp
void activeObjectExample() {
    BankAccount account;
    
    account.deposit(100);
    account.withdraw(50, [](bool success) {
        cout << "Withdrawal " << (success ? "succeeded" : "failed") << endl;
    });
    
    account.getBalance([](int balance) {
        cout << "Balance: " << balance << endl;
    });
    
    this_thread::sleep_for(chrono::milliseconds(100));
}
```

### Use Cases

- **GUI toolkits**: UI objects process messages in UI thread
- **Actor systems**: Each actor is an active object
- **Game engines**: Game objects process updates sequentially
- **State machines**: Sequential state transitions

### Key Takeaways

- Eliminates shared-state bugs
- Sequential message processing
- Thread-safe by design
- Common in actor systems

### Things to Be Careful About

- **Message ordering**: Messages processed in order
- **Deadlocks**: Circular message dependencies
- **Performance**: Message queuing overhead
- **Callback lifetime**: Ensure callbacks remain valid

### Summary

Active Object pattern eliminates shared-state issues by ensuring sequential message processing in object's own thread.

---

## 10. Bounded Buffer

### Problem Solved

Control resource usage and provide backpressure when producers are faster than consumers.

### How It Works

- Queue with maximum capacity
- Producers block when full
- Consumers unblock producers when space available
- Prevents unbounded memory growth

### STL Usage

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
using namespace std;

template<typename T>
class BoundedBuffer {
private:
    queue<T> buffer_;
    size_t capacity_;
    mutex mtx_;
    condition_variable not_full_;
    condition_variable not_empty_;

public:
    explicit BoundedBuffer(size_t capacity) : capacity_(capacity) {}

    void put(const T& item) {
        unique_lock<mutex> lock(mtx_);
        not_full_.wait(lock, [this]() { return buffer_.size() < capacity_; });
        buffer_.push(item);
        not_empty_.notify_one();
    }

    T get() {
        unique_lock<mutex> lock(mtx_);
        not_empty_.wait(lock, [this]() { return !buffer_.empty(); });
        T item = buffer_.front();
        buffer_.pop();
        not_full_.notify_one();
        return item;
    }

    size_t size() const {
        lock_guard<mutex> lock(mtx_);
        return buffer_.size();
    }
};
```

### Example

```cpp
void boundedBufferExample() {
    BoundedBuffer<int> buffer(10);  // Capacity 10
    atomic<bool> done{false};

    // Fast producer
    thread producer([&]() {
        for (int i = 0; i < 100; ++i) {
            buffer.put(i);  // Blocks when full
            cout << "Produced: " << i << endl;
        }
        done = true;
    });

    // Slow consumer
    thread consumer([&]() {
        while (!done || buffer.size() > 0) {
            int item = buffer.get();
            cout << "Consumed: " << item << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    });

    producer.join();
    consumer.join();
}
```

### Use Cases

- **Rate limiting**: Control processing rate
- **Backpressure**: Prevent overwhelming consumers
- **Resource control**: Limit memory usage
- **Flow control**: Balance producer/consumer rates

### Key Takeaways

- Prevents unbounded growth
- Provides natural backpressure
- Controls resource usage
- Essential for production systems

### Things to Be Careful About

- **Deadlock**: Producers waiting on full buffer
- **Capacity sizing**: Too small causes blocking, too large wastes memory
- **Shutdown**: Ensure all items processed
- **Timeout**: Consider timeout for put/get operations

### Summary

Bounded buffers provide essential flow control and resource management, preventing memory issues and providing backpressure.

---

## 11. Actor Model

### Problem Solved

Simplify concurrency by eliminating shared memory, using message passing between isolated actors.

### How It Works

- "Actors" communicate by message passing
- Each actor processes messages sequentially
- No shared state between actors
- Actors can create other actors

### STL Usage

```cpp
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <memory>
#include <map>
using namespace std;

class Actor {
private:
    queue<function<void()>> mailbox_;
    mutex mtx_;
    condition_variable cv_;
    thread actor_thread_;
    atomic<bool> running_{true};

    void processMessages() {
        while (running_) {
            function<void()> message;
            {
                unique_lock<mutex> lock(mtx_);
                cv_.wait(lock, [this]() { return !mailbox_.empty() || !running_; });
                
                if (!running_ && mailbox_.empty()) break;
                
                message = mailbox_.front();
                mailbox_.pop();
            }
            message();
        }
    }

public:
    Actor() : actor_thread_([this]() { processMessages(); }) {}

    void send(function<void()> message) {
        {
            lock_guard<mutex> lock(mtx_);
            mailbox_.push(message);
        }
        cv_.notify_one();
    }

    ~Actor() {
        running_ = false;
        cv_.notify_one();
        actor_thread_.join();
    }
};

class ActorSystem {
private:
    map<string, unique_ptr<Actor>> actors_;

public:
    void createActor(const string& name) {
        actors_[name] = make_unique<Actor>();
    }

    void send(const string& actor_name, function<void()> message) {
        if (actors_.find(actor_name) != actors_.end()) {
            actors_[actor_name]->send(message);
        }
    }
};
```

### Example

```cpp
class CounterActor {
private:
    Actor actor_;
    int count_ = 0;

public:
    void increment() {
        actor_.send([this]() {
            count_++;
        });
    }

    void getCount(function<void(int)> callback) {
        actor_.send([this, callback]() {
            callback(count_);
        });
    }
};

void actorModelExample() {
    CounterActor counter;
    
    for (int i = 0; i < 100; ++i) {
        counter.increment();
    }
    
    counter.getCount([](int count) {
        cout << "Count: " << count << endl;
    });
    
    this_thread::sleep_for(chrono::milliseconds(100));
}
```

### Use Cases

- **Distributed systems**: Akka, Erlang actors
- **Concurrent systems**: Isolated state management
- **Game engines**: Game entities as actors
- **Microservices**: Service communication

### Key Takeaways

- No shared memory, eliminates many concurrency bugs
- Easy to reason about
- Scales to distributed systems
- Message passing is natural

### Things to Be Careful About

- **Message ordering**: May not preserve global order
- **Deadlocks**: Circular message dependencies
- **Performance**: Message passing overhead
- **Error handling**: Actor failures need supervision

### Summary

Actor model simplifies concurrency by eliminating shared state, making systems easier to reason about and scale.

---

## 12. Fork-Join

### Problem Solved

Divide a task into smaller tasks recursively, process in parallel, then join results.

### How It Works

- **Fork**: Split task into sub-tasks
- **Join**: Merge results at the end
- Recursive divide-and-conquer approach

### STL Usage

```cpp
#include <future>
#include <vector>
#include <algorithm>
#include <thread>
using namespace std;

template<typename InputIt, typename Func>
auto forkJoin(InputIt first, InputIt last, Func func, size_t threshold) 
    -> decltype(func(first, last)) {
    
    size_t size = distance(first, last);
    
    // Base case: process directly
    if (size <= threshold) {
        return func(first, last);
    }
    
    // Fork: split into two halves
    auto mid = first + size / 2;
    
    auto left_future = async(launch::async, [=]() {
        return forkJoin(first, mid, func, threshold);
    });
    
    auto right_result = forkJoin(mid, last, func, threshold);
    auto left_result = left_future.get();
    
    // Join: combine results (simplified - actual join depends on operation)
    return left_result + right_result;  // Example: sum
}

// Parallel for_each using fork-join
template<typename InputIt, typename Func>
void parallelForEach(InputIt first, InputIt last, Func func, size_t threshold = 1000) {
    size_t size = distance(first, last);
    
    if (size <= threshold) {
        for_each(first, last, func);
        return;
    }
    
    auto mid = first + size / 2;
    
    auto left_future = async(launch::async, [=]() {
        parallelForEach(first, mid, func, threshold);
    });
    
    parallelForEach(mid, last, func, threshold);
    left_future.wait();
}
```

### Example

```cpp
int parallelSum(const vector<int>& data, size_t threshold = 1000) {
    return forkJoin(
        data.begin(), data.end(),
        [](auto first, auto last) {
            return accumulate(first, last, 0);
        },
        threshold
    );
}

void forkJoinExample() {
    vector<int> data(10000);
    iota(data.begin(), data.end(), 1);
    
    int sum = parallelSum(data);
    cout << "Sum: " << sum << endl;
}
```

### Use Cases

- **Parallel algorithms**: Divide and conquer
- **Sorting**: Parallel merge sort, quick sort
- **Tree processing**: Parallel tree traversal
- **Scientific computing**: Parallel numerical methods

### Key Takeaways

- Natural for divide-and-conquer algorithms
- Recursive parallelization
- Built into many frameworks (Java ForkJoinPool, C++ parallel algorithms)
- Efficient for CPU-bound tasks

### Things to Be Careful About

- **Threshold**: Too small causes overhead, too large limits parallelism
- **Load balancing**: Ensure even work distribution
- **Memory**: Recursive calls use stack space
- **Overhead**: Task creation has cost

### Summary

Fork-Join enables efficient recursive parallelization, ideal for divide-and-conquer algorithms and parallel processing.

---

## Summary

These 12 patterns form the foundation of concurrent programming:

1. **Producer-Consumer**: Decouple work generation and processing
2. **Thread Pool**: Efficient task execution
3. **Future/Promise**: Async result handling
4. **Map-Reduce**: Parallel data processing
5. **Read-Write Lock**: Optimize read-heavy access
6. **Work Stealing**: Dynamic load balancing
7. **Pipeline**: Sequential stage parallelism
8. **Reactor**: Event-driven I/O
9. **Active Object**: Sequential message processing
10. **Bounded Buffer**: Resource control and backpressure
11. **Actor Model**: Message-passing concurrency
12. **Fork-Join**: Recursive parallelization

### Key Principles

- **Choose the right pattern** for your problem
- **Understand trade-offs** between patterns
- **Combine patterns** for complex systems
- **Profile and measure** to verify choices

By mastering these patterns, you can build efficient, scalable concurrent systems in C++.

