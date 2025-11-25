---
layout: post
title: "C++11 New Features: Complete Guide and Reference"
date: 2025-11-16 00:00:00 -0700
categories: cpp programming tutorial reference language c++11 modern-cpp
tags: cpp c++11 auto lambda smart-pointers rvalue-references move-semantics constexpr alignas alignof
excerpt: "A comprehensive guide to all C++11 new features including auto, lambdas, smart pointers, rvalue references, alignas, alignof, and many more with practical examples."
---

# C++11 New Features: Complete Guide and Reference

C++11 (formerly C++0x) was a major update that introduced many modern C++ features. This guide provides a comprehensive reference to all C++11 features with examples.

## Core Language Features

### 1. `auto` Keyword

Automatic type deduction from initializers.

```cpp
// Before C++11
std::vector<int>::iterator it = vec.begin();

// C++11
auto it = vec.begin();
auto x = 42;           // int
auto y = 3.14;         // double
auto z = "hello";      // const char*
auto ptr = new int(5); // int*

// With references
auto& ref = x;         // int&
const auto& cref = x;  // const int&
```

### 2. `decltype` Keyword

Deduces the type of an expression without evaluating it.

```cpp
int x = 5;
decltype(x) y = 10;        // y is int
decltype(x + 3.14) z;      // z is double

// Useful in templates
template<typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}
```

### 3. Trailing Return Types

Specify return type after function parameters.

```cpp
// C++11
template<typename T, typename U>
auto multiply(T a, U b) -> decltype(a * b) {
    return a * b;
}

// Useful for lambdas and complex types
auto func() -> int(*)() {
    return nullptr;
}
```

### 4. Range-Based For Loop

Iterate over containers and arrays.

```cpp
std::vector<int> vec = {1, 2, 3, 4, 5};

// By value
for (auto val : vec) {
    std::cout << val << " ";
}

// By reference (modify)
for (auto& val : vec) {
    val *= 2;
}

// By const reference (read-only)
for (const auto& val : vec) {
    std::cout << val << " ";
}

// Works with arrays
int arr[] = {1, 2, 3};
for (auto x : arr) {
    std::cout << x << " ";
}
```

### 5. Lambda Expressions

Anonymous function objects.

```cpp
// Basic syntax: [capture](parameters) -> return_type { body }

// Simple lambda
auto add = [](int a, int b) { return a + b; };
int result = add(3, 4);  // 7

// With capture
int x = 10;
auto add_x = [x](int a) { return a + x; };  // Capture by value
auto add_x_ref = [&x](int a) { return a + x; };  // Capture by reference

// Capture all by value
auto func1 = [=](int a) { return a + x; };

// Capture all by reference
auto func2 = [&](int a) { x += a; };

// Mutable lambda (can modify captured by-value variables)
auto counter = [count = 0]() mutable { return ++count; };

// Lambda as function parameter
std::vector<int> vec = {1, 2, 3, 4, 5};
std::for_each(vec.begin(), vec.end(), [](int& n) { n *= 2; });
```

### 6. Rvalue References and Move Semantics

Efficient transfer of resources.

```cpp
// Rvalue reference
int&& rref = 42;  // Temporary is an rvalue

// Move constructor
class MyClass {
public:
    MyClass(MyClass&& other) noexcept  // Move constructor
        : data_(std::move(other.data_)) {
        other.data_ = nullptr;
    }
    
    MyClass& operator=(MyClass&& other) noexcept {  // Move assignment
        if (this != &other) {
            delete data_;
            data_ = std::move(other.data_);
            other.data_ = nullptr;
        }
        return *this;
    }
    
private:
    int* data_;
};

// std::move
std::vector<int> vec1 = {1, 2, 3};
std::vector<int> vec2 = std::move(vec1);  // vec1 is now empty
```

### 7. Perfect Forwarding

Forward arguments with their value category preserved.

```cpp
template<typename T>
void forward_func(T&& arg) {
    // Forward with original value category
    other_func(std::forward<T>(arg));
}

// Example usage
forward_func(42);              // rvalue forwarded as rvalue
int x = 10;
forward_func(x);               // lvalue forwarded as lvalue
forward_func(std::move(x));    // rvalue forwarded as rvalue
```

### 8. `nullptr` Keyword

Type-safe null pointer constant.

```cpp
// Before C++11
int* ptr = NULL;  // NULL is typically 0 or (void*)0

// C++11
int* ptr = nullptr;  // Type-safe, can't be confused with integers

void func(int* p);
void func(int i);

func(nullptr);  // Calls func(int*)
func(0);       // Ambiguous - could be int* or int
func(NULL);    // Ambiguous
```

### 9. Uniform Initialization

Braced initialization syntax.

{% raw %}
```cpp
// Works everywhere
int x{42};
std::vector<int> vec{1, 2, 3, 4, 5};
std::map<std::string, int> m{{"one", 1}, {"two", 2}};

// Prevents narrowing
int y{3.14};  // Error: narrowing conversion

// Class initialization
class MyClass {
public:
    MyClass(int a, double b) : a_(a), b_(b) {}
private:
    int a_;
    double b_;
};

MyClass obj{10, 3.14};  // Direct initialization
```
{% endraw %}

### 10. Initializer Lists

`std::initializer_list` for constructor and function parameters.

```cpp
#include <initializer_list>

class Container {
public:
    Container(std::initializer_list<int> list) {
        for (auto val : list) {
            data_.push_back(val);
        }
    }
    
private:
    std::vector<int> data_;
};

Container c{1, 2, 3, 4, 5};  // Uses initializer_list

// Function with initializer_list
void print(std::initializer_list<int> list) {
    for (auto val : list) {
        std::cout << val << " ";
    }
}

print({1, 2, 3, 4});
```

### 11. `constexpr` Keyword

Compile-time constant expressions.

```cpp
// Constexpr functions
constexpr int square(int x) {
    return x * x;
}

constexpr int result = square(5);  // Computed at compile time
int arr[square(3)];                // Array size computed at compile time

// Constexpr variables
constexpr double pi = 3.14159;
constexpr int max_size = 100;
```

### 12. `static_assert`

Compile-time assertions.

```cpp
static_assert(sizeof(int) == 4, "int must be 4 bytes");
static_assert(sizeof(void*) == 8, "64-bit platform required");

// In templates
template<typename T>
void func() {
    static_assert(std::is_integral<T>::value, "T must be integral");
}
```

### 13. Strongly Typed Enums (`enum class`)

Scoped enumerations.

```cpp
// Old enum (still available)
enum Color { Red, Green, Blue };
int x = Red;  // Implicitly converts to int

// C++11 enum class
enum class Color { Red, Green, Blue };
// int x = Color::Red;  // Error: no implicit conversion

Color c = Color::Red;
if (c == Color::Green) { /* ... */ }

// With underlying type
enum class Status : uint8_t { Ok, Error, Pending };

// Forward declaration
enum class Status : int;  // Can forward declare with underlying type
```

### 14. Explicit Conversion Operators

Control implicit conversions.

```cpp
class MyBool {
public:
    explicit operator bool() const {  // Explicit conversion
        return value_;
    }
    
    // Without explicit, could be used in if statements implicitly
private:
    bool value_;
};

MyBool mb;
// bool b = mb;  // Error: explicit conversion required
bool b = static_cast<bool>(mb);  // OK
if (mb) { /* ... */ }  // OK: contextually converted
```

### 15. Defaulted and Deleted Functions

```cpp
class MyClass {
public:
    // Default constructor
    MyClass() = default;
    
    // Delete copy constructor
    MyClass(const MyClass&) = delete;
    
    // Delete copy assignment
    MyClass& operator=(const MyClass&) = delete;
    
    // Default move constructor
    MyClass(MyClass&&) = default;
    
    // Delete function
    void func(int) = delete;
    void func(double);  // Only this overload available
};

MyClass obj;
// MyClass obj2 = obj;  // Error: copy constructor deleted
obj.func(3.14);        // OK
// obj.func(42);        // Error: func(int) deleted
```

### 16. Variadic Templates

Templates with variable number of arguments.

```cpp
// Base case
void print() {
    std::cout << std::endl;
}

// Recursive case
template<typename T, typename... Args>
void print(T first, Args... rest) {
    std::cout << first << " ";
    print(rest...);  // Recursive call
}

print(1, 2.5, "hello", 'c');  // Prints: 1 2.5 hello c

// Perfect forwarding with variadic templates
template<typename... Args>
void emplace(Args&&... args) {
    // Forward all arguments
    construct(std::forward<Args>(args)...);
}
```

### 17. Template Aliases

`using` for type aliases (better than `typedef`).

```cpp
// Old way
typedef std::vector<int> IntVec;
typedef void (*FuncPtr)(int);

// C++11 way
using IntVec = std::vector<int>;
using FuncPtr = void(*)(int);

// Works with templates
template<typename T>
using Vec = std::vector<T>;

Vec<int> vec1;
Vec<std::string> vec2;

template<typename T>
using Ptr = T*;

Ptr<int> ptr;  // int*
```

### 18. `override` and `final` Keywords

```cpp
class Base {
public:
    virtual void func() {}
    virtual void func2() final {}  // Cannot be overridden
};

class Derived : public Base {
public:
    void func() override {}  // Explicitly overriding
    // void func2() {}       // Error: func2 is final
};

class FinalDerived final : public Base {
    // This class cannot be inherited
};
```

### 19. Raw String Literals

```cpp
// Regular string
std::string path = "C:\\Users\\Name\\file.txt";

// Raw string (no escape sequences needed)
std::string path2 = R"(C:\Users\Name\file.txt)";

// Multi-line raw string
std::string html = R"(
<html>
    <body>
        <h1>Hello</h1>
    </body>
</html>
)";

// Custom delimiter
std::string text = R"delimiter(Some "quoted" text)delimiter";
```

### 20. User-Defined Literals

```cpp
// Define suffix
long double operator"" _km(long double val) {
    return val * 1000.0;  // Convert km to meters
}

long double operator"" _m(long double val) {
    return val;
}

// Usage
long double distance = 5.5_km + 200.0_m;  // 5500.0 meters

// String literal
std::string operator"" _s(const char* str, size_t len) {
    return std::string(str, len);
}

auto str = "hello"_s;  // std::string
```

---

## Memory and Alignment

### 21. `alignas` Specifier

Specify alignment requirements.

```cpp
// Align to 16-byte boundary
alignas(16) int aligned_int;

// Align to cache line (typically 64 bytes)
alignas(64) char cache_line_data[64];

// Structure alignment
struct alignas(16) AlignedStruct {
    int a;
    double b;
    char c;
};

// Array alignment
alignas(32) int aligned_array[100];

// Variable alignment
alignas(double) int x;  // Align to double's alignment requirement
```

### 22. `alignof` Operator

Query alignment requirement of a type.

```cpp
#include <iostream>

std::cout << alignof(int) << std::endl;        // Typically 4
std::cout << alignof(double) << std::endl;     // Typically 8
std::cout << alignof(char) << std::endl;       // Typically 1

struct MyStruct {
    int a;
    double b;
};

std::cout << alignof(MyStruct) << std::endl;   // Typically 8 (largest member)

// With alignas
struct alignas(32) AlignedStruct {
    int a;
};

std::cout << alignof(AlignedStruct) << std::endl;  // 32
```

### 23. `std::aligned_storage` and `std::aligned_union`

```cpp
#include <type_traits>

// Aligned storage for uninitialized memory
std::aligned_storage<sizeof(int), alignof(int)>::type storage;
int* ptr = new(&storage) int(42);

// Aligned union storage
std::aligned_union<0, int, double, char>::type union_storage;
```

---

## Standard Library

### 24. Smart Pointers

#### `std::unique_ptr`

```cpp
#include <memory>

// Exclusive ownership
std::unique_ptr<int> ptr(new int(42));
std::unique_ptr<int> ptr2 = std::make_unique<int>(42);  // C++14, but concept from C++11

// Move semantics
std::unique_ptr<int> ptr3 = std::move(ptr);  // ptr is now nullptr

// Custom deleter
std::unique_ptr<FILE, decltype(&fclose)> file(fopen("file.txt", "r"), fclose);

// Array specialization
std::unique_ptr<int[]> arr(new int[10]);
arr[0] = 42;
```

#### `std::shared_ptr`

```cpp
#include <memory>

// Shared ownership
std::shared_ptr<int> ptr1 = std::make_shared<int>(42);
std::shared_ptr<int> ptr2 = ptr1;  // Both point to same object

// Reference counting
std::cout << ptr1.use_count() << std::endl;  // 2

// Custom deleter
std::shared_ptr<int> ptr3(new int[10], [](int* p) { delete[] p; });
```

#### `std::weak_ptr`

```cpp
#include <memory>

std::shared_ptr<int> shared = std::make_shared<int>(42);
std::weak_ptr<int> weak = shared;

// Check if object still exists
if (auto locked = weak.lock()) {
    std::cout << *locked << std::endl;  // Object still exists
} else {
    std::cout << "Object destroyed" << std::endl;
}

// Use case: Breaking circular references
```

### 25. STL Container Improvements

#### `std::array`

```cpp
#include <array>

std::array<int, 5> arr = {1, 2, 3, 4, 5};
std::cout << arr.size() << std::endl;      // 5
std::cout << arr[0] << std::endl;         // 1
arr.fill(0);                                // Fill with zeros
```

#### `std::forward_list`

```cpp
#include <forward_list>

std::forward_list<int> flist = {1, 2, 3, 4, 5};
flist.push_front(0);
flist.insert_after(flist.begin(), 10);
```

#### Unordered Containers

```cpp
#include <unordered_map>
#include <unordered_set>

std::unordered_map<std::string, int> umap = {
    {"one", 1},
    {"two", 2},
    {"three", 3}
};

std::unordered_set<int> uset = {1, 2, 3, 4, 5};
```

### 26. `std::tuple`

```cpp
#include <tuple>

// Create tuple
std::tuple<int, double, std::string> t(42, 3.14, "hello");

// Access elements
std::cout << std::get<0>(t) << std::endl;  // 42
std::cout << std::get<1>(t) << std::endl;  // 3.14
std::cout << std::get<2>(t) << std::endl;  // "hello"

// Make tuple
auto t2 = std::make_tuple(1, 2.5, "world");

// Tie (unpack)
int a;
double b;
std::string c;
std::tie(a, b, c) = t;

// Structured bindings (C++17, but tuple from C++11)
```

### 27. `std::function` and `std::bind`

```cpp
#include <functional>

// std::function - type-erased function wrapper
std::function<int(int, int)> add = [](int a, int b) { return a + b; };
int result = add(3, 4);  // 7

// Store function pointer
int multiply(int a, int b) { return a * b; }
std::function<int(int, int)> mul = multiply;

// std::bind - bind arguments
using namespace std::placeholders;

auto add_10 = std::bind(add, _1, 10);
int result2 = add_10(5);  // 15

auto multiply_by = std::bind(multiply, _1, 2);
int result3 = multiply_by(7);  // 14
```

### 28. Regular Expressions

```cpp
#include <regex>

std::string text = "Hello, my email is user@example.com";
std::regex email_pattern(R"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})");

if (std::regex_search(text, email_pattern)) {
    std::cout << "Email found!" << std::endl;
}

// Replace
std::string result = std::regex_replace(text, email_pattern, "[EMAIL]");

// Match groups
std::smatch matches;
if (std::regex_search(text, matches, email_pattern)) {
    std::cout << "Email: " << matches[0] << std::endl;
}
```

### 29. Random Number Generation

```cpp
#include <random>

// Random engine
std::random_device rd;
std::mt19937 gen(rd());

// Distributions
std::uniform_int_distribution<> dis(1, 6);  // Dice
int dice_roll = dis(gen);

std::uniform_real_distribution<> real_dis(0.0, 1.0);
double random_real = real_dis(gen);

std::normal_distribution<> normal_dis(0.0, 1.0);
double normal_value = normal_dis(gen);
```

### 30. Chrono Library

```cpp
#include <chrono>

using namespace std::chrono;

// Time points
auto start = steady_clock::now();
// ... do work ...
auto end = steady_clock::now();
auto duration = duration_cast<milliseconds>(end - start);
std::cout << "Elapsed: " << duration.count() << " ms" << std::endl;

// Durations
seconds sec(5);
milliseconds ms = duration_cast<milliseconds>(sec);  // 5000 ms

// System clock
auto now = system_clock::now();
auto time_t = system_clock::to_time_t(now);
std::cout << std::ctime(&time_t) << std::endl;
```

---

## Concurrency

### 31. Thread Support Library

```cpp
#include <thread>
#include <mutex>
#include <condition_variable>
#include <future>

// Thread
void worker(int id) {
    std::cout << "Thread " << id << " working" << std::endl;
}

std::thread t1(worker, 1);
std::thread t2(worker, 2);
t1.join();
t2.join();

// Mutex
std::mutex mtx;
void safe_increment(int& counter) {
    std::lock_guard<std::mutex> lock(mtx);
    ++counter;
}

// Condition variable
std::condition_variable cv;
std::mutex cv_mtx;
bool ready = false;

// Producer
{
    std::lock_guard<std::mutex> lock(cv_mtx);
    ready = true;
}
cv.notify_one();

// Consumer
std::unique_lock<std::mutex> lock(cv_mtx);
cv.wait(lock, []{ return ready; });

// Future and Promise
std::promise<int> promise;
std::future<int> future = promise.get_future();

std::thread([&promise]() {
    promise.set_value(42);
}).detach();

int value = future.get();  // 42

// Async
auto future2 = std::async(std::launch::async, []() {
    return 100;
});
int result = future2.get();
```

### 32. Atomic Operations

```cpp
#include <atomic>

std::atomic<int> counter{0};

// Thread-safe operations
counter.fetch_add(1);
counter.store(10);
int value = counter.load();

// Compare and swap
int expected = 5;
counter.compare_exchange_weak(expected, 10);
```

---

## Other Features

### 33. Type Traits

```cpp
#include <type_traits>

// Type checking
static_assert(std::is_integral<int>::value);
static_assert(std::is_floating_point<double>::value);
static_assert(std::is_pointer<int*>::value);

// Type modifications
using IntPtr = std::add_pointer<int>::type;  // int*
using IntRef = std::add_lvalue_reference<int>::type;  // int&
using IntNoRef = std::remove_reference<int&>::type;  // int

// Enable if (SFINAE)
template<typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type
func(T val) {
    return val * 2;
}
```

### 34. Exception Safety Improvements

```cpp
#include <exception>

// noexcept specifier
void func() noexcept {
    // Function guarantees no exceptions
}

// Exception propagation
void may_throw() {
    throw std::runtime_error("Error");
}

void wrapper() noexcept {
    try {
        may_throw();
    } catch (...) {
        std::terminate();  // Called if exception escapes noexcept function
    }
}
```

### 35. Attributes

```cpp
// [[noreturn]]
[[noreturn]] void terminate() {
    std::exit(1);
}

// [[deprecated]]
[[deprecated("Use new_func() instead")]]
void old_func() {}

// [[maybe_unused]]
[[maybe_unused]] int unused_var = 42;
```

### 36. Local and Unnamed Types as Template Arguments

```cpp
// Local types as template arguments
void func() {
    struct LocalType {
        int value;
    };
    
    std::vector<LocalType> vec;  // OK in C++11
}

// Unnamed types
enum { Red, Green, Blue } color;
std::vector<decltype(color)> vec2;  // OK
```

### 37. Right Angle Brackets

```cpp
// Before C++11: space required
std::vector<std::map<int, std::string> > vec;  // Note the space

// C++11: no space needed
std::vector<std::map<int, std::string>> vec;  // OK
```

### 38. Extern Templates

```cpp
// Prevent instantiation in this translation unit
extern template class std::vector<int>;

// Explicit instantiation in one translation unit
template class std::vector<int>;
```

### 39. Inline Namespaces

```cpp
namespace v1 {
    void func() {}
}

inline namespace v2 {
    void func() {}  // This is the default version
}

// v2::func() is found when calling func()
```

### 40. Delegating Constructors

```cpp
class MyClass {
public:
    MyClass(int a) : a_(a), b_(0) {}
    
    // Delegate to another constructor
    MyClass() : MyClass(0) {}
    
    MyClass(int a, int b) : MyClass(a) {
        b_ = b;
    }
    
private:
    int a_, b_;
};
```

---

## Summary Table

| Feature | Category | Description |
|---------|----------|-------------|
| `auto` | Language | Type deduction |
| `decltype` | Language | Type querying |
| Range-based for | Language | Container iteration |
| Lambdas | Language | Anonymous functions |
| Rvalue references | Language | Move semantics |
| `nullptr` | Language | Type-safe null |
| Uniform initialization | Language | Braced init |
| `constexpr` | Language | Compile-time constants |
| `enum class` | Language | Scoped enums |
| Variadic templates | Language | Variable templates |
| `alignas` | Memory | Alignment specifier |
| `alignof` | Memory | Alignment query |
| Smart pointers | Library | RAII pointers |
| `std::array` | Library | Fixed-size array |
| `std::tuple` | Library | Heterogeneous collection |
| `std::function` | Library | Function wrapper |
| Regex | Library | Regular expressions |
| Chrono | Library | Time utilities |
| Threads | Concurrency | Multithreading |
| Atomics | Concurrency | Lock-free operations |

---

## Migration Tips

1. **Replace `NULL` with `nullptr`**
2. **Use `auto` for iterator types**
3. **Prefer range-based for loops**
4. **Use smart pointers instead of raw pointers**
5. **Use `std::array` instead of C arrays**
6. **Use `enum class` for type-safe enums**
7. **Use lambdas for small function objects**
8. **Enable move semantics for resource-owning classes**

---

## Compiler Support

Most modern compilers fully support C++11:
- **GCC**: 4.8+ (full support)
- **Clang**: 3.3+ (full support)
- **MSVC**: Visual Studio 2013+ (full support)

Compile with: `-std=c++11` (GCC/Clang) or `/std:c++11` (MSVC)

---

This guide covers the major C++11 features. Each feature significantly improved C++'s expressiveness, safety, and performance, making it a truly modern language.

