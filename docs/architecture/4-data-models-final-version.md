# 4. Data Models (Final Version)

## User Model

* **Purpose:** Represents any individual registered on the platform.
* **Key Attributes:** `id`, `fullName`, `email`, `passwordHash`, `region`, `role`, `phoneNumber`, `deliveryAddress`, `averageRating`, `ratingCount`, `accountStatus`, `createdAt`, `updatedAt`.

```typescript
interface Address {
  street: string;
  town: string;
  gpsAddress?: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  region: string;
  role: 'BUYER' | 'FARMER' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  deliveryAddress?: Address;
  averageRating?: number;
  ratingCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Product Model

* **Purpose:** Represents an item of produce listed for sale.
* **Key Attributes:** `id`, `name`, `description`, `price`, `unit`, `harvestDate`, `stockQuantity`, `listingStatus`, `imageUrls`, `farmerId`, `categoryId`, `createdAt`, `updatedAt`.

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  harvestDate: Date;
  stockQuantity: number;
  listingStatus: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';
  imageUrls: string[];
  farmer: User;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}
```

## Order Model

* **Purpose:** Represents a single transaction initiated by a buyer.
* **Key Attributes:** `id`, `buyerId`, `status`, `itemsSubtotal`, `deliveryFee`, `finalTotal`, `paymentStatus`, `fulfillmentType`, `deliveryAddress`, `pickupLocationId`, `createdAt`, `updatedAt`.

```typescript
interface Order {
  id: string;
  buyerId: string;
  status: 'PENDING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'DISPUTED';
  itemsSubtotal: number;
  deliveryFee: number;
  finalTotal: number;
  paymentStatus: 'UNPAID' | 'PAID';
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  deliveryAddress?: Address;
  pickupLocationId?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

## OrderItem Model

* **Purpose:** Represents a single line item within an order.
* **Key Attributes:** `id`, `orderId`, `productId`, `quantity`, `priceAtPurchase`, `createdAt`, `updatedAt`.

```typescript
interface OrderItem {
  id: string;
  orderId: string;
  product: Product;
  quantity: number;
  priceAtPurchase: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Category Model

* **Purpose:** To organize produce listings into groups.
* **Key Attributes:** `id`, `name`, `description`, `createdAt`, `updatedAt`.

```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## PickupLocation Model

* **Purpose:** To store the details of physical order pickup locations.
* **Key Attributes:** `id`, `name`, `address`, `region`, `operatingHours`, `createdAt`, `updatedAt`.

```typescript
interface PickupLocation {
  id: string;
  name: string;
  address: Address;
  region: string;
  operatingHours: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Rating Model

* **Purpose:** To store a single rating instance from a buyer for a farmer.
* **Key Attributes:** `id`, `score`, `comment`, `orderId`, `buyerId`, `farmerId`, `createdAt`, `updatedAt`.

```typescript
interface Rating {
  id: string;
  score: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  orderId: string;
  buyerId: string;
  farmerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Dispute Model

* **Purpose:** To track the details of a buyer's issue with an order.
* **Key Attributes:** `id`, `orderId`, `reason`, `status`, `resolutionNotes`, `createdAt`, `updatedAt`.

```typescript
interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
``` 