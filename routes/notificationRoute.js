const express = require('express');
const router = express.Router(); // Make sure this path is correct for your project
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticateUser } = require('../middlewares/authorizedUser');

// All routes here are protected and require a logged-in user
router.get('/', authenticateUser, getNotifications);
router.put('/mark-read', authenticateUser, markAsRead);

module.exports = router;