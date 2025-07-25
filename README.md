
-----

# Farm-to-Buyer Direct Platform

This project is a digital marketplace designed to connect farmers directly with buyers in Ghana, aiming to solve inefficiencies in the agricultural supply chain. By reducing the role of middlemen, the platform helps lower consumer prices and increase farmer profits. It uses an admin-assisted model to help non-tech-savvy farmers participate in the digital economy.

## Tech Stack

The platform is a modern, decoupled web application built with the following technologies:

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Java 17, Spring Boot | REST API and business logic |
| **Frontend** | TypeScript, Next.js (React) | Responsive user interface |
| **Database**| PostgreSQL | Primary data storage |
| **UI Library**| shadcn/ui | UI components |
| **Authentication**| Spring Security, JWT | Secure access to the API |
| **File Storage** | Cloudinary | Storing produce images |

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Java JDK 17 or later
* Maven 3.8+
* Node.js 18+ and npm/yarn
* PostgreSQL 16
* A running Cloudinary instance (for image uploads)

### Installation & Setup

1.  **Clone the repository:**

    ```sh
    git clone <repo-url>
    cd farm-to-buyer-platform
    ```

2.  **Backend Setup (`/apps/api`):**

    * Navigate to the `api` directory.
    * Create an `application-local.yml` file and configure your database connection, JWT secret, and default admin credentials.
    * Run the application: `mvn spring-boot:run`
    * The backend will be available at `http://localhost:8080`.

3.  **Frontend Setup (`/apps/web`):**

    * Navigate to the `web` directory.
    * Install dependencies: `npm install`
    * Create a `.env.local` file and add the API base URL: `NEXT_PUBLIC_API_URL=http://localhost:8080`
    * Run the development server: `npm run dev`
    * The frontend will be available at `http://localhost:3000`.

## API Documentation

The backend exposes a RESTful API at the `/api/v1` base path.

### Authentication

| Endpoint              | Description                                                                    | Auth |
|:----------------------|:-------------------------------------------------------------------------------| :--- |
| `POST /auth/login`    | Logs in any user (Admin, Buyer) and returns an accessToken and a refreshToken. | Public |
| `POST /auth/register` | Registers a new Buyer account.                                                 | Public |
| `POST /auth/refresh`  | returns a new accessToken for a user with a refreshToken                       | Public |

### Public Endpoints

| Endpoint | Description | Auth |
| :--- | :--- | :--- |
| `GET /products` | Lists all active products, with mandatory filtering by region. | Public |
| `GET /products/{productId}` | Retrieves the full public details of a single active product. | Public |
| `GET /pickup-locations` | Lists available pickup locations, filtered by region. | Public |

### Buyer Endpoints (Requires Buyer Auth)

| Endpoint | Description | Auth |
| :--- | :--- | :--- |
| `GET /buyer/profile` | Retrieves the logged-in buyer's profile information. | Buyer |
| `PUT /buyer/profile` | Updates the logged-in buyer's profile information. | Buyer |
| `GET /cart` | Retrieves the buyer's current shopping cart. | Buyer |
| `POST /cart` | Adds an item or updates its quantity in the cart. | Buyer |
| `DELETE /cart/items/{productId}` | Removes an item from the cart. | Buyer |
| `GET /orders` | Retrieves a paginated history of the buyer's orders. | Buyer |
| `POST /orders` | Places a new order from the contents of the cart. | Buyer |
| `GET /orders/{orderId}` | Retrieves the confirmation details for a specific order. | Buyer |
| `POST /ratings` | Submits a rating for a completed order. | Buyer |
| `POST /disputes` | Submits a dispute for a completed order. | Buyer |

### Admin Endpoints (Requires Admin Auth)

| Endpoint | Description | Auth |
| :--- | :--- | :--- |
| `GET /admin/farmers` | Lists all farmer accounts. | Admin |
| `POST /admin/farmers` | Creates a new farmer account. | Admin |
| `PUT /admin/farmers/{farmerId}` | Updates an existing farmer's details. | Admin |
| `DELETE /admin/farmers/{farmerId}` | Deletes a farmer. | Admin |
| `GET /admin/categories` | Lists all produce categories. | Admin |
| `POST /admin/categories` | Creates a new category. | Admin |
| `PUT /admin/categories/{id}` | Updates an existing category. | Admin |
| `DELETE /admin/categories/{id}` | Deletes a category. | Admin |
| `GET /admin/products` | Lists all products (including inactive) for management. | Admin |
| `POST /admin/products` | Creates a new product listing on behalf of a farmer. | Admin |
| `GET /admin/products/{productId}` | Retrieves the full details of any product. | Admin |
| `PUT /admin/products/{productId}` | Performs a full update on a product's details. | Admin |
| `PATCH /admin/products/{productId}` | Partially updates a product (e.g., status or stock). | Admin |
| `DELETE /admin/products/{productId}` | Deletes a product. | Admin |
| `GET /admin/pickup-locations` | Lists all pickup locations for management. | Admin |
| `POST /admin/pickup-locations` | Creates a new pickup location. | Admin |
| `PUT /admin/pickup-locations/{locationId}` | Updates a pickup location. | Admin |
| `DELETE /admin/pickup-locations/{locationId}`| Deletes a pickup location. | Admin |
| `GET /admin/orders` | Lists all orders on the platform. | Admin |
| `GET /admin/orders/{orderId}` | Retrieves the details of any specific order. | Admin |
| `PATCH /admin/orders/{orderId}/status` | Updates the status of an order. | Admin |
| `GET /admin/disputes` | Lists all disputes on the platform. | Admin |
| `GET /admin/disputes/{disputeId}` | Retrieves the details of a specific dispute. | Admin |
| `PUT /admin/disputes/{disputeId}` | Updates a dispute's status and adds resolution notes. | Admin |

## Project Structure

This project is a monorepo managed by **Turborepo**.

```
/
├── apps/
│   ├── api/      # Spring Boot Backend
│   └── web/      # Next.js Frontend
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   └── ui/           # Shared React components
└── ...
```

This structure simplifies dependency management and allows for shared code between the frontend and backend.

## 🧪 Testing

The project uses a combination of unit and integration tests to ensure quality.

* **Backend:** Run tests with `mvn test`.
* **Frontend:** Run tests with `npm test`.