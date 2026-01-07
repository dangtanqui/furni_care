import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationProps } from '../types/components/Pagination';
import '../styles/components/Pagination.css';

export default function Pagination({ pagination, onPageChange, itemName = 'items' }: PaginationProps) {
  const paginationInfo = (
    <div className="pagination-info">
      Showing {(pagination.page - 1) * pagination.per_page + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} {itemName}
    </div>
  );

  // If only 1 page, show only the info text without controls
  if (pagination.total_pages <= 1) {
    return (
      <div className="pagination-container">
        {paginationInfo}
      </div>
    );
  }

  return (
    <div className="pagination-container">
      {paginationInfo}
      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="pagination-button"
          aria-label="Previous page"
        >
          <ChevronLeft className="pagination-icon" />
          <span className="pagination-button-text">Previous</span>
        </button>
        <div className="pagination-page-numbers">
          {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
            let pageNum;
            if (pagination.total_pages <= 5) {
              pageNum = i + 1;
            } else if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.total_pages - 2) {
              pageNum = pagination.total_pages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={pagination.page === pageNum ? 'pagination-button-active' : 'pagination-button-inactive'}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.total_pages}
          className="pagination-button"
          aria-label="Next page"
        >
          <span className="pagination-button-text">Next</span>
          <ChevronRight className="pagination-icon" />
        </button>
      </div>
    </div>
  );
}

