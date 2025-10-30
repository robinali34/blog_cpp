---
layout: post
title: "C++20 Bit Manipulation Utilities - Complete Guide"
date: 2025-10-14 16:00:40 -0700
categories: cpp programming tutorial cpp20 bit-manipulation algorithm interview-preparation competitive-programming
---

# C++20 Bit Manipulation Utilities - Complete Guide

Bit manipulation is a popular topic in C++ coding interviews, especially for roles that involve algorithmic thinking and performance optimization. Since C++20, the STL introduced several new bit manipulation utilities in the `<bit>` header that simplify many classic operations.

## 🔧 C++20 Bit Manipulation Utilities

You must include the header:

```cpp
#include <bit>
```

These are part of the `std` namespace.

### Common Functions

| Function | Description |
|----------|-------------|
| `std::countl_zero(x)` | Counts leading zeros |
| `std::countl_one(x)` | Counts leading ones |
| `std::countr_zero(x)` | Counts trailing zeros |
| `std::countr_one(x)` | Counts trailing ones |
| `std::popcount(x)` | Counts number of set bits (1s) |
| `std::has_single_bit(x)` | Checks if exactly one bit is set |
| `std::bit_ceil(x)` | Smallest power of 2 ≥ x |
| `std::bit_floor(x)` | Largest power of 2 ≤ x |
| `std::bit_width(x)` | # of bits needed to represent x |

## Top Interview Questions with Answers (Using C++20 Features)

### 1. Check if a number is a power of two

```cpp
bool isPowerOfTwo(unsigned int x) {
    return std::has_single_bit(x);
}
```

💡 **C++20 makes this extremely clean with `std::has_single_bit`.**

### 2. Count number of set bits (1s)

```cpp
int countBits(unsigned int x) {
    return std::popcount(x);
}
```

✅ **Equivalent to `__builtin_popcount(x)` in GCC, but standard and portable.**

### 3. Round up to the nearest power of two

```cpp
unsigned int nextPowerOfTwo(unsigned int x) {
    return std::bit_ceil(x);
}
```

📌 **Example:** `bit_ceil(9)` → `16`.

### 4. Get the number of bits required to represent a number

```cpp
int bitLength(unsigned int x) {
    return std::bit_width(x);
}
```

✏️ **Think of it like `floor(log2(x)) + 1`.**

### 5. Find the position of the lowest set bit (1-based)

```cpp
int lowestSetBitPos(unsigned int x) {
    if (x == 0) return 0;
    return std::countr_zero(x) + 1;
}
```

✅ **Much cleaner than manually shifting bits.**

### 6. Reverse bits

```cpp
uint32_t reverseBits(uint32_t x) {
    return std::byteswap(std::bit_cast<uint32_t>(
        __builtin_bitreverse32(x)));
}
```

📌 **There's no standard `bit_reverse()` in C++20, but compilers like GCC/Clang provide `__builtin_bitreverse32`.**

##  Common Interview Problems Using Bit Tricks

Here are popular LeetCode/FAANG-style problems you can solve efficiently with bit manipulation:

| Problem | Idea |
|---------|------|
| Single Number | XOR all elements: `a^a = 0`, `0^b = b` |
| Number of 1 Bits | Use `std::popcount(x)` |
| Power of Two | `std::has_single_bit(x)` |
| Hamming Distance | `std::popcount(x ^ y)` |
| Find the Missing Number | XOR with indices |
| Sum of Two Integers | Use bitwise operators only |
| Reverse Bits | Use loop or `__builtin_bitreverse32` |
| Total Hamming Distance | Count 1s at each bit position |

##  Bit Manipulation Tips for Interviews

### Essential Bit Tricks

1. **XOR is your friend:**
   - Cancels duplicates
   - Finds missing elements

2. **Shift operations:**
   - Right shifts (`>>`) divide by 2
   - Left shifts (`<<`) multiply by 2

3. **Common patterns:**
   - `x & (x - 1)` removes the lowest set bit
   - `x & -x` isolates the lowest set bit

4. **Use C++20 utilities:**
   - Use `std::bit_ceil` instead of manual loops or hacks to round up powers of 2

##  Detailed Examples

### Example 1: Power of Two Detection

```cpp
#include <bit>
#include <iostream>

bool isPowerOfTwo(int n) {
    return n > 0 && std::has_single_bit(n);
}

int main() {
    std::cout << isPowerOfTwo(8) << std::endl;   // 1 (true)
    std::cout << isPowerOfTwo(9) << std::endl;   // 0 (false)
    std::cout << isPowerOfTwo(16) << std::endl;  // 1 (true)
    return 0;
}
```

### Example 2: Bit Counting

```cpp
#include <bit>
#include <iostream>

int main() {
    unsigned int x = 0b10110110; // 182 in decimal
    
    std::cout << "Number: " << x << std::endl;
    std::cout << "Set bits: " << std::popcount(x) << std::endl;
    std::cout << "Leading zeros: " << std::countl_zero(x) << std::endl;
    std::cout << "Trailing zeros: " << std::countr_zero(x) << std::endl;
    
    return 0;
}
```

**Output:**
```
Number: 182
Set bits: 5
Leading zeros: 25
Trailing zeros: 1
```

### Example 3: Power of Two Operations

```cpp
#include <bit>
#include <iostream>

int main() {
    unsigned int x = 9;
    
    std::cout << "Input: " << x << std::endl;
    std::cout << "Next power of 2: " << std::bit_ceil(x) << std::endl;
    std::cout << "Previous power of 2: " << std::bit_floor(x) << std::endl;
    std::cout << "Bit width: " << std::bit_width(x) << std::endl;
    
    return 0;
}
```

**Output:**
```
Input: 9
Next power of 2: 16
Previous power of 2: 8
Bit width: 4
```

##  Advanced Bit Manipulation Techniques

### 1. Finding Missing Number (LeetCode 268)

```cpp
int missingNumber(vector<int>& nums) {
    int n = nums.size();
    int expected = 0;
    int actual = 0;
    
    // XOR with expected numbers 0 to n
    for (int i = 0; i <= n; i++) {
        expected ^= i;
    }
    
    // XOR with actual numbers
    for (int num : nums) {
        actual ^= num;
    }
    
    return expected ^ actual;
}
```

### 2. Single Number (LeetCode 136)

```cpp
int singleNumber(vector<int>& nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;  // XOR cancels duplicates
    }
    return result;
}
```

### 3. Hamming Distance (LeetCode 461)

```cpp
int hammingDistance(int x, int y) {
    return std::popcount(x ^ y);
}
```

##  Performance Comparison

| Operation | Traditional Method | C++20 Method | Performance |
|-----------|-------------------|--------------|-------------|
| Count set bits | Manual loop | `std::popcount` | Much faster |
| Check power of 2 | `x && !(x & (x-1))` | `std::has_single_bit` | Cleaner, same speed |
| Next power of 2 | Manual calculation | `std::bit_ceil` | Optimized |
| Bit width | `log2(x) + 1` | `std::bit_width` | Faster |

##  Practice Problems

### Easy Level
- [136. Single Number](https://leetcode.com/problems/single-number/)
- [191. Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/)
- [231. Power of Two](https://leetcode.com/problems/power-of-two/)

### Medium Level
- [268. Missing Number](https://leetcode.com/problems/missing-number/)
- [371. Sum of Two Integers](https://leetcode.com/problems/sum-of-two-integers/)
- [461. Hamming Distance](https://leetcode.com/problems/hamming-distance/)

### Hard Level
- [421. Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/)
- [137. Single Number II](https://leetcode.com/problems/single-number-ii/)

##  Compiler Support

| Compiler | Version | Support |
|----------|---------|---------|
| GCC | 9.1+ | Full support |
| Clang | 9.0+ | Full support |
| MSVC | 19.20+ | Full support |

##  Key Takeaways

1. **Use C++20 utilities** for cleaner, more readable code
2. **XOR operations** are powerful for finding unique elements
3. **Bit counting** is now standardized and optimized
4. **Power of 2 operations** are simplified with new utilities
5. **Always consider bit manipulation** for performance-critical code

## 🔗 References

- [C++20 Bit Manipulation Utilities](https://en.cppreference.com/w/cpp/numeric)
- [LeetCode Bit Manipulation Problems](https://leetcode.com/tag/bit-manipulation/)
- [C++20 Standard Library Features](https://en.cppreference.com/w/cpp/20)
