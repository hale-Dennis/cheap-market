package com.ftb.api.repository.specification;

import com.ftb.api.model.Product;
import com.ftb.api.model.ProductStatus;
import com.ftb.api.model.User;
import com.ftb.api.model.AccountStatus;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Locale;
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

    /** Hides listings of suspended farmers from the public catalog. */
    public static Specification<Product> fromActiveFarmers() {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.join("farmer").get("accountStatus"), AccountStatus.ACTIVE);
    }

    public static Specification<Product> inCategory(UUID categoryId) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("category").get("id"), categoryId);
    }

    /** The produce name or the farmer's name contains the text, ignoring case; % and _ match literally. */
    public static Specification<Product> nameOrFarmerContains(String text) {
        String pattern = "%" + text.toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_") + "%";
        return (root, query, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern, '\\'),
                criteriaBuilder.like(criteriaBuilder.lower(root.join("farmer").get("fullName")), pattern, '\\'));
    }

    /**
     * Orders by the farmer's average rating, best first and unrated farmers last, then newest first.
     * Done here rather than with a Sort because Hibernate can't apply NULLS LAST to criteria queries.
     * Use with an unsorted Pageable, which would otherwise replace this order.
     */
    public static Specification<Product> orderedByFarmerRating() {
        return (root, query, criteriaBuilder) -> {
            // The page's count query has no order.
            if (!Long.class.equals(query.getResultType())) {
                Expression<Double> rating = root.join("farmer").get("averageRating");
                query.orderBy(
                        criteriaBuilder.desc(criteriaBuilder.coalesce(rating, -1.0)),
                        criteriaBuilder.desc(root.get("createdAt")),
                        criteriaBuilder.asc(root.get("name")),
                        criteriaBuilder.asc(root.get("id")));
            }
            return null;
        };
    }

    public static Specification<Product> priceAtLeast(BigDecimal minPrice) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Product> priceAtMost(BigDecimal maxPrice) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice);
    }
}