---
layout: post
title: "C++ std::unordered_map Guide: Hash-Based Key-Value Container"
date: 2025-11-25 00:00:00 -0700
categories: cpp stl containers unordered-map
permalink: /2025/11/25/cpp-unordered-map-guide/
tags: [cpp, unordered_map, stl, containers, hash-table, key-value, associative-container]
---

# C++ std::unordered_map Guide: Hash-Based Key-Value Container

A comprehensive guide to `std::unordered_map`, a hash-based associative container that stores key-value pairs with average O(1) operations, covering all essential methods, common use cases, and best practices.

## Table of Contents

1. [Unordered Map Basics](#unordered-map-basics)
2. [Element Access Methods](#element-access-methods)
3. [Modifiers](#modifiers)
4. [Lookup Operations](#lookup-operations)
5. [Bucket Interface](#bucket-interface)
6. [Common Use Cases](#common-use-cases)
7. [Runtime Complexity Analysis](#runtime-complexity-analysis)
8. [Best Practices](#best-practices)

---

## Unordered Map Basics

`std::unordered_map` is a hash-based associative container that stores key-value pairs. It provides average O(1) operations for insert, find, and erase.

```cpp
#include <unordered_map>
#include <string>
#include <iostream>
using namespace std;

int main() {
    // Default construction
    unordered_map<string, int> map1;
    
    // Initializer list (C++11)
    unordered_map<string, int> map2 = {
        {"apple", 5},
        {"banana", 3},
        {"cherry", 8}
    };
    
    // Copy construction
    unordered_map<string, int> map3(map2);
    
    // Custom hash and equality
    struct MyHash {
        size_t operator()(const string& s) const {
            return hash<string>{}(s);
        }
    };
    unordered_map<string, int, MyHash> map4;
    
    // Access elements
    map2["apple"] = 10;  // Modify existing
    map2["date"] = 7;    // Insert new
    
    // Iterate (order is not guaranteed)
    for (const auto& [key, value] : map2) {
        cout << key << ": " << value << endl;
    }
}
```

### Key Characteristics

- **Hash-based**: Uses hash table for O(1) average operations
- **Unique keys**: Each key appears only once
- **Unordered**: Elements are not sorted (order is implementation-defined)
- **Fast operations**: Average O(1) for insert, find, erase
- **Load factor**: Automatically manages hash table load

---

## Element Access Methods

### `operator[]` - Access or Insert

```cpp
std::unordered_map<std::string, int> m;

// Access existing element
int count = m["apple"];  // Returns 0 if not found, inserts default value

// Insert new element
m["banana"] = 5;  // Inserts {"banana", 5}

// Modify existing
m["apple"] = 10;  // Updates value
```

⚠️ **Note**: `operator[]` inserts a default-constructed value if key doesn't exist. Use `at()` or `find()` to avoid this.

### `at()` - Bounds-Checked Access

```cpp
std::unordered_map<std::string, int> m = {{"apple", 5}};

try {
    int value = m.at("apple");   // Returns 5
    int missing = m.at("banana"); // Throws std::out_of_range
} catch (const std::out_of_range& e) {
    std::cout << "Key not found" << std::endl;
}
```

### `find()` - Safe Access

```cpp
std::unordered_map<std::string, int> m = {{"apple", 5}};

auto it = m.find("apple");
if (it != m.end()) {
    int value = it->second;  // Safe access
}
```

---

## Modifiers

### Insertion

```cpp
std::unordered_map<std::string, int> m;

// Method 1: operator[]
m["key"] = 42;

// Method 2: insert() with pair
m.insert({"key2", 100});
m.insert(std::make_pair("key3", 200));

// Method 3: insert() with hint (may improve performance)
auto hint = m.end();
m.insert(hint, {"key4", 300});

// Method 4: emplace() (C++11) - constructs in place
m.emplace("key5", 400);

// Method 5: emplace_hint() - with hint
m.emplace_hint(m.end(), "key6", 500);

// Check if insertion succeeded
auto [it, inserted] = m.insert({"key", 999});
if (!inserted) {
    std::cout << "Key already exists" << std::endl;
}
```

### Erasure

```cpp
std::unordered_map<std::string, int> m = {
    {"apple", 5}, {"banana", 3}, {"cherry", 8}
};

// Erase by key
size_t erased = m.erase("banana");  // Returns 1 if erased, 0 if not found

// Erase by iterator
auto it = m.find("cherry");
if (it != m.end()) {
    m.erase(it);  // Returns iterator to next element
}

// Erase range
auto first = m.find("apple");
auto last = m.end();
m.erase(first, last);  // Erases from first to last (exclusive)

// Clear all
m.clear();
```

### Update Operations

```cpp
std::unordered_map<std::string, int> m = {{"apple", 5}};

// Update existing value
m["apple"] = 10;

// Update or insert (C++17)
m.insert_or_assign("banana", 7);  // Inserts if not exists, assigns if exists

// Try emplace (C++17)
m.try_emplace("cherry", 9);  // Only inserts if key doesn't exist
```

---

## Lookup Operations

### `find()` - Find Element

```cpp
std::unordered_map<std::string, int> m = {
    {"apple", 5}, {"banana", 3}, {"cherry", 8}
};

auto it = m.find("banana");
if (it != m.end()) {
    std::cout << "Found: " << it->first << " = " << it->second << std::endl;
} else {
    std::cout << "Not found" << std::endl;
}
```

### `count()` - Check Existence

```cpp
std::unordered_map<std::string, int> m = {{"apple", 5}};

if (m.count("apple") > 0) {
    std::cout << "Key exists" << std::endl;
}
// Returns 1 if exists, 0 if not (since keys are unique)
```

### `contains()` - Check Existence (C++20)

```cpp
std::unordered_map<std::string, int> m = {{"apple", 5}};

if (m.contains("apple")) {
    std::cout << "Key exists" << std::endl;
}
```

### `equal_range()` - Find All Elements with Key

```cpp
std::unordered_map<int, std::string> m = {
    {1, "one"}, {2, "two"}, {3, "three"}
};

// For unordered_map, equal_range returns range of size 0 or 1
auto [first, last] = m.equal_range(2);
if (first != last) {
    std::cout << first->second << std::endl;  // "two"
}
```

---

## Bucket Interface

`std::unordered_map` uses buckets to store elements. Understanding the bucket interface helps optimize performance.

### Bucket Operations

```cpp
std::unordered_map<std::string, int> m = {
    {"apple", 5}, {"banana", 3}, {"cherry", 8}
};

// Get number of buckets
size_t bucket_count = m.bucket_count();

// Get bucket for a key
size_t bucket = m.bucket("apple");

// Get bucket size
size_t size = m.bucket_size(bucket);

// Get load factor
float load_factor = m.load_factor();  // size() / bucket_count()

// Get max load factor
float max_load = m.max_load_factor();

// Set max load factor (triggers rehash if needed)
m.max_load_factor(0.75f);

// Rehash to accommodate at least n elements
m.rehash(100);

// Reserve space for at least n elements
m.reserve(100);  // More efficient than rehash
```

### Iterating Buckets

```cpp
std::unordered_map<std::string, int> m = {
    {"apple", 5}, {"banana", 3}, {"cherry", 8}
};

// Iterate through buckets
for (size_t i = 0; i < m.bucket_count(); ++i) {
    std::cout << "Bucket " << i << ": ";
    for (auto it = m.begin(i); it != m.end(i); ++it) {
        std::cout << it->first << " ";
    }
    std::cout << std::endl;
}
```

---

## Common Use Cases

### 1. Fast Lookup Table

```cpp
std::unordered_map<std::string, int> lookup;

// Build lookup table
lookup["key1"] = 100;
lookup["key2"] = 200;

// Fast O(1) average lookup
if (lookup.find("key1") != lookup.end()) {
    int value = lookup["key1"];
}
```

### 2. Frequency Counting

```cpp
std::unordered_map<std::string, int> frequency;

std::vector<std::string> words = {"apple", "banana", "apple", "cherry"};
for (const auto& word : words) {
    frequency[word]++;  // O(1) average
}

for (const auto& [word, count] : frequency) {
    std::cout << word << ": " << count << std::endl;
}
```

### 3. Caching/Memoization

```cpp
std::unordered_map<int, int> cache;

int fibonacci(int n) {
    if (n <= 1) return n;
    
    // Check cache
    auto it = cache.find(n);
    if (it != cache.end()) {
        return it->second;
    }
    
    // Compute and cache
    int result = fibonacci(n - 1) + fibonacci(n - 2);
    cache[n] = result;
    return result;
}
```

### 4. Grouping Data

```cpp
std::unordered_map<std::string, std::vector<int>> groups;

std::vector<std::pair<std::string, int>> data = {
    {"A", 1}, {"B", 2}, {"A", 3}, {"C", 4}
};

for (const auto& [key, value] : data) {
    groups[key].push_back(value);  // Group by key
}

// Access groups
for (const auto& [key, values] : groups) {
    std::cout << key << ": ";
    for (int v : values) {
        std::cout << v << " ";
    }
    std::cout << std::endl;
}
```

### 5. Custom Hash Function

```cpp
struct Person {
    std::string name;
    int age;
};

// Custom hash function
struct PersonHash {
    size_t operator()(const Person& p) const {
        return std::hash<std::string>{}(p.name) ^ 
               (std::hash<int>{}(p.age) << 1);
    }
};

// Custom equality
struct PersonEqual {
    bool operator()(const Person& a, const Person& b) const {
        return a.name == b.name && a.age == b.age;
    }
};

std::unordered_map<Person, std::string, PersonHash, PersonEqual> people;
people[{Person{"Alice", 30}, "Engineer"}];
people[{Person{"Bob", 25}, "Designer"}];
```

---

## Runtime Complexity Analysis

Understanding the time and space complexity of `std::unordered_map` operations is crucial for writing efficient code.

### Time Complexity

| Operation | Average | Worst Case | Notes |
|-----------|---------|------------|-------|
| **Element Access** |
| `operator[]` | O(1) | O(n) | Hash collision worst case |
| `at()` | O(1) | O(n) | Hash collision worst case |
| **Lookup** |
| `find()`, `count()`, `contains()` (C++20) | O(1) | O(n) | Hash collision worst case |
| `equal_range()` | O(1) | O(n) | Hash collision worst case |
| **Modifiers** |
| `insert()` (single element) | O(1) | O(n) | Rehash may occur |
| `insert()` (hint) | O(1) | O(n) | Hint may improve performance |
| `insert()` (range) | O(m) | O(m × n) | m = range size |
| `emplace()`, `emplace_hint()` | O(1) | O(n) | Similar to insert |
| `erase()` (by key) | O(1) | O(n) | Hash collision worst case |
| `erase()` (by iterator) | O(1) | O(n) | Hash collision worst case |
| `erase()` (range) | O(m) | O(m × n) | m = number of elements erased |
| `clear()` | O(n) | O(n) | Destroys all elements |
| `insert_or_assign()` (C++17) | O(1) | O(n) | Insert or update |
| `try_emplace()` (C++17) | O(1) | O(n) | Only inserts if key doesn't exist |
| **Bucket Operations** |
| `bucket()`, `bucket_count()`, `bucket_size()` | O(1) | O(1) | Constant time |
| `load_factor()`, `max_load_factor()` | O(1) | O(1) | Constant time |
| `rehash()`, `reserve()` | O(n) | O(n) | Rebuilds hash table |
| **Operations** |
| `size()`, `empty()`, `max_size()` | O(1) | O(1) | Constant time |
| `swap()` | O(1) | O(1) | Constant time, swaps internal pointers |
| `merge()` (C++17) | O(n) | O(n × m) | n = source size, m = destination size |
| **Comparison** |
| `==`, `!=` | O(n) | O(n) | Element-wise comparison |

### Space Complexity

- **Storage**: O(n) where n is the number of key-value pairs
- **Bucket overhead**: Hash table with buckets (typically 1-2x the number of elements)
- **Node overhead**: Each node stores key, value, and next pointer (for chaining)
- **Total**: Typically ~32-48 bytes per element on 64-bit systems (including hash table structure)

### Hash Table Characteristics

`std::unordered_map` is implemented as a **hash table**:

- **Load factor**: Ratio of elements to buckets (default max ~1.0)
- **Rehashing**: Automatically rehashes when load factor exceeds max
- **Collision resolution**: Typically uses chaining (linked lists in buckets)
- **Hash function**: Uses `std::hash<Key>` by default
- **Order**: Elements are not ordered (order is implementation-defined)

### Factors Affecting Performance

1. **Hash function quality**: Poor hash function leads to more collisions
2. **Load factor**: Higher load factor increases collision probability
3. **Key distribution**: Uniform key distribution improves performance
4. **Rehashing**: Occurs when load factor exceeds max, causing O(n) operation

### Comparison with Other Containers

| Operation | `std::unordered_map` | `std::map` | `std::vector` (with pair) |
|-----------|---------------------|------------|---------------------------|
| Insert | O(1) average | O(log n) | O(1) amortized (end) |
| Find | O(1) average | O(log n) | O(n) |
| Erase | O(1) average | O(log n) | O(n) |
| Ordered iteration | ❌ No | ✅ Yes | ✅ Yes (if sorted) |
| Memory overhead | Higher | Higher | Lower |
| Worst case | O(n) | O(log n) | O(n) |

### Performance Tips Based on Complexity

1. **Use `reserve()` when size is known** → Avoids rehashing, improves performance
2. **Choose good hash function** → Reduces collisions, improves average performance
3. **Monitor load factor** → Adjust `max_load_factor()` if needed
4. **Prefer `emplace()` for complex types** → Avoids unnecessary copies
5. **Use `find()` instead of `operator[]` for lookups** → Avoids inserting default values
6. **Consider `std::map` if ordering is needed** → O(log n) vs O(1) average, but ordered

### When to Use `std::unordered_map`

✅ **Use `std::unordered_map` when:**
- Fast lookups are critical (O(1) average)
- Ordering is not needed
- Keys are hashable
- Insert/erase operations are frequent
- Large datasets with good hash distribution

❌ **Avoid `std::unordered_map` when:**
- Ordering is required → Use `std::map` (O(log n))
- Worst-case performance matters → `std::map` has guaranteed O(log n)
- Keys are not hashable → Use `std::map`
- Memory is very constrained → Consider `std::vector` with sorted pairs

---

## Best Practices

### ✅ Do's

1. **Use `reserve()` when size is known**
   ```cpp
   std::unordered_map<std::string, int> m;
   m.reserve(1000);  // Avoids rehashing
   ```

2. **Use `find()` or `contains()` for existence checks**
   ```cpp
   // ✅ Good
   if (m.find("key") != m.end()) {
       // Key exists
   }
   
   // ❌ Bad - inserts default value
   if (m["key"] > 0) { }
   ```

3. **Use structured bindings (C++17) for iteration**
   ```cpp
   for (const auto& [key, value] : m) {
       // Process key-value pair
   }
   ```

4. **Use `emplace()` for complex types**
   ```cpp
   m.emplace("key", ComplexType{arg1, arg2});  // Constructs in place
   ```

5. **Provide custom hash for custom types**
   ```cpp
   struct MyHash {
       size_t operator()(const MyType& t) const {
           // Good hash function
       }
   };
   ```

### ❌ Don'ts

1. **Don't use `operator[]` for existence checks**
   ```cpp
   // ❌ Bad - inserts default value
   if (m["key"] > 0) { }
   
   // ✅ Good
   if (m.find("key") != m.end() && m["key"] > 0) { }
   ```

2. **Don't assume ordering**
   ```cpp
   // ❌ Bad - order is not guaranteed
   for (const auto& [key, value] : m) {
       // Order may vary between runs
   }
   ```

3. **Don't use `std::unordered_map` when ordering is needed**
   ```cpp
   // ❌ If ordering needed
   std::unordered_map<int, std::string> m;
   
   // ✅ Use std::map
   std::map<int, std::string> m;
   ```

4. **Don't ignore hash function quality**
   ```cpp
   // ❌ Bad hash function (all map to same bucket)
   struct BadHash {
       size_t operator()(const int&) const { return 0; }
   };
   
   // ✅ Good hash function
   struct GoodHash {
       size_t operator()(const int& x) const {
           return std::hash<int>{}(x);
       }
   };
   ```

### Performance Tips

- **Reserve space**: Use `reserve()` to avoid rehashing
- **Good hash function**: Distributes keys evenly across buckets
- **Monitor load factor**: Adjust `max_load_factor()` if needed
- **Custom hash**: Provide efficient hash function for custom types
- **Avoid rehashing**: Use `reserve()` when size is known

---

**Summary**: `std::unordered_map` provides fast O(1) average operations for key-value storage. Use it when ordering is not needed and fast lookups are critical. For ordered key-value storage, use `std::map` instead.

