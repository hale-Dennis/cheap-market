
---
# **Farm-to-Buyer Direct Platform Product Requirements Document (PRD)**

### **1. Goals and Background Context**

#### **Goals**
* To launch an MVP that successfully connects farmers and buyers in the initial geofenced regions.
* To demonstrably reduce the cost of produce for buyers and increase the speed of sale and profitability for farmers.
* To validate the admin-assisted operational model as a viable way to bring non-tech-savvy farmers onto the platform.
* To achieve specific user adoption and transaction volume targets within the first quarter post-launch.

#### **Background Context**
This project addresses a core inefficiency in Ghana's agricultural supply chain. The existing multi-layer middleman system inflates consumer prices and diminishes farmer profits, while also contributing to food spoilage. This platform aims to solve this by creating a trusted, regionally-focused digital marketplace. By leveraging an admin-assisted model, we can lower the barrier to entry for farmers and build a new, more equitable system for agricultural trade.

#### **Change Log**
| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-07-12 | 1.0 | Initial PRD draft created from Project Brief. | John (PM) |

### **2. Requirements (Revised)**

#### **Functional**
1.  **FR1:** The system must provide a secure portal for System Admins to create and manage farmer accounts.
2.  **FR2:** System Admins must be able to create, update, and manage produce listings on behalf of farmers.
    * [cite_start]*Listings must include details like name, a pre-defined category, and price.* [cite: 474]
    * *The freshness indicator for produce will be a **harvest date**, set by the Admin during listing.*
3.  **FR3:** Buyers must be able to browse a public product catalog where produce is organized by categories.
4.  **FR4:** The platform must be geofenced. For the MVP, this will be achieved by having the **buyer select their region from a pre-defined list** to see local produce.
5.  **FR5:** The platform must support a shopping cart, allowing buyers to add multiple items from one or more farmers before proceeding to checkout.
6.  **FR6:** The checkout process must allow buyers to select a fulfillment option: either a pre-defined pickup point or home delivery.
    * *The fee for home delivery will be calculated based on **distance**.*
7.  **FR7:** The system must implement a simple 1-5 star rating system for buyers to rate farmers after a completed order.
8.  **FR8:** The system must provide a basic mechanism (e.g., a contact form) for a buyer to initiate a quality or order dispute.
    * *Upon submission, a notification must be sent to **System Admins**.*
9.  **FR9:** System Admins must have an interface to create and manage the list of available pickup point locations.

#### **Non-Functional**
1.  [cite_start]**NFR1:** The platform must be a responsive web application, fully functional and usable on both modern desktop and mobile browsers. [cite: 475]
2.  [cite_start]**NFR2:** The user interface must be intuitive and user-friendly, minimizing the learning curve for both buyers and System Admins. [cite: 475]
3.  [cite_start]**NFR3:** The system must be secure, ensuring the protection of all user data (including buyer information and farmer details) and implementing standard security practices. [cite: 475]
4.  [cite_start]**NFR4:** The platform must be performant, with fast page load times and responsive interactions, even on potentially slower internet connections. [cite: 475]

### **3. User Interface Design Goals**

#### **Overall UX Vision**
The platform's user experience should be clean, trustworthy, and straightforward. For System Admins, the interface must be extremely easy to learn and use, prioritizing efficiency for repetitive tasks like uploading produce. [cite_start]For Buyers, the experience should build confidence through clarity, transparent information, and a simple path to purchase. [cite: 476, 478]

#### **Key Interaction Paradigms**
* [cite_start]**Admin Experience:** A task-oriented dashboard with simple, guided forms for managing farmers and their products. [cite: 478]
* [cite_start]**Buyer Experience:** A standard and intuitive e-commerce flow, including Browse categorized items, viewing product details, adding to a cart, and a clear, multi-step checkout process. [cite: 478]

#### **Core Screens and Views**
* [cite_start]Admin Login Screen [cite: 480]
* [cite_start]Admin Dashboard (for managing farmers and produce listings) [cite: 480]
* [cite_start]Buyer Homepage / Product Catalog (viewing categorized produce) [cite: 480]
* [cite_start]Product Detail Page (showing harvest date, farmer info, ratings) [cite: 480]
* [cite_start]Shopping Cart [cite: 480]
* [cite_start]Checkout Flow (capturing fulfillment details and delivery fees) [cite: 480]
* [cite_start]Buyer Order History / Profile Page [cite: 480]

#### **Accessibility**
[cite_start]The platform should adhere to **WCAG 2.1 Level AA** standards to ensure it is usable by people with disabilities. [cite: 478]

#### **Branding**
To be defined. [cite_start]The visual identity should aim to convey freshness, trustworthiness, and a clear connection to local Ghanaian agriculture. [cite: 481]

#### **Target Device and Platforms**
[cite_start]The platform will be a **Web Responsive** application, ensuring a consistent and functional experience across desktop, tablet, and mobile devices. [cite: 484]

### **4. Technical Assumptions**

#### **Repository Structure: Monorepo**
For the MVP, all code for the frontend and backend will be managed in a single repository (a monorepo).
* [cite_start]**Rationale:** This approach simplifies dependency management, streamlines the build process, and makes it easier to share code and types between the frontend and backend, which is ideal for a small, focused team. [cite: 486]

#### **Service Architecture: Monolith**
The backend will be built as a single, unified service (a monolith).
* **Rationale:** A monolithic architecture is faster to develop, test, and deploy for an MVP. It avoids the complexities of a microservices setup, allowing us to focus on delivering core features quickly. [cite_start]The architecture can be broken into smaller services later as the platform scales. [cite: 487]

#### **Testing Requirements: Unit + Integration Tests**
The testing strategy for the MVP will focus on a combination of unit tests and integration tests.
* **Rationale:** This provides a strong balance of confidence and speed. Unit tests will ensure individual components work correctly, while integration tests will verify that core services (like the API and database) work together as expected. [cite_start]A full end-to-end (E2E) testing suite will be deferred post-MVP. [cite: 488]

#### **Additional Technical Assumptions and Requests**
* [cite_start]The technology stack is confirmed as **React** for the frontend and **Spring Boot** for the backend. [cite: 489]
* [cite_start]The architecture should be designed for deployment on a major cloud provider (e.g., AWS, Google Cloud, Azure). [cite: 489]

### **5. Epic List**

1.  **Epic 1: Platform Foundation & User Management**
    * [cite_start]**Goal:** Establish the project's technical foundation (monorepo, CI/CD), and implement the core admin functionality for creating and managing farmer accounts. [cite: 499]

2.  **Epic 2: Produce Catalog & Listings**
    * [cite_start]**Goal:** Enable System Admins to manage the complete product lifecycle from category creation to listing produce, and provide a browsable, regionally-filtered catalog for buyers. [cite: 499]

3.  **Epic 3: End-to-End Ordering & Fulfillment**
    * [cite_start]**Goal:** Implement the complete buyer transaction lifecycle, from adding an item to the cart and checking out, through to selecting fulfillment and performing post-order actions like ratings and disputes. [cite: 499]

### **Epic 1: Platform Foundation & User Management**
**Epic Goal:** This epic lays the essential groundwork for the entire platform. It involves setting up the monorepo, establishing the CI/CD pipeline for independent frontend and backend deployments, and implementing the most fundamental user feature: the ability for a System Admin to securely log in and create farmer and buyer accounts. [cite_start]By the end of this epic, we will have a technically sound foundation and the core user entities of the platform. [cite: 501]

#### **Story 1.1: Project Scaffolding & Initial Deployment**
[cite_start]**As a** System Admin, **I want** the initial monorepo structure and a basic deployment pipeline, **so that** developers have a stable foundation to begin building features. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]A monorepo is created containing initial placeholders for the `frontend` and `backend` applications. [cite: 508]
2.  [cite_start]The React frontend application is initialized and can display a simple "Welcome" page. [cite: 508]
3.  [cite_start]The Spring Boot backend application is initialized and has a public `/health` endpoint that returns a "200 OK" status. [cite: 508]
4.  [cite_start]A basic CI/CD pipeline is configured to build, test, and deploy the frontend and backend applications independently. [cite: 508]
5.  [cite_start]Code linting and formatting rules are established for both applications. [cite: 508]

#### **Story 1.2: System Admin Authentication**
[cite_start]**As a** System Admin, **I want** a secure login system, **so that** I can access the administrative functions of the platform. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]A `/login` page exists on the frontend application. [cite: 508]
2.  [cite_start]An admin can log in using predefined credentials (to be stored securely as environment variables for the MVP). [cite: 508]
3.  [cite_start]Upon successful login, the admin is redirected to a private Admin Dashboard page. [cite: 508]
4.  [cite_start]The system securely manages the admin's session. [cite: 508]
5.  [cite_start]Any attempt to access admin pages without being authenticated redirects the user to the login page. [cite: 508]

#### **Story 1.3: Farmer Account Creation**
[cite_start]**As a** System Admin, **I want** to create new farmer accounts via a form in the admin dashboard, **so that** new farmers can be officially registered on the platform. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]An authenticated admin can access a "Create Farmer" page from their dashboard. [cite: 508]
2.  [cite_start]The form captures the farmer's full name, home region (selected from a predefined list), and contact information. [cite: 508]
3.  [cite_start]Upon form submission, a new farmer record is created and persisted in the database. [cite: 508]
4.  [cite_start]A success message is displayed to the admin after the farmer is created. [cite: 508]
5.  [cite_start]The form includes validation to ensure all required fields are filled correctly. [cite: 508]

#### **Story 1.4: View Farmer List**
[cite_start]**As a** System Admin, **I want** to view a list of all registered farmers, **so that** I can track and manage the farmers on the platform. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]An authenticated admin can navigate to a "Farmers" page. [cite: 508]
2.  [cite_start]The page displays a table or list of all farmers currently in the system. [cite: 508]
3.  [cite_start]The list shows at least the farmer's name and home region. [cite: 508]
4.  [cite_start]If the number of farmers exceeds 20, the list is paginated. [cite: 508]

#### **Story 1.5: Buyer Account Signup and Profile**
**As a** new user on the platform, **I want** to sign up for a buyer account, **so that** I can track my orders and save my delivery information.
**Acceptance Criteria:**
1.  A public "Sign Up" page is available.
2.  A user can register with their name, email, password, and home region.
3.  Upon successful registration, the user is automatically logged in.
4.  An authenticated buyer can view a basic profile page where they can manage their delivery details.

### **Epic 2: Produce Catalog & Listings**
**Epic Goal:** With our user foundation in place, this epic focuses on the core marketplace content. We will build the functionality for System Admins to manage the entire lifecycle of produce, from defining the categories to listing individual items with all necessary details. [cite_start]Crucially, this epic also delivers the first major piece of value to buyers: a public, browsable catalog where they can see the available produce, laying the groundwork for future transactions. [cite: 501]

#### **Story 2.1: Admin Category Management**
[cite_start]**As a** System Admin, **I want** to create and manage produce categories (e.g., "Vegetables," "Fruits," "Grains"), **so that** produce listings can be properly organized for buyers. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]An authenticated admin can access a "Categories" management page from their dashboard. [cite: 508]
2.  [cite_start]The admin can add a new category by providing a name. [cite: 508]
3.  [cite_start]The admin can edit the name of an existing category. [cite: 508]
4.  [cite_start]The admin can delete a category. [cite: 508]
5.  [cite_start]The list of categories is persisted in the database. [cite: 508]

#### **Story 2.2: Admin Produce Listing Creation**
[cite_start]**As a** System Admin, **I want** to create a new produce listing on behalf of a farmer, **so that** their goods can be made available for sale on the platform. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]From the admin dashboard, an admin can initiate a "Create New Listing" workflow. [cite: 508]
2.  [cite_start]The creation form allows the admin to select a registered farmer from a list. [cite: 508]
3.  [cite_start]The form allows the admin to assign the listing to a category from the list created in Story 2.1. [cite: 508]
4.  [cite_start]The form must capture the produce name, a brief description, price, unit of measure (e.g., "per kg," "per bunch"), and the harvest date. [cite: 508]
5.  [cite_start]The admin must be able to upload at least one image for the produce listing. [cite: 508]
6.  [cite_start]Upon submission, the new listing is saved and associated with the selected farmer. [cite: 508]

#### **Story 2.3: Public Product Catalog View**
[cite_start]**As a** Buyer, **I want** to view a public catalog of all available produce filtered by my region, **so that** I can easily see what is available for purchase near me. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]A public `/products` page exists that is accessible without logging in. [cite: 508]
2.  [cite_start]The page displays all active produce listings in a grid or list format. [cite: 508]
3.  [cite_start]Each item in the catalog displays at least its name, price, and primary photo. [cite: 508]
4.  [cite_start]The catalog is automatically filtered to show only produce from farmers in the buyer's selected region. [cite: 508]
5.  [cite_start]The buyer can further filter the catalog by produce category. [cite: 508]

#### **Story 2.4: Public Product Detail View**
[cite_start]**As a** Buyer, **I want** to view the full details of a specific product, **so that** I can make an informed purchasing decision. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]Clicking on a product in the catalog navigates the user to a unique detail page for that item. [cite: 508]
2.  [cite_start]The detail page displays all information: name, all photos, description, price, unit, and harvest date. [cite: 508]
3.  [cite_start]The page clearly displays the name of the farmer selling the produce and their current star rating. [cite: 508]
4.  [cite_start]An "Add to Cart" button is prominently displayed. [cite: 508]

### **Epic 3: End-to-End Ordering & Fulfillment**
**Epic Goal:** This final epic for the MVP brings the entire marketplace to life by building the complete transactional and post-transactional experience. It connects the buyers from Epic 1 with the products from Epic 2, allowing them to place orders, choose how they receive their goods, and provide feedback. [cite_start]By the end of this epic, the platform will be a fully functional marketplace, capable of handling an entire order from discovery to fulfillment. [cite: 501]

#### **Story 3.1: Shopping Cart Functionality**
[cite_start]**As a** Buyer, **I want** to add items to a shopping cart and adjust quantities, **so that** I can prepare my order before purchasing. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]The "Add to Cart" button on a product detail page adds the selected item to the user's cart. [cite: 508]
2.  [cite_start]The buyer can view their cart at any time, seeing a list of all items, their quantities, and individual/total prices. [cite: 508]
3.  [cite_start]From the cart view, the buyer can change the quantity of any item. [cite: 508]
4.  [cite_start]From the cart view, the buyer can remove an item completely. [cite: 508]
5.  [cite_start]The cart's contents persist for a logged-in user, even if they leave the site and return later. [cite: 508]

#### **Story 3.2: Checkout & Fulfillment Selection**
[cite_start]**As a** Buyer, **I want** to proceed from my cart to a checkout process where I can confirm my order and choose my fulfillment method, **so that** I can finalize my purchase. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]A "Proceed to Checkout" button in the cart leads to an order summary page. [cite: 508]
2.  [cite_start]The user must select one of two fulfillment options: "Pickup Point" or "Home Delivery". [cite: 508]
3.  [cite_start]If "Home Delivery" is selected, the user's address from their profile is used, and the calculated delivery fee is added to the order total. [cite: 508]
4.  [cite_start]If "Pickup Point" is selected, the user can choose from a list of available pickup locations within their region. [cite: 508]

#### **Story 3.3: Order Placement & Confirmation**
[cite_start]**As a** Buyer, **I want** to place my order and receive a confirmation, **so that** I know my purchase is complete and being processed. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]A "Place Order" button on the checkout page finalizes the transaction. [cite: 508]
2.  [cite_start]An order record is created in the database with a unique ID and a default status of "Pending". [cite: 508]
3.  [cite_start]The buyer is redirected to an "Order Confirmation" page showing the order details and order number. [cite: 508]
4.  [cite_start]A notification of the new order is sent to the System Admin. [cite: 508]

#### **Story 3.4: Buyer Order History**
[cite_start]**As a** Buyer, **I want** to view a history of my past and current orders, **so that** I can track their status. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]A logged-in buyer can access an "My Orders" page from their profile. [cite: 508]
2.  [cite_start]The page lists all their past and present orders, showing at least the order date, total price, and current status. [cite: 508]
3.  [cite_start]The current status can be one of: "Pending," "Ready for Pickup," "Out for Delivery," "Completed," or "Disputed." [cite: 508]

#### **Story 3.5: Post-Order Farmer Rating**
[cite_start]**As a** Buyer, **I want** to rate the farmer after my order is completed, **so that** I can share my feedback with the community. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]When an order's status is "Completed," the buyer has an option to rate the farmer(s) from that order. [cite: 508]
2.  [cite_start]The buyer can submit a 1-5 star rating. [cite: 508]
3.  [cite_start]The submitted rating is attached to the farmer's profile and contributes to their overall average rating. [cite: 508]
4.  [cite_start]A buyer can only rate a farmer once per completed order. [cite: 508]

#### **Story 3.6: Order Dispute Submission**
[cite_start]**As a** Buyer, **I want** a way to report a problem with a completed order, **so that** I can resolve issues with quality or accuracy. [cite: 507]
**Acceptance Criteria:**
1.  [cite_start]On the detail page for a "Completed" order, the buyer has a "Report Issue" button. [cite: 508]
2.  [cite_start]Clicking the button opens a simple form where the buyer can describe the problem. [cite: 508]
3.  [cite_start]Upon submission, the order's status is changed to "Disputed," and a notification is sent to the System Admin for review. [cite: 508]

---
