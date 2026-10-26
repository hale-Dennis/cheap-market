package com.ftb.api.dto.request;

import java.math.BigDecimal;
import java.util.Optional;


/**
 * Optional narrowing of the public catalog beyond region and category.
 * @param search   Matches the produce name or the farmer's name, ignoring case.
 * @param minPrice Lowest price in cedis, inclusive.
 * @param maxPrice Highest price in cedis, inclusive.
 * @param topRatedFirst Order by the farmer's average rating, unrated farmers last, instead of the page's sort.
 */
public record CatalogQuery(
        Optional<String> search, Optional<BigDecimal> minPrice, Optional<BigDecimal> maxPrice, boolean topRatedFirst) {

    public static CatalogQuery none() {
        return new CatalogQuery(Optional.empty(), Optional.empty(), Optional.empty(), false);
    }
}
