---
layout: post
title: "C++ std::packaged_task: Multi-Thread Task Wrapper Guide and Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading packaged-task future
permalink: /2025/12/03/cpp-packaged-task-guide/
tags: [cpp, concurrency, multithreading, packaged-task, future, task-wrapper, async-execution]
excerpt: "Learn about C++ std::packaged_task for wrapping callable objects with futures. Guide to task execution, thread pools, and practical examples for concurrent programming."
---

# C++ std::packaged_task: Multi-Thread Task Wrapper Guide and Examples

`std::packaged_task` is a class template that wraps a callable object (function, lambda, function object) and stores its return value or exception in a shared state accessible through a `std::future`. It's useful for executing tasks in thread pools and managing async operations with explicit control.

## Table of Contents

1. [What is std::packaged_task?](#what-is-stdpackaged_task)
2. [Basic Usage and API](#basic-usage-and-api)
3. [Example 1: Simple Packaged Task](#example-1-simple-packaged-task)
4. [Example 2: Packaged Task in Thread Pool](#example-2-packaged-task-in-thread-pool)
5. [Example 3: Multiple Packaged Tasks](#example-3-multiple-packaged-tasks)
6. [Example 4: Packaged Task with Exceptions](#example-4-packaged-task-with-exceptions)
7. [Example 5: Moving Packaged Tasks](#example-5-moving-packaged-tasks)
8. [Example 6: Custom Task Executor](#example-6-custom-task-executor)
9. [Best Practices](#best-practices)
10. [Common Pitfalls](#common-pitfalls)

---

## What is std::packaged_task?

`std::packaged_task` is a class template that:
- **Wraps a callable object** (function, lambda, function object)
- **Stores the result** in a shared state
- **Provides a future** to access the result
- **Can be invoked** like a function object
- **Propagates exceptions** through the future

### Key Benefits

- **Explicit control**: Choose when and where to execute
- **Reusable**: Can be stored and executed later
- **Future-based**: Get results through futures
- **Exception safe**: Exceptions propagate through futures
- **Thread pool friendly**: Perfect for task queues

### When to Use std::packaged_task

```cpp
// GOOD: Use packaged_task for thread pool tasks
packaged_task<int()> task([]() { return compute(); });
auto future = task.get_future();

// Execute in thread pool
thread_pool.enqueue(move(task));

// BAD: Using async when you need explicit control
auto future = async(launch::async, compute);  // Less control
```

---

## Basic Usage and API

### Basic Syntax

```cpp
#include <future>
#include <thread>
using namespace std;

// Create packaged_task
packaged_task<ReturnType(Args...)> task(callable);

// Get future
auto future = task.get_future();

// Execute task (in any thread)
task(args...);

// Get result
auto result = future.get();
```

### Key Methods

- **`get_future()`**: Returns a `std::future` to access the result
- **`operator()`**: Invokes the wrapped callable
- **`valid()`**: Checks if the task has a valid shared state
- **`reset()`**: Resets the task (C++11) or creates new shared state (C++14+)

---

## Example 1: Simple Packaged Task

Basic usage of packaged_task:

```cpp
#include <future>
#include <iostream>
#include <thread>
#include <chrono>
using namespace std;

int computeValue(int x) {
    this_thread::sleep_for(chrono::milliseconds(500));
    return x * 2;
}

int main() {
    // Create packaged_task
    packaged_task<int(int)> task(computeValue);
    
    // Get future before execution
    auto future = task.get_future();
    
    // Execute task in a thread
    thread t(move(task), 21);
    
    // Do other work
    cout << "Doing other work..." << endl;
    
    // Get result
    int result = future.get();
    cout << "Result: " << result << endl;  // Output: Result: 42
    
    t.join();
    return 0;
}
```

**Output:**
```
Doing other work...
Result: 42
```

---

## Example 2: Packaged Task in Thread Pool

Using packaged_task with a thread pool:

```cpp
#include <future>
#include <queue>
#include <thread>
#include <vector>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <iostream>
using namespace std;

class ThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex queue_mutex_;
    condition_variable condition_;
    bool stop_ = false;

public:
    ThreadPool(size_t num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(queue_mutex_);
                        condition_.wait(lock, [this]() {
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
    
    template<typename F>
    auto enqueue(F&& f) -> future<typename result_of<F()>::type> {
        using return_type = typename result_of<F()>::type;
        
        auto task = make_shared<packaged_task<return_type()>>(
            forward<F>(f)
        );
        
        future<return_type> result = task->get_future();
        
        {
            unique_lock<mutex> lock(queue_mutex_);
            if (stop_) {
                throw runtime_error("ThreadPool is stopped");
            }
            tasks_.emplace([task]() { (*task)(); });
        }
        
        condition_.notify_one();
        return result;
    }
    
    ~ThreadPool() {
        {
            unique_lock<mutex> lock(queue_mutex_);
            stop_ = true;
        }
        condition_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};

int main() {
    ThreadPool pool(4);
    
    vector<future<int>> futures;
    
    // Submit tasks
    for (int i = 0; i < 10; ++i) {
        futures.push_back(pool.enqueue([i]() {
            this_thread::sleep_for(chrono::milliseconds(100));
            return i * i;
        }));
    }
    
    // Get results
    for (size_t i = 0; i < futures.size(); ++i) {
        cout << "Task " << i << " result: " << futures[i].get() << endl;
    }
    
    return 0;
}
```

---

## Example 3: Multiple Packaged Tasks

Managing multiple packaged tasks:

```cpp
#include <future>
#include <vector>
#include <thread>
#include <iostream>
#include <numeric>
using namespace std;

int processChunk(const vector<int>& data, size_t start, size_t end) {
    int sum = 0;
    for (size_t i = start; i < end; ++i) {
        sum += data[i];
    }
    return sum;
}

int main() {
    vector<int> data(1000);
    iota(data.begin(), data.end(), 1);
    
    const size_t num_threads = 4;
    const size_t chunk_size = data.size() / num_threads;
    
    vector<packaged_task<int()>> tasks;
    vector<future<int>> futures;
    vector<thread> threads;
    
    // Create tasks
    for (size_t i = 0; i < num_threads; ++i) {
        size_t start = i * chunk_size;
        size_t end = (i == num_threads - 1) ? data.size() : (i + 1) * chunk_size;
        
        packaged_task<int()> task([&data, start, end]() {
            return processChunk(data, start, end);
        });
        
        futures.push_back(task.get_future());
        tasks.push_back(move(task));
    }
    
    // Execute tasks
    for (auto& task : tasks) {
        threads.emplace_back(move(task));
    }
    
    // Collect results
    int total = 0;
    for (auto& f : futures) {
        total += f.get();
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Total sum: " << total << endl;
    cout << "Expected: " << (1000 * 1001) / 2 << endl;
    
    return 0;
}
```

---

## Example 4: Packaged Task with Exceptions

Handling exceptions in packaged tasks:

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <stdexcept>
using namespace std;

int riskyComputation(int x) {
    if (x < 0) {
        throw invalid_argument("Negative value not allowed");
    }
    return x * 2;
}

int main() {
    // Task that throws
    packaged_task<int(int)> task1(riskyComputation);
    auto future1 = task1.get_future();
    
    thread t1(move(task1), -5);
    
    try {
        int result = future1.get();
        cout << "Result: " << result << endl;
    }
    catch (const exception& e) {
        cout << "Error: " << e.what() << endl;  // Output: Error: Negative value not allowed
    }
    
    t1.join();
    
    // Successful task
    packaged_task<int(int)> task2(riskyComputation);
    auto future2 = task2.get_future();
    
    thread t2(move(task2), 10);
    
    try {
        int result = future2.get();
        cout << "Result: " << result << endl;  // Output: Result: 20
    }
    catch (const exception& e) {
        cout << "Error: " << e.what() << endl;
    }
    
    t2.join();
    return 0;
}
```

**Output:**
```
Error: Negative value not allowed
Result: 20
```

---

## Example 5: Moving Packaged Tasks

Understanding move semantics with packaged_task:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

int compute(int x) {
    return x * x;
}

int main() {
    vector<packaged_task<int(int)>> tasks;
    vector<future<int>> futures;
    
    // Create tasks
    for (int i = 0; i < 5; ++i) {
        packaged_task<int(int)> task(compute);
        futures.push_back(task.get_future());
        tasks.push_back(move(task));  // Must move!
    }
    
    // Execute tasks
    vector<thread> threads;
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back(move(tasks[i]), i + 1);  // Move again
    }
    
    // Get results
    for (size_t i = 0; i < futures.size(); ++i) {
        cout << "Task " << i << " result: " << futures[i].get() << endl;
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    return 0;
}
```

**Output:**
```
Task 0 result: 1
Task 1 result: 4
Task 2 result: 9
Task 3 result: 16
Task 4 result: 25
```

---

## Example 6: Custom Task Executor

Building a custom executor with packaged_task:

```cpp
#include <future>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <iostream>
using namespace std;

template<typename T>
class TaskExecutor {
private:
    queue<packaged_task<T()>> tasks_;
    mutex mtx_;
    condition_variable cv_;
    thread worker_;
    bool stop_ = false;

public:
    TaskExecutor() : worker_([this]() {
        while (true) {
            packaged_task<T()> task;
            {
                unique_lock<mutex> lock(mtx_);
                cv_.wait(lock, [this]() {
                    return stop_ || !tasks_.empty();
                });
                
                if (stop_ && tasks_.empty()) return;
                
                task = move(tasks_.front());
                tasks_.pop();
            }
            task();  // Execute task
        }
    }) {}
    
    future<T> submit(function<T()> f) {
        packaged_task<T()> task(f);
        future<T> result = task.get_future();
        
        {
            unique_lock<mutex> lock(mtx_);
            tasks_.push(move(task));
        }
        
        cv_.notify_one();
        return result;
    }
    
    ~TaskExecutor() {
        {
            unique_lock<mutex> lock(mtx_);
            stop_ = true;
        }
        cv_.notify_one();
        worker_.join();
    }
};

int main() {
    TaskExecutor<int> executor;
    
    vector<future<int>> futures;
    
    // Submit tasks
    for (int i = 0; i < 10; ++i) {
        futures.push_back(executor.submit([i]() {
            return i * i;
        }));
    }
    
    // Get results
    for (size_t i = 0; i < futures.size(); ++i) {
        cout << "Result " << i << ": " << futures[i].get() << endl;
    }
    
    return 0;
}
```

---

## Best Practices

### 1. Get Future Before Execution

```cpp
// GOOD: Get future before moving task
packaged_task<int()> task([]() { return 42; });
auto future = task.get_future();  // Before move!
thread t(move(task));
t.join();
int result = future.get();

// BAD: Getting future after move
packaged_task<int()> task([]() { return 42; });
thread t(move(task));
auto future = task.get_future();  // ERROR: task is moved!
```

### 2. Use Move Semantics

```cpp
// GOOD: Move packaged_task
packaged_task<int()> task([]() { return 42; });
thread t(move(task));  // Must move

// BAD: Copying (not allowed)
packaged_task<int()> task([]() { return 42; });
thread t(task);  // ERROR: packaged_task is move-only
```

### 3. Store in Shared Pointer for Thread Pools

```cpp
// GOOD: Use shared_ptr for thread pool
auto task = make_shared<packaged_task<int()>>([]() { return 42; });
auto future = task->get_future();

thread_pool.enqueue([task]() {
    (*task)();  // Execute
});

// BAD: Moving into queue loses ownership
packaged_task<int()> task([]() { return 42; });
queue.push(move(task));  // Task ownership unclear
```

### 4. Handle Exceptions

```cpp
try {
    packaged_task<int()> task(riskyFunction);
    auto future = task.get_future();
    thread t(move(task));
    t.join();
    int result = future.get();  // May throw
}
catch (const exception& e) {
    // Handle exception
}
```

### 5. Check Valid State

```cpp
packaged_task<int()> task([]() { return 42; });
if (task.valid()) {
    auto future = task.get_future();
    // Use task
}
```

---

## Common Pitfalls

### 1. Getting Future After Move

```cpp
// BAD: Task is moved, can't get future
packaged_task<int()> task([]() { return 42; });
thread t(move(task));
auto future = task.get_future();  // ERROR!

// GOOD: Get future before move
packaged_task<int()> task([]() { return 42; });
auto future = task.get_future();
thread t(move(task));
```

### 2. Calling get() Multiple Times

```cpp
packaged_task<int()> task([]() { return 42; });
auto future = task.get_future();
thread t(move(task));
t.join();

int result1 = future.get();  // OK
int result2 = future.get();  // ERROR: future is invalid!
```

### 3. Not Executing the Task

```cpp
// BAD: Task never executed
packaged_task<int()> task([]() { return 42; });
auto future = task.get_future();
// Forgot to execute task!
int result = future.get();  // Blocks forever or throws

// GOOD: Execute task
packaged_task<int()> task([]() { return 42; });
auto future = task.get_future();
thread t(move(task));
t.join();
int result = future.get();
```

### 4. Race Conditions with Shared Data

```cpp
// BAD: Unsynchronized access
int counter = 0;
packaged_task<void()> task([&counter]() {
    counter++;  // Race condition!
});

// GOOD: Use synchronization
mutex mtx;
int counter = 0;
packaged_task<void()> task([&counter, &mtx]() {
    lock_guard<mutex> lock(mtx);
    counter++;  // Safe
});
```

### 5. Destroying Task Before Execution

```cpp
// BAD: Task destroyed before execution
future<int> f;
{
    packaged_task<int()> task([]() { return 42; });
    f = task.get_future();
    // Task destroyed here!
}
// Task never executed, future.get() will block or throw

// GOOD: Ensure task is executed
future<int> f;
thread t;
{
    packaged_task<int()> task([]() { return 42; });
    f = task.get_future();
    t = thread(move(task));
}
t.join();
int result = f.get();
```

### 6. Using After Reset

```cpp
packaged_task<int()> task([]() { return 42; });
auto future1 = task.get_future();
task.reset();  // Resets shared state
auto future2 = task.get_future();  // New future

// future1 is now invalid!
int result = future1.get();  // ERROR
```

---

## Summary

`std::packaged_task` provides explicit control over task execution with future-based result retrieval:

- **Explicit execution**: Choose when and where to run
- **Future-based**: Get results through futures
- **Reusable**: Can be stored and executed later
- **Exception safe**: Exceptions propagate through futures
- **Thread pool friendly**: Perfect for task queues

### Key Takeaways

1. Get the future before moving the task
2. Use move semantics (packaged_task is move-only)
3. Use `shared_ptr` when storing in containers
4. Handle exceptions when calling `get()`
5. Ensure the task is executed before calling `get()`
6. Don't call `get()` multiple times

### When to Use std::packaged_task

- Thread pools and task queues
- When you need explicit control over execution
- Building custom executors
- When you need to store tasks for later execution
- When integrating with existing thread management

### When NOT to Use std::packaged_task

- Simple fire-and-forget tasks (use `std::async`)
- When you don't need explicit control
- For very simple async operations

By understanding `std::packaged_task` and following best practices, you can build efficient task execution systems with explicit control over when and where tasks run.

