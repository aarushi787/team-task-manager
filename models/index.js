const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── User ─────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
  avatar: { type: DataTypes.STRING, defaultValue: null },
}, {
  timestamps: true,
  defaultScope: { attributes: { exclude: ['password'] } },
  scopes: { withPassword: { attributes: {} } },
});

// ── Project ───────────────────────────────────────────────────────────────────
const Project = sequelize.define('Project', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  status: { type: DataTypes.ENUM('active', 'archived', 'completed'), defaultValue: 'active' },
  color: { type: DataTypes.STRING(7), defaultValue: '#4F8EF7' },
}, { timestamps: true });

// ── ProjectMember (join table with role) ─────────────────────────────────────
const ProjectMember = sequelize.define('ProjectMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
}, { timestamps: true });

// ── Task ──────────────────────────────────────────────────────────────────────
const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  status: { type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'), defaultValue: 'todo' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  dueDate: { type: DataTypes.DATE, defaultValue: null },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() { try { return JSON.parse(this.getDataValue('tags')); } catch { return []; } },
    set(val) { this.setDataValue('tags', JSON.stringify(val || [])); },
  },
}, { timestamps: true });

// ── Associations ──────────────────────────────────────────────────────────────
// Project owner
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Project members (M:M through ProjectMember)
Project.belongsToMany(User, { through: ProjectMember, as: 'members', foreignKey: 'projectId' });
User.belongsToMany(Project, { through: ProjectMember, as: 'projects', foreignKey: 'userId' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });

// Tasks belong to project
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Task assignee & creator
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'creatorId', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

module.exports = { sequelize, User, Project, ProjectMember, Task };
