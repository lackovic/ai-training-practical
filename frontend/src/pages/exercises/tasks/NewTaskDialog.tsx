import { useState } from "react";
import { Form } from "react-bootstrap";
import FormDialog from "../../../components/FormDialog";
import { fetchApi } from "../../../utils/apiClient";
import { ExampleTask, TaskPriority, TaskStatus } from "./types";

interface NewTaskForm {
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

const emptyForm: NewTaskForm = {
  name: "",
  description: "",
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.UPCOMING,
};

interface NewTaskDialogProps {
  show: boolean;
  onHide: () => void;
  onCreated: () => void;
}

const NewTaskDialog = ({ show, onHide, onCreated }: NewTaskDialogProps) => {
  const [form, setForm] = useState<NewTaskForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHide = () => {
    setForm(emptyForm);
    setError(null);
    onHide();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Task name is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await fetchApi<ExampleTask>("/exercises/tasks", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          status: form.status,
        }),
      });
      setForm(emptyForm);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormDialog
      show={show}
      title="New Task"
      onHide={handleHide}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      error={error}
      submitLabel="Create"
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

export default NewTaskDialog;
