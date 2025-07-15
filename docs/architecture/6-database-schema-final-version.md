# 6. Database Schema (Final Version)

```sql
-- Create ENUM types for roles and statuses
CREATE TYPE user_role AS ENUM ('BUYER', 'FARMER', 'ADMIN');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD_OUT');
CREATE TYPE order_status AS ENUM ('PENDING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'DISPUTED');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PAID');
CREATE TYPE fulfillment_type AS ENUM ('DELIVERY', 'PICKUP');
CREATE TYPE dispute_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED');

-- Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    account_status account_status NOT NULL DEFAULT 'ACTIVE',
    delivery_address JSONB,
    average_rating DECIMAL(3, 2) DEFAULT 0 CHECK (average_rating >= 0),
    rating_count INT DEFAULT 0 CHECK (rating_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    farmer_id UUID NOT NULL REFERENCES users(id),
    -- ... and other product fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ... other table definitions for orders, categories, etc.
``` 