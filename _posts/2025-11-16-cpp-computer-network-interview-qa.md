---
layout: post
title: "C++ Computer Network Interview Q&A - Complete Guide"
date: 2025-11-16
categories: interview-preparation cpp networking system-programming socket-programming tcp-ip udp interview-questions
excerpt: "A comprehensive guide to C++ computer network interview questions and answers, covering socket programming, TCP/UDP, network protocols, asynchronous I/O, multithreading, and common interview scenarios with code examples."
---

## Introduction

C++ computer network interviews test your understanding of low-level networking concepts, socket programming, protocol implementation, and system-level network programming. These interviews are common for roles involving network programming, distributed systems, game engines, high-performance servers, and embedded systems.

This guide covers essential C++ networking concepts, common interview questions, and detailed answers with code examples. Topics include socket programming, TCP/UDP, asynchronous I/O, multithreading, network protocols, and performance optimization.

## Table of Contents

1. [Socket Programming Fundamentals](#socket-programming-fundamentals)
2. [TCP vs UDP](#tcp-vs-udp)
3. [Socket API in C++](#socket-api-in-c)
4. [Common Interview Questions](#common-interview-questions)
5. [Advanced Topics](#advanced-topics)
6. [Code Examples](#code-examples)
7. [Best Practices](#best-practices)
8. [Summary](#summary)

## Socket Programming Fundamentals

### What is a Socket?

A socket is an endpoint for communication between two processes, typically over a network. It provides an abstraction layer over network protocols (TCP/IP, UDP) and allows programs to communicate using standard I/O operations.

**Key Concepts:**
- **Socket Descriptor**: File descriptor representing a socket
- **Address Family**: AF_INET (IPv4), AF_INET6 (IPv6)
- **Socket Type**: SOCK_STREAM (TCP), SOCK_DGRAM (UDP)
- **Protocol**: IPPROTO_TCP, IPPROTO_UDP

### Socket Lifecycle

1. **Create Socket**: `socket()`
2. **Bind**: `bind()` (server) or `connect()` (client)
3. **Listen**: `listen()` (server)
4. **Accept**: `accept()` (server)
5. **Connect**: `connect()` (client)
6. **Send/Receive**: `send()/recv()` or `write()/read()`
7. **Close**: `close()`

## TCP vs UDP

### TCP (Transmission Control Protocol)

**Characteristics:**
- Connection-oriented
- Reliable (guaranteed delivery)
- Ordered (packets arrive in order)
- Flow control
- Congestion control
- Full-duplex communication

**Use Cases:**
- HTTP/HTTPS
- FTP
- Email (SMTP, IMAP)
- Database connections
- File transfers

**C++ Example:**
```cpp
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <iostream>

// TCP Server
int create_tcp_server(int port) {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket failed");
        return -1;
    }
    
    // Set socket options
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    // Bind
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);
    
    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        perror("bind failed");
        return -1;
    }
    
    // Listen
    if (listen(server_fd, 10) < 0) {
        perror("listen failed");
        return -1;
    }
    
    return server_fd;
}
```

### UDP (User Datagram Protocol)

**Characteristics:**
- Connectionless
- Unreliable (no delivery guarantee)
- No ordering guarantee
- Lower overhead
- Faster
- No flow control

**Use Cases:**
- DNS queries
- Video streaming
- Online gaming
- Real-time applications
- Broadcasting

**C++ Example:**
```cpp
// UDP Server
int create_udp_server(int port) {
    int server_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (server_fd < 0) {
        perror("socket failed");
        return -1;
    }
    
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);
    
    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        perror("bind failed");
        return -1;
    }
    
    return server_fd;
}

// UDP Receive
ssize_t udp_receive(int sockfd, void* buffer, size_t len, 
                    struct sockaddr_in* client_addr) {
    socklen_t addr_len = sizeof(*client_addr);
    return recvfrom(sockfd, buffer, len, 0, 
                   (struct sockaddr*)client_addr, &addr_len);
}
```

## Socket API in C++

### Essential Functions

**1. socket()**
```cpp
int socket(int domain, int type, int protocol);
// domain: AF_INET, AF_INET6
// type: SOCK_STREAM, SOCK_DGRAM
// protocol: 0 (auto-select)
```

**2. bind()**
```cpp
int bind(int sockfd, const struct sockaddr* addr, socklen_t addrlen);
```

**3. listen()**
```cpp
int listen(int sockfd, int backlog);
// backlog: Maximum pending connections
```

**4. accept()**
```cpp
int accept(int sockfd, struct sockaddr* addr, socklen_t* addrlen);
```

**5. connect()**
```cpp
int connect(int sockfd, const struct sockaddr* addr, socklen_t addrlen);
```

**6. send() / recv()**
```cpp
ssize_t send(int sockfd, const void* buf, size_t len, int flags);
ssize_t recv(int sockfd, void* buf, size_t len, int flags);
```

**7. sendto() / recvfrom()**
```cpp
ssize_t sendto(int sockfd, const void* buf, size_t len, int flags,
                const struct sockaddr* dest_addr, socklen_t addrlen);
ssize_t recvfrom(int sockfd, void* buf, size_t len, int flags,
                 struct sockaddr* src_addr, socklen_t* addrlen);
```

## Common Interview Questions

### Q1: Explain the difference between TCP and UDP.

**Answer:**

**TCP (Transmission Control Protocol):**
- **Connection-oriented**: Requires handshake before data transfer
- **Reliable**: Guarantees delivery, retransmits lost packets
- **Ordered**: Packets arrive in order
- **Flow control**: Prevents sender from overwhelming receiver
- **Congestion control**: Adapts to network conditions
- **Overhead**: Higher overhead due to reliability features
- **Use cases**: HTTP, FTP, email, file transfers

**UDP (User Datagram Protocol):**
- **Connectionless**: No handshake, sends immediately
- **Unreliable**: No delivery guarantee, no retransmission
- **Unordered**: Packets may arrive out of order
- **No flow control**: Can overwhelm receiver
- **No congestion control**: Doesn't adapt to network
- **Overhead**: Lower overhead, faster
- **Use cases**: DNS, video streaming, online gaming, broadcasting

**Code Comparison:**
```cpp
// TCP: Connection required
int tcp_client = socket(AF_INET, SOCK_STREAM, 0);
connect(tcp_client, (struct sockaddr*)&server_addr, sizeof(server_addr));
send(tcp_client, data, len, 0);  // Reliable

// UDP: No connection
int udp_client = socket(AF_INET, SOCK_DGRAM, 0);
sendto(udp_client, data, len, 0, 
       (struct sockaddr*)&server_addr, sizeof(server_addr));  // Best effort
```

### Q2: How does TCP three-way handshake work?

**Answer:**

The three-way handshake establishes a TCP connection:

1. **SYN**: Client sends SYN packet with initial sequence number
2. **SYN-ACK**: Server responds with SYN-ACK, acknowledging client's SYN and sending its own SYN
3. **ACK**: Client sends ACK, acknowledging server's SYN

**State Transitions:**
- Client: CLOSED → SYN_SENT → ESTABLISHED
- Server: CLOSED → LISTEN → SYN_RECEIVED → ESTABLISHED

**Code Example:**
```cpp
// Client side
int client_fd = socket(AF_INET, SOCK_STREAM, 0);
struct sockaddr_in server_addr;
server_addr.sin_family = AF_INET;
server_addr.sin_port = htons(8080);
inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr);

// This triggers SYN
connect(client_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
// After SYN-ACK and ACK, connection is ESTABLISHED
```

### Q3: What is the difference between blocking and non-blocking sockets?

**Answer:**

**Blocking Sockets:**
- Operations wait until completion
- `recv()` blocks until data arrives
- `send()` blocks until data is sent
- `accept()` blocks until connection arrives
- Simpler to program, but can't handle multiple connections easily

**Non-Blocking Sockets:**
- Operations return immediately
- `recv()` returns EAGAIN/EWOULDBLOCK if no data
- `send()` returns EAGAIN/EWOULDBLOCK if buffer full
- Requires polling or event-driven programming
- More complex, but enables handling multiple connections

**Code Example:**
```cpp
// Set socket to non-blocking
int flags = fcntl(sockfd, F_GETFL, 0);
fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);

// Non-blocking recv
char buffer[1024];
ssize_t n = recv(sockfd, buffer, sizeof(buffer), 0);
if (n < 0) {
    if (errno == EAGAIN || errno == EWOULDBLOCK) {
        // No data available, try again later
    } else {
        // Error occurred
    }
}
```

### Q4: How do you handle multiple clients in a TCP server?

**Answer:**

**Approaches:**

1. **Fork-based (Process per connection)**
   - Fork a new process for each connection
   - Simple but resource-intensive

2. **Thread-based (Thread per connection)**
   - Create a thread for each connection
   - Better resource usage than fork
   - Thread management overhead

3. **Select/Poll (I/O Multiplexing)**
   - Single thread monitors multiple sockets
   - Efficient for many connections
   - Limited scalability

4. **Epoll/kqueue (Event-driven)**
   - Linux epoll or BSD kqueue
   - Most efficient for high concurrency
   - Event-driven architecture

**Code Example (Thread-based):**
```cpp
#include <thread>
#include <vector>

void handle_client(int client_fd) {
    char buffer[1024];
    while (true) {
        ssize_t n = recv(client_fd, buffer, sizeof(buffer), 0);
        if (n <= 0) break;
        
        // Process request
        send(client_fd, buffer, n, 0);
    }
    close(client_fd);
}

void tcp_server_multithreaded(int port) {
    int server_fd = create_tcp_server(port);
    std::vector<std::thread> threads;
    
    while (true) {
        struct sockaddr_in client_addr;
        socklen_t addr_len = sizeof(client_addr);
        int client_fd = accept(server_fd, 
                              (struct sockaddr*)&client_addr, 
                              &addr_len);
        
        if (client_fd < 0) continue;
        
        // Create thread for each client
        threads.emplace_back(handle_client, client_fd);
    }
}
```

**Code Example (Epoll-based):**
```cpp
#include <sys/epoll.h>

void tcp_server_epoll(int port) {
    int server_fd = create_tcp_server(port);
    
    // Create epoll instance
    int epoll_fd = epoll_create1(0);
    
    // Add server socket to epoll
    struct epoll_event event;
    event.events = EPOLLIN;
    event.data.fd = server_fd;
    epoll_ctl(epoll_fd, EPOLL_CTL_ADD, server_fd, &event);
    
    struct epoll_event events[MAX_EVENTS];
    
    while (true) {
        int nfds = epoll_wait(epoll_fd, events, MAX_EVENTS, -1);
        
        for (int i = 0; i < nfds; i++) {
            if (events[i].data.fd == server_fd) {
                // New connection
                struct sockaddr_in client_addr;
                socklen_t addr_len = sizeof(client_addr);
                int client_fd = accept(server_fd, 
                                      (struct sockaddr*)&client_addr, 
                                      &addr_len);
                
                // Add client to epoll
                event.events = EPOLLIN | EPOLLET;  // Edge-triggered
                event.data.fd = client_fd;
                epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_fd, &event);
            } else {
                // Handle client data
                int client_fd = events[i].data.fd;
                char buffer[1024];
                ssize_t n = recv(client_fd, buffer, sizeof(buffer), 0);
                
                if (n <= 0) {
                    close(client_fd);
                    epoll_ctl(epoll_fd, EPOLL_CTL_DEL, client_fd, nullptr);
                } else {
                    send(client_fd, buffer, n, 0);
                }
            }
        }
    }
}
```

### Q5: What is socket option SO_REUSEADDR?

**Answer:**

`SO_REUSEADDR` allows binding to an address that's already in use, typically after a previous connection closed. Without it, binding to a recently closed port may fail with "Address already in use" error.

**Use Cases:**
- Server restart without waiting for TIME_WAIT to expire
- Multiple sockets binding to same port (with SO_REUSEPORT)

**Code Example:**
```cpp
int server_fd = socket(AF_INET, SOCK_STREAM, 0);

int opt = 1;
setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

// Now bind will succeed even if port was recently used
bind(server_fd, (struct sockaddr*)&address, sizeof(address));
```

### Q6: Explain TCP flow control and congestion control.

**Answer:**

**Flow Control:**
- Prevents sender from overwhelming receiver
- Uses sliding window protocol
- Receiver advertises window size (how much data it can accept)
- Sender adjusts send rate based on window size

**Congestion Control:**
- Prevents sender from overwhelming network
- Adapts to network conditions
- Algorithms: Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery
- Uses congestion window (cwnd) to limit send rate

**Code Example (Window Size):**
```cpp
// Get receive buffer size (affects flow control)
int recv_buf_size = 65536;
setsockopt(sockfd, SOL_SOCKET, SO_RCVBUF, 
           &recv_buf_size, sizeof(recv_buf_size));

// Get send buffer size
int send_buf_size = 65536;
setsockopt(sockfd, SOL_SOCKET, SO_SNDBUF, 
           &send_buf_size, sizeof(send_buf_size));
```

### Q7: How do you implement a simple HTTP server in C++?

**Answer:**

**HTTP Server Components:**
1. Listen on port 80/8080
2. Accept connections
3. Parse HTTP requests
4. Generate HTTP responses
5. Send responses

**Code Example:**
```cpp
#include <string>
#include <sstream>

std::string http_response(const std::string& status, 
                         const std::string& body) {
    std::ostringstream response;
    response << "HTTP/1.1 " << status << "\r\n";
    response << "Content-Type: text/html\r\n";
    response << "Content-Length: " << body.length() << "\r\n";
    response << "Connection: close\r\n";
    response << "\r\n";
    response << body;
    return response.str();
}

void handle_http_request(int client_fd) {
    char buffer[4096];
    ssize_t n = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
    if (n <= 0) return;
    
    buffer[n] = '\0';
    std::string request(buffer);
    
    // Simple request parsing
    if (request.find("GET /") == 0) {
        std::string response = http_response(
            "200 OK",
            "<html><body><h1>Hello World</h1></body></html>"
        );
        send(client_fd, response.c_str(), response.length(), 0);
    } else {
        std::string response = http_response(
            "404 Not Found",
            "<html><body><h1>404 Not Found</h1></body></html>"
        );
        send(client_fd, response.c_str(), response.length(), 0);
    }
    
    close(client_fd);
}
```

### Q8: What is the difference between select(), poll(), and epoll()?

**Answer:**

**select():**
- Portable (POSIX standard)
- Limited to FD_SETSIZE (typically 1024)
- O(n) complexity for checking fds
- Copies fd_set on each call

**poll():**
- More flexible than select
- No FD_SETSIZE limit
- O(n) complexity
- Better for sparse fd sets

**epoll() (Linux):**
- Most efficient for large numbers of fds
- O(1) complexity
- Edge-triggered or level-triggered
- Linux-specific

**Code Comparison:**
```cpp
// select()
fd_set read_fds;
FD_ZERO(&read_fds);
FD_SET(sockfd, &read_fds);
select(sockfd + 1, &read_fds, nullptr, nullptr, nullptr);

// poll()
struct pollfd fds[1];
fds[0].fd = sockfd;
fds[0].events = POLLIN;
poll(fds, 1, -1);

// epoll()
int epoll_fd = epoll_create1(0);
struct epoll_event event;
event.events = EPOLLIN;
event.data.fd = sockfd;
epoll_ctl(epoll_fd, EPOLL_CTL_ADD, sockfd, &event);
epoll_wait(epoll_fd, &event, 1, -1);
```

### Q9: How do you handle partial sends/receives in TCP?

**Answer:**

TCP is a byte stream, so `send()` and `recv()` may not send/receive all data at once. You must loop until all data is sent/received.

**Code Example:**
```cpp
// Reliable send
ssize_t reliable_send(int sockfd, const void* buf, size_t len) {
    const char* data = (const char*)buf;
    size_t total_sent = 0;
    
    while (total_sent < len) {
        ssize_t n = send(sockfd, data + total_sent, 
                        len - total_sent, 0);
        if (n < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) {
                // Would block, retry
                continue;
            }
            return -1;  // Error
        }
        total_sent += n;
    }
    
    return total_sent;
}

// Reliable receive
ssize_t reliable_recv(int sockfd, void* buf, size_t len) {
    char* data = (char*)buf;
    size_t total_received = 0;
    
    while (total_received < len) {
        ssize_t n = recv(sockfd, data + total_received, 
                        len - total_received, 0);
        if (n <= 0) {
            if (n == 0) return total_received;  // Connection closed
            if (errno == EAGAIN || errno == EWOULDBLOCK) {
                continue;  // Would block
            }
            return -1;  // Error
        }
        total_received += n;
    }
    
    return total_received;
}
```

### Q10: Explain network byte order and host byte order.

**Answer:**

**Host Byte Order:**
- Depends on CPU architecture
- Little-endian (x86, x86_64) or big-endian (some ARM, PowerPC)

**Network Byte Order:**
- Always big-endian
- Standardized for network communication

**Conversion Functions:**
- `htons()`: Host to Network Short (16-bit)
- `htonl()`: Host to Network Long (32-bit)
- `ntohs()`: Network to Host Short
- `ntohl()`: Network to Host Long

**Code Example:**
```cpp
struct sockaddr_in addr;
addr.sin_family = AF_INET;
addr.sin_port = htons(8080);  // Convert port to network byte order
inet_pton(AF_INET, "192.168.1.1", &addr.sin_addr);

// When receiving
uint16_t port = ntohs(addr.sin_port);  // Convert back to host byte order
```

## Advanced Topics

### Asynchronous I/O with Boost.Asio

**Boost.Asio** provides asynchronous I/O operations:

```cpp
#include <boost/asio.hpp>
#include <iostream>

using boost::asio::ip::tcp;

void handle_client(tcp::socket socket) {
    boost::asio::streambuf buffer;
    boost::asio::read_until(socket, buffer, "\n");
    
    std::string data = boost::asio::buffer_cast<const char*>(buffer.data());
    std::cout << "Received: " << data;
    
    std::string response = "Echo: " + data;
    boost::asio::write(socket, boost::asio::buffer(response));
}

int main() {
    boost::asio::io_context io_context;
    tcp::acceptor acceptor(io_context, tcp::endpoint(tcp::v4(), 8080));
    
    while (true) {
        tcp::socket socket(io_context);
        acceptor.accept(socket);
        
        std::thread(handle_client, std::move(socket)).detach();
    }
    
    return 0;
}
```

### Zero-Copy Networking

**sendfile()** for efficient file transfers:

```cpp
#include <sys/sendfile.h>

void send_file(int sockfd, int file_fd, off_t offset, size_t count) {
    off_t file_offset = offset;
    size_t remaining = count;
    
    while (remaining > 0) {
        ssize_t sent = sendfile(sockfd, file_fd, &file_offset, remaining);
        if (sent < 0) {
            perror("sendfile");
            break;
        }
        remaining -= sent;
    }
}
```

### Socket Timeouts

**Setting receive timeout:**
```cpp
struct timeval timeout;
timeout.tv_sec = 5;  // 5 seconds
timeout.tv_usec = 0;

setsockopt(sockfd, SOL_SOCKET, SO_RCVTIMEO, 
           &timeout, sizeof(timeout));
```

## Code Examples

### Complete TCP Echo Server

```cpp
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <iostream>
#include <thread>
#include <vector>

void handle_client(int client_fd) {
    char buffer[1024];
    
    while (true) {
        ssize_t n = recv(client_fd, buffer, sizeof(buffer), 0);
        if (n <= 0) break;
        
        send(client_fd, buffer, n, 0);
    }
    
    close(client_fd);
}

int main() {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(8080);
    
    bind(server_fd, (struct sockaddr*)&address, sizeof(address));
    listen(server_fd, 10);
    
    std::vector<std::thread> threads;
    
    while (true) {
        struct sockaddr_in client_addr;
        socklen_t addr_len = sizeof(client_addr);
        int client_fd = accept(server_fd, 
                              (struct sockaddr*)&client_addr, 
                              &addr_len);
        
        if (client_fd < 0) continue;
        
        threads.emplace_back(handle_client, client_fd);
    }
    
    return 0;
}
```

### UDP Chat Server

```cpp
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <iostream>
#include <map>

int main() {
    int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    
    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(8080);
    
    bind(sockfd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    
    std::map<std::string, struct sockaddr_in> clients;
    
    char buffer[1024];
    
    while (true) {
        struct sockaddr_in client_addr;
        socklen_t addr_len = sizeof(client_addr);
        
        ssize_t n = recvfrom(sockfd, buffer, sizeof(buffer), 0,
                            (struct sockaddr*)&client_addr, &addr_len);
        
        if (n <= 0) continue;
        
        buffer[n] = '\0';
        std::string client_key = inet_ntoa(client_addr.sin_addr) + 
                                 std::to_string(client_addr.sin_port);
        
        clients[client_key] = client_addr;
        
        // Broadcast to all other clients
        for (const auto& [key, addr] : clients) {
            if (key != client_key) {
                sendto(sockfd, buffer, n, 0,
                      (struct sockaddr*)&addr, sizeof(addr));
            }
        }
    }
    
    return 0;
}
```

## Best Practices

### 1. Error Handling

Always check return values:
```cpp
int sockfd = socket(AF_INET, SOCK_STREAM, 0);
if (sockfd < 0) {
    perror("socket");
    return -1;
}
```

### 2. Resource Management

Use RAII for automatic cleanup:
```cpp
class Socket {
    int fd_;
public:
    Socket(int domain, int type, int protocol) {
        fd_ = socket(domain, type, protocol);
    }
    ~Socket() {
        if (fd_ >= 0) close(fd_);
    }
    int get() const { return fd_; }
};
```

### 3. Buffer Management

Use appropriate buffer sizes:
```cpp
const size_t BUFFER_SIZE = 8192;  // 8KB, good balance
char buffer[BUFFER_SIZE];
```

### 4. Address Reuse

Always set SO_REUSEADDR for servers:
```cpp
int opt = 1;
setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
```

### 5. Handle Partial Sends/Receives

Always loop for complete data transfer:
```cpp
ssize_t total = 0;
while (total < len) {
    ssize_t n = send(sockfd, buf + total, len - total, 0);
    if (n < 0) return -1;
    total += n;
}
```

### 6. Use Non-Blocking I/O for Scalability

For high-performance servers:
```cpp
int flags = fcntl(sockfd, F_GETFL, 0);
fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);
```

### 7. Thread Safety

Use mutexes for shared data:
```cpp
#include <mutex>

std::mutex clients_mutex;
std::map<int, ClientInfo> clients;

void add_client(int fd, const ClientInfo& info) {
    std::lock_guard<std::mutex> lock(clients_mutex);
    clients[fd] = info;
}
```

## Summary

**Key Takeaways:**

1. **Socket Programming**: Understand socket lifecycle and API
2. **TCP vs UDP**: Know when to use each protocol
3. **Concurrency**: Choose appropriate model (threads, epoll, async)
4. **Error Handling**: Always check return values
5. **Partial I/O**: Handle incomplete sends/receives
6. **Byte Order**: Convert between host and network byte order
7. **Performance**: Use non-blocking I/O and event-driven architecture
8. **Resource Management**: Properly close sockets and manage memory

**Common Interview Topics:**
- Socket API functions
- TCP three-way handshake
- Flow control and congestion control
- Handling multiple clients
- Non-blocking I/O
- select/poll/epoll
- Partial sends/receives
- Network byte order
- Error handling
- Performance optimization

**Practice Problems:**
1. Implement a TCP echo server
2. Implement a UDP chat server
3. Implement an HTTP server
4. Implement a file transfer protocol
5. Implement a load balancer
6. Implement connection pooling
7. Implement rate limiting
8. Implement a proxy server

Mastering C++ networking requires understanding both the theoretical concepts and practical implementation details. Practice implementing various network protocols and servers to build confidence for interviews.

