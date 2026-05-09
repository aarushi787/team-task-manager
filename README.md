# TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control, Kanban boards, and real-time dashboards.

**Live URL:** `https://your-app.up.railway.app`  
**GitHub:** `https://github.com/your-username/team-task-manager`

---

## Features

- **Authentication** — JWT-based signup/login, auto-admin for first user
- **Projects** — Create, manage, archive projects with custom colors and progress tracking
- **Kanban Board** — Drag-free status columns (To Do → In Progress → Review → Done)
- **Task Management** — Create, assign, prioritize, set due dates, filter by status/priority/overdue
- **Team Management** — Add/remove project members, promote/demote app-level roles
- **Dashboard** — Stats overview, pie/bar charts, recent activity feed
- **Role-Based Access Control:**
  - **App Admin** — Full access to all projects, tasks, users; can change roles
  - **App Member** — Access only to projects they're added to
  - **Project Admin** — Can manage project settings, members, and tasks
  - **Project Member** — Can create and update tasks within the project

---

## Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | React 18, React Router v6, Recharts |
| Backend     | Node.js, Express 4                  |
| ORM         | Sequelize 6                         |
| Database    | PostgreSQL (prod) / SQLite (dev)    |
| Auth        | JWT + bcryptjs                      |
| Deployment  | Railway                             |

---

## Local Development

### Prerequisites
- Node.js ≥ 18
- npm

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp env.example .env
# Edit .env — set JWT_SECRET. Leave DATABASE_URL blank for SQLite.

# 4. Start both servers (backend :5000 + frontend :3000)
npm run dev
```

Open `http://localhost:3000`.  
The first account you create automatically becomes an **Admin**.

---

## Deployment on Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/team-task-manager.git
git push -u origin main
```

### Step 2 — Create Railway Project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select your repo
3. Railway detects `railway.json` and builds automatically

### Step 3 — Add PostgreSQL
1. In your Railway project → **+ New** → **Database** → **PostgreSQL**
2. Go to your app service → **Variables**
3. Add the following environment variables:

| Variable       | Value                                        |
|----------------|----------------------------------------------|
| `NODE_ENV`     | `production`                                 |
| `JWT_SECRET`   | *(generate with command below)*              |
| `DATABASE_URL` | *(copy from PostgreSQL service → Variables)* |

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4 — Deploy
Railway triggers a new deploy automatically. Visit your app URL from the **Settings** tab.

---

## Project Structure

```
team-task-manager/
├── server.js               # Express entry point
├── config/
│   └── database.js         # Sequelize + PostgreSQL/SQLite config
├── models/
│   └── index.js            # User, Project, ProjectMember, Task + associations
├── routes/
│   ├── auth.js             # POST /signup, /login, GET /me
│   ├── projects.js         # CRUD + member management
│   ├── tasks.js            # CRUD + dashboard stats + filters
│   └── users.js            # List users, change roles
├── middleware/
│   └── auth.js             # JWT verify, requireAdmin, signToken
├── frontend/
│   ├── src/
│   │   ├── api/axios.js    # Axios instance with JWT interceptor
│   │   ├── context/        # AuthContext (global user state)
│   │   ├── pages/          # Dashboard, Projects, ProjectDetail, MyTasks, Team
│   │   ├── components/     # Layout (sidebar + outlet)
│   │   └── index.css       # Full design system (dark theme, tokens, components)
│   └── vite.config.js      # Vite + dev proxy → :5000
├── railway.json            # Railway build + deploy config
├── nixpacks.toml           # Node 20 build spec
└── env.example             # Environment variable template
```

---

## API Reference

### Auth
| Method | Endpoint         | Body                          | Auth |
|--------|-----------------|-------------------------------|------|
| POST   | /api/auth/signup | name, email, password, role   | —    |
| POST   | /api/auth/login  | email, password               | —    |
| GET    | /api/auth/me     | —                             | JWT  |

### Projects
| Method | Endpoint                          | Auth       | Notes                    |
|--------|----------------------------------|------------|--------------------------|
| GET    | /api/projects                    | JWT        | Returns accessible projects |
| POST   | /api/projects                    | JWT        | Creates project          |
| GET    | /api/projects/:id                | JWT+member | Full project with tasks  |
| PUT    | /api/projects/:id                | JWT+padmin | Update name/status/color |
| DELETE | /api/projects/:id                | JWT+padmin | Cascades to tasks        |
| POST   | /api/projects/:id/members        | JWT+padmin | Add member               |
| DELETE | /api/projects/:id/members/:uid   | JWT+padmin | Remove member            |

### Tasks
| Method | Endpoint           | Auth       | Notes                   |
|--------|--------------------|------------|-------------------------|
| GET    | /api/tasks         | JWT        | Filters: status, priority, assigneeId, overdue |
| GET    | /api/tasks/dashboard | JWT      | Stats + recent tasks    |
| POST   | /api/tasks         | JWT+member | Create task in project  |
| GET    | /api/tasks/:id     | JWT+member | Task detail             |
| PUT    | /api/tasks/:id     | JWT+member | Update any field        |
| DELETE | /api/tasks/:id     | JWT        | Creator or project admin |

### Users
| Method | Endpoint             | Auth      |
|--------|----------------------|-----------|
| GET    | /api/users           | JWT       |
| GET    | /api/users/:id       | JWT       |
| PUT    | /api/users/:id/role  | JWT+admin |

---

## Data Models

```
User         { id, name, email, password, role(admin|member) }
Project      { id, name, description, status, color, ownerId }
ProjectMember{ id, projectId, userId, role(admin|member) }
Task         { id, title, description, status, priority, dueDate, tags,
               projectId, assigneeId, creatorId }
```

---

## Role Permissions Summary

| Action                    | App Admin | Project Admin | Project Member |
|---------------------------|:---------:|:-------------:|:--------------:|
| View any project          | ✅        | ✅ (own)       | ✅ (own)       |
| Create project            | ✅        | ✅             | ✅             |
| Edit/delete project       | ✅        | ✅             | ❌             |
| Add/remove members        | ✅        | ✅             | ❌             |
| Create tasks              | ✅        | ✅             | ✅             |
| Update any task           | ✅        | ✅             | ✅             |
| Delete task               | ✅        | ✅             | Creator only   |
| Change user roles         | ✅        | ❌             | ❌             |
| View all users            | ✅        | ✅             | ✅             |

---

## Demo Accounts (seed manually or sign up)

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@taskflow.com  | admin123   |
| Member| member@taskflow.com | member123  |

*(First signup always becomes Admin)*
