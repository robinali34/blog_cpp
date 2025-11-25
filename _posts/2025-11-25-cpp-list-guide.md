---
layout: post
title: "C++ std::list Guide: Doubly-Linked List Container"
date: 2025-11-25 00:00:00 -0700
categories: cpp stl containers list
permalink: /2025/11/25/cpp-list-guide/
tags: [cpp, list, stl, containers, linked-list, doubly-linked-list, sequence-container]
---

# C++ std::list Guide: Doubly-Linked List Container

A comprehensive guide to `std::list`, a doubly-linked list container that provides efficient insertion and deletion at any position, covering all essential methods, common use cases, and best practices.

## Table of Contents

1. [List Basics](#list-basics)
2. [Element Access Methods](#element-access-methods)
3. [Modifiers](#modifiers)
4. [Operations](#operations)
5. [Iterator Methods](#iterator-methods)
6. [Common Use Cases](#common-use-cases)
7. [Runtime Complexity Analysis](#runtime-complexity-analysis)
8. [Best Practices](#best-practices)

---

## List Basics

`std::list` is a doubly-linked list container that provides efficient insertion and deletion at any position. Unlike `std::vector`, it doesn't provide random access but excels at insertion/deletion operations.

```cpp
#include <list>
#include <iostream>

int main() {
    // Default construction
    std::list<int> list1;
    
    // Construction with size
    std::list<int> list2(5);  // 5 elements, all initialized to 0
    
    // Construction with size and initial value
    std::list<int> list3(5, 10);  // 5 elements, all set to 10
    
    // Initializer list (C++11)
    std::list<int> list4 = {1, 2, 3, 4, 5};
    
    // Copy construction
    std::list<int> list5(list4);
    
    // Range construction
    std::vector<int> vec = {1, 2, 3};
    std::list<int> list6(vec.begin(), vec.end());
    
    // Iterate
    for (const auto& elem : list4) {
        std::cout << elem << " ";
    }
}
```

### Key Characteristics

- **Doubly-linked**: Each element has pointers to next and previous
- **No random access**: Cannot use `operator[]` or `at()`
- **Efficient insertion/deletion**: O(1) at any position (given iterator)
- **Stable iterators**: Iterators remain valid unless element is erased
- **Splice operations**: Efficient transfer of elements between lists

---

## Element Access Methods

### `front()` and `back()` - Access First and Last

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

int first = lst.front();  // Returns 1
int last = lst.back();    // Returns 5

// Modify
lst.front() = 10;  // First element is now 10
lst.back() = 50;   // Last element is now 50
```

⚠️ **Note**: `front()` and `back()` are undefined if list is empty. Always check `empty()` first.

### Iterator-Based Access

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

// Access via iterator
auto it = lst.begin();
int first = *it;  // 1

// Advance iterator
std::advance(it, 2);  // Move 2 positions forward
int third = *it;  // 3

// No random access - this doesn't work:
// int x = lst[2];  // ❌ Compilation error
```

---

## Modifiers

### Insertion

```cpp
std::list<int> lst = {1, 2, 3};

// push_front() - Insert at beginning
lst.push_front(0);  // {0, 1, 2, 3}

// push_back() - Insert at end
lst.push_back(4);   // {0, 1, 2, 3, 4}

// insert() - Insert at position
auto it = lst.begin();
std::advance(it, 2);
lst.insert(it, 99);  // Insert 99 before position 2
// Result: {0, 1, 99, 2, 3, 4}

// insert() with count
lst.insert(it, 3, 88);  // Insert 3 copies of 88

// insert() with range
std::vector<int> vec = {10, 20};
lst.insert(it, vec.begin(), vec.end());

// emplace_front() - Construct at front (C++11)
lst.emplace_front(100);

// emplace_back() - Construct at back (C++11)
lst.emplace_back(200);

// emplace() - Construct at position (C++11)
lst.emplace(it, 300);
```

### Erasure

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

// pop_front() - Remove first element
lst.pop_front();  // {2, 3, 4, 5}

// pop_back() - Remove last element
lst.pop_back();   // {2, 3, 4}

// erase() - Remove by iterator
auto it = lst.begin();
std::advance(it, 1);
it = lst.erase(it);  // Erase element at position, returns next iterator
// Result: {2, 4}

// erase() - Remove range
auto first = lst.begin();
auto last = lst.end();
lst.erase(first, last);  // Clear list

// remove() - Remove all elements with value
lst = {1, 2, 2, 3, 2, 4};
lst.remove(2);  // Remove all 2s
// Result: {1, 3, 4}

// remove_if() - Remove elements matching predicate
lst = {1, 2, 3, 4, 5};
lst.remove_if([](int n) { return n % 2 == 0; });  // Remove evens
// Result: {1, 3, 5}
```

### Modification

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

// clear() - Remove all elements
lst.clear();

// resize() - Change size
lst = {1, 2, 3};
lst.resize(5);      // {1, 2, 3, 0, 0} (default-constructed)
lst.resize(5, 99);   // {1, 2, 3, 99, 99} (with value)
lst.resize(2);       // {1, 2} (truncate)

// swap() - Exchange contents
std::list<int> lst1 = {1, 2, 3};
std::list<int> lst2 = {4, 5, 6};
lst1.swap(lst2);
// lst1: {4, 5, 6}, lst2: {1, 2, 3}
```

---

## Operations

### Splice - Transfer Elements

```cpp
std::list<int> lst1 = {1, 2, 3, 4, 5};
std::list<int> lst2 = {10, 20, 30};

// splice() - Transfer single element
auto it1 = lst1.begin();
std::advance(it1, 2);
lst1.splice(it1, lst2, lst2.begin());  // Transfer first element of lst2
// lst1: {1, 2, 10, 3, 4, 5}
// lst2: {20, 30}

// splice() - Transfer range
lst1.splice(lst1.end(), lst2, lst2.begin(), lst2.end());
// lst1: {1, 2, 10, 3, 4, 5, 20, 30}
// lst2: {}

// splice() - Transfer entire list
std::list<int> lst3 = {100, 200};
lst1.splice(lst1.begin(), lst3);
// lst1: {100, 200, 1, 2, 10, 3, 4, 5, 20, 30}
// lst3: {}
```

### Merge - Merge Sorted Lists

```cpp
std::list<int> lst1 = {1, 3, 5, 7};
std::list<int> lst2 = {2, 4, 6, 8};

// merge() - Merge sorted lists (both must be sorted)
lst1.merge(lst2);
// lst1: {1, 2, 3, 4, 5, 6, 7, 8}
// lst2: {} (empty after merge)

// With custom comparator
std::list<int> lst3 = {7, 5, 3, 1};  // Descending
std::list<int> lst4 = {8, 6, 4, 2};  // Descending
lst3.merge(lst4, std::greater<int>());
// lst3: {8, 7, 6, 5, 4, 3, 2, 1}
```

### Sort - Sort Elements

```cpp
std::list<int> lst = {5, 2, 8, 1, 9};

// sort() - Sort in ascending order
lst.sort();
// Result: {1, 2, 5, 8, 9}

// sort() with custom comparator
lst.sort(std::greater<int>());
// Result: {9, 8, 5, 2, 1}
```

### Reverse - Reverse Order

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

// reverse() - Reverse the list
lst.reverse();
// Result: {5, 4, 3, 2, 1}
```

### Unique - Remove Consecutive Duplicates

```cpp
std::list<int> lst = {1, 1, 2, 2, 3, 3, 3, 4};

// unique() - Remove consecutive duplicates
lst.unique();
// Result: {1, 2, 3, 4}

// unique() with predicate
std::list<int> lst2 = {1, 2, 3, 4, 5};
lst2.unique([](int a, int b) { return std::abs(a - b) <= 1; });
// Removes if difference <= 1
```

---

## Iterator Methods

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

// Forward iteration
for (auto it = lst.begin(); it != lst.end(); ++it) {
    std::cout << *it << " ";
}

// Reverse iteration
for (auto it = lst.rbegin(); it != lst.rend(); ++it) {
    std::cout << *it << " ";
}

// Range-based for loop (C++11)
for (const auto& elem : lst) {
    std::cout << elem << " ";
}

// Const iterators
for (auto it = lst.cbegin(); it != lst.cend(); ++it) {
    // *it is const
}

// Bidirectional iterators - can move forward and backward
auto it = lst.begin();
++it;  // Forward
--it;  // Backward
```

---

## Common Use Cases

### 1. Frequent Insertion/Deletion in Middle

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

// Efficient insertion in middle
auto it = lst.begin();
std::advance(it, 2);
lst.insert(it, 99);  // O(1) operation

// Efficient deletion
it = lst.begin();
std::advance(it, 1);
lst.erase(it);  // O(1) operation
```

### 2. Stable Iterators

```cpp
std::list<int> lst = {1, 2, 3, 4, 5};

auto it = lst.begin();
std::advance(it, 2);  // Points to 3

// Insert before iterator - iterator still valid
lst.insert(it, 99);
// lst: {1, 2, 99, 3, 4, 5}
// it still points to 3

// Erase other elements - iterator still valid
lst.erase(lst.begin());  // Erase first element
// it still points to 3
```

### 3. Splice Operations

```cpp
std::list<int> source = {10, 20, 30};
std::list<int> dest = {1, 2, 3};

// Efficiently transfer elements
dest.splice(dest.end(), source, source.begin(), source.end());
// dest: {1, 2, 3, 10, 20, 30}
// source: {}
```

### 4. Merge Sorted Lists

```cpp
std::list<int> list1 = {1, 3, 5};
std::list<int> list2 = {2, 4, 6};

// Efficient merge of sorted lists
list1.merge(list2);
// list1: {1, 2, 3, 4, 5, 6}
```

### 5. Remove Elements by Condition

```cpp
std::list<int> lst = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// Remove all even numbers
lst.remove_if([](int n) { return n % 2 == 0; });
// Result: {1, 3, 5, 7, 9}
```

---

## Runtime Complexity Analysis

Understanding the time and space complexity of `std::list` operations is crucial for choosing the right container.

### Time Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|------|
| **Element Access** |
| `front()`, `back()` | O(1) | Direct access to first/last |
| **Iterators** |
| `begin()`, `end()`, `rbegin()`, `rend()` | O(1) | Iterator creation |
| **Modifiers** |
| `push_front()`, `push_back()` | O(1) | Insert at beginning/end |
| `pop_front()`, `pop_back()` | O(1) | Remove from beginning/end |
| `insert()` (single element) | O(1) | Given iterator position |
| `insert()` (count) | O(n) | n = count |
| `insert()` (range) | O(m) | m = range size |
| `emplace_front()`, `emplace_back()` | O(1) | Construct at beginning/end |
| `emplace()` | O(1) | Construct at position |
| `erase()` (single element) | O(1) | Given iterator |
| `erase()` (range) | O(n) | n = range size |
| `remove()`, `remove_if()` | O(n) | n = list size |
| `clear()` | O(n) | Destroys all elements |
| `resize()` | O(n) | n = difference in size |
| `swap()` | O(1) | Constant time, swaps internal pointers |
| **Operations** |
| `sort()` | O(n log n) | Merge sort algorithm |
| `merge()` | O(n + m) | n = this size, m = other size |
| `reverse()` | O(n) | n = list size |
| `unique()` | O(n) | n = list size |
| `splice()` | O(1) or O(n) | O(1) for single element, O(n) for range |
| **Operations** |
| `size()`, `empty()`, `max_size()` | O(1) | Constant time |

### Space Complexity

- **Storage**: O(n) where n is the number of elements
- **Node overhead**: Each node stores value, next pointer, and previous pointer
- **Total**: Typically ~24-32 bytes per element on 64-bit systems (including pointers)

### Comparison with Other Containers

| Operation | `std::list` | `std::vector` | `std::deque` |
|-----------|-------------|---------------|--------------|
| Insert at beginning | O(1) | O(n) | O(1) |
| Insert at end | O(1) | O(1) amortized | O(1) |
| Insert in middle | O(1) | O(n) | O(n) |
| Erase at beginning | O(1) | O(n) | O(1) |
| Erase at end | O(1) | O(1) | O(1) |
| Erase in middle | O(1) | O(n) | O(n) |
| Random access | ❌ No | ✅ O(1) | ✅ O(1) |
| Iterator stability | ✅ Yes | ❌ No | ❌ No |

### Performance Tips Based on Complexity

1. **Use `std::list` for frequent middle insertions/deletions** → O(1) vs O(n) for vector
2. **Avoid random access** → Use iterators, but no `operator[]`
3. **Use `splice()` for efficient element transfer** → O(1) operation
4. **Prefer `std::vector` for random access** → O(1) vs no random access in list
5. **Use `merge()` for sorted lists** → O(n + m) vs manual merge
6. **Consider `std::deque` for both ends** → Similar performance, but with random access

### When to Use `std::list`

✅ **Use `std::list` when:**
- Frequent insertion/deletion in middle of container
- Stable iterators are required
- Splice operations are needed
- No random access needed
- Iterator invalidation is a concern

❌ **Avoid `std::list` when:**
- Random access is needed → Use `std::vector` or `std::deque`
- Cache performance matters → `std::vector` is cache-friendly
- Memory overhead is concern → `std::list` has higher overhead per element
- Simple sequential access → `std::vector` is usually faster

---

## Best Practices

### ✅ Do's

1. **Use iterators for access**
   ```cpp
   // ✅ Good
   auto it = lst.begin();
   std::advance(it, 2);
   int value = *it;
   ```

2. **Use `splice()` for efficient element transfer**
   ```cpp
   lst1.splice(lst1.end(), lst2);  // Efficient transfer
   ```

3. **Use `merge()` for sorted lists**
   ```cpp
   lst1.sort();
   lst2.sort();
   lst1.merge(lst2);  // Efficient merge
   ```

4. **Use `remove_if()` for conditional removal**
   ```cpp
   lst.remove_if([](int n) { return n % 2 == 0; });
   ```

5. **Check `empty()` before `front()`/`back()`**
   ```cpp
   if (!lst.empty()) {
       int first = lst.front();
   }
   ```

### ❌ Don'ts

1. **Don't use random access**
   ```cpp
   // ❌ Compilation error
   int x = lst[2];
   
   // ✅ Use iterator
   auto it = lst.begin();
   std::advance(it, 2);
   int x = *it;
   ```

2. **Don't use `std::list` when random access is needed**
   ```cpp
   // ❌ If random access needed
   std::list<int> lst;
   
   // ✅ Use vector or deque
   std::vector<int> vec;
   ```

3. **Don't ignore iterator invalidation in other containers**
   ```cpp
   // ⚠️ In vector, this invalidates iterators
   std::vector<int> vec = {1, 2, 3};
   auto it = vec.begin();
   vec.push_back(4);  // May invalidate it
   
   // ✅ In list, iterators remain valid
   std::list<int> lst = {1, 2, 3};
   auto it = lst.begin();
   lst.push_back(4);  // it still valid
   ```

4. **Don't use `std::list` for simple sequential access**
   ```cpp
   // ❌ Overhead not worth it for simple access
   std::list<int> lst = {1, 2, 3, 4, 5};
   for (int x : lst) { }  // Slower than vector
   
   // ✅ Use vector for better cache performance
   std::vector<int> vec = {1, 2, 3, 4, 5};
   for (int x : vec) { }  // Faster
   ```

### Performance Tips

- **Use for middle insertions**: `std::list` excels at O(1) middle insertions
- **Stable iterators**: Iterators remain valid unless element is erased
- **Splice operations**: Use `splice()` for efficient element transfer
- **Cache performance**: `std::vector` is more cache-friendly
- **Memory overhead**: `std::list` has higher overhead per element

---

**Summary**: `std::list` provides efficient O(1) insertion and deletion at any position with stable iterators. Use it when you need frequent middle insertions/deletions or stable iterators. For random access or cache performance, prefer `std::vector` or `std::deque`.

