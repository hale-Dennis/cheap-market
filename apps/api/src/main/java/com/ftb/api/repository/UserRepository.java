package com.ftb.api.repository;

import java.util.Optional;
import java.util.UUID;
import com.ftb.api.model.User;
import com.ftb.api.model.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;


@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Checks if a user exists with the given email address.
     * This method is optimized to perform an efficient existence check.
     *
     * @param email The email address to check.
     * @return true if a user with the email exists, false otherwise.
     */
    boolean existsByEmail(String email);

    /**
     * Checks if a user exists with the given phone number.
     * This method is optimized to perform an efficient existence check.
     *
     * @param phoneNumber The phone number to check.
     * @return true if a user with the phone number exists, false otherwise.
     */
    boolean existsByPhoneNumber(String phoneNumber);

    /**
     * Finds a paginated list of users by their role.
     *
     * @param role The role to filter by (e.g., FARMER).
     * @param pageable The pagination information (page number, size, sort).
     * @return A Page object containing the users for the requested page.
     */
    Page<User> findByRole(UserRole role, Pageable pageable);

    /**
     * Finds a user by their email address.
     * @param email The email to search for.
     * @return An Optional containing the User if found.
     */
    Optional<User> findByEmail(String email);
}