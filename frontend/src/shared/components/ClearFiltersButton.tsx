import React from 'react';
import { Button } from 'react-bootstrap';

interface ClearFiltersButtonProps {
  onClear: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'lg';
  variant?: string;
  text?: string;
}

const ClearFiltersButton: React.FC<ClearFiltersButtonProps> = ({
  onClear,
  loading = false,
  disabled = false,
  className = 'w-100',
  size,
  variant = 'outline-secondary',
  text = 'ล้างตัวกรอง'
}) => {
  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      onClick={onClear}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          กำลังล้าง...
        </>
      ) : (
        <>
          <i className="fas fa-eraser me-1"></i>
          {text}
        </>
      )}
    </Button>
  );
};

export default ClearFiltersButton;