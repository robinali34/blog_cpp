---
layout: post
title: "C++ std::shared_future: Multi-Thread Shared Result Guide and Examples"
date: 2025-12-03 00:00:00 -0800
permalink: /2025/12/03/cpp-shared-future-guide/
categories: cpp concurrency multithreading shared-future future
tags: [cpp, concurrency, multithreading, shared-future, future, shared-state, multi-consumer]
excerpt: "Learn about C++ std::shared_future for sharing results between multiple threads. Guide to multi-consumer patterns, broadcasting results, and practical examples."
---

# C++ std::shared_future: Multi-Thread Shared Result Guide and Examples

`std::shared_future` is similar to `std::future`, but allows multiple threads to wait for and retrieve the same result. Unlike `std::future` which is move-only and can only be accessed once, `std::shared_future` is copyable and can be accessed by multiple threads simultaneously.

## Table of Contents

1. [What is std::shared_future?](#what-is-stdshared_future)
2. [Basic Usage and API](#basic-usage-and-api)
3. [Example 1: Simple Shared Future](#example-1-simple-shared-future)
4. [Example 2: Multiple Consumers](#example-2-multiple-consumers)
5. [Example 3: Broadcasting Results](#example-3-broadcasting-results)
6. [Example 4: Shared Future with Promise](#example-4-shared-future-with-promise)
7. [Example 5: Shared Future with Async](#example-5-shared-future-with-async)
8. [Example 6: Condition Variable Alternative](#example-6-condition-variable-alternative)
9. [Best Practices](#best-practices)
10. [Common Pitfalls](#common-pitfalls)

---

## What is std::shared_future?

`std::shared_future` is a class template that:
- **Shares a result** between multiple threads
- **Is copyable** (unlike `std::future`)
- **Can be accessed multiple times** by multiple threads
- **Waits for shared state** to become ready
- **Propagates exceptions** to all waiting threads

### Key Differences from std::future

| Feature | std::future | std::shared_future |
|---------|-------------|-------------------|
| Copyable | No (move-only) | Yes |
| Multiple access | No | Yes |
| Multiple consumers | No | Yes |
| get() calls | Once | Multiple times |

### When to Use std::shared_future

```cpp
// GOOD: Use shared_future for multiple consumers
auto sf = async(launch::async, compute).share();

thread t1([sf]() {
    int result = sf.get();  // Multiple threads can call get()
    process(result);
});

thread t2([sf]() {
    int result = sf.get();  // Same result
    process(result);
});

// BAD: Using future for multiple consumers
auto f = async(launch::async, compute);
thread t1([&f]() {
    int r1 = f.get();  // ERROR: future is move-only
});
thread t2([&f]() {
    int r2 = f.get();  // ERROR: can't copy future
});
```

---

## Basic Usage and API

### Basic Syntax

```cpp
#include <future>
using namespace std;

// Create from future
future<int> f = async(launch::async, compute);
shared_future<int> sf = f.share();  // Convert

// Or directly from async
auto sf = async(launch::async, compute).share();

// Use in multiple threads
thread t1([sf]() {
    int result = sf.get();  // Can call multiple times
});
```

### Key Methods

- **`get()`**: Gets the value (can be called multiple times)
- **`wait()`**: Waits until value is ready
- **`wait_for()`**: Waits with timeout
- **`wait_until()`**: Waits until time point
- **`valid()`**: Checks if shared_future has valid shared state

### Creating shared_future

```cpp
// From future
future<int> f = async(launch::async, compute);
shared_future<int> sf = f.share();

// From promise
promise<int> p;
shared_future<int> sf = p.get_future().share();

// From packaged_task
packaged_task<int()> task(compute);
shared_future<int> sf = task.get_future().share();
```

---

## Example 1: Simple Shared Future

Basic usage with multiple threads:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
#include <chrono>
using namespace std;

int computeValue() {
    this_thread::sleep_for(chrono::milliseconds(500));
    return 42;
}

int main() {
    // Create shared_future
    auto sf = async(launch::async, computeValue).share();
    
    // Multiple threads can access the same result
    vector<thread> threads;
    
    for (int i = 0; i < 3; ++i) {
        threads.emplace_back([sf, i]() {
            int result = sf.get();  // All get the same value
            cout << "Thread " << i << " got: " << result << endl;
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    return 0;
}
```

**Output:**
```
Thread 0 got: 42
Thread 1 got: 42
Thread 2 got: 42
```

---

## Example 2: Multiple Consumers

Multiple threads waiting for the same result:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
#include <chrono>
using namespace std;

string fetchData() {
    this_thread::sleep_for(chrono::seconds(1));
    return "Data from server";
}

void processData(const string& data, int id) {
    cout << "Processor " << id << " processing: " << data << endl;
}

int main() {
    // Single async task
    auto sf = async(launch::async, fetchData).share();
    
    // Multiple processors waiting for the same data
    vector<thread> processors;
    
    for (int i = 0; i < 5; ++i) {
        processors.emplace_back([sf, i]() {
            string data = sf.get();  // All wait for same result
            processData(data, i);
        });
    }
    
    for (auto& p : processors) {
        p.join();
    }
    
    return 0;
}
```

**Output:**
```
Processor 0 processing: Data from server
Processor 1 processing: Data from server
Processor 2 processing: Data from server
Processor 3 processing: Data from server
Processor 4 processing: Data from server
```

---

## Example 3: Broadcasting Results

Broadcasting a single result to multiple subscribers:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
#include <functional>
using namespace std;

class EventBroadcaster {
private:
    shared_future<int> event_future_;

public:
    void setEvent(future<int> f) {
        event_future_ = f.share();
    }
    
    void subscribe(function<void(int)> callback) {
        thread([this, callback]() {
            int value = event_future_.get();  // Wait for event
            callback(value);
        }).detach();
    }
};

int main() {
    EventBroadcaster broadcaster;
    
    // Create event
    promise<int> event_promise;
    future<int> event_future = event_promise.get_future();
    broadcaster.setEvent(move(event_future));
    
    // Multiple subscribers
    vector<int> received_values;
    mutex mtx;
    
    for (int i = 0; i < 5; ++i) {
        broadcaster.subscribe([&received_values, &mtx](int value) {
            lock_guard<mutex> lock(mtx);
            received_values.push_back(value);
            cout << "Subscriber received: " << value << endl;
        });
    }
    
    // Trigger event
    this_thread::sleep_for(chrono::milliseconds(100));
    event_promise.set_value(42);
    
    // Wait for all subscribers
    this_thread::sleep_for(chrono::milliseconds(200));
    
    cout << "Total subscribers: " << received_values.size() << endl;
    
    return 0;
}
```

---

## Example 4: Shared Future with Promise

Using shared_future with promise for explicit control:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
#include <chrono>
using namespace std;

int computeResult(int input) {
    this_thread::sleep_for(chrono::milliseconds(500));
    return input * 2;
}

int main() {
    promise<int> prom;
    shared_future<int> sf = prom.get_future().share();
    
    // Multiple consumers
    vector<thread> consumers;
    
    for (int i = 0; i < 3; ++i) {
        consumers.emplace_back([sf, i]() {
            cout << "Consumer " << i << " waiting..." << endl;
            int result = sf.get();
            cout << "Consumer " << i << " got: " << result << endl;
        });
    }
    
    // Producer
    thread producer([&prom]() {
        int result = computeResult(21);
        prom.set_value(result);
    });
    
    // Wait for all
    for (auto& c : consumers) {
        c.join();
    }
    producer.join();
    
    return 0;
}
```

**Output:**
```
Consumer 0 waiting...
Consumer 1 waiting...
Consumer 2 waiting...
Consumer 0 got: 42
Consumer 1 got: 42
Consumer 2 got: 42
```

---

## Example 5: Shared Future with Async

Using shared_future with std::async:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
#include <numeric>
#include <algorithm>
using namespace std;

vector<int> processData(const vector<int>& input) {
    this_thread::sleep_for(chrono::milliseconds(200));
    vector<int> result = input;
    transform(result.begin(), result.end(), result.begin(),
              [](int x) { return x * x; });
    return result;
}

void analyzeData(const vector<int>& data, int id) {
    int sum = accumulate(data.begin(), data.end(), 0);
    cout << "Analyzer " << id << " sum: " << sum << endl;
}

int main() {
    vector<int> input(100);
    iota(input.begin(), input.end(), 1);
    
    // Single async computation
    auto sf = async(launch::async, processData, cref(input)).share();
    
    // Multiple analyzers
    vector<thread> analyzers;
    
    for (int i = 0; i < 3; ++i) {
        analyzers.emplace_back([sf, i]() {
            vector<int> data = sf.get();  // All get same processed data
            analyzeData(data, i);
        });
    }
    
    for (auto& a : analyzers) {
        a.join();
    }
    
    return 0;
}
```

---

## Example 6: Condition Variable Alternative

Using shared_future as an alternative to condition variables:

```cpp
#include <future>
#include <thread>
#include <vector>
#include <iostream>
#include <mutex>
using namespace std;

class SimpleBarrier {
private:
    promise<void> prom_;
    shared_future<void> sf_;

public:
    SimpleBarrier() : sf_(prom_.get_future().share()) {}
    
    void wait() {
        sf_.wait();  // All threads wait here
    }
    
    void notify() {
        prom_.set_value();  // Release all waiting threads
    }
};

int main() {
    SimpleBarrier barrier;
    
    vector<thread> threads;
    
    // Multiple threads waiting
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([&barrier, i]() {
            cout << "Thread " << i << " waiting..." << endl;
            barrier.wait();
            cout << "Thread " << i << " released!" << endl;
        });
    }
    
    // Release all threads
    this_thread::sleep_for(chrono::milliseconds(500));
    cout << "Releasing all threads..." << endl;
    barrier.notify();
    
    for (auto& t : threads) {
        t.join();
    }
    
    return 0;
}
```

**Output:**
```
Thread 0 waiting...
Thread 1 waiting...
Thread 2 waiting...
Thread 3 waiting...
Thread 4 waiting...
Releasing all threads...
Thread 0 released!
Thread 1 released!
Thread 2 released!
Thread 3 released!
Thread 4 released!
```

---

## Best Practices

### 1. Use share() to Convert Future

```cpp
// GOOD: Convert future to shared_future
auto f = async(launch::async, compute);
auto sf = f.share();  // Now copyable

// BAD: Trying to copy future
auto f = async(launch::async, compute);
shared_future<int> sf = f;  // ERROR: future is move-only
```

### 2. Capture by Value in Lambdas

```cpp
// GOOD: Capture shared_future by value
auto sf = async(launch::async, compute).share();
thread t([sf]() {  // Copy shared_future
    int result = sf.get();
});

// BAD: Capturing by reference (may dangle)
auto sf = async(launch::async, compute).share();
thread t([&sf]() {  // Reference may be invalid
    int result = sf.get();
});
```

### 3. All Threads Get Same Result

```cpp
// GOOD: All threads get the same value
auto sf = async(launch::async, []() { return 42; }).share();

thread t1([sf]() {
    int r1 = sf.get();  // 42
});

thread t2([sf]() {
    int r2 = sf.get();  // 42 (same value)
});
```

### 4. Handle Exceptions in All Threads

```cpp
// GOOD: All threads handle exceptions
auto sf = async(launch::async, riskyTask).share();

for (int i = 0; i < 3; ++i) {
    thread([sf, i]() {
        try {
            int result = sf.get();
            process(result, i);
        }
        catch (const exception& e) {
            handleError(e, i);
        }
    }).detach();
}
```

### 5. Use for One-Time Events

```cpp
// GOOD: shared_future for one-time events
promise<void> event;
auto sf = event.get_future().share();

// Multiple threads wait for event
for (int i = 0; i < 5; ++i) {
    thread([sf]() {
        sf.wait();  // Wait for event
        // Process event
    }).detach();
}

event.set_value();  // Trigger event for all
```

---

## Common Pitfalls

### 1. Converting Future After Move

```cpp
// BAD: Future already moved
future<int> f = async(launch::async, compute);
thread t(move(f));  // f is moved
auto sf = f.share();  // ERROR: f is invalid

// GOOD: Convert before moving
future<int> f = async(launch::async, compute);
auto sf = f.share();  // Convert first
// Now f is invalid, but sf is valid
```

### 2. Not Capturing by Value

```cpp
// BAD: Reference may dangle
auto sf = async(launch::async, compute).share();
{
    thread t([&sf]() {  // Reference
        int result = sf.get();
    });
    // sf may be destroyed before thread uses it
}

// GOOD: Capture by value
auto sf = async(launch::async, compute).share();
{
    thread t([sf]() {  // Copy
        int result = sf.get();
    });
    // sf copy is safe
}
```

### 3. Expecting Different Results

```cpp
// BAD: Expecting different values
auto sf = async(launch::async, []() { return 42; }).share();

thread t1([sf]() {
    int r1 = sf.get();  // 42
    // Expecting different value?
});

thread t2([sf]() {
    int r2 = sf.get();  // 42 (same!)
});

// GOOD: All get the same result
// This is the intended behavior
```

### 4. Race Conditions with Shared Data

```cpp
// BAD: Unsynchronized access to shared data
vector<int> results;
auto sf = async(launch::async, compute).share();

for (int i = 0; i < 5; ++i) {
    thread([sf, &results, i]() {
        int result = sf.get();
        results.push_back(result);  // Race condition!
    }).detach();
}

// GOOD: Use synchronization
mutex mtx;
vector<int> results;
auto sf = async(launch::async, compute).share();

for (int i = 0; i < 5; ++i) {
    thread([sf, &results, &mtx, i]() {
        int result = sf.get();
        lock_guard<mutex> lock(mtx);
        results.push_back(result);  // Safe
    }).detach();
}
```

### 5. Not Handling Exceptions

```cpp
// BAD: Exception not handled
auto sf = async(launch::async, riskyTask).share();

thread t([sf]() {
    int result = sf.get();  // May throw
    process(result);
});

// GOOD: Handle exceptions
auto sf = async(launch::async, riskyTask).share();

thread t([sf]() {
    try {
        int result = sf.get();
        process(result);
    }
    catch (const exception& e) {
        handleError(e);
    }
});
```

---

## Summary

`std::shared_future` enables multiple threads to share the same async result:

- **Multiple consumers**: Multiple threads can wait for the same result
- **Copyable**: Unlike `std::future`, can be copied
- **Multiple get() calls**: Can call `get()` multiple times
- **Exception propagation**: Exceptions propagate to all waiting threads
- **Standard library**: Part of C++11 standard

### Key Takeaways

1. Use `share()` to convert `future` to `shared_future`
2. Capture `shared_future` by value in lambdas
3. All threads get the same result value
4. Handle exceptions in all consumer threads
5. Use for one-time events and broadcasting

### When to Use std::shared_future

- Multiple threads need the same result
- Broadcasting results to multiple subscribers
- One-time events with multiple waiters
- When you need to call `get()` multiple times
- Building observer patterns

### When NOT to Use std::shared_future

- Single consumer (use `std::future`)
- When you need different results per thread
- Simple async tasks (use `std::async` with `std::future`)

By understanding `std::shared_future` and following best practices, you can build efficient multi-consumer patterns in C++.

