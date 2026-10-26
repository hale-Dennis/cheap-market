package com.ftb.api.repository;

import com.ftb.api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    /**
     * Checks if any product is associated with the given category ID.
     * @param categoryId The ID of the category to check.
     * @return true if at least one product references the category, false otherwise.
     */
    boolean existsByCategoryId(UUID categoryId);

    boolean existsByFarmerId(UUID farmerId);

    /** Loads each product's farmer and category in the same query, avoiding one extra query per card. */
    @Override
    @EntityGraph(attributePaths = {"farmer", "category"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    /** A product with its farmer and category, for the public detail page. */
    @EntityGraph(attributePaths = {"farmer", "category"})
    Optional<Product> findWithFarmerAndCategoryById(UUID id);

    /** Listings buyers can see: active, from farmers who aren't suspended (as in the public catalog). */
    @Query("select count(p) from Product p where p.listingStatus = com.ftb.api.model.ProductStatus.ACTIVE"
            + " and p.farmer.accountStatus = com.ftb.api.model.AccountStatus.ACTIVE")
    long countLiveListings();

    /** Regions with at least one listing buyers can see. */
    @Query("select count(distinct p.farmer.region) from Product p where p.listingStatus = com.ftb.api.model.ProductStatus.ACTIVE"
            + " and p.farmer.accountStatus = com.ftb.api.model.AccountStatus.ACTIVE")
    long countRegionsWithLiveListings();
}
