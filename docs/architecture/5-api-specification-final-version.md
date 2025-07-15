# 5. API Specification (Final Version)

```yaml
openapi: 3.0.1
info:
  title: "Farm-to-Buyer Direct Platform API"
  description: "API for the Farm-to-Buyer platform, connecting farmers, buyers, and admins."
  version: "1.0.0"
servers:
  - url: "/api/v1"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
paths:
  # Epic 1: Auth & User Management
  /auth/login:
    post:
      summary: "User Login"
      tags: [Authentication]
  /auth/register:
    post:
      summary: "Buyer Registration"
      tags: [Authentication]
  /admin/farmers:
    get:
      summary: "List all Farmers"
      tags: [Admin - Farmer Management]
      security:
        - bearerAuth: []
    post:
      summary: "Create a Farmer"
      tags: [Admin - Farmer Management]
      security:
        - bearerAuth: []
  # Epic 2: Catalog & Products
  /admin/categories:
    get:
      summary: "List all Categories"
      tags: [Admin - Category Management]
      security:
        - bearerAuth: []
    post:
      summary: "Create a Category"
      tags: [Admin - Category Management]
      security:
        - bearerAuth: []
  /admin/products:
    post:
      summary: "Create a Produce Listing"
      tags: [Admin - Product Management]
      security:
        - bearerAuth: []
  /products:
    get:
      summary: "List all Public Products"
      tags: [Public - Products]
  /products/{productId}:
    get:
      summary: "Get a Single Product"
      tags: [Public - Products]
  # Epic 3: Buyer-Facing Order & Cart
  /cart:
    get:
      summary: "Get User's Cart"
      tags: [Shopping Cart]
      security:
        - bearerAuth: []
    post:
      summary: "Add Item to Cart"
      tags: [Shopping Cart]
      security:
        - bearerAuth: []
  /cart/items/{productId}:
    put:
      summary: "Update Item Quantity in Cart"
      tags: [Shopping Cart]
      security:
        - bearerAuth: []
    delete:
      summary: "Remove Item from Cart"
      tags: [Shopping Cart]
      security:
        - bearerAuth: []
  /orders:
    get:
      summary: "Get Buyer's Order History"
      tags: [Orders]
      security:
        - bearerAuth: []
    post:
      summary: "Place a New Order"
      tags: [Orders]
      security:
        - bearerAuth: []
  /ratings:
    post:
      summary: "Submit a Farmer Rating"
      tags: [Ratings]
      security:
        - bearerAuth: []
  /disputes:
    post:
      summary: "Submit an Order Dispute"
      tags: [Disputes]
      security:
        - bearerAuth: []
  # Epic 3: Admin-Facing Order & Dispute Management
  /admin/orders:
    get:
      summary: "List all Orders (Admin)"
      tags: [Admin - Order Management]
      security:
        - bearerAuth: []
  /admin/orders/{orderId}:
    put:
      summary: "Update an Order (Admin)"
      tags: [Admin - Order Management]
      security:
        - bearerAuth: []
  /admin/disputes:
    get:
      summary: "List all Disputes (Admin)"
      tags: [Admin - Dispute Management]
      security:
        - bearerAuth: []
  /admin/disputes/{disputeId}:
    put:
      summary: "Update a Dispute (Admin)"
      tags: [Admin - Dispute Management]
      security:
        - bearerAuth: []
``` 