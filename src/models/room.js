import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    //required: true,
    enum: ['group', 'private'],
    default: 'group', 
  },
  description: {
    type: String,
  },
  is_private: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  clients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true,
    }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
  }],
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});



const Room = mongoose.model('Room', roomSchema);

export default Room; 