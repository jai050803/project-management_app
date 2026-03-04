import { TaskStatus } from "@prisma/client";
import { addDays, differenceInCalendarDays, format } from "date-fns";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateProjectCode(length = 6): string {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return output;
}

export function statusLabel(status: TaskStatus): string {
  if (status === "TODO") return "To Do";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "BLOCKED") return "Blocked";
  return "Done";
}

export function deadlineState(deadline?: Date | null): "safe" | "approaching" | "overdue" {
  if (!deadline) return "safe";
  const today = new Date();
  const dayDiff = differenceInCalendarDays(deadline, today);
  if (dayDiff < 0) return "overdue";
  if (dayDiff <= 2) return "approaching";
  return "safe";
}

export function formatDeadline(deadline?: Date | null): string {
  return deadline ? format(deadline, "dd MMM yyyy") : "No deadline";
}

export function roadmapWindow() {
  const now = new Date();
  return {
    start: format(now, "dd MMM"),
    end: format(addDays(now, 14), "dd MMM")
  };
}

