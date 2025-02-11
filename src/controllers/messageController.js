const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  const { sender, receiver, content } = req.body;

  try {
    const message = await Message.create({ sender, receiver, content });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

const getMessages = async (req, res) => {
  const { sender, receiver } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve messages', error: error.message });
  }
};

module.exports = { sendMessage, getMessages };