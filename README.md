# 🗂️ Real-Time Task Management API

A production-ready backend system for collaborative task management, built with **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Socket.io**.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Prisma Models](#4-prisma-models)
5. [Authentication Flow](#5-authentication-flow)
6. [API Structure and Endpoints](#6-api-structure-and-endpoints)
7. [Real-time Architecture (Socket.io)](#7-real-time-architecture-socketio)
8. [Task Collaboration Flow](#8-task-collaboration-flow)
9. [Security Implementation](#9-security-implementation)
10. [Folder Structure](#10-folder-structure)
11. [Technical Decisions](#11-technical-decisions)
12. [Scalability Considerations](#12-scalability-considerations)
13. [Future Improvements](#13-future-improvements)
14. [How to Run the Project](#14-how-to-run-the-project)
15. [Environment Variables](#15-environment-variables)
16. [Example Requests & Responses](#16-example-requests--responses)
17. [Developer Notes](#17-developer-notes)

---

## 1. Project Overview

This is a **full-featured real-time task management backend API** designed for teams who need to collaborate on projects. The system supports creating projects, managing team members with roles, organizing work into tasks and subtasks, attaching tags, and discussing via comments — all with live updates pushed via WebSockets.

### Key Features

| Feature | Description |
|---|---|
| 🔐 Auth | JWT Access + Refresh Token system with token rotation |
| 📁 Projects | Full CRUD with owner-based access |
| 👥 Members | Role-based project membership |
| ✅ Tasks | Full CRUD with filtering, pagination, and sorting |
| 🔁 Subtasks | Hierarchical parent/child task relationships |
| 💬 Comments | Per-task comment threads with edit support |
| 🏷️ Tags | Colorful task labels for organization |
| ⚡ Real-time | Socket.io rooms per project and per task |
| 🛡️ Security | Rate limiting, HPP, cookie-based token storage |
| 📝 Logging | Winston-based structured logging to files |

---

## 2. System Architecture

The project follows a **layered architecture** that separates concerns clearly, making it testable and maintainable:

```
Client (HTTP + WebSocket)
        │
        ▼
  [ Express App (index.ts) ]
        │
  ┌─────────────────────────┐
  │     Middleware Layer     │
  │  Rate Limiting, HPP,    │
  │  Cookie Parser, GZIP    │
  └───────────┬─────────────┘
              │
  ┌─────────────────────────┐
  │      Router Layer        │
  │  /api/v1/users           │
  │  /api/v1/projects        │
  │  /api/v1/tasks           │
  └───────────┬─────────────┘
              │
  ┌─────────────────────────┐
  │    Controller Layer      │  ← Request validation + orchestration
  └───────────┬─────────────┘
              │
  ┌─────────────────────────┐
  │     Service Layer        │  ← Business logic + Prisma queries
  └───────────┬─────────────┘
              │
  ┌─────────────────────────┐
  │   Prisma ORM + PostgreSQL│  ← Data persistence
  └─────────────────────────┘

  [Socket.io Server] ← runs alongside HTTP server on same port
```

**Why this architecture?**
- **Controllers** validate input and coordinate — they don't contain business rules.
- **Services** own the database logic — they can be unit-tested independently.
- **routers** are thin, serving only to wire URL patterns to controller functions.
- This separation means any layer can be swapped (e.g., replacing Prisma with a different ORM) without touching the controllers.

---

## 3. Database Design

The PostgreSQL database consists of **8 tables** that model the full domain:

```
┌──────────┐         ┌─────────────────┐         ┌──────────┐
│   User   │─────────│  Project_Member  │─────────│ Project  │
│          │  M   M  │  (junction)      │  M   1  │          │
└────┬─────┘         └─────────────────┘         └────┬─────┘
     │ 1                                               │ 1
     │                                                 │
     │ M                                               │ M
┌────┴─────┐         ┌──────────┐       ┌──────────┐  │
│   Task   │─────────│ Task_Tags│───────│   Tags   │  │
│          │  M   M  │(junction)│  M  1 │          │  │
└────┬─────┘         └──────────┘       └──────────┘  │
     │ 1                                               │
     │ M                                               │
┌────┴─────┐   ┌────────────────┐
│ comments │   │  RefreshToken  │
│          │   │                │
└──────────┘   └────────────────┘

Task.parentTaskId → Task.id  (self-referential, for subtasks)
```

### Key Relationships

- **User → Project**: One-to-many (owner relationship via `ownerId`)
- **User ↔ Project**: Many-to-many via `Project_Member` (team membership)
- **Project → Task**: One-to-many
- **Task → Task**: Self-referential — `parentTaskId` enables subtask trees
- **Task ↔ Tags**: Many-to-many via `Task_Tags`
- **User → RefreshToken**: One-to-many (supports multi-device login)

### Why PostgreSQL?

PostgreSQL is chosen over MongoDB because the data has strong relational integrity requirements — tasks belong to projects, users belong to projects through roles, and we need foreign key constraints to prevent orphaned records. SQL is the right tool for structured, relational data.

---

## 4. Prisma Models

### User
```prisma
model User {
  id             Int              @id @default(autoincrement())
  name           String
  email          String           @unique
  password       String           // bcrypt hashed
  createdAt      DateTime         @default(now())
  role           UserRole         @default(USER)
  projects       Project[]        @relation("UserProjects")
  projectMembers Project_Member[]
  refreshTokens  RefreshToken[]
  assignedTasks  Task[]           @relation("Assignee")
  createdTasks   Task[]           @relation("Creator")
  comments       comments[]
}
```
> **Note**: The `User` model holds two separate task relationships: one as the *creator* of a task and one as the *assignee*. Named relations (`"Assignee"`, `"Creator"`) disambiguate them in Prisma.

### Task
```prisma
model Task {
  id           Int         @id @default(autoincrement())
  title        String
  description  String?
  status       TaskStatus  @default(PENDING)
  projectId    Int
  createdBy    Int
  assigneeId   Int?
  parentTaskId Int?        // null = top-level task, set = subtask
  parentTask   Task?       @relation("SubTasks", fields: [parentTaskId], references: [id])
  subTasks     Task[]      @relation("SubTasks")
  tags         Task_Tags[]
  comments     comments[]
}
```
> **Why self-referential?** Instead of creating a separate `Subtask` model, a single `Task` model with a nullable `parentTaskId` handles unlimited depth task hierarchies with zero schema duplication.

### RefreshToken
```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  createdAt DateTime @default(now())
  expiresAt DateTime
  userId    Int
  revoked   Boolean  @default(false)
}
```
> Stored in DB for **server-side invalidation**. Unlike stateless JWTs, this lets you revoke tokens immediately on logout without waiting for expiry.

### Enums
```prisma
enum UserRole   { ADMIN  USER }
enum TaskStatus { PENDING  IN_PROGRESS  COMPLETED }
```

---

## 5. Authentication Flow

The system uses a **dual-token strategy** with short-lived access tokens and long-lived, database-stored refresh tokens.

### Flow Diagram

```
 ┌────────┐                              ┌────────────┐           ┌────────┐
 │ Client │                              │ Auth Server│           │   DB   │
 └───┬────┘                              └─────┬──────┘           └───┬────┘
     │                                         │                      │
     │── POST /api/v1/users/signup ────────────▶│                      │
     │                                         │── INSERT user ───────▶│
     │                                         │── INSERT refreshToken▶│
     │◀── 201 + Authorization: Bearer {AT} ───│                      │
     │    Set-Cookie: refreshToken={RT}        │                      │
     │                                         │                      │
     │── GET /api/v1/projects [AT expires] ───▶│                      │
     │◀── 401 Unauthorized ───────────────────│                      │
     │                                         │                      │
     │── POST /api/v1/users/refreshtoken ─────▶│                      │
     │   Cookie: refreshToken={RT}             │── find RT in DB ────▶│
     │                                         │── revoke old RT ────▶│
     │                                         │── create new RT ────▶│
     │◀── 200 + new AT + new RT (rotation) ───│                      │
     │                                         │                      │
     │── POST /api/v1/users/logout ───────────▶│                      │
     │   Cookie: refreshToken={RT}             │── revoke RT ────────▶│
     │◀── 200 + clearCookie ──────────────────│                      │
```

### Token Specifications

| Token | Storage | Expiry | Purpose |
|---|---|---|---|
| **Access Token** | `Authorization` header | 30 minutes | Authenticate API requests |
| **Refresh Token** | `httpOnly` cookie | 7 days | Obtain new access tokens |

### Token Rotation
When a refresh token is used, it is **immediately revoked** in the database and a brand new refresh token is issued. This prevents refresh token replay attacks — if a token is stolen and used, the legitimate user's next request will find the old token revoked, alerting to a potential breach.

### Cookie Security
```typescript
const cookieOptions = {
  httpOnly: true,   // Not accessible via JavaScript (XSS protection)
  secure: true,     // Only sent over HTTPS
  maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
}
```

---

## 6. API Structure and Endpoints

Base URL: `http://localhost:3000/api/v1`

All endpoints under `/api` are rate-limited to **5 requests per 15 minutes** per IP.

### Auth Routes — `/users`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/users/signup` | Register a new user | ❌ |
| `POST` | `/users/login` | Login and get tokens | ❌ |
| `POST` | `/users/refreshtoken` | Rotate refresh token | ❌ (via cookie) |
| `POST` | `/users/logout` | Revoke refresh token | ❌ (via cookie) |

### Project Routes — `/projects`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/projects/:ownerId` | Get all projects for a user | ✅ |
| `POST` | `/projects/:ownerId` | Create a new project | ✅ |
| `PUT` | `/projects/:projectId` | Update project details | ✅ |
| `DELETE` | `/projects/:projectId` | Delete a project | ✅ |

### Member Routes — `/projects/:projectId/members`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/members/:memberId` | Add a member to a project |
| `DELETE` | `/members/:memberId` | Remove a member from a project |
| `PATCH` | `/members/:memberId` | Update a member's role |
| `GET` | `/members` | List all project members |

### Task Routes — `/projects/:projectId/tasks`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/tasks` | Create a new task in a project |
| `GET` | `/tasks` | Get all tasks (filterable/pageable) |
| `GET` | `/tasks/:taskId` | Get a specific task |
| `PATCH` | `/tasks/:taskId` | Update a task |
| `DELETE` | `/tasks/:taskId` | Delete a task |

#### Task Filtering & Pagination

The `GET /tasks` endpoint supports rich query parameters:

| Parameter | Type | Description |
|---|---|---|
| `status` | `PENDING \| IN_PROGRESS \| COMPLETED` | Filter by task status |
| `assigneeId` | `number` | Filter by assignee |
| `createdBy` | `number` | Filter by creator |
| `search` | `string` | Full-text search in title/description |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 10) |
| `sortedBy` | `createdAt \| updatedAt \| status` | Sort field |
| `sortedOrder` | `asc \| desc` | Sort direction |

### Comment Routes — `/projects/:projectId/tasks/:taskId/comments`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/comments/:commentId` | Get comment(s) |
| `POST` | `/comments/:commentId` | Create a comment |
| `PUT` | `/comments/:commentId` | Edit a comment |
| `DELETE` | `/comments/:commentId` | Delete a comment |

### Tag Routes — `/projects/:projectId/tasks/:taskId/tags`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/tags` | Create a tag |
| `GET` | `/tags` | List all tags |
| `POST` | `/tags/:tagId` | Attach tag to task |
| `DELETE` | `/tags/:tagId` | Remove tag from task |

---

## 7. Real-time Architecture (Socket.io)

### Architecture Overview

```
 HTTP Server (Express)
        │
        ▼
 ┌──────────────────────────────────────────┐
 │           Socket.io Server               │
 │                                          │
 │  io.on('connection', (socket) => {       │
 │    registerTaskSocket(io, socket);       │
 │  })                                      │
 └──────────────────────────────────────────┘
         │
         ▼
 ┌───────────────────────┐
 │   registerTaskSocket  │  (taskSocket.ts)
 │                       │
 │  Events Handled:      │
 │  - joinProject        │
 │  - leaveProject       │
 │  - joinTask           │
 │  - leaveTask          │
 └───────────────────────┘
```

### Room Strategy

The system uses **two levels of rooms**:

| Room Pattern | Purpose |
|---|---|
| `project-{projectId}` | Broadcast task events to all members of a project |
| `task-{taskId}` | Granular updates scoped to a single task |

### Socket Events Reference

#### Client → Server (Emitted by client)

| Event | Payload | Description |
|---|---|---|
| `joinProject` | `projectId: number` | Join the project room to receive task updates |
| `leaveProject` | `projectId: number` | Leave the project room |
| `joinTask` | `taskId: number` | Join a task room for granular updates |
| `leaveTask` | `taskId: number` | Leave a task room |

#### Server → Client (Emitted by server)

| Event | Payload | Description | Trigger |
|---|---|---|---|
| `joinedProject` | `{ userId, projectId }` | Notifies others someone joined | On `joinProject` |
| `leftProject` | `{ userId, projectId }` | Notifies others someone left | On `leaveProject` |
| `joinedTask` | `{ userId, taskId }` | Notifies others viewing the task | On `joinTask` |
| `leftTask` | `{ userId, taskId }` | Notifies others someone left task | On `leaveTask` |
| `taskCreated` | `TaskObject` | Broadcasts a new task to the room | REST POST /tasks |
| `taskUpdated` | `TaskObject` | Broadcasts updated task to the room | REST PATCH /tasks/:id |
| `taskDeleted` | `taskId: number` | Broadcasts deleted task ID to the room | REST DELETE /tasks/:id |

### How REST and WebSocket Integrate

The key architectural decision is that **REST mutations trigger real-time broadcasts**. When a task is created via HTTP, the controller immediately emits to the Socket.io room:

```typescript
// taskController.ts
const task = await createTask(projectId, data);
if (task) {
  io.to(`project-${projectId}`).emit('taskCreated', task);
}
res.status(200).json({ message: "Task created successfully", data: task });
```

This means the HTTP client gets a response, AND all other connected clients in the room get a live push — with no polling required.

### Singleton Socket Instance

The `io` instance is initialized once in `server.ts` and exported via a getter pattern:

```typescript
// socket.ts
let io: Server;
export const initSocket = (server) => { io = new Server(server, ...); };
export const getIO = () => {
  if (!io) throw new Error('IO is not initialized');
  return io;
};
```

This **singleton pattern** ensures any controller can call `getIO()` without passing `io` through the entire call stack.

---

## 8. Task Collaboration Flow

This is an end-to-end walkthrough of how two users collaborate in real-time:

```
User A (Project Owner)          User B (Project Member)
       │                                │
       │── POST /users/login ──────────▶│ (Server)
       │◀── 200 + Access Token ─────────│
       │                                │
       │── WS: connect() ──────────────▶│
       │── WS: emit('joinProject', 1) ─▶│ (joins room: "project-1")
       │                                │
       │                   User B logs in and connects
       │                                │
       │                                │── WS: connect()
       │                                │── WS: emit('joinProject', 1)
       │◀── WS: 'joinedProject' ────────│ (User A gets notified)
       │                                │
       │── POST /api/v1/projects/1/tasks
       │   { title: "Build login UI" } ─▶│ (Server creates task)
       │◀── 200 + task object ──────────│
       │                                │
       │                    ◀── WS: 'taskCreated' + task ──│
       │                    (User B sees new task instantly) │
       │                                │
       │── PATCH /tasks/42             │
       │   { status: "IN_PROGRESS" } ──▶│
       │◀── 200 + updated task ─────────│
       │                    ◀── WS: 'taskUpdated' ──────────│
```

---

## 9. Security Implementation

### Layers of Security

| Layer | Technology | What it Prevents |
|---|---|---|
| **Rate Limiting** | `express-rate-limit` | Brute-force, DDoS |
| **HPP** | `hpp` | HTTP Parameter Pollution attacks |
| **Body Size Limit** | `express.json({ limit: '20kb' })` | Payload flooding |
| **GZIP Compression** | `compression` | Not security per-se, but reduces bandwidth |
| **httpOnly Cookies** | Cookie options | XSS cannot read refresh token |
| **Secure Flag** | Cookie options | Token not sent over plain HTTP |
| **JWT Verification** | `jsonwebtoken` | Token tampering detection |
| **Password Hashing** | `bcryptjs` (cost: 10) | Credential leakage |
| **Token Revocation** | DB-stored `revoked` flag | Replay attacks on logout |
| **Prisma P2025 handling** | Global error handler | Leaking record-not-found details |

### Rate Limiting Configuration

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  limit: 5,                   // 5 requests per window per IP
  standardHeaders: 'draft-8', // Modern RateLimit headers
  legacyHeaders: false
});
app.use('/api', limiter);
```

> **Note for production**: The current limit of 5 req/15min is very aggressive — suitable for development testing. In production, adjust to ~100 req/15min for authenticated routes and keep stricter limits on auth endpoints.

### Error Handling Security

The `globalError` middleware distinguishes between development and production environments:

```
Development → returns full error + stack trace
Production  → returns only safe, generic message
```

This prevents leaking implementation details or file paths to attackers.

---

## 10. Folder Structure

```
app-task-project/
│
├── prisma/
│   ├── schema.prisma           # Database schema and models
│   └── migrations/             # Auto-generated Prisma migrations
│
├── src/
│   ├── index.ts                # Express app setup, middleware, routes
│   ├── server.ts               # HTTP server bootstrap + Socket.io init
│   │
│   ├── controllers/            # Route handlers (request → response)
│   │   ├── authController.ts   # signup, login, logout, refreshToken
│   │   ├── taskController.ts   # task CRUD + Socket.io emit
│   │   ├── projectController.ts
│   │   ├── commentController.ts
│   │   ├── porjectMemberController.ts
│   │   ├── tagController.ts
│   │   ├── taskTagController.ts
│   │   └── userController.ts
│   │
│   ├── services/               # Business logic and database access
│   │   ├── authServices.ts     # createUser, logIn, generateTokens
│   │   ├── taskServices.ts     # task CRUD + filtering/pagination
│   │   ├── projectServices.ts
│   │   ├── commentServices.ts
│   │   ├── projectMemberServices.ts
│   │   ├── tagServices.ts
│   │   └── taskTagServices.ts
│   │
│   ├── routers/                # Express routers — thin, URL-only
│   │   ├── userRouter.ts       # /api/v1/users
│   │   ├── projectRouter.ts    # /api/v1/projects (nested routers inside)
│   │   ├── taskRouter.ts       # /:projectId/tasks
│   │   ├── commentRouter.ts    # /:taskId/comments
│   │   ├── memberRouter.ts     # /:projectId/members
│   │   ├── tagRouter.ts
│   │   └── taskTagRouter.ts
│   │
│   ├── middlewares/
│   │   ├── authenticate.ts     # JWT verification → req.user
│   │   ├── authorize.ts        # Role-based access control
│   │   ├── checkMember.ts      # Validates project/member params
│   │   └── validate.ts         # Zod schema validation middleware
│   │
│   ├── sockets/
│   │   ├── socket.ts           # Socket.io initialization + singleton
│   │   └── taskSocket.ts       # Room join/leave event handlers
│   │
│   ├── Utilies/
│   │   ├── ApiError.ts         # Custom operational error class
│   │   ├── CatchAsync.ts       # Async controller wrapper
│   │   ├── ErrorHandler.ts     # Global error + 404 middleware
│   │   ├── logger.ts           # Winston logger configuration
│   │   └── password.ts          # bcrypt helper
│   │
│   ├── types/
│   │   ├── express.d.ts        # Augments req.user + req.projectId
│   │   ├── taskDTO.ts          # Task Data Transfer Object types
│   │   └── userDTO.ts          # User DTOs + Zod schemas
│   │
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton
│   │
│   └── generated/
│       └── prisma/             # Auto-generated Prisma client
│
├── logs/
│   ├── error.log               # Error-level logs
│   └── combined.log            # All logs (info and above)
│
├── public/
│   └── index.html              # Simple Socket.io test client
│
├── .env                        # Environment variables
├── package.json
├── tsconfig.json
├── nodemon.json
└── prisma.config.ts
```

---

## 11. Technical Decisions

### Why TypeScript?
TypeScript adds compile-time safety to a codebase that would otherwise have dozens of subtle runtime type bugs — especially in Prisma query shapes, JWT payload types, and DTO handling. The overhead is minimal in a project of this size and the correctness guarantees are significant.

### Why Prisma ORM?
Prisma provides:
- **Type-safe queries** — no raw SQL typos
- **Automatic migration generation** from schema changes
- **Rich relations** — easy to eager-load related models
- **Generated client** scoped to the project (see `output: ../src/generated/prisma`)

The custom output path (`src/generated/prisma`) is intentional: it allows the generated client to be committed to source control, making the project runnable without running `prisma generate` first.

### Why ESM (ES Modules)?
`"type": "module"` in `package.json` enables native ESM. This aligns the Node.js module system with the TypeScript source and enables top-level `await` in future iterations. All imports use `.js` extensions to satisfy ESM resolution at runtime (TypeScript compiles `.ts` → `.js`).

### Why Winston for Logging?
Unlike `console.log`, Winston:
- Logs to separate files (`error.log`, `combined.log`)
- Supports log levels (`error`, `warn`, `info`, `debug`)
- Outputs in JSON format — parseable by log aggregators (e.g., Datadog, Logtail)
- Can be extended with transports without code changes

### Why `CatchAsync` Wrapper?
Instead of wrapping every async controller in a try/catch, all controllers use the `CatchAsync` higher-order function:

```typescript
// CatchAsync.ts
export const CatchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
```

Any unhandled rejection automatically flows to the global error handler. This keeps controllers clean and ensures no error is silently swallowed.

### Why Nested Routers?
Express nested routers (with `mergeParams: true`) create a clean URL hierarchy:
```
/api/v1/projects/:projectId/tasks/:taskId/comments/:commentId
```
Each router only knows its own segment — `CommentRouter` doesn't need to know it lives under `tasks` or `projects`. This is highly composable.

### Why Zod for Validation?
Zod is used for runtime schema validation of incoming request bodies. It:
- Produces TypeScript types automatically via `z.infer<>`
- Normalizes data (e.g., `.transform(email => email.toLowerCase())`)
- Provides detailed error messages for API consumers

---

## 12. Scalability Considerations

### Current Limitations

| Area | Current State | Scalability Ceiling |
|---|---|---|
| Socket.io | Single Node process | Cannot scale horizontally without adapter |
| Rate Limiting | In-memory (per process) | Inaccurate in multi-instance deployments |
| Session Storage | DB-backed refresh tokens | Will slow under high query load without indexing |
| Logging | File-based | Not suitable for distributed/cloud deployments |

### Recommendations for Scale

1. **Socket.io Horizontal Scaling**: Add `@socket.io/redis-adapter` to sync events across multiple Node instances behind a load balancer.

2. **Rate Limiting**: Replace in-memory `express-rate-limit` with `rate-limit-redis` to share rate limit state across instances.

3. **Caching**: Add Redis caching for frequent reads like `getTasksByProject` — cache with a 30-second TTL and invalidate on mutations.

4. **Database**: Add indexes on frequently queried columns:
   ```sql
   CREATE INDEX idx_task_project_id ON "Task"("projectId");
   CREATE INDEX idx_task_assignee ON "Task"("assigneeId");
   CREATE INDEX idx_refresh_token_user ON "RefreshToken"("userId");
   ```

5. **Connection Pooling**: The Prisma PostgreSQL adapter (`@prisma/adapter-pg`) is already included in `package.json`, enabling pgBouncer-style connection pooling for high-concurrency scenarios.

6. **Logging**: Switch from file transports to a remote logging service (e.g., Winston HTTP transport to Logtail or Datadog).

---

## 13. Future Improvements

| Priority | Feature | Rationale |
|---|---|---|
| 🔴 High | Unit & integration test suite (Jest/Vitest) | Coverage for auth flow, task services, socket events |
| 🔴 High | Add index on `RefreshToken.userId` | Prevents full table scans on token lookup |
| 🔴 High | Normalize `commentRouter` route design | Currently mixes GET and POST on same `/:commentId` path |
| 🟡 Medium | Task activity log | Track who changed what and when |
| 🟡 Medium | File attachments on tasks | Using S3 or similar object storage |
| 🟡 Medium | Email notifications | Notify users on task assignment or comment |
| 🟡 Medium | WebSocket authentication | Guard Socket.io connections with JWT |
| 🟡 Medium | Swagger/OpenAPI spec | Auto-generated API documentation |
| 🟢 Low | Task due dates and reminders | Scheduled jobs with `node-cron` |
| 🟢 Low | Project templates | Clone project structure for new projects |
| 🟢 Low | Admin dashboard endpoints | User management for ADMIN role |

---

## 14. How to Run the Project

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) database (or a cloud instance like [Neon](https://neon.tech))
- npm

### Setup Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd app-task-project

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Copy the .env.example and fill in your values
cp .env.example .env

# 4. Push the schema to your database (creates tables)
npx prisma db push

# 5. Generate the Prisma client
npx prisma generate

# 6. Start the development server
npm start
```

The server will start on `http://localhost:3000`.

### Testing Socket.io

Open `http://localhost:3000` in your browser to access the built-in Socket.io test client (`public/index.html`).

### Database GUI

```bash
# Open Prisma Studio to inspect your database
npx prisma studio
```

---

## 15. Environment Variables

Create a `.env` file in the project root:

```env
# Application
NODE_ENV=development       # 'development' or 'production'
PORT=3000                  # Port to run the server on

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
# Example for Neon:
# DATABASE_URL="postgresql://neondb_owner:password@ep-xxx.neon.tech/neondb?sslmode=require"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
ACCESS_TOKEN_EXPIRES_IN="30m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

> ⚠️ **Security Warning**: Never commit your `.env` file or real credentials to source control. Rotate `JWT_SECRET` and `DATABASE_URL` credentials immediately if exposed.

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | Controls error verbosity (`development` shows stack traces) |
| `PORT` | ✅ | HTTP server port |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | HMAC secret for signing both access and refresh tokens |
| `ACCESS_TOKEN_EXPIRES_IN` | Optional | Defaults to `"30m"` in code |
| `REFRESH_TOKEN_EXPIRES_IN` | Optional | Defaults to `"7d"` in code |

---

## 16. Example Requests & Responses

### Register a New User

**Request**
```http
POST /api/v1/users/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-02-21T20:00:00.000Z"
  }
}
```
> Access token returned in `Authorization: Bearer <token>` header.
> Refresh token set as `httpOnly` cookie.

---

### Login

**Request**
```http
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response** `200 OK`
```json
{
  "message": "User logged in successfully"
}
```

---

### Create a Task

**Request**
```http
POST /api/v1/projects/1/tasks
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Design login screen",
  "description": "Wireframes and final UI for the login page",
  "createdBy": 1
}
```

**Response** `200 OK`
```json
{
  "message": "Task created successfully",
  "data": {
    "id": 42,
    "title": "Design login screen",
    "description": "Wireframes and final UI for the login page",
    "status": "PENDING",
    "projectId": 1,
    "createdBy": 1,
    "assigneeId": null,
    "parentTaskId": null,
    "createdAt": "2026-02-21T21:00:00.000Z",
    "updatedAt": "2026-02-21T21:00:00.000Z"
  }
}
```
> Simultaneously, all clients in room `"project-1"` receive a `taskCreated` WebSocket event.

---

### Get Tasks with Filters

**Request**
```http
GET /api/v1/projects/1/tasks?status=IN_PROGRESS&page=1&limit=5&sortedBy=createdAt&sortedOrder=desc
Authorization: Bearer <access-token>
```

**Response** `200 OK`
```json
{
  "data": {
    "tasks": [
      {
        "id": 42,
        "title": "Design login screen",
        "status": "IN_PROGRESS",
        "assignedTo": { "id": 2, "name": "Jane Smith" },
        "creator": { "name": "John Doe" },
        "subTasks": [{ "title": "Create wireframes" }]
      }
    ],
    "pagination": {
      "total": 1,
      "totalPages": 1,
      "currentPage": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### Error Response Example

**Request** (invalid token)
```http
GET /api/v1/projects/1/tasks
Authorization: Bearer invalid-token
```

**Response** `401 Unauthorized`
```json
{
  "message": "Unauthorized"
}
```

**Production 500 Error**
```json
{
  "status": "error",
  "message": "Internal Server Error"
}
```

---

### Socket.io Connection Example (JavaScript)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// Join the project room to receive real-time task updates
socket.emit("joinProject", 1);

// Listen for task events
socket.on("taskCreated", (task) => {
  console.log("New task added:", task);
});

socket.on("taskUpdated", (task) => {
  console.log("Task updated:", task);
});

socket.on("taskDeleted", (taskId) => {
  console.log("Task deleted with ID:", taskId);
});

socket.on("joinedProject", (data) => {
  console.log("Another user joined:", data);
});
```

---

## 17. Developer Notes

### Architecture Observations

- **`index.ts` vs `server.ts`**: The app is intentionally split into two files. `index.ts` exports the Express `app` (pure, testable, no side effects), and `server.ts` starts the actual HTTP server. This makes it easy to import `app` in a test environment without starting a server.

- **`mergeParams: true`** on nested routers: Without this, `req.params.projectId` from the parent router would not be available inside `TaskRouter`. This is a common Express gotcha.

- **Prisma Client in `generated/` folder**: The Prisma client is output to `src/generated/prisma` (not the default `node_modules`). This is intentional for environments where `node_modules` is cleaned, ensuring the generated client is always present.

- **`process.on('uncaughtException')` and `process.on('unhandledRejection')`**: Defined in `server.ts` to ensure the process always shuts down gracefully on fatal errors, allows Winston time to flush logs before exit.


*Documentation generated for the `app-task-project` repository — February 2026.*
