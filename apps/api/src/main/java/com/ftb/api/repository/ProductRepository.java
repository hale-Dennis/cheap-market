package com.ftb.api.repository;

import com.ftb.api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    /**
     * Checks if any product is associated with the given category ID.
     * @param categoryId The ID of the category to check.
     * @return true if at least one product references the category, false otherwise.
     */
    boolean existsByCategoryId(UUID categoryId);
}