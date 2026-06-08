export type ToolInput = {
  key: string;
  label: string;
  accept: string;
  required: boolean;
};

export type ToolConfigField = {
  key: string;
  label: string;
  type: string;
  placeholder: string;
};

export type ToolVersion = {
  id: string;
  label: string;
  description: string;
  inputs: ToolInput[];
  scriptKey: string;
};

export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  color: string;
  versions?: ToolVersion[];
  inputs?: ToolInput[];
  config: ToolConfigField[];
};

export type LogLevel = "info" | "ok" | "warn" | "err";

export type LogEntry = {
  id: number;
  ts: string;
  level: LogLevel;
  msg: string;
};

export type OutputSheet = {
  name: string;
  rows: number;
  filePath: string;
  type: "main" | "back";
};

export type ValidationResult = {
  label: string;
  status: "pass" | "warn" | "fail";
  value: string;
  group: string;
};

export type JobStatus = "idle" | "uploading" | "running" | "done" | "failed";

export type JobState = {
  jobId: string | null;
  status: JobStatus;
  logs: LogEntry[];
  outputs: OutputSheet[];
  validations: ValidationResult[];
  uploadedFiles: Record<string, File>;
  config: Record<string, string>;
  selectedVersion: string | null;
};
