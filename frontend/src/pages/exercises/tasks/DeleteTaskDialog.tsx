import { useState } from "react";
import FormDialog from "../../../components/FormDialog";
import { fetchApi } from "../../../utils/apiClient";
import { ExampleTask } from "./types";

interface DeleteTaskDialogProps {
  show: boolean;
  task: ExampleTask | null;
  onHide: () => void;
  onDeleted: () => void;
}

const DeleteTaskDialog = ({ show, task, onHide, onDeleted }: DeleteTaskDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHide = () => {
    setError(null);
    onHide();
  };

  const handleSubmit = async () => {
    if (!task) return;
    setIsDeleting(true);
    setError(null);
    try {
      await fetchApi(`/exercises/tasks/${task.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <FormDialog
      show={show}
      title={`Delete: ${task?.name}`}
      onHide={handleHide}
      onSubmit={handleSubmit}
      isSaving={isDeleting}
      error={error}
      submitLabel="Delete"
      submitVariant="danger"
    >
      <p>Are you sure you want to delete <strong>{task?.name}</strong>? This action cannot be undone.</p>
    </FormDialog>
  );
};

export default DeleteTaskDialog;
