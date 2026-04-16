import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Container,
  Button,
  Table,
  Badge,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Plus, Copy, Sparkles } from "lucide-react";

import { fetchApi } from "../../../utils/apiClient";
import { ExampleTask, TaskPriority, TaskStatus } from "./types";
import NewTaskDialog from "./NewTaskDialog";
import ChangeStatusDialog from "./ChangeStatusDialog";
import DeleteTaskDialog from "./DeleteTaskDialog";

const priorityVariantMap: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "success",
  [TaskPriority.MEDIUM]: "warning",
  [TaskPriority.HIGH]: "danger",
};

const statusMap: Record<TaskStatus, string> = {
  [TaskStatus.UPCOMING]: "Upcoming",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.COMPLETED]: "Completed",
};

const promptBlockStyle: React.CSSProperties = {
  background: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  padding: '10px 14px',
  fontSize: '0.9rem',
  lineHeight: '1.5',
  cursor: 'pointer',
};

const RevealablePrompt = ({ children }: { children: string }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!revealed) {
    return (
      <a href="#" className="small" onClick={(e) => { e.preventDefault(); setRevealed(true); }}>
        <Sparkles size={14} className="me-1" />show me an example prompt
      </a>
    );
  }

  return (
    <div style={promptBlockStyle} onClick={handleCopy} title="Click to copy" className="mt-1">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <span>{children}</span>
        <span className="text-muted flex-shrink-0" style={{ fontSize: '0.75rem' }}>
          {copied ? 'Copied!' : <Copy size={14} />}
        </span>
      </div>
    </div>
  );
};

interface TaskTableProps {
  tasks: ExampleTask[];
  onChangeStatus: (task: ExampleTask) => void;
  onDelete: (task: ExampleTask) => void;
}

const TaskTable = ({ tasks, onChangeStatus, onDelete }: TaskTableProps) => {
  return (
    <Table responsive>
      <thead>
        <tr>
          <th className="align-middle w-25px">
          </th>
          <th className="align-middle w-50">Name</th>
          <th className="align-middle d-none d-xl-table-cell">Description</th>
          <th className="align-middle d-none d-xxl-table-cell">Created</th>
          <th className="align-middle">Priority</th>
          <th className="align-middle text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td>
            </td>
            <td>
              <strong>{task.name}</strong>
            </td>
            <td className="d-none d-xl-table-cell">{task.description || '-'}</td>
            <td className="d-none d-xxl-table-cell">{new Date(task.createdAt).toLocaleDateString()}</td>
            <td>
              <Badge bg="" className={`badge-subtle-${priorityVariantMap[task.priority]}`}>
                {task.priority}
              </Badge>
            </td>
            <td className="text-end">
              <Button variant="light" size="sm" onClick={() => onChangeStatus(task)}>Change Status</Button>{" "}
              <Button variant="light" size="sm">View</Button>{" "}
              <Button variant="outline-danger" size="sm" onClick={() => onDelete(task)}>Delete</Button>{" "}
            </td>
          </tr>
        ))}
        {tasks.length === 0 && (
            <tr>
                <td colSpan={6} className="text-center p-3">No tasks in this category.</td>
            </tr>
        )}
      </tbody>
    </Table>
  );
};

interface TaskBoardProps {
  title: string;
  tasks: ExampleTask[];
  onNewTask: () => void;
  onChangeStatus: (task: ExampleTask) => void;
  onDelete: (task: ExampleTask) => void;
}

const TaskBoard = ({ title, tasks, onNewTask, onChangeStatus, onDelete }: TaskBoardProps) => {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Row className="mb-2">
          <Col xs={6}>
            <Card.Title as="h5">{title}</Card.Title>
          </Col>
          <Col xs={6}>
            <div className="text-sm-end">
              <Button
                variant="primary"
                size="sm"
                onClick={onNewTask}
              >
                <Plus size={18} /> New Task
              </Button>
            </div>
          </Col>
        </Row>
        <TaskTable tasks={tasks} onChangeStatus={onChangeStatus} onDelete={onDelete} />
      </Card.Body>
    </Card>
  );
};

const ExerciseTaskList = () => {
  const [tasks, setTasks] = useState<ExampleTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntroAlert, setShowIntroAlert] = useState<boolean>(true);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState<boolean>(false);
  const [changeStatusTask, setChangeStatusTask] = useState<ExampleTask | null>(null);
  const [deleteTask, setDeleteTask] = useState<ExampleTask | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTasks = await fetchApi<ExampleTask[]>('/exercises/tasks');
      setTasks(fetchedTasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const upcomingTasks = tasks.filter((task) => task.status === TaskStatus.UPCOMING);
  const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETED);

  return (
    <React.Fragment>
      <Helmet title="Task List Exercise" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">Task List Exercise</h1>

        {showIntroAlert && (
          <Card className="mb-4 border-primary">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-2">Welcome to the Task List Exercise!</h5>
                  <p className="mb-2">
                    This page shows a task list connected to a backend API. The tasks below are
                    fetched live from the database — but some features are missing. Your job is
                    to add them using Claude.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIntroAlert(false)}
                />
              </div>

              <div className="rounded p-3 mb-3" style={{ background: '#d1e7dd' }}>
                <strong>How it works:</strong> Try each task yourself first by describing what you
                want to Claude. If you get stuck, click "show me an example prompt" for a
                ready-made prompt you can copy and paste. After each task, refresh this page to
                see your changes.
              </div>

              <div className="rounded p-3 mb-3" style={{ background: '#cfe2ff' }}>
                <strong>What you'll learn:</strong> You can extend and modify an application you've
                never seen before, without reading the code. Describe the change you want and the
                AI figures out where and how to make it happen in the existing codebase.
              </div>

              <h6 className="mb-3">Tasks</h6>

              <div className="mb-3">
                <div className="fw-semibold mb-1">1. Create Tasks</div>
                <div className="mb-1">Connect the "New Task" button to the backend so users can create new tasks.</div>
                <RevealablePrompt>Look at how the task list page works and how it fetches data. Make the "New Task" button open a form where I can enter a name, description, priority and status, then save it to the database and refresh the list.</RevealablePrompt>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">2. Update Task Status</div>
                <div className="mb-1">Implement functionality to update task status (mark complete/incomplete).</div>
                <RevealablePrompt>Add a checkbox to each row in the task tables that marks a task as complete or incomplete. Look at the existing API to find how to update a task, and refresh the list after changing it.</RevealablePrompt>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">3. Delete Tasks</div>
                <div className="mb-1">Implement functionality to delete tasks.</div>
                <RevealablePrompt>Add a delete button to the actions column of each task row. It should confirm with the user first, then remove the task and refresh the list.</RevealablePrompt>
              </div>

              <div className="mb-0">
                <div className="fw-semibold mb-1">4. Edit Tasks</div>
                <div className="mb-1">Replace the "View" button with an "Edit" button and implement task editing functionality.</div>
                <RevealablePrompt>Replace the "View" button in each task row with an "Edit" button. When clicked, it should open a form pre-filled with the task's current details so I can change and save them.</RevealablePrompt>
              </div>

              <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
                <strong>Tip:</strong> If something breaks, just tell Claude what happened
                (e.g. "I got an error when I clicked the button") and it will fix it.
              </p>
            </Card.Body>
          </Card>
        )}

        {isLoading && (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}

        {error && (
          <Alert variant="danger">
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {!isLoading && !error && (
          <>
            <TaskBoard title={statusMap[TaskStatus.UPCOMING]} tasks={upcomingTasks} onNewTask={() => setShowNewTaskDialog(true)} onChangeStatus={setChangeStatusTask} onDelete={setDeleteTask} />
            <TaskBoard title={statusMap[TaskStatus.IN_PROGRESS]} tasks={inProgressTasks} onNewTask={() => setShowNewTaskDialog(true)} onChangeStatus={setChangeStatusTask} onDelete={setDeleteTask} />
            <TaskBoard title={statusMap[TaskStatus.COMPLETED]} tasks={completedTasks} onNewTask={() => setShowNewTaskDialog(true)} onChangeStatus={setChangeStatusTask} onDelete={setDeleteTask} />
          </>
        )}

        <NewTaskDialog
          show={showNewTaskDialog}
          onHide={() => setShowNewTaskDialog(false)}
          onCreated={() => { setShowNewTaskDialog(false); loadTasks(); }}
        />
        <ChangeStatusDialog
          show={changeStatusTask !== null}
          task={changeStatusTask}
          onHide={() => setChangeStatusTask(null)}
          onChanged={() => { setChangeStatusTask(null); loadTasks(); }}
        />
        <DeleteTaskDialog
          show={deleteTask !== null}
          task={deleteTask}
          onHide={() => setDeleteTask(null)}
          onDeleted={() => { setDeleteTask(null); loadTasks(); }}
        />
      </Container>
    </React.Fragment>
  );
};

export default ExerciseTaskList;
