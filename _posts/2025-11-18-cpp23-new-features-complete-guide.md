---
layout: post
title: "C++23 New Features: Complete Guide and Reference"
date: 2025-11-18 00:00:00 -0700
categories: cpp programming tutorial reference language c++23 modern-cpp
tags: cpp c++23 expected stacktrace print std-print ifconsteval deducing-this
excerpt: "A comprehensive guide to all C++23 new features including std::expected, std::stacktrace, std::print, if consteval, deducing this, and more with practical examples."
---

# C++23 New Features: Complete Guide and Reference

C++23 is the latest C++ standard, building on C++20 with many improvements and new features. This guide covers all C++23 features.

---

## Table of Contents

1. [Core Language Features](#core-language-features)
2. [Standard Library](#standard-library)
3. [Other Features](#other-features)

---

## Core Language Features

### 1. `if consteval`

Simpler compile-time conditionals.

```cpp
// C++20: std::is_constant_evaluated()
constexpr int func(int x) {
    if (std::is_constant_evaluated()) {
        return x * 2;
    }
    return x + 1;
}

// C++23: if consteval
constexpr int func2(int x) {
    if consteval {
        return x * 2;  // Compile-time path
    } else {
        return x + 1;  // Runtime path
    }
}

constexpr int compile_time = func2(5);  // Uses consteval path
int runtime = func2(5);                 // Uses else path
```

### 2. Deducing `this`

Automatic deduction of object type in member functions.

```cpp
// Before C++23: need to write separate const/non-const overloads
class Container {
    int* data_;
public:
    int& get() & { return *data_; }           // lvalue
    const int& get() const & { return *data_; } // const lvalue
    int&& get() && { return std::move(*data_); } // rvalue
};

// C++23: deducing this
class Container23 {
    int* data_;
public:
    template<typename Self>
    auto& get(this Self&& self) {
        return *self.data_;
    }
};

Container23 c;
auto& val1 = c.get();           // lvalue reference
const auto& val2 = std::as_const(c).get(); // const reference
auto&& val3 = Container23{}.get(); // rvalue reference
```

### 3. Multidimensional Subscript Operator

```cpp
class Matrix {
    int data_[10][10];
public:
    // C++23: multidimensional subscript
    int& operator[](size_t i, size_t j) {
        return data_[i][j];
    }
    
    const int& operator[](size_t i, size_t j) const {
        return data_[i][j];
    }
};

Matrix m;
m[2, 3] = 42;  // C++23 syntax
int val = m[2, 3];
```

### 4. `#elifdef` and `#elifndef`

Simplified conditional compilation.

```cpp
// Before C++23
#ifdef FEATURE_A
    // ...
#else
    #ifdef FEATURE_B
        // ...
    #endif
#endif

// C++23
#ifdef FEATURE_A
    // ...
#elifdef FEATURE_B
    // ...
#elifndef FEATURE_C
    // ...
#endif
```

### 5. `#warning` Directive

Emit compiler warnings.

```cpp
#ifndef DEPRECATED_FEATURE
    #warning "This feature is deprecated"
#endif

#warning "This code needs review"
```

### 6. `std::unreachable()`

Mark unreachable code.

```cpp
#include <utility>

int func(int x) {
    if (x < 0) {
        return -1;
    } else if (x > 100) {
        return 1;
    } else if (x >= 0 && x <= 100) {
        return 0;
    }
    std::unreachable();  // Compiler knows this is unreachable
}
```

### 7. Attributes on Lambda

```cpp
// C++23: attributes on lambdas
auto lambda = []() [[nodiscard]] {
    return 42;
};

auto lambda2 = []() [[deprecated("Use new_lambda")]] {
    return 0;
};
```

### 8. `auto(x)` and `auto{x}`

Decay-copy expressions.

```cpp
std::string str = "hello";

// auto(x) creates a decayed copy
auto copy1 = auto(str);  // std::string copy
auto copy2 = auto{str};  // std::string copy

// Useful for move semantics
void func(std::string s);

func(auto(str));  // Explicit copy
func(std::move(str));  // Move
```

---

## Standard Library

### 9. `std::expected`

Type-safe error handling without exceptions.

```cpp
#include <expected>

// Success case
std::expected<int, std::string> success_value(int x) {
    if (x > 0) {
        return x * 2;
    }
    return std::unexpected("Negative value");
}

auto result = success_value(5);
if (result.has_value()) {
    std::cout << *result << std::endl;  // 10
} else {
    std::cout << result.error() << std::endl;
}

// With monadic operations
auto result2 = success_value(10)
    .and_then([](int x) -> std::expected<int, std::string> {
        return x + 5;
    })
    .transform([](int x) { return x * 2; })
    .or_else([](const std::string&) {
        return std::expected<int, std::string>(0);
    });
```

### 10. `std::stacktrace`

Stack trace support.

```cpp
#include <stacktrace>
#include <iostream>

void func3() {
    auto trace = std::stacktrace::current();
    std::cout << trace << std::endl;
}

void func2() {
    func3();
}

void func1() {
    func2();
}

int main() {
    func1();
    return 0;
}
```

### 11. `std::print` and `std::println`

Simplified printing.

```cpp
#include <print>

// C++23: std::print (no newline)
std::print("Hello, {}!\n", "World");
std::print("x={}, y={:.2f}\n", 42, 3.14);

// std::println (with newline)
std::println("Hello, {}!", "World");
std::println("x={}, y={:.2f}", 42, 3.14);

// File printing
std::print(std::cout, "To stdout: {}\n", "message");
std::print(std::cerr, "Error: {}\n", "message");
```

### 12. `std::mdspan`

Multidimensional array view.

```cpp
#include <mdspan>

int data[100];  // 1D array
std::mdspan<int, std::extents<size_t, 10, 10>> matrix(data);

matrix[2, 3] = 42;  // Access element
auto subspan = std::submdspan(matrix, 1, std::full_extent, std::full_extent);
```

### 13. `std::generator`

Coroutine-based generator.

```cpp
#include <generator>

std::generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto temp = a + b;
        a = b;
        b = temp;
    }
}

auto fib = fibonacci();
for (int i = 0; i < 10; ++i) {
    std::cout << *fib << " ";
    ++fib;
}
```

### 14. `std::ranges::to`

Convert ranges to containers.

```cpp
#include <ranges>
#include <vector>

std::vector<int> vec = {1, 2, 3, 4, 5};

// C++23: convert range to container
auto evens = vec
    | std::views::filter([](int x) { return x % 2 == 0; })
    | std::ranges::to<std::vector>();

auto squares = vec
    | std::views::transform([](int x) { return x * x; })
    | std::ranges::to<std::set>();
```

### 15. `std::ranges::fold`

Fold operations for ranges.

```cpp
#include <ranges>
#include <numeric>

std::vector<int> vec = {1, 2, 3, 4, 5};

// Fold left
auto sum = std::ranges::fold_left(vec, 0, std::plus{});
auto product = std::ranges::fold_left(vec, 1, std::multiplies{});

// Fold right
auto sum_right = std::ranges::fold_right(vec, 0, std::plus{});
```

### 16. `std::ranges::chunk` and `std::ranges::slide`

Chunk ranges into groups.

```cpp
#include <ranges>

std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8};

// Chunk into groups of 3
for (auto chunk : vec | std::views::chunk(3)) {
    for (auto val : chunk) {
        std::cout << val << " ";
    }
    std::cout << std::endl;
}

// Slide window
for (auto window : vec | std::views::slide(3)) {
    for (auto val : window) {
        std::cout << val << " ";
    }
    std::cout << std::endl;
}
```

### 17. `std::ranges::chunk_by`

Chunk by predicate.

```cpp
#include <ranges>

std::vector<int> vec = {1, 2, 3, 10, 11, 12, 20, 21};

// Chunk by difference > 5
for (auto chunk : vec | std::views::chunk_by([](int a, int b) {
    return b - a <= 5;
})) {
    for (auto val : chunk) {
        std::cout << val << " ";
    }
    std::cout << std::endl;
}
```

### 18. `std::ranges::join_with`

Join ranges with separator.

```cpp
#include <ranges>

std::vector<std::vector<int>> vecs = {{1, 2}, {3, 4}, {5, 6}};

// Join with separator
for (auto val : vecs | std::views::join_with(0)) {
    std::cout << val << " ";  // 1 2 0 3 4 0 5 6
}
```

### 19. `std::ranges::repeat`

Repeat a value.

```cpp
#include <ranges>

// Repeat value
for (auto val : std::views::repeat(42) | std::views::take(5)) {
    std::cout << val << " ";  // 42 42 42 42 42
}
```

### 20. `std::ranges::zip` and `std::ranges::zip_transform`

Zip multiple ranges.

```cpp
#include <ranges>

std::vector<int> vec1 = {1, 2, 3};
std::vector<std::string> vec2 = {"a", "b", "c"};

// Zip ranges
for (auto [a, b] : std::views::zip(vec1, vec2)) {
    std::cout << a << ":" << b << " ";
}

// Zip transform
auto zipped = std::views::zip_transform(
    [](int a, const std::string& b) {
        return std::to_string(a) + b;
    },
    vec1, vec2
);
```

### 21. `std::ranges::cartesian_product`

Cartesian product of ranges.

```cpp
#include <ranges>

std::vector<int> vec1 = {1, 2};
std::vector<char> vec2 = {'a', 'b'};

// Cartesian product
for (auto [a, b] : std::views::cartesian_product(vec1, vec2)) {
    std::cout << a << "," << b << " ";  // 1,a 1,b 2,a 2,b
}
```

### 22. `std::optional` Improvements

```cpp
#include <optional>

std::optional<int> opt = 42;

// C++23: and_then, or_else, transform
auto result = opt
    .transform([](int x) { return x * 2; })
    .and_then([](int x) -> std::optional<int> {
        if (x > 0) return x;
        return std::nullopt;
    })
    .or_else([]() { return std::optional<int>(0); });
```

### 23. `std::move_only_function`

Move-only function wrapper.

```cpp
#include <functional>

std::move_only_function<int()> func = []() { return 42; };
int result = func();

// Move-only (can't copy)
auto func2 = std::move(func);
// func is now empty
```

### 24. `std::byteswap`

Byte swap utility.

```cpp
#include <bit>

uint16_t value = 0x1234;
uint16_t swapped = std::byteswap(value);  // 0x3412

uint32_t val32 = 0x12345678;
uint32_t swapped32 = std::byteswap(val32);  // 0x78563412
```

### 25. `std::to_underlying`

Convert enum to underlying type.

```cpp
enum class Color : int {
    Red = 1,
    Green = 2,
    Blue = 3
};

Color c = Color::Red;
int underlying = std::to_underlying(c);  // 1
```

### 26. `std::ranges::contains`

Check if range contains value.

```cpp
#include <ranges>

std::vector<int> vec = {1, 2, 3, 4, 5};

if (std::ranges::contains(vec, 3)) {
    std::cout << "Found 3" << std::endl;
}
```

### 27. `std::ranges::starts_with` and `std::ranges::ends_with`

Check prefix/suffix.

```cpp
#include <ranges>

std::vector<int> vec = {1, 2, 3, 4, 5};
std::vector<int> prefix = {1, 2};
std::vector<int> suffix = {4, 5};

if (std::ranges::starts_with(vec, prefix)) {
    std::cout << "Starts with prefix" << std::endl;
}

if (std::ranges::ends_with(vec, suffix)) {
    std::cout << "Ends with suffix" << std::endl;
}
```

---

## Other Features

### 28. `std::is_scoped_enum`

Check if enum is scoped.

```cpp
#include <type_traits>

enum class ScopedEnum { A, B };
enum UnscopedEnum { C, D };

static_assert(std::is_scoped_enum_v<ScopedEnum>);
static_assert(!std::is_scoped_enum_v<UnscopedEnum>);
```

### 29. `std::ranges::find_last`

Find last occurrence.

```cpp
#include <ranges>

std::vector<int> vec = {1, 2, 3, 2, 4};

auto it = std::ranges::find_last(vec, 2);
if (it != vec.end()) {
    std::cout << "Found at position" << std::endl;
}
```

### 30. `std::ranges::shift_left` and `std::ranges::shift_right`

Shift elements.

```cpp
#include <ranges>

std::vector<int> vec = {1, 2, 3, 4, 5};

// Shift left
std::ranges::shift_left(vec, 2);  // {3, 4, 5, ?, ?}

// Shift right
std::ranges::shift_right(vec, 1);  // {?, 1, 2, 3, 4}
```

---

## Summary Table

| Feature | Category | Description |
|---------|----------|-------------|
| `if consteval` | Language | Compile-time conditionals |
| Deducing this | Language | Automatic object type deduction |
| Multidimensional `[]` | Language | Multi-index subscript |
| `std::expected` | Library | Error handling without exceptions |
| `std::stacktrace` | Library | Stack trace support |
| `std::print` | Library | Simplified printing |
| `std::mdspan` | Library | Multidimensional array view |
| `std::generator` | Library | Coroutine generator |
| `std::ranges::to` | Library | Range to container |
| `std::ranges::fold` | Library | Fold operations |
| `std::ranges::chunk` | Library | Chunk ranges |
| `std::ranges::zip` | Library | Zip ranges |
| `std::byteswap` | Library | Byte swapping |
| `std::to_underlying` | Library | Enum to underlying type |

---

## Migration Tips

1. **Use `std::expected` for error handling**
2. **Use `std::print` instead of `std::format` + `std::cout`**
3. **Use `if consteval` instead of `std::is_constant_evaluated()`**
4. **Use deducing this for CRTP patterns**
5. **Use `std::ranges::to` for range conversions**
6. **Use `std::ranges::fold` for reductions**

---

## Compiler Support

- **GCC**: 13.0+ (most features), 14.0+ (full support)
- **Clang**: 16.0+ (most features), 17.0+ (full support)
- **MSVC**: Visual Studio 2022 17.5+ (most features), 17.8+ (full support)

Compile with: `-std=c++23` (GCC/Clang) or `/std:c++23` (MSVC)

---

C++23 continues the evolution of modern C++, adding many quality-of-life improvements and powerful new features for ranges, error handling, and compile-time programming.

