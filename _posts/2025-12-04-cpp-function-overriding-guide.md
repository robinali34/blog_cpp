---
layout: post
title: "C++ Function Overriding: Complete Guide with Examples"
date: 2025-12-04 00:00:00 -0800
categories: cpp programming tutorial oop polymorphism inheritance
tags: cpp function-overriding override inheritance polymorphism virtual-functions
excerpt: "A comprehensive guide to C++ function overriding covering syntax, rules, override keyword, hiding vs overriding, and best practices with practical examples."
---

# C++ Function Overriding: Complete Guide with Examples

Function overriding is a fundamental concept in C++ object-oriented programming that allows derived classes to provide specific implementations of functions defined in base classes. This guide covers all aspects of function overriding with practical examples.

## What is Function Overriding?

Function overriding occurs when a derived class defines a function with the same name, return type, and parameters as a function in its base class. The derived class function "overrides" the base class function, providing a new implementation.

### Basic Example

```cpp
#include <iostream>

class Base {
public:
    void display() {
        std::cout << "Base class display()" << std::endl;
    }
    
    void show(int x) {
        std::cout << "Base class show(): " << x << std::endl;
    }
};

class Derived : public Base {
public:
    // Override display()
    void display() {
        std::cout << "Derived class display()" << std::endl;
    }
    
    // Override show()
    void show(int x) {
        std::cout << "Derived class show(): " << x << std::endl;
    }
};

int main() {
    Base base;
    Derived derived;
    
    base.display();    // Output: Base class display()
    derived.display();  // Output: Derived class display()
    
    base.show(10);     // Output: Base class show(): 10
    derived.show(20);  // Output: Derived class show(): 20
    
    return 0;
}
```

---

## Function Overriding vs Function Hiding

### Function Hiding (Without Virtual)

When a base class function is **not** virtual, the derived class function **hides** it rather than overrides it. The function to call is determined at compile-time based on the pointer/reference type.

```cpp
class Base {
public:
    void func() {
        std::cout << "Base::func()" << std::endl;
    }
};

class Derived : public Base {
public:
    void func() {
        std::cout << "Derived::func()" << std::endl;
    }
};

int main() {
    Derived derived;
    Base* basePtr = &derived;
    
    derived.func();     // Output: Derived::func()
    basePtr->func();   // Output: Base::func() (hiding, not overriding)
    
    return 0;
}
```

### Function Overriding (With Virtual)

When a base class function is **virtual**, the derived class function **overrides** it. The function to call is determined at runtime based on the actual object type.

```cpp
class Base {
public:
    virtual void func() {
        std::cout << "Base::func()" << std::endl;
    }
};

class Derived : public Base {
public:
    void func() override {  // C++11: override keyword
        std::cout << "Derived::func()" << std::endl;
    }
};

int main() {
    Derived derived;
    Base* basePtr = &derived;
    
    derived.func();     // Output: Derived::func()
    basePtr->func();    // Output: Derived::func() (runtime polymorphism)
    
    return 0;
}
```

---

## The `override` Keyword (C++11)

The `override` keyword explicitly indicates that a function is intended to override a virtual function from the base class. It provides compile-time checking and improves code clarity.

### Benefits of `override`

1. **Compile-time checking**: Compiler verifies that the function actually overrides a base class function
2. **Code clarity**: Makes intent explicit
3. **Error prevention**: Catches mistakes like typos or signature mismatches

```cpp
class Base {
public:
    virtual void func(int x) {
        std::cout << "Base::func(int)" << std::endl;
    }
    
    virtual void process() const {
        std::cout << "Base::process()" << std::endl;
    }
};

class Derived : public Base {
public:
    // Compile error: doesn't override (missing const)
    // void process() override { }  // Error!
    
    // Correct override
    void process() const override {
        std::cout << "Derived::process()" << std::endl;
    }
    
    // Compile error: doesn't override (wrong parameter type)
    // void func(double x) override { }  // Error!
    
    // Correct override
    void func(int x) override {
        std::cout << "Derived::func(int)" << std::endl;
    }
};
```

---

## Rules for Function Overriding

### 1. Function Signature Must Match

The function signature (name, parameters, const/volatile qualifiers) must match exactly.

```cpp
class Base {
public:
    virtual void func(int x) { }
    virtual void process() const { }
};

class Derived : public Base {
public:
    // ✅ Correct: exact match
    void func(int x) override { }
    
    // ✅ Correct: const matches
    void process() const override { }
    
    // ❌ Wrong: different parameter type (hiding, not overriding)
    void func(double x) { }
    
    // ❌ Wrong: missing const (hiding, not overriding)
    void process() { }
};
```

### 2. Return Type Must Be Compatible

For non-virtual functions, return types must match exactly. For virtual functions, return types can be covariant (derived class can return a more derived type).

```cpp
class Base {
public:
    virtual Base* clone() {
        return new Base(*this);
    }
};

class Derived : public Base {
public:
    // ✅ Covariant return type: Derived* is compatible with Base*
    Derived* clone() override {
        return new Derived(*this);
    }
};
```

### 3. Access Specifier Can Differ

The access specifier (public, protected, private) can be different in the derived class, but this is generally not recommended.

```cpp
class Base {
public:
    virtual void func() { }
};

class Derived : public Base {
private:
    // ⚠️ Allowed but not recommended
    void func() override { }
};
```

### 4. Virtual Destructor Should Be Used

When overriding functions, the base class should have a virtual destructor to ensure proper cleanup.

```cpp
class Base {
public:
    virtual ~Base() { }  // Virtual destructor
    virtual void func() { }
};

class Derived : public Base {
public:
    ~Derived() { }  // Destructor
    void func() override { }
};
```

---

## Practical Examples

### Example 1: Shape Hierarchy

```cpp
#include <iostream>
#include <cmath>

class Shape {
public:
    virtual double area() const = 0;  // Pure virtual
    virtual void draw() const {
        std::cout << "Drawing shape" << std::endl;
    }
    
    virtual ~Shape() = default;
};

class Circle : public Shape {
private:
    double radius;
    
public:
    Circle(double r) : radius(r) { }
    
    double area() const override {
        return 3.14159 * radius * radius;
    }
    
    void draw() const override {
        std::cout << "Drawing circle with radius " << radius << std::endl;
    }
};

class Rectangle : public Shape {
private:
    double width, height;
    
public:
    Rectangle(double w, double h) : width(w), height(h) { }
    
    double area() const override {
        return width * height;
    }
    
    void draw() const override {
        std::cout << "Drawing rectangle " << width << "x" << height << std::endl;
    }
};

int main() {
    Circle circle(5.0);
    Rectangle rect(4.0, 6.0);
    
    Shape* shapes[] = {&circle, &rect};
    
    for (Shape* shape : shapes) {
        shape->draw();  // Runtime polymorphism
        std::cout << "Area: " << shape->area() << std::endl;
    }
    
    return 0;
}
```

### Example 2: Animal Hierarchy

```cpp
#include <iostream>
#include <string>

class Animal {
public:
    virtual void makeSound() const {
        std::cout << "Some generic animal sound" << std::endl;
    }
    
    virtual void move() const {
        std::cout << "Animal moves" << std::endl;
    }
    
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void makeSound() const override {
        std::cout << "Woof! Woof!" << std::endl;
    }
    
    void move() const override {
        std::cout << "Dog runs on four legs" << std::endl;
    }
};

class Bird : public Animal {
public:
    void makeSound() const override {
        std::cout << "Chirp! Chirp!" << std::endl;
    }
    
    void move() const override {
        std::cout << "Bird flies" << std::endl;
    }
};

int main() {
    Dog dog;
    Bird bird;
    
    Animal* animals[] = {&dog, &bird};
    
    for (Animal* animal : animals) {
        animal->makeSound();
        animal->move();
    }
    
    return 0;
}
```

---

## Common Pitfalls and Best Practices

### Pitfall 1: Forgetting `virtual` in Base Class

```cpp
class Base {
public:
    void func() { }  // ❌ Not virtual - will hide, not override
};

class Derived : public Base {
public:
    void func() override { }  // ❌ Error: no function to override
};
```

**Solution**: Always use `virtual` in base class for functions that should be overridable.

### Pitfall 2: Signature Mismatch

```cpp
class Base {
public:
    virtual void func(int x) { }
};

class Derived : public Base {
public:
    void func(double x) { }  // ❌ Hiding, not overriding (different parameter type)
};
```

**Solution**: Use `override` keyword to catch these errors at compile-time.

### Pitfall 3: Missing `const` Qualifier

```cpp
class Base {
public:
    virtual void process() const { }
};

class Derived : public Base {
public:
    void process() { }  // ❌ Hiding, not overriding (missing const)
};
```

**Solution**: Match all qualifiers exactly, including `const`, `volatile`, and `noexcept`.

### Best Practices

1. **Always use `override` keyword** in C++11 and later
2. **Use `virtual` in base class** for functions that should be overridable
3. **Use virtual destructor** in base class when using polymorphism
4. **Match function signatures exactly** (name, parameters, qualifiers)
5. **Document intended overrides** in base class documentation
6. **Use `final` keyword** to prevent further overriding when needed

---

## The `final` Keyword (C++11)

The `final` keyword prevents a function from being overridden in derived classes.

```cpp
class Base {
public:
    virtual void func() { }
};

class Derived : public Base {
public:
    void func() override final { }  // Cannot be overridden further
};

class FurtherDerived : public Derived {
public:
    // ❌ Error: cannot override final function
    // void func() override { }
};
```

---

## Summary

Function overriding is essential for runtime polymorphism in C++:

- **Function overriding** allows derived classes to provide specific implementations
- **Use `virtual`** in base class to enable runtime polymorphism
- **Use `override`** keyword (C++11+) for compile-time checking and clarity
- **Match signatures exactly** including const/volatile qualifiers
- **Use virtual destructors** in base classes with polymorphism
- **Follow best practices** to avoid common pitfalls

Understanding function overriding is crucial for effective object-oriented design in C++.

