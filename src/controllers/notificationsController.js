// controllers/notificationsController.js
const Notification = require('../models/Notification');
let notifications = [
    {
      id: 1,
      title: "Order Shipped",
      message: "Your order #12345 has been shipped and is on its way!",
      type: "order",
      timestamp: "2025-01-19T10:00:00Z",
      read: false,
    },
    {
      id: 2,
      title: "New Sale Alert!",
      message: "Get up to 50% off on electronics. Limited time offer!",
      type: "promo",
      timestamp: "2025-01-18T14:00:00Z",
      read: false,
    },
  ];
  
  // Get all notifications
  const getAllNotifications = async (req, res) => {
    try {
      // Fetch all notifications from the database
      const notifications = await Notification.find();
  
      // Count unread notifications
      const unreadCount = notifications.filter((notification) => !notification.read).length;
  
      // Create response object
      const response = {
        count: notifications.length, // Total notifications
        unreadCount, // Count of unread notifications
        notifications, // Array of notifications
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
  // Mark a notification as read
  const markAsRead = (req, res) => {
    const { id } = req.params;
    const notification = notifications.find((n) => n.id === parseInt(id));
  
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
  
    notification.read = true;
    res.status(200).json(notification);
  };
  
  // Add a new notification
  const addNotification = async (req, res) => {
    try {
      const { title, message, type } = req.body;
      
      if (!title || !message || !type) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const newNotification = new Notification({
        title,
        message,
        type,
      });
  
      await newNotification.save(); // Save to MongoDB
  
      res.status(201).json(newNotification);
    } catch (error) {
      console.error("Error saving notification:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  // Delete a notification
  const deleteNotification = (req, res) => {
    const { id } = req.params;
    const index = notifications.findIndex((n) => n.id === parseInt(id));
  
    if (index === -1) {
      return res.status(404).json({ message: "Notification not found" });
    }
  
    notifications.splice(index, 1);
    res.status(204).send();
  };
  
  module.exports = {
    getAllNotifications,
    markAsRead,
    addNotification,
    deleteNotification,
  };
  