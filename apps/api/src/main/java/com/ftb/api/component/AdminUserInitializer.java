package com.ftb.api.component;

import com.ftb.api.model.User;
import lombok.extern.slf4j.Slf4j;
import com.ftb.api.model.UserRole;
import lombok.RequiredArgsConstructor;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;


@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    //TODO: add phoneNumber and region to application.yml

    @Value("${application.security.admin.username}")
    private String adminUsername;

    @Value("${application.security.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(adminUsername)) {
            User adminUser = User.builder()
                    .fullName("System Admin")
                    .email(adminUsername)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(UserRole.ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .phoneNumber("000-000-0000")
                    .region("ASHANTI")
                    .build();
            userRepository.save(adminUser);
            log.info("Default admin user created successfully.");
        } else {
            log.info("Admin user already exists. Skipping creation.");
        }
    }
}