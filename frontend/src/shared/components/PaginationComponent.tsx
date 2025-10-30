import React from 'react';
import { Pagination } from 'react-bootstrap';

interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  showInfo?: boolean;
  maxVisiblePages?: number;
  size?: 'sm' | 'lg';
  className?: string;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  showInfo = true,
  maxVisiblePages = 5,
  size,
  className = ''
}) => {
  // Don't render if there's only one page or less
  if (totalPages <= 1) {
    return null;
  }

  // Generate pagination items with ellipsis support
  const renderPaginationItems = () => {
    const items = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => onPageChange(i)}
            disabled={loading}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      // Show first page
      items.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => onPageChange(1)}
          disabled={loading}
        >
          1
        </Pagination.Item>
      );

      // Show ellipsis if current page is far from first page
      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="ellipsis1" disabled={loading} />);
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => onPageChange(i)}
            disabled={loading}
          >
            {i}
          </Pagination.Item>
        );
      }

      // Show ellipsis if current page is far from last page
      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="ellipsis2" disabled={loading} />);
      }

      // Show last page (if not already shown)
      if (totalPages > 1) {
        items.push(
          <Pagination.Item
            key={totalPages}
            active={totalPages === currentPage}
            onClick={() => onPageChange(totalPages)}
            disabled={loading}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    }

    return items;
  };

  return (
    <div className={`d-flex justify-content-between align-items-center ${className}`}>
      {showInfo && (
        <div className="text-muted">
          แสดงหน้า {currentPage} จาก {totalPages} หน้า
        </div>
      )}
      
      <Pagination className="mb-0" size={size}>
        <Pagination.Prev 
          disabled={currentPage === 1 || loading}
          onClick={() => onPageChange(currentPage - 1)}
        />
        {renderPaginationItems()}
        <Pagination.Next 
          disabled={currentPage === totalPages || loading}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </Pagination>
    </div>
  );
};

export default PaginationComponent;