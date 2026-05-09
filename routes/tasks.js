const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Task, User, Project, ProjectMember } = require('../models');
const { authenticate } = require('../middleware/auth');

const canAccessProject = async (userId, projectId, userRole) => {
  if (userRole === 'admin') return true;
  const mem = await ProjectMember.findOne({ where: { userId, projectId } });
  return !!mem;
};

const isProjectAdmin = async (userId, projectId, userRole) => {
  if (userRole === 'admin') return true;
  const mem = await ProjectMember.findOne({ where: { userId, projectId, role: 'admin' } });
  return !!mem;
};

const taskInclude = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
  { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
];

// GET /api/tasks - all tasks visible to user (with optional filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId, status, priority, assigneeId, overdue } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (overdue === 'true') {
      where.dueDate = { [Op.lt]: new Date() };
      where.status = { [Op.notIn]: ['done'] };
    }

    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.findAll({ where, include: taskInclude, order: [['createdAt', 'DESC']] });
    } else {
      // Only tasks in projects the user is a member of
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id } });
      const projectIds = memberships.map(m => m.projectId);
      where.projectId = { [Op.in]: projectIds };
      tasks = await Task.findAll({ where, include: taskInclude, order: [['createdAt', 'DESC']] });
    }
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/dashboard - summary stats for current user
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    let projectWhere = {};
    if (req.user.role !== 'admin') {
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id } });
      const projectIds = memberships.map(m => m.projectId);
      projectWhere.projectId = { [Op.in]: projectIds };
    }

    const now = new Date();
    const [total, todo, inProgress, review, done, overdue, myTasks] = await Promise.all([
      Task.count({ where: projectWhere }),
      Task.count({ where: { ...projectWhere, status: 'todo' } }),
      Task.count({ where: { ...projectWhere, status: 'in_progress' } }),
      Task.count({ where: { ...projectWhere, status: 'review' } }),
      Task.count({ where: { ...projectWhere, status: 'done' } }),
      Task.count({ where: { ...projectWhere, dueDate: { [Op.lt]: now }, status: { [Op.notIn]: ['done'] } } }),
      Task.count({ where: { ...projectWhere, assigneeId: req.user.id, status: { [Op.notIn]: ['done'] } } }),
    ]);

    // Recent tasks
    const recentTasks = await Task.findAll({
      where: projectWhere,
      include: taskInclude,
      order: [['updatedAt', 'DESC']],
      limit: 8,
    });

    res.json({ stats: { total, todo, inProgress, review, done, overdue, myTasks }, recentTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Task title required'),
  body('projectId').notEmpty().withMessage('Project ID required'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate, tags } = req.body;

    const access = await canAccessProject(req.user.id, projectId, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied' });

    const task = await Task.create({
      title, description, projectId, assigneeId, status, priority, dueDate, tags,
      creatorId: req.user.id,
    });

    const full = await Task.findByPk(task.id, { include: taskInclude });
    res.status(201).json({ task: full });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, { include: taskInclude });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const access = await canAccessProject(req.user.id, task.projectId, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const access = await canAccessProject(req.user.id, task.projectId, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied' });

    const { title, description, assigneeId, status, priority, dueDate, tags } = req.body;
    await task.update({ title, description, assigneeId, status, priority, dueDate, tags });
    const full = await Task.findByPk(task.id, { include: taskInclude });
    res.json({ task: full });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const admin = await isProjectAdmin(req.user.id, task.projectId, req.user.role);
    if (!admin && task.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'Only task creator or project admin can delete' });
    }
    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
