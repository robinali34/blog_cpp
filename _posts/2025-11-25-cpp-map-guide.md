---
layout: post
title: "C++ std::map Guide: Ordered Key-Value Container"
date: 2025-11-25 00:00:00 -0700
categories: cpp stl containers map
permalink: /2025/11/25/cpp-map-guide/
tags: [cpp, map, stl, containers, key-value, balanced-tree, associative-container]
---

# C++ std::map Guide: Ordered Key-Value Container

A comprehensive guide to `std::map`, an ordered associative container that stores key-value pairs sorted by key, covering all essential methods, common use cases, and best practices.

## Table of Contents

1. [Map Basics](#map-basics)
2. [Element Access Methods](#element-access-methods)
3. [Modifiers](#modifiers)
4. [Lookup Operations](#lookup-operations)
5. [Iterator Methods](#iterator-methods)
6. [Common Use Cases](#common-use-cases)
7. [Runtime Complexity Analysis](#runtime-complexity-analysis)
8. [Best Practices](#best-practices)

---

## Map Basics

`std::map` is an ordered associative container that stores key-value pairs sorted by key. It's implemented as a balanced binary search tree (typically red-black tree).

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

int main() {
    // Default construction
    map<string, int> map1;
    
    // Initializer list (C++11)
    map<string, int> map2 = {
        {"apple", 5},
        {"banana", 3},
        {"cherry", 8}
    };
    
    // Copy construction
    map<string, int> map3(map2);
    
    // Custom comparator
    map<string, int, greater<string>> map4;
    
    // Access elements
    map2["apple"] = 10;  // Modify existing
    map2["date"] = 7;    // Insert new
    
    // Iterate
    for (const auto& [key, value] : map2) {
        cout << key << ": " << value << endl;
    }
    // Output: apple: 10, banana: 3, cherry: 8, date: 7 (ordered)
}
```

### Key Characteristics

- **Ordered**: Elements are sorted by key (ascending by default)
- **Unique keys**: Each key appears only once
- **Logarithmic operations**: Insert, find, erase are O(log n)
- **Stable iterators**: Iterators remain valid unless element is erased

---

## Element Access Methods

### `operator[]` - Access or Insert

```cpp
#include <map>
#include <string>
using namespace std;

map<string, int> m;

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
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<string, int> m = {{"apple", 5}};

try {
    int value = m.at("apple");   // Returns 5
    int missing = m.at("banana"); // Throws out_of_range
} catch (const out_of_range& e) {
    cout << "Key not found" << endl;
}
```

### `find()` - Safe Access

```cpp
#include <map>
#include <string>
using namespace std;

map<string, int> m = {{"apple", 5}};

auto it = m.find("apple");
if (it != m.end()) {
    int value = it->second;  // Safe access
}
```

---

## Modifiers

### Insertion

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<string, int> m;

// Method 1: operator[]
m["key"] = 42;

// Method 2: insert() with pair
m.insert({"key2", 100});
m.insert(make_pair("key3", 200));

// Method 3: insert() with hint (more efficient if hint is correct)
auto hint = m.end();
m.insert(hint, {"key4", 300});

// Method 4: emplace() (C++11) - constructs in place
m.emplace("key5", 400);

// Method 5: emplace_hint() - with hint
m.emplace_hint(m.end(), "key6", 500);

// Check if insertion succeeded
auto [it, inserted] = m.insert({"key", 999});
if (!inserted) {
    cout << "Key already exists" << endl;
}
```

### Erasure

```cpp
#include <map>
#include <string>
using namespace std;

map<string, int> m = {
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
#include <map>
#include <string>
using namespace std;

map<string, int> m = {{"apple", 5}};

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
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<string, int> m = {
    {"apple", 5}, {"banana", 3}, {"cherry", 8}
};

auto it = m.find("banana");
if (it != m.end()) {
    cout << "Found: " << it->first << " = " << it->second << endl;
} else {
    cout << "Not found" << endl;
}
```

### `count()` - Check Existence

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<string, int> m = {{"apple", 5}};

if (m.count("apple") > 0) {
    cout << "Key exists" << endl;
}
// Returns 1 if exists, 0 if not (since keys are unique)
```

### `contains()` - Check Existence (C++20)

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<string, int> m = {{"apple", 5}};

if (m.contains("apple")) {
    cout << "Key exists" << endl;
}
```

### `lower_bound()`, `upper_bound()`, `equal_range()`

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<int, string> m = {
    {1, "one"}, {3, "three"}, {5, "five"}, {7, "seven"}
};

// lower_bound: first element >= key
auto lower = m.lower_bound(4);  // Points to {5, "five"}

// upper_bound: first element > key
auto upper = m.upper_bound(4);  // Points to {5, "five"}

// equal_range: pair of lower_bound and upper_bound
auto [first, last] = m.equal_range(5);
// first points to {5, "five"}, last points to {7, "seven"}

// Range query
for (auto it = m.lower_bound(3); it != m.upper_bound(6); ++it) {
    cout << it->first << ": " << it->second << endl;
}
// Output: 3: three, 5: five
```

---

## Iterator Methods

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<string, int> m = {
    {"apple", 5}, {"banana", 3}, {"cherry", 8}
};

// Forward iteration
for (auto it = m.begin(); it != m.end(); ++it) {
    cout << it->first << ": " << it->second << endl;
}

// Reverse iteration
for (auto it = m.rbegin(); it != m.rend(); ++it) {
    cout << it->first << ": " << it->second << endl;
}

// Range-based for loop (C++11)
for (const auto& [key, value] : m) {
    cout << key << ": " << value << endl;
}

// Const iterators
for (auto it = m.cbegin(); it != m.cend(); ++it) {
    // it->first and it->second are const
}
```

---

## Common Use Cases

### 1. Frequency Counting

```cpp
#include <map>
#include <vector>
#include <string>
#include <iostream>
using namespace std;

map<string, int> frequency;

vector<string> words = {"apple", "banana", "apple", "cherry"};
for (const auto& word : words) {
    frequency[word]++;  // Increment count
}

for (const auto& [word, count] : frequency) {
    cout << word << ": " << count << endl;
}
```

### 2. Ordered Key-Value Storage

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<int, string> student_grades = {
    {85, "Alice"},
    {92, "Bob"},
    {78, "Charlie"}
};

// Automatically sorted by key (grade)
for (const auto& [grade, name] : student_grades) {
    cout << name << ": " << grade << endl;
}
```

### 3. Lookup Table

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<string, string> country_codes = {
    {"US", "United States"},
    {"UK", "United Kingdom"},
    {"CA", "Canada"}
};

string code = "US";
if (country_codes.find(code) != country_codes.end()) {
    cout << country_codes[code] << endl;
}
```

### 4. Range Queries

```cpp
#include <map>
#include <string>
#include <iostream>
using namespace std;

map<int, string> events = {
    {100, "Event A"},
    {200, "Event B"},
    {300, "Event C"},
    {400, "Event D"}
};

// Find all events between 150 and 350
auto lower = events.lower_bound(150);
auto upper = events.upper_bound(350);

for (auto it = lower; it != upper; ++it) {
    cout << it->first << ": " << it->second << endl;
}
```

### 5. Custom Comparator

```cpp
#include <map>
#include <string>
using namespace std;

struct Person {
    string name;
    int age;
};

// Custom comparator for Person
struct PersonComparator {
    bool operator()(const Person& a, const Person& b) const {
        return a.age < b.age;  // Sort by age
    }
};

map<Person, string, PersonComparator> people;
people[{Person{"Alice", 30}, "Engineer"}];
people[{Person{"Bob", 25}, "Designer"}];

// Map is sorted by age
```

---

## Runtime Complexity Analysis

Understanding the time and space complexity of `std::map` operations is crucial for writing efficient code.

### Time Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|------|
| **Element Access** |
| `operator[]` | O(log n) | Insert if not exists, access if exists |
| `at()` | O(log n) | Bounds-checked access |
| **Lookup** |
| `find()`, `count()`, `contains()` (C++20) | O(log n) | Binary search in balanced tree |
| `lower_bound()`, `upper_bound()`, `equal_range()` | O(log n) | Binary search operations |
| **Modifiers** |
| `insert()` (single element) | O(log n) | Tree insertion |
| `insert()` (hint) | O(1) amortized | If hint is correct, O(log n) otherwise |
| `insert()` (range) | O(m × log(n + m)) | m = range size, n = current size |
| `emplace()`, `emplace_hint()` | O(log n) | Similar to insert, avoids copies |
| `erase()` (by key) | O(log n) | Tree deletion |
| `erase()` (by iterator) | O(1) amortized | If iterator is valid |
| `erase()` (range) | O(m + log n) | m = number of elements erased |
| `clear()` | O(n) | Destroys all elements |
| `insert_or_assign()` (C++17) | O(log n) | Insert or update |
| `try_emplace()` (C++17) | O(log n) | Only inserts if key doesn't exist |
| **Operations** |
| `size()`, `empty()`, `max_size()` | O(1) | Constant time |
| `swap()` | O(1) | Constant time, swaps root pointers |
| `merge()` (C++17) | O(n × log(m + n)) | n = source size, m = destination size |
| **Comparison** |
| `==`, `!=` | O(n) | Element-wise comparison |
| `<`, `>`, `<=`, `>=` | O(n) | Lexicographic comparison |

### Space Complexity

- **Storage**: O(n) where n is the number of key-value pairs
- **Node overhead**: Each node stores key, value, parent pointer, left child, right child, color (for red-black tree)
- **Total**: Typically ~48-64 bytes per element on 64-bit systems (including tree structure)

### Tree Structure Impact

`std::map` is implemented as a **balanced binary search tree** (typically red-black tree):

- **Height**: O(log n) guaranteed (red-black tree property)
- **Balance**: Automatically maintained, no manual rebalancing needed
- **Iterator stability**: Iterators remain valid unless the element is erased
- **Ordering**: Elements are always sorted by key

### Comparison with Other Containers

| Operation | `std::map` | `std::unordered_map` | `std::vector` (with pair) |
|-----------|------------|----------------------|---------------------------|
| Insert | O(log n) | O(1) average | O(1) amortized (end) |
| Find | O(log n) | O(1) average | O(n) |
| Erase | O(log n) | O(1) average | O(n) |
| Ordered iteration | ✅ Yes | ❌ No | ✅ Yes (if sorted) |
| Memory overhead | Higher | Higher | Lower |

### Performance Tips Based on Complexity

1. **Use `emplace()` for complex types** → Avoids unnecessary copies (still O(log n))
2. **Provide hint for `insert()` when possible** → Can achieve O(1) amortized if hint is correct
3. **Prefer `find()` over `count() == 1`** → Both O(log n), but `find()` is more semantic
4. **Use `lower_bound()`/`upper_bound()` for range queries** → O(log n) instead of O(n) iteration
5. **Consider `std::unordered_map`** → If ordering is not needed, O(1) average vs O(log n)
6. **Avoid frequent insertions/deletions in tight loops** → Each operation is O(log n)

### When to Use `std::map`

✅ **Use `std::map` when:**
- You need ordered key-value pairs
- Frequent lookups (O(log n))
- Range queries are common
- Iterator stability is important
- Keys need to be sorted

❌ **Avoid `std::map` when:**
- Ordering is not needed → Use `std::unordered_map` (O(1) average)
- Very large datasets with simple types → Consider `std::unordered_map`
- Frequent random access by index → Use `std::vector` (O(1))

---

## Best Practices

### ✅ Do's

1. **Use `find()` or `contains()` instead of `operator[]` for lookups**
   ```cpp
   // ✅ Good
   auto it = m.find("key");
   if (it != m.end()) {
       int value = it->second;
   }
   
   // ❌ Bad - inserts default value if key doesn't exist
   int value = m["key"];
   ```

2. **Use `at()` when you expect the key to exist**
   ```cpp
   #include <map>
   #include <stdexcept>
   using namespace std;
   
   try {
       int value = m.at("key");
   } catch (const out_of_range&) {
       // Handle missing key
   }
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

5. **Check insertion result when needed**
   ```cpp
   auto [it, inserted] = m.insert({"key", 42});
   if (inserted) {
       // New element inserted
   }
   ```

### ❌ Don'ts

1. **Don't use `operator[]` for existence checks**
   ```cpp
   // ❌ Bad - inserts default value
   if (m["key"] > 0) { }
   
   // ✅ Good
   if (m.find("key") != m.end() && m["key"] > 0) { }
   ```

2. **Don't assume `operator[]` returns existing value**
   ```cpp
   // ❌ Bad - may insert default value
   int count = m["key"];
   
   // ✅ Good
   auto it = m.find("key");
   int count = (it != m.end()) ? it->second : 0;
   ```

3. **Don't use `std::map` when ordering isn't needed**
   ```cpp
   #include <map>
   #include <unordered_map>
   #include <string>
   using namespace std;
   
   // ❌ If ordering not needed
   map<string, int> m;
   
   // ✅ Use unordered_map for better performance
   unordered_map<string, int> m;
   ```

4. **Don't invalidate iterators during iteration**
   ```cpp
   // ❌ Bad - may invalidate iterator
   for (auto it = m.begin(); it != m.end(); ++it) {
       if (condition) {
           m.erase(it);  // ⚠️ Iterator invalidated
       }
   }
   
   // ✅ Good - use return value of erase
   for (auto it = m.begin(); it != m.end(); ) {
       if (condition) {
           it = m.erase(it);  // Returns next iterator
       } else {
           ++it;
       }
   }
   ```

### Performance Tips

- **Use `reserve()` equivalent**: `std::map` doesn't have `reserve()`, but you can pre-allocate by inserting elements in sorted order
- **Custom comparators**: Use efficient comparators for better performance
- **Hint-based insertion**: Use `emplace_hint()` with correct hint for O(1) amortized insertion
- **Range operations**: Use `lower_bound()`/`upper_bound()` for efficient range queries

---

**Summary**: `std::map` provides ordered key-value storage with logarithmic operations. Use it when you need sorted keys, range queries, or stable iterators. For unordered key-value storage, prefer `std::unordered_map` for better average performance.

