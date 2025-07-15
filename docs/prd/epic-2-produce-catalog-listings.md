# **Epic 2: Produce Catalog & Listings**

**Epic Goal:** With our user foundation in place, this epic focuses on the core marketplace content. We will build the functionality for System Admins to manage the entire lifecycle of produce, from defining the categories to listing individual items with all necessary details. Crucially, this epic also delivers the first major piece of value to buyers: a public, browsable catalog where they can see the available produce, laying the groundwork for future transactions. [cite: 501]

## **Story 2.1: Admin Category Management**
**As a** System Admin, **I want** to create and manage produce categories (e.g., "Vegetables," "Fruits," "Grains"), **so that** produce listings can be properly organized for buyers. [cite: 507]

### Acceptance Criteria
1. An authenticated admin can access a "Categories" management page from their dashboard. [cite: 508]
2. The admin can add a new category by providing a name. [cite: 508]
3. The admin can edit the name of an existing category. [cite: 508]
4. The admin can delete a category. [cite: 508]
5. The list of categories is persisted in the database. [cite: 508]

## **Story 2.2: Admin Produce Listing Creation**
**As a** System Admin, **I want** to create a new produce listing on behalf of a farmer, so that their goods can be made available for sale on the platform. [cite: 507]

### Acceptance Criteria
1. From the admin dashboard, an admin can initiate a "Create New Listing" workflow. [cite: 508]
2. The creation form allows the admin to select a registered farmer from a list. [cite: 508]
3. The form allows the admin to assign the listing to a category from the list created in Story 2.1. [cite: 508]
4. The form must capture the produce name, a brief description, price, unit of measure (e.g., "per kg," "per bunch"), and the harvest date. [cite: 508]
5. The admin must be able to upload at least one image for the produce listing. [cite: 508]
6. Upon submission, the new listing is saved and associated with the selected farmer. [cite: 508]

## **Story 2.3: Public Product Catalog View**
**As a** Buyer, **I want** to view a public catalog of all available produce filtered by my region, so that I can easily see what is available for purchase near me. [cite: 507]

### Acceptance Criteria
1. A public `/products` page exists that is accessible without logging in. [cite: 508]
2. The page displays all active produce listings in a grid or list format. [cite: 508]
3. Each item in the catalog displays at least its name, price, and primary photo. [cite: 508]
4. The catalog is automatically filtered to show only produce from farmers in the buyer's selected region. [cite: 508]
5. The buyer can further filter the catalog by produce category. [cite: 508]

## **Story 2.4: Public Product Detail View**
**As a** Buyer, **I want** to view the full details of a specific product, so that I can make an informed purchasing decision. [cite: 507]

### Acceptance Criteria
1. Clicking on a product in the catalog navigates the user to a unique detail page for that item. [cite: 508]
2. The detail page displays all information: name, all photos, description, price, unit, and harvest date. [cite: 508]
3. The page clearly displays the name of the farmer selling the produce and their current star rating. [cite: 508]
4. An "Add to Cart" button is prominently displayed. [cite: 508] 