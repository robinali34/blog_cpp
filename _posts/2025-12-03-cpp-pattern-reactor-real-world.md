---
layout: post
title: "C++ Reactor Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns reactor
permalink: /2025/12/03/cpp-pattern-reactor-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, reactor, event-driven, real-world]
excerpt: "Learn the Reactor pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Reactor Pattern: Real-World Engineering Guide

## Problem Solved

High-performance, event-driven I/O with few threads, handling many concurrent connections efficiently.

## How It Works

- A single (or small number of) event loop(s) waits for I/O events
- Handlers respond asynchronously
- Non-blocking I/O with event notification

## STL Usage

```cpp
#include <functional>
#include <map>
#include <vector>
#include <thread>
#include <atomic>
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
        // Implementation depends on platform (epoll, kqueue, IOCP)
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

class AsyncIOReactor {
private:
    Reactor reactor_;
    // ThreadPool from previous pattern
    // ThreadPool handler_pool_;

public:
    AsyncIOReactor() /* : handler_pool_(4) */ {
        reactor_.start();
    }

    void handleConnection(int socket_fd) {
        reactor_.registerHandler(socket_fd, [this, socket_fd]() {
            // handler_pool_.enqueue([socket_fd]() {
                // Process I/O
                processIO(socket_fd);
            // });
        });
    }

    void processIO(int fd) {
        // Read/write data
    }
};
```

## Example

```cpp
void reactorExample() {
    AsyncIOReactor reactor;
    
    // Register handlers for different file descriptors
    reactor.handleConnection(1);
    reactor.handleConnection(2);
    
    // Reactor handles events asynchronously
    this_thread::sleep_for(chrono::seconds(1));
}
```

## Use Cases

- **Web servers**: Nginx, high-performance HTTP servers
- **Network frameworks**: Netty, event-driven networking
- **Database servers**: Handle many connections
- **Real-time systems**: Low-latency event handling

## Key Takeaways

- Handles many connections with few threads
- Event-driven, non-blocking I/O
- High throughput and low latency
- Common in high-performance servers

## Things to Be Careful About

- **Platform-specific**: Requires platform I/O APIs (epoll, kqueue, IOCP)
- **Complexity**: More complex than thread-per-connection
- **CPU-bound tasks**: Should use thread pool for CPU work
- **Error handling**: Must handle I/O errors gracefully

## Summary

Reactor pattern enables high-performance event-driven I/O, essential for scalable network servers and real-time systems.

