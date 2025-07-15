# **Epic 3: End-to-End Ordering & Fulfillment**

**Epic Goal:** This final epic for the MVP brings the entire marketplace to life by building the complete transactional and post-transactional experience. It connects the buyers from Epic 1 with the products from Epic 2, allowing them to place orders, choose how they receive their goods, and provide feedback. By the end of this epic, the platform will be a fully functional marketplace, capable of handling an entire order from discovery to fulfillment. [cite: 501]

## **Story 3.1: Shopping Cart Functionality**
**As a** Buyer, **I want** to add items to a shopping cart and adjust quantities, so that I can prepare my order before purchasing. [cite: 507]

### Acceptance Criteria
1. The "Add to Cart" button on a product detail page adds the selected item to the user's cart. [cite: 508]
2. The buyer can view their cart at any time, seeing a list of all items, their quantities, and individual/total prices. [cite: 508]
3. From the cart view, the buyer can change the quantity of any item. [cite: 508]
4. From the cart view, the buyer can remove an item completely. [cite: 508]
5. The cart's contents persist for a logged-in user, even if they leave the site and return later. [cite: 508]

## **Story 3.2: Checkout & Fulfillment Selection**
**As a** Buyer, **I want** to proceed from my cart to a checkout process where I can confirm my order and choose my fulfillment method, so that I can finalize my purchase. [cite: 507]

### Acceptance Criteria
1. A "Proceed to Checkout" button in the cart leads to an order summary page. [cite: 508]
2. The user must select one of two fulfillment options: "Pickup Point" or "Home Delivery". [cite: 508]
3. If "Home Delivery" is selected, the user's address from their profile is used, and the calculated delivery fee is added to the order total. [cite: 508]
4. If "Pickup Point" is selected, the user can choose from a list of available pickup locations within their region. [cite: 508]

## **Story 3.3: Order Placement & Confirmation**
**As a** Buyer, **I want** to place my order and receive a confirmation, so that I know my purchase is complete and being processed. [cite: 507]

### Acceptance Criteria
1. A "Place Order" button on the checkout page finalizes the transaction. [cite: 508]
2. An order record is created in the database with a unique ID and a default status of "Pending". [cite: 508]
3. The buyer is redirected to an "Order Confirmation" page showing the order details and order number. [cite: 508]
4. A notification of the new order is sent to the System Admin. [cite: 508]

## **Story 3.4: Buyer Order History**
**As a** Buyer, **I want** to view a history of my past and current orders, so that I can track their status. [cite: 507]

### Acceptance Criteria
1. A logged-in buyer can access an "My Orders" page from their profile. [cite: 508]
2. The page lists all their past and present orders, showing at least the order date, total price, and current status. [cite: 508]
3. The current status can be one of: "Pending," "Ready for Pickup," "Out for Delivery," "Completed," or "Disputed." [cite: 508]

## **Story 3.5: Post-Order Farmer Rating**
**As a** Buyer, **I want** to rate the farmer after my order is completed, so that I can share my feedback with the community. [cite: 507]

### Acceptance Criteria
1. When an order's status is "Completed," the buyer has an option to rate the farmer(s) from that order. [cite: 508]
2. The buyer can submit a 1-5 star rating. [cite: 508]
3. The submitted rating is attached to the farmer's profile and contributes to their overall average rating. [cite: 508]
4. A buyer can only rate a farmer once per completed order. [cite: 508]

## **Story 3.6: Order Dispute Submission**
**As a** Buyer, **I want** a way to report a problem with a completed order, so that I can resolve issues with quality or accuracy. [cite: 507]

### Acceptance Criteria
1. On the detail page for a "Completed" order, the buyer has a "Report Issue" button. [cite: 508]
2. Clicking the button opens a simple form where the buyer can describe the problem. [cite: 508]
3. Upon submission, the order's status is changed to "Disputed," and a notification is sent to the System Admin for review. [cite: 508] 