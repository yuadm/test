import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at the beginning
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4);
      }
      
      // Adjust if at the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center space-x-1 my-4 ${className}`}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'
        }`}
        aria-label="Previous page"
      >
        &laquo;
      </button>
      
      {/* Page numbers */}
      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === -1 || page === -2 ? (
            <span className="px-3 py-1">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'
        }`}
        aria-label="Next page"
      >
        &raquo;
      </button>
    </div>
  );
};

export default Pagination;
