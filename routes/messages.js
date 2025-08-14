const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET all messages
router.get('/', async (req, res) => {
  const messages = await Message.find().sort({ timestamp: -1 });
  res.json(messages);
});

// POST new message
router.post('/', async (req, res) => {
  const { name, content } = req.body;
  const newMsg = new Message({ name, content });
  await newMsg.save();
  res.json(newMsg);
});

module.exports = router;
