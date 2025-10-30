---
layout: post
title: "Reusable Mutex with shared_ptr"
date: 2025-10-29 00:00:00 -0700
categories: cpp concurrency mutex shared_ptr smart-pointers
permalink: /2025/10/29/cpp-reusable-mutex-with-shared-ptr/
tags: [cpp, concurrency, mutex, shared_ptr, smart-pointers, resource-management]
---

# C++ Reusable Mutex with shared_ptr

Using `shared_ptr` to manage mutex lifetime and share it across multiple objects or threads enables safe, reusable synchronization.

## Why Use shared_ptr for Mutex?

When multiple objects need to synchronize access to shared resources, wrapping the mutex in a `shared_ptr` allows:
- **Lifetime Management**: Automatic cleanup when no longer needed
- **Sharing**: Multiple objects can safely hold references to the same mutex
- **Flexibility**: Mutex can outlive individual objects

## Basic Pattern

```cpp
#include <memory>
#include <mutex>
#include <thread>

class SharedResource {
public:
    SharedResource() : mutex_(std::make_shared<std::mutex>()) {}
    
    std::shared_ptr<std::mutex> getMutex() const {
        return mutex_;
    }
    
    void access() {
        std::lock_guard<std::mutex> lock(*mutex_);
        // Critical section
    }

private:
    std::shared_ptr<std::mutex> mutex_;
};
```

## Multiple Objects Sharing a Mutex

```cpp
#include <memory>
#include <mutex>
#include <vector>

class Worker {
public:
    explicit Worker(std::shared_ptr<std::mutex> mtx) 
        : mutex_(mtx) {}
    
    void doWork() {
        std::lock_guard<std::mutex> lock(*mutex_);
        // Synchronized work
    }

private:
    std::shared_ptr<std::mutex> mutex_;
};

int main() {
    // Create a shared mutex
    auto sharedMutex = std::make_shared<std::mutex>();
    
    // Multiple workers share the same mutex
    std::vector<Worker> workers;
    for (int i = 0; i < 5; ++i) {
        workers.emplace_back(sharedMutex);
    }
    
    // All workers use the same mutex for synchronization
    for (auto& worker : workers) {
        worker.doWork();
    }
}
```

## Thread Pool with Shared Mutex

```cpp
#include <memory>
#include <mutex>
#include <thread>
#include <vector>
#include <functional>

class ThreadPool {
public:
    ThreadPool(int numThreads) 
        : sharedMutex_(std::make_shared<std::mutex>()) {
        threads_.reserve(numThreads);
        for (int i = 0; i < numThreads; ++i) {
            threads_.emplace_back([this]() {
                this->workerThread();
            });
        }
    }
    
    void submit(std::function<void()> task) {
        std::lock_guard<std::mutex> lock(*sharedMutex_);
        queue_.push_back(task);
    }
    
    ~ThreadPool() {
        {
            std::lock_guard<std::mutex> lock(*sharedMutex_);
            shutdown_ = true;
        }
        
        for (auto& t : threads_) {
            if (t.joinable()) {
                t.join();
            }
        }
    }

private:
    void workerThread() {
        while (true) {
            std::function<void()> task;
            {
                std::lock_guard<std::mutex> lock(*sharedMutex_);
                if (shutdown_ && queue_.empty()) break;
                if (!queue_.empty()) {
                    task = queue_.front();
                    queue_.pop_front();
                }
            }
            if (task) task();
        }
    }
    
    std::shared_ptr<std::mutex> sharedMutex_;
    std::vector<std::thread> threads_;
    std::deque<std::function<void()>> queue_;
    bool shutdown_ = false;
};
```

## Shared Mutex Across Classes

```cpp
#include <memory>
#include <mutex>
#include <iostream>

class Logger {
public:
    Logger(std::shared_ptr<std::mutex> mtx) : mutex_(mtx) {}
    
    void log(const std::string& message) {
        std::lock_guard<std::mutex> lock(*mutex_);
        std::cout << "[LOG] " << message << std::endl;
    }

private:
    std::shared_ptr<std::mutex> mutex_;
};

class DataProcessor {
public:
    DataProcessor(std::shared_ptr<std::mutex> mtx) : mutex_(mtx) {}
    
    void process() {
        std::lock_guard<std::mutex> lock(*mutex_);
        // Process data
    }

private:
    std::shared_ptr<std::mutex> mutex_;
};

int main() {
    // Single shared mutex for both logger and processor
    auto sharedMutex = std::make_shared<std::mutex>();
    
    Logger logger(sharedMutex);
    DataProcessor processor(sharedMutex);
    
    // Both use the same mutex, ensuring synchronized access
    logger.log("Starting processing");
    processor.process();
    logger.log("Processing complete");
}
```

## Using shared_mutex for Read-Write Locking

```cpp
#include <memory>
#include <shared_mutex>

class ReadWriteResource {
public:
    ReadWriteResource() 
        : rwMutex_(std::make_shared<std::shared_mutex>()) {}
    
    std::shared_ptr<std::shared_mutex> getMutex() const {
        return rwMutex_;
    }
    
    void read() {
        std::shared_lock<std::shared_mutex> lock(*rwMutex_);
        // Multiple readers can access simultaneously
    }
    
    void write() {
        std::unique_lock<std::shared_mutex> lock(*rwMutex_);
        // Exclusive write access
    }

private:
    std::shared_ptr<std::shared_mutex> rwMutex_;
};
```

## Benefits of shared_ptr Mutex Pattern

1. **Automatic Cleanup**: When the last `shared_ptr` is destroyed, the mutex is automatically destroyed
2. **Thread Safety**: `shared_ptr` itself is thread-safe for reference counting
3. **Flexibility**: Easy to pass mutex between functions and objects
4. **No Double Deletion**: Smart pointer prevents double deletion issues
5. **Explicit Ownership**: Clear ownership semantics

## Best Practices

1. **Use `std::make_shared`**: More efficient than `new` with `shared_ptr`
2. **Lock Before Use**: Always acquire lock before accessing shared resources
3. **RAII Guards**: Use `lock_guard` or `unique_lock` for automatic unlocking
4. **Minimal Lock Scope**: Keep critical sections as small as possible
5. **Avoid Deadlocks**: Be careful with multiple mutexes; maintain consistent lock order

## Common Pitfalls

1. **Locking shared_ptr**: Lock the mutex, not the shared_ptr itself
   ```cpp
   // Wrong: locking shared_ptr
   std::lock_guard<std::shared_ptr<std::mutex>> lock(mutex_);
   
   // Correct: dereference first
   std::lock_guard<std::mutex> lock(*mutex_);
   ```

2. **Dangling References**: Ensure mutex lifetime exceeds its usage
3. **Performance Overhead**: `shared_ptr` has slight overhead; use only when needed
4. **Circular References**: Avoid circular `shared_ptr` dependencies

## Real-World Example: Database Connection Pool

```cpp
#include <memory>
#include <mutex>
#include <queue>
#include <vector>

class ConnectionPool {
public:
    ConnectionPool(int poolSize) 
        : poolMutex_(std::make_shared<std::mutex>()) {
        for (int i = 0; i < poolSize; ++i) {
            auto conn = std::make_shared<Connection>();
            connections_.push(conn);
        }
    }
    
    std::shared_ptr<Connection> acquire() {
        std::lock_guard<std::mutex> lock(*poolMutex_);
        if (connections_.empty()) return nullptr;
        
        auto conn = connections_.front();
        connections_.pop();
        return conn;
    }
    
    void release(std::shared_ptr<Connection> conn) {
        std::lock_guard<std::mutex> lock(*poolMutex_);
        connections_.push(conn);
    }

private:
    std::shared_ptr<std::mutex> poolMutex_;
    std::queue<std::shared_ptr<Connection>> connections_;
    
    class Connection {
        // Connection implementation
    };
};
```

## Summary

Using `shared_ptr` with mutexes provides a robust pattern for sharing synchronization primitives across multiple objects and threads. This pattern ensures:
- Proper lifetime management
- Safe concurrent access
- Clean, maintainable code
- Automatic resource cleanup

---

*This pattern is particularly useful in scenarios where multiple objects need to coordinate access to shared resources while maintaining clear ownership semantics.*

