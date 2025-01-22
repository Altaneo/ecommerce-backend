// routes/notificationsRoutes.js

const express = require("express");
const {
  getAllNotifications,
  markAsRead,
  addNotification,
  deleteNotification,
} = require("../controllers/notificationsController");

const router = express.Router();

// Get all notifications
router.get("/", getAllNotifications);

// Mark a notification as read
router.patch("/:id", markAsRead);

// Add a new notification
router.post("/", addNotification);

// Delete a notification
router.delete("/:id", deleteNotification);

module.exports = router;
