const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
