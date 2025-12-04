---
layout: post
title: "C++ Multi-Threading Practical Patterns: Task Queues, Logging, Performance Monitoring, and Lambda"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading practical-patterns task-queue logging
permalink: /2025/12/03/cpp-multithreading-practical-patterns/
tags: [cpp, concurrency, multithreading, task-queue, logging, performance-monitoring, lambda, practical-patterns]
excerpt: "Practical C++ multi-threading patterns for real-world applications: task queues, thread-safe logging, performance monitoring, lambda programming, and map-reduce patterns. Updated to modern C++ standards."
---

# C++ Multi-Threading Practical Patterns: Task Queues, Logging, Performance Monitoring, and Lambda

This guide covers practical multi-threading patterns commonly used in production C++ applications, including task queues, thread-safe logging, performance monitoring, lambda programming, and map-reduce patterns. These patterns help improve program efficiency in terms of throughput, concurrency, and real-time performance.

> **Reference**: This post is based on and inspired by [C++ Multi-Threading Programming Summary](https://www.cnblogs.com/zhiranok/archive/2012/05/13/cpp_multi_thread.html), updated to modern C++ standards (C++11/14/17/20).

## Table of Contents

1. [Task Queue Patterns](#task-queue-patterns)
2. [Thread-Safe Logging](#thread-safe-logging)
3. [Performance Monitoring](#performance-monitoring)
4. [Lambda Programming Patterns](#lambda-programming-patterns)
5. [Map-Reduce with shared_ptr](#map-reduce-with-shared_ptr)
6. [Best Practices](#best-practices)
7. [Summary](#summary)

---

## Task Queue Patterns

Task queues are fundamental to concurrent programming, enabling decoupling between task producers and consumers. They're essential for achieving high throughput and real-time performance.

### 1.1 Producer-Consumer Task Queue

The producer-consumer model is one of the most common patterns in concurrent programming. For example, in a server application, when user data is modified by a logic module, it produces a database update task and enqueues it to an IO module task queue. The IO module consumes tasks from the queue and executes SQL operations.

#### Basic Implementation

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <thread>
#include <atomic>
using namespace std;

template<typename T>
class TaskQueue {
private:
    queue<T> tasks_;
    mutex mtx_;
    condition_variable cv_;
    atomic<bool> stop_{false};

public:
    void produce(const T& task) {
        unique_lock<mutex> lock(mtx_);
        if (tasks_.empty()) {
            cv_.notify_one();  // Wake up waiting consumer
        }
        tasks_.push(task);
    }
    
    bool consume(T& task) {
        unique_lock<mutex> lock(mtx_);
        while (tasks_.empty()) {
            if (stop_) {
                return false;
            }
            cv_.wait(lock);  // Wait until task available
        }
        task = tasks_.front();
        tasks_.pop();
        return true;
    }
    
    void stop() {
        stop_ = true;
        cv_.notify_all();
    }
    
    size_t size() const {
        lock_guard<mutex> lock(mtx_);
        return tasks_.size();
    }
};

// Usage example
void example() {
    TaskQueue<function<void()>> task_queue;
    
    // Consumer thread
    thread consumer([&task_queue]() {
        function<void()> task;
        while (task_queue.consume(task)) {
            task();  // Execute task
        }
    });
    
    // Producer: enqueue tasks
    for (int i = 0; i < 10; ++i) {
        task_queue.produce([i]() {
            cout << "Task " << i << " executed" << endl;
        });
    }
    
    this_thread::sleep_for(chrono::milliseconds(100));
    task_queue.stop();
    consumer.join();
}
```

### 1.2 Task Queue Usage Patterns

#### Pattern 1: IO and Logic Separation

In network server applications, the network module receives message packets, enqueues them to the logic layer, and immediately returns to accept the next packet. Logic threads run in an IO-free environment to ensure real-time performance.

```cpp
class NetworkService {
private:
    TaskQueue<function<void()>>* logic_task_queue_;

public:
    void handleMessage(long uid, const Message& msg) {
        // Enqueue to logic queue, return immediately
        logic_task_queue_->produce([this, uid, msg]() {
            processLogic(uid, msg);
        });
    }
    
    void processLogic(long uid, const Message& msg) {
        // Logic processing without IO operations
        // Ensures real-time performance
    }
};
```

**Key Points:**
- Single task queue, single consumer thread
- IO operations return immediately
- Logic processing happens asynchronously

#### Pattern 2: Parallel Pipeline

While the above pattern achieves IO and CPU parallelism, CPU logic operations are still serial. In some cases, CPU logic can also be parallelized. For example, in a game, user A planting crops and user B planting crops can be completely parallel since they don't share data.

The simplest approach is to distribute A and B related operations to different task queues:

```cpp
class ParallelService {
private:
    static constexpr size_t NUM_QUEUES = 8;
    array<TaskQueue<function<void()>>, NUM_QUEUES> logic_queues_;
    array<thread, NUM_QUEUES> workers_;

public:
    ParallelService() {
        // Start worker threads for each queue
        for (size_t i = 0; i < NUM_QUEUES; ++i) {
            workers_[i] = thread([this, i]() {
                function<void()> task;
                while (logic_queues_[i].consume(task)) {
                    task();
                }
            });
        }
    }
    
    void handleMessage(long uid, const Message& msg) {
        // Distribute by user ID for parallel processing
        size_t queue_index = uid % NUM_QUEUES;
        logic_queues_[queue_index].produce([this, uid, msg]() {
            processLogic(uid, msg);
        });
    }
    
    ~ParallelService() {
        for (auto& queue : logic_queues_) {
            queue.stop();
        }
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};
```

**Key Points:**
- Multiple task queues, each with a single thread
- Tasks distributed by key (e.g., user ID) for parallelism
- No shared data between parallel tasks

#### Pattern 3: Connection Pool with Async Callbacks

When a logic service module needs to asynchronously load user data from a database module and perform subsequent processing, the database module maintains a connection pool with a fixed number of connections. When an SQL task arrives, it selects an idle connection, executes the SQL, and passes the result to the logic layer through a callback function.

```cpp
class DatabaseService {
private:
    static constexpr size_t POOL_SIZE = 10;
    TaskQueue<function<void()>> db_task_queue_;
    array<thread, POOL_SIZE> workers_;
    
    // Each worker has its own database connection
    void workerThread(size_t worker_id) {
        // Create database connection for this worker
        DatabaseConnection conn;
        
        function<void()> task;
        while (db_task_queue_.consume(task)) {
            task();  // Execute SQL task
        }
    }

public:
    DatabaseService() {
        for (size_t i = 0; i < POOL_SIZE; ++i) {
            workers_[i] = thread(&DatabaseService::workerThread, this, i);
        }
    }
    
    template<typename Callback>
    void loadUser(long uid, Callback&& callback) {
        db_task_queue_.produce([uid, callback]() {
            // Execute SQL query
            UserData user;
            // ... SQL execution ...
            
            // Call callback with result
            callback(user);
        });
    }
    
    ~DatabaseService() {
        db_task_queue_.stop();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};

// Usage
void processUserDataLoaded(const UserData& user) {
    // Process loaded user data
    cout << "User loaded: " << user.id << endl;
}

void example() {
    DatabaseService db;
    db.loadUser(12345, processUserDataLoaded);
}
```

**Key Points:**
- Single task queue, multiple consumer threads
- Each thread maintains its own connection
- Callbacks used for async result delivery

---

## Thread-Safe Logging

Logging systems are essential for debugging and runtime troubleshooting. While logging doesn't directly improve program efficiency, it's an indispensable tool for backend program development.

### Common Logging Approaches

#### Stream-Based Logging

```cpp
logstream << "start service time[" << time(0) 
          << "] app name[" << app_string << "]" << endl;
```

**Pros:** Thread-safe, type-safe
**Cons:** More verbose, potentially slower

#### Printf-Style Logging

```cpp
logtrace(LOG_MODULE, "start service time[%d] app name[%s]", 
         time(0), app_string.c_str());
```

**Pros:** More concise, direct formatting
**Cons:** Thread-unsafe, type-unsafe (can crash with wrong types)

### Thread-Safe Printf-Style Logging

We can improve printf-style logging to be thread-safe using C++ templates and traits:

```cpp
#include <mutex>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <chrono>
using namespace std;

class ThreadSafeLogger {
private:
    static mutex log_mutex_;
    
    static string getTimestamp() {
        auto now = chrono::system_clock::now();
        auto time = chrono::system_clock::to_time_t(now);
        stringstream ss;
        ss << put_time(localtime(&time), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }
    
    static string getThreadId() {
        stringstream ss;
        ss << this_thread::get_id();
        return ss.str();
    }

public:
    // Thread-safe logging with type safety
    template<typename... Args>
    static void log(const char* module, const char* fmt, Args... args) {
        lock_guard<mutex> lock(log_mutex_);
        
        // Format message
        char buffer[1024];
        snprintf(buffer, sizeof(buffer), fmt, args...);
        
        // Output with timestamp and thread ID
        cout << "[" << getTimestamp() << "] "
             << "[Thread:" << getThreadId() << "] "
             << "[" << module << "] "
             << buffer << endl;
    }
};

mutex ThreadSafeLogger::log_mutex_;

// Usage
void example() {
    ThreadSafeLogger::log("NETWORK", "Connection established: %d", 12345);
    ThreadSafeLogger::log("LOGIC", "User %ld logged in", 67890L);
}
```

### Enhanced Logging with Colors

Adding colors to logs improves readability in terminal output:

```cpp
enum class LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR
};

class ColoredLogger {
private:
    static mutex log_mutex_;
    
    static const char* getColorCode(LogLevel level) {
        switch (level) {
            case LogLevel::DEBUG:   return "\033[36m";  // Cyan
            case LogLevel::INFO:    return "\033[32m";  // Green
            case LogLevel::WARNING: return "\033[33m";  // Yellow
            case LogLevel::ERROR:   return "\033[31m";  // Red
            default:                return "\033[0m";   // Reset
        }
    }
    
    static const char* getResetCode() {
        return "\033[0m";
    }

public:
    template<typename... Args>
    static void log(LogLevel level, const char* module, 
                    const char* fmt, Args... args) {
        lock_guard<mutex> lock(log_mutex_);
        
        char buffer[1024];
        snprintf(buffer, sizeof(buffer), fmt, args...);
        
        cout << getColorCode(level)
             << "[" << module << "] "
             << buffer
             << getResetCode() << endl;
    }
};

mutex ColoredLogger::log_mutex_;

// Usage
void example() {
    ColoredLogger::log(LogLevel::INFO, "SERVICE", "Service started");
    ColoredLogger::log(LogLevel::ERROR, "DB", "Connection failed: %d", errno);
}
```

---

## Performance Monitoring

While many tools can analyze C++ program performance, most work during the debug phase. We need a way to monitor programs in both debug and release builds to identify bottlenecks and detect runtime anomalies.

### Automatic Function Profiling

Using C++ RAII (Resource Acquisition Is Initialization), we can easily implement automatic function profiling:

```cpp
#include <chrono>
#include <string>
#include <mutex>
#include <unordered_map>
#include <fstream>
using namespace std;
using namespace chrono;

class PerformanceProfiler {
private:
    struct ProfileData {
        long long total_time_us = 0;
        long long call_count = 0;
        long long min_time_us = LLONG_MAX;
        long long max_time_us = 0;
    };
    
    static unordered_map<string, ProfileData> profiles_;
    static mutex profiles_mutex_;
    
    static void record(const string& func_name, long long duration_us) {
        lock_guard<mutex> lock(profiles_mutex_);
        auto& data = profiles_[func_name];
        data.total_time_us += duration_us;
        data.call_count++;
        data.min_time_us = min(data.min_time_us, duration_us);
        data.max_time_us = max(data.max_time_us, duration_us);
    }

public:
    class ScopedProfiler {
    private:
        string func_name_;
        high_resolution_clock::time_point start_;

    public:
        explicit ScopedProfiler(const char* func_name) 
            : func_name_(func_name),
              start_(high_resolution_clock::now()) {}
        
        ~ScopedProfiler() {
            auto end = high_resolution_clock::now();
            auto duration = duration_cast<microseconds>(end - start_);
            PerformanceProfiler::record(func_name_, duration.count());
        }
    };
    
    static void dumpStatistics(const string& filename) {
        lock_guard<mutex> lock(profiles_mutex_);
        ofstream file(filename);
        
        file << "Function Performance Statistics\n";
        file << "==============================\n\n";
        
        for (const auto& [func_name, data] : profiles_) {
            double avg_time = data.call_count > 0 
                ? static_cast<double>(data.total_time_us) / data.call_count 
                : 0.0;
            
            file << func_name << ":\n"
                 << "  Calls: " << data.call_count << "\n"
                 << "  Total: " << data.total_time_us << " us\n"
                 << "  Average: " << avg_time << " us\n"
                 << "  Min: " << data.min_time_us << " us\n"
                 << "  Max: " << data.max_time_us << " us\n\n";
        }
    }
    
    static void reset() {
        lock_guard<mutex> lock(profiles_mutex_);
        profiles_.clear();
    }
};

unordered_map<string, PerformanceProfiler::ProfileData> 
    PerformanceProfiler::profiles_;
mutex PerformanceProfiler::profiles_mutex_;

// Macro for easy usage
#define PROFILE_FUNCTION() \
    PerformanceProfiler::ScopedProfiler _profiler(__FUNCTION__)

// Usage example
void expensiveFunction() {
    PROFILE_FUNCTION();
    // ... expensive operations ...
    this_thread::sleep_for(milliseconds(10));
}

void example() {
    for (int i = 0; i < 100; ++i) {
        expensiveFunction();
    }
    
    PerformanceProfiler::dumpStatistics("performance_stats.txt");
}
```

---

## Lambda Programming Patterns

Lambda functions (available in C++11 and later) provide powerful ways to write concise, functional-style code. They're especially useful with task queues and container operations.

### Using forEach Instead of Iterators

Many languages have built-in foreach, but C++ didn't until C++11 range-based for loops. However, implementing a forEach function provides more flexibility and functional programming benefits.

```cpp
#include <vector>
#include <map>
#include <functional>
using namespace std;

template<typename Container, typename Func>
void forEach(Container& container, Func func) {
    for (auto& item : container) {
        func(item);
    }
}

// Example: User manager with forEach
class UserManager {
private:
    map<long, string> users_;

public:
    template<typename Func>
    void forEach(Func func) {
        for (auto& [id, name] : users_) {
            func(id, name);
        }
    }
    
    void dump() {
        // No need to rewrite iterator code
        forEach([](long id, const string& name) {
            cout << "User " << id << ": " << name << endl;
        });
    }
};
```

### Lambda with Task Queue for Async Operations

Using lambda functions with task queues makes asynchronous operations more intuitive and maintainable:

```cpp
class Service {
private:
    TaskQueue<function<void()>>* task_queue_;

public:
    // Traditional approach: separate async and sync functions
    void asyncUpdateUser(long uid) {
        task_queue_->produce(
            bind(&Service::syncUpdateUserImpl, this, uid)
        );
    }
    
    void syncUpdateUserImpl(long uid) {
        // Update logic here
        cout << "Updating user " << uid << endl;
    }
    
    // Better approach: lambda makes it more intuitive
    void asyncUpdateUserLambda(long uid) {
        task_queue_->produce([this, uid]() {
            // All logic in one place - very intuitive!
            cout << "Updating user " << uid << endl;
            // ... update logic ...
        });
    }
    
    // Even better: can capture local variables
    void processWithContext(long uid, const string& context) {
        task_queue_->produce([this, uid, context]() {
            // Can use both member variables and captured context
            cout << "Processing user " << uid 
                 << " with context: " << context << endl;
        });
    }
};
```

**Benefits:**
- Code is more intuitive and maintainable
- All logic in one place
- Easy to capture local variables
- No need to maintain separate async/sync function pairs

---

## Map-Reduce with shared_ptr

Map-reduce semantics involve dividing tasks into multiple subtasks, distributing them to multiple workers for concurrent execution, then reducing (aggregating) the results to produce the final output.

The semantics of `shared_ptr` align well with map-reduce: when the last `shared_ptr` is destroyed, it calls the destructor of the managed object. This matches the map-reduce pattern where we need to know when all tasks complete.

### Implementation Pattern

```cpp
#include <memory>
#include <vector>
#include <thread>
#include <atomic>
using namespace std;

template<typename ResultType>
class Reducer {
private:
    vector<ResultType> results_;
    size_t expected_count_;
    atomic<size_t> completed_count_{0};
    function<void(const vector<ResultType>&)> reduce_func_;

public:
    Reducer(size_t expected_count, 
            function<void(const vector<ResultType>&)> reduce_func)
        : expected_count_(expected_count),
          reduce_func_(reduce_func),
          results_(expected_count) {}
    
    void setResult(size_t index, const ResultType& result) {
        results_[index] = result;
        size_t count = ++completed_count_;
        
        // When all tasks complete, call reduce function
        if (count == expected_count_) {
            reduce_func_(results_);
        }
    }
    
    size_t getCompletedCount() const {
        return completed_count_.load();
    }
};

// Example: Search for string in multiple files
class StringSearcher {
public:
    static long searchInFile(const string& filename, 
                            const string& search_term,
                            size_t index,
                            shared_ptr<Reducer<long>> reducer) {
        // Simulate file search
        this_thread::sleep_for(chrono::milliseconds(100));
        
        long count = 0;  // Count occurrences
        // ... actual file search logic ...
        
        // Set result in reducer
        reducer->setResult(index, count);
        return count;
    }
};

void example() {
    const size_t num_files = 10;
    vector<string> files = {
        "file1.txt", "file2.txt", "file3.txt", "file4.txt", "file5.txt",
        "file6.txt", "file7.txt", "file8.txt", "file9.txt", "file10.txt"
    };
    string search_term = "oh nice";
    
    // Create reducer with reduce function
    auto reducer = make_shared<Reducer<long>>(
        num_files,
        [](const vector<long>& results) {
            long total = 0;
            for (long count : results) {
                total += count;
            }
            cout << "Total occurrences: " << total << endl;
        }
    );
    
    // Distribute tasks to workers
    vector<thread> workers;
    for (size_t i = 0; i < num_files; ++i) {
        workers.emplace_back(
            StringSearcher::searchInFile,
            files[i],
            search_term,
            i,
            reducer
        );
    }
    
    // Wait for all workers
    for (auto& worker : workers) {
        worker.join();
    }
}
```

### Advanced: Automatic Reduction on Destruction

We can use RAII to automatically trigger reduction when all tasks complete:

```cpp
template<typename ResultType>
class AutoReducer {
private:
    vector<ResultType> results_;
    size_t expected_count_;
    atomic<size_t> completed_count_{0};
    function<void(const vector<ResultType>&)> reduce_func_;
    mutex mtx_;

public:
    AutoReducer(size_t expected_count,
                function<void(const vector<ResultType>&)> reduce_func)
        : expected_count_(expected_count),
          reduce_func_(reduce_func),
          results_(expected_count) {}
    
    void setResult(size_t index, const ResultType& result) {
        lock_guard<mutex> lock(mtx_);
        results_[index] = result;
        ++completed_count_;
    }
    
    ~AutoReducer() {
        // Automatically reduce when all tasks complete
        if (completed_count_.load() == expected_count_) {
            reduce_func_(results_);
        }
    }
};
```

---

## Best Practices

### 1. Task Queue Design

- **Use condition variables** for efficient waiting
- **Implement proper shutdown** mechanism
- **Consider queue size limits** to prevent memory issues
- **Use appropriate queue distribution** strategy (single vs. multiple queues)

### 2. Logging

- **Always use thread-safe logging** in multi-threaded environments
- **Include timestamps and thread IDs** for debugging
- **Use appropriate log levels** (DEBUG, INFO, WARNING, ERROR)
- **Consider performance impact** of logging in hot paths

### 3. Performance Monitoring

- **Use RAII for automatic profiling**
- **Profile both debug and release builds**
- **Monitor long-running operations**
- **Dump statistics periodically** for analysis

### 4. Lambda Usage

- **Prefer lambdas** for short, inline functions
- **Be careful with capture semantics** (by value vs. by reference)
- **Use lambdas with STL algorithms** for cleaner code
- **Consider lambda overhead** in performance-critical paths

### 5. Map-Reduce Patterns

- **Use shared_ptr for automatic cleanup**
- **Ensure thread-safe result collection**
- **Handle partial completion** scenarios
- **Consider using futures** for more structured map-reduce

---

## Summary

These practical multi-threading patterns are essential for building efficient C++ applications:

- **Task Queues**: Enable decoupling and parallel processing
- **Thread-Safe Logging**: Critical for debugging multi-threaded applications
- **Performance Monitoring**: Identify bottlenecks in production
- **Lambda Programming**: Write cleaner, more maintainable concurrent code
- **Map-Reduce Patterns**: Efficiently parallelize independent computations

### Key Takeaways

1. **Producer-Consumer pattern** is fundamental for task distribution
2. **Multiple task queues** enable true parallelism for independent operations
3. **Thread-safe logging** is essential, not optional
4. **RAII-based profiling** provides automatic performance monitoring
5. **Lambda functions** make async code more intuitive and maintainable
6. **shared_ptr semantics** align well with map-reduce patterns

### When to Use Each Pattern

- **Single Task Queue**: IO-logic separation, simple producer-consumer
- **Multiple Task Queues**: Parallel processing of independent tasks
- **Connection Pool Pattern**: Database/network operations with limited resources
- **Thread-Safe Logging**: Any multi-threaded application
- **Performance Profiling**: Identify bottlenecks, monitor production systems
- **Lambda with Task Queues**: Simplify async operations, reduce code duplication
- **Map-Reduce**: Parallelize independent computations with result aggregation

By applying these patterns, you can build robust, efficient, and maintainable concurrent C++ applications.

---

**Reference**: This post is based on [C++ Multi-Threading Programming Summary](https://www.cnblogs.com/zhiranok/archive/2012/05/13/cpp_multi_thread.html) by 知然, updated to modern C++ standards (C++11/14/17/20).

