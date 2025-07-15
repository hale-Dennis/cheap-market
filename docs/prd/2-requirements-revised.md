# **2. Requirements (Revised)**

## **Functional**
1. **FR1:** The system must provide a secure portal for System Admins to create and manage farmer accounts.
2. **FR2:** System Admins must be able to create, update, and manage produce listings on behalf of farmers.
    * [cite_start]*Listings must include details like name, a pre-defined category, and price.* [cite: 474]
    * *The freshness indicator for produce will be a **harvest date**, set by the Admin during listing.*
3. **FR3:** Buyers must be able to browse a public product catalog where produce is organized by categories.
4. **FR4:** The platform must be geofenced. For the MVP, this will be achieved by having the **buyer select their region from a pre-defined list** to see local produce.
5. **FR5:** The platform must support a shopping cart, allowing buyers to add multiple items from one or more farmers before proceeding to checkout.
6. **FR6:** The checkout process must allow buyers to select a fulfillment option: either a pre-defined pickup point or home delivery.
    * *The fee for home delivery will be calculated based on **distance**.*
7. **FR7:** The system must implement a simple 1-5 star rating system for buyers to rate farmers after a completed order.
8. **FR8:** The system must provide a basic mechanism (e.g., a contact form) for a buyer to initiate a quality or order dispute.
    * *Upon submission, a notification must be sent to **System Admins**.*
9. **FR9:** System Admins must have an interface to create and manage the list of available pickup point locations.

## **Non-Functional**
1. **NFR1:** The platform must be a responsive web application, fully functional and usable on both modern desktop and mobile browsers. [cite: 475]
2. **NFR2:** The user interface must be intuitive and user-friendly, minimizing the learning curve for both buyers and System Admins. [cite: 475]
3. **NFR3:** The system must be secure, ensuring the protection of all user data (including buyer information and farmer details) and implementing standard security practices. [cite: 475]
4. **NFR4:** The platform must be performant, with fast page load times and responsive interactions, even on potentially slower internet connections. [cite: 475] 