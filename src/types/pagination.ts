/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Create a paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[], 
  total: number, 
  page: number, 
  pageSize: number
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}
