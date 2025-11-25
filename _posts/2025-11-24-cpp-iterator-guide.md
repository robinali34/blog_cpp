---
layout: post
title: "C++ Iterator Guide: Common Cases and Key-Value Storage Patterns"
date: 2025-11-24 00:00:00 -0700
categories: cpp stl iterators containers algorithms
permalink: /2025/11/24/cpp-iterator-guide/
tags: [cpp, iterator, stl, containers, map, unordered_map, performance, algorithms]
---

# C++ Iterator Guide: Common Cases and Key-Value Storage Patterns

A comprehensive guide to C++ iterators, covering common use cases and advanced patterns for using iterators as keys or values in key-value storage for efficient container access.

## Table of Contents

1. [Iterator Basics](#iterator-basics)
2. [Iterator Categories](#iterator-categories)
3. [Common Iterator Use Cases](#common-iterator-use-cases)
4. [Using Iterators in Key-Value Storage](#using-iterators-in-key-value-storage)
5. [Practical Examples](#practical-examples)
6. [Best Practices and Pitfalls](#best-practices-and-pitfalls)

---

## Iterator Basics

Iterators provide a uniform interface to traverse and access elements in containers, abstracting away the underlying container implementation.

### Basic Iterator Operations

```cpp
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Iterator declaration
    std::vector<int>::iterator it;
    
    // Begin and end
    it = vec.begin();  // Points to first element
    auto end_it = vec.end();  // Points past the last element
    
    // Dereference
    std::cout << *it << std::endl;  // Output: 1
    
    // Increment
    ++it;
    std::cout << *it << std::endl;  // Output: 2
    
    // Range-based for loop (uses iterators internally)
    for (const auto& elem : vec) {
        std::cout << elem << " ";
    }
    // Output: 1 2 3 4 5
}
```

### Iterator Types

```cpp
#include <vector>
#include <list>
#include <map>

int main() {
    std::vector<int> vec = {1, 2, 3};
    
    // Iterator (read-write)
    std::vector<int>::iterator it1 = vec.begin();
    *it1 = 10;  // Can modify
    
    // Const iterator (read-only)
    std::vector<int>::const_iterator it2 = vec.cbegin();
    // *it2 = 10;  // Error: cannot modify
    
    // Reverse iterator
    std::vector<int>::reverse_iterator it3 = vec.rbegin();
    std::cout << *it3 << std::endl;  // Output: 3 (last element)
    
    // Const reverse iterator
    std::vector<int>::const_reverse_iterator it4 = vec.crbegin();
}
```

---

## Iterator Categories

C++ iterators are categorized by their capabilities:

### 1. Input Iterator
- Read-only, forward-only
- Single-pass
- Example: `std::istream_iterator`

```cpp
#include <iterator>
#include <iostream>
#include <vector>

int main() {
    std::istream_iterator<int> input_it(std::cin);
    std::istream_iterator<int> end_it;
    
    std::vector<int> vec;
    std::copy(input_it, end_it, std::back_inserter(vec));
}
```

### 2. Output Iterator
- Write-only, forward-only
- Single-pass
- Example: `std::ostream_iterator`, `std::back_inserter`

```cpp
#include <iterator>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::ostream_iterator<int> output_it(std::cout, " ");
    std::copy(vec.begin(), vec.end(), output_it);
    // Output: 1 2 3 4 5
}
```

### 3. Forward Iterator
- Read-write, forward-only
- Multi-pass
- Example: `std::forward_list::iterator`

```cpp
#include <forward_list>

int main() {
    std::forward_list<int> flist = {1, 2, 3, 4, 5};
    auto it = flist.begin();
    
    // Can traverse multiple times
    for (int i = 0; i < 2; ++i) {
        it = flist.begin();
        while (it != flist.end()) {
            std::cout << *it++ << " ";
        }
    }
}
```

### 4. Bidirectional Iterator
- Read-write, forward and backward
- Multi-pass
- Example: `std::list::iterator`, `std::map::iterator`

```cpp
#include <list>

int main() {
    std::list<int> lst = {1, 2, 3, 4, 5};
    auto it = lst.begin();
    
    // Forward
    ++it;
    std::cout << *it << std::endl;  // Output: 2
    
    // Backward
    --it;
    std::cout << *it << std::endl;  // Output: 1
}
```

### 5. Random Access Iterator
- Read-write, forward, backward, and arbitrary jumps
- Multi-pass
- Example: `std::vector::iterator`, `std::deque::iterator`

```cpp
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    auto it = vec.begin();
    
    // Random access
    it += 3;           // Jump 3 positions
    std::cout << *it << std::endl;  // Output: 4
    
    it -= 2;           // Jump back 2 positions
    std::cout << *it << std::endl;  // Output: 2
    
    // Comparison
    auto it2 = vec.begin() + 2;
    std::cout << (it < it2) << std::endl;  // Output: 1 (true)
    
    // Index-like access
    std::cout << it[1] << std::endl;  // Output: 3 (element at it + 1)
}
```

---

## Common Iterator Use Cases

### 1. Traversing Containers

{% raw %}
```cpp
#include <vector>
#include <list>
#include <map>

// Vector traversal
void traverse_vector() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Traditional loop
    for (auto it = vec.begin(); it != vec.end(); ++it) {
        std::cout << *it << " ";
    }
    
    // Range-based for (preferred)
    for (const auto& elem : vec) {
        std::cout << elem << " ";
    }
}

// List traversal
void traverse_list() {
    std::list<int> lst = {1, 2, 3, 4, 5};
    
    for (auto it = lst.begin(); it != lst.end(); ++it) {
        std::cout << *it << " ";
    }
}

// Map traversal
void traverse_map() {
    std::map<std::string, int> m = {{"apple", 5}, {"banana", 3}};
    
    for (auto it = m.begin(); it != m.end(); ++it) {
        std::cout << it->first << ": " << it->second << std::endl;
    }
    
    // Structured bindings (C++17)
    for (const auto& [key, value] : m) {
        std::cout << key << ": " << value << std::endl;
    }
}
```
{% endraw %}

### 2. Finding Elements

```cpp
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Find element
    auto it = std::find(vec.begin(), vec.end(), 3);
    if (it != vec.end()) {
        std::cout << "Found: " << *it << std::endl;
        std::cout << "Index: " << std::distance(vec.begin(), it) << std::endl;
    }
    
    // Find with predicate
    auto it2 = std::find_if(vec.begin(), vec.end(), 
                            [](int x) { return x > 3; });
    if (it2 != vec.end()) {
        std::cout << "First element > 3: " << *it2 << std::endl;
    }
}
```

### 3. Erasing Elements

```cpp
#include <vector>
#include <list>
#include <algorithm>

void erase_from_vector() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Erase by value (returns iterator to next element)
    vec.erase(std::remove(vec.begin(), vec.end(), 3), vec.end());
    // vec now: {1, 2, 4, 5}
    
    // Erase by iterator
    auto it = std::find(vec.begin(), vec.end(), 2);
    if (it != vec.end()) {
        vec.erase(it);  // vec now: {1, 4, 5}
    }
}

void erase_from_list() {
    std::list<int> lst = {1, 2, 3, 4, 5};
    
    // List erase returns iterator to next element
    auto it = lst.begin();
    std::advance(it, 2);  // Move to 3rd element
    it = lst.erase(it);  // Erase and get next iterator
    // lst now: {1, 2, 4, 5}, it points to 4
}
```

### 4. Inserting Elements

```cpp
#include <vector>
#include <list>
#include <map>

void insert_into_vector() {
    std::vector<int> vec = {1, 2, 4, 5};
    
    // Insert before iterator position
    auto it = std::find(vec.begin(), vec.end(), 4);
    vec.insert(it, 3);  // vec now: {1, 2, 3, 4, 5}
}

void insert_into_list() {
    std::list<int> lst = {1, 2, 4, 5};
    
    auto it = std::find(lst.begin(), lst.end(), 4);
    lst.insert(it, 3);  // lst now: {1, 2, 3, 4, 5}
}

void insert_into_map() {
    std::map<std::string, int> m;
    
    // Insert returns pair<iterator, bool>
    auto [it, inserted] = m.insert({"apple", 5});
    if (inserted) {
        std::cout << "Inserted successfully" << std::endl;
    }
    
    // Iterator points to inserted element
    std::cout << it->first << ": " << it->second << std::endl;
}
```

### 5. Algorithm Operations

```cpp
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    
    // Transform
    std::transform(vec.begin(), vec.end(), vec.begin(),
                   [](int x) { return x * 2; });
    // vec now: {2, 4, 6, 8, 10}
    
    // Copy
    std::vector<int> dest(5);
    std::copy(vec.begin(), vec.end(), dest.begin());
    
    // Accumulate
    int sum = std::accumulate(vec.begin(), vec.end(), 0);
    std::cout << "Sum: " << sum << std::endl;  // Output: 30
    
    // Count
    int count = std::count_if(vec.begin(), vec.end(),
                              [](int x) { return x > 5; });
    std::cout << "Count > 5: " << count << std::endl;  // Output: 3
}
```

---

## Using Iterators in Key-Value Storage

Using iterators as keys or values in key-value storage (like `std::map` or `std::unordered_map`) enables efficient container access patterns, especially for maintaining references to elements in other containers.

### Pattern 1: Using Iterators as Values

Store iterators pointing to elements in a primary container for quick access.

```cpp
#include <vector>
#include <unordered_map>
#include <string>

class FastLookup {
private:
    std::vector<std::string> data;  // Primary storage
    std::unordered_map<std::string, 
                       std::vector<std::string>::iterator> index;  // Fast lookup
    
public:
    void add(const std::string& key, const std::string& value) {
        // Add to primary storage
        data.push_back(value);
        
        // Store iterator pointing to the element
        index[key] = std::prev(data.end());  // Iterator to last element
    }
    
    std::string* get(const std::string& key) {
        auto it = index.find(key);
        if (it != index.end()) {
            return &(*it->second);  // Dereference iterator to get value
        }
        return nullptr;
    }
    
    void update(const std::string& key, const std::string& new_value) {
        auto it = index.find(key);
        if (it != index.end()) {
            *(it->second) = new_value;  // Update through iterator
        }
    }
    
    void remove(const std::string& key) {
        auto it = index.find(key);
        if (it != index.end()) {
            data.erase(it->second);  // Erase from primary storage
            index.erase(it);          // Remove from index
        }
    }
};
```

### Pattern 2: Using Iterators as Keys (with Custom Hash)

Store container elements and use iterators as keys for reverse lookup.

```cpp
#include <list>
#include <unordered_map>
#include <functional>

// Custom hash for list iterators
struct ListIteratorHash {
    template<typename T>
    std::size_t operator()(typename std::list<T>::iterator it) const {
        // Hash based on pointer value (implementation-defined)
        return std::hash<void*>{}(static_cast<void*>(&*it));
    }
};

template<typename T>
class IteratorKeyMap {
private:
    std::list<T> data;
    std::unordered_map<typename std::list<T>::iterator, std::string,
                       ListIteratorHash> reverse_index;
    
public:
    typename std::list<T>::iterator add(const std::string& key, const T& value) {
        data.push_back(value);
        auto it = std::prev(data.end());
        reverse_index[it] = key;
        return it;
    }
    
    std::string getKey(typename std::list<T>::iterator it) {
        auto map_it = reverse_index.find(it);
        if (map_it != reverse_index.end()) {
            return map_it->second;
        }
        return "";
    }
    
    void remove(typename std::list<T>::iterator it) {
        reverse_index.erase(it);
        data.erase(it);
    }
};
```

### Pattern 3: Maintaining Stable References with List Iterators

Use `std::list` iterators (which remain valid after insertions/deletions) for stable references.

```cpp
#include <list>
#include <unordered_map>
#include <string>

class StableReferenceMap {
private:
    struct Data {
        std::string key;
        int value;
    };
    
    std::list<Data> storage;  // List iterators remain valid after operations
    std::unordered_map<std::string, std::list<Data>::iterator> lookup;
    
public:
    void insert(const std::string& key, int value) {
        storage.push_back({key, value});
        lookup[key] = std::prev(storage.end());
    }
    
    int* getValue(const std::string& key) {
        auto it = lookup.find(key);
        if (it != lookup.end()) {
            return &(it->second->value);  // Iterator remains valid
        }
        return nullptr;
    }
    
    void erase(const std::string& key) {
        auto it = lookup.find(key);
        if (it != lookup.end()) {
            storage.erase(it->second);  // Erase from list
            lookup.erase(it);            // Remove from map
        }
    }
    
    // Iterator remains valid even after other insertions
    std::list<Data>::iterator getIterator(const std::string& key) {
        auto it = lookup.find(key);
        if (it != lookup.end()) {
            return it->second;
        }
        return storage.end();
    }
};
```

### Pattern 4: LRU Cache with Iterator-Based Access

Implement LRU cache using iterators for O(1) access and update.

```cpp
#include <list>
#include <unordered_map>
#include <string>

template<typename Key, typename Value>
class LRUCache {
private:
    struct Node {
        Key key;
        Value value;
    };
    
    std::list<Node> cache_list;  // Most recent at front
    std::unordered_map<Key, typename std::list<Node>::iterator> cache_map;
    size_t capacity;
    
public:
    LRUCache(size_t cap) : capacity(cap) {}
    
    Value* get(const Key& key) {
        auto it = cache_map.find(key);
        if (it == cache_map.end()) {
            return nullptr;
        }
        
        // Move to front (most recently used)
        cache_list.splice(cache_list.begin(), cache_list, it->second);
        return &(it->second->value);
    }
    
    void put(const Key& key, const Value& value) {
        auto it = cache_map.find(key);
        
        if (it != cache_map.end()) {
            // Update existing
            it->second->value = value;
            cache_list.splice(cache_list.begin(), cache_list, it->second);
        } else {
            // Insert new
            if (cache_list.size() >= capacity) {
                // Remove least recently used (back of list)
                auto last = std::prev(cache_list.end());
                cache_map.erase(last->key);
                cache_list.pop_back();
            }
            
            cache_list.push_front({key, value});
            cache_map[key] = cache_list.begin();
        }
    }
    
    void erase(const Key& key) {
        auto it = cache_map.find(key);
        if (it != cache_map.end()) {
            cache_list.erase(it->second);
            cache_map.erase(it);
        }
    }
};
```

### Pattern 5: Multi-Container Synchronization

Maintain consistency across multiple containers using iterators.

```cpp
#include <vector>
#include <unordered_map>
#include <string>

class MultiContainerSync {
private:
    struct Item {
        std::string name;
        int id;
        double price;
    };
    
    std::vector<Item> items;  // Primary storage
    std::unordered_map<std::string, 
                       std::vector<Item>::iterator> name_index;
    std::unordered_map<int, 
                       std::vector<Item>::iterator> id_index;
    
public:
    void add(const std::string& name, int id, double price) {
        items.push_back({name, id, price});
        auto it = std::prev(items.end());
        
        name_index[name] = it;
        id_index[id] = it;
    }
    
    Item* findByName(const std::string& name) {
        auto it = name_index.find(name);
        if (it != name_index.end()) {
            return &(*it->second);
        }
        return nullptr;
    }
    
    Item* findById(int id) {
        auto it = id_index.find(id);
        if (it != id_index.end()) {
            return &(*it->second);
        }
        return nullptr;
    }
    
    void remove(const std::string& name) {
        auto name_it = name_index.find(name);
        if (name_it == name_index.end()) return;
        
        auto item_it = name_it->second;
        int id = item_it->id;
        
        // Remove from all indices
        name_index.erase(name_it);
        id_index.erase(id);
        
        // Erase from primary storage
        items.erase(item_it);
    }
};
```

---

## Practical Examples

### Example 1: Efficient String Pool

```cpp
#include <vector>
#include <unordered_map>
#include <string>

class StringPool {
private:
    std::vector<std::string> pool;
    std::unordered_map<std::string, 
                       std::vector<std::string>::const_iterator> index;
    
public:
    const std::string* intern(const std::string& str) {
        auto it = index.find(str);
        if (it != index.end()) {
            return &(*it->second);  // Return existing
        }
        
        // Add new string
        pool.push_back(str);
        auto pool_it = std::prev(pool.end());
        index[str] = pool_it;
        
        return &(*pool_it);
    }
    
    size_t size() const { return pool.size(); }
};
```

### Example 2: Graph Adjacency with Iterator References

```cpp
#include <list>
#include <unordered_map>
#include <vector>

class Graph {
private:
    struct Node {
        int id;
        std::list<std::list<Node>::iterator> neighbors;
    };
    
    std::list<Node> nodes;
    std::unordered_map<int, std::list<Node>::iterator> node_map;
    
public:
    void addNode(int id) {
        nodes.push_back({id, {}});
        node_map[id] = std::prev(nodes.end());
    }
    
    void addEdge(int from, int to) {
        auto from_it = node_map.find(from);
        auto to_it = node_map.find(to);
        
        if (from_it != node_map.end() && to_it != node_map.end()) {
            from_it->second->neighbors.push_back(to_it->second);
        }
    }
    
    std::vector<int> getNeighbors(int id) {
        std::vector<int> result;
        auto it = node_map.find(id);
        
        if (it != node_map.end()) {
            for (const auto& neighbor_it : it->second->neighbors) {
                result.push_back(neighbor_it->id);
            }
        }
        return result;
    }
};
```

---

## Best Practices and Pitfalls

### ✅ Best Practices

1. **Use `auto` for iterator types**
   ```cpp
   // Good
   auto it = vec.begin();
   
   // Avoid
   std::vector<int>::iterator it = vec.begin();
   ```

2. **Prefer range-based for loops when possible**
   ```cpp
   // Good
   for (const auto& elem : vec) { }
   
   // When you need iterator
   for (auto it = vec.begin(); it != vec.end(); ++it) { }
   ```

3. **Use `std::list` iterators for stable references**
   ```cpp
   std::list<int> lst = {1, 2, 3};
   auto it = lst.begin();
   lst.push_back(4);  // it still valid
   ```

4. **Check iterator validity before use**
   ```cpp
   auto it = std::find(vec.begin(), vec.end(), value);
   if (it != vec.end()) {
       // Safe to use
   }
   ```

5. **Use `std::prev` and `std::next` for safe navigation**
   ```cpp
   auto it = std::prev(vec.end());  // Last element
   auto it2 = std::next(vec.begin(), 2);  // Third element
   ```

### ⚠️ Common Pitfalls

1. **Iterator invalidation**
   ```cpp
   std::vector<int> vec = {1, 2, 3, 4, 5};
   auto it = vec.begin() + 2;
   vec.push_back(6);  // ⚠️ it may be invalidated!
   // Use std::list for stable iterators
   ```

2. **Comparing iterators from different containers**
   ```cpp
   std::vector<int> vec1 = {1, 2, 3};
   std::vector<int> vec2 = {1, 2, 3};
   // ⚠️ Undefined behavior
   // if (vec1.begin() == vec2.begin()) { }
   ```

3. **Dereferencing `end()` iterator**
   ```cpp
   auto it = vec.end();
   // ⚠️ Undefined behavior
   // int x = *it;
   ```

4. **Using invalidated iterators in maps**
   {% raw %}
   ```cpp
   std::map<int, int> m = {{1, 10}, {2, 20}};
   auto it = m.find(1);
   m.erase(1);
   // ⚠️ it is now invalid
   // int x = it->second;  // Undefined behavior
   ```
   {% endraw %}

5. **Iterator type mismatch**
   ```cpp
   std::vector<int> vec = {1, 2, 3};
   std::vector<int>::const_iterator cit = vec.cbegin();
   // ⚠️ Cannot assign const_iterator to iterator
   // std::vector<int>::iterator it = cit;  // Error
   ```

### Performance Considerations

1. **Iterator overhead is minimal** - Iterators are typically lightweight
2. **Random access iterators enable efficient algorithms** - Use `std::vector` or `std::deque` when random access is needed
3. **List iterators provide stable references** - Use `std::list` when iterator stability is required
4. **Iterator-based algorithms are efficient** - STL algorithms are optimized for iterator usage

---

## Summary

Iterators are fundamental to C++ container operations and algorithm usage. Key takeaways:

- **Iterator categories** determine available operations (input, output, forward, bidirectional, random access)
- **Common use cases** include traversal, finding, erasing, inserting, and algorithm operations
- **Using iterators in key-value storage** enables efficient container access patterns
- **List iterators remain valid** after insertions/deletions, making them ideal for stable references
- **Be aware of iterator invalidation** rules for different container types

Mastering iterators unlocks the full power of the C++ Standard Library and enables efficient, generic code.


