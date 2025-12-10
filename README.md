# Habitica MCP Server

An MCP server that exposes Habitica tasks and stats as tools. It runs over stdio so it can be used directly by MCP-compatible clients.

## Prerequisites

- Node.js 18+ (stdio transport)
- Habitica credentials:
  - `HABITICA_USER_ID`
  - `HABITICA_API_TOKEN`
  - Optional: `HABITICA_CLIENT` (identifier shown to Habitica), `HABITICA_API_BASE_URL` (for self-hosted Habitica)

## Setup

```bash
npm install
```

Create a `.env` (optional) or export the required variables:

```
HABITICA_USER_ID=<your-user-id>
HABITICA_API_TOKEN=<your-api-token>
```

## Run

Development (watch/ts):

```bash
npm run dev
```

Build and run compiled JS:

```bash
npm run build
npm start
```

The server listens on stdio; configure your MCP client to spawn `npm run dev` or `node dist/index.js` in this directory.

## Tools

- `list_tasks` — List tasks, optionally filtered by type (`habits`, `dailys`, `todos`, `rewards`).
- `create_task` — Create a task with text, notes, priority, tags, checklist items, and optional due date.
- `update_task` — Update an existing task by ID.
- `score_task` — Score a task up or down.
- `delete_task` — Delete a task by ID.
- `get_user_stats` — Fetch the authenticated user’s stats.

Each tool returns a human-readable `text` block and a `structuredContent` object for programmatic use.

