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
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";

import { fetchApi } from "../../../utils/apiClient";
import { ExampleTask, TaskPriority, TaskStatus } from "./types";
import NewTaskDialog from "./NewTaskDialog";
import ChangeStatusDialog from "./ChangeStatusDialog";
import DeleteTaskDialog from "./DeleteTaskDialog";
import EditTaskDialog from "./EditTaskDialog";

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


interface TaskTableProps {
  tasks: ExampleTask[];
  onChangeStatus: (task: ExampleTask) => void;
  onDelete: (task: ExampleTask) => void;
  onEdit: (task: ExampleTask) => void;
}

const TaskTable = ({ tasks, onChangeStatus, onDelete, onEdit }: TaskTableProps) => {
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
              <Button variant="light" size="sm" onClick={() => onChangeStatus(task)} title="Change Status"><RefreshCw size={14} /></Button>{" "}
              <Button variant="light" size="sm" onClick={() => onEdit(task)} title="Edit"><Pencil size={14} /></Button>{" "}
              <Button variant="outline-danger" size="sm" onClick={() => onDelete(task)} title="Delete"><Trash2 size={14} /></Button>{" "}
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
  onEdit: (task: ExampleTask) => void;
}

const TaskBoard = ({ title, tasks, onNewTask, onChangeStatus, onDelete, onEdit }: TaskBoardProps) => {
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
        <TaskTable tasks={tasks} onChangeStatus={onChangeStatus} onDelete={onDelete} onEdit={onEdit} />
      </Card.Body>
    </Card>
  );
};

const ExerciseTaskList = () => {
  const [tasks, setTasks] = useState<ExampleTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState<boolean>(false);
  const [changeStatusTask, setChangeStatusTask] = useState<ExampleTask | null>(null);
  const [deleteTask, setDeleteTask] = useState<ExampleTask | null>(null);
  const [editTask, setEditTask] = useState<ExampleTask | null>(null);

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
      <Helmet title="Task List" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">Task List</h1>

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
            <TaskBoard title={statusMap[TaskStatus.UPCOMING]} tasks={upcomingTasks} onNewTask={() => setShowNewTaskDialog(true)} onChangeStatus={setChangeStatusTask} onDelete={setDeleteTask} onEdit={setEditTask} />
            <TaskBoard title={statusMap[TaskStatus.IN_PROGRESS]} tasks={inProgressTasks} onNewTask={() => setShowNewTaskDialog(true)} onChangeStatus={setChangeStatusTask} onDelete={setDeleteTask} onEdit={setEditTask} />
            <TaskBoard title={statusMap[TaskStatus.COMPLETED]} tasks={completedTasks} onNewTask={() => setShowNewTaskDialog(true)} onChangeStatus={setChangeStatusTask} onDelete={setDeleteTask} onEdit={setEditTask} />
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
        <EditTaskDialog
          show={editTask !== null}
          task={editTask}
          onHide={() => setEditTask(null)}
          onUpdated={() => { setEditTask(null); loadTasks(); }}
        />
      </Container>
    </React.Fragment>
  );
};

export default ExerciseTaskList;
