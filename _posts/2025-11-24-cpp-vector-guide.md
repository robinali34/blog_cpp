---
layout: post
title: "C++ std::vector Guide: Common Methods and Usage Patterns"
date: 2025-11-24 00:00:00 -0700
categories: cpp stl containers vector
permalink: /2025/11/24/cpp-vector-guide/
tags: [cpp, vector, stl, containers, array, dynamic-array, performance]
---

# C++ std::vector Guide: Common Methods and Usage Patterns

A comprehensive guide to `std::vector`, the most commonly used C++ container, covering all essential methods, common use cases, and best practices.

## Table of Contents

1. [Vector Basics](#vector-basics)
2. [Element Access Methods](#element-access-methods)
3. [Modifiers](#modifiers)
4. [Capacity Methods](#capacity-methods)
5. [Iterator Methods](#iterator-methods)
6. [Common Use Cases](#common-use-cases)
7. [Performance Considerations](#performance-considerations)
8. [Best Practices](#best-practices)

---

## Vector Basics

`std::vector` is a dynamic array that automatically manages memory, grows as needed, and provides random access to elements.

```cpp
#include <vector>
#include <iostream>

int main() {
    // Default construction
    std::vector<int> vec1;
    
    // Construction with size
    std::vector<int> vec2(5);  // 5 elements, all initialized to 0
    
    // Construction with size and initial value
    std::vector<int> vec3(5, 10);  // 5 elements, all set to 10
    
    // Initializer list (C++11)
    std::vector<int> vec4 = {1, 2, 3, 4, 5};
    
    // Copy construction
    std::vector<int> vec5(vec4);
    
    // Range construction
    int arr[] = {1, 2, 3, 4, 5};
    std::vector<int> vec6(arr, arr + 5);
}
```

---

## Element Access Methods

### `operator[]` - Subscript Access

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Access element (no bounds checking)
    int first = vec[0];      // 1
    int third = vec[2];      // 3
    int last = vec[4];       // 5
    
    // Modify element
    vec[0] = 10;             // vec now: {10, 2, 3, 4, 5}
    
    // ⚠️ No bounds checking - undefined behavior if out of range
    // int x = vec[10];      // Undefined behavior!
}
```

### `at()` - Bounds-Checked Access

```cpp
#include <vector>
#include <stdexcept>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Access with bounds checking
    int first = vec.at(0);   // 1
    
    // Throws std::out_of_range if out of bounds
    try {
        int x = vec.at(10);  // Throws exception
    } catch (const std::out_of_range& e) {
        std::cout << "Out of range: " << e.what() << std::endl;
    }
}
```

### `front()` - First Element

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Get first element
    int first = vec.front();  // 1
    
    // Modify first element
    vec.front() = 10;         // vec now: {10, 2, 3, 4, 5}
    
    // ⚠️ Undefined behavior if vector is empty
    std::vector<int> empty;
    // int x = empty.front();  // Undefined behavior!
}
```

### `back()` - Last Element

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Get last element
    int last = vec.back();   // 5
    
    // Modify last element
    vec.back() = 50;         // vec now: {1, 2, 3, 4, 50}
    
    // ⚠️ Undefined behavior if vector is empty
    std::vector<int> empty;
    // int x = empty.back();   // Undefined behavior!
}
```

**Note**: `std::vector` does not have a `top()` method. `top()` is used with `std::stack`. For `std::vector`, use `back()` to access the last element.

### `data()` - Raw Pointer Access

```cpp
#include <vector>
#include <cstring>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Get pointer to underlying array
    int* ptr = vec.data();
    
    // Access elements through pointer
    std::cout << ptr[0] << std::endl;  // 1
    std::cout << ptr[2] << std::endl;  // 3
    
    // Useful for C-style APIs
    void processArray(int* arr, size_t size);
    processArray(vec.data(), vec.size());
}
```

---

## Modifiers

### `push_back()` - Add Element at End

```cpp
#include <vector>

int main() {
    std::vector<int> vec;
    
    // Add elements to the end
    vec.push_back(1);  // vec: {1}
    vec.push_back(2);  // vec: {1, 2}
    vec.push_back(3);  // vec: {1, 2, 3}
    
    // Efficient for adding single elements
    for (int i = 4; i <= 10; ++i) {
        vec.push_back(i);
    }
    // vec: {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
}
```

### `pop_back()` - Remove Last Element

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Remove last element
    vec.pop_back();  // vec now: {1, 2, 3, 4}
    vec.pop_back();  // vec now: {1, 2, 3}
    
    // ⚠️ Undefined behavior if vector is empty
    std::vector<int> empty;
    // empty.pop_back();  // Undefined behavior!
    
    // Safe way
    if (!vec.empty()) {
        vec.pop_back();
    }
}
```

### `insert()` - Insert Elements

```cpp
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 4, 5};
    
    // Insert single element before iterator position
    auto it = std::find(vec.begin(), vec.end(), 4);
    vec.insert(it, 3);  // vec: {1, 2, 3, 4, 5}
    
    // Insert multiple copies
    vec.insert(vec.begin() + 2, 3, 99);  
    // vec: {1, 2, 99, 99, 99, 3, 4, 5}
    
    // Insert from range
    std::vector<int> other = {10, 20, 30};
    vec.insert(vec.end(), other.begin(), other.end());
    // vec: {1, 2, 99, 99, 99, 3, 4, 5, 10, 20, 30}
    
    // Insert from initializer list (C++11)
    vec.insert(vec.begin(), {0, -1, -2});
    // vec: {-2, -1, 0, 1, 2, 99, 99, 99, 3, 4, 5, 10, 20, 30}
}
```

### `emplace_back()` - Construct in Place (C++11)

```cpp
#include <vector>
#include <string>

struct Person {
    std::string name;
    int age;
    
    Person(const std::string& n, int a) : name(n), age(a) {
        std::cout << "Constructed: " << name << std::endl;
    }
};

int main() {
    std::vector<Person> people;
    
    // push_back: creates temporary, then copies/moves
    people.push_back(Person("Alice", 25));
    // Output: Constructed: Alice (temporary)
    //         (then copy/move into vector)
    
    // emplace_back: constructs directly in vector
    people.emplace_back("Bob", 30);
    // Output: Constructed: Bob (directly in vector)
    // More efficient - avoids temporary object
}
```

### `erase()` - Remove Elements

```cpp
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8};
    
    // Erase single element (returns iterator to next element)
    auto it = vec.begin() + 2;
    it = vec.erase(it);  // Erase 3, it now points to 4
    // vec: {1, 2, 4, 5, 6, 7, 8}
    
    // Erase range
    vec.erase(vec.begin() + 1, vec.begin() + 3);
    // vec: {1, 5, 6, 7, 8}
    
    // Erase by value (common pattern)
    vec.erase(std::remove(vec.begin(), vec.end(), 6), vec.end());
    // vec: {1, 5, 7, 8}
    
    // Erase all elements matching condition
    vec.erase(std::remove_if(vec.begin(), vec.end(),
                             [](int x) { return x % 2 == 0; }),
              vec.end());
    // vec: {1, 5, 7} (removed even numbers)
}
```

### `clear()` - Remove All Elements

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    vec.clear();  // Remove all elements
    // vec is now empty, but capacity may remain
    
    std::cout << vec.size() << std::endl;      // 0
    std::cout << vec.empty() << std::endl;     // true (1)
    // Capacity might still be > 0
}
```

### `swap()` - Exchange Contents

```cpp
#include <vector>

int main() {
    std::vector<int> vec1 = {1, 2, 3};
    std::vector<int> vec2 = {4, 5, 6, 7};
    
    vec1.swap(vec2);
    // vec1: {4, 5, 6, 7}
    // vec2: {1, 2, 3}
    
    // Also works with std::swap
    std::swap(vec1, vec2);
    // vec1: {1, 2, 3}
    // vec2: {4, 5, 6, 7}
}
```

### `assign()` - Replace Contents

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3};
    
    // Assign from count and value
    vec.assign(5, 10);  // vec: {10, 10, 10, 10, 10}
    
    // Assign from range
    std::vector<int> other = {1, 2, 3, 4, 5};
    vec.assign(other.begin(), other.end());
    // vec: {1, 2, 3, 4, 5}
    
    // Assign from initializer list
    vec.assign({20, 30, 40});
    // vec: {20, 30, 40}
}
```

---

## Capacity Methods

### `size()` - Number of Elements

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    std::cout << vec.size() << std::endl;  // 5
    
    // Check if empty
    if (vec.size() == 0) {
        // Vector is empty
    }
}
```

### `empty()` - Check if Empty

```cpp
#include <vector>

int main() {
    std::vector<int> vec;
    
    if (vec.empty()) {
        std::cout << "Vector is empty" << std::endl;
    }
    
    vec.push_back(1);
    
    if (!vec.empty()) {
        std::cout << "Vector has " << vec.size() << " elements" << std::endl;
    }
}
```

### `capacity()` - Current Capacity

```cpp
#include <vector>

int main() {
    std::vector<int> vec;
    
    std::cout << "Initial capacity: " << vec.capacity() << std::endl;
    
    // Capacity grows automatically
    for (int i = 0; i < 10; ++i) {
        vec.push_back(i);
        std::cout << "Size: " << vec.size() 
                  << ", Capacity: " << vec.capacity() << std::endl;
    }
    
    // Typical output:
    // Size: 1, Capacity: 1
    // Size: 2, Capacity: 2
    // Size: 3, Capacity: 4  (doubled)
    // Size: 5, Capacity: 8  (doubled)
    // ...
}
```

### `reserve()` - Reserve Capacity

```cpp
#include <vector>

int main() {
    std::vector<int> vec;
    
    // Reserve space to avoid reallocations
    vec.reserve(100);
    std::cout << "Capacity: " << vec.capacity() << std::endl;  // >= 100
    std::cout << "Size: " << vec.size() << std::endl;          // 0
    
    // Now push_back operations won't cause reallocation
    for (int i = 0; i < 100; ++i) {
        vec.push_back(i);  // No reallocation
    }
    
    // ⚠️ reserve() doesn't change size, only capacity
}
```

### `resize()` - Change Size

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3};
    
    // Resize to larger size (new elements default-constructed)
    vec.resize(5);
    // vec: {1, 2, 3, 0, 0}
    
    // Resize with value
    vec.resize(7, 99);
    // vec: {1, 2, 3, 0, 0, 99, 99}
    
    // Resize to smaller size (elements removed)
    vec.resize(3);
    // vec: {1, 2, 3}
    
    // ⚠️ resize() changes both size and capacity if needed
}
```

### `shrink_to_fit()` - Reduce Capacity (C++11)

```cpp
#include <vector>

int main() {
    std::vector<int> vec;
    vec.reserve(100);
    vec = {1, 2, 3};
    
    std::cout << "Size: " << vec.size() << std::endl;        // 3
    std::cout << "Capacity: " << vec.capacity() << std::endl;  // >= 100
    
    // Request capacity reduction (non-binding)
    vec.shrink_to_fit();
    
    std::cout << "Capacity after shrink: " << vec.capacity() << std::endl;
    // May be reduced to match size (implementation-dependent)
}
```

---

## Iterator Methods

### `begin()` / `end()` - Iterators

```cpp
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Forward iteration
    for (auto it = vec.begin(); it != vec.end(); ++it) {
        std::cout << *it << " ";
    }
    // Output: 1 2 3 4 5
    
    // Use with algorithms
    auto it = std::find(vec.begin(), vec.end(), 3);
    if (it != vec.end()) {
        std::cout << "Found: " << *it << std::endl;
    }
}
```

### `cbegin()` / `cend()` - Const Iterators

```cpp
#include <vector>

int main() {
    const std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Const iterators (read-only)
    for (auto it = vec.cbegin(); it != vec.cend(); ++it) {
        std::cout << *it << " ";
        // *it = 10;  // Error: cannot modify through const iterator
    }
}
```

### `rbegin()` / `rend()` - Reverse Iterators

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Reverse iteration
    for (auto it = vec.rbegin(); it != vec.rend(); ++it) {
        std::cout << *it << " ";
    }
    // Output: 5 4 3 2 1
}
```

---

## Common Use Cases

### 1. Stack-like Operations

```cpp
#include <vector>

class IntStack {
private:
    std::vector<int> data;
    
public:
    void push(int value) {
        data.push_back(value);  // Like stack::push()
    }
    
    void pop() {
        if (!data.empty()) {
            data.pop_back();  // Like stack::pop()
        }
    }
    
    int top() const {
        return data.back();  // Like stack::top()
    }
    
    bool empty() const {
        return data.empty();
    }
    
    size_t size() const {
        return data.size();
    }
};

int main() {
    IntStack stack;
    stack.push(1);
    stack.push(2);
    stack.push(3);
    
    std::cout << stack.top() << std::endl;  // 3
    stack.pop();
    std::cout << stack.top() << std::endl;  // 2
}
```

### 2. Dynamic Array with Pre-allocation

```cpp
#include <vector>
#include <chrono>

void process_without_reserve() {
    std::vector<int> vec;
    
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 1000000; ++i) {
        vec.push_back(i);  // May cause multiple reallocations
    }
    auto end = std::chrono::high_resolution_clock::now();
    // Slower due to reallocations
}

void process_with_reserve() {
    std::vector<int> vec;
    vec.reserve(1000000);  // Pre-allocate
    
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 1000000; ++i) {
        vec.push_back(i);  // No reallocations
    }
    auto end = std::chrono::high_resolution_clock::now();
    // Faster - no reallocations
}
```

### 3. Two-Dimensional Vector

```cpp
#include <vector>

int main() {
    // 2D vector (matrix)
    std::vector<std::vector<int>> matrix;
    
    // Initialize 3x4 matrix
    matrix.resize(3);
    for (auto& row : matrix) {
        row.resize(4, 0);  // 4 columns, initialized to 0
    }
    
    // Access elements
    matrix[0][0] = 1;
    matrix[1][2] = 5;
    
    // Or initialize directly
    std::vector<std::vector<int>> matrix2 = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };
}
```

### 4. Removing Elements by Condition

```cpp
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    
    // Remove all even numbers (erase-remove idiom)
    vec.erase(std::remove_if(vec.begin(), vec.end(),
                              [](int x) { return x % 2 == 0; }),
              vec.end());
    // vec: {1, 3, 5, 7, 9}
    
    // Remove specific value
    vec.erase(std::remove(vec.begin(), vec.end(), 5), vec.end());
    // vec: {1, 3, 7, 9}
}
```

### 5. Vector as Buffer

```cpp
#include <vector>
#include <cstring>

void processBuffer(const char* data, size_t size) {
    // Copy data into vector
    std::vector<char> buffer(data, data + size);
    
    // Process buffer
    for (auto& byte : buffer) {
        byte ^= 0xFF;  // Invert bits
    }
    
    // Use buffer.data() for C-style APIs
    writeToFile(buffer.data(), buffer.size());
}
```

---

## Performance Considerations

### 1. Reallocation Strategy

```cpp
#include <vector>

int main() {
    std::vector<int> vec;
    
    // Typical growth strategy: exponential (usually 2x)
    // Size 1 -> Capacity 1
    // Size 2 -> Capacity 2
    // Size 3 -> Capacity 4  (reallocation)
    // Size 5 -> Capacity 8  (reallocation)
    // Size 9 -> Capacity 16 (reallocation)
    
    // Use reserve() if you know approximate size
    vec.reserve(1000);  // Avoids multiple reallocations
}
```

### 2. Iterator Invalidation

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    auto it = vec.begin() + 2;  // Points to 3
    
    // Operations that invalidate iterators:
    
    // push_back() - may invalidate all iterators if reallocation occurs
    vec.push_back(6);  // ⚠️ it may be invalidated
    
    // insert() - invalidates iterators at and after insertion point
    vec.insert(vec.begin() + 1, 99);  // ⚠️ it invalidated
    
    // erase() - invalidates iterators at and after erasure point
    vec.erase(vec.begin());  // ⚠️ it invalidated
    
    // resize() - may invalidate all iterators if reallocation occurs
    vec.resize(100);  // ⚠️ it may be invalidated
}
```

### 3. Memory Layout

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Elements are stored contiguously in memory
    // Memory layout: [1][2][3][4][5]
    // This enables:
    // - Cache-friendly access
    // - Pointer arithmetic
    // - Efficient iteration
    
    int* ptr = vec.data();
    // Can use pointer arithmetic
    ptr[0] = 10;
    ptr[2] = 30;
}
```

---

## Best Practices

### ✅ Do's

1. **Use `reserve()` when you know the approximate size**
   ```cpp
   std::vector<int> vec;
   vec.reserve(1000);  // Prevents reallocations
   ```

2. **Prefer `emplace_back()` over `push_back()` for complex types**
   ```cpp
   vec.emplace_back("name", 25);  // More efficient
   // vs
   vec.push_back(Person("name", 25));  // Creates temporary
   ```

3. **Use `empty()` instead of `size() == 0`**
   ```cpp
   if (vec.empty()) { }  // Clearer intent
   ```

4. **Use range-based for loops when possible**
   ```cpp
   for (const auto& elem : vec) { }  // Modern, safe
   ```

5. **Check bounds or use `at()` for safety**
   ```cpp
   if (index < vec.size()) {
       int value = vec[index];
   }
   // Or
   try {
       int value = vec.at(index);
   } catch (const std::out_of_range&) { }
   ```

### ⚠️ Don'ts

1. **Don't use `operator[]` without bounds checking**
   ```cpp
   // ⚠️ Bad
   int x = vec[100];  // Undefined behavior if out of range
   
   // ✅ Good
   if (100 < vec.size()) {
       int x = vec[100];
   }
   ```

2. **Don't store iterators across reallocations**
   ```cpp
   auto it = vec.begin();
   vec.push_back(1);  // May reallocate
   // ⚠️ it may be invalidated
   ```

3. **Don't use `pop_back()` on empty vector**
   ```cpp
   std::vector<int> vec;
   // ⚠️ vec.pop_back();  // Undefined behavior
   
   // ✅ Good
   if (!vec.empty()) {
       vec.pop_back();
   }
   ```

4. **Don't use `front()` or `back()` on empty vector**
   ```cpp
   std::vector<int> vec;
   // ⚠️ int x = vec.front();  // Undefined behavior
   // ⚠️ int y = vec.back();   // Undefined behavior
   ```

5. **Don't mix `size()` and `capacity()`**
   ```cpp
   vec.reserve(100);  // Changes capacity, not size
   // vec.size() is still 0!
   ```

### Performance Tips

1. **Prefer `reserve()` over `resize()` when you only need capacity**
   ```cpp
   vec.reserve(100);  // Only allocates memory
   // vs
   vec.resize(100);   // Allocates and constructs 100 elements
   ```

2. **Use `shrink_to_fit()` sparingly** - it's a request, not a guarantee
3. **Consider `std::array` for fixed-size arrays** - no dynamic allocation overhead
4. **Use move semantics when transferring ownership**
   ```cpp
   std::vector<int> vec1 = {1, 2, 3};
   std::vector<int> vec2 = std::move(vec1);  // Efficient transfer
   ```

---

## Summary

`std::vector` is the workhorse of C++ containers. Key takeaways:

- **Element access**: `operator[]`, `at()`, `front()`, `back()`, `data()`
- **Modifiers**: `push_back()`, `pop_back()`, `insert()`, `erase()`, `clear()`, `swap()`
- **Capacity**: `size()`, `empty()`, `capacity()`, `reserve()`, `resize()`, `shrink_to_fit()`
- **Iterators**: `begin()`, `end()`, `rbegin()`, `rend()`, and const variants
- **Performance**: Use `reserve()` to avoid reallocations, prefer `emplace_back()` for complex types
- **Safety**: Always check bounds or use `at()`, verify `empty()` before `pop_back()`, `front()`, or `back()`

Mastering `std::vector` is essential for effective C++ programming!

