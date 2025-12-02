---
layout: post
title: "C++ Callback Guide: Introduction, Scenarios, Examples, and Thread-Safe Patterns"
date: 2025-11-25 00:00:00 -0700
categories: cpp programming callback functional async concurrency
permalink: /2025/11/25/cpp-callback-guide/
tags: [cpp, callback, std::function, lambda, future, mutex, async, functional-programming, thread-safe]
excerpt: "A comprehensive guide to C++ callbacks covering function pointers, std::function, lambdas, async callbacks with std::future, and thread-safe callback patterns with mutex."
---

# C++ Callback Guide: Introduction, Scenarios, Examples, and Thread-Safe Patterns

Callbacks are a fundamental pattern in C++ that allow functions to be passed as arguments and invoked later. This guide covers callback mechanisms, common scenarios, practical examples, and how to use callbacks safely with `std::future` and mutex synchronization.

## Table of Contents

1. [Introduction to Callbacks](#introduction-to-callbacks)
2. [Callback Mechanisms](#callback-mechanisms)
3. [Common Scenarios](#common-scenarios)
4. [Practical Examples](#practical-examples)
5. [Callbacks with std::future](#callbacks-with-stdfuture)
6. [Thread-Safe Callbacks with Mutex](#thread-safe-callbacks-with-mutex)
7. [Best Practices](#best-practices)

---

## Introduction to Callbacks

A callback is a function or function-like object that is passed to another function to be called at a later time. Callbacks enable:

- **Event-driven programming**: React to events (button clicks, network responses)
- **Customization**: Allow users to customize behavior without modifying core code
- **Asynchronous operations**: Handle completion of async tasks
- **Algorithm customization**: Provide custom logic to STL algorithms

### Why Use Callbacks?

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// Without callback: hardcoded behavior
void printNumbers(const vector<int>& nums) {
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;
}

// With callback: flexible behavior
void processNumbers(const vector<int>& nums, function<void(int)> callback) {
    for (int n : nums) {
        callback(n);  // Call user-provided function
    }
}

int main() {
    vector<int> nums = {1, 2, 3, 4, 5};
    
    // Print numbers
    processNumbers(nums, [](int n) { cout << n << " "; });
    cout << endl;
    
    // Square numbers
    processNumbers(nums, [](int n) { cout << n * n << " "; });
    cout << endl;
    
    // Filter evens
    processNumbers(nums, [](int n) { 
        if (n % 2 == 0) cout << n << " "; 
    });
    cout << endl;
}
```

---

## Callback Mechanisms

C++ provides several ways to implement callbacks:

### 1. Function Pointers

The traditional C-style approach:

```cpp
#include <iostream>
using namespace std;

void greet() {
    cout << "Hello!" << endl;
}

void farewell() {
    cout << "Goodbye!" << endl;
}

void executeCallback(void (*callback)()) {
    callback();
}

int main() {
    executeCallback(greet);      // Hello!
    executeCallback(farewell);   // Goodbye!
}
```

**Limitations:**
- Cannot capture state (no closures)
- Cannot use member functions directly
- Type safety is limited

### 2. std::function

Modern C++ approach that can hold any callable:

```cpp
#include <iostream>
#include <functional>
using namespace std;

void executeCallback(function<void()> callback) {
    callback();
}

int main() {
    // Function pointer
    executeCallback(greet);
    
    // Lambda
    executeCallback([]() { cout << "Lambda!" << endl; });
    
    // Function object
    struct Functor {
        void operator()() { cout << "Functor!" << endl; }
    };
    executeCallback(Functor{});
}
```

### 3. Lambda Expressions

Most convenient for inline callbacks:

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> nums = {3, 1, 4, 1, 5, 9, 2, 6};
    
    // Sort callback
    sort(nums.begin(), nums.end(), [](int a, int b) {
        return a > b;  // Descending
    });
    
    // Transform callback
    transform(nums.begin(), nums.end(), nums.begin(), 
        [](int n) { return n * 2; });
    
    // Filter callback
    nums.erase(remove_if(nums.begin(), nums.end(), 
        [](int n) { return n < 5; }), nums.end());
}
```

### 4. Member Function Pointers

For object-oriented callbacks:

```cpp
#include <iostream>
#include <functional>
using namespace std;

class Button {
public:
    void onClick() {
        cout << "Button clicked!" << endl;
    }
};

void executeMemberCallback(Button& obj, function<void()> callback) {
    callback();
}

int main() {
    Button button;
    
    // Bind member function
    executeMemberCallback(button, bind(&Button::onClick, &button));
    
    // Lambda capturing object
    executeMemberCallback(button, [&button]() { button.onClick(); });
}
```

---

## Common Scenarios

### Scenario 1: Event Handlers

```cpp
#include <iostream>
#include <functional>
#include <vector>
using namespace std;

class EventEmitter {
public:
    using EventHandler = function<void()>;
    
    void on(string event, EventHandler handler) {
        handlers_[event].push_back(handler);
    }
    
    void emit(string event) {
        if (handlers_.find(event) != handlers_.end()) {
            for (auto& handler : handlers_[event]) {
                handler();
            }
        }
    }
    
private:
    map<string, vector<EventHandler>> handlers_;
};

int main() {
    EventEmitter emitter;
    
    emitter.on("click", []() { cout << "Click handler 1" << endl; });
    emitter.on("click", []() { cout << "Click handler 2" << endl; });
    emitter.on("hover", []() { cout << "Hover handler" << endl; });
    
    emitter.emit("click");  // Both handlers called
    emitter.emit("hover");  // Hover handler called
}
```

### Scenario 2: Progress Reporting

```cpp
#include <iostream>
#include <functional>
#include <thread>
#include <chrono>
using namespace std;

class TaskProcessor {
public:
    using ProgressCallback = function<void(int, const string&)>;
    
    void setProgressCallback(ProgressCallback callback) {
        progressCallback_ = callback;
    }
    
    void process() {
        vector<string> steps = {"Loading", "Processing", "Saving", "Complete"};
        
        for (size_t i = 0; i < steps.size(); ++i) {
            int progress = (i + 1) * 100 / steps.size();
            
            if (progressCallback_) {
                progressCallback_(progress, steps[i]);
            }
            
            this_thread::sleep_for(chrono::milliseconds(500));
        }
    }
    
private:
    ProgressCallback progressCallback_;
};

int main() {
    TaskProcessor processor;
    
    processor.setProgressCallback([](int progress, const string& step) {
        cout << "[" << progress << "%] " << step << endl;
    });
    
    processor.process();
}
```

### Scenario 3: Error Handling

```cpp
#include <iostream>
#include <functional>
#include <stdexcept>
using namespace std;

class DataProcessor {
public:
    using SuccessCallback = function<void(const string&)>;
    using ErrorCallback = function<void(const string&)>;
    
    void process(const string& data, 
                 SuccessCallback onSuccess, 
                 ErrorCallback onError) {
        try {
            if (data.empty()) {
                throw runtime_error("Empty data");
            }
            
            string result = "Processed: " + data;
            onSuccess(result);
        } catch (const exception& e) {
            onError(e.what());
        }
    }
};

int main() {
    DataProcessor processor;
    
    processor.process("Hello", 
        [](const string& result) { 
            cout << "Success: " << result << endl; 
        },
        [](const string& error) { 
            cerr << "Error: " << error << endl; 
        }
    );
    
    processor.process("", 
        [](const string& result) { 
            cout << "Success: " << result << endl; 
        },
        [](const string& error) { 
            cerr << "Error: " << error << endl; 
        }
    );
}
```

### Scenario 4: Custom Comparators and Predicates

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

struct Person {
    string name;
    int age;
};

int main() {
    vector<Person> people = {
        {"Alice", 30},
        {"Bob", 25},
        {"Charlie", 35}
    };
    
    // Custom sort callback
    sort(people.begin(), people.end(), 
        [](const Person& a, const Person& b) {
            return a.age < b.age;
        });
    
    // Custom find callback
    auto it = find_if(people.begin(), people.end(),
        [](const Person& p) {
            return p.name == "Bob";
        });
    
    if (it != people.end()) {
        cout << "Found: " << it->name << endl;
    }
}
```

---

## Practical Examples

### Example 1: Timer with Callback

```cpp
#include <iostream>
#include <functional>
#include <thread>
#include <chrono>
using namespace std;

class Timer {
public:
    using TimerCallback = function<void()>;
    
    void setTimeout(TimerCallback callback, int milliseconds) {
        thread([=]() {
            this_thread::sleep_for(chrono::milliseconds(milliseconds));
            callback();
        }).detach();
    }
    
    void setInterval(TimerCallback callback, int milliseconds) {
        thread([=]() {
            while (true) {
                this_thread::sleep_for(chrono::milliseconds(milliseconds));
                callback();
            }
        }).detach();
    }
};

int main() {
    Timer timer;
    
    timer.setTimeout([]() {
        cout << "Timeout fired!" << endl;
    }, 1000);
    
    this_thread::sleep_for(chrono::milliseconds(1500));
}
```

### Example 2: Observer Pattern

```cpp
#include <iostream>
#include <functional>
#include <vector>
using namespace std;

class Subject {
public:
    using Observer = function<void(const string&)>;
    
    void subscribe(Observer observer) {
        observers_.push_back(observer);
    }
    
    void notify(const string& message) {
        for (auto& observer : observers_) {
            observer(message);
        }
    }
    
private:
    vector<Observer> observers_;
};

int main() {
    Subject subject;
    
    subject.subscribe([](const string& msg) {
        cout << "Observer 1: " << msg << endl;
    });
    
    subject.subscribe([](const string& msg) {
        cout << "Observer 2: " << msg << endl;
    });
    
    subject.notify("State changed!");
}
```

### Example 3: Retry Mechanism

```cpp
#include <iostream>
#include <functional>
#include <thread>
#include <chrono>
using namespace std;

class RetryExecutor {
public:
    using Task = function<bool()>;
    using RetryCallback = function<void(int)>;
    
    bool executeWithRetry(Task task, int maxRetries, 
                         RetryCallback onRetry = nullptr) {
        for (int attempt = 1; attempt <= maxRetries; ++attempt) {
            if (task()) {
                return true;
            }
            
            if (onRetry) {
                onRetry(attempt);
            }
            
            if (attempt < maxRetries) {
                this_thread::sleep_for(chrono::milliseconds(100));
            }
        }
        return false;
    }
};

int main() {
    RetryExecutor executor;
    int attempts = 0;
    
    bool success = executor.executeWithRetry(
        [&attempts]() {
            attempts++;
            return attempts >= 3;  // Succeed on 3rd attempt
        },
        5,
        [](int attempt) {
            cout << "Retry attempt " << attempt << endl;
        }
    );
    
    cout << "Success: " << success << endl;
}
```

---

## Callbacks with std::future

`std::future` allows callbacks to be executed when async operations complete:

### Basic Future Callback

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <chrono>
using namespace std;

void asyncTaskWithCallback(function<void(int)> onComplete) {
    thread([onComplete]() {
        this_thread::sleep_for(chrono::seconds(1));
        int result = 42;
        onComplete(result);
    }).detach();
}

int main() {
    asyncTaskWithCallback([](int result) {
        cout << "Task completed with result: " << result << endl;
    });
    
    this_thread::sleep_for(chrono::seconds(2));
}
```

### Using std::async with Callbacks

```cpp
#include <iostream>
#include <future>
#include <vector>
using namespace std;

template<typename T>
void processAsync(function<T()> task, function<void(T)> onComplete) {
    auto future = async(launch::async, task);
    
    thread([future = move(future), onComplete]() mutable {
        T result = future.get();
        onComplete(result);
    }).detach();
}

int main() {
    processAsync<int>(
        []() { 
            this_thread::sleep_for(chrono::milliseconds(500));
            return 100; 
        },
        [](int result) {
            cout << "Async result: " << result << endl;
        }
    );
    
    this_thread::sleep_for(chrono::seconds(1));
}
```

### Promise/Future Pattern with Callbacks

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <vector>
using namespace std;

class AsyncTaskManager {
public:
    using Task = function<int()>;
    using CompletionCallback = function<void(int)>;
    using ErrorCallback = function<void(const string&)>;
    
    void executeTask(Task task, 
                     CompletionCallback onComplete,
                     ErrorCallback onError = nullptr) {
        promise<int> promise;
        future<int> future = promise.get_future();
        
        thread([promise = move(promise), task]() mutable {
            try {
                int result = task();
                promise.set_value(result);
            } catch (...) {
                promise.set_exception(current_exception());
            }
        }).detach();
        
        thread([future = move(future), onComplete, onError]() mutable {
            try {
                int result = future.get();
                onComplete(result);
            } catch (const exception& e) {
                if (onError) {
                    onError(e.what());
                }
            }
        }).detach();
    }
};

int main() {
    AsyncTaskManager manager;
    
    manager.executeTask(
        []() {
            this_thread::sleep_for(chrono::milliseconds(500));
            return 42;
        },
        [](int result) {
            cout << "Task completed: " << result << endl;
        },
        [](const string& error) {
            cerr << "Task failed: " << error << endl;
        }
    );
    
    this_thread::sleep_for(chrono::seconds(1));
}
```

### Multiple Futures with Callbacks

```cpp
#include <iostream>
#include <future>
#include <vector>
using namespace std;

void executeParallelTasks(const vector<function<int()>>& tasks,
                          function<void(const vector<int>&)> onAllComplete) {
    vector<future<int>> futures;
    
    // Launch all tasks
    for (const auto& task : tasks) {
        futures.push_back(async(launch::async, task));
    }
    
    // Wait for all and collect results
    thread([futures = move(futures), onAllComplete]() mutable {
        vector<int> results;
        for (auto& f : futures) {
            results.push_back(f.get());
        }
        onAllComplete(results);
    }).detach();
}

int main() {
    vector<function<int()>> tasks = {
        []() { this_thread::sleep_for(chrono::milliseconds(100)); return 1; },
        []() { this_thread::sleep_for(chrono::milliseconds(200)); return 2; },
        []() { this_thread::sleep_for(chrono::milliseconds(300)); return 3; }
    };
    
    executeParallelTasks(tasks, [](const vector<int>& results) {
        cout << "All tasks completed: ";
        for (int r : results) {
            cout << r << " ";
        }
        cout << endl;
    });
    
    this_thread::sleep_for(chrono::seconds(1));
}
```

---

## Thread-Safe Callbacks with Mutex

When callbacks access shared data, synchronization is essential:

### Basic Thread-Safe Callback

```cpp
#include <iostream>
#include <functional>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;

class ThreadSafeCallbackManager {
public:
    using Callback = function<void(int)>;
    
    void registerCallback(Callback callback) {
        lock_guard<mutex> lock(mutex_);
        callbacks_.push_back(callback);
    }
    
    void invokeCallbacks(int value) {
        lock_guard<mutex> lock(mutex_);
        for (const auto& callback : callbacks_) {
            callback(value);
        }
    }
    
private:
    vector<Callback> callbacks_;
    mutex mutex_;
};

int main() {
    ThreadSafeCallbackManager manager;
    int sharedCounter = 0;
    mutex counterMutex;
    
    manager.registerCallback([&sharedCounter, &counterMutex](int value) {
        lock_guard<mutex> lock(counterMutex);
        sharedCounter += value;
        cout << "Counter: " << sharedCounter << endl;
    });
    
    vector<thread> threads;
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([&manager, i]() {
            manager.invokeCallbacks(i + 1);
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### Callback Queue with Mutex

```cpp
#include <iostream>
#include <functional>
#include <queue>
#include <mutex>
#include <thread>
#include <condition_variable>
using namespace std;

class CallbackQueue {
public:
    using Callback = function<void()>;
    
    void enqueue(Callback callback) {
        {
            lock_guard<mutex> lock(mutex_);
            queue_.push(callback);
        }
        condition_.notify_one();
    }
    
    void process() {
        unique_lock<mutex> lock(mutex_);
        condition_.wait(lock, [this] { return !queue_.empty(); });
        
        Callback callback = queue_.front();
        queue_.pop();
        lock.unlock();
        
        callback();
    }
    
private:
    queue<Callback> queue_;
    mutex mutex_;
    condition_variable condition_;
};

int main() {
    CallbackQueue queue;
    int counter = 0;
    mutex counterMutex;
    
    // Producer threads
    vector<thread> producers;
    for (int i = 0; i < 3; ++i) {
        producers.emplace_back([&queue, i]() {
            for (int j = 0; j < 3; ++j) {
                queue.enqueue([i, j]() {
                    cout << "Task from producer " << i 
                         << ", task " << j << endl;
                });
            }
        });
    }
    
    // Consumer thread
    thread consumer([&queue, &counter, &counterMutex]() {
        for (int i = 0; i < 9; ++i) {
            queue.process();
            {
                lock_guard<mutex> lock(counterMutex);
                counter++;
            }
        }
    });
    
    for (auto& t : producers) {
        t.join();
    }
    consumer.join();
    
    cout << "Processed " << counter << " callbacks" << endl;
}
```

### Thread Pool with Callback Execution

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
using namespace std;

class ThreadPool {
public:
    using Task = function<void()>;
    
    ThreadPool(size_t numThreads) {
        for (size_t i = 0; i < numThreads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    Task task;
                    {
                        unique_lock<mutex> lock(mutex_);
                        condition_.wait(lock, [this] { 
                            return stop_ || !tasks_.empty(); 
                        });
                        
                        if (stop_ && tasks_.empty()) return;
                        
                        task = move(tasks_.front());
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
    }
    
    template<typename F>
    void enqueue(F&& f) {
        {
            lock_guard<mutex> lock(mutex_);
            tasks_.emplace(forward<F>(f));
        }
        condition_.notify_one();
    }
    
    ~ThreadPool() {
        {
            lock_guard<mutex> lock(mutex_);
            stop_ = true;
        }
        condition_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
    
private:
    vector<thread> workers_;
    queue<Task> tasks_;
    mutex mutex_;
    condition_variable condition_;
    bool stop_ = false;
};

int main() {
    ThreadPool pool(4);
    mutex outputMutex;
    
    for (int i = 0; i < 10; ++i) {
        pool.enqueue([i, &outputMutex]() {
            {
                lock_guard<mutex> lock(outputMutex);
                cout << "Task " << i << " executed by thread " 
                     << this_thread::get_id() << endl;
            }
        });
    }
    
    this_thread::sleep_for(chrono::seconds(1));
}
```

### Async Callback with Shared State Protection

```cpp
#include <iostream>
#include <future>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;

class SafeAsyncExecutor {
public:
    using Task = function<int()>;
    using Callback = function<void(int)>;
    
    void executeAsync(Task task, Callback callback) {
        async(launch::async, [this, task, callback]() {
            int result = task();
            
            // Protect callback execution
            lock_guard<mutex> lock(callbackMutex_);
            callback(result);
        });
    }
    
    void executeAsyncSafe(Task task, Callback callback) {
        async(launch::async, [this, task, callback]() {
            int result = task();
            
            // Copy callback to avoid issues with captured references
            Callback safeCallback = callback;
            
            lock_guard<mutex> lock(callbackMutex_);
            safeCallback(result);
        });
    }
    
private:
    mutex callbackMutex_;
};

int main() {
    SafeAsyncExecutor executor;
    int sharedResult = 0;
    mutex resultMutex;
    
    vector<future<void>> futures;
    for (int i = 0; i < 5; ++i) {
        futures.push_back(async(launch::async, [&executor, i, &sharedResult, &resultMutex]() {
            executor.executeAsync(
                [i]() { return i * 10; },
                [&sharedResult, &resultMutex](int result) {
                    lock_guard<mutex> lock(resultMutex);
                    sharedResult += result;
                    cout << "Result: " << result 
                         << ", Total: " << sharedResult << endl;
                }
            );
        }));
    }
    
    for (auto& f : futures) {
        f.wait();
    }
    
    this_thread::sleep_for(chrono::milliseconds(100));
    cout << "Final total: " << sharedResult << endl;
}
```

### Callback with Condition Variable

```cpp
#include <iostream>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <thread>
using namespace std;

class ConditionalCallback {
public:
    using Callback = function<void()>;
    
    void waitAndExecute(Callback callback) {
        unique_lock<mutex> lock(mutex_);
        condition_.wait(lock, [this] { return ready_; });
        callback();
    }
    
    void signal() {
        {
            lock_guard<mutex> lock(mutex_);
            ready_ = true;
        }
        condition_.notify_all();
    }
    
    void reset() {
        lock_guard<mutex> lock(mutex_);
        ready_ = false;
    }
    
private:
    mutex mutex_;
    condition_variable condition_;
    bool ready_ = false;
};

int main() {
    ConditionalCallback conditional;
    
    thread waiter1([&conditional]() {
        conditional.waitAndExecute([]() {
            cout << "Waiter 1 executed!" << endl;
        });
    });
    
    thread waiter2([&conditional]() {
        conditional.waitAndExecute([]() {
            cout << "Waiter 2 executed!" << endl;
        });
    });
    
    this_thread::sleep_for(chrono::milliseconds(500));
    
    conditional.signal();
    
    waiter1.join();
    waiter2.join();
}
```

---

## Best Practices

### 1. Use std::function for Flexibility

```cpp
// Good: Flexible callback type
void registerCallback(function<void(int)> callback);

// Avoid: Limited to function pointers
void registerCallback(void (*callback)(int));
```

### 2. Protect Shared State in Callbacks

```cpp
// Good: Thread-safe callback
mutex m;
void safeCallback(int value) {
    lock_guard<mutex> lock(m);
    sharedData += value;
}

// Bad: Unsafe callback
int sharedData = 0;
void unsafeCallback(int value) {
    sharedData += value;  // Data race!
}
```

### 3. Handle Callback Lifetime

```cpp
// Good: Copy captured values
auto callback = [value]() { /* use value */ };

// Risky: Reference to temporary
auto callback = [&value]() { /* value may be destroyed */ };
```

### 4. Use RAII for Mutex Protection

```cpp
// Good: Automatic unlock
{
    lock_guard<mutex> lock(mutex_);
    callback();
}

// Bad: Manual unlock (error-prone)
mutex_.lock();
callback();
mutex_.unlock();  // What if callback throws?
```

### 5. Consider Callback Ordering

```cpp
// Document callback execution order
void notifyCallbacks() {
    // Callbacks executed in registration order
    for (const auto& callback : callbacks_) {
        callback();
    }
}
```

### 6. Handle Exceptions in Callbacks

```cpp
void safeInvoke(function<void()> callback) {
    try {
        callback();
    } catch (const exception& e) {
        cerr << "Callback error: " << e.what() << endl;
    }
}
```

### 7. Use std::shared_ptr for Shared Callbacks

```cpp
class CallbackHolder {
    shared_ptr<function<void()>> callback_;
public:
    void setCallback(function<void()> callback) {
        callback_ = make_shared<function<void()>>(callback);
    }
    
    void invoke() {
        if (callback_) {
            (*callback_)();
        }
    }
};
```

---

## Summary

Callbacks in C++ provide powerful mechanisms for:

- **Event-driven programming**: React to events and state changes
- **Customization**: Allow flexible behavior without code modification
- **Asynchronous operations**: Handle async task completion with `std::future`
- **Thread-safe operations**: Protect shared state with mutex synchronization

Key takeaways:

1. Use `std::function` for maximum flexibility
2. Prefer lambdas for inline callbacks
3. Always protect shared state with mutexes in multi-threaded scenarios
4. Use RAII (`lock_guard`, `unique_lock`) for automatic mutex management
5. Consider callback lifetime and avoid dangling references
6. Handle exceptions appropriately in callback execution

Callbacks are essential for modern C++ programming, especially in event-driven systems, async operations, and concurrent applications.

