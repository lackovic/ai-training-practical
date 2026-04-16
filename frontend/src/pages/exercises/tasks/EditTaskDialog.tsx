import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import FormDialog from "../../../components/FormDialog";
import { fetchApi } from "../../../utils/apiClient";
import { ExampleTask, TaskPriority, TaskStatus } from "./types";

interface EditTaskForm {
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface EditTaskDialogProps {
  show: boolean;
  task: ExampleTask | null;
  onHide: () => void;
  onUpdated: () => void;
}

const EditTaskDialog = ({ show, task, onHide, onUpdated }: EditTaskDialogProps) => {
  const [form, setForm] = useState<EditTaskForm>({
    name: "",
    description: "",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.UPCOMING,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name,
        description: task.description ?? "",
        priority: task.priority,
        status: task.status,
      });
      setError(null);
    }
  }, [task]);

  const handleHide = () => {
    setError(null);
    onHide();
  };

  const handleSubmit = async () => {
    if (!task) return;
    if (!form.name.trim()) {
      setError("Task name is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await fetchApi(`/exercises/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          status: form.status,
        }),
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormDialog
      show={show}
      title={`Edit: ${task?.name}`}
      onHide={handleHide}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      error={error}
      submitLabel="Save"
    >
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter task name"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Enter task description (optional)"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Priority</Form.Label>
          <Form.Select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
          >
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
          >
            <option value={TaskStatus.UPCOMING}>Upcoming</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </Form.Select>
        </Form.Group>
      </Form>
    </FormDialog>
  );
};

export default EditTaskDialog;
