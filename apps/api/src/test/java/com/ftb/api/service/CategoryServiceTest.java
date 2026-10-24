package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import com.ftb.api.model.Category;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import com.ftb.api.mapper.CategoryMapper;
import static org.mockito.ArgumentMatchers.any;
import com.ftb.api.exception.ConflictException;
import static org.junit.jupiter.api.Assertions.*;
import com.ftb.api.dto.request.CategoryRequest;
import com.ftb.api.dto.response.CategoryResponse;
import com.ftb.api.repository.CategoryRepository;
import com.ftb.api.repository.ProductRepository;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ftb.api.exception.ResourceNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;


@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryService categoryService;

    private static Category category(String name) {
        return Category.builder().id(UUID.randomUUID()).name(name).build();
    }

    @Test
    void getAllCategories_ShouldReturnThemSortedByNameIgnoringCase() {
        when(categoryRepository.findAll()).thenReturn(List.of(category("vegetables"), category("Fruits"), category("grains")));
        when(categoryMapper.toCategoryResponse(any(Category.class)))
                .thenAnswer(invocation -> CategoryResponse.builder().name(invocation.<Category>getArgument(0).getName()).build());

        List<CategoryResponse> result = categoryService.getAllCategories();

        assertEquals(List.of("Fruits", "grains", "vegetables"), result.stream().map(CategoryResponse::getName).toList());
    }

    @Test
    void createCategory_ShouldSaveNormalisedName() {
        CategoryRequest request = new CategoryRequest("  Leafy   Greens ");
        when(categoryRepository.existsByNameIgnoreCase("Leafy Greens")).thenReturn(false);
        when(categoryMapper.toCategory(request)).thenReturn(new Category());
        when(categoryRepository.saveAndFlush(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CategoryResponse expected = CategoryResponse.builder().name("Leafy Greens").build();
        when(categoryMapper.toCategoryResponse(any(Category.class))).thenReturn(expected);

        CategoryResponse response = categoryService.createCategory(request);

        assertSame(expected, response);
        ArgumentCaptor<Category> saved = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).saveAndFlush(saved.capture());
        assertEquals("Leafy Greens", saved.getValue().getName());
    }

    @Test
    void createCategory_DuplicateNameInAnyCase_ShouldThrowConflict() {
        when(categoryRepository.existsByNameIgnoreCase("fruits")).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> categoryService.createCategory(new CategoryRequest(" fruits ")));
        assertEquals("A category with this name already exists.", ex.getMessage());
        verify(categoryRepository, never()).saveAndFlush(any());
    }

    @Test
    void createCategory_ConcurrentDuplicateRejectedByDatabase_ShouldThrowConflict() {
        CategoryRequest request = new CategoryRequest("Fruits");
        when(categoryRepository.existsByNameIgnoreCase("Fruits")).thenReturn(false);
        when(categoryMapper.toCategory(request)).thenReturn(new Category());
        when(categoryRepository.saveAndFlush(any(Category.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        assertThrows(ConflictException.class, () -> categoryService.createCategory(request));
    }

    @Test
    void updateCategory_ShouldRenameWithNormalisedName() {
        Category existing = category("Vegetables");
        when(categoryRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByNameIgnoreCase("Leafy Greens")).thenReturn(false);
        when(categoryRepository.saveAndFlush(existing)).thenReturn(existing);

        categoryService.updateCategory(existing.getId(), new CategoryRequest(" Leafy  Greens"));

        assertEquals("Leafy Greens", existing.getName());
    }

    @Test
    void updateCategory_ChangingOnlyLetterCase_ShouldBeAllowed() {
        Category existing = category("fruits");
        when(categoryRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(categoryRepository.saveAndFlush(existing)).thenReturn(existing);

        categoryService.updateCategory(existing.getId(), new CategoryRequest("Fruits"));

        assertEquals("Fruits", existing.getName());
        verify(categoryRepository, never()).existsByNameIgnoreCase(any());
    }

    @Test
    void updateCategory_ToAnotherCategorysName_ShouldThrowConflict() {
        Category existing = category("Vegetables");
        when(categoryRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByNameIgnoreCase("Fruits")).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> categoryService.updateCategory(existing.getId(), new CategoryRequest("Fruits")));
        assertEquals("Vegetables", existing.getName());
        verify(categoryRepository, never()).saveAndFlush(any());
    }

    @Test
    void updateCategory_UnknownId_ShouldThrowNotFound() {
        UUID id = UUID.randomUUID();
        when(categoryRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> categoryService.updateCategory(id, new CategoryRequest("Fruits")));
    }

    @Test
    void deleteCategory_Unused_ShouldDelete() {
        UUID id = UUID.randomUUID();
        when(categoryRepository.existsById(id)).thenReturn(true);
        when(productRepository.existsByCategoryId(id)).thenReturn(false);

        categoryService.deleteCategory(id);

        verify(categoryRepository).deleteById(id);
    }

    @Test
    void deleteCategory_UsedByProducts_ShouldThrowConflict() {
        UUID id = UUID.randomUUID();
        when(categoryRepository.existsById(id)).thenReturn(true);
        when(productRepository.existsByCategoryId(id)).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class, () -> categoryService.deleteCategory(id));
        assertEquals("This category is used by produce listings and cannot be deleted.", ex.getMessage());
        verify(categoryRepository, never()).deleteById(any());
    }

    @Test
    void deleteCategory_UnknownId_ShouldThrowNotFound() {
        UUID id = UUID.randomUUID();
        when(categoryRepository.existsById(id)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> categoryService.deleteCategory(id));
        verify(categoryRepository, never()).deleteById(any());
    }
}
