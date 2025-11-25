---
layout: post
title: "C++ std::array Guide: Fixed-Size Array Container"
date: 2025-11-25 00:00:00 -0700
categories: cpp stl containers array
permalink: /2025/11/25/cpp-array-guide/
tags: [cpp, array, stl, containers, fixed-size, stack-allocated, sequence-container]
---

# C++ std::array Guide: Fixed-Size Array Container

A comprehensive guide to `std::array`, a fixed-size array container that provides STL interface with stack-allocated storage, covering all essential methods, common use cases, and best practices.

## Table of Contents

1. [Array Basics](#array-basics)
2. [Element Access Methods](#element-access-methods)
3. [Modifiers](#modifiers)
4. [Iterator Methods](#iterator-methods)
5. [Operations](#operations)
6. [Common Use Cases](#common-use-cases)
7. [Runtime Complexity Analysis](#runtime-complexity-analysis)
8. [Best Practices](#best-practices)

---

## Array Basics

`std::array` is a fixed-size array container that wraps a C-style array with STL interface. It provides stack-allocated storage with no dynamic memory allocation.

```cpp
#include <array>
#include <iostream>

int main() {
    // Default construction (elements are default-initialized)
    std::array<int, 5> arr1;  // {0, 0, 0, 0, 0} (for int)
    
    // Initializer list (C++11)
    std::array<int, 5> arr2 = {1, 2, 3, 4, 5};
    
    // Partial initialization
    std::array<int, 5> arr3 = {1, 2};  // {1, 2, 0, 0, 0}
    
    // Copy construction
    std::array<int, 5> arr4(arr2);
    
    // Aggregate initialization
    std::array<int, 5> arr5{10, 20, 30, 40, 50};
    
    // Access elements
    arr2[0] = 10;        // Random access
    int first = arr2.front();  // First element
    int last = arr2.back();     // Last element
    
    // Iterate
    for (const auto& elem : arr2) {
        std::cout << elem << " ";
    }
}
```

### Key Characteristics

- **Fixed size**: Size must be known at compile time
- **Stack-allocated**: No dynamic memory allocation
- **STL interface**: Provides iterators, algorithms, etc.
- **Zero overhead**: Same performance as C-style arrays
- **Type safety**: Better than C-style arrays
- **Contiguous storage**: Elements stored contiguously in memory

---

## Element Access Methods

### Random Access

```cpp
std::array<int, 5> arr = {1, 2, 3, 4, 5};

// operator[] - No bounds checking
int elem = arr[2];      // Returns 3
arr[2] = 99;            // Modify element

// at() - Bounds checking
try {
    int elem = arr.at(2);        // Returns 3
    int invalid = arr.at(10);    // Throws std::out_of_range
} catch (const std::out_of_range& e) {
    std::cout << "Index out of range" << std::endl;
}
```

### Front and Back Access

```cpp
std::array<int, 5> arr = {1, 2, 3, 4, 5};

// front() - First element
int first = arr.front();  // Returns 1
arr.front() = 10;          // Modify first element

// back() - Last element
int last = arr.back();     // Returns 5
arr.back() = 50;           // Modify last element
```

### Data Access

```cpp
std::array<int, 5> arr = {1, 2, 3, 4, 5};

// data() - Get pointer to underlying array
int* ptr = arr.data();
ptr[0] = 100;  // Modify via pointer

// Can be used with C-style functions
void c_function(int* arr, size_t size);
c_function(arr.data(), arr.size());
```

---

## Modifiers

### Fill and Swap

```cpp
std::array<int, 5> arr = {1, 2, 3, 4, 5};

// fill() - Fill all elements with value
arr.fill(99);
// Result: {99, 99, 99, 99, 99}

// swap() - Exchange contents
std::array<int, 5> arr1 = {1, 2, 3, 4, 5};
std::array<int, 5> arr2 = {10, 20, 30, 40, 50};
arr1.swap(arr2);
// arr1: {10, 20, 30, 40, 50}
// arr2: {1, 2, 3, 4, 5}
```

⚠️ **Note**: `std::array` has a fixed size, so there are no `push_back()`, `pop_back()`, `insert()`, or `erase()` methods.

---

## Iterator Methods

```cpp
std::array<int, 5> arr = {1, 2, 3, 4, 5};

// Forward iteration
for (auto it = arr.begin(); it != arr.end(); ++it) {
    std::cout << *it << " ";
}

// Reverse iteration
for (auto it = arr.rbegin(); it != arr.rend(); ++it) {
    std::cout << *it << " ";
}

// Range-based for loop (C++11)
for (const auto& elem : arr) {
    std::cout << elem << " ";
}

// Const iterators
for (auto it = arr.cbegin(); it != arr.cend(); ++it) {
    // *it is const
}

// Random access iterators
auto it = arr.begin();
it += 3;        // Move 3 positions forward
int value = *it;  // Access element
```

---

## Operations

### Size and Capacity

```cpp
std::array<int, 5> arr = {1, 2, 3, 4, 5};

// size() - Number of elements
size_t size = arr.size();  // Returns 5

// empty() - Check if empty (always false for non-zero size)
bool is_empty = arr.empty();  // Returns false

// max_size() - Maximum possible size
size_t max = arr.max_size();  // Returns 5 (same as size)
```

### Comparison Operations

```cpp
std::array<int, 3> arr1 = {1, 2, 3};
std::array<int, 3> arr2 = {1, 2, 3};
std::array<int, 3> arr3 = {4, 5, 6};

// Equality
bool equal = (arr1 == arr2);  // true

// Inequality
bool not_equal = (arr1 != arr3);  // true

// Lexicographic comparison
bool less = (arr1 < arr3);     // true
bool greater = (arr3 > arr1);  // true
```

### STL Algorithms

```cpp
#include <algorithm>
#include <numeric>

std::array<int, 5> arr = {5, 2, 8, 1, 9};

// Sort
std::sort(arr.begin(), arr.end());
// Result: {1, 2, 5, 8, 9}

// Find
auto it = std::find(arr.begin(), arr.end(), 5);
if (it != arr.end()) {
    std::cout << "Found at index: " << std::distance(arr.begin(), it) << std::endl;
}

// Accumulate
int sum = std::accumulate(arr.begin(), arr.end(), 0);
// Sum: 25

// Count
int count = std::count(arr.begin(), arr.end(), 5);
// Count: 1

// Transform
std::array<int, 5> doubled;
std::transform(arr.begin(), arr.end(), doubled.begin(),
               [](int x) { return x * 2; });
// doubled: {2, 4, 10, 16, 18}
```

---

## Common Use Cases

### 1. Fixed-Size Buffer

```cpp
constexpr size_t BUFFER_SIZE = 1024;
std::array<char, BUFFER_SIZE> buffer;

// Fill buffer
buffer.fill(0);

// Use with C-style functions
void process_buffer(char* data, size_t size);
process_buffer(buffer.data(), buffer.size());
```

### 2. Lookup Tables

```cpp
// Days in each month
std::array<int, 12> days_in_month = {
    31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
};

int month = 2;  // February
int days = days_in_month[month - 1];  // 28
```

### 3. Matrix/Grid

```cpp
constexpr size_t ROWS = 3;
constexpr size_t COLS = 3;
std::array<std::array<int, COLS>, ROWS> matrix = {{
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
}};

// Access element
int value = matrix[1][2];  // 6

// Iterate
for (const auto& row : matrix) {
    for (int elem : row) {
        std::cout << elem << " ";
    }
    std::cout << std::endl;
}
```

### 4. Return Fixed-Size Array from Function

```cpp
std::array<int, 3> get_coordinates() {
    return {10, 20, 30};
}

auto coords = get_coordinates();
// coords: {10, 20, 30}
```

### 5. Template Parameters

```cpp
template<size_t N>
void process_array(const std::array<int, N>& arr) {
    for (int elem : arr) {
        // Process element
    }
}

std::array<int, 5> arr = {1, 2, 3, 4, 5};
process_array(arr);  // N = 5
```

### 6. Stack-Allocated Container

```cpp
// No heap allocation
std::array<int, 1000> large_array;
// Allocated on stack (if stack is large enough)

// vs std::vector (heap allocation)
std::vector<int> vec(1000);  // Heap allocated
```

---

## Runtime Complexity Analysis

Understanding the time and space complexity of `std::array` operations is crucial for performance optimization.

### Time Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|------|
| **Element Access** |
| `operator[]`, `at()` | O(1) | Random access |
| `front()`, `back()` | O(1) | Direct access to first/last |
| `data()` | O(1) | Returns pointer |
| **Iterators** |
| `begin()`, `end()`, `rbegin()`, `rend()` | O(1) | Iterator creation |
| **Modifiers** |
| `fill()` | O(n) | n = array size |
| `swap()` | O(n) | Swaps all elements |
| **Operations** |
| `size()`, `empty()`, `max_size()` | O(1) | Constant time |
| **Comparison** |
| `==`, `!=`, `<`, `>`, `<=`, `>=` | O(n) | Element-wise comparison |

### Space Complexity

- **Storage**: O(n) where n is the compile-time size
- **Overhead**: Minimal (just the array itself)
- **Total**: Exactly `sizeof(T) * N` bytes (no overhead)

### Memory Characteristics

`std::array` is **stack-allocated**:

- **No dynamic allocation**: All memory allocated on stack
- **Contiguous storage**: Elements stored contiguously
- **Fixed size**: Size known at compile time
- **Zero overhead**: Same memory layout as C-style array

### Comparison with Other Containers

| Feature | `std::array` | `std::vector` | C-style array |
|---------|--------------|---------------|---------------|
| Size | Fixed (compile-time) | Dynamic | Fixed (compile-time) |
| Allocation | Stack | Heap | Stack |
| STL interface | ✅ Yes | ✅ Yes | ❌ No |
| Bounds checking | ✅ `at()` | ✅ `at()` | ❌ No |
| Iterators | ✅ Yes | ✅ Yes | ❌ No |
| Algorithms | ✅ Yes | ✅ Yes | ⚠️ With pointers |
| Type safety | ✅ Yes | ✅ Yes | ❌ No |
| Overhead | Zero | Small | Zero |

### Performance Tips Based on Complexity

1. **Use for fixed-size data** → No dynamic allocation overhead
2. **Stack allocation** → Faster than heap allocation
3. **Cache-friendly** → Contiguous memory layout
4. **Zero overhead** → Same performance as C-style arrays
5. **Use with STL algorithms** → Full STL support
6. **Template-friendly** → Size as template parameter

### When to Use `std::array`

✅ **Use `std::array` when:**
- Size is known at compile time
- Stack allocation is acceptable
- Need STL interface with zero overhead
- Want type safety over C-style arrays
- Fixed-size buffers or lookup tables
- Template metaprogramming

❌ **Avoid `std::array` when:**
- Size is not known at compile time → Use `std::vector`
- Size is very large → Stack may overflow, use `std::vector`
- Need dynamic resizing → Use `std::vector`
- Need to grow/shrink → Use `std::vector`

---

## Best Practices

### ✅ Do's

1. **Use for fixed-size data**
   ```cpp
   constexpr size_t SIZE = 10;
   std::array<int, SIZE> arr;
   ```

2. **Use `at()` for bounds checking**
   ```cpp
   try {
       int value = arr.at(5);  // Bounds checked
   } catch (const std::out_of_range&) {
       // Handle error
   }
   ```

3. **Use with STL algorithms**
   ```cpp
   std::sort(arr.begin(), arr.end());
   std::find(arr.begin(), arr.end(), value);
   ```

4. **Use `data()` for C interop**
   ```cpp
   void c_function(int* arr, size_t size);
   c_function(arr.data(), arr.size());
   ```

5. **Use structured bindings (C++17)**
   ```cpp
   std::array<int, 3> coords = {10, 20, 30};
   auto [x, y, z] = coords;
   ```

### ❌ Don'ts

1. **Don't use for dynamic size**
   ```cpp
   // ❌ Size must be compile-time constant
   int n = 10;
   std::array<int, n> arr;  // Compilation error
   
   // ✅ Use vector
   std::vector<int> vec(n);
   ```

2. **Don't use for very large arrays**
   ```cpp
   // ❌ May cause stack overflow
   std::array<int, 1000000> large;  // Stack overflow risk
   
   // ✅ Use vector (heap allocated)
   std::vector<int> large(1000000);
   ```

3. **Don't ignore stack limitations**
   ```cpp
   // ⚠️ Be careful with large stack-allocated arrays
   std::array<int, 10000> arr;  // ~40KB on stack
   ```

4. **Don't use C-style arrays when `std::array` works**
   ```cpp
   // ❌ Less type-safe
   int arr[5];
   
   // ✅ Better type safety and STL support
   std::array<int, 5> arr;
   ```

### Performance Tips

- **Zero overhead**: Same performance as C-style arrays
- **Stack allocation**: Faster than heap allocation
- **Cache-friendly**: Contiguous memory layout
- **STL algorithms**: Full support for STL algorithms
- **Template-friendly**: Size as template parameter enables optimizations

### Comparison with C-Style Arrays

```cpp
// C-style array
int c_array[5] = {1, 2, 3, 4, 5};
// No bounds checking
// No iterators
// No STL algorithms (directly)
// Size lost in function parameters

// std::array
std::array<int, 5> stl_array = {1, 2, 3, 4, 5};
// Bounds checking with at()
// Iterators available
// STL algorithms work directly
// Size preserved in type
```

---

**Summary**: `std::array` provides a fixed-size, stack-allocated container with STL interface and zero overhead. Use it when size is known at compile time and you need the benefits of STL with the performance of C-style arrays. For dynamic sizing, use `std::vector` instead.

