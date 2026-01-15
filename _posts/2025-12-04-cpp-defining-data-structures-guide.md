---
layout: post
title: "C++ Defining Data Structures: Complete Guide with Examples"
date: 2026-01-14 00:00:00 -0800
categories: cpp programming tutorial data-structures algorithms
tags: cpp data-structures struct class tree-traversal dfs bfs smart-pointers
excerpt: "A comprehensive guide to defining data structures in C++ covering structs, classes, tree structures, traversal algorithms, and best practices with practical examples."
---

# C++ Defining Data Structures: Complete Guide with Examples

Defining custom data structures is fundamental to C++ programming. This guide covers how to create data structures using structs and classes, implement tree structures, and perform traversals with practical examples.

## Table of Contents

1. [Basic Data Structures](#basic-data-structures)
2. [Point Structure Example](#point-structure-example)
3. [Tree Node Structure](#tree-node-structure)
4. [Tree Traversal Algorithms](#tree-traversal-algorithms)
5. [Complete Example](#complete-example)
6. [Best Practices](#best-practices)
7. [Advanced Patterns](#advanced-patterns)

---

## Basic Data Structures

### Struct vs Class

In C++, `struct` and `class` are nearly identical. The main difference is default access:

- **struct**: Default access is `public`
- **class**: Default access is `private`

```cpp
// Struct: public by default
struct Point {
    double x, y;  // Public members
};

// Class: private by default
class Point {
    double x, y;  // Private members (need public: to access)
public:
    Point(double x_, double y_) : x(x_), y(y_) {}
};
```

---

## Point Structure Example

### Basic Point Structure

```cpp
#include <iostream>
#include <cmath>

struct Point {
    double x, y;

    // Constructor with default arguments
    Point(double x_ = 0, double y_ = 0) : x(x_), y(y_) {}
    
    // Copy constructor (default is fine for simple structs)
    Point(const Point& other) : x(other.x), y(other.y) {}
    
    // Assignment operator
    Point& operator=(const Point& other) {
        if (this != &other) {
            x = other.x;
            y = other.y;
        }
        return *this;
    }
    
    // Equality operator
    bool operator==(const Point& other) const {
        return x == other.x && y == other.y;
    }
    
    // Distance to another point
    double distanceTo(const Point& other) const {
        double dx = x - other.x;
        double dy = y - other.y;
        return std::sqrt(dx * dx + dy * dy);
    }
    
    // Print point
    void print() const {
        std::cout << "(" << x << ", " << y << ")";
    }
};

// Standalone function for distance
double distance(const Point& a, const Point& b) {
    return a.distanceTo(b);
}

int main() {
    Point p1(1, 2);
    Point p2(4, 6);
    
    std::cout << "Distance: " << distance(p1, p2) << std::endl;
    
    return 0;
}
```

---

## Tree Node Structure

### Basic Tree Node

A tree node structure that can store multiple points and have multiple children:

```cpp
#include <vector>
#include <memory>

struct PointNode {
    std::vector<std::unique_ptr<Point>> points;       // Points stored in this node
    std::vector<std::unique_ptr<PointNode>> children; // Child nodes

    // Add a point to this node
    void addPoint(double x, double y) {
        points.push_back(std::make_unique<Point>(x, y));
    }
    
    // Add a point using Point object
    void addPoint(const Point& p) {
        points.push_back(std::make_unique<Point>(p));
    }

    // Add a child node and return pointer to it
    PointNode* addChild() {
        children.push_back(std::make_unique<PointNode>());
        return children.back().get();
    }
    
    // Check if node is leaf (no children)
    bool isLeaf() const {
        return children.empty();
    }
    
    // Get number of points in this node
    size_t pointCount() const {
        return points.size();
    }
    
    // Get number of children
    size_t childCount() const {
        return children.size();
    }
};
```

### Why Use Smart Pointers?

Using `std::unique_ptr` provides:
- **Automatic memory management**: No manual `delete` needed
- **Exception safety**: Memory freed even if exceptions occur
- **Clear ownership**: Unique ownership semantics
- **RAII**: Resource Acquisition Is Initialization

---

## Tree Traversal Algorithms

### Depth-First Search (DFS)

DFS explores as far as possible along each branch before backtracking:

```cpp
#include <iostream>

// Recursive DFS
void dfs(const PointNode* node, int level = 0) {
    if (!node) return;

    // Print points at this node with indentation
    for (const auto& p : node->points) {
        for (int i = 0; i < level; ++i) {
            std::cout << "  "; // Indentation
        }
        std::cout << "(" << p->x << ", " << p->y << ")\n";
    }

    // Recurse to children
    for (const auto& child : node->children) {
        dfs(child.get(), level + 1);
    }
}

// Iterative DFS using stack
#include <stack>

void dfsIterative(const PointNode* root) {
    if (!root) return;

    std::stack<std::pair<const PointNode*, int>> stk;
    stk.push({root, 0});

    while (!stk.empty()) {
        auto [node, level] = stk.top();
        stk.pop();

        // Print points
        for (const auto& p : node->points) {
            for (int i = 0; i < level; ++i) {
                std::cout << "  ";
            }
            std::cout << "(" << p->x << ", " << p->y << ")\n";
        }

        // Push children in reverse order (to process left-to-right)
        for (auto it = node->children.rbegin(); it != node->children.rend(); ++it) {
            stk.push({it->get(), level + 1});
        }
    }
}
```

### Breadth-First Search (BFS)

BFS explores all nodes at the current depth before moving to the next level:

```cpp
#include <queue>
#include <iostream>

void bfs(const PointNode* root) {
    if (!root) return;

    std::queue<const PointNode*> q;
    q.push(root);
    int level = 0;

    while (!q.empty()) {
        size_t levelSize = q.size();
        std::cout << "Level " << level << ": ";

        // Process all nodes at current level
        for (size_t i = 0; i < levelSize; ++i) {
            const PointNode* node = q.front();
            q.pop();

            // Print points in this node
            for (const auto& p : node->points) {
                std::cout << "(" << p->x << ", " << p->y << ") ";
            }

            // Add children to queue for next level
            for (const auto& child : node->children) {
                q.push(child.get());
            }
        }
        
        std::cout << "\n";
        ++level;
    }
}
```

---

## Complete Example

Here's a complete example combining all concepts:

```cpp
#include <iostream>
#include <vector>
#include <memory>
#include <queue>
#include <cmath>
#include <stack>

// ----------------------------
// Point structure
// ----------------------------
struct Point {
    double x, y;

    Point(double x_ = 0, double y_ = 0) : x(x_), y(y_) {}
    
    double distanceTo(const Point& other) const {
        double dx = x - other.x;
        double dy = y - other.y;
        return std::sqrt(dx * dx + dy * dy);
    }
};

// Function to compute distance between two points
double distance(const Point& a, const Point& b) {
    return a.distanceTo(b);
}

// ----------------------------
// Tree Node structure
// Each node can have multiple points and multiple children
// ----------------------------
struct PointNode {
    std::vector<std::unique_ptr<Point>> points;       // Points stored in this node
    std::vector<std::unique_ptr<PointNode>> children; // Child nodes

    // Add a point to this node
    void addPoint(double x, double y) {
        points.push_back(std::make_unique<Point>(x, y));
    }

    // Add a child node
    PointNode* addChild() {
        children.push_back(std::make_unique<PointNode>());
        return children.back().get();
    }
    
    // Check if node is leaf
    bool isLeaf() const {
        return children.empty();
    }
    
    // Get total point count in subtree
    size_t totalPointCount() const {
        size_t count = points.size();
        for (const auto& child : children) {
            count += child->totalPointCount();
        }
        return count;
    }
};

// ----------------------------
// Traversal Functions
// ----------------------------

// Depth-First Traversal (Recursive)
void dfs(const PointNode* node, int level = 0) {
    if (!node) return;

    // Print points at this node
    for (const auto& p : node->points) {
        for (int i = 0; i < level; ++i) std::cout << "  "; // Indentation
        std::cout << "(" << p->x << ", " << p->y << ")\n";
    }

    // Recurse to children
    for (const auto& child : node->children) {
        dfs(child.get(), level + 1);
    }
}

// Breadth-First Traversal
void bfs(const PointNode* root) {
    if (!root) return;

    std::queue<const PointNode*> q;
    q.push(root);
    int level = 0;

    while (!q.empty()) {
        size_t levelSize = q.size();
        std::cout << "Level " << level << ": ";

        for (size_t i = 0; i < levelSize; ++i) {
            const PointNode* node = q.front();
            q.pop();

            // Print points in this node
            for (const auto& p : node->points) {
                std::cout << "(" << p->x << ", " << p->y << ") ";
            }

            // Add children to queue
            for (const auto& child : node->children) {
                q.push(child.get());
            }
        }
        std::cout << "\n";
        ++level;
    }
}

// ----------------------------
// Example usage
// ----------------------------
int main() {
    // Create root node
    auto root = std::make_unique<PointNode>();
    root->addPoint(0, 0);  // Root point

    // Add points to root
    root->addPoint(1, 1);
    root->addPoint(2, 2);

    // Add first child
    PointNode* child1 = root->addChild();
    child1->addPoint(3, 4);
    child1->addPoint(5, 6);

    // Add second child
    PointNode* child2 = root->addChild();
    child2->addPoint(7, 8);

    // Add grandchild to first child
    PointNode* grandchild = child1->addChild();
    grandchild->addPoint(9, 10);

    // ----------------------------
    // Depth-First Traversal
    // ----------------------------
    std::cout << "Depth-First Traversal:\n";
    dfs(root.get());

    // ----------------------------
    // Breadth-First Traversal
    // ----------------------------
    std::cout << "\nBreadth-First Traversal:\n";
    bfs(root.get());

    // ----------------------------
    // Example: Compute distance between two points
    // ----------------------------
    if (!root->points.empty() && !child1->points.empty()) {
        double d = distance(*root->points[0], *child1->points[0]);
        std::cout << "\nDistance between root (0,0) and first point of child1: " 
                  << d << "\n";
    }
    
    // ----------------------------
    // Tree statistics
    // ----------------------------
    std::cout << "\nTotal points in tree: " << root->totalPointCount() << "\n";
    std::cout << "Root is leaf: " << (root->isLeaf() ? "Yes" : "No") << "\n";
    std::cout << "Grandchild is leaf: " << (grandchild->isLeaf() ? "Yes" : "No") << "\n";

    // Memory automatically freed when root goes out of scope
    return 0;
}
```

**Output:**
```
Depth-First Traversal:
(0, 0)
(1, 1)
(2, 2)
  (3, 4)
  (5, 6)
    (9, 10)
  (7, 8)

Breadth-First Traversal:
Level 0: (0, 0) (1, 1) (2, 2) 
Level 1: (3, 4) (5, 6) (7, 8) 
Level 2: (9, 10) 

Distance between root (0,0) and first point of child1: 5

Total points in tree: 7
Root is leaf: No
Grandchild is leaf: Yes
```

---

## Best Practices

### 1. Use Smart Pointers

```cpp
// ✅ Good: Use unique_ptr for ownership
std::vector<std::unique_ptr<Point>> points;

// ❌ Bad: Raw pointers require manual memory management
std::vector<Point*> points;  // Who owns these? When to delete?
```

### 2. Prefer Const Correctness

```cpp
// ✅ Good: Const reference for read-only access
void printPoints(const PointNode* node) {
    for (const auto& p : node->points) {
        std::cout << p->x << ", " << p->y << "\n";
    }
}

// ❌ Bad: Non-const when not needed
void printPoints(PointNode* node) {  // Unnecessary non-const
    // ...
}
```

### 3. Use RAII Principles

```cpp
// ✅ Good: RAII - automatic cleanup
auto root = std::make_unique<PointNode>();

// ❌ Bad: Manual memory management
PointNode* root = new PointNode();
// ... use root ...
delete root;  // Easy to forget!
```

### 4. Provide Useful Methods

```cpp
struct PointNode {
    // ✅ Good: Helper methods
    bool isLeaf() const { return children.empty(); }
    size_t pointCount() const { return points.size(); }
    
    // ✅ Good: Clear interface
    PointNode* addChild() {
        children.push_back(std::make_unique<PointNode>());
        return children.back().get();
    }
};
```

### 5. Handle Edge Cases

```cpp
void dfs(const PointNode* node, int level = 0) {
    if (!node) return;  // ✅ Check for null
    
    // Safe iteration
    for (const auto& p : node->points) {
        // Process point
    }
    
    for (const auto& child : node->children) {
        dfs(child.get(), level + 1);
    }
}
```

---

## Advanced Patterns

### 1. Template-Based Data Structure

```cpp
template<typename T>
struct TreeNode {
    T data;
    std::vector<std::unique_ptr<TreeNode<T>>> children;
    
    TreeNode(const T& value) : data(value) {}
    
    TreeNode<T>* addChild(const T& value) {
        children.push_back(std::make_unique<TreeNode<T>>(value));
        return children.back().get();
    }
};

// Usage
auto root = std::make_unique<TreeNode<int>>(10);
root->addChild(20);
root->addChild(30);
```

### 2. Visitor Pattern for Traversal

```cpp
class NodeVisitor {
public:
    virtual void visit(const PointNode* node) = 0;
    virtual ~NodeVisitor() = default;
};

class PrintVisitor : public NodeVisitor {
public:
    void visit(const PointNode* node) override {
        for (const auto& p : node->points) {
            std::cout << "(" << p->x << ", " << p->y << ") ";
        }
    }
};

void traverseWithVisitor(const PointNode* node, NodeVisitor& visitor) {
    if (!node) return;
    
    visitor.visit(node);
    for (const auto& child : node->children) {
        traverseWithVisitor(child.get(), visitor);
    }
}
```

### 3. Iterator Pattern

```cpp
class PointNodeIterator {
private:
    std::queue<const PointNode*> queue;
    
public:
    PointNodeIterator(const PointNode* root) {
        if (root) queue.push(root);
    }
    
    bool hasNext() const {
        return !queue.empty();
    }
    
    const PointNode* next() {
        if (queue.empty()) return nullptr;
        
        const PointNode* node = queue.front();
        queue.pop();
        
        for (const auto& child : node->children) {
            queue.push(child.get());
        }
        
        return node;
    }
};

// Usage
PointNodeIterator it(root.get());
while (it.hasNext()) {
    const PointNode* node = it.next();
    // Process node
}
```

### 4. Binary Tree Structure

```cpp
struct BinaryNode {
    int data;
    std::unique_ptr<BinaryNode> left;
    std::unique_ptr<BinaryNode> right;
    
    BinaryNode(int value) : data(value), left(nullptr), right(nullptr) {}
};

// In-order traversal
void inOrder(const BinaryNode* node) {
    if (!node) return;
    
    inOrder(node->left.get());
    std::cout << node->data << " ";
    inOrder(node->right.get());
}
```

---

## Common Data Structure Patterns

### 1. Linked List

```cpp
struct ListNode {
    int data;
    std::unique_ptr<ListNode> next;
    
    ListNode(int value) : data(value), next(nullptr) {}
};

class LinkedList {
private:
    std::unique_ptr<ListNode> head;
    
public:
    void append(int value) {
        if (!head) {
            head = std::make_unique<ListNode>(value);
            return;
        }
        
        ListNode* current = head.get();
        while (current->next) {
            current = current->next.get();
        }
        current->next = std::make_unique<ListNode>(value);
    }
};
```

### 2. Graph Node

```cpp
struct GraphNode {
    int id;
    std::vector<GraphNode*> neighbors;  // Raw pointers for graph edges
    
    GraphNode(int nodeId) : id(nodeId) {}
    
    void addNeighbor(GraphNode* neighbor) {
        neighbors.push_back(neighbor);
    }
};
```

---

## Summary

Defining data structures in C++ involves:

- **Using struct/class**: Choose based on access needs
- **Smart pointers**: Use `std::unique_ptr` for automatic memory management
- **RAII principles**: Automatic resource management
- **Const correctness**: Use const for read-only operations
- **Traversal algorithms**: Implement DFS and BFS for tree structures
- **Clear interfaces**: Provide helpful methods and maintain encapsulation
- **Template patterns**: Create reusable generic data structures

Key takeaways:
- **Prefer smart pointers** over raw pointers
- **Use const** wherever possible
- **Implement traversal methods** for tree structures
- **Follow RAII** for automatic resource management
- **Provide clear interfaces** with useful helper methods

Mastering data structure definition is essential for effective C++ programming and algorithm implementation.

