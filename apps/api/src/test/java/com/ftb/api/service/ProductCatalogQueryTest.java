package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.ftb.api.model.User;
import com.ftb.api.model.Product;
import com.ftb.api.model.Category;
import com.ftb.api.model.UserRole;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.model.ProductStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.ProductMapperImpl;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import com.ftb.api.service.storage.ImageStorage;
import com.ftb.api.dto.request.CatalogQuery;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;
import com.ftb.api.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.*;


/**
 * Runs the public catalog query against the real PostgreSQL database (DB_URL), since filtering
 * by joined farmer fields can't be verified with mocks. Each test rolls back.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({ProductService.class, ProductMapperImpl.class})
class ProductCatalogQueryTest {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("name"));

    @Autowired
    private ProductService productService;

    @Autowired
    private TestEntityManager entityManager;

    @MockitoBean
    private ImageStorage imageStorage;

    private Category vegetables;
    private Category fruits;
    private User voltaFarmer;

    @BeforeEach
    void seed() {
        vegetables = persist(Category.builder().name("Vegetables " + UUID.randomUUID()).build());
        fruits = persist(Category.builder().name("Fruits " + UUID.randomUUID()).build());
        voltaFarmer = farmer("Volta Farmer", "VOLTA", AccountStatus.ACTIVE);
    }

    private <T> T persist(T entity) {
        return entityManager.persistAndFlush(entity);
    }

    private User farmer(String name, String region, AccountStatus status) {
        return persist(User.builder()
                .fullName(name)
                .phoneNumber("+23320" + (int) (Math.random() * 10_000_000))
                .passwordHash("x")
                .region(region)
                .role(UserRole.FARMER)
                .accountStatus(status)
                .build());
    }

    private Product product(String name, User farmer, Category category, ProductStatus status, String price, List<String> images) {
        return persist(Product.builder()
                .name(name)
                .farmer(farmer)
                .category(category)
                .price(new BigDecimal(price))
                .unit("per kg")
                .stockQuantity(0)
                .harvestDate(LocalDate.now())
                .listingStatus(status)
                .imageUrls(images)
                .build());
    }

    private List<String> names(PaginatedResponse<ProductCardResponse> page) {
        return page.getContent().stream().map(ProductCardResponse::getName).toList();
    }

    @Test
    void returnsOnlyActiveListingsFromActiveFarmersInTheRegion() {
        User ashantiFarmer = farmer("Ashanti Farmer", "ASHANTI", AccountStatus.ACTIVE);
        User suspendedVoltaFarmer = farmer("Suspended Farmer", "VOLTA", AccountStatus.SUSPENDED);
        product("Volta Okro", voltaFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("Volta Hidden", voltaFarmer, vegetables, ProductStatus.INACTIVE, "10.00", List.of("/a.jpg"));
        product("Volta Sold Out", voltaFarmer, vegetables, ProductStatus.SOLD_OUT, "10.00", List.of("/a.jpg"));
        product("Ashanti Yam", ashantiFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("Suspended Pepper", suspendedVoltaFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));

        PaginatedResponse<ProductCardResponse> result =
                productService.getPublicProducts("VOLTA", Optional.empty(), PageRequest.of(0, 20, NEWEST_FIRST));

        assertEquals(List.of("Volta Okro"), names(result));
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void filtersByCategory() {
        product("Okro", voltaFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("Mango", voltaFarmer, fruits, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));

        PaginatedResponse<ProductCardResponse> result =
                productService.getPublicProducts("VOLTA", Optional.of(fruits.getId()), PageRequest.of(0, 20, NEWEST_FIRST));

        assertEquals(List.of("Mango"), names(result));
    }

    @Test
    void cardsCarryPriceInPesewasPrimaryImageFarmerAndCategory() {
        product("Tomatoes", voltaFarmer, vegetables, ProductStatus.ACTIVE, "18.50", List.of("/first.jpg", "/second.jpg"));
        product("No Photo Garden Eggs", voltaFarmer, vegetables, ProductStatus.ACTIVE, "5.00", null);

        List<ProductCardResponse> cards = productService.getPublicProducts(
                "VOLTA", Optional.empty(), PageRequest.of(0, 20, Sort.by("name"))).getContent();

        ProductCardResponse noPhoto = cards.get(0);
        ProductCardResponse tomatoes = cards.get(1);
        assertNull(noPhoto.getPrimaryImageUrl());
        assertEquals(1850, tomatoes.getPriceCents());
        assertEquals("/first.jpg", tomatoes.getPrimaryImageUrl());
        assertEquals("Volta Farmer", tomatoes.getFarmerName());
        assertEquals(vegetables.getName(), tomatoes.getCategoryName());
        assertEquals(LocalDate.now(), tomatoes.getHarvestDate());
    }

    @Test
    void paginatesTwentyPerPage() {
        for (int i = 1; i <= 23; i++) {
            product(String.format("Item %02d", i), voltaFarmer, vegetables, ProductStatus.ACTIVE, "1.00", List.of("/a.jpg"));
        }

        PaginatedResponse<ProductCardResponse> first =
                productService.getPublicProducts("VOLTA", Optional.empty(), PageRequest.of(0, 20, Sort.by("name")));
        PaginatedResponse<ProductCardResponse> second =
                productService.getPublicProducts("VOLTA", Optional.empty(), PageRequest.of(1, 20, Sort.by("name")));

        assertEquals(20, first.getContent().size());
        assertEquals(3, second.getContent().size());
        assertEquals(23, first.getTotalElements());
        assertEquals(2, first.getTotalPages());
        assertEquals("Item 21", second.getContent().get(0).getName());
    }

    private PaginatedResponse<ProductCardResponse> search(CatalogQuery query, Sort sort) {
        return productService.getPublicProducts("VOLTA", Optional.empty(), query, PageRequest.of(0, 20, sort));
    }

    @Test
    void search_ShouldMatchProduceOrFarmerNameIgnoringCase() {
        User kofi = farmer("Kofi Mensah", "VOLTA", AccountStatus.ACTIVE);
        product("Sweet Okro", voltaFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("Plantain", kofi, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("Mango", voltaFarmer, fruits, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));

        Sort byName = Sort.by("name");
        assertEquals(List.of("Sweet Okro"), names(search(new CatalogQuery(Optional.of("  OKRO "), Optional.empty(), Optional.empty(), false), byName)));
        assertEquals(List.of("Plantain"), names(search(new CatalogQuery(Optional.of("mensah"), Optional.empty(), Optional.empty(), false), byName)));
        assertEquals(3, search(new CatalogQuery(Optional.of("   "), Optional.empty(), Optional.empty(), false), byName).getTotalElements());
    }

    @Test
    void search_ShouldTreatWildcardCharactersLiterally() {
        product("100% Organic Yam", voltaFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("1000 Oranges", voltaFarmer, fruits, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));

        assertEquals(List.of("100% Organic Yam"),
                names(search(new CatalogQuery(Optional.of("100%"), Optional.empty(), Optional.empty(), false), Sort.by("name"))));
        assertEquals(0, search(new CatalogQuery(Optional.of("_"), Optional.empty(), Optional.empty(), false), Sort.by("name")).getTotalElements());
    }

    @Test
    void priceRange_ShouldBeInclusive() {
        product("Cheap", voltaFarmer, vegetables, ProductStatus.ACTIVE, "4.99", List.of("/a.jpg"));
        product("Five", voltaFarmer, vegetables, ProductStatus.ACTIVE, "5.00", List.of("/a.jpg"));
        product("Ten", voltaFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("Dear", voltaFarmer, vegetables, ProductStatus.ACTIVE, "10.01", List.of("/a.jpg"));

        CatalogQuery fiveToTen = new CatalogQuery(Optional.empty(), Optional.of(new BigDecimal("5")), Optional.of(new BigDecimal("10")), false);

        assertEquals(List.of("Five", "Ten"), names(search(fiveToTen, Sort.by("price"))));
    }

    @Test
    void sortByFarmerRating_ShouldPutBestRatedFirstAndUnratedLast() {
        User unrated = farmer("Unrated Farmer", "VOLTA", AccountStatus.ACTIVE);
        User topRated = farmer("Top Farmer", "VOLTA", AccountStatus.ACTIVE);
        topRated.setAverageRating(4.9);
        voltaFarmer.setAverageRating(3.5);
        entityManager.persistAndFlush(topRated);
        entityManager.persistAndFlush(voltaFarmer);
        product("From Unrated", unrated, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("From Volta", voltaFarmer, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));
        product("From Top", topRated, vegetables, ProductStatus.ACTIVE, "10.00", List.of("/a.jpg"));

        CatalogQuery topRatedFirst = new CatalogQuery(Optional.empty(), Optional.empty(), Optional.empty(), true);
        PaginatedResponse<ProductCardResponse> result = search(topRatedFirst, Sort.unsorted());

        assertEquals(List.of("From Top", "From Volta", "From Unrated"), names(result));
        assertEquals(3, result.getTotalElements());
    }

    @Test
    void detail_ShouldReturnAllFieldsWithFarmerRatingAndCategory() {
        voltaFarmer.setAverageRating(4.5);
        voltaFarmer.setRatingCount(12);
        entityManager.persistAndFlush(voltaFarmer);
        Product tomatoes = product("Tomatoes", voltaFarmer, vegetables, ProductStatus.ACTIVE, "18.50", List.of("/1.jpg", "/2.jpg"));
        entityManager.clear();

        ProductDetailResponse detail = productService.getPublicProductById(tomatoes.getId());

        assertEquals("Tomatoes", detail.getName());
        assertEquals(1850, detail.getPriceCents());
        assertEquals(List.of("/1.jpg", "/2.jpg"), detail.getImageUrls());
        assertEquals(vegetables.getName(), detail.getCategoryName());
        assertEquals("Volta Farmer", detail.getFarmer().getFullName());
        assertEquals("VOLTA", detail.getFarmer().getRegion());
        assertEquals(4.5, detail.getFarmer().getAverageRating());
        assertEquals(12, detail.getFarmer().getRatingCount());
    }

    @Test
    void detail_ShouldHideInactiveListingsAndSuspendedFarmers() {
        Product inactive = product("Hidden", voltaFarmer, vegetables, ProductStatus.INACTIVE, "1.00", List.of("/a.jpg"));
        User suspended = farmer("Suspended", "VOLTA", AccountStatus.SUSPENDED);
        Product fromSuspended = product("Pepper", suspended, vegetables, ProductStatus.ACTIVE, "1.00", List.of("/a.jpg"));

        assertThrows(ResourceNotFoundException.class, () -> productService.getPublicProductById(inactive.getId()));
        assertThrows(ResourceNotFoundException.class, () -> productService.getPublicProductById(fromSuspended.getId()));
        assertThrows(ResourceNotFoundException.class, () -> productService.getPublicProductById(UUID.randomUUID()));
    }
}
