import React from "react";
import { Modal, Button, Alert } from "react-bootstrap";

interface FormDialogProps {
  show: boolean;
  title: string;
  onHide: () => void;
  onSubmit: () => void;
  isSaving?: boolean;
  error?: string | null;
  submitLabel?: string;
  children: React.ReactNode;
}

const FormDialog = ({
  show,
  title,
  onHide,
  onSubmit,
  isSaving = false,
  error = null,
  submitLabel = "Save",
  children,
}: FormDialogProps) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={isSaving}>
          {isSaving ? "Saving..." : submitLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FormDialog;
