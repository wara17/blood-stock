import React from 'react';
import { Form } from 'react-bootstrap';

interface SearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  name?: string;
  className?: string;
  showSpinner?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  loading = false,
  disabled = false,
  name,
  className = '',
  showSpinner = true
}) => {
  return (
    <Form.Group className={className}>
      <Form.Label>
        {label}
        {loading && showSpinner && (
          <span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>
        )}
      </Form.Label>
      <div className="position-relative">
        <Form.Control
          type="text"
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
        />
        {loading && showSpinner && (
          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">กำลังค้นหา...</span>
            </div>
          </div>
        )}
      </div>
    </Form.Group>
  );
};

export default SearchInput;