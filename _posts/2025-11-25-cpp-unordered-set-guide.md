---
layout: post
title: "C++ std::unordered_set Guide: Hash-Based Set Container"
date: 2025-11-25 00:00:00 -0700
categories: cpp stl containers unordered-set
permalink: /2025/11/25/cpp-unordered-set-guide/
tags: [cpp, unordered_set, stl, containers, hash-set, hash-table, associative-container]
---

# C++ std::unordered_set Guide: Hash-Based Set Container

A comprehensive guide to `std::unordered_set`, a hash-based associative container that stores unique elements with average O(1) operations, covering all essential methods, common use cases, and best practices.

## Table of Contents

1. [Unordered Set Basics](#unordered-set-basics)
2. [Element Access Methods](#element-access-methods)
3. [Modifiers](#modifiers)
4. [Lookup Operations](#lookup-operations)
5. [Bucket Interface](#bucket-interface)
6. [Common Use Cases](#common-use-cases)
7. [Runtime Complexity Analysis](#runtime-complexity-analysis)
8. [Best Practices](#best-practices)

---

## Unordered Set Basics

`std::unordered_set` is a hash-based associative container that stores unique elements. It provides average O(1) operations for insert, find, and erase.

```cpp
#include <unordered_set>
#include <string>
#include <iostream>
using namespace std;

int main() {
    // Default construction
    unordered_set<int> set1;
    
    // Initializer list (C++11)
    unordered_set<int> set2 = {1, 2, 3, 4, 5};
    
    // Copy construction
    unordered_set<int> set3(set2);
    
    // Custom hash and equality
    struct MyHash {
        size_t operator()(const string& s) const {
            return hash<string>{}(s);
        }
    };
    unordered_set<string, MyHash> set4;
    
    // Insert elements
    set2.insert(6);
    set2.insert(7);
    
    // Iterate (order is not guaranteed)
    for (const auto& elem : set2) {
        cout << elem << " ";
    }
}
```

### Key Characteristics

- **Hash-based**: Uses hash table for O(1) average operations
- **Unique elements**: Each element appears only once
- **Unordered**: Elements are not sorted (order is implementation-defined)
- **Fast operations**: Average O(1) for insert, find, erase
- **Load factor**: Automatically manages hash table load

---

## Element Access Methods

### Iterator-Based Access

```cpp
#include <unordered_set>
using namespace std;

unordered_set<int> s = {1, 2, 3, 4, 5};

// Access via iterator
auto it = s.begin();
int first = *it;  // Value of first element (order not guaranteed)

// No direct access by value - must use find()
```

⚠️ **Note**: `std::unordered_set` doesn't provide `front()`, `back()`, or `operator[]` because elements are not ordered and not key-value pairs.

---

## Modifiers

### Insertion

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> s;

// Method 1: insert() with value
s.insert(42);

// Method 2: insert() with hint (may improve performance)
auto hint = s.end();
s.insert(hint, 100);

// Method 3: insert() with range
vector<int> vec = {1, 2, 3};
s.insert(vec.begin(), vec.end());

// Method 4: emplace() (C++11) - constructs in place
s.emplace(200);

// Method 5: emplace_hint() - with hint
s.emplace_hint(s.end(), 300);

// Check if insertion succeeded
auto [it, inserted] = s.insert(42);
if (!inserted) {
    cout << "Element already exists" << endl;
}
```

### Erasure

```cpp
#include <unordered_set>
using namespace std;

unordered_set<int> s = {1, 2, 3, 4, 5};

// Erase by value
size_t erased = s.erase(3);  // Returns 1 if erased, 0 if not found

// Erase by iterator
auto it = s.find(4);
if (it != s.end()) {
    s.erase(it);  // Returns iterator to next element
}

// Erase range
auto first = s.find(2);
auto last = s.end();
s.erase(first, last);  // Erases from first to last (exclusive)

// Clear all
s.clear();
```

---

## Lookup Operations

### `find()` - Find Element

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> s = {1, 2, 3, 4, 5};

auto it = s.find(3);
if (it != s.end()) {
    cout << "Found: " << *it << endl;
} else {
    cout << "Not found" << endl;
}
```

### `count()` - Check Existence

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> s = {1, 2, 3};

if (s.count(2) > 0) {
    cout << "Element exists" << endl;
}
// Returns 1 if exists, 0 if not (since elements are unique)
```

### `contains()` - Check Existence (C++20)

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> s = {1, 2, 3};

if (s.contains(2)) {
    cout << "Element exists" << endl;
}
```

### `equal_range()` - Find All Elements with Key

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> s = {1, 2, 3, 4, 5};

// For unordered_set, equal_range returns range of size 0 or 1
auto [first, last] = s.equal_range(3);
if (first != last) {
    cout << *first << endl;  // 3
}
```

---

## Bucket Interface

`std::unordered_set` uses buckets to store elements. Understanding the bucket interface helps optimize performance.

### Bucket Operations

```cpp
#include <unordered_set>
using namespace std;

unordered_set<int> s = {1, 2, 3, 4, 5};

// Get number of buckets
size_t bucket_count = s.bucket_count();

// Get bucket for a value
size_t bucket = s.bucket(3);

// Get bucket size
size_t size = s.bucket_size(bucket);

// Get load factor
float load_factor = s.load_factor();  // size() / bucket_count()

// Get max load factor
float max_load = s.max_load_factor();

// Set max load factor (triggers rehash if needed)
s.max_load_factor(0.75f);

// Rehash to accommodate at least n elements
s.rehash(100);

// Reserve space for at least n elements
s.reserve(100);  // More efficient than rehash
```

### Iterating Buckets

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> s = {1, 2, 3, 4, 5};

// Iterate through buckets
for (size_t i = 0; i < s.bucket_count(); ++i) {
    cout << "Bucket " << i << ": ";
    for (auto it = s.begin(i); it != s.end(i); ++it) {
        cout << *it << " ";
    }
    cout << endl;
}
```

---

## Common Use Cases

### 1. Fast Lookup/Existence Check

```cpp
#include <unordered_set>
#include <vector>
#include <iostream>
using namespace std;

unordered_set<int> lookup;

// Build lookup set
lookup.insert(100);
lookup.insert(200);
lookup.insert(300);

// Fast O(1) average lookup
if (lookup.find(200) != lookup.end()) {
    cout << "Found!" << endl;
}
```

### 2. Removing Duplicates

```cpp
#include <unordered_set>
#include <vector>
#include <iostream>
using namespace std;

vector<int> vec = {1, 2, 2, 3, 3, 3, 4, 5};

// Remove duplicates
unordered_set<int> unique_set(vec.begin(), vec.end());
vector<int> unique_vec(unique_set.begin(), unique_set.end());

// unique_vec: {1, 2, 3, 4, 5} (order may vary)
```

### 3. Fast Membership Testing

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<string> valid_keys = {"key1", "key2", "key3"};

string input = "key2";
if (valid_keys.contains(input)) {  // C++20
    cout << "Valid key" << endl;
}

// Pre-C++20
if (valid_keys.find(input) != valid_keys.end()) {
    cout << "Valid key" << endl;
}
```

### 4. Caching/Memoization

```cpp
#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> computed_values;

bool is_computed(int value) {
    return computed_values.find(value) != computed_values.end();
}

void mark_computed(int value) {
    computed_values.insert(value);
}

// Use in computation
int compute(int n) {
    if (is_computed(n)) {
        return n;  // Already computed
    }
    mark_computed(n);
    // ... computation
    return n;
}
```

### 5. Custom Hash Function

```cpp
#include <unordered_set>
#include <string>
using namespace std;

struct Person {
    string name;
    int age;
};

// Custom hash function
struct PersonHash {
    size_t operator()(const Person& p) const {
        return hash<string>{}(p.name) ^ (hash<int>{}(p.age) << 1);
    }
};

// Custom equality
struct PersonEqual {
    bool operator()(const Person& a, const Person& b) const {
        return a.name == b.name && a.age == b.age;
    }
};

unordered_set<Person, PersonHash, PersonEqual> people;
people.insert({Person{"Alice", 30}});
people.insert({Person{"Bob", 25}});
```

---

## Runtime Complexity Analysis

Understanding the time and space complexity of `std::unordered_set` operations is crucial for writing efficient code.

### Time Complexity

| Operation | Average | Worst Case | Notes |
|-----------|---------|------------|-------|
| **Element Access** |
| `begin()`, `end()` | O(1) | O(1) | Iterator creation |
| **Lookup** |
| `find()`, `count()`, `contains()` (C++20) | O(1) | O(n) | Hash collision worst case |
| `equal_range()` | O(1) | O(n) | Hash collision worst case |
| **Modifiers** |
| `insert()` (single element) | O(1) | O(n) | Rehash may occur |
| `insert()` (hint) | O(1) | O(n) | Hint may improve performance |
| `insert()` (range) | O(m) | O(m × n) | m = range size |
| `emplace()`, `emplace_hint()` | O(1) | O(n) | Similar to insert |
| `erase()` (by value) | O(1) | O(n) | Hash collision worst case |
| `erase()` (by iterator) | O(1) | O(n) | Hash collision worst case |
| `erase()` (range) | O(m) | O(m × n) | m = number of elements erased |
| `clear()` | O(n) | O(n) | Destroys all elements |
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

- **Storage**: O(n) where n is the number of elements
- **Bucket overhead**: Hash table with buckets (typically 1-2x the number of elements)
- **Node overhead**: Each node stores value and next pointer (for chaining)
- **Total**: Typically ~24-32 bytes per element on 64-bit systems (including hash table structure)

### Hash Table Characteristics

`std::unordered_set` is implemented as a **hash table**:

- **Load factor**: Ratio of elements to buckets (default max ~1.0)
- **Rehashing**: Automatically rehashes when load factor exceeds max
- **Collision resolution**: Typically uses chaining (linked lists in buckets)
- **Hash function**: Uses `std::hash<Key>` by default
- **Order**: Elements are not ordered (order is implementation-defined)

### Factors Affecting Performance

1. **Hash function quality**: Poor hash function leads to more collisions
2. **Load factor**: Higher load factor increases collision probability
3. **Element distribution**: Uniform element distribution improves performance
4. **Rehashing**: Occurs when load factor exceeds max, causing O(n) operation

### Comparison with Other Containers

| Operation | `std::unordered_set` | `std::set` | `std::vector` |
|-----------|---------------------|------------|---------------|
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
5. **Use `find()` instead of `count() == 1`** → Both O(1) average, but `find()` is more semantic
6. **Consider `std::set` if ordering is needed** → O(log n) vs O(1) average, but ordered

### When to Use `std::unordered_set`

✅ **Use `std::unordered_set` when:**
- Fast lookups are critical (O(1) average)
- Ordering is not needed
- Elements are hashable
- Insert/erase operations are frequent
- Large datasets with good hash distribution
- Removing duplicates efficiently

❌ **Avoid `std::unordered_set` when:**
- Ordering is required → Use `std::set` (O(log n))
- Worst-case performance matters → `std::set` has guaranteed O(log n)
- Elements are not hashable → Use `std::set`
- Memory is very constrained → Consider `std::vector` with sorted elements

---

## Best Practices

### ✅ Do's

1. **Use `reserve()` when size is known**
   ```cpp
   #include <unordered_set>
   using namespace std;
   
   unordered_set<int> s;
   s.reserve(1000);  // Avoids rehashing
   ```

2. **Use `find()` or `contains()` for existence checks**
   ```cpp
   #include <unordered_set>
   using namespace std;
   
   unordered_set<int> s = {1, 2, 3};
   
   // ✅ Good
   if (s.find(2) != s.end()) {
       // Element exists
   }
   
   // ✅ Good (C++20)
   if (s.contains(2)) {
       // Element exists
   }
   ```

3. **Use structured bindings (C++17) for iteration**
   ```cpp
   #include <unordered_set>
   #include <iostream>
   using namespace std;
   
   unordered_set<int> s = {1, 2, 3, 4, 5};
   for (const auto& elem : s) {
       cout << elem << " ";
   }
   ```

4. **Use `emplace()` for complex types**
   ```cpp
   #include <unordered_set>
   using namespace std;
   
   unordered_set<ComplexType> s;
   s.emplace(arg1, arg2);  // Constructs in place
   ```

5. **Provide custom hash for custom types**
   ```cpp
   #include <unordered_set>
   #include <string>
   using namespace std;
   
   struct MyHash {
       size_t operator()(const MyType& t) const {
           // Good hash function
       }
   };
   ```

### ❌ Don'ts

1. **Don't assume ordering**
   ```cpp
   #include <unordered_set>
   using namespace std;
   
   unordered_set<int> s = {1, 2, 3, 4, 5};
   
   // ❌ Bad - order is not guaranteed
   for (const auto& elem : s) {
       // Order may vary between runs
   }
   ```

2. **Don't use `std::unordered_set` when ordering is needed**
   ```cpp
   #include <unordered_set>
   #include <set>
   using namespace std;
   
   // ❌ If ordering needed
   unordered_set<int> s;
   
   // ✅ Use set
   set<int> s;
   ```

3. **Don't ignore hash function quality**
   ```cpp
   #include <unordered_set>
   using namespace std;
   
   // ❌ Bad hash function (all map to same bucket)
   struct BadHash {
       size_t operator()(const int&) const { return 0; }
   };
   
   // ✅ Good hash function
   struct GoodHash {
       size_t operator()(const int& x) const {
           return hash<int>{}(x);
       }
   };
   ```

4. **Don't forget to reserve space when size is known**
   ```cpp
   #include <unordered_set>
   #include <vector>
   using namespace std;
   
   vector<int> data = {1, 2, 3, 4, 5};
   
   // ❌ May cause rehashing
   unordered_set<int> s;
   for (int x : data) {
       s.insert(x);
   }
   
   // ✅ Better - reserve space
   unordered_set<int> s;
   s.reserve(data.size());
   for (int x : data) {
       s.insert(x);
   }
   ```

### Performance Tips

- **Reserve space**: Use `reserve()` to avoid rehashing
- **Good hash function**: Distributes elements evenly across buckets
- **Monitor load factor**: Adjust `max_load_factor()` if needed
- **Custom hash**: Provide efficient hash function for custom types
- **Avoid rehashing**: Use `reserve()` when size is known

---

**Summary**: `std::unordered_set` provides fast O(1) average operations for unique element storage. Use it when ordering is not needed and fast lookups are critical. For ordered element storage, use `std::set` instead.

