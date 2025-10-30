---
layout: post
title: "PostgreSQL with C++: Practical Guide with Examples"
date: 2025-10-30 10:00:00 -0700
categories: cpp database postgresql
permalink: /2025/10/30/postgresql-with-cpp-guide/
tags: [cpp, postgresql, database, libpq, libpqxx, transactions, prepared-statements, pooling]
---

# PostgreSQL with C++: Practical Guide with Examples

This guide shows how to connect to PostgreSQL from C++ using both the low-level C client (`libpq`) and the modern C++ wrapper (`libpqxx`). It covers connection management, prepared statements, transactions, error handling, and performance tips.

## What is PostgreSQL (and why use it)?

PostgreSQL is a production‑grade, open‑source relational database known for strong SQL compliance, ACID transactions, MVCC concurrency, powerful indexing (B‑tree, GIN/GiST, BRIN), rich data types (arrays, JSON/JSONB, ranges, geometric), and an extension ecosystem (PostGIS, pgcrypto, etc.). For C++ backends or tools, Postgres offers:
- Safety: transactions, constraints, foreign keys, and robust crash recovery.
- Performance: prepared statements, query planner with `EXPLAIN`, and specialized indexes.
- Flexibility: schemaless JSON/JSONB alongside relational tables, window functions, CTEs.

Below we’ll use JSONB to illustrate semi‑structured logging while keeping SQL power.

## Options: libpq vs libpqxx

- libpq: Official C client library. Lowest overhead, explicit memory/error handling.
- libpqxx: Idiomatic C++ wrapper over libpq with RAII, exceptions, and STL types.

If you can use exceptions and want RAII + safer APIs, choose libpqxx. If you need strict C ABI or minimal dependencies, use libpq.

## Installing dependencies

On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y libpq-dev libpqxx-dev postgresql-client
```

On macOS (Homebrew):

```bash
brew install libpqxx postgresql
```

## JSON/JSONB data example (logs/telemetry)

Create a table with a `jsonb` column and a GIN index:

```sql
CREATE TABLE IF NOT EXISTS device_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL
);

-- For containment queries like payload @> '{"device_id":"lidar-01"}'
CREATE INDEX IF NOT EXISTS idx_device_events_payload ON device_events USING GIN (payload jsonb_path_ops);
```

Insert and query with libpqxx using prepared statements:

```cpp
#include <pqxx/pqxx>
#include <iostream>

int main() {
  try {
    pqxx::connection conn{"dbname=testdb user=testuser password=secret"};
    pqxx::work txn{conn};

    conn.prepare("ins_json", "INSERT INTO device_events(payload) VALUES($1::jsonb) RETURNING id");
    std::string json = R"({
      "device_id":"lidar-01",
      "range_m":3.14,
      "ok":true,
      "tags":["demo","lab"],
      "ts":"2025-10-30T10:15:00Z"
    })";
    auto id = txn.exec_prepared1("ins_json", json).at(0).as<long long>();

    // Query specific fields
    auto rows = txn.exec(
      "SELECT id, payload->>'device_id' AS device, "
      "       (payload->>'range_m')::float AS range_m "
      "FROM device_events "
      "WHERE payload @> '{\\"tags\\":[\\"demo\\"]}'::jsonb "
      "ORDER BY id DESC LIMIT 5"
    );
    for (auto const &r : rows) {
      std::cout << r[0].as<long long>() << " "
                << r[1].as<std::string>() << " "
                << r[2].as<double>() << "\n";
    }

    txn.commit();
    std::cout << "Inserted event id: " << id << "\n";
  } catch (std::exception const &e) {
    std::cerr << e.what() << "\n";
    return 1;
  }
}
```

Notes
- Cast parameter to `jsonb` on the SQL side (`$1::jsonb`).
- Use `payload->>'field'` to extract text, cast as needed.
- GIN index accelerates `@>` containment and path queries.

## Example 1 — libpqxx quick start (recommended)

```cpp
#include <pqxx/pqxx>
#include <iostream>

int main() {
    try {
        // Connection string: set your DB name, user, password, host, and port
        pqxx::connection conn{"dbname=testdb user=testuser password=secret host=127.0.0.1 port=5432"};
        if (!conn.is_open()) {
            std::cerr << "Failed to open connection" << std::endl;
            return 1;
        }

        // RAII transaction. Work (read/write). Use read_transaction for read-only
        pqxx::work txn{conn};

        // Create table if not exists
        txn.exec(
            "CREATE TABLE IF NOT EXISTS widgets ("
            "  id SERIAL PRIMARY KEY,"
            "  name TEXT NOT NULL,"
            "  price_cents INT NOT NULL"
            ")"
        );

        // Prepared insert
        conn.prepare("insert_widget", "INSERT INTO widgets(name, price_cents) VALUES($1, $2) RETURNING id");
        int newId = txn.exec_prepared1("insert_widget", "gizmo", 1299).at(0).as<int>();

        // Query rows
        pqxx::result r = txn.exec("SELECT id, name, price_cents FROM widgets ORDER BY id DESC LIMIT 5");
        for (const auto &row : r) {
            std::cout << row[0].as<int>() << ": " << row[1].as<std::string>()
                      << " $" << row[2].as<int>() / 100.0 << "\n";
        }

        // Commit writes
        txn.commit();
        std::cout << "Inserted id: " << newId << "\n";
    } catch (const std::exception &e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
```

Build:

```bash
g++ -std=c++17 app.cpp -lpqxx -lpq -o app
```

## Example 2 — libpq low-level API

```cpp
#include <libpq-fe.h>
#include <iostream>
#include <memory>

struct PGconnDeleter {
    void operator()(PGconn* c) const { if (c) PQfinish(c); }
};

struct PGresultDeleter {
    void operator()(PGresult* r) const { if (r) PQclear(r); }
};

int main() {
    std::unique_ptr<PGconn, PGconnDeleter> conn{
        PQconnectdb("dbname=testdb user=testuser password=secret host=127.0.0.1 port=5432")
    };
    if (PQstatus(conn.get()) != CONNECTION_OK) {
        std::cerr << "Connection failed: " << PQerrorMessage(conn.get());
        return 1;
    }

    // Simple statement
    {
        std::unique_ptr<PGresult, PGresultDeleter> res{
            PQexec(conn.get(), "CREATE TABLE IF NOT EXISTS counters(id SERIAL PRIMARY KEY, val INT NOT NULL)")
        };
        if (PQresultStatus(res.get()) != PGRES_COMMAND_OK) {
            std::cerr << "CREATE TABLE failed: " << PQerrorMessage(conn.get());
            return 1;
        }
    }

    // Prepared statement with parameters
    {
        if (PQprepare(conn.get(), "inc", "INSERT INTO counters(val) VALUES($1) RETURNING id", 1, nullptr) != PGRES_COMMAND_OK) {
            std::cerr << "Prepare failed: " << PQerrorMessage(conn.get());
            return 1;
        }
        const char* params[1];
        std::string val = "41";
        params[0] = val.c_str();
        std::unique_ptr<PGresult, PGresultDeleter> res{ PQexecPrepared(conn.get(), "inc", 1, params, nullptr, nullptr, 0) };
        if (PQresultStatus(res.get()) != PGRES_TUPLES_OK) {
            std::cerr << "INSERT failed: " << PQerrorMessage(conn.get());
            return 1;
        }
        std::cout << "Inserted id: " << PQgetvalue(res.get(), 0, 0) << "\n";
    }

    // Query
    {
        std::unique_ptr<PGresult, PGresultDeleter> res{ PQexec(conn.get(), "SELECT id, val FROM counters ORDER BY id DESC LIMIT 5") };
        if (PQresultStatus(res.get()) != PGRES_TUPLES_OK) {
            std::cerr << "SELECT failed: " << PQerrorMessage(conn.get());
            return 1;
        }
        for (int i = 0; i < PQntuples(res.get()); ++i) {
            std::cout << PQgetvalue(res.get(), i, 0) << ": " << PQgetvalue(res.get(), i, 1) << "\n";
        }
    }
}
```

Build:

```bash
g++ -std=c++17 app.cpp -lpq -o app
```

## Transactions and isolation

With libpqxx, each `pqxx::work` is a transaction. Use `pqxx::read_transaction` for read-only. You can set isolation levels via SQL:

```cpp
pqxx::work txn{conn};
txn.exec("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
// ... queries ...
txn.commit();
```

With libpq:

```cpp
PQexec(conn.get(), "BEGIN");
PQexec(conn.get(), "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
// ... statements ...
PQexec(conn.get(), "COMMIT");
```

## Prepared statements and parameters

Prefer prepared statements for performance and safety. In libpqxx, register once on `connection`, then call `exec_prepared`:

```cpp
conn.prepare("by_name", "SELECT id, price_cents FROM widgets WHERE name=$1");
pqxx::work txn{conn};
for (auto name : {"gizmo", "widget"}) {
    auto row = txn.exec_prepared1("by_name", name);
}
txn.commit();
```

## Mapping rows to structs

```cpp
struct Widget { int id; std::string name; int priceCents; };

std::vector<Widget> fetchWidgets(pqxx::connection& conn) {
    pqxx::read_transaction txn{conn};
    std::vector<Widget> out;
    for (const auto& row : txn.exec("SELECT id, name, price_cents FROM widgets ORDER BY id")) {
        out.push_back(Widget{ row[0].as<int>(), row[1].as<std::string>(), row[2].as<int>() });
    }
    return out;
}
```

## Error handling tips

- libpqxx throws exceptions; wrap entry points with `try/catch`.
- libpq returns status codes; always check `PQresultStatus` and handle `PGRES_FATAL_ERROR`.
- Use timeouts (`connect_timeout` in conninfo) and keep statements idempotent where possible.

## Connection pooling

For services, use a pool. Options:

- odyssey/pgbouncer at infrastructure level.
- Application-level simple pool:

```cpp
class ConnectionPool {
public:
    explicit ConnectionPool(std::string conninfo, std::size_t size)
      : conninfo_(std::move(conninfo)) {
        conns_.reserve(size);
        for (std::size_t i = 0; i < size; ++i) conns_.emplace_back(std::make_unique<pqxx::connection>(conninfo_));
    }
    pqxx::connection& acquire() { return *conns_[next_++ % conns_.size()]; }
private:
    std::string conninfo_;
    std::vector<std::unique_ptr<pqxx::connection>> conns_;
    std::size_t next_ = 0;
};
```

## Performance checklist

- Use prepared statements for hot paths.
- Batch writes in a single transaction.
- Avoid per-row round trips; fetch in sets.
- Use appropriate indexes and `EXPLAIN ANALYZE` to verify plans.
- Keep columns narrow; avoid over-fetching.

## Security

- Use least-privilege DB roles.
- Prefer parameterized queries over string concatenation.
- Rotate credentials; avoid hardcoding in binaries.

## References

- libpqxx docs: https://libpqxx.readthedocs.io/
- libpq docs: https://www.postgresql.org/docs/current/libpq.html


