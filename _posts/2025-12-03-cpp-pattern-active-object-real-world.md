---
layout: post
title: "C++ Active Object Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns active-object
permalink: /2025/12/03/cpp-pattern-active-object-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, active-object, actor, real-world]
excerpt: "Learn the Active Object pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Active Object Pattern: Real-World Engineering Guide

## Problem Solved

Avoid shared-state bugs by pushing tasks into an object's private thread, ensuring sequential message processing.

## How It Works

- Each object has its own thread and an event queue
- Method calls become messages queued to the object
- Object processes messages sequentially in its thread

## STL Usage

```cpp
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <atomic>
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

## Example

```cpp
#include <iostream>
using namespace std;

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

## Use Cases

- **GUI toolkits**: UI objects process messages in UI thread
- **Actor systems**: Each actor is an active object
- **Game engines**: Game objects process updates sequentially
- **State machines**: Sequential state transitions

## Key Takeaways

- Eliminates shared-state bugs
- Sequential message processing
- Thread-safe by design
- Common in actor systems

## Things to Be Careful About

- **Message ordering**: Messages processed in order
- **Deadlocks**: Circular message dependencies
- **Performance**: Message queuing overhead
- **Callback lifetime**: Ensure callbacks remain valid

## Summary

Active Object pattern eliminates shared-state issues by ensuring sequential message processing in object's own thread.

