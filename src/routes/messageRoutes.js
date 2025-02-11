const express = require('express');
const { sendMessage, getMessages } = require('../controllers/messageController');
// const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/', authController.checkAuthMiddleware,sendMessage);
router.get('/:sender/:receiver',authController.checkAuthMiddleware, getMessages);

module.exports = router;