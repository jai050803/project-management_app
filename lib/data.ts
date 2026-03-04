import { generateProjectCode } from "@/lib/utils";
import {
  Attachment,
  Member,
  Project,
  ProjectWithMembersAndTasks,
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate
} from "@/lib/types";

type Store = {
  projects: Project[];
  members: Member[];
  tasks: Task[];
  attachments: Attachment[];
  updates: TaskUpdate[];
};

declare global {
  // eslint-disable-next-line no-var
  var __pm_store__: Store | undefined;
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStore(): Store {
  if (!global.__pm_store__) {
    global.__pm_store__ = {
      projects: [],
      members: [],
      tasks: [],
      attachments: [],
      updates: []
    };
  }
  return global.__pm_store__;
}

export function createProject(projectName: string, memberName: string) {
  const store = getStore();
  let code = generateProjectCode();
  while (store.projects.some((p) => p.code === code)) {
    code = generateProjectCode();
  }

  const projectId = newId();
  const memberId = newId();
  const createdAt = nowIso();

  store.projects.push({
    id: projectId,
    name: projectName,
    code,
    createdAt
  });
  store.members.push({
    id: memberId,
    name: memberName,
    projectId,
    createdAt
  });

  return { projectCode: code, projectId, memberId };
}

export function joinProject(code: string, memberName: string) {
  const store = getStore();
  const project = store.projects.find((p) => p.code === code);
  if (!project) return null;

  const existingMember = store.members.find(
    (m) => m.projectId === project.id && m.name.toLowerCase() === memberName.toLowerCase()
  );
  if (existingMember) {
    return { projectCode: project.code, projectId: project.id, memberId: existingMember.id };
  }

  const memberId = newId();
  store.members.push({
    id: memberId,
    name: memberName,
    projectId: project.id,
    createdAt: nowIso()
  });

  return { projectCode: project.code, projectId: project.id, memberId };
}

export function getProjectByCode(code: string): ProjectWithMembersAndTasks | null {
  const store = getStore();
  const project = store.projects.find((p) => p.code === code);
  if (!project) return null;

  const members = store.members.filter((m) => m.projectId === project.id);
  const tasks = store.tasks
    .filter((t) => t.projectId === project.id)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map((t) => ({
      ...t,
      assignee: members.find((m) => m.id === t.assigneeId) ?? null
    }));

  return {
    ...project,
    members,
    tasks
  };
}

export function createTask(input: {
  projectCode: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string | null;
  deadline: string | null;
  progress: number;
}) {
  const store = getStore();
  const project = store.projects.find((p) => p.code === input.projectCode);
  if (!project) return null;

  const id = newId();
  const timestamp = nowIso();
  store.tasks.push({
    id,
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: input.status,
    assigneeId: input.assigneeId,
    deadline: input.deadline,
    progress: Math.max(0, Math.min(100, input.progress)),
    notes: "",
    dependencies: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    projectId: project.id
  });

  return { taskId: id };
}

export function updateTask(taskId: string, data: Partial<Task>) {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return false;

  if (data.status !== undefined) task.status = data.status;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.progress !== undefined) task.progress = Math.max(0, Math.min(100, data.progress));
  if (data.assigneeId !== undefined) task.assigneeId = data.assigneeId;
  if (data.notes !== undefined) task.notes = data.notes;
  if (data.dependencies !== undefined) task.dependencies = data.dependencies;
  if (data.deadline !== undefined) task.deadline = data.deadline;
  task.updatedAt = nowIso();
  return true;
}

export function addTaskUpdate(taskId: string, author: string, message: string) {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return false;
  store.updates.push({
    id: newId(),
    author,
    message,
    taskId,
    createdAt: nowIso()
  });
  return true;
}

export function addTaskAttachment(taskId: string, type: string, name: string, url: string) {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return false;
  store.attachments.push({
    id: newId(),
    type,
    name,
    url,
    taskId,
    createdAt: nowIso()
  });
  return true;
}

export function getTaskDetail(taskId: string) {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const attachments = store.attachments
    .filter((a) => a.taskId === taskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const updates = store.updates
    .filter((u) => u.taskId === taskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const assignee = task.assigneeId ? store.members.find((m) => m.id === task.assigneeId) ?? null : null;

  return {
    ...task,
    assignee,
    attachments,
    updates
  };
}

