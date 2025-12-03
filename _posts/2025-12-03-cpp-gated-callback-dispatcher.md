---
layout: post
title: "C++ Gated Controlled Callback Dispatcher: Multi-Thread Pattern"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading callback-dispatcher gate
permalink: /2025/12/03/cpp-gated-callback-dispatcher/
tags: [cpp, concurrency, multithreading, callback-dispatcher, gate, event-handling, async-callbacks]
excerpt: "Learn how to implement a gated controlled callback dispatcher in C++ for managing async callbacks with gate control. Guide to event-driven architectures with controlled execution."
---

# C++ Gated Controlled Callback Dispatcher: Multi-Thread Pattern

A gated controlled callback dispatcher manages the execution of callbacks with gate-based control, allowing you to enable/disable callback execution and manage callback queues efficiently.

## Table of Contents

1. [Overview](#overview)
2. [Basic Implementation](#basic-implementation)
3. [Example 1: Simple Callback Dispatcher](#example-1-simple-callback-dispatcher)
4. [Example 2: Priority Callback Dispatcher](#example-2-priority-callback-dispatcher)
5. [Example 3: Event-Driven System](#example-3-event-driven-system)
6. [Example 4: Rate-Limited Dispatcher](#example-4-rate-limited-dispatcher)
7. [Best Practices](#best-practices)

---

## Overview

A gated callback dispatcher:

- **Manages callbacks**: Queues and executes callbacks
- **Gate control**: Enables/disables callback execution
- **Thread-safe**: Safe for concurrent access
- **Flexible**: Supports priorities, filtering, and rate limiting

### Use Cases

- **Event systems**: Dispatch events to handlers
- **Notification systems**: Send notifications with control
- **API callbacks**: Handle async API responses
- **State machines**: Trigger state transitions

---

## Basic Implementation

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <functional>
#include <atomic>
#include <vector>
using namespace std;

class GatedCallbackDispatcher {
private:
    queue<function<void()>> callbacks_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> gate_open_{true};
    atomic<bool> stop_{false};
    thread dispatcher_thread_;

    void dispatcherLoop() {
        while (true) {
            function<void()> callback;
            {
                unique_lock<mutex> lock(mtx_);
                cv_.wait(lock, [this]() {
                    return stop_ || (gate_open_ && !callbacks_.empty());
                });
                
                if (stop_ && callbacks_.empty()) {
                    return;
                }
                
                if (!gate_open_ || callbacks_.empty()) {
                    continue;
                }
                
                callback = callbacks_.front();
                callbacks_.pop();
            }
            
            try {
                callback();
            } catch (...) {
                // Handle callback errors
            }
        }
    }

public:
    GatedCallbackDispatcher() 
        : dispatcher_thread_([this]() { dispatcherLoop(); }) {}

    void dispatch(function<void()> callback) {
        {
            lock_guard<mutex> lock(mtx_);
            callbacks_.push(callback);
        }
        cv_.notify_one();
    }

    void openGate() {
        gate_open_ = true;
        cv_.notify_all();
    }

    void closeGate() {
        gate_open_ = false;
    }

    bool isGateOpen() const {
        return gate_open_.load();
    }

    size_t pendingCallbacks() const {
        lock_guard<mutex> lock(mtx_);
        return callbacks_.size();
    }

    ~GatedCallbackDispatcher() {
        {
            lock_guard<mutex> lock(mtx_);
            stop_ = true;
        }
        cv_.notify_one();
        dispatcher_thread_.join();
    }
};
```

---

## Example 1: Simple Callback Dispatcher

```cpp
void simpleDispatcher() {
    GatedCallbackDispatcher dispatcher;
    
    // Dispatch callbacks
    for (int i = 0; i < 5; ++i) {
        dispatcher.dispatch([i]() {
            cout << "Callback " << i << " executed" << endl;
        });
    }
    
    // Close gate - callbacks queue
    dispatcher.closeGate();
    
    dispatcher.dispatch([]() {
        cout << "This will wait" << endl;
    });
    
    this_thread::sleep_for(chrono::milliseconds(100));
    
    // Open gate - queued callback executes
    dispatcher.openGate();
    
    this_thread::sleep_for(chrono::milliseconds(200));
}
```

---

## Example 2: Priority Callback Dispatcher

```cpp
struct PriorityCallback {
    function<void()> callback;
    int priority;
    
    bool operator<(const PriorityCallback& other) const {
        return priority < other.priority;
    }
};

class PriorityGatedDispatcher {
private:
    priority_queue<PriorityCallback> callbacks_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> gate_open_{true};
    atomic<bool> stop_{false};
    thread dispatcher_thread_;

    void dispatcherLoop() {
        while (true) {
            function<void()> callback;
            {
                unique_lock<mutex> lock(mtx_);
                cv_.wait(lock, [this]() {
                    return stop_ || (gate_open_ && !callbacks_.empty());
                });
                
                if (stop_ && callbacks_.empty()) {
                    return;
                }
                
                if (!gate_open_ || callbacks_.empty()) {
                    continue;
                }
                
                callback = callbacks_.top().callback;
                callbacks_.pop();
            }
            callback();
        }
    }

public:
    PriorityGatedDispatcher() 
        : dispatcher_thread_([this]() { dispatcherLoop(); }) {}

    void dispatch(function<void()> callback, int priority) {
        {
            lock_guard<mutex> lock(mtx_);
            callbacks_.push({callback, priority});
        }
        cv_.notify_one();
    }

    void openGate() { gate_open_ = true; cv_.notify_all(); }
    void closeGate() { gate_open_ = false; }
    bool isGateOpen() const { return gate_open_.load(); }

    ~PriorityGatedDispatcher() {
        {
            lock_guard<mutex> lock(mtx_);
            stop_ = true;
        }
        cv_.notify_one();
        dispatcher_thread_.join();
    }
};
```

---

## Example 3: Event-Driven System

```cpp
#include <map>
#include <string>
using namespace std;

class EventDispatcher {
private:
    map<string, vector<function<void()>>> handlers_;
    GatedCallbackDispatcher dispatcher_;
    mutex handlers_mtx_;

public:
    void registerHandler(const string& event, function<void()> handler) {
        lock_guard<mutex> lock(handlers_mtx_);
        handlers_[event].push_back(handler);
    }

    void emit(const string& event) {
        lock_guard<mutex> lock(handlers_mtx_);
        auto it = handlers_.find(event);
        if (it != handlers_.end()) {
            for (auto& handler : it->second) {
                dispatcher_.dispatch(handler);
            }
        }
    }

    void enable() { dispatcher_.openGate(); }
    void disable() { dispatcher_.closeGate(); }
};

void eventDrivenExample() {
    EventDispatcher dispatcher;
    
    dispatcher.registerHandler("user_login", []() {
        cout << "Handling user login" << endl;
    });
    
    dispatcher.registerHandler("data_update", []() {
        cout << "Handling data update" << endl;
    });
    
    dispatcher.emit("user_login");
    dispatcher.emit("data_update");
    
    this_thread::sleep_for(chrono::milliseconds(200));
}
```

---

## Example 4: Rate-Limited Dispatcher

```cpp
#include <chrono>
using namespace std::chrono;

class RateLimitedDispatcher {
private:
    GatedCallbackDispatcher dispatcher_;
    steady_clock::time_point last_dispatch_;
    milliseconds min_interval_;
    mutex rate_mtx_;

public:
    RateLimitedDispatcher(milliseconds min_interval) 
        : min_interval_(min_interval) {
        last_dispatch_ = steady_clock::now();
    }

    void dispatch(function<void()> callback) {
        lock_guard<mutex> lock(rate_mtx_);
        auto now = steady_clock::now();
        auto elapsed = duration_cast<milliseconds>(now - last_dispatch_);
        
        if (elapsed < min_interval_) {
            dispatcher_.closeGate();
            this_thread::sleep_for(min_interval_ - elapsed);
            dispatcher_.openGate();
        }
        
        last_dispatch_ = steady_clock::now();
        dispatcher_.dispatch(callback);
    }
};
```

---

## Best Practices

1. **Error Handling**: Catch exceptions in callbacks
2. **Gate Control**: Use gates to control execution flow
3. **Queue Management**: Monitor queue size to prevent overflow
4. **Thread Safety**: Ensure all operations are thread-safe
5. **Shutdown**: Properly shutdown dispatcher thread

---

## Summary

A gated controlled callback dispatcher provides:

- **Controlled execution**: Gate enables/disables callback execution
- **Queue management**: Queues callbacks for execution
- **Thread safety**: Safe for concurrent access
- **Flexibility**: Supports priorities, rate limiting, and filtering

This pattern is essential for event-driven systems and async callback handling.

