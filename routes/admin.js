const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { isAdmin } = require('../middleware/adminAuth');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated, isAdmin);

router.get('/', admin.dashboard);
router.get('/users', admin.users);
router.post('/users/ban', admin.banUser);
router.get('/transactions', admin.transactions);
router.get('/finances', admin.finances);
router.get('/games-config', admin.gamesConfig);
router.post('/settings/update', admin.updateSettings);
router.get('/support', admin.supportMessages);
router.post('/support/respond', admin.respondSupport);
router.get('/settings', admin.settings);
router.get('/logs', admin.adminLogs);

module.exports = router;
