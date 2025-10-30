---
layout: post
title: "C++: The using Keyword - Aliases, Imports, and More"
date: 2025-10-06 00:00:00 -0000
categories: programming cpp tutorial reference language using keyword alias typedef templates inheritance enum c++20
---

# C++: The `using` Keyword - Aliases, Imports, and More

In C++, the `using` keyword has multiple purposes depending on the context. Below is a breakdown of the most common usages with concise examples.

## 1) Namespace Import (avoid globally in headers)

Simplifies long namespace names.

```cpp
#include <iostream>
using namespace std; // avoid in headers and large scopes

int main() {
    cout << "Hello, world!" << endl;  // No need for std::cout
    return 0;
}
```

Or alias a long namespace name:

```cpp
namespace ch = std::chrono;
```

## 2) Type Aliases (C++11+)

Prefer `using` over `typedef` for clarity.

```cpp
using uint = unsigned int;

uint x = 10;  // Same as: unsigned int x = 10;
```

More complex alias:

```cpp
using StringVector = std::vector<std::string>;
```

## 3) Bring Specific Names into Scope

Import only what you need instead of the whole namespace.

```cpp
using std::cout;
using std::endl;

int main() {
    cout << "Selective import" << endl;
    return 0;
}
```

## 4) Inheritance: Expose Base Overloads in Derived

Use `using` to prevent name hiding and make base overloads visible.

```cpp
class Base {
public:
    void show(int) {}
};

class Derived : public Base {
public:
    using Base::show;  // Expose Base::show(int)
    void show(double) {}
};
```

Without `using Base::show`, `Base::show(int)` would be hidden by `Derived::show(double)` due to C++ name hiding rules.

## 5) Template Aliases (C++11+)

Alias template patterns for readability.

```cpp
template<typename T>
using Vec = std::vector<T>;

Vec<int> numbers;  // Same as: std::vector<int> numbers;
```

## 6) C++20: `using enum` to Import Enumerators

Bring all enum members into the current scope.

```cpp
enum class Color { Red, Green, Blue };

using enum Color; // C++20

int main() {
    Color c = Red;  // No need for Color::Red
}
```

Requires a C++20-capable compiler and `-std=c++20`.

---

## Summary Table

| Use Case | Example | C++ Version |
|---|---|---|
| Namespace import | `using namespace std;` | C++98 |
| Namespace alias | `namespace io = std::iostream;` | C++98 |
| Type alias | `using uint = unsigned int;` | C++11+ |
| Inheritance (expose base) | `using Base::foo;` | C++98 |
| Template alias | `template<class T> using Vec = std::vector<T>;` | C++11+ |
| `using enum` | `using enum Color;` | C++20+ |

---

## Best Practices

- Prefer `using` over `typedef` in new code.
- Avoid `using namespace ...;` at global scope in headers; keep imports local.
- For libraries/APIs, expose names explicitly with `using std::...` rather than whole-namespace imports.
- Use template aliases to simplify verbose nested template types.
- When overloading in derived classes, use `using Base::method` to avoid hiding base overloads.
