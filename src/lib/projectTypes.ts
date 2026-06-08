export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type ProjectMember = {
  userId: string;
  name: string;
  role: string;
  avatar?: string;
};

export type ProjectFile = {
  id: string;
  name: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  category: "requirement" | "output" | "reference";
  url?: string;
};

export type ProjectMessage = {
  id: string;
  author: string;
  authorRole: "admin" | "employee" | "client";
  content: string;
  createdAt: string;
  attachments?: string[];
};

export type Project = {
  _id?: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  tool: string;
  startDate: string;
  endDate: string;
  members: ProjectMember[];
  files: ProjectFile[];
  messages: ProjectMessage[];
  progress: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
