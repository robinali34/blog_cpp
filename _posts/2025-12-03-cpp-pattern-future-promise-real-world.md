---
layout: post
title: "C++ Future/Promise Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns future promise
permalink: /2025/12/03/cpp-pattern-future-promise-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, future, promise, async, real-world]
excerpt: "Learn the Future/Promise pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Future/Promise Pattern: Real-World Engineering Guide

## Problem Solved

Retrieve the result of asynchronous operations without blocking the calling thread unnecessarily.

## How It Works

- A thread starts a task and returns a Future object immediately
- The caller can wait (blocking or non-blocking) for the result
- Promise sets the result, Future retrieves it

## STL Usage

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <chrono>
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

## Example

```cpp
#include <functional>
#include <memory>
using namespace std;

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

## Use Cases

- **Async I/O**: File/network operations
- **Parallel computation**: Multiple independent tasks
- **UI frameworks**: Non-blocking background work
- **Web services**: Async request handling

## Key Takeaways

- Non-blocking async operations
- Clean result retrieval
- Composable with other futures
- Standard library support (C++11+)

## Things to Be Careful About

- **Single get()**: Future can only be read once
- **Exception propagation**: Exceptions thrown in async tasks
- **Thread lifetime**: Ensure promise is set before future is destroyed
- **Shared state**: Futures share state, be careful with copying

## Summary

Futures and promises provide a clean way to handle async results, essential for modern concurrent programming.

