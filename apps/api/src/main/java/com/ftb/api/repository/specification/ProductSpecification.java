package com.ftb.api.repository.specification;

import com.ftb.api.model.Product;
import com.ftb.api.model.ProductStatus;
import com.ftb.api.model.User;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class ProductSpecification {

    public static Specification<Product> hasStatus(ProductStatus status) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("listingStatus"), status);
    }

    public static Specification<Product> inRegion(String region) {
        return (root, query, criteriaBuilder) -> {
            Join<Product, User> farmerJoin = root.join("farmer");
            return criteriaBuilder.equal(farmerJoin.get("region"), region);
        };
    }

    public static Specification<Product> inCategory(UUID categoryId) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("category").get("id"), categoryId);
    }
}