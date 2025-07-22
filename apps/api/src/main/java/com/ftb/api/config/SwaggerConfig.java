package com.ftb.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import io.swagger.v3.oas.models.responses.ApiResponse;


@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Cheap Market API")
                .version("1.0")
                .description("API for connecting buyers to farmers")
                .contact(new Contact().name("Developer").email("me@myemail.com")));
    }

    @Bean
    public OperationCustomizer customizeApiResponses() {
        return (operation, handlerMethod) -> {
            ApiResponses responses = operation.getResponses();

            if (handlerMethod.getMethod().isAnnotationPresent(PostMapping.class)) {
                responses.remove("200");
                ApiResponse createdResponse = new ApiResponse().description("The resource was created successfully.");
                responses.addApiResponse("201", createdResponse);
            }

            if (handlerMethod.getMethod().isAnnotationPresent(DeleteMapping.class)) {

                if (handlerMethod.getMethod().getReturnType().equals(ResponseEntity.class)) {
                    responses.remove("200");
                    ApiResponse noContentResponse = new ApiResponse().description("The resource was deleted successfully.");
                    responses.addApiResponse("204", noContentResponse);
                }
            }

            return operation;
        };
    }
}