import type { AppSupabaseClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/security/tenant-context";
import { AuditRepository } from "@/shared/infrastructure/audit.repository";
import { TaskRepository } from "../infrastructure/task.repository";
import {
  createTaskSchema,
  taskFiltersSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type TaskFilters,
  type UpdateTaskInput
} from "./task.schemas";

export class TaskService {
  private readonly tasks: TaskRepository;
  private readonly audit: AuditRepository;

  constructor(private readonly client: AppSupabaseClient) {
    this.tasks = new TaskRepository(client);
    this.audit = new AuditRepository(client);
  }

  async list(filters: TaskFilters): Promise<unknown[]> {
    const parsed = taskFiltersSchema.parse(filters);
    const context = await requireTenantContext(this.client, parsed.tenantId);
    return this.tasks.list(context, parsed);
  }

  async create(input: CreateTaskInput): Promise<unknown> {
    const parsed = createTaskSchema.parse(input);
    const context = await requireTenantContext(this.client, parsed.tenantId);
    const task = await this.tasks.create(context, parsed);

    await this.audit.record(context, {
      action: "task.created",
      entityType: "task",
      entityId: (task as { id: string }).id,
      after: task
    });

    return task;
  }

  async update(tenantId: string, taskId: string, input: UpdateTaskInput): Promise<unknown> {
    const parsed = updateTaskSchema.parse(input);
    const context = await requireTenantContext(this.client, tenantId);
    const task = await this.tasks.update(context, taskId, parsed);

    await this.audit.record(context, {
      action: "task.updated",
      entityType: "task",
      entityId: taskId,
      after: task
    });

    return task;
  }
}
