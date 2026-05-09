const router = require('express').Router();
const { User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users - list all users (for member assignment dropdowns)
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['name', 'ASC']],
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/role - change user role (admin only)
router.put('/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(422).json({ message: 'Invalid role' });
    await user.update({ role });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
