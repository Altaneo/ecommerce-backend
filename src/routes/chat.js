// routes/chat.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// Get all chat messages
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ timestamp: 1 });
    res.json(chats);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Post a new chat message
router.post('/', async (req, res) => {
  const { sender, message } = req.body;
  const chat = new Chat({ sender, message });
  try {
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

module.exports = router;
