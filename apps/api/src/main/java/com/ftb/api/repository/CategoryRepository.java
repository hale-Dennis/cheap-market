package com.ftb.api.repository;

import com.ftb.api.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    /**
     * Checks if a category exists with the given name, ignoring case.
     * @param name The category name to check.
     * @return true if a category with the name exists, false otherwise.
     */
    boolean existsByNameIgnoreCase(String name);
}