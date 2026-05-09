const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Project, User, ProjectMember, Task } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Helper: check if user is a project admin or app admin
const isProjectAdmin = async (userId, projectId, userRole) => {
  if (userRole === 'admin') return true;
  const mem = await ProjectMember.findOne({ where: { userId, projectId, role: 'admin' } });
  return !!mem;
};

// Helper: check project membership (or app admin)
const isMember = async (userId, projectId, userRole) => {
  if (userRole === 'admin') return true;
  const mem = await ProjectMember.findOne({ where: { userId, projectId } });
  return !!mem;
};

// GET /api/projects - list projects for current user
router.get('/', authenticate, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } },
          { model: Task, as: 'tasks', attributes: ['id', 'status'] },
        ],
        order: [['createdAt', 'DESC']],
      });
    } else {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } },
          { model: Task, as: 'tasks', attributes: ['id', 'status'] },
        ],
        where: {
          [Op.or]: [
            { ownerId: req.user.id },
            { '$members.id$': req.user.id },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    }
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects - create project (admin or any user)
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name, description, color, ownerId: req.user.id,
    });
    // Owner is automatically an admin member
    await ProjectMember.create({ projectId: project.id, userId: req.user.id, role: 'admin' });
    const full = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } },
      ],
    });
    res.status(201).json({ project: full });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } },
        {
          model: Task, as: 'tasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          ],
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const access = await isMember(req.user.id, project.id, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const admin = await isProjectAdmin(req.user.id, project.id, req.user.role);
    if (!admin) return res.status(403).json({ message: 'Project admin access required' });

    const { name, description, status, color } = req.body;
    await project.update({ name, description, status, color });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const admin = await isProjectAdmin(req.user.id, project.id, req.user.role);
    if (!admin) return res.status(403).json({ message: 'Project admin access required' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const admin = await isProjectAdmin(req.user.id, project.id, req.user.role);
    if (!admin) return res.status(403).json({ message: 'Project admin access required' });

    const { userId, role = 'member' } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [mem, created] = await ProjectMember.findOrCreate({
      where: { projectId: project.id, userId },
      defaults: { role },
    });
    if (!created) await mem.update({ role });
    res.json({ message: created ? 'Member added' : 'Role updated', member: mem });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - remove member
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const admin = await isProjectAdmin(req.user.id, project.id, req.user.role);
    if (!admin) return res.status(403).json({ message: 'Project admin access required' });

    await ProjectMember.destroy({ where: { projectId: project.id, userId: req.params.userId } });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
