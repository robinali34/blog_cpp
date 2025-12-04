---
layout: post
title: "C++ std::promise and std::future: Multi-Thread Communication Guide and Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading promise future communication
permalink: /2025/12/03/cpp-promise-future-guide/
tags: [cpp, concurrency, multithreading, promise, future, communication, async, shared-state]
excerpt: "Learn about C++ std::promise and std::future for thread communication. Guide to setting values, propagating exceptions, and practical examples for concurrent programming."
---

# C++ std::promise and std::future: Multi-Thread Communication Guide and Examples

`std::promise` and `std::future` provide a mechanism for one thread to set a value (or exception) that another thread can retrieve. They form a communication channel between threads, allowing safe transfer of data and exceptions across thread boundaries.

## Table of Contents

1. [What are std::promise and std::future?](#what-are-stdpromise-and-stdfuture)
2. [Basic Usage and API](#basic-usage-and-api)
3. [Example 1: Simple Promise-Future](#example-1-simple-promise-future)
4. [Example 2: Promise with Exception](#example-2-promise-with-exception)
5. [Example 3: Multiple Promises](#example-3-multiple-promises)
6. [Example 4: Promise as Callback](#example-4-promise-as-callback)
7. [Example 5: Producer-Consumer with Promise](#example-5-producer-consumer-with-promise)
8. [Example 6: Timeout with Future](#example-6-timeout-with-future)
9. [Best Practices](#best-practices)
10. [Common Pitfalls](#common-pitfalls)

---

## What are std::promise and std::future?

`std::promise` and `std::future` work together:
- **`std::promise`**: Sets a value or exception in a shared state
- **`std::future`**: Retrieves the value or exception from the shared state
- **Shared state**: The communication channel between promise and future

### Key Benefits

- **Thread-safe communication**: Safe data transfer between threads
- **Exception propagation**: Exceptions can be passed between threads
- **Blocking or non-blocking**: Wait for results with timeouts
- **Single producer, single consumer**: One promise, one future
- **Standard library**: Part of C++11 standard

### When to Use Promise-Future

```cpp
// GOOD: Use promise-future for explicit thread communication
promise<int> prom;
future<int> fut = prom.get_future();

thread worker([&prom]() {
    int result = compute();
    prom.set_value(result);
});

int result = fut.get();  // Wait for result
worker.join();

// BAD: Using shared variables with manual synchronization
int result;
mutex mtx;
condition_variable cv;
bool ready = false;
// More complex and error-prone
```

---

## Basic Usage and API

### Basic Syntax

```cpp
#include <future>
#include <thread>
using namespace std;

// Create promise-future pair
promise<T> prom;
future<T> fut = prom.get_future();

// In producer thread
prom.set_value(value);  // or prom.set_exception(exception_ptr)

// In consumer thread
T value = fut.get();  // Blocks until value is set
```

### Key Methods

**std::promise:**
- **`get_future()`**: Returns the associated future
- **`set_value()`**: Sets the value in shared state
- **`set_exception()`**: Sets an exception in shared state
- **`set_value_at_thread_exit()`**: Sets value when thread exits
- **`set_exception_at_thread_exit()`**: Sets exception when thread exits

**std::future:**
- **`get()`**: Gets the value (blocks until ready)
- **`wait()`**: Waits until value is ready
- **`wait_for()`**: Waits with timeout
- **`wait_until()`**: Waits until time point
- **`valid()`**: Checks if future has valid shared state
- **`share()`**: Converts to `std::shared_future`

---

## Example 1: Simple Promise-Future

Basic promise-future communication:

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <chrono>
using namespace std;

int computeValue(int x) {
    this_thread::sleep_for(chrono::milliseconds(500));
    return x * 2;
}

int main() {
    promise<int> prom;
    future<int> fut = prom.get_future();
    
    // Start worker thread
    thread worker([&prom]() {
        int result = computeValue(21);
        prom.set_value(result);
    });
    
    // Do other work
    cout << "Doing other work..." << endl;
    this_thread::sleep_for(chrono::milliseconds(200));
    
    // Get result (blocks until ready)
    int result = fut.get();
    cout << "Result: " << result << endl;  // Output: Result: 42
    
    worker.join();
    return 0;
}
```

**Output:**
```
Doing other work...
Result: 42
```

---

## Example 2: Promise with Exception

Propagating exceptions through promise-future:

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
    promise<int> prom;
    future<int> fut = prom.get_future();
    
    thread worker([&prom]() {
        try {
            int result = riskyComputation(-5);
            prom.set_value(result);
        }
        catch (...) {
            prom.set_exception(current_exception());
        }
    });
    
    try {
        int result = fut.get();
        cout << "Result: " << result << endl;
    }
    catch (const exception& e) {
        cout << "Error: " << e.what() << endl;  // Output: Error: Negative value not allowed
    }
    
    worker.join();
    
    // Successful case
    promise<int> prom2;
    future<int> fut2 = prom2.get_future();
    
    thread worker2([&prom2]() {
        try {
            int result = riskyComputation(10);
            prom2.set_value(result);
        }
        catch (...) {
            prom2.set_exception(current_exception());
        }
    });
    
    try {
        int result = fut2.get();
        cout << "Result: " << result << endl;  // Output: Result: 20
    }
    catch (const exception& e) {
        cout << "Error: " << e.what() << endl;
    }
    
    worker2.join();
    return 0;
}
```

**Output:**
```
Error: Negative value not allowed
Result: 20
```

---

## Example 3: Multiple Promises

Managing multiple promise-future pairs:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
#include <chrono>
using namespace std;

int processTask(int id) {
    this_thread::sleep_for(chrono::milliseconds(100 * id));
    return id * id;
}

int main() {
    const int num_tasks = 5;
    vector<promise<int>> promises(num_tasks);
    vector<future<int>> futures;
    vector<thread> threads;
    
    // Create futures
    for (auto& prom : promises) {
        futures.push_back(prom.get_future());
    }
    
    // Start worker threads
    for (int i = 0; i < num_tasks; ++i) {
        threads.emplace_back([&promises, i]() {
            int result = processTask(i);
            promises[i].set_value(result);
        });
    }
    
    // Collect results
    for (size_t i = 0; i < futures.size(); ++i) {
        int result = futures[i].get();
        cout << "Task " << i << " result: " << result << endl;
    }
    
    // Join threads
    for (auto& t : threads) {
        t.join();
    }
    
    return 0;
}
```

**Output:**
```
Task 0 result: 0
Task 1 result: 1
Task 2 result: 4
Task 3 result: 9
Task 4 result: 16
```

---

## Example 4: Promise as Callback

Using promise as a callback mechanism:

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <functional>
#include <chrono>
using namespace std;

class AsyncAPI {
public:
    template<typename Callback>
    void fetchData(const string& url, Callback&& callback) {
        thread([url, callback]() {
            this_thread::sleep_for(chrono::milliseconds(200));
            string data = "Data from " + url;
            callback(data);
        }).detach();
    }
};

int main() {
    AsyncAPI api;
    
    // Use promise as callback
    promise<string> prom;
    future<string> fut = prom.get_future();
    
    api.fetchData("http://api.com", [&prom](const string& data) {
        prom.set_value(data);
    });
    
    // Do other work
    cout << "Doing other work..." << endl;
    
    // Get result
    string result = fut.get();
    cout << "Received: " << result << endl;
    
    return 0;
}
```

**Output:**
```
Doing other work...
Received: Data from http://api.com
```

---

## Example 5: Producer-Consumer with Promise

Using promise for producer-consumer pattern:

```cpp
#include <future>
#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <iostream>
using namespace std;

template<typename T>
class PromiseQueue {
private:
    queue<promise<T>> promises_;
    queue<T> values_;
    mutex mtx_;
    condition_variable cv_;

public:
    future<T> getFuture() {
        unique_lock<mutex> lock(mtx_);
        promise<T> prom;
        future<T> fut = prom.get_future();
        promises_.push(move(prom));
        cv_.notify_one();
        return fut;
    }
    
    void setValue(T value) {
        unique_lock<mutex> lock(mtx_);
        cv_.wait(lock, [this]() { return !promises_.empty(); });
        
        promise<T> prom = move(promises_.front());
        promises_.pop();
        lock.unlock();
        
        prom.set_value(value);
    }
};

int main() {
    PromiseQueue<int> queue;
    
    // Consumer: get future
    auto fut1 = queue.getFuture();
    auto fut2 = queue.getFuture();
    
    // Producer: set values
    thread producer([&queue]() {
        this_thread::sleep_for(chrono::milliseconds(100));
        queue.setValue(42);
        queue.setValue(100);
    });
    
    // Get results
    cout << "Result 1: " << fut1.get() << endl;  // Output: Result 1: 42
    cout << "Result 2: " << fut2.get() << endl;  // Output: Result 2: 100
    
    producer.join();
    return 0;
}
```

---

## Example 6: Timeout with Future

Using wait_for() for timeouts:

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <chrono>
using namespace std;
using namespace chrono;

int longRunningTask(int x) {
    this_thread::sleep_for(seconds(3));
    return x * 2;
}

int main() {
    promise<int> prom;
    future<int> fut = prom.get_future();
    
    thread worker([&prom]() {
        int result = longRunningTask(21);
        prom.set_value(result);
    });
    
    // Wait with timeout
    auto status = fut.wait_for(seconds(1));
    
    if (status == future_status::ready) {
        int result = fut.get();
        cout << "Result: " << result << endl;
    }
    else if (status == future_status::timeout) {
        cout << "Task timed out!" << endl;
        // Note: Worker thread still running!
    }
    else {
        cout << "Task deferred" << endl;
    }
    
    // Wait for worker to complete
    worker.join();
    
    // Try to get result again
    if (fut.valid()) {
        int result = fut.get();
        cout << "Final result: " << result << endl;
    }
    
    return 0;
}
```

**Output:**
```
Task timed out!
Final result: 42
```

---

## Best Practices

### 1. Always Set Promise Value

```cpp
// GOOD: Always set value or exception
promise<int> prom;
future<int> fut = prom.get_future();

thread worker([&prom]() {
    try {
        int result = compute();
        prom.set_value(result);
    }
    catch (...) {
        prom.set_exception(current_exception());
    }
});

// BAD: Forgetting to set value
promise<int> prom;
future<int> fut = prom.get_future();
// Forgot to set value!
int result = fut.get();  // Blocks forever
```

### 2. Use set_value_at_thread_exit for Thread Safety

```cpp
// GOOD: Set value at thread exit
promise<int> prom;
future<int> fut = prom.get_future();

thread worker([&prom]() {
    int result = compute();
    prom.set_value_at_thread_exit(result);
    // Other cleanup code
});

// Value is set when thread exits, ensuring thread safety
```

### 3. Handle Exceptions Properly

```cpp
// GOOD: Catch and set exception
thread worker([&prom]() {
    try {
        int result = riskyComputation();
        prom.set_value(result);
    }
    catch (...) {
        prom.set_exception(current_exception());
    }
});

// BAD: Exception not caught
thread worker([&prom]() {
    int result = riskyComputation();  // May throw
    prom.set_value(result);  // Exception not propagated
});
```

### 4. Use wait_for() for Non-Blocking Checks

```cpp
// GOOD: Check if ready without blocking
if (fut.wait_for(chrono::seconds(0)) == future_status::ready) {
    int result = fut.get();
} else {
    // Do other work
}

// BAD: Always blocking
int result = fut.get();  // Always blocks
```

### 5. Don't Call get() Multiple Times

```cpp
promise<int> prom;
future<int> fut = prom.get_future();

thread worker([&prom]() {
    prom.set_value(42);
});
worker.join();

int result1 = fut.get();  // OK
int result2 = fut.get();  // ERROR: future is invalid!
```

---

## Common Pitfalls

### 1. Not Setting Promise Value

```cpp
// BAD: Promise never set
promise<int> prom;
future<int> fut = prom.get_future();
// Forgot to set value!
int result = fut.get();  // Blocks forever

// GOOD: Always set value
promise<int> prom;
future<int> fut = prom.get_future();
thread worker([&prom]() {
    prom.set_value(42);
});
worker.join();
int result = fut.get();
```

### 2. Setting Value Multiple Times

```cpp
// BAD: Setting value twice
promise<int> prom;
prom.set_value(42);
prom.set_value(100);  // ERROR: std::future_error

// GOOD: Set value once
promise<int> prom;
prom.set_value(42);  // Only once
```

### 3. Destroying Promise Before Setting Value

```cpp
// BAD: Promise destroyed before value set
future<int> f;
{
    promise<int> prom;
    f = prom.get_future();
    // Promise destroyed here!
}
// Can't set value anymore, future.get() will block forever

// GOOD: Keep promise alive
promise<int> prom;
future<int> f = prom.get_future();
thread worker([&prom]() {
    prom.set_value(42);
});
worker.join();
int result = f.get();
```

### 4. Race Conditions

```cpp
// BAD: Accessing promise from multiple threads
promise<int> prom;
future<int> fut = prom.get_future();

thread t1([&prom]() { prom.set_value(1); });
thread t2([&prom]() { prom.set_value(2); });  // ERROR: Multiple sets

// GOOD: One thread sets value
promise<int> prom;
future<int> fut = prom.get_future();
thread worker([&prom]() {
    prom.set_value(42);
});
```

### 5. Not Handling Exceptions

```cpp
// BAD: Exception not caught
promise<int> prom;
future<int> fut = prom.get_future();

thread worker([&prom]() {
    throw runtime_error("Error!");
    prom.set_value(42);  // Never reached
});

int result = fut.get();  // Throws unhandled exception

// GOOD: Handle exceptions
try {
    int result = fut.get();
}
catch (const exception& e) {
    // Handle error
}
```

### 6. Using get() Without Checking

```cpp
// BAD: Always blocking
int result = fut.get();  // Blocks indefinitely if not ready

// GOOD: Check status first
if (fut.wait_for(chrono::seconds(0)) == future_status::ready) {
    int result = fut.get();
} else {
    // Handle not ready
}
```

---

## Summary

`std::promise` and `std::future` provide a clean mechanism for thread communication:

- **Thread-safe**: Safe data transfer between threads
- **Exception propagation**: Exceptions can be passed between threads
- **Flexible waiting**: Blocking or non-blocking with timeouts
- **Standard library**: Part of C++11 standard
- **Single producer-consumer**: One promise, one future

### Key Takeaways

1. Always set the promise value (or exception)
2. Don't set the value multiple times
3. Keep the promise alive until the value is set
4. Handle exceptions properly
5. Use `wait_for()` for non-blocking checks
6. Don't call `get()` multiple times

### When to Use Promise-Future

- Explicit thread communication
- When you need exception propagation
- Building custom async APIs
- Producer-consumer patterns
- When you need fine-grained control over value setting

### When NOT to Use Promise-Future

- Simple async tasks (use `std::async`)
- When you need multiple consumers (use `std::shared_future`)
- Fire-and-forget tasks (use detached threads)

By understanding `std::promise` and `std::future` and following best practices, you can build robust thread communication mechanisms in C++.

