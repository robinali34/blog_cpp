---
layout: post
title: "C++ Lambda Expressions: Complete Guide and Common Scenarios"
date: 2025-11-16 00:00:00 -0700
categories: cpp programming tutorial reference language lambda functional-programming
tags: cpp lambda callback closure functional-programming stl algorithms async
excerpt: "A comprehensive guide to C++ lambda expressions covering syntax, capture modes, common scenarios like callbacks, event handlers, STL algorithms, async programming, and more with practical examples."
---

# C++ Lambda Expressions: Complete Guide and Common Scenarios

Lambda expressions in C++ provide a concise way to define anonymous function objects. This guide covers lambda syntax, capture modes, and common real-world scenarios.

## Lambda Basics

### Basic Syntax

```cpp
// Basic syntax: [capture](parameters) -> return_type { body }

// Simple lambda
auto add = [](int a, int b) { return a + b; };
int result = add(3, 4);  // 7

// Lambda with explicit return type
auto multiply = [](int a, int b) -> int { return a * b; };

// Lambda without parameters
auto get_answer = []() { return 42; };
int answer = get_answer();

// Lambda with single parameter (parentheses optional)
auto square = [](int x) { return x * x; };
auto square2 = [](int x) { return x * x; };  // Same as above
```

### Lambda as Function Parameter

```cpp
#include <vector>
#include <algorithm>

std::vector<int> vec = {1, 2, 3, 4, 5};

// Lambda with STL algorithms
std::for_each(vec.begin(), vec.end(), [](int& n) {
    n *= 2;
});

// Find with lambda
auto it = std::find_if(vec.begin(), vec.end(), [](int n) {
    return n > 5;
});

// Count with lambda
int count = std::count_if(vec.begin(), vec.end(), [](int n) {
    return n % 2 == 0;
});

// Transform with lambda
std::transform(vec.begin(), vec.end(), vec.begin(), [](int n) {
    return n * n;
});
```

---

## Capture Modes

### 1. Capture by Value `[=]`

```cpp
int x = 10;
int y = 20;

// Capture all by value
auto lambda = [=](int a) {
    return a + x + y;  // x and y are copied
};

int result = lambda(5);  // 35

// x and y are not modified
std::cout << x << " " << y << std::endl;  // 10 20
```

### 2. Capture by Reference `[&]`

```cpp
int x = 10;
int y = 20;

// Capture all by reference
auto lambda = [&](int a) {
    x = 100;  // Modifies original x
    y = 200;  // Modifies original y
    return a + x + y;
};

int result = lambda(5);  // 305
std::cout << x << " " << y << std::endl;  // 100 200
```

### 3. Mixed Capture `[x, &y]`

```cpp
int x = 10;
int y = 20;
int z = 30;

// Capture specific variables
auto lambda = [x, &y, z](int a) {
    // x and z are copied, y is referenced
    y = 200;  // Modifies original y
    return a + x + y + z;
};

int result = lambda(5);  // 245
std::cout << x << " " << y << " " << z << std::endl;  // 10 200 30
```

### 4. Capture with Initialization `[var = expr]`

```cpp
// C++14: Capture with initializer
int x = 10;

// Move capture
auto ptr = std::make_unique<int>(42);
auto lambda = [p = std::move(ptr)]() {
    return *p;
};

// Copy with modification
auto lambda2 = [y = x + 5]() {
    return y;  // y is 15, independent of x
};

// Reference capture with initializer
auto lambda3 = [&ref = x]() {
    ref = 100;  // Modifies x
};
```

### 5. `mutable` Keyword

```cpp
// Without mutable: captured by-value variables are const
int counter = 0;
auto lambda = [counter]() mutable {
    counter++;  // Can modify copy, not original
    return counter;
};

lambda();  // Returns 1
lambda();  // Returns 2
std::cout << counter << std::endl;  // Still 0 (original unchanged)
```

---

## Common Scenarios

### Scenario 1: Callbacks

#### Event Handlers

```cpp
#include <functional>
#include <vector>
#include <string>

class Button {
public:
    using ClickHandler = std::function<void()>;
    
    void setOnClick(ClickHandler handler) {
        onClick_ = handler;
    }
    
    void click() {
        if (onClick_) {
            onClick_();
        }
    }
    
private:
    ClickHandler onClick_;
};

// Usage
Button button;
button.setOnClick([]() {
    std::cout << "Button clicked!" << std::endl;
});

button.click();  // Prints "Button clicked!"

// With captured state
int clickCount = 0;
button.setOnClick([&clickCount]() {
    clickCount++;
    std::cout << "Clicked " << clickCount << " times" << std::endl;
});

button.click();  // Clicked 1 times
button.click();  // Clicked 2 times
```

#### Progress Callbacks

```cpp
#include <functional>
#include <thread>
#include <chrono>

class TaskProcessor {
public:
    using ProgressCallback = std::function<void(int)>;
    
    void setProgressCallback(ProgressCallback callback) {
        progressCallback_ = callback;
    }
    
    void process() {
        for (int i = 0; i <= 100; i += 10) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            if (progressCallback_) {
                progressCallback_(i);
            }
        }
    }
    
private:
    ProgressCallback progressCallback_;
};

// Usage
TaskProcessor processor;
processor.setProgressCallback([](int progress) {
    std::cout << "Progress: " << progress << "%" << std::endl;
});

processor.process();
```

#### Completion Callbacks

```cpp
#include <functional>
#include <future>
#include <thread>

template<typename T>
class AsyncTask {
public:
    using CompletionCallback = std::function<void(const T&)>;
    using ErrorCallback = std::function<void(const std::string&)>;
    
    void execute(T data, CompletionCallback onSuccess, ErrorCallback onError) {
        std::thread([=]() {
            try {
                // Simulate async work
                std::this_thread::sleep_for(std::chrono::seconds(1));
                T result = processData(data);
                onSuccess(result);
            } catch (const std::exception& e) {
                onError(e.what());
            }
        }).detach();
    }
    
private:
    T processData(const T& data) {
        return data;  // Simplified
    }
};

// Usage
AsyncTask<int> task;
task.execute(42,
    [](const int& result) {
        std::cout << "Success: " << result << std::endl;
    },
    [](const std::string& error) {
        std::cerr << "Error: " << error << std::endl;
    }
);
```

### Scenario 2: STL Algorithms

#### Custom Comparators

```cpp
#include <vector>
#include <algorithm>
#include <string>

// Sort with custom comparator
std::vector<int> vec = {3, 1, 4, 1, 5, 9, 2, 6};
std::sort(vec.begin(), vec.end(), [](int a, int b) {
    return a > b;  // Descending order
});

// Sort objects
struct Person {
    std::string name;
    int age;
};

std::vector<Person> people = {
    {"Alice", 30},
    {"Bob", 25},
    {"Charlie", 35}
};

// Sort by age
std::sort(people.begin(), people.end(), [](const Person& a, const Person& b) {
    return a.age < b.age;
});

// Sort by name
std::sort(people.begin(), people.end(), [](const Person& a, const Person& b) {
    return a.name < b.name;
});
```

#### Filtering and Transformation

```cpp
#include <vector>
#include <algorithm>
#include <iterator>

std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// Filter: keep only evens
std::vector<int> evens;
std::copy_if(numbers.begin(), numbers.end(), std::back_inserter(evens),
    [](int n) { return n % 2 == 0; });

// Transform: square all numbers
std::vector<int> squares;
std::transform(numbers.begin(), numbers.end(), std::back_inserter(squares),
    [](int n) { return n * n; });

// Remove if
numbers.erase(
    std::remove_if(numbers.begin(), numbers.end(),
        [](int n) { return n > 5; }),
    numbers.end()
);
```

#### Accumulation

```cpp
#include <vector>
#include <numeric>
#include <string>

std::vector<int> vec = {1, 2, 3, 4, 5};

// Sum with lambda
int sum = std::accumulate(vec.begin(), vec.end(), 0,
    [](int acc, int val) { return acc + val; });

// Product
int product = std::accumulate(vec.begin(), vec.end(), 1,
    [](int acc, int val) { return acc * val; });

// String concatenation
std::vector<std::string> words = {"Hello", " ", "World", "!"};
std::string result = std::accumulate(words.begin(), words.end(), std::string(),
    [](const std::string& acc, const std::string& val) {
        return acc + val;
    });
```

### Scenario 3: Event-Driven Programming

```cpp
#include <functional>
#include <vector>
#include <string>
#include <map>

class EventEmitter {
public:
    using EventHandler = std::function<void(const std::string&)>;
    
    void on(const std::string& event, EventHandler handler) {
        handlers_[event].push_back(handler);
    }
    
    void emit(const std::string& event, const std::string& data) {
        if (handlers_.find(event) != handlers_.end()) {
            for (auto& handler : handlers_[event]) {
                handler(data);
            }
        }
    }
    
private:
    std::map<std::string, std::vector<EventHandler>> handlers_;
};

// Usage
EventEmitter emitter;

// Register handlers
emitter.on("data", [](const std::string& data) {
    std::cout << "Received data: " << data << std::endl;
});

emitter.on("error", [](const std::string& error) {
    std::cerr << "Error: " << error << std::endl;
});

// Emit events
emitter.emit("data", "Hello, World!");
emitter.emit("error", "Something went wrong");
```

### Scenario 4: Functional Programming Patterns

#### Higher-Order Functions

```cpp
#include <functional>
#include <vector>

// Function that returns a lambda
auto make_multiplier(int factor) {
    return [factor](int x) { return x * factor; };
}

auto double_it = make_multiplier(2);
auto triple_it = make_multiplier(3);

std::cout << double_it(5) << std::endl;  // 10
std::cout << triple_it(5) << std::endl;  // 15

// Function composition
auto compose = [](auto f, auto g) {
    return [f, g](auto x) { return f(g(x)); };
};

auto add_one = [](int x) { return x + 1; };
auto square = [](int x) { return x * x; };

auto add_one_then_square = compose(square, add_one);
std::cout << add_one_then_square(5) << std::endl;  // 36
```

#### Currying

```cpp
// Curried function
auto curry_add = [](int a) {
    return [a](int b) {
        return [a, b](int c) {
            return a + b + c;
        };
    };
};

auto add_10 = curry_add(10);
auto add_10_20 = add_10(20);
int result = add_10_20(30);  // 60

// Or call directly
int result2 = curry_add(10)(20)(30);  // 60
```

### Scenario 5: Async Programming

#### Thread Pool Tasks

```cpp
#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <functional>

class ThreadPool {
public:
    using Task = std::function<void()>;
    
    ThreadPool(size_t num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    Task task;
                    {
                        std::unique_lock<std::mutex> lock(queue_mutex_);
                        condition_.wait(lock, [this] { return stop_ || !tasks_.empty(); });
                        
                        if (stop_ && tasks_.empty()) return;
                        
                        task = std::move(tasks_.front());
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
            std::unique_lock<std::mutex> lock(queue_mutex_);
            tasks_.emplace(std::forward<F>(f));
        }
        condition_.notify_one();
    }
    
    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            stop_ = true;
        }
        condition_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
    
private:
    std::vector<std::thread> workers_;
    std::queue<Task> tasks_;
    std::mutex queue_mutex_;
    std::condition_variable condition_;
    bool stop_ = false;
};

// Usage
ThreadPool pool(4);

for (int i = 0; i < 10; ++i) {
    pool.enqueue([i]() {
        std::cout << "Task " << i << " executed" << std::endl;
    });
}
```

#### Promise/Future with Lambdas

```cpp
#include <future>
#include <thread>

// Async task with lambda
auto future = std::async(std::launch::async, []() {
    std::this_thread::sleep_for(std::chrono::seconds(1));
    return 42;
});

int result = future.get();  // 42

// Multiple async tasks
std::vector<std::future<int>> futures;
for (int i = 0; i < 5; ++i) {
    futures.push_back(std::async(std::launch::async, [i]() {
        return i * i;
    }));
}

for (auto& f : futures) {
    std::cout << f.get() << std::endl;
}
```

### Scenario 6: Configuration and Settings

```cpp
#include <functional>
#include <map>
#include <string>

class ConfigManager {
public:
    using Validator = std::function<bool(const std::string&)>;
    using Transformer = std::function<std::string(const std::string&)>;
    
    void registerValidator(const std::string& key, Validator validator) {
        validators_[key] = validator;
    }
    
    void registerTransformer(const std::string& key, Transformer transformer) {
        transformers_[key] = transformer;
    }
    
    bool validate(const std::string& key, const std::string& value) {
        if (validators_.find(key) != validators_.end()) {
            return validators_[key](value);
        }
        return true;
    }
    
    std::string transform(const std::string& key, const std::string& value) {
        if (transformers_.find(key) != transformers_.end()) {
            return transformers_[key](value);
        }
        return value;
    }
    
private:
    std::map<std::string, Validator> validators_;
    std::map<std::string, Transformer> transformers_;
};

// Usage
ConfigManager config;

// Register email validator
config.registerValidator("email", [](const std::string& email) {
    return email.find('@') != std::string::npos;
});

// Register uppercase transformer
config.registerTransformer("name", [](const std::string& name) {
    std::string upper = name;
    std::transform(upper.begin(), upper.end(), upper.begin(), ::toupper);
    return upper;
});

bool valid = config.validate("email", "user@example.com");
std::string transformed = config.transform("name", "john");
```

### Scenario 7: State Machines

```cpp
#include <functional>
#include <map>

class StateMachine {
public:
    using StateHandler = std::function<void()>;
    using TransitionCondition = std::function<bool()>;
    
    void addState(const std::string& state, StateHandler handler) {
        states_[state] = handler;
    }
    
    void addTransition(const std::string& from, const std::string& to,
                      TransitionCondition condition) {
        transitions_[from][to] = condition;
    }
    
    void setState(const std::string& state) {
        current_state_ = state;
    }
    
    void update() {
        if (states_.find(current_state_) != states_.end()) {
            states_[current_state_]();
        }
        
        // Check transitions
        if (transitions_.find(current_state_) != transitions_.end()) {
            for (auto& [next_state, condition] : transitions_[current_state_]) {
                if (condition()) {
                    current_state_ = next_state;
                    break;
                }
            }
        }
    }
    
private:
    std::string current_state_;
    std::map<std::string, StateHandler> states_;
    std::map<std::string, std::map<std::string, TransitionCondition>> transitions_;
};

// Usage
StateMachine sm;

int counter = 0;

sm.addState("idle", []() {
    std::cout << "Idle state" << std::endl;
});

sm.addState("active", [&counter]() {
    counter++;
    std::cout << "Active: " << counter << std::endl;
});

sm.addTransition("idle", "active", [&counter]() {
    return counter < 5;
});

sm.setState("idle");
sm.update();
```

### Scenario 8: Decorator Pattern

```cpp
#include <functional>
#include <string>

class Logger {
public:
    using LogFunction = std::function<void(const std::string&)>;
    
    void setLogFunction(LogFunction func) {
        log_func_ = func;
    }
    
    void log(const std::string& message) {
        if (log_func_) {
            log_func_(message);
        }
    }
    
private:
    LogFunction log_func_;
};

// Usage with decorators
Logger logger;

// Basic logging
logger.setLogFunction([](const std::string& msg) {
    std::cout << msg << std::endl;
});

// With timestamp decorator
logger.setLogFunction([](const std::string& msg) {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    std::cout << "[" << std::ctime(&time) << "] " << msg << std::endl;
});

// With level decorator
std::string level = "INFO";
logger.setLogFunction([level](const std::string& msg) {
    std::cout << "[" << level << "] " << msg << std::endl;
});
```

### Scenario 9: Retry Logic

```cpp
#include <functional>
#include <thread>
#include <chrono>

template<typename T>
T retry(std::function<T()> func, int max_attempts, int delay_ms) {
    for (int i = 0; i < max_attempts; ++i) {
        try {
            return func();
        } catch (const std::exception& e) {
            if (i == max_attempts - 1) throw;
            std::this_thread::sleep_for(std::chrono::milliseconds(delay_ms));
        }
    }
    throw std::runtime_error("Max attempts reached");
}

// Usage
int result = retry<int>([]() {
    // Simulate operation that might fail
    static int attempts = 0;
    if (++attempts < 3) {
        throw std::runtime_error("Failed");
    }
    return 42;
}, 5, 100);
```

### Scenario 10: Observer Pattern

```cpp
#include <functional>
#include <vector>
#include <string>

template<typename T>
class Observable {
public:
    using Observer = std::function<void(const T&)>;
    
    void subscribe(Observer observer) {
        observers_.push_back(observer);
    }
    
    void notify(const T& data) {
        for (auto& observer : observers_) {
            observer(data);
        }
    }
    
private:
    std::vector<Observer> observers_;
};

// Usage
Observable<int> observable;

// Subscribe observers
observable.subscribe([](const int& value) {
    std::cout << "Observer 1: " << value << std::endl;
});

observable.subscribe([](const int& value) {
    std::cout << "Observer 2: " << value * 2 << std::endl;
});

// Notify all observers
observable.notify(42);
```

---

## Advanced Topics

### Generic Lambdas (C++14)

```cpp
// Generic lambda with auto
auto generic_add = [](auto a, auto b) {
    return a + b;
};

int result1 = generic_add(3, 4);           // 7
double result2 = generic_add(3.5, 2.1);   // 5.6
std::string result3 = generic_add(std::string("hello"), std::string(" world"));
```

### Lambda with Template Parameters (C++20)

```cpp
// C++20: Lambda with template parameters
auto lambda = []<typename T>(T value) {
    return value * 2;
};

int result = lambda(5);        // 10
double result2 = lambda(3.14);  // 6.28
```

### Recursive Lambdas

```cpp
// Recursive lambda with std::function
std::function<int(int)> factorial = [&factorial](int n) -> int {
    return n <= 1 ? 1 : n * factorial(n - 1);
};

int result = factorial(5);  // 120

// Or with Y-combinator pattern
auto y_combinator = [](auto f) {
    return [f](auto... args) {
        return f(f, args...);
    };
};

auto factorial2 = y_combinator([](auto self, int n) -> int {
    return n <= 1 ? 1 : n * self(self, n - 1);
});
```

### Lambda as Return Type

```cpp
auto make_counter() {
    int count = 0;
    return [count]() mutable {
        return ++count;
    };
}

auto counter = make_counter();
std::cout << counter() << std::endl;  // 1
std::cout << counter() << std::endl;  // 2
```

---

## Best Practices

1. **Prefer lambdas for short, local functions**
2. **Use meaningful capture lists** - be explicit about what you capture
3. **Avoid capturing large objects by value** - use references or move
4. **Use `mutable` only when necessary**
5. **Consider `std::function` for type erasure** when needed
6. **Use generic lambdas (C++14+) for template-like behavior**
7. **Be careful with lifetime** - ensure captured references remain valid

---

## Common Pitfalls

### 1. Dangling References

```cpp
// BAD: Dangling reference
std::function<int()> get_lambda() {
    int x = 10;
    return [&x]() { return x; };  // x is destroyed when function returns
}

// GOOD: Capture by value
std::function<int()> get_lambda_safe() {
    int x = 10;
    return [x]() { return x; };  // x is copied
}
```

### 2. Unexpected Mutations

```cpp
int x = 10;
auto lambda = [&x]() {
    x = 100;  // Modifies original x
};

lambda();
std::cout << x << std::endl;  // 100 (unexpected if you thought it was copied)
```

### 3. Performance Considerations

```cpp
// std::function has overhead
std::function<int(int)> func = [](int x) { return x * 2; };

// Direct lambda is faster
auto lambda = [](int x) { return x * 2; };

// Use auto for lambda types when possible
```

---

## Summary

Lambdas in C++ are powerful tools for:
- **Callbacks and event handlers**
- **STL algorithm customization**
- **Functional programming patterns**
- **Async programming**
- **Configuration and validation**
- **State machines and observers**

Understanding capture modes, common patterns, and best practices will help you write more expressive and maintainable C++ code.

