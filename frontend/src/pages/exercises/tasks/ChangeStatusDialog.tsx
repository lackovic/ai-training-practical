import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import FormDialog from "../../../components/FormDialog";
import { fetchApi } from "../../../utils/apiClient";
import { triggerConfetti } from "../../../utils/confetti";
import { ExampleTask, TaskStatus } from "./types";

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.UPCOMING]: "Upcoming",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.COMPLETED]: "Completed",
};

interface ChangeStatusDialogProps {
  show: boolean;
  task: ExampleTask | null;
  onHide: () => void;
  onChanged: () => void;
}

const ChangeStatusDialog = ({ show, task, onHide, onChanged }: ChangeStatusDialogProps) => {
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.UPCOMING);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) setStatus(task.status);
  }, [task]);

  const handleHide = () => {
    setError(null);
    onHide();
  };

  const handleSubmit = async () => {
    if (!task) return;
    setIsSaving(true);
    setError(null);
    try {
      await fetchApi(`/exercises/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (status === TaskStatus.COMPLETED) triggerConfetti();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormDialog
      show={show}
      title={`Change Status: ${task?.name}`}
      onHide={handleHide}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      error={error}
      submitLabel="Change"
    >
      <Form>
        <Form.Group>
          <Form.Label>Status</Form.Label>
          <Form.Select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {Object.values(TaskStatus).map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Form>
    </FormDialog>
  );
};

export default ChangeStatusDialog;
