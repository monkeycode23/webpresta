// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // destinatario
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // quien generó la notificación
  type: { type: String, enum: ['like', 'message', 'match'], required: true },
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
