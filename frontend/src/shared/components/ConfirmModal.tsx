import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title = 'ยืนยันการดำเนินการ',
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`bi ${getIcon(variant)} me-2`} style={{ color: getColor(variant) }}></i>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Helper functions
const getIcon = (variant: string) => {
  switch (variant) {
    case 'danger': return 'bi-exclamation-triangle-fill';
    case 'warning': return 'bi-exclamation-triangle';
    case 'success': return 'bi-check-circle-fill';
    case 'primary': return 'bi-info-circle-fill';
    default: return 'bi-question-circle-fill';
  }
};

const getColor = (variant: string) => {
  switch (variant) {
    case 'danger': return '#dc3545';
    case 'warning': return '#ffc107';
    case 'success': return '#198754';
    case 'primary': return '#0d6efd';
    default: return '#6c757d';
  }
};

export default ConfirmModal;