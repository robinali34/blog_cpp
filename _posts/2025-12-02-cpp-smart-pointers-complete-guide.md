---
layout: post
title: "C++ Smart Pointers Complete Guide: unique_ptr, shared_ptr, weak_ptr - Scenarios, Examples, and Common Pitfalls"
date: 2025-12-02 00:00:00 -0800
categories: cpp smart-pointers memory-management raii
permalink: /2025/12/02/cpp-smart-pointers-complete-guide/
tags: [cpp, smart-pointers, unique_ptr, shared_ptr, weak_ptr, memory-management, raii, ownership, resource-management]
excerpt: "A comprehensive guide to C++ smart pointers covering unique_ptr, shared_ptr, and weak_ptr with scenarios, practical examples, common practices, and pitfalls to avoid."
---

# C++ Smart Pointers Complete Guide: unique_ptr, shared_ptr, weak_ptr

Smart pointers in C++ provide automatic memory management through RAII (Resource Acquisition Is Initialization), eliminating manual memory management and preventing memory leaks. This guide covers all smart pointer types, their use cases, scenarios, examples, and common pitfalls.

## Table of Contents

1. [Introduction to Smart Pointers](#introduction-to-smart-pointers)
2. [std::unique_ptr](#stdunique_ptr)
3. [std::shared_ptr](#stdshared_ptr)
4. [std::weak_ptr](#stdweak_ptr)
5. [Common Scenarios](#common-scenarios)
6. [Practical Examples](#practical-examples)
7. [Common Practices](#common-practices)
8. [Common Pitfalls and Mistakes](#common-pitfalls-and-mistakes)

---

## Introduction to Smart Pointers

### Why Smart Pointers?

**Problems with Raw Pointers:**
- Memory leaks if not deleted
- Double deletion (undefined behavior)
- Dangling pointers (use after free)
- No automatic cleanup

**Benefits of Smart Pointers:**
- Automatic memory management
- Exception safety
- Clear ownership semantics
- No memory leaks

```cpp
#include <memory>
#include <iostream>
using namespace std;

// Bad: Raw pointer
void rawPointerExample() {
    int* ptr = new int(42);
    // If exception occurs here, memory leak!
    delete ptr;  // Must remember to delete
}

// Good: Smart pointer
void smartPointerExample() {
    unique_ptr<int> ptr = make_unique<int>(42);
    // Automatically deleted when out of scope
    // Even if exception occurs
}
```

### Smart Pointer Types

1. **`std::unique_ptr`**: Exclusive ownership, non-copyable
2. **`std::shared_ptr`**: Shared ownership, reference counted
3. **`std::weak_ptr`**: Non-owning observer, breaks cycles

---

## std::unique_ptr

### Basics

`unique_ptr` represents exclusive ownership. Only one `unique_ptr` can own an object at a time.

```cpp
#include <memory>
#include <iostream>
using namespace std;

void uniquePtrBasics() {
    // Create unique_ptr
    unique_ptr<int> p1 = make_unique<int>(42);
    cout << *p1 << endl;  // 42
    
    // Transfer ownership (move)
    unique_ptr<int> p2 = move(p1);
    // p1 is now nullptr
    // p2 owns the int
    
    // Cannot copy
    // unique_ptr<int> p3 = p2;  // Error!
    
    // Can move
    unique_ptr<int> p3 = move(p2);  // OK
}
```

### Custom Deleters

```cpp
#include <memory>
#include <cstdio>
using namespace std;

void customDeleterExample() {
    // Custom deleter for FILE*
    unique_ptr<FILE, decltype(&fclose)> file(fopen("test.txt", "w"), fclose);
    
    if (file) {
        fprintf(file.get(), "Hello, World!");
    }
    // Automatically closed when out of scope
    
    // Lambda deleter
    auto deleter = [](int* p) {
        cout << "Deleting " << *p << endl;
        delete p;
    };
    
    unique_ptr<int, decltype(deleter)> p(new int(42), deleter);
}
```

### Array Support

```cpp
#include <memory>
using namespace std;

void arrayExample() {
    // Array specialization
    unique_ptr<int[]> arr = make_unique<int[]>(10);
    
    for (int i = 0; i < 10; ++i) {
        arr[i] = i * i;
    }
    
    // Automatically uses delete[]
}
```

### Use Cases

```cpp
#include <memory>
#include <vector>
using namespace std;

class Resource {
public:
    Resource() { cout << "Resource created" << endl; }
    ~Resource() { cout << "Resource destroyed" << endl; }
};

void useCaseExample() {
    // Factory function
    auto createResource = []() -> unique_ptr<Resource> {
        return make_unique<Resource>();
    };
    
    unique_ptr<Resource> resource = createResource();
    // Resource automatically destroyed
    
    // Container of unique_ptr
    vector<unique_ptr<Resource>> resources;
    resources.push_back(make_unique<Resource>());
    resources.push_back(make_unique<Resource>());
    // All automatically destroyed
}
```

---

## std::shared_ptr

### Basics

`shared_ptr` allows multiple pointers to share ownership of the same object. The object is destroyed when the last `shared_ptr` is destroyed.

```cpp
#include <memory>
#include <iostream>
using namespace std;

void sharedPtrBasics() {
    shared_ptr<int> p1 = make_shared<int>(42);
    cout << "Count: " << p1.use_count() << endl;  // 1
    
    {
        shared_ptr<int> p2 = p1;  // Share ownership
        cout << "Count: " << p1.use_count() << endl;  // 2
    }  // p2 destroyed
    
    cout << "Count: " << p1.use_count() << endl;  // 1
}  // p1 destroyed, object deleted
```

### Control Block

```cpp
#include <memory>
using namespace std;

void controlBlockExample() {
    // make_shared: one allocation (object + control block)
    auto p1 = make_shared<int>(42);  // Preferred
    
    // Constructor: two allocations
    shared_ptr<int> p2(new int(42));  // Less efficient
    
    // Control block contains:
    // - Reference count (strong)
    // - Weak count
    // - Deleter
    // - Allocator
}
```

### Custom Deleters

```cpp
#include <memory>
#include <iostream>
using namespace std;

void sharedPtrCustomDeleter() {
    auto deleter = [](int* p) {
        cout << "Custom delete: " << *p << endl;
        delete p;
    };
    
    shared_ptr<int> p(new int(42), deleter);
    // Custom deleter called when last shared_ptr destroyed
}
```

### Aliasing Constructor

```cpp
#include <memory>
using namespace std;

struct Node {
    int data;
    shared_ptr<Node> next;
};

void aliasingExample() {
    shared_ptr<Node> node = make_shared<Node>();
    node->data = 42;
    
    // Aliasing: share ownership of node, but point to member
    shared_ptr<int> dataPtr(node, &node->data);
    
    // node and dataPtr share ownership of Node
    // But dataPtr points to node->data
}
```

---

## std::weak_ptr

### Basics

`weak_ptr` provides non-owning access to an object managed by `shared_ptr`. It doesn't affect the reference count and can detect if the object has been destroyed.

```cpp
#include <memory>
#include <iostream>
using namespace std;

void weakPtrBasics() {
    shared_ptr<int> shared = make_shared<int>(42);
    weak_ptr<int> weak = shared;
    
    cout << "Shared count: " << shared.use_count() << endl;  // 1
    cout << "Weak expired: " << weak.expired() << endl;  // false
    
    shared.reset();  // Object destroyed
    
    cout << "Weak expired: " << weak.expired() << endl;  // true
    
    // Access via lock()
    if (auto locked = weak.lock()) {
        cout << "Value: " << *locked << endl;
    } else {
        cout << "Object destroyed" << endl;
    }
}
```

### Breaking Circular References

```cpp
#include <memory>
#include <iostream>
using namespace std;

struct Parent;
struct Child;

struct Parent {
    shared_ptr<Child> child;
    ~Parent() { cout << "Parent destroyed" << endl; }
};

struct Child {
    weak_ptr<Parent> parent;  // Use weak_ptr to break cycle
    ~Child() { cout << "Child destroyed" << endl; }
};

void circularReferenceExample() {
    shared_ptr<Parent> parent = make_shared<Parent>();
    shared_ptr<Child> child = make_shared<Child>();
    
    parent->child = child;
    child->parent = parent;
    
    // Both destroyed correctly (no memory leak)
    // If Child used shared_ptr<Parent>, neither would be destroyed
}
```

### Observer Pattern

```cpp
#include <memory>
#include <vector>
#include <algorithm>
using namespace std;

class Subject;

class Observer {
public:
    virtual ~Observer() = default;
    virtual void notify() = 0;
};

class Subject {
    vector<weak_ptr<Observer>> observers_;
    
public:
    void addObserver(weak_ptr<Observer> observer) {
        observers_.push_back(observer);
    }
    
    void notifyObservers() {
        // Remove expired observers
        observers_.erase(
            remove_if(observers_.begin(), observers_.end(),
                [](const weak_ptr<Observer>& w) { return w.expired(); }),
            observers_.end()
        );
        
        // Notify active observers
        for (auto& w : observers_) {
            if (auto observer = w.lock()) {
                observer->notify();
            }
        }
    }
};

class ConcreteObserver : public Observer {
    int id_;
public:
    ConcreteObserver(int id) : id_(id) {}
    void notify() override {
        cout << "Observer " << id_ << " notified" << endl;
    }
};

void observerExample() {
    Subject subject;
    
    {
        auto obs1 = make_shared<ConcreteObserver>(1);
        auto obs2 = make_shared<ConcreteObserver>(2);
        
        subject.addObserver(obs1);
        subject.addObserver(obs2);
        
        subject.notifyObservers();
    }  // Observers destroyed
    
    subject.notifyObservers();  // Expired observers removed
}
```

---

## Common Scenarios

### Scenario 1: Factory Pattern

```cpp
#include <memory>
#include <iostream>
using namespace std;

class Product {
public:
    virtual ~Product() = default;
    virtual void use() = 0;
};

class ConcreteProduct : public Product {
public:
    void use() override {
        cout << "Using ConcreteProduct" << endl;
    }
};

class Factory {
public:
    static unique_ptr<Product> create() {
        return make_unique<ConcreteProduct>();
    }
};

void factoryExample() {
    unique_ptr<Product> product = Factory::create();
    product->use();
}
```

### Scenario 2: Polymorphic Containers

```cpp
#include <memory>
#include <vector>
using namespace std;

class Shape {
public:
    virtual ~Shape() = default;
    virtual void draw() = 0;
};

class Circle : public Shape {
public:
    void draw() override {
        cout << "Drawing Circle" << endl;
    }
};

class Rectangle : public Shape {
public:
    void draw() override {
        cout << "Drawing Rectangle" << endl;
    }
};

void polymorphicContainerExample() {
    vector<unique_ptr<Shape>> shapes;
    shapes.push_back(make_unique<Circle>());
    shapes.push_back(make_unique<Rectangle>());
    
    for (const auto& shape : shapes) {
        shape->draw();
    }
}
```

### Scenario 3: Resource Management

```cpp
#include <memory>
#include <fstream>
using namespace std;

class FileHandler {
    unique_ptr<ifstream> file_;
    
public:
    FileHandler(const string& filename) 
        : file_(make_unique<ifstream>(filename)) {
        if (!file_->is_open()) {
            file_.reset();
        }
    }
    
    bool isOpen() const {
        return file_ != nullptr;
    }
    
    void readLine(string& line) {
        if (file_) {
            getline(*file_, line);
        }
    }
    // File automatically closed when FileHandler destroyed
};

void resourceManagementExample() {
    FileHandler handler("data.txt");
    if (handler.isOpen()) {
        string line;
        handler.readLine(line);
    }
}
```

### Scenario 4: Shared Resource Pool

```cpp
#include <memory>
#include <vector>
#include <algorithm>
using namespace std;

class Connection {
    int id_;
public:
    Connection(int id) : id_(id) {}
    void execute() {
        cout << "Connection " << id_ << " executing" << endl;
    }
};

class ConnectionPool {
    vector<shared_ptr<Connection>> pool_;
    
public:
    ConnectionPool(size_t size) {
        for (size_t i = 0; i < size; ++i) {
            pool_.push_back(make_shared<Connection>(i));
        }
    }
    
    shared_ptr<Connection> acquire() {
        if (!pool_.empty()) {
            auto conn = pool_.back();
            pool_.pop_back();
            return conn;
        }
        return nullptr;
    }
    
    void release(shared_ptr<Connection> conn) {
        pool_.push_back(conn);
    }
};

void connectionPoolExample() {
    ConnectionPool pool(3);
    
    auto conn1 = pool.acquire();
    auto conn2 = pool.acquire();
    
    conn1->execute();
    conn2->execute();
    
    pool.release(conn1);
    pool.release(conn2);
}
```

### Scenario 5: Caching with weak_ptr

```cpp
#include <memory>
#include <unordered_map>
#include <string>
using namespace std;

template<typename T>
class Cache {
    unordered_map<string, weak_ptr<T>> cache_;
    
public:
    shared_ptr<T> get(const string& key) {
        auto it = cache_.find(key);
        if (it != cache_.end()) {
            if (auto cached = it->second.lock()) {
                return cached;  // Still in memory
            } else {
                cache_.erase(it);  // Expired
            }
        }
        return nullptr;
    }
    
    void put(const string& key, shared_ptr<T> value) {
        cache_[key] = value;
    }
};

void cacheExample() {
    Cache<string> cache;
    
    {
        auto data = make_shared<string>("cached data");
        cache.put("key1", data);
        
        auto retrieved = cache.get("key1");
        if (retrieved) {
            cout << "Retrieved: " << *retrieved << endl;
        }
    }  // data destroyed
    
    auto retrieved = cache.get("key1");
    if (!retrieved) {
        cout << "Cache expired" << endl;
    }
}
```

---

## Practical Examples

### Example 1: Tree Structure

```cpp
#include <memory>
#include <vector>
using namespace std;

template<typename T>
class TreeNode {
    T data_;
    unique_ptr<TreeNode> left_;
    unique_ptr<TreeNode> right_;
    
public:
    TreeNode(T data) : data_(data) {}
    
    void setLeft(unique_ptr<TreeNode> left) {
        left_ = move(left);
    }
    
    void setRight(unique_ptr<TreeNode> right) {
        right_ = move(right);
    }
    
    T getData() const { return data_; }
    TreeNode* getLeft() const { return left_.get(); }
    TreeNode* getRight() const { return right_.get(); }
};

void treeExample() {
    auto root = make_unique<TreeNode<int>>(1);
    root->setLeft(make_unique<TreeNode<int>>(2));
    root->setRight(make_unique<TreeNode<int>>(3));
    
    // Tree automatically destroyed
}
```

### Example 2: Linked List

```cpp
#include <memory>
using namespace std;

template<typename T>
class LinkedList {
    struct Node {
        T data;
        unique_ptr<Node> next;
        Node(T d) : data(d) {}
    };
    
    unique_ptr<Node> head_;
    
public:
    void pushFront(T data) {
        auto newNode = make_unique<Node>(data);
        newNode->next = move(head_);
        head_ = move(newNode);
    }
    
    void print() {
        Node* current = head_.get();
        while (current) {
            cout << current->data << " ";
            current = current->next.get();
        }
        cout << endl;
    }
};

void linkedListExample() {
    LinkedList<int> list;
    list.pushFront(3);
    list.pushFront(2);
    list.pushFront(1);
    list.print();  // 1 2 3
}
```

### Example 3: RAII Wrapper

```cpp
#include <memory>
#include <mutex>
using namespace std;

template<typename T>
class ThreadSafeResource {
    shared_ptr<T> resource_;
    shared_ptr<mutex> mutex_;
    
public:
    ThreadSafeResource(shared_ptr<T> res, shared_ptr<mutex> mtx)
        : resource_(res), mutex_(mtx) {}
    
    class LockedAccess {
        shared_ptr<T> resource_;
        lock_guard<mutex> lock_;
    public:
        LockedAccess(shared_ptr<T> res, mutex& mtx)
            : resource_(res), lock_(mtx) {}
        T* operator->() { return resource_.get(); }
        T& operator*() { return *resource_; }
    };
    
    LockedAccess lock() {
        return LockedAccess(resource_, *mutex_);
    }
};

void raiiWrapperExample() {
    auto resource = make_shared<int>(42);
    auto mutex = make_shared<mutex>();
    
    ThreadSafeResource<int> tsr(resource, mutex);
    
    {
        auto access = tsr.lock();
        *access = 100;
    }  // Lock released
}
```

---

## Common Practices

### 1. Prefer make_unique and make_shared

```cpp
// Good: Exception safe, efficient
auto p1 = make_unique<int>(42);
auto p2 = make_shared<int>(42);

// Bad: Potential memory leak if exception occurs
unique_ptr<int> p3(new int(42));
shared_ptr<int> p4(new int(42));
```

### 2. Use unique_ptr by Default

```cpp
// Good: Clear ownership, efficient
unique_ptr<Resource> resource = createResource();

// Only use shared_ptr when you need shared ownership
shared_ptr<Resource> shared = make_shared<Resource>();
```

### 3. Pass by Reference When Not Transferring Ownership

```cpp
// Good: No ownership transfer
void process(const unique_ptr<Resource>& resource) {
    resource->doWork();
}

// Good: Transfer ownership
void takeOwnership(unique_ptr<Resource> resource) {
    // resource now owned by this function
}

// Bad: Unnecessary copy (doesn't compile for unique_ptr anyway)
void bad(unique_ptr<Resource> resource) {
    // ...
}
```

### 4. Use weak_ptr to Break Cycles

```cpp
// Good: Prevents memory leaks
struct Parent {
    shared_ptr<Child> child;
};

struct Child {
    weak_ptr<Parent> parent;  // Breaks cycle
};

// Bad: Memory leak
struct BadChild {
    shared_ptr<Parent> parent;  // Circular reference!
};
```

### 5. Check Before Using weak_ptr

```cpp
// Good: Always check
if (auto locked = weak.lock()) {
    locked->use();
} else {
    // Object destroyed
}

// Bad: May use expired pointer
auto locked = weak.lock();
locked->use();  // Crashes if expired
```

### 6. Don't Create shared_ptr from Raw Pointer Multiple Times

```cpp
// Bad: Multiple control blocks!
int* raw = new int(42);
shared_ptr<int> p1(raw);
shared_ptr<int> p2(raw);  // Undefined behavior!

// Good: Share ownership
shared_ptr<int> p1 = make_shared<int>(42);
shared_ptr<int> p2 = p1;  // Share same control block
```

---

## Common Pitfalls and Mistakes

### Pitfall 1: Circular References with shared_ptr

```cpp
// Bad: Memory leak
struct Parent {
    shared_ptr<Child> child;
};

struct Child {
    shared_ptr<Parent> parent;  // Circular reference!
};

void circularReferenceMistake() {
    auto parent = make_shared<Parent>();
    auto child = make_shared<Child>();
    parent->child = child;
    child->parent = parent;
    // Neither destroyed! Memory leak!
}

// Fix: Use weak_ptr
struct FixedChild {
    weak_ptr<Parent> parent;  // Breaks cycle
};
```

### Pitfall 2: Returning Raw Pointer from unique_ptr

```cpp
// Bad: Dangling pointer
int* badFunction() {
    unique_ptr<int> p = make_unique<int>(42);
    return p.get();  // Returns raw pointer
    // p destroyed, pointer becomes dangling
}

// Good: Return unique_ptr
unique_ptr<int> goodFunction() {
    return make_unique<int>(42);
}
```

### Pitfall 3: Storing Raw Pointer from shared_ptr

```cpp
// Bad: Object may be destroyed
void badExample() {
    int* raw = nullptr;
    {
        shared_ptr<int> shared = make_shared<int>(42);
        raw = shared.get();  // Store raw pointer
    }  // shared destroyed, object deleted
    *raw = 100;  // Undefined behavior!
}

// Good: Keep shared_ptr alive
void goodExample() {
    shared_ptr<int> shared = make_shared<int>(42);
    int* raw = shared.get();  // OK while shared exists
    *raw = 100;
}
```

### Pitfall 4: Using get() to Create Another shared_ptr

```cpp
// Bad: Multiple control blocks
void badExample() {
    shared_ptr<int> p1 = make_shared<int>(42);
    shared_ptr<int> p2(p1.get());  // Creates new control block!
    // p1 and p2 have separate control blocks
    // Double deletion when both destroyed!
}

// Good: Share ownership
void goodExample() {
    shared_ptr<int> p1 = make_shared<int>(42);
    shared_ptr<int> p2 = p1;  // Share control block
}
```

### Pitfall 5: Not Using make_shared for Arrays

```cpp
// Bad: Doesn't work as expected
shared_ptr<int[]> bad = make_shared<int[]>(10);  // May not work

// Good: Use vector or unique_ptr
shared_ptr<vector<int>> good = make_shared<vector<int>>(10);
// Or
unique_ptr<int[]> good2 = make_unique<int[]>(10);
```

### Pitfall 6: Thread Safety Misconceptions

```cpp
// Bad: shared_ptr is NOT thread-safe for the object
void badThreadSafety() {
    shared_ptr<int> shared = make_shared<int>(42);
    
    thread t1([&shared]() {
        (*shared)++;  // Data race!
    });
    
    thread t2([&shared]() {
        (*shared)++;  // Data race!
    });
    
    t1.join();
    t2.join();
}

// Good: Protect the object
void goodThreadSafety() {
    shared_ptr<int> shared = make_shared<int>(42);
    mutex mtx;
    
    thread t1([&shared, &mtx]() {
        lock_guard<mutex> lock(mtx);
        (*shared)++;
    });
    
    thread t2([&shared, &mtx]() {
        lock_guard<mutex> lock(mtx);
        (*shared)++;
    });
    
    t1.join();
    t2.join();
}
```

### Pitfall 7: Deleting Through Wrong Pointer Type

```cpp
// Bad: Undefined behavior
void badDelete() {
    int* raw = new int[10];
    delete raw;  // Should use delete[]
    // Or worse:
    unique_ptr<int> p(raw);  // Uses delete, not delete[]
}

// Good: Use array specialization
void goodDelete() {
    unique_ptr<int[]> p = make_unique<int[]>(10);
    // Automatically uses delete[]
}
```

### Pitfall 8: Exception in Constructor

```cpp
// Bad: Memory leak if exception
void badConstructor() {
    unique_ptr<Resource> p(new Resource());  // If Resource() throws, leak
    // If make_unique throws, no leak (but object not created)
}

// Good: Use make_unique (exception safe)
void goodConstructor() {
    auto p = make_unique<Resource>();
    // If Resource() throws, no memory allocated
}
```

### Pitfall 9: Using weak_ptr Without Checking

```cpp
// Bad: May use expired pointer
void badWeakPtr() {
    weak_ptr<int> weak;
    {
        shared_ptr<int> shared = make_shared<int>(42);
        weak = shared;
    }  // shared destroyed
    
    int value = *weak.lock();  // Crashes if lock() returns nullptr
}

// Good: Always check
void goodWeakPtr() {
    weak_ptr<int> weak;
    {
        shared_ptr<int> shared = make_shared<int>(42);
        weak = shared;
    }
    
    if (auto locked = weak.lock()) {
        int value = *locked;  // Safe
    }
}
```

### Pitfall 10: Mixing Smart and Raw Pointers

```cpp
// Bad: Unclear ownership
void badMixing() {
    int* raw = new int(42);
    unique_ptr<int> p(raw);
    // Later...
    delete raw;  // Double deletion!
}

// Good: Clear ownership
void goodMixing() {
    unique_ptr<int> p = make_unique<int>(42);
    // p owns the memory, no raw pointer needed
}
```

---

## Summary

Smart pointers provide automatic memory management:

- **`unique_ptr`**: Exclusive ownership, use by default
- **`shared_ptr`**: Shared ownership, use when needed
- **`weak_ptr`**: Non-owning observer, breaks cycles

Key takeaways:

1. **Prefer `make_unique` and `make_shared`**: Exception safe and efficient
2. **Use `unique_ptr` by default**: Clear ownership, better performance
3. **Use `shared_ptr` only when needed**: Shared ownership has overhead
4. **Use `weak_ptr` to break cycles**: Prevents memory leaks
5. **Never create multiple `shared_ptr` from same raw pointer**: Causes double deletion
6. **Don't store raw pointers from smart pointers**: May become dangling
7. **Protect shared objects with mutexes**: `shared_ptr` doesn't protect the object
8. **Always check `weak_ptr` before use**: May be expired

Smart pointers are essential for modern C++ and eliminate most memory management errors when used correctly.

