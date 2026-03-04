import { generateProjectCode } from "@/lib/utils";
import { Attachment, Member, ProjectWithMembersAndTasks, Task, TaskPriority, TaskStatus, TaskUpdate } from "@/lib/types";

type DbProject = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

type DbMember = {
  id: string;
  name: string;
  created_at: string;
  project_id: string;
};

type DbTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  deadline: string | null;
  notes: string;
  dependencies: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  assignee_id: string | null;
};

type DbAttachment = {
  id: string;
  type: string;
  name: string;
  url: string;
  created_at: string;
  task_id: string;
};

type DbTaskUpdate = {
  id: string;
  author: string;
  message: string;
  created_at: string;
  task_id: string;
};

function newId() {
  return crypto.randomUUID();
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and one key: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY."
    );
  }

  return {
    restUrl: `${url.replace(/\/$/, "")}/rest/v1`,
    key
  };
}

async function supabaseRequest<T>({
  path,
  method = "GET",
  query,
  body,
  prefer
}: {
  path: string;
  method?: "GET" | "POST" | "PATCH";
  query?: Record<string, string>;
  body?: unknown;
  prefer?: string;
}): Promise<T> {
  const { restUrl, key } = getSupabaseConfig();
  const params = new URLSearchParams(query ?? {});
  const url = `${restUrl}/${path}${params.toString() ? `?${params.toString()}` : ""}`;

  const res = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text) as {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
      };
      message = [parsed.message, parsed.code, parsed.details, parsed.hint].filter(Boolean).join(" | ");
    } catch {
      // Keep raw text when response is not JSON.
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Supabase permission denied (${res.status}). ${message}. Check RLS policies or set SUPABASE_SERVICE_ROLE_KEY in Vercel env.`
      );
    }

    if (res.status === 404) {
      throw new Error(
        `Supabase table/endpoint not found (${res.status}). ${message}. Run supabase/schema.sql in your Supabase SQL editor.`
      );
    }

    throw new Error(`Supabase request failed (${res.status}): ${message}`);
  }

  const raw = await res.text();
  return (raw ? JSON.parse(raw) : null) as T;
}

function mapMember(row: DbMember): Member {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    projectId: row.project_id
  };
}

function mapTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    progress: row.progress,
    deadline: row.deadline,
    notes: row.notes,
    dependencies: row.dependencies,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectId: row.project_id,
    assigneeId: row.assignee_id
  };
}

function mapAttachment(row: DbAttachment): Attachment {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    url: row.url,
    createdAt: row.created_at,
    taskId: row.task_id
  };
}

function mapTaskUpdate(row: DbTaskUpdate): TaskUpdate {
  return {
    id: row.id,
    author: row.author,
    message: row.message,
    createdAt: row.created_at,
    taskId: row.task_id
  };
}

async function findProjectByCode(code: string): Promise<DbProject | null> {
  const rows = await supabaseRequest<DbProject[]>({
    path: "projects",
    query: {
      select: "*",
      code: `eq.${code}`,
      limit: "1"
    }
  });
  return rows[0] ?? null;
}

export async function createProject(projectName: string, memberName: string) {
  let code = generateProjectCode();
  for (let i = 0; i < 10; i += 1) {
    const exists = await findProjectByCode(code);
    if (!exists) break;
    code = generateProjectCode();
  }

  const projectId = newId();
  const memberId = newId();
  const now = new Date().toISOString();

  await supabaseRequest<DbProject[]>({
    path: "projects",
    method: "POST",
    prefer: "return=representation",
    body: [{ id: projectId, name: projectName, code, created_at: now }]
  });

  await supabaseRequest<DbMember[]>({
    path: "members",
    method: "POST",
    prefer: "return=representation",
    body: [{ id: memberId, name: memberName, project_id: projectId, created_at: now }]
  });

  return { projectCode: code, projectId, memberId };
}

export async function joinProject(code: string, memberName: string) {
  const project = await findProjectByCode(code);
  if (!project) return null;

  const members = await supabaseRequest<DbMember[]>({
    path: "members",
    query: {
      select: "*",
      project_id: `eq.${project.id}`
    }
  });

  const existing = members.find((m) => m.name.toLowerCase() === memberName.toLowerCase());
  if (existing) {
    return { projectCode: project.code, projectId: project.id, memberId: existing.id };
  }

  const memberId = newId();
  await supabaseRequest<DbMember[]>({
    path: "members",
    method: "POST",
    prefer: "return=representation",
    body: [
      {
        id: memberId,
        name: memberName,
        project_id: project.id,
        created_at: new Date().toISOString()
      }
    ]
  });

  return { projectCode: project.code, projectId: project.id, memberId };
}

export async function getProjectByCode(code: string): Promise<ProjectWithMembersAndTasks | null> {
  const project = await findProjectByCode(code);
  if (!project) return null;

  const [memberRows, taskRows] = await Promise.all([
    supabaseRequest<DbMember[]>({
      path: "members",
      query: {
        select: "*",
        project_id: `eq.${project.id}`
      }
    }),
    supabaseRequest<DbTask[]>({
      path: "tasks",
      query: {
        select: "*",
        project_id: `eq.${project.id}`,
        order: "status.asc,created_at.desc"
      }
    })
  ]);

  const members = memberRows.map(mapMember);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const tasks = taskRows.map((row) => {
    const task = mapTask(row);
    return {
      ...task,
      assignee: task.assigneeId ? memberById.get(task.assigneeId) ?? null : null
    };
  });

  return {
    id: project.id,
    name: project.name,
    code: project.code,
    createdAt: project.created_at,
    members,
    tasks
  };
}

export async function createTask(input: {
  projectCode: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string | null;
  deadline: string | null;
  progress: number;
}) {
  const project = await findProjectByCode(input.projectCode);
  if (!project) return null;

  const taskId = newId();
  const now = new Date().toISOString();

  await supabaseRequest<DbTask[]>({
    path: "tasks",
    method: "POST",
    prefer: "return=representation",
    body: [
      {
        id: taskId,
        project_id: project.id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
        assignee_id: input.assigneeId,
        deadline: input.deadline,
        progress: Math.max(0, Math.min(100, input.progress)),
        notes: "",
        dependencies: "",
        created_at: now,
        updated_at: now
      }
    ]
  });

  return { taskId };
}

export async function updateTask(taskId: string, data: Partial<Task>) {
  const patch: Record<string, string | number | null> = {
    updated_at: new Date().toISOString()
  };

  if (data.status !== undefined) patch.status = data.status;
  if (data.priority !== undefined) patch.priority = data.priority;
  if (data.progress !== undefined) patch.progress = Math.max(0, Math.min(100, data.progress));
  if (data.assigneeId !== undefined) patch.assignee_id = data.assigneeId;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.dependencies !== undefined) patch.dependencies = data.dependencies;
  if (data.deadline !== undefined) patch.deadline = data.deadline;

  const rows = await supabaseRequest<DbTask[]>({
    path: "tasks",
    method: "PATCH",
    query: {
      id: `eq.${taskId}`,
      select: "id"
    },
    prefer: "return=representation",
    body: patch
  });

  return rows.length > 0;
}

export async function addTaskUpdate(taskId: string, author: string, message: string) {
  const rows = await supabaseRequest<DbTaskUpdate[]>({
    path: "task_updates",
    method: "POST",
    query: {
      select: "id"
    },
    prefer: "return=representation",
    body: [
      {
        id: newId(),
        author,
        message,
        task_id: taskId,
        created_at: new Date().toISOString()
      }
    ]
  });

  return rows.length > 0;
}

export async function addTaskAttachment(taskId: string, type: string, name: string, url: string) {
  const rows = await supabaseRequest<DbAttachment[]>({
    path: "attachments",
    method: "POST",
    query: {
      select: "id"
    },
    prefer: "return=representation",
    body: [
      {
        id: newId(),
        type,
        name,
        url,
        task_id: taskId,
        created_at: new Date().toISOString()
      }
    ]
  });

  return rows.length > 0;
}

export async function getTaskDetail(taskId: string) {
  const taskRows = await supabaseRequest<DbTask[]>({
    path: "tasks",
    query: {
      select: "*",
      id: `eq.${taskId}`,
      limit: "1"
    }
  });
  const dbTask = taskRows[0];
  if (!dbTask) return null;

  const [attachmentsRows, updatesRows, assigneeRows] = await Promise.all([
    supabaseRequest<DbAttachment[]>({
      path: "attachments",
      query: {
        select: "*",
        task_id: `eq.${taskId}`,
        order: "created_at.desc"
      }
    }),
    supabaseRequest<DbTaskUpdate[]>({
      path: "task_updates",
      query: {
        select: "*",
        task_id: `eq.${taskId}`,
        order: "created_at.desc"
      }
    }),
    dbTask.assignee_id
      ? supabaseRequest<DbMember[]>({
          path: "members",
          query: {
            select: "*",
            id: `eq.${dbTask.assignee_id}`,
            limit: "1"
          }
        })
      : Promise.resolve([])
  ]);

  return {
    ...mapTask(dbTask),
    assignee: assigneeRows[0] ? mapMember(assigneeRows[0]) : null,
    attachments: attachmentsRows.map(mapAttachment),
    updates: updatesRows.map(mapTaskUpdate)
  };
}
