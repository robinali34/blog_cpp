---
layout: post
title: "C++ Virtual Functions: Complete Guide with Examples"
date: 2025-12-04 00:00:00 -0800
categories: cpp programming tutorial oop polymorphism inheritance
tags: cpp virtual-functions polymorphism runtime-binding vtable inheritance
excerpt: "A comprehensive guide to C++ virtual functions covering syntax, vtable mechanism, runtime polymorphism, performance considerations, and best practices with practical examples."
---

# C++ Virtual Functions: Complete Guide with Examples

Virtual functions are a cornerstone of C++ polymorphism, enabling runtime binding and allowing derived classes to override base class behavior. This guide covers all aspects of virtual functions with practical examples.

## What are Virtual Functions?

A virtual function is a member function declared in a base class that can be overridden in derived classes. When called through a base class pointer or reference, the actual function called is determined at runtime based on the object's type.

### Basic Example

```cpp
#include <iostream>

class Base {
public:
    virtual void display() {
        std::cout << "Base class display()" << std::endl;
    }
    
    void nonVirtual() {
        std::cout << "Base class nonVirtual()" << std::endl;
    }
};

class Derived : public Base {
public:
    void display() override {
        std::cout << "Derived class display()" << std::endl;
    }
    
    void nonVirtual() {
        std::cout << "Derived class nonVirtual()" << std::endl;
    }
};

int main() {
    Derived derived;
    Base* basePtr = &derived;
    
    // Virtual function: runtime binding
    basePtr->display();      // Output: Derived class display()
    
    // Non-virtual function: compile-time binding
    basePtr->nonVirtual();   // Output: Base class nonVirtual()
    
    return 0;
}
```

---

## How Virtual Functions Work: VTable

C++ implements virtual functions using a **virtual function table (vtable)**:

1. Each class with virtual functions has a vtable
2. The vtable contains pointers to virtual functions
3. Objects contain a pointer to their class's vtable
4. Function calls are resolved through the vtable at runtime

### VTable Structure

```cpp
class Base {
public:
    virtual void func1() { }
    virtual void func2() { }
    int data;
};

class Derived : public Base {
public:
    void func1() override { }
    virtual void func3() { }
    int moreData;
};
```

**Base class vtable:**
```
[0] -> Base::func1()
[1] -> Base::func2()
```

**Derived class vtable:**
```
[0] -> Derived::func1()  // Overridden
[1] -> Base::func2()     // Inherited
[2] -> Derived::func3()  // New virtual function
```

---

## Virtual Function Syntax

### Declaring Virtual Functions

```cpp
class Base {
public:
    // Virtual function declaration
    virtual void func();
    
    // Pure virtual function (abstract)
    virtual void pureFunc() = 0;
    
    // Virtual destructor
    virtual ~Base();
};
```

### Overriding Virtual Functions

```cpp
class Derived : public Base {
public:
    // Override virtual function
    void func() override;
    
    // Override pure virtual function
    void pureFunc() override;
    
    // Destructor
    ~Derived() override;
};
```

---

## Runtime Polymorphism

Virtual functions enable **runtime polymorphism** (late binding), where the function to call is determined at runtime based on the actual object type.

### Example: Runtime Binding

```cpp
#include <iostream>
#include <vector>

class Animal {
public:
    virtual void makeSound() {
        std::cout << "Some animal sound" << std::endl;
    }
    
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void makeSound() override {
        std::cout << "Woof! Woof!" << std::endl;
    }
};

class Cat : public Animal {
public:
    void makeSound() override {
        std::cout << "Meow! Meow!" << std::endl;
    }
};

int main() {
    std::vector<Animal*> animals;
    
    animals.push_back(new Dog());
    animals.push_back(new Cat());
    animals.push_back(new Dog());
    
    // Runtime polymorphism: correct function called for each object
    for (Animal* animal : animals) {
        animal->makeSound();  // Calls appropriate derived class function
    }
    
    // Cleanup
    for (Animal* animal : animals) {
        delete animal;
    }
    
    return 0;
}
```

---

## Virtual Function Rules and Constraints

### 1. Virtual Functions Must Have Same Signature

```cpp
class Base {
public:
    virtual void func(int x) { }
};

class Derived : public Base {
public:
    // ✅ Correct: same signature
    void func(int x) override { }
    
    // ❌ Wrong: different signature (hiding, not overriding)
    void func(double x) { }
};
```

### 2. Covariant Return Types

Derived classes can return a more derived type when overriding virtual functions.

```cpp
class Base {
public:
    virtual Base* clone() {
        return new Base(*this);
    }
};

class Derived : public Base {
public:
    // ✅ Covariant return type
    Derived* clone() override {
        return new Derived(*this);
    }
};
```

### 3. Virtual Functions Can Be Private

```cpp
class Base {
private:
    virtual void internalFunc() {
        std::cout << "Base::internalFunc()" << std::endl;
    }
    
public:
    void callInternal() {
        internalFunc();  // Can call private virtual function
    }
};

class Derived : public Base {
private:
    void internalFunc() override {
        std::cout << "Derived::internalFunc()" << std::endl;
    }
};

int main() {
    Derived derived;
    Base* basePtr = &derived;
    
    basePtr->callInternal();  // Output: Derived::internalFunc()
    
    return 0;
}
```

### 4. Virtual Functions and Access Specifiers

```cpp
class Base {
public:
    virtual void func() { }
};

class Derived : public Base {
private:
    void func() override { }  // ⚠️ Allowed but not recommended
};
```

---

## Pure Virtual Functions

A **pure virtual function** is a virtual function with no implementation in the base class. Classes with pure virtual functions are **abstract classes** and cannot be instantiated.

### Syntax

```cpp
class AbstractBase {
public:
    // Pure virtual function
    virtual void pureFunc() = 0;
    
    // Regular virtual function
    virtual void regularFunc() {
        std::cout << "Default implementation" << std::endl;
    }
    
    virtual ~AbstractBase() = default;
};
```

### Example: Abstract Shape Class

```cpp
#include <iostream>
#include <cmath>

class Shape {
public:
    // Pure virtual function - must be overridden
    virtual double area() const = 0;
    
    // Pure virtual function
    virtual double perimeter() const = 0;
    
    // Regular virtual function with default implementation
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
    
    double perimeter() const override {
        return 2 * 3.14159 * radius;
    }
    
    void draw() const override {
        std::cout << "Drawing circle (radius: " << radius << ")" << std::endl;
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
    
    double perimeter() const override {
        return 2 * (width + height);
    }
    
    void draw() const override {
        std::cout << "Drawing rectangle (" << width << "x" << height << ")" << std::endl;
    }
};

int main() {
    // Shape shape;  // ❌ Error: cannot instantiate abstract class
    
    Circle circle(5.0);
    Rectangle rect(4.0, 6.0);
    
    Shape* shapes[] = {&circle, &rect};
    
    for (Shape* shape : shapes) {
        shape->draw();
        std::cout << "Area: " << shape->area() << std::endl;
        std::cout << "Perimeter: " << shape->perimeter() << std::endl;
    }
    
    return 0;
}
```

---

## Virtual Destructors

When using polymorphism with base class pointers, the base class **must** have a virtual destructor to ensure proper cleanup of derived class objects.

### Without Virtual Destructor (Problem)

```cpp
class Base {
public:
    ~Base() {
        std::cout << "Base destructor" << std::endl;
    }
};

class Derived : public Base {
private:
    int* data;
    
public:
    Derived() : data(new int[100]) { }
    
    ~Derived() {
        delete[] data;
        std::cout << "Derived destructor" << std::endl;
    }
};

int main() {
    Base* ptr = new Derived();
    delete ptr;  // ❌ Only Base destructor called! Memory leak!
    
    return 0;
}
```

### With Virtual Destructor (Solution)

```cpp
class Base {
public:
    virtual ~Base() {  // ✅ Virtual destructor
        std::cout << "Base destructor" << std::endl;
    }
};

class Derived : public Base {
private:
    int* data;
    
public:
    Derived() : data(new int[100]) { }
    
    ~Derived() override {
        delete[] data;
        std::cout << "Derived destructor" << std::endl;
    }
};

int main() {
    Base* ptr = new Derived();
    delete ptr;  // ✅ Both destructors called correctly
    
    return 0;
}
```

---

## Performance Considerations

### Overhead of Virtual Functions

1. **VTable lookup**: One extra indirection per virtual function call
2. **Memory overhead**: Each object stores a vtable pointer (typically 8 bytes on 64-bit)
3. **Cache effects**: VTable lookups can cause cache misses

### When to Use Virtual Functions

✅ **Use virtual functions when:**
- You need runtime polymorphism
- Base class defines interface, derived classes provide implementations
- You're using base class pointers/references to derived objects

❌ **Avoid virtual functions when:**
- Performance is critical and polymorphism isn't needed
- Functions are never overridden
- Template-based polymorphism (CRTP) is more appropriate

### Performance Example

```cpp
// Non-virtual: faster, compile-time binding
class FastBase {
public:
    void func() { }  // Direct call, no overhead
};

// Virtual: slower, runtime binding
class SlowBase {
public:
    virtual void func() { }  // VTable lookup required
};
```

---

## Advanced Topics

### Virtual Function Calls in Constructors/Destructors

Virtual function calls in constructors and destructors call the function for the current class being constructed/destructed, not the most derived class.

```cpp
class Base {
public:
    Base() {
        func();  // Calls Base::func(), not Derived::func()
    }
    
    virtual void func() {
        std::cout << "Base::func()" << std::endl;
    }
    
    virtual ~Base() {
        func();  // Calls Base::func()
    }
};

class Derived : public Base {
public:
    Derived() {
        func();  // Calls Derived::func()
    }
    
    void func() override {
        std::cout << "Derived::func()" << std::endl;
    }
    
    ~Derived() {
        func();  // Calls Derived::func()
    }
};

int main() {
    Derived d;
    // Output:
    // Base::func()  (in Base constructor)
    // Derived::func()  (in Derived constructor)
    // Derived::func()  (in Derived destructor)
    // Base::func()  (in Base destructor)
    
    return 0;
}
```

### Final Virtual Functions (C++11)

The `final` keyword prevents a virtual function from being overridden in derived classes.

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

## Best Practices

1. **Always use virtual destructors** in base classes when using polymorphism
2. **Use `override` keyword** (C++11+) to catch errors at compile-time
3. **Use `final` keyword** when you want to prevent further overriding
4. **Prefer pure virtual functions** for abstract interfaces
5. **Document virtual functions** that are meant to be overridden
6. **Avoid virtual functions** in performance-critical code paths when not needed
7. **Don't call virtual functions** in constructors/destructors expecting derived behavior

---

## Summary

Virtual functions are essential for runtime polymorphism in C++:

- **Virtual functions** enable runtime binding through vtables
- **Pure virtual functions** create abstract classes
- **Virtual destructors** are required for proper cleanup with polymorphism
- **Use `override`** keyword for compile-time checking
- **Understand performance implications** of virtual function overhead
- **Follow best practices** for effective use of virtual functions

Mastering virtual functions is crucial for effective object-oriented design in C++.

