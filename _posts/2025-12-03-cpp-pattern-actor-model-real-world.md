---
layout: post
title: "C++ Actor Model Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns actor-model
permalink: /2025/12/03/cpp-pattern-actor-model-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, actor-model, message-passing, real-world]
excerpt: "Learn the Actor Model pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Actor Model Pattern: Real-World Engineering Guide

## Problem Solved

Simplify concurrency by eliminating shared memory, using message passing between isolated actors.

## How It Works

- "Actors" communicate by message passing
- Each actor processes messages sequentially
- No shared state between actors
- Actors can create other actors

## STL Usage

```cpp
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <memory>
#include <map>
#include <string>
#include <atomic>
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

## Example

```cpp
#include <iostream>
using namespace std;

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

## Use Cases

- **Distributed systems**: Akka, Erlang actors
- **Concurrent systems**: Isolated state management
- **Game engines**: Game entities as actors
- **Microservices**: Service communication

## Key Takeaways

- No shared memory, eliminates many concurrency bugs
- Easy to reason about
- Scales to distributed systems
- Message passing is natural

## Things to Be Careful About

- **Message ordering**: May not preserve global order
- **Deadlocks**: Circular message dependencies
- **Performance**: Message passing overhead
- **Error handling**: Actor failures need supervision

## Summary

Actor model simplifies concurrency by eliminating shared state, making systems easier to reason about and scale.

