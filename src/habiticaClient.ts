export type TaskType = "habits" | "dailys" | "todos" | "rewards";
export type ScoreDirection = "up" | "down";

export interface HabiticaConfig {
  userId: string;
  apiToken: string;
  client: string;
  baseUrl?: string;
}

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiTaskType = "habit" | "daily" | "todo" | "reward";

export class HabiticaClient {
  private readonly baseUrl: string;

  constructor(private readonly config: HabiticaConfig) {
    this.baseUrl = config.baseUrl ?? "https://habitica.com/api/v3";
  }

  private defaultHeaders(): HeadersInit {
    return {
      "x-api-user": this.config.userId,
      "x-api-key": this.config.apiToken,
      "x-client": this.config.client,
      "content-type": "application/json",
    };
  }

  private toApiTaskType(type?: TaskType): ApiTaskType | undefined {
    if (!type) return undefined;
    switch (type) {
      case "habits":
        return "habit";
      case "dailys":
        return "daily";
      case "todos":
        return "todo";
      case "rewards":
        return "reward";
      default:
        return undefined;
    }
  }

  private async request<T>(
    path: string,
    method: RequestMethod = "GET",
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.defaultHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const payload: any = isJson ? await response.json() : await response.text();

    if (!response.ok || (isJson && payload?.success === false)) {
      const message = isJson ? payload?.message : response.statusText;
      throw new Error(
        message || `Habitica request failed with status ${response.status}`
      );
    }

    return (isJson && payload?.data ? payload.data : payload) as T;
  }

  async listTasks(type?: TaskType) {
    const mappedType = this.toApiTaskType(type);
    const search = mappedType ? `?type=${mappedType}` : "";
    return this.request(`/tasks/user${search}`);
  }

  async createTask(input: {
    type: TaskType;
    text: string;
    notes?: string;
    priority?: number;
    checklist?: string[];
    dueDate?: string;
    tags?: string[];
  }) {
    const body = {
      ...input,
      type: this.toApiTaskType(input.type),
      date: input.dueDate,
      checklist: input.checklist?.map((text) => ({ text })),
    };

    return this.request("/tasks/user", "POST", body);
  }

  async updateTask(
    taskId: string,
    updates: {
      text?: string;
      notes?: string;
      priority?: number;
      checklist?: string[];
      dueDate?: string;
      tags?: string[];
      type?: TaskType;
    }
  ) {
    const body = {
      ...updates,
      type: this.toApiTaskType(updates.type),
      date: updates.dueDate,
      checklist: updates.checklist?.map((text) => ({ text })),
    };

    return this.request(`/tasks/${taskId}`, "PUT", body);
  }

  async scoreTask(taskId: string, direction: ScoreDirection) {
    return this.request(`/tasks/${taskId}/score/${direction}`, "POST");
  }

  async deleteTask(taskId: string) {
    await this.request(`/tasks/${taskId}`, "DELETE");
    return { deleted: true, taskId };
  }

  async getUser() {
    return this.request("/user");
  }
}
