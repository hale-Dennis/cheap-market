package com.ftb.api.service;

import com.ftb.api.dto.request.CategoryRequest;
import com.ftb.api.dto.response.CategoryResponse;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.mapper.CategoryMapper;
import com.ftb.api.model.Category;
import com.ftb.api.repository.CategoryRepository;
import com.ftb.api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class CategoryService {

    static final String DUPLICATE_NAME_MESSAGE = "A category with this name already exists.";

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryMapper categoryMapper;

    /** All categories, ordered by name (case-insensitive). */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(Category::getName, String.CASE_INSENSITIVE_ORDER))
                .map(categoryMapper::toCategoryResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = normalizeName(request.getName());
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException(DUPLICATE_NAME_MESSAGE);
        }
        Category category = categoryMapper.toCategory(request);
        category.setName(name);
        return categoryMapper.toCategoryResponse(saveUniquely(category));
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        String name = normalizeName(request.getName());
        // Changing only the letter case of the current name is allowed.
        if (!category.getName().equalsIgnoreCase(name) && categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException(DUPLICATE_NAME_MESSAGE);
        }

        category.setName(name);
        return categoryMapper.toCategoryResponse(saveUniquely(category));
    }

    @Transactional
    public void deleteCategory(UUID id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        if (productRepository.existsByCategoryId(id)) {
            throw new ConflictException("This category is used by produce listings and cannot be deleted.");
        }
        categoryRepository.deleteById(id);
    }

    /** Trims and collapses internal whitespace, so "  Leafy   Greens " is stored as "Leafy Greens". */
    static String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    /**
     * Flushes immediately so a duplicate inserted concurrently (which slips past the existence check)
     * is reported as a 409 instead of a generic database error.
     */
    private Category saveUniquely(Category category) {
        try {
            return categoryRepository.saveAndFlush(category);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException(DUPLICATE_NAME_MESSAGE);
        }
    }
}
