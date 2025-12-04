---
layout: post
title: "C++ std::async: Multi-Thread Async Execution Guide and Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading async future promise
permalink: /2025/12/03/cpp-async-guide/
tags: [cpp, concurrency, multithreading, async, future, promise, async-execution, std-async]
excerpt: "Learn about C++ std::async for asynchronous task execution. Guide to launch policies, futures, error handling, and practical examples for parallel programming."
---

# C++ std::async: Multi-Thread Async Execution Guide and Examples

`std::async` is a high-level C++ standard library function that launches asynchronous tasks and returns a `std::future` to access the result. It provides a simple way to execute functions asynchronously without manually managing threads, making it ideal for fire-and-forget tasks and parallel computations.

## Table of Contents

1. [What is std::async?](#what-is-stdasync)
2. [Basic Usage and API](#basic-usage-and-api)
3. [Launch Policies](#launch-policies)
4. [Example 1: Simple Async Task](#example-1-simple-async-task)
5. [Example 2: Parallel Computation](#example-2-parallel-computation)
6. [Example 3: Multiple Async Tasks](#example-3-multiple-async-tasks)
7. [Example 4: Async with Error Handling](#example-4-async-with-error-handling)
8. [Example 5: Deferred Execution](#example-5-deferred-execution)
9. [Example 6: Async with Shared State](#example-6-async-with-shared-state)
10. [Best Practices](#best-practices)
11. [Common Pitfalls](#common-pitfalls)

---

## What is std::async?

`std::async` is a function template that:
- **Launches a function** asynchronously (or synchronously)
- **Returns a `std::future`** to access the result
- **Manages thread lifecycle** automatically
- **Supports launch policies** to control execution behavior

### Key Benefits

- **Simple API**: No need to manually create threads
- **Automatic resource management**: Threads are managed by the standard library
- **Future-based**: Get results when ready
- **Exception safety**: Exceptions are propagated through futures
- **Flexible execution**: Can run immediately or deferred

### When to Use std::async

```cpp
// GOOD: Use std::async for simple async tasks
auto future = async(launch::async, []() {
    return computeExpensiveResult();
});
auto result = future.get();

// BAD: Manual thread management for simple tasks
promise<int> p;
auto f = p.get_future();
thread t([&p]() {
    p.set_value(computeExpensiveResult());
});
t.join();
auto result = f.get();  // More verbose!
```

---

## Basic Usage and API

### Basic Syntax

```cpp
#include <future>
#include <iostream>
using namespace std;

// Basic async call
auto future = async(launch::async, function, args...);
auto result = future.get();  // Wait and get result
```

### Function Signature

```cpp
template<class Function, class... Args>
future<typename result_of<Function(Args...)>::type>
async(launch policy, Function&& f, Args&&... args);
```

### Key Components

- **`std::async`**: Launches the async task
- **`std::future<T>`**: Handle to access the result
- **Launch Policy**: Controls when/how the task executes
- **`get()`**: Waits for result and retrieves it
- **`wait()`**: Waits without retrieving result

---

## Launch Policies

### std::launch::async

Executes the function asynchronously in a new thread:

```cpp
auto future = async(launch::async, []() {
    return 42;
});
// Function starts executing immediately
auto result = future.get();  // Waits if not done
```

### std::launch::deferred

Defers execution until `get()` or `wait()` is called:

```cpp
auto future = async(launch::deferred, []() {
    return 42;
});
// Function hasn't started yet
auto result = future.get();  // Executes now, synchronously
```

### std::launch::async | std::launch::deferred (Default)

Implementation chooses the policy (usually async):

```cpp
auto future = async([]() {  // Default policy
    return 42;
});
```

---

## Example 1: Simple Async Task

Basic async execution with result retrieval:

```cpp
#include <future>
#include <iostream>
#include <thread>
#include <chrono>
using namespace std;

int computeValue(int x) {
    this_thread::sleep_for(chrono::seconds(1));
    return x * 2;
}

int main() {
    cout << "Starting async task..." << endl;
    
    // Launch async task
    auto future = async(launch::async, computeValue, 21);
    
    // Do other work while task runs
    cout << "Doing other work..." << endl;
    this_thread::sleep_for(chrono::milliseconds(500));
    
    // Get result (waits if not ready)
    int result = future.get();
    cout << "Result: " << result << endl;  // Output: Result: 42
    
    return 0;
}
```

**Output:**
```
Starting async task...
Doing other work...
Result: 42
```

---

## Example 2: Parallel Computation

Parallel processing of multiple independent computations:

```cpp
#include <future>
#include <vector>
#include <iostream>
#include <numeric>
#include <algorithm>
using namespace std;

int processChunk(const vector<int>& data, size_t start, size_t end) {
    int sum = 0;
    for (size_t i = start; i < end; ++i) {
        sum += data[i] * data[i];
    }
    return sum;
}

int main() {
    vector<int> data(1000000);
    iota(data.begin(), data.end(), 1);  // Fill with 1..1000000
    
    const size_t num_threads = 4;
    const size_t chunk_size = data.size() / num_threads;
    
    vector<future<int>> futures;
    
    // Launch parallel tasks
    for (size_t i = 0; i < num_threads; ++i) {
        size_t start = i * chunk_size;
        size_t end = (i == num_threads - 1) ? data.size() : (i + 1) * chunk_size;
        
        futures.push_back(async(launch::async, processChunk, 
                                cref(data), start, end));
    }
    
    // Collect results
    int total = 0;
    for (auto& f : futures) {
        total += f.get();
    }
    
    cout << "Total sum: " << total << endl;
    
    return 0;
}
```

---

## Example 3: Multiple Async Tasks

Managing multiple independent async tasks:

```cpp
#include <future>
#include <vector>
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
using namespace std;

string fetchData(const string& url) {
    this_thread::sleep_for(chrono::milliseconds(100));
    return "Data from " + url;
}

int main() {
    vector<string> urls = {
        "http://api1.com",
        "http://api2.com",
        "http://api3.com",
        "http://api4.com"
    };
    
    vector<future<string>> futures;
    
    // Launch all async tasks
    for (const auto& url : urls) {
        futures.push_back(async(launch::async, fetchData, url));
    }
    
    // Process results as they complete
    for (size_t i = 0; i < futures.size(); ++i) {
        string result = futures[i].get();
        cout << "Received: " << result << endl;
    }
    
    return 0;
}
```

**Output:**
```
Received: Data from http://api1.com
Received: Data from http://api2.com
Received: Data from http://api3.com
Received: Data from http://api4.com
```

---

## Example 4: Async with Error Handling

Handling exceptions in async tasks:

```cpp
#include <future>
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
    try {
        // Launch async task that might throw
        auto future = async(launch::async, riskyComputation, -5);
        
        // Exception is propagated when get() is called
        int result = future.get();
        cout << "Result: " << result << endl;
    }
    catch (const exception& e) {
        cout << "Error: " << e.what() << endl;
    }
    
    // Successful case
    try {
        auto future2 = async(launch::async, riskyComputation, 10);
        int result = future2.get();
        cout << "Result: " << result << endl;  // Output: Result: 20
    }
    catch (const exception& e) {
        cout << "Error: " << e.what() << endl;
    }
    
    return 0;
}
```

**Output:**
```
Error: Negative value not allowed
Result: 20
```

---

## Example 5: Deferred Execution

Using deferred launch policy for lazy evaluation:

```cpp
#include <future>
#include <iostream>
#include <chrono>
using namespace std;
using namespace chrono;

int expensiveComputation() {
    cout << "Computing..." << endl;
    this_thread::sleep_for(seconds(2));
    return 42;
}

int main() {
    // Deferred: doesn't start until get() is called
    auto future = async(launch::deferred, expensiveComputation);
    
    cout << "Task created, but not started yet" << endl;
    this_thread::sleep_for(seconds(1));
    
    cout << "Now calling get()..." << endl;
    auto start = high_resolution_clock::now();
    
    int result = future.get();  // Executes synchronously here
    
    auto end = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(end - start);
    
    cout << "Result: " << result << endl;
    cout << "Took: " << duration.count() << " ms" << endl;
    
    return 0;
}
```

**Output:**
```
Task created, but not started yet
Now calling get()...
Computing...
Result: 42
Took: 2000 ms
```

---

## Example 6: Async with Shared State

Sharing state between async tasks and main thread:

```cpp
#include <future>
#include <iostream>
#include <vector>
#include <mutex>
#include <atomic>
using namespace std;

class SharedCounter {
private:
    atomic<int> count_{0};
    mutex mtx_;
    
public:
    void increment() {
        lock_guard<mutex> lock(mtx_);
        count_++;
    }
    
    int get() const {
        return count_.load();
    }
};

void worker(SharedCounter& counter, int iterations) {
    for (int i = 0; i < iterations; ++i) {
        counter.increment();
    }
}

int main() {
    SharedCounter counter;
    const int num_workers = 4;
    const int iterations_per_worker = 1000;
    
    vector<future<void>> futures;
    
    // Launch workers
    for (int i = 0; i < num_workers; ++i) {
        futures.push_back(async(launch::async, worker, 
                                ref(counter), iterations_per_worker));
    }
    
    // Wait for all workers
    for (auto& f : futures) {
        f.wait();
    }
    
    cout << "Final count: " << counter.get() << endl;
    cout << "Expected: " << num_workers * iterations_per_worker << endl;
    
    return 0;
}
```

**Output:**
```
Final count: 4000
Expected: 4000
```

---

## Best Practices

### 1. Always Store the Future

```cpp
// GOOD: Store future to prevent immediate destruction
auto future = async(launch::async, task);
// ... do other work ...
auto result = future.get();

// BAD: Future destroyed immediately, task may be cancelled
async(launch::async, task);  // Future destroyed!
```

### 2. Use Appropriate Launch Policy

```cpp
// For CPU-bound tasks
auto future = async(launch::async, cpuBoundTask);

// For lazy evaluation
auto future = async(launch::deferred, lazyTask);

// Let implementation decide (default)
auto future = async(task);
```

### 3. Handle Exceptions

```cpp
try {
    auto future = async(launch::async, riskyTask);
    auto result = future.get();
}
catch (const exception& e) {
    // Handle exception
}
```

### 4. Use wait_for() for Timeouts

```cpp
auto future = async(launch::async, longRunningTask);

if (future.wait_for(chrono::seconds(5)) == future_status::ready) {
    auto result = future.get();
} else {
    // Task still running
}
```

### 5. Avoid Too Many Concurrent Tasks

```cpp
// GOOD: Limit concurrent tasks
const int max_concurrent = 4;
vector<future<int>> futures;
for (int i = 0; i < 100; ++i) {
    if (futures.size() >= max_concurrent) {
        futures[0].wait();  // Wait for one to complete
        futures.erase(futures.begin());
    }
    futures.push_back(async(launch::async, task, i));
}

// BAD: Creating too many tasks
for (int i = 0; i < 10000; ++i) {
    async(launch::async, task, i);  // May exhaust resources
}
```

---

## Common Pitfalls

### 1. Forgetting to Store the Future

```cpp
// BAD: Future destroyed immediately
async(launch::async, []() {
    // This may never execute!
});

// GOOD: Store future
auto future = async(launch::async, []() {
    // This will execute
});
future.wait();
```

### 2. Calling get() Multiple Times

```cpp
auto future = async(launch::async, []() { return 42; });

int result1 = future.get();  // OK
int result2 = future.get();  // ERROR: future is invalid!
```

### 3. Not Handling Exceptions

```cpp
// BAD: Exception may terminate program
auto future = async(launch::async, []() {
    throw runtime_error("Error!");
});
int result = future.get();  // Throws unhandled exception

// GOOD: Handle exceptions
try {
    auto future = async(launch::async, []() {
        throw runtime_error("Error!");
    });
    int result = future.get();
}
catch (const exception& e) {
    // Handle error
}
```

### 4. Race Conditions with Shared Data

```cpp
// BAD: Unsynchronized access
int counter = 0;
auto future = async(launch::async, [&counter]() {
    counter++;  // Race condition!
});

// GOOD: Use synchronization
mutex mtx;
int counter = 0;
auto future = async(launch::async, [&counter, &mtx]() {
    lock_guard<mutex> lock(mtx);
    counter++;  // Safe
});
```

### 5. Blocking on get() in Critical Paths

```cpp
// BAD: Blocking main thread
auto future = async(launch::async, longTask);
int result = future.get();  // Blocks here
// Can't do anything else

// GOOD: Check if ready first
auto future = async(launch::async, longTask);
if (future.wait_for(chrono::milliseconds(100)) == future_status::ready) {
    int result = future.get();
} else {
    // Do other work, check later
}
```

### 6. Using Deferred When Async is Needed

```cpp
// BAD: Deferred executes synchronously
auto future = async(launch::deferred, task);
// ... do other work ...
int result = future.get();  // Executes synchronously here!

// GOOD: Use async for true parallelism
auto future = async(launch::async, task);
// ... do other work ...
int result = future.get();  // Already running in parallel
```

---

## Summary

`std::async` provides a simple and powerful way to execute tasks asynchronously in C++:

- **Simple API**: No manual thread management needed
- **Future-based**: Get results when ready
- **Exception safe**: Exceptions propagate through futures
- **Flexible**: Support for async and deferred execution
- **Standard library**: Part of C++11 standard

### Key Takeaways

1. Always store the `future` returned by `async`
2. Use appropriate launch policies for your use case
3. Handle exceptions when calling `get()`
4. Avoid calling `get()` multiple times
5. Use synchronization for shared data access
6. Consider using `wait_for()` for non-blocking checks

### When to Use std::async

- Simple async tasks that return a value
- Parallel computations that can be split into independent tasks
- Fire-and-forget tasks with result retrieval
- When you need exception propagation from async tasks

### When NOT to Use std::async

- Complex thread pool requirements (use custom thread pool)
- Tasks that need fine-grained control over thread lifecycle
- When you need to cancel tasks (use `std::thread` with cancellation tokens)
- Very high-frequency task spawning (overhead may be too high)

By understanding `std::async` and following best practices, you can write efficient and maintainable concurrent C++ code.

