# 10. Coding Standards

* **Type Sharing:** Shared types must be defined in the `packages/shared-types` directory.
* **API Layer Abstraction:** Frontend components must not call HTTP clients directly; they must use the defined service layer.
* **Database Access:** Backend services must use the Repository pattern for all database queries. 