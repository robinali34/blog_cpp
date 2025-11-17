---
layout: post
title: "C++14 New Features: Complete Guide and Reference"
date: 2025-11-18 00:00:00 -0700
categories: cpp programming tutorial reference language c++14 modern-cpp
tags: cpp c++14 auto return-type generic-lambdas make-unique variable-templates
excerpt: "A comprehensive guide to all C++14 new features including auto return types, generic lambdas, std::make_unique, variable templates, and more with practical examples."
---

# C++14 New Features: Complete Guide and Reference

C++14 (C++1y) was a minor update to C++11, focusing on bug fixes and small improvements. This guide covers all C++14 features with examples.

## Core Language Features

### 1. Function Return Type Deduction (`auto` Return Types)

Functions can deduce return type from `return` statements.

```cpp
// C++14: auto return type
auto add(int a, int b) {
    return a + b;  // Returns int
}

auto divide(double a, double b) {
    if (b == 0.0) {
        return 0.0;  // All returns must have same type
    }
    return a / b;  // Returns double
}

// With multiple return statements (must be same type)
auto max(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;  // Both return int
}

// Works with templates
template<typename T, typename U>
auto multiply(T a, U b) {
    return a * b;  // Type deduced from a * b
}

int x = 5;
double y = 3.14;
auto result = multiply(x, y);  // double
```

### 2. Generic Lambdas

Lambdas with `auto` parameters (templated lambdas).

```cpp
// C++11: explicit types
auto lambda = [](int a, int b) { return a + b; };

// C++14: auto parameters (generic lambda)
auto generic_lambda = [](auto a, auto b) {
    return a + b;
};

int result1 = generic_lambda(3, 4);        // 7
double result2 = generic_lambda(3.5, 2.1); // 5.6
std::string result3 = generic_lambda(std::string("hello"), std::string(" world"));

// Works with STL algorithms
std::vector<int> vec1 = {1, 2, 3};
std::vector<double> vec2 = {1.5, 2.5, 3.5};

auto add_vectors = [](auto& v1, const auto& v2) {
    for (size_t i = 0; i < v1.size() && i < v2.size(); ++i) {
        v1[i] += v2[i];
    }
};

add_vectors(vec1, vec2);  // Works with different types
```

### 3. Lambda Capture Initializers

Initialize captured variables in lambda capture list.

```cpp
// C++14: capture with initializer
int x = 10;
auto lambda = [y = x + 5, z = std::move(x)](int a) {
    return a + y + z;
};

// Move capture
auto ptr = std::make_unique<int>(42);
auto lambda2 = [p = std::move(ptr)]() {
    return *p;
};

// Reference capture with initializer
auto lambda3 = [&ref = x]() {
    ref = 100;  // Modifies x
};

// Useful for creating closures
auto make_counter = [count = 0]() mutable {
    return [count]() mutable {
        return ++count;
    };
};
```

### 4. Relaxed `constexpr` Restrictions

More functions can be `constexpr`.

```cpp
// C++11: constexpr functions were very limited
constexpr int square(int x) {
    return x * x;  // Only return statement
}

// C++14: constexpr can have multiple statements
constexpr int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

constexpr int fact5 = factorial(5);  // Computed at compile time

// Can use loops
constexpr int sum(int n) {
    int result = 0;
    for (int i = 1; i <= n; ++i) {
        result += i;
    }
    return result;
}

constexpr int sum10 = sum(10);  // 55, computed at compile time

// Can use local variables
constexpr int power(int base, int exp) {
    int result = 1;
    for (int i = 0; i < exp; ++i) {
        result *= base;
    }
    return result;
}
```

### 5. Variable Templates

Templates for variables (not just types and functions).

```cpp
// Variable template
template<typename T>
constexpr T pi = T(3.1415926535897932385L);

float f = pi<float>;
double d = pi<double>;
long double ld = pi<long double>;

// Specialization
template<>
constexpr const char* pi<const char*> = "3.14159";

// Variable template with parameters
template<typename T, int N>
constexpr T array_size = N;

int arr[10];
static_assert(array_size<decltype(arr), 10> == 10);

// Useful for type traits
template<typename T>
constexpr bool is_integral_v = std::is_integral<T>::value;

if constexpr (is_integral_v<int>) {  // C++17, but concept from C++14
    // ...
}
```

### 6. Binary Literals

Binary integer literals.

```cpp
// C++14: binary literals
int binary = 0b1010;        // 10 in decimal
int binary2 = 0B11110000;   // 240 in decimal

// With separators (C++14)
int large_binary = 0b1111'0000'1010'0101;  // More readable

// Useful for bit manipulation
constexpr int FLAG_A = 0b0001;
constexpr int FLAG_B = 0b0010;
constexpr int FLAG_C = 0b0100;
constexpr int FLAG_D = 0b1000;

int flags = FLAG_A | FLAG_C;  // 0b0101
```

### 7. Digit Separators

Single quotes as digit separators for readability.

```cpp
// C++14: digit separators
int million = 1'000'000;
long long billion = 1'000'000'000LL;
double pi = 3.14159'26535'89793;

// Works with all bases
int binary = 0b1111'0000'1010'0101;
int hex = 0xFF'00'AA'BB;
int octal = 077'123'456;

// Improves readability
constexpr int MAX_SIZE = 1'000'000'000;
constexpr double GRAVITY = 9.806'65;
```

### 8. `[[deprecated]]` Attribute

Mark code as deprecated.

```cpp
// C++14: deprecated attribute
[[deprecated]]
void old_function() {}

[[deprecated("Use new_function() instead")]]
void legacy_function() {}

// Usage
old_function();  // Compiler warning

// Can be applied to classes, variables, etc.
class [[deprecated]] OldClass {};

[[deprecated]] int old_variable = 42;
```

---

## Standard Library

### 9. `std::make_unique`

Factory function for `std::unique_ptr`.

```cpp
#include <memory>

// C++11: had to use new
std::unique_ptr<int> ptr(new int(42));

// C++14: make_unique
auto ptr = std::make_unique<int>(42);
auto arr = std::make_unique<int[]>(10);  // Array version

// Safer (exception-safe)
void func() {
    auto ptr = std::make_unique<MyClass>();
    // If exception thrown, memory is automatically cleaned up
}

// Array specialization
auto arr = std::make_unique<int[]>(100);
arr[0] = 42;
```

### 10. `std::shared_timed_mutex` and `std::shared_lock`

Read-write locks with timeout support.

```cpp
#include <shared_mutex>
#include <thread>

std::shared_timed_mutex mtx;
int shared_data = 0;

// Writer
void writer() {
    std::unique_lock<std::shared_timed_mutex> lock(mtx);
    shared_data = 42;
}

// Reader
void reader() {
    std::shared_lock<std::shared_timed_mutex> lock(mtx);
    int value = shared_data;  // Multiple readers can access
}

// With timeout
void reader_with_timeout() {
    std::shared_lock<std::shared_timed_mutex> lock(mtx, std::chrono::milliseconds(100));
    if (lock.owns_lock()) {
        int value = shared_data;
    }
}
```

### 11. `std::integer_sequence` and Related Utilities

Compile-time integer sequences.

```cpp
#include <utility>

// Integer sequence
template<typename T, T... Ints>
void print_sequence(std::integer_sequence<T, Ints...>) {
    ((std::cout << Ints << " "), ...);  // C++17 fold, but sequence from C++14
}

print_sequence(std::integer_sequence<int, 1, 2, 3, 4, 5>{});

// Make integer sequence
template<int N>
using int_sequence = std::make_integer_sequence<int, N>;

// Index sequence (common use case)
template<typename... Args>
void print_args(Args... args) {
    print_sequence(std::index_sequence_for<Args...>{});
}
```

### 12. `std::exchange`

Atomically replace value and return old value.

```cpp
#include <utility>

int x = 10;
int old = std::exchange(x, 20);  // x = 20, old = 10

// Useful for move semantics
class MyClass {
    std::unique_ptr<int> ptr_;
public:
    MyClass(MyClass&& other) noexcept
        : ptr_(std::exchange(other.ptr_, nullptr)) {}
};
```

### 13. `std::quoted` I/O Manipulator

Handle quoted strings in I/O.

```cpp
#include <iomanip>
#include <sstream>

std::string name = "John \"Johnny\" Doe";
std::ostringstream oss;
oss << std::quoted(name);  // Outputs: "John \"Johnny\" Doe"

std::istringstream iss(R"("Hello, World!")");
std::string extracted;
iss >> std::quoted(extracted);  // Extracts: Hello, World!
```

### 14. Heterogeneous Lookup in Associative Containers

Lookup with different but comparable types.

```cpp
#include <string>
#include <map>

// C++14: heterogeneous lookup (with transparent comparator)
std::map<std::string, int, std::less<>> m = {
    {"one", 1},
    {"two", 2}
};

// Can lookup with string_view (C++17) or const char*
// Note: requires std::less<> (transparent comparator)
size_t count = m.count("one");  // Works with const char*
```

### 15. `std::tuple` Improvements

```cpp
#include <tuple>

std::tuple<int, double, std::string> t(42, 3.14, "hello");

// C++14: type-based access
auto i = std::get<int>(t);           // 42
auto d = std::get<double>(t);        // 3.14
auto s = std::get<std::string>(t);   // "hello"

// Only works if types are unique
```

---

## Other Improvements

### 16. Sized Deallocation

```cpp
// C++14: sized deallocation
void operator delete(void* ptr, std::size_t size) noexcept {
    // Can use size for optimization
    std::free(ptr);
}

void operator delete[](void* ptr, std::size_t size) noexcept {
    std::free(ptr);
}
```

### 17. Aggregate Member Initialization

```cpp
// C++14: can initialize aggregate members with braces
struct Point {
    int x, y;
};

Point p{10, 20};  // Aggregate initialization

// Works with arrays
int arr[]{1, 2, 3, 4, 5};
```

### 18. Clarified Memory Model

Better specification of memory ordering and atomics.

```cpp
#include <atomic>

std::atomic<int> counter{0};

// C++14 clarified memory ordering semantics
counter.store(10, std::memory_order_release);
int value = counter.load(std::memory_order_acquire);
```

---

## Summary Table

| Feature | Category | Description |
|---------|----------|-------------|
| Auto return types | Language | Function return type deduction |
| Generic lambdas | Language | Lambdas with auto parameters |
| Lambda capture init | Language | Initialize captures |
| Relaxed constexpr | Language | More constexpr capabilities |
| Variable templates | Language | Templates for variables |
| Binary literals | Language | 0b prefix for binary |
| Digit separators | Language | ' as separator |
| `make_unique` | Library | Factory for unique_ptr |
| `shared_timed_mutex` | Library | Read-write lock with timeout |
| `std::exchange` | Library | Atomic value replacement |
| `std::quoted` | Library | Quoted string I/O |

---

## Migration from C++11

1. **Use `std::make_unique` instead of `new` with `unique_ptr`**
2. **Use generic lambdas for template-like behavior**
3. **Use auto return types for simpler function declarations**
4. **Use digit separators for large numbers**
5. **Use binary literals for bit manipulation**

---

## Compiler Support

- **GCC**: 5.0+ (full support)
- **Clang**: 3.4+ (full support)
- **MSVC**: Visual Studio 2015+ (full support)

Compile with: `-std=c++14` (GCC/Clang) or `/std:c++14` (MSVC)

---

C++14 was a "bug fix" release that refined C++11, making the language more convenient and expressive while maintaining backward compatibility.

