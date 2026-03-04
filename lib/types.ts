export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Member = {
  id: string;
  name: string;
  createdAt: string;
  projectId: string;
};

export type Attachment = {
  id: string;
  type: string;
  name: string;
  url: string;
  createdAt: string;
  taskId: string;
};

export type TaskUpdate = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  taskId: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  deadline: string | null;
  notes: string;
  dependencies: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  assigneeId: string | null;
};

export type Project = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
};

export type ProjectWithMembersAndTasks = Project & {
  members: Member[];
  tasks: (Task & { assignee: Member | null })[];
};

