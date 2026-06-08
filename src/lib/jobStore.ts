import { LogEntry, LogLevel, OutputSheet, ValidationResult } from "@/lib/toolTypes";

export type JobRecord = {
  status: "pending" | "running" | "done" | "failed";
  toolId: string;
  scriptKey: string;
  config: Record<string, string>;
  inputFiles: Record<string, string>;
  outputDir: string;
  logs: LogEntry[];
  outputs: OutputSheet[];
  validations: ValidationResult[];
  createdAt: string;
};

const g = globalThis as typeof globalThis & { _jobStore?: Map<string, JobRecord> };
if (!g._jobStore) g._jobStore = new Map<string, JobRecord>();
const store = g._jobStore;
let counter = 0;

export const jobStore = {
  create(jobId: string, data: Pick<JobRecord, "toolId" | "scriptKey" | "config" | "inputFiles" | "outputDir">) {
    store.set(jobId, { ...data, status: "pending", logs: [], outputs: [], validations: [], createdAt: new Date().toISOString() });
  },
  get(jobId: string): JobRecord | undefined { return store.get(jobId); },
  setStatus(jobId: string, status: JobRecord["status"]) {
    const j = store.get(jobId); if (j) j.status = status;
  },
  addLog(jobId: string, level: LogLevel, msg: string) {
    const j = store.get(jobId); if (!j) return;
    j.logs.push({ id: ++counter, ts: new Date().toLocaleTimeString("en-IN", { hour12: false }), level, msg });
  },
  setOutputs(jobId: string, outputs: OutputSheet[]) {
    const j = store.get(jobId); if (j) j.outputs = outputs;
  },
  setValidations(jobId: string, validations: ValidationResult[]) {
    const j = store.get(jobId); if (j) j.validations = validations;
  },
};
