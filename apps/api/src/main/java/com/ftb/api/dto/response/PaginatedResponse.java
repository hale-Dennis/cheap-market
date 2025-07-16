package com.ftb.api.dto.response;

import lombok.Data;
import java.util.List;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponse<T> {

    /** The list of items on the current page. */
    private List<T> content;

    /** The current page number (zero-based). */
    private int currentPage;

    /** The total number of pages available. */
    private int totalPages;

    /** The total number of items across all pages. */
    private long totalElements;

    /** The number of items requested per page. */
    private int size;
}