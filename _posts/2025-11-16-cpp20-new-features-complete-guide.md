---
layout: post
title: "C++20 New Features: Complete Guide and Reference"
date: 2025-11-16 00:00:00 -0700
categories: cpp programming tutorial reference language c++20 modern-cpp
tags: cpp c++20 concepts ranges coroutines modules spaceship-operator consteval constinit
excerpt: "A comprehensive guide to all C++20 new features including concepts, ranges, coroutines, modules, spaceship operator, consteval, constinit, and more with practical examples."
---

# C++20 New Features: Complete Guide and Reference

C++20 was a major update introducing revolutionary features like concepts, ranges, coroutines, and modules. This guide covers all C++20 features.

## Core Language Features

### 1. Concepts

Named requirements for templates.

```cpp
#include <concepts>

// Simple concept
template<typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

// Using concept
template<Addable T>
T add(T a, T b) {
    return a + b;
}

// Standard concepts
template<std::integral T>
void process_integer(T value) {
    // T must be integral type
}

template<std::floating_point T>
void process_float(T value) {
    // T must be floating point
}

// Custom concept
template<typename T>
concept Printable = requires(T t) {
    std::cout << t;
};

template<Printable T>
void print(T value) {
    std::cout << value << std::endl;
}

// Concept with multiple requirements
template<typename T>
concept Sortable = std::totally_ordered<T> && requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
};

// Abbreviated function templates
void func(std::integral auto x) {
    // x is any integral type
}

auto add(std::addable auto a, std::addable auto b) {
    return a + b;
}
```

### 2. Ranges

Modern iteration and algorithms.

```cpp
#include <ranges>
#include <vector>
#include <algorithm>

std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// Range-based algorithms
auto result = vec | std::views::filter([](int x) { return x % 2 == 0; })
                  | std::views::transform([](int x) { return x * 2; })
                  | std::views::take(3);

for (auto val : result) {
    std::cout << val << " ";  // 4 8 12
}

// Range views
auto evens = vec | std::views::filter([](int x) { return x % 2 == 0; });
auto squares = vec | std::views::transform([](int x) { return x * x; });
auto first_five = vec | std::views::take(5);
auto skip_first = vec | std::views::drop(2);

// Range algorithms
std::ranges::sort(vec);
auto it = std::ranges::find(vec, 5);
auto count = std::ranges::count_if(vec, [](int x) { return x > 5; });

// Iota view (generate sequence)
auto numbers = std::views::iota(1, 10);  // 1, 2, ..., 9

// Reverse view
for (auto val : vec | std::views::reverse) {
    std::cout << val << " ";
}
```

### 3. Coroutines

Suspension and resumption of functions.

```cpp
#include <coroutine>
#include <iostream>

// Generator coroutine
template<typename T>
struct Generator {
    struct promise_type {
        T current_value;
        
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        
        std::suspend_always yield_value(T value) {
            current_value = value;
            return {};
        }
        
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        
        void unhandled_exception() {}
    };
    
    std::coroutine_handle<promise_type> coro;
    
    Generator(std::coroutine_handle<promise_type> h) : coro(h) {}
    ~Generator() { if (coro) coro.destroy(); }
    
    bool next() {
        coro.resume();
        return !coro.done();
    }
    
    T value() { return coro.promise().current_value; }
};

// Fibonacci generator
Generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto temp = a + b;
        a = b;
        b = temp;
    }
}

// Usage
auto fib = fibonacci();
for (int i = 0; i < 10; ++i) {
    fib.next();
    std::cout << fib.value() << " ";
}
```

### 4. Modules

Modern replacement for header files.

```cpp
// math.cppm (module interface)
module math;

export int add(int a, int b) {
    return a + b;
}

export int multiply(int a, int b) {
    return a * b;
}

// main.cpp
import math;

int main() {
    int sum = add(3, 4);
    int product = multiply(2, 5);
    return 0;
}

// Partitioned modules
// math.cppm
export module math;
export int add(int a, int b);

// math_impl.cppm
module math:impl;
int add(int a, int b) {
    return a + b;
}
```

### 5. Three-Way Comparison (Spaceship Operator)

```cpp
#include <compare>

struct Point {
    int x, y;
    
    auto operator<=>(const Point& other) const = default;
    // Generates: ==, !=, <, <=, >, >=
};

Point p1{1, 2};
Point p2{3, 4};

if (p1 < p2) { /* ... */ }
if (p1 == p2) { /* ... */ }

// Custom three-way comparison
struct Person {
    std::string name;
    int age;
    
    auto operator<=>(const Person& other) const {
        if (auto cmp = name <=> other.name; cmp != 0) {
            return cmp;
        }
        return age <=> other.age;
    }
};
```

### 6. `consteval` (Immediate Functions)

Functions that must be evaluated at compile time.

```cpp
consteval int square(int x) {
    return x * x;
}

constexpr int compile_time = square(5);  // OK: computed at compile time
// int runtime = square(get_value());   // Error: must be compile-time

// Useful for compile-time computations
consteval int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
```

### 7. `constinit`

Initialize variables at compile time.

```cpp
constinit int global_var = 42;  // Must be compile-time initialized

void func() {
    constinit static int local = 10;  // Compile-time initialized
}

// Difference from constexpr
constexpr int must_be_constant = 42;  // Immutable
constinit int can_be_modified = 42;   // Can be modified later
```

### 8. Designated Initializers

Initialize struct members by name.

```cpp
struct Point {
    int x;
    int y;
    int z;
};

// C++20: designated initializers
Point p{.x = 10, .y = 20, .z = 30};
Point p2{.x = 5};  // y and z are zero-initialized

// Must be in declaration order
// Point p3{.y = 20, .x = 10};  // Error: wrong order
```

### 9. `[[likely]]` and `[[unlikely]]` Attributes

Hint branch prediction.

```cpp
int process(int value) {
    if (value > 0) [[likely]] {
        return value * 2;
    } else [[unlikely]] {
        return 0;
    }
}

// Switch cases
switch (value) {
    case 0: [[likely]]
        return 0;
    case 1:
        return 1;
    default: [[unlikely]]
        return -1;
}
```

### 10. Lambda Improvements

```cpp
// Lambda with template parameters
auto lambda = []<typename T>(T value) {
    return value * 2;
};

// Capture with initialization (C++14) + template
auto lambda2 = []<typename T>(T value) {
    return [value]() { return value; };
};

// Default-constructible lambdas (C++20)
auto lambda3 = [](int x = 10) { return x; };
int result = lambda3();  // 10
```

### 11. `requires` Expressions

```cpp
// Requires clause
template<typename T>
requires std::integral<T>
void func(T value) {}

// Requires expression
template<typename T>
concept Addable = requires(T a, T b) {
    a + b;  // Expression must be valid
    { a + b } -> std::convertible_to<T>;  // With type requirement
};

// Compound requirements
template<typename T>
concept Swappable = requires(T& a, T& b) {
    requires std::swappable<T>;
};
```

### 12. Class Template Argument Deduction Improvements

```cpp
// Deduction guides
template<typename T>
class Container {
public:
    Container(T value) : value_(value) {}
    Container(T a, T b) : value_(value) {}
};

// Automatic deduction
Container c(42);           // Container<int>
Container c2(1.0, 2.0);    // Container<double>
```

---

## Standard Library

### 13. Ranges Library

```cpp
#include <ranges>
#include <vector>
#include <algorithm>

std::vector<int> vec = {1, 2, 3, 4, 5};

// Range concepts
static_assert(std::ranges::range<decltype(vec)>);
static_assert(std::ranges::sized_range<decltype(vec)>);

// Range algorithms
std::ranges::sort(vec);
auto it = std::ranges::find(vec, 3);
auto count = std::ranges::count_if(vec, [](int x) { return x > 3; });

// Range views
auto evens = vec | std::views::filter([](int x) { return x % 2 == 0; });
auto transformed = vec | std::views::transform([](int x) { return x * 2; });
```

### 14. `std::format`

Type-safe formatting.

```cpp
#include <format>

std::string message = std::format("Hello, {}!", "World");
// "Hello, World!"

int x = 42;
double y = 3.14;
std::string result = std::format("x={}, y={:.2f}", x, y);
// "x=42, y=3.14"

// Format with positional arguments
std::string msg = std::format("{1} comes before {0}", "second", "first");
// "first comes before second"
```

### 15. `std::jthread`

Joinable thread with automatic joining.

```cpp
#include <thread>

void worker() {
    // Do work
}

// C++20: jthread automatically joins
std::jthread t(worker);
// No need to call t.join() - automatically joins on destruction

// With stop_token
void cancellable_worker(std::stop_token token) {
    while (!token.stop_requested()) {
        // Do work
    }
}

std::jthread t2(cancellable_worker);
t2.request_stop();  // Request cancellation
```

### 16. `std::span`

Non-owning view of contiguous sequence.

```cpp
#include <span>

int arr[] = {1, 2, 3, 4, 5};
std::vector<int> vec = {1, 2, 3, 4, 5};

// Create span
std::span<int> span1(arr, 5);
std::span<int> span2(vec);

// Subspan
auto subspan = span1.subspan(1, 3);  // Elements 1-3

// Size and bounds checking
std::cout << span1.size() << std::endl;
std::cout << span1[0] << std::endl;

// Fixed-size span
std::span<int, 5> fixed_span(arr);
```

### 17. `std::source_location`

Source code location information.

```cpp
#include <source_location>

void log(const std::string& message,
         const std::source_location& location = std::source_location::current()) {
    std::cout << location.file_name() << ":"
              << location.line() << ":"
              << location.function_name() << ": "
              << message << std::endl;
}

void func() {
    log("Error occurred");  // Automatically captures location
}
```

### 18. Calendar and Timezone

```cpp
#include <chrono>

using namespace std::chrono;

// Calendar types
auto date = year_month_day{2024y / January / 15d};
auto time = hh_mm_ss{14h + 30min + 45s};

// Timezone support
auto zoned = zoned_time{current_zone(), system_clock::now()};
auto utc = zoned_time{utc_clock::now()};

// Formatting
std::cout << std::format("{:%Y-%m-%d}", date) << std::endl;
```

### 19. `std::bit_cast`

Type-safe bit-level conversion.

```cpp
#include <bit>

float f = 3.14f;
auto bits = std::bit_cast<uint32_t>(f);  // Type-safe reinterpret_cast

// Safer than reinterpret_cast
// uint32_t bits2 = *reinterpret_cast<uint32_t*>(&f);  // Undefined behavior
```

### 20. `std::erase` and `std::erase_if`

Erase elements from containers.

```cpp
#include <vector>
#include <algorithm>

std::vector<int> vec = {1, 2, 3, 4, 5, 6};

// Erase by value
std::erase(vec, 3);  // Removes all 3s

// Erase if
std::erase_if(vec, [](int x) { return x % 2 == 0; });  // Removes evens
```

---

## Other Features

### 21. `std::is_constant_evaluated()`

Detect compile-time evaluation.

```cpp
#include <type_traits>

constexpr int func(int x) {
    if (std::is_constant_evaluated()) {
        // Compile-time path
        return x * 2;
    } else {
        // Runtime path
        return x + 1;
    }
}

constexpr int compile_time = func(5);  // Uses compile-time path
int runtime = func(5);                 // Uses runtime path
```

### 22. `std::to_array`

Convert C array to `std::array`.

```cpp
#include <array>

int arr[] = {1, 2, 3, 4, 5};
auto std_arr = std::to_array(arr);  // std::array<int, 5>
```

### 23. `std::make_shared` for Arrays

```cpp
#include <memory>

auto arr = std::make_shared<int[]>(10);  // Shared array
arr[0] = 42;
```

---

## Summary Table

| Feature | Category | Description |
|---------|----------|-------------|
| Concepts | Language | Named template requirements |
| Ranges | Library | Modern iteration |
| Coroutines | Language | Suspension/resumption |
| Modules | Language | Modern headers |
| Spaceship operator | Language | Three-way comparison |
| `consteval` | Language | Immediate functions |
| `constinit` | Language | Compile-time init |
| Designated init | Language | Named struct init |
| `[[likely]]`/`[[unlikely]]` | Language | Branch hints |
| `std::format` | Library | Type-safe formatting |
| `std::jthread` | Library | Auto-joining thread |
| `std::span` | Library | Array view |
| `std::source_location` | Library | Source info |
| Calendar/timezone | Library | Date/time utilities |

---

## Migration Tips

1. **Use concepts instead of SFINAE**
2. **Use ranges instead of iterator pairs**
3. **Use `std::format` instead of `printf`/`sprintf`**
4. **Use `std::span` for array parameters**
5. **Use `std::jthread` instead of `std::thread`**
6. **Use modules for new code**

---

## Compiler Support

- **GCC**: 10.0+ (most features), 11.0+ (full support)
- **Clang**: 10.0+ (most features), 12.0+ (full support)
- **MSVC**: Visual Studio 2019 16.8+ (most features), 16.10+ (full support)

Compile with: `-std=c++20` (GCC/Clang) or `/std:c++20` (MSVC)

---

C++20 was a revolutionary update that fundamentally changed how modern C++ is written, introducing concepts, ranges, coroutines, and modules.

