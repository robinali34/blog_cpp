---
layout: post
title: "C++ std::string Guide: Common Methods and Usage Patterns"
date: 2025-11-24 00:00:00 -0700
categories: cpp stl string containers
permalink: /2025/11/24/cpp-string-guide/
tags: [cpp, string, stl, containers, text-processing, algorithms]
---

# C++ std::string Guide: Common Methods and Usage Patterns

A comprehensive guide to `std::string`, covering all essential methods, character classification functions, and common string manipulation patterns.

## Table of Contents

1. [String Basics](#string-basics)
2. [Element Access Methods](#element-access-methods)
3. [Modifiers](#modifiers)
4. [String Operations](#string-operations)
5. [Search and Find](#search-and-find)
6. [Character Classification](#character-classification)
7. [Common Use Cases](#common-use-cases)
8. [Best Practices](#best-practices)

---

## String Basics

`std::string` is a dynamic string container that manages character sequences with automatic memory management.

```cpp
#include <string>
#include <iostream>

int main() {
    // Default construction
    std::string str1;
    
    // Construction from C-string
    std::string str2("Hello");
    
    // Construction with count and character
    std::string str3(5, 'A');  // "AAAAA"
    
    // Copy construction
    std::string str4(str2);  // "Hello"
    
    // From substring
    std::string str5(str2, 1, 3);  // "ell" (from index 1, length 3)
    
    // From range
    std::string str6(str2.begin(), str2.end());
    
    // Initializer list (C++11)
    std::string str7{'H', 'e', 'l', 'l', 'o'};
    
    // Assignment
    std::string str8 = "World";
}
```

---

## Element Access Methods

### `operator[]` - Subscript Access

```cpp
#include <string>

int main() {
    std::string str = "Hello";
    
    // Access character (no bounds checking)
    char first = str[0];      // 'H'
    char third = str[2];      // 'l'
    char last = str[4];        // 'o'
    
    // Modify character
    str[0] = 'h';             // str: "hello"
    
    // ⚠️ No bounds checking - undefined behavior if out of range
    // char x = str[10];      // Undefined behavior!
}
```

### `at()` - Bounds-Checked Access

```cpp
#include <string>
#include <stdexcept>

int main() {
    std::string str = "Hello";
    
    // Access with bounds checking
    char first = str.at(0);   // 'H'
    
    // Throws std::out_of_range if out of bounds
    try {
        char x = str.at(10);   // Throws exception
    } catch (const std::out_of_range& e) {
        std::cout << "Out of range: " << e.what() << std::endl;
    }
}
```

### `front()` - First Character

```cpp
#include <string>

int main() {
    std::string str = "Hello";
    
    // Get first character
    char first = str.front();  // 'H'
    
    // Modify first character
    str.front() = 'h';         // str: "hello"
    
    // ⚠️ Undefined behavior if string is empty
    std::string empty;
    // char x = empty.front();  // Undefined behavior!
}
```

### `back()` - Last Character

```cpp
#include <string>

int main() {
    std::string str = "Hello";
    
    // Get last character
    char last = str.back();    // 'o'
    
    // Modify last character
    str.back() = 'O';          // str: "HellO"
    
    // ⚠️ Undefined behavior if string is empty
    std::string empty;
    // char x = empty.back();   // Undefined behavior!
}
```

**Note**: `std::string` does not have a `top()` method. `top()` is used with `std::stack`. For `std::string`, use `back()` to access the last character.

### `data()` / `c_str()` - C-String Access

```cpp
#include <string>
#include <cstdio>

int main() {
    std::string str = "Hello";
    
    // Get C-style string (null-terminated)
    const char* cstr = str.c_str();
    printf("%s\n", cstr);  // "Hello"
    
    // Get pointer to underlying array (C++17)
    const char* data = str.data();
    
    // Non-const data() (C++17)
    char* mutable_data = str.data();
    mutable_data[0] = 'h';  // str: "hello"
    
    // ⚠️ c_str() and data() become invalid if string is modified
    const char* ptr = str.c_str();
    str += " World";  // May reallocate
    // ⚠️ ptr may be invalidated
}
```

---

## Modifiers

### `push_back()` - Add Character at End

```cpp
#include <string>

int main() {
    std::string str = "Hell";
    
    // Add character to the end
    str.push_back('o');  // str: "Hello"
    str.push_back('!');  // str: "Hello!"
}
```

### `pop_back()` - Remove Last Character

```cpp
#include <string>

int main() {
    std::string str = "Hello!";
    
    // Remove last character
    str.pop_back();  // str: "Hello"
    str.pop_back();  // str: "Hell"
    
    // ⚠️ Undefined behavior if string is empty
    std::string empty;
    // empty.pop_back();  // Undefined behavior!
    
    // Safe way
    if (!str.empty()) {
        str.pop_back();
    }
}
```

### `append()` - Append to String

```cpp
#include <string>

int main() {
    std::string str = "Hello";
    
    // Append string
    str.append(" World");  // str: "Hello World"
    
    // Append substring
    std::string other = "!!!";
    str.append(other, 0, 1);  // Append first character: "Hello World!"
    
    // Append count characters
    str.append(3, '!');  // str: "Hello World!!!!"
    
    // Append from range
    std::string suffix = "END";
    str.append(suffix.begin(), suffix.end());
    
    // Using += operator (more common)
    str += " Final";  // str: "Hello World!!!!ENDFinal"
}
```

### `insert()` - Insert Characters

```cpp
#include <string>

int main() {
    std::string str = "Hello";
    
    // Insert at position
    str.insert(5, " World");  // str: "Hello World"
    
    // Insert character
    str.insert(5, 1, ',');  // str: "Hello, World"
    
    // Insert count characters
    str.insert(0, 3, '*');  // str: "***Hello, World"
    
    // Insert from another string
    std::string prefix = ">>>";
    str.insert(0, prefix);  // str: ">>>***Hello, World"
    
    // Insert from range
    str.insert(str.end(), {'!', '!', '!'});
    // str: ">>>***Hello, World!!!"
}
```

### `erase()` - Remove Characters

```cpp
#include <string>

int main() {
    std::string str = "Hello World";
    
    // Erase single character at position
    str.erase(5, 1);  // Erase 1 character at position 5
    // str: "HelloWorld"
    
    // Erase range
    str.erase(5, 5);  // Erase 5 characters starting at position 5
    // str: "Hello"
    
    // Erase from position to end
    str.erase(2);  // Erase from position 2 to end
    // str: "He"
    
    // Erase using iterator
    str = "Hello World";
    str.erase(str.begin() + 5);  // Erase character at iterator
    // str: "HelloWorld"
    
    // Erase range using iterators
    str.erase(str.begin() + 5, str.end());
    // str: "Hello"
    
    // Erase all characters matching condition
    str = "Hello123World456";
    str.erase(std::remove_if(str.begin(), str.end(),
                             [](char c) { return std::isdigit(c); }),
              str.end());
    // str: "HelloWorld"
}
```

### `replace()` - Replace Substring

```cpp
#include <string>

int main() {
    std::string str = "Hello World";
    
    // Replace substring
    str.replace(6, 5, "C++");  // Replace 5 chars at pos 6 with "C++"
    // str: "Hello C++"
    
    // Replace with different length
    str.replace(0, 5, "Hi");  // Replace 5 chars with 2 chars
    // str: "Hi C++"
    
    // Replace with count characters
    str.replace(3, 3, 5, '!');  // Replace 3 chars with 5 '!'
    // str: "Hi !!!!!"
    
    // Replace using iterators
    str = "Hello World";
    str.replace(str.begin() + 6, str.end(), "C++");
    // str: "Hello C++"
    
    // Replace all occurrences (manual)
    str = "Hello World Hello";
    size_t pos = 0;
    while ((pos = str.find("Hello", pos)) != std::string::npos) {
        str.replace(pos, 5, "Hi");
        pos += 2;  // Move past replacement
    }
    // str: "Hi World Hi"
}
```

### `clear()` - Remove All Characters

```cpp
#include <string>

int main() {
    std::string str = "Hello World";
    
    str.clear();  // Remove all characters
    // str is now empty, but capacity may remain
    
    std::cout << str.size() << std::endl;      // 0
    std::cout << str.empty() << std::endl;     // true (1)
}
```

### `swap()` - Exchange Contents

```cpp
#include <string>

int main() {
    std::string str1 = "Hello";
    std::string str2 = "World";
    
    str1.swap(str2);
    // str1: "World"
    // str2: "Hello"
    
    // Also works with std::swap
    std::swap(str1, str2);
    // str1: "Hello"
    // str2: "World"
}
```

---

## String Operations

### `substr()` - Extract Substring

```cpp
#include <string>

int main() {
    std::string str = "Hello World";
    
    // Extract substring from position
    std::string sub1 = str.substr(6);  // "World"
    
    // Extract substring with length
    std::string sub2 = str.substr(0, 5);  // "Hello"
    
    // Extract from middle
    std::string sub3 = str.substr(6, 5);  // "World"
}
```

### `compare()` - Compare Strings

```cpp
#include <string>

int main() {
    std::string str1 = "Hello";
    std::string str2 = "World";
    std::string str3 = "Hello";
    
    // Compare entire strings
    int result1 = str1.compare(str2);  // < 0 (str1 < str2)
    int result2 = str1.compare(str3);  // 0 (str1 == str3)
    
    // Compare substrings
    int result3 = str1.compare(0, 2, str2, 0, 2);  // Compare "He" with "Wo"
    
    // Using operators (more common)
    if (str1 < str2) {
        std::cout << "str1 is less than str2" << std::endl;
    }
    
    if (str1 == str3) {
        std::cout << "str1 equals str3" << std::endl;
    }
}
```

### `stoi()`, `stol()`, `stoll()` - String to Number

```cpp
#include <string>
#include <iostream>

int main() {
    std::string str1 = "123";
    std::string str2 = "456.789";
    std::string str3 = "  789  ";
    
    // String to int
    int num1 = std::stoi(str1);  // 123
    
    // String to long
    long num2 = std::stol(str1);  // 123
    
    // String to long long
    long long num3 = std::stoll(str1);  // 123
    
    // With base
    std::string hex = "FF";
    int num4 = std::stoi(hex, nullptr, 16);  // 255 (hexadecimal)
    
    // With position pointer
    size_t pos;
    int num5 = std::stoi(str3, &pos);  // 789, pos points after number
    
    // ⚠️ Throws std::invalid_argument or std::out_of_range on error
    try {
        int num = std::stoi("not a number");
    } catch (const std::invalid_argument& e) {
        std::cout << "Invalid argument" << std::endl;
    }
}
```

### `to_string()` - Number to String

```cpp
#include <string>

int main() {
    int num = 123;
    
    // Convert number to string
    std::string str = std::to_string(num);  // "123"
    
    double d = 3.14;
    std::string str2 = std::to_string(d);  // "3.140000"
    
    long long ll = 1234567890LL;
    std::string str3 = std::to_string(ll);  // "1234567890"
}
```

---

## Search and Find

### `find()` - Find Substring

```cpp
#include <string>

int main() {
    std::string str = "Hello World Hello";
    
    // Find first occurrence
    size_t pos1 = str.find("World");  // 6
    size_t pos2 = str.find("Hello");  // 0
    
    // Find from position
    size_t pos3 = str.find("Hello", 1);  // 12 (second occurrence)
    
    // Find character
    size_t pos4 = str.find('o');  // 4
    
    // Not found returns npos
    size_t pos5 = str.find("XYZ");  // std::string::npos
    
    // Check if found
    if (pos5 != std::string::npos) {
        std::cout << "Found at position " << pos5 << std::endl;
    } else {
        std::cout << "Not found" << std::endl;
    }
}
```

### `rfind()` - Find Last Occurrence

```cpp
#include <string>

int main() {
    std::string str = "Hello World Hello";
    
    // Find last occurrence
    size_t pos1 = str.rfind("Hello");  // 12 (last occurrence)
    size_t pos2 = str.rfind('o');      // 15 (last 'o')
    
    // Find from position (searching backwards)
    size_t pos3 = str.rfind("Hello", 10);  // 0 (found before position 10)
}
```

### `find_first_of()` - Find First of Any Character

```cpp
#include <string>

int main() {
    std::string str = "Hello World";
    
    // Find first occurrence of any character in set
    size_t pos1 = str.find_first_of("aeiou");  // 1 ('e')
    size_t pos2 = str.find_first_of("xyz");    // npos (not found)
    
    // Find from position
    size_t pos3 = str.find_first_of("aeiou", 2);  // 4 ('o')
}
```

### `find_last_of()` - Find Last of Any Character

```cpp
#include <string>

int main() {
    std::string str = "Hello World";
    
    // Find last occurrence of any character in set
    size_t pos1 = str.find_last_of("aeiou");  // 7 ('o' in "World")
    size_t pos2 = str.find_last_of("Hd");     // 10 ('d')
}
```

### `find_first_not_of()` - Find First Not in Set

```cpp
#include <string>

int main() {
    std::string str = "   Hello World";
    
    // Find first character not in set
    size_t pos1 = str.find_first_not_of(" ");  // 3 (first non-space)
    size_t pos2 = str.find_first_not_of("Helo Wrd");  // npos (all match)
}
```

### `find_last_not_of()` - Find Last Not in Set

```cpp
#include <string>

int main() {
    std::string str = "Hello World   ";
    
    // Find last character not in set
    size_t pos1 = str.find_last_not_of(" ");  // 10 (last non-space)
}
```

---

## Character Classification

Character classification functions are in `<cctype>` header, not string methods, but are commonly used with strings.

### `isalpha()` - Check if Alphabetic

```cpp
#include <string>
#include <cctype>
#include <algorithm>

int main() {
    std::string str = "Hello123World";
    
    // Check single character
    if (std::isalpha(str[0])) {
        std::cout << "First character is alphabetic" << std::endl;
    }
    
    // Check all characters
    bool all_alpha = std::all_of(str.begin(), str.end(),
                                 [](char c) { return std::isalpha(c); });
    // false (contains digits)
    
    // Count alphabetic characters
    int alpha_count = std::count_if(str.begin(), str.end(),
                                    [](char c) { return std::isalpha(c); });
    // 10 (H, e, l, l, o, W, o, r, l, d)
    
    // Remove non-alphabetic characters
    str.erase(std::remove_if(str.begin(), str.end(),
                             [](char c) { return !std::isalpha(c); }),
              str.end());
    // str: "HelloWorld"
}
```

### Other Character Classification Functions

```cpp
#include <cctype>
#include <string>
#include <algorithm>

int main() {
    std::string str = "Hello123 World!";
    
    // isdigit() - Check if digit
    bool has_digit = std::any_of(str.begin(), str.end(),
                                  [](char c) { return std::isdigit(c); });
    
    // isalnum() - Check if alphanumeric
    bool is_alnum = std::isalnum('A');  // true
    
    // isspace() - Check if whitespace
    int space_count = std::count_if(str.begin(), str.end(),
                                    [](char c) { return std::isspace(c); });
    
    // isupper() - Check if uppercase
    bool has_upper = std::any_of(str.begin(), str.end(),
                                  [](char c) { return std::isupper(c); });
    
    // islower() - Check if lowercase
    bool has_lower = std::any_of(str.begin(), str.end(),
                                  [](char c) { return std::islower(c); });
    
    // ispunct() - Check if punctuation
    int punct_count = std::count_if(str.begin(), str.end(),
                                     [](char c) { return std::ispunct(c); });
    
    // Character conversion
    char upper = std::toupper('a');  // 'A'
    char lower = std::tolower('A');  // 'a'
    
    // Convert entire string to uppercase
    std::transform(str.begin(), str.end(), str.begin(),
                   [](char c) { return std::toupper(c); });
    // str: "HELLO123 WORLD!"
}
```

---

## Common Use Cases

### 1. String Validation

```cpp
#include <string>
#include <cctype>
#include <algorithm>

bool isValidEmail(const std::string& email) {
    // Simple email validation
    if (email.empty()) return false;
    
    size_t at_pos = email.find('@');
    if (at_pos == std::string::npos || at_pos == 0) return false;
    
    size_t dot_pos = email.find('.', at_pos);
    if (dot_pos == std::string::npos) return false;
    
    return true;
}

bool isNumeric(const std::string& str) {
    if (str.empty()) return false;
    
    return std::all_of(str.begin(), str.end(),
                       [](char c) { return std::isdigit(c); });
}

bool isAlphabetic(const std::string& str) {
    return std::all_of(str.begin(), str.end(),
                       [](char c) { return std::isalpha(c); });
}
```

### 2. String Tokenization

```cpp
#include <string>
#include <vector>
#include <sstream>

std::vector<std::string> split(const std::string& str, char delimiter) {
    std::vector<std::string> tokens;
    std::stringstream ss(str);
    std::string token;
    
    while (std::getline(ss, token, delimiter)) {
        tokens.push_back(token);
    }
    
    return tokens;
}

// Manual tokenization
std::vector<std::string> splitManual(const std::string& str, char delimiter) {
    std::vector<std::string> tokens;
    size_t start = 0;
    size_t pos = str.find(delimiter);
    
    while (pos != std::string::npos) {
        tokens.push_back(str.substr(start, pos - start));
        start = pos + 1;
        pos = str.find(delimiter, start);
    }
    tokens.push_back(str.substr(start));  // Last token
    
    return tokens;
}

int main() {
    std::string str = "apple,banana,cherry";
    auto tokens = split(str, ',');
    // tokens: {"apple", "banana", "cherry"}
}
```

### 3. String Trimming

```cpp
#include <string>
#include <cctype>
#include <algorithm>

// Trim whitespace from left
std::string trimLeft(const std::string& str) {
    size_t start = str.find_first_not_of(" \t\n\r");
    if (start == std::string::npos) return "";
    return str.substr(start);
}

// Trim whitespace from right
std::string trimRight(const std::string& str) {
    size_t end = str.find_last_not_of(" \t\n\r");
    if (end == std::string::npos) return "";
    return str.substr(0, end + 1);
}

// Trim from both sides
std::string trim(const std::string& str) {
    return trimRight(trimLeft(str));
}

// Using algorithms
std::string trimAlgorithm(const std::string& str) {
    auto start = std::find_if_not(str.begin(), str.end(),
                                  [](char c) { return std::isspace(c); });
    auto end = std::find_if_not(str.rbegin(), str.rend(),
                                 [](char c) { return std::isspace(c); }).base();
    
    if (start >= end) return "";
    return std::string(start, end);
}
```

### 4. String Replacement (All Occurrences)

```cpp
#include <string>

void replaceAll(std::string& str, const std::string& from, 
                const std::string& to) {
    if (from.empty()) return;
    
    size_t pos = 0;
    while ((pos = str.find(from, pos)) != std::string::npos) {
        str.replace(pos, from.length(), to);
        pos += to.length();
    }
}

int main() {
    std::string str = "Hello World Hello";
    replaceAll(str, "Hello", "Hi");
    // str: "Hi World Hi"
}
```

### 5. Case Conversion

```cpp
#include <string>
#include <algorithm>
#include <cctype>

std::string toUpper(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(),
                   [](char c) { return std::toupper(c); });
    return result;
}

std::string toLower(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(),
                   [](char c) { return std::tolower(c); });
    return result;
}

int main() {
    std::string str = "Hello World";
    std::string upper = toUpper(str);  // "HELLO WORLD"
    std::string lower = toLower(str);  // "hello world"
}
```

### 6. String Reversal

```cpp
#include <string>
#include <algorithm>

int main() {
    std::string str = "Hello";
    
    // Reverse in place
    std::reverse(str.begin(), str.end());
    // str: "olleH"
    
    // Create reversed copy
    std::string original = "World";
    std::string reversed(original.rbegin(), original.rend());
    // reversed: "dlroW"
}
```

### 7. Parsing Numbers from String

```cpp
#include <string>
#include <sstream>

int parseInt(const std::string& str) {
    std::istringstream iss(str);
    int value;
    iss >> value;
    return value;
}

double parseDouble(const std::string& str) {
    return std::stod(str);
}

// With error handling
bool tryParseInt(const std::string& str, int& value) {
    try {
        value = std::stoi(str);
        return true;
    } catch (const std::exception&) {
        return false;
    }
}
```

---

## Best Practices

### ✅ Do's

1. **Use `empty()` instead of `size() == 0`**
   ```cpp
   if (str.empty()) { }  // Clearer intent
   ```

2. **Check bounds or use `at()` for safety**
   ```cpp
   if (index < str.size()) {
       char c = str[index];
   }
   // Or
   try {
       char c = str.at(index);
   } catch (const std::out_of_range&) { }
   ```

3. **Use `find()` result properly**
   ```cpp
   size_t pos = str.find("substring");
   if (pos != std::string::npos) {
       // Found
   }
   ```

4. **Prefer `std::string` over C-strings for new code**
   ```cpp
   std::string str = "Hello";  // Modern C++
   // vs
   const char* cstr = "Hello";  // C-style
   ```

5. **Use range-based for loops when possible**
   ```cpp
   for (char c : str) {
       // Process character
   }
   ```

### ⚠️ Don'ts

1. **Don't use `operator[]` without bounds checking**
   ```cpp
   // ⚠️ Bad
   char c = str[100];  // Undefined behavior if out of range
   
   // ✅ Good
   if (100 < str.size()) {
       char c = str[100];
   }
   ```

2. **Don't use `c_str()` pointer after modification**
   ```cpp
   const char* ptr = str.c_str();
   str += " more";  // May reallocate
   // ⚠️ ptr may be invalidated
   ```

3. **Don't use `pop_back()` on empty string**
   ```cpp
   std::string str;
   // ⚠️ str.pop_back();  // Undefined behavior
   
   // ✅ Good
   if (!str.empty()) {
       str.pop_back();
   }
   ```

4. **Don't mix `std::string` and C-strings carelessly**
   ```cpp
   std::string str = "Hello";
   // ⚠️ str += NULL;  // Undefined behavior
   
   // ✅ Good
   const char* cstr = str.c_str();
   ```

5. **Don't forget to check `find()` return value**
   ```cpp
   // ⚠️ Bad
   size_t pos = str.find("sub");
   str.substr(pos);  // Undefined if pos == npos
   
   // ✅ Good
   size_t pos = str.find("sub");
   if (pos != std::string::npos) {
       str.substr(pos);
   }
   ```

### Performance Tips

1. **Reserve capacity when you know approximate size**
   ```cpp
   std::string str;
   str.reserve(1000);  // Prevents reallocations
   ```

2. **Use `append()` or `+=` instead of `+` for concatenation**
   ```cpp
   // ✅ Efficient
   str += " World";
   str.append(" World");
   
   // ⚠️ Less efficient (creates temporary)
   str = str + " World";
   ```

3. **Use `emplace_back()` for single characters**
   ```cpp
   str.push_back('c');  // Good
   str += 'c';         // Also good
   ```

4. **Consider `std::string_view` (C++17) for read-only operations**
   ```cpp
   void process(const std::string_view& sv) {
       // No copy, just view
   }
   ```

---

## Summary

`std::string` is essential for text processing in C++. Key takeaways:

- **Element access**: `operator[]`, `at()`, `front()`, `back()`, `data()`, `c_str()`
- **Modifiers**: `push_back()`, `pop_back()`, `append()`, `insert()`, `erase()`, `replace()`, `clear()`, `swap()`
- **Operations**: `substr()`, `compare()`, `stoi()`, `to_string()`
- **Search**: `find()`, `rfind()`, `find_first_of()`, `find_last_of()`, `find_first_not_of()`, `find_last_not_of()`
- **Character classification**: `isalpha()`, `isdigit()`, `isspace()`, etc. (from `<cctype>`)
- **Best practices**: Always check bounds, use `empty()`, handle `find()` return values properly

**Note**: `std::string` does not have a `top()` method. Use `back()` to access the last character. `isalpha()` and other character classification functions are from `<cctype>`, not string methods, but are commonly used with strings.

Mastering `std::string` is crucial for effective C++ text processing!

