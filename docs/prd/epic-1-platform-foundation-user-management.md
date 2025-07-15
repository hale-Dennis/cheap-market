# **Epic 1: Platform Foundation & User Management**

**Epic Goal:** This epic lays the essential groundwork for the entire platform. It involves setting up the monorepo, establishing the CI/CD pipeline for independent frontend and backend deployments, and implementing the most fundamental user feature: the ability for a System Admin to securely log in and create farmer and buyer accounts. [cite: 501]

## **Story 1.1: Project Scaffolding & Initial Deployment**
**As a** System Admin, **I want** the initial monorepo structure and a basic deployment pipeline, **so that** developers have a stable foundation to begin building features. [cite: 507]

### Acceptance Criteria
1. A monorepo is created containing initial placeholders for the `frontend` and `backend` applications. [cite: 508]
2. The React frontend application is initialized and can display a simple "Welcome" page. [cite: 508]
3. The Spring Boot backend application is initialized and has a public `/health` endpoint that returns a "200 OK" status. [cite: 508]
4. A basic CI/CD pipeline is configured to build, test, and deploy the frontend and backend applications independently. [cite: 508]
5. Code linting and formatting rules are established for both applications. [cite: 508]

## **Story 1.2: System Admin Authentication**
**As a** System Admin, **I want** a secure login system, **so that** I can access the administrative functions of the platform. [cite: 507]

### Acceptance Criteria
1. A `/login` page exists on the frontend application. [cite: 508]
2. An admin can log in using predefined credentials (to be stored securely as environment variables for the MVP). [cite: 508]
3. Upon successful login, the admin is redirected to a private Admin Dashboard page. [cite: 508]
4. The system securely manages the admin's session. [cite: 508]
5. Any attempt to access admin pages without being authenticated redirects the user to the login page. [cite: 508]

## **Story 1.3: Farmer Account Creation**
**As a** System Admin, **I want** to create new farmer accounts via a form in the admin dashboard, **so that** new farmers can be officially registered on the platform. [cite: 507]

### Acceptance Criteria
1. An authenticated admin can access a "Create Farmer" page from their dashboard. [cite: 508]
2. The form captures the farmer's full name, home region (selected from a predefined list), and contact information. [cite: 508]
3. Upon form submission, a new farmer record is created and persisted in the database. [cite: 508]
4. A success message is displayed to the admin after the farmer is created. [cite: 508]
5. The form includes validation to ensure all required fields are filled correctly. [cite: 508]

## **Story 1.4: View Farmer List**
**As a** System Admin, **I want** to view a list of all registered farmers, **so that** I can track and manage the farmers on the platform. [cite: 507]

### Acceptance Criteria
1. An authenticated admin can navigate to a "Farmers" page. [cite: 508]
2. The page displays a table or list of all farmers currently in the system. [cite: 508]
3. The list shows at least the farmer's name and home region. [cite: 508]
4. If the number of farmers exceeds 20, the list is paginated. [cite: 508]

## **Story 1.5: Buyer Account Signup and Profile**
As a new user on the platform, I want to sign up for a buyer account, so that I can track my orders and save my delivery information.

### Acceptance Criteria
1. A public "Sign Up" page is available.
2. A user can register with their name, email, password, and home region.
3. Upon successful registration, the user is automatically logged in.
4. An authenticated buyer can view a basic profile page where they can manage their delivery details. 