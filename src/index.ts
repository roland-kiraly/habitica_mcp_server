import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { loadConfig } from "./config.js";
import { HabiticaClient, ScoreDirection, TaskType } from "./habiticaClient.js";

const taskTypeEnum = z.enum(["habits", "dailys", "todos", "rewards"]);

const prioritySchema = z
  .union([z.literal(0.1), z.literal(1), z.literal(1.5), z.literal(2)])
  .describe(
    "Habitica priority: 0.1 (trivial), 1 (easy), 1.5 (medium), 2 (hard)"
  );

const taskBaseFields = {
  type: taskTypeEnum.describe("Task type"),
  text: z.string().describe("Task name"),
  notes: z.string().optional().describe("Optional notes"),
  priority: prioritySchema.optional(),
  tags: z.array(z.string()).optional().describe("Tag IDs to attach"),
  checklist: z.array(z.string()).optional().describe("Checklist item texts"),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .describe("ISO 8601 due date (todos only)"),
};

const listTasksSchema = z.object({
  type: taskTypeEnum.optional(),
});

const createTaskSchema = z.object(taskBaseFields);
type CreateTaskInput = z.infer<typeof createTaskSchema>;

const updateTaskSchema = z.object({
  taskId: z.string().describe("Habitica task ID to update"),
  text: taskBaseFields.text.optional(),
  notes: taskBaseFields.notes,
  priority: taskBaseFields.priority,
  checklist: taskBaseFields.checklist,
  dueDate: taskBaseFields.dueDate,
  tags: taskBaseFields.tags,
  type: taskBaseFields.type.optional(),
});
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

const scoreTaskSchema = z.object({
  taskId: z.string().describe("Task ID to score"),
  direction: z.enum(["up", "down"]).describe("Increase or decrease the task"),
});
type ScoreTaskInput = z.infer<typeof scoreTaskSchema>;

const deleteTaskSchema = z.object({
  taskId: z.string().describe("Task ID to delete"),
});
type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

function toJson(data: unknown) {
  return JSON.stringify(data, null, 2);
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  const config = loadConfig();
  const client = new HabiticaClient(config);

  const server = new McpServer(
    {
      name: "habitica-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: { tools: {}, logging: {} },
      instructions:
        "MCP server for Habitica. Set HABITICA_USER_ID and HABITICA_API_TOKEN (and optional HABITICA_CLIENT, HABITICA_API_BASE_URL) before running.",
    }
  );

  server.registerTool(
    "list_tasks",
    {
      description: "List Habitica tasks for the authenticated user",
      inputSchema: listTasksSchema,
    },
    async ({ type }: z.infer<typeof listTasksSchema>) => {
      const tasks = await client.listTasks(type as TaskType | undefined);
      return {
        content: [{ type: "text", text: toJson(tasks) }],
        structuredContent: { tasks },
      };
    }
  );

  server.registerTool(
    "create_task",
    {
      description: "Create a new Habitica task",
      inputSchema: createTaskSchema,
    },
    async (input: CreateTaskInput) => {
      const created = await client.createTask(input);

      return {
        content: [{ type: "text", text: toJson(created) }],
        structuredContent: { task: created },
      };
    }
  );

  server.registerTool(
    "update_task",
    {
      description: "Update an existing Habitica task",
      inputSchema: updateTaskSchema,
    },
    async ({ taskId, ...updates }: UpdateTaskInput) => {
      const updated = await client.updateTask(taskId, updates);

      return {
        content: [{ type: "text", text: toJson(updated) }],
        structuredContent: { task: updated },
      };
    }
  );

  server.registerTool(
    "score_task",
    {
      description: "Score (complete/check or mark down) a Habitica task",
      inputSchema: scoreTaskSchema,
    },
    async ({ taskId, direction }: ScoreTaskInput) => {
      const result = await client.scoreTask(
        taskId,
        direction as ScoreDirection
      );
      return {
        content: [{ type: "text", text: toJson(result) }],
        structuredContent: { result },
      };
    }
  );

  server.registerTool(
    "delete_task",
    {
      description: "Delete a Habitica task",
      inputSchema: deleteTaskSchema,
    },
    async ({ taskId }: DeleteTaskInput) => {
      const result = await client.deleteTask(taskId);
      return {
        content: [{ type: "text", text: toJson(result) }],
        structuredContent: { result },
      };
    }
  );

  server.registerTool(
    "get_user_stats",
    {
      description: "Fetch stats for the authenticated Habitica user",
    },
    async () => {
      const user = await client.getUser();
      const stats = (user as { stats?: unknown })?.stats ?? user;

      return {
        content: [{ type: "text", text: toJson(stats) }],
        structuredContent: { stats },
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Habitica MCP server is running on stdio");
}

main().catch((error) => {
  console.error(
    `Habitica MCP server failed to start: ${toErrorMessage(error)}`
  );
  process.exit(1);
});
