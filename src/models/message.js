import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
    user_sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        //required: true,
    },
    client_sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        //required: true,
    },
    user_receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        //required: true,
    },
    client_receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        //required: true,
    },
   /*  receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }, */
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model('Message', messageSchema);

export default Message;