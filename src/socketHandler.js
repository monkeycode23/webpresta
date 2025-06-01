import jwt from 'jsonwebtoken';
import Cliente from './models/cliente.js'; // Use Cliente model for authentication
import User from './models/user.js';
import { io as mainIo } from './index.js'; // Importar la instancia \`io\` principal
import Room from './models/room.js'
import Message from './models/message.js'
const connectedUsers = new Map(); // Map to store clienteID -> socketID
const JWT_SECRET = process.env.JWT_SECRET || 'prestaweb-secret-key'; // Align with authMiddleware

export default function initializeSocket(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(token)
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(decoded)
        
        
        let cliente 
        let user 
        
        if(typeof decoded.id === "number"){
          console.log(await User.find())
          console.log("sqlite_id",decoded.id.toString())
          
          cliente = await User.findOne({sqlite_id:decoded.id.toString()});
          user = await User.findOne({sqlite_id:decoded.id.toString()})
          console.log(cliente)
          console.log(user)

          if(!cliente){
            const user  = new User({
              sqlite_id:decoded.id.toString(),
              username:decoded.username,
              email:decoded.email,
              password:decoded.password,
              isAdmin:false,
            })
            
            await user.save()
          }

        }else{
          cliente = await Cliente.findOne({_id:socket.clienteId});
          user = await User.findOne({_id:decoded.id})
          console.log(user)
        }
        if (!cliente && !user) {
          return next(new Error('Authentication error: Client not found.'));
        }
        // You might want to check if cliente.activo here as well
        socket.clienteId =!cliente ? user._id : cliente._id; // Assuming JWT payload from your auth has 'id' for Cliente
        next();
      } catch (err) {
        console.error('Socket authentication error:', err.message);
        return next(new Error('Authentication error'));
      }
    } else {
      console.warn('Socket connection without token. Proceeding as anonymous for now.');
      // For a fully featured chat, you would typically require authentication.
      // To enforce auth, uncomment and modify: return next(new Error('Authentication error: Token not provided'));
      next(); 
    }
  });

  io.on('connection', async(socket) => {
    console.log(`User connected: ${socket.id}, ClienteID: ${socket.clienteId || 'Anonymous'}`);

    if (socket.clienteId) {
      connectedUsers.set(socket.clienteId.toString(), socket.id);
      console.log('Connected clients:', Array.from(connectedUsers.keys()));
     // io.emit('userOnlineStatus', { userId: socket.clienteId, isOnline: true, onlineUsers: Array.from(connectedUsers.keys()) });
     const user = await User.findOne({_id:socket.clienteId})
     if(user){
      socket.emit('userOnlineStatus', { userId: socket.clienteId, isOnline: true, onlineUsers: Array.from(connectedUsers.keys()) });
     }
      
    }


    socket.on("joinRoom",async(data)=>{
      console.log("joinRoom",data)
      const room = await Room.findOne({_id:data.roomId})
      const user = await User.findOne({_id:socket.clienteId})
      const client = await Cliente.findOne({_id:socket.clienteId})

      const isUserOrClient = user ? "user" : "client"
      
      if(isUserOrClient === "user"){
        user.isConnected = true
        await user.save()

        if(room){
          room.connected_users.push(socket.clienteId)
          await room.save()
        }
        
      }
      if(isUserOrClient === "client"){
        client.isConnected = true
        await client.save()

        if(room){
          room.connected_clients.push(socket.clienteId)
          await room.save()
        }
      }

     
    })



    socket.on('sendMessage', async(data) => {
      console.log("sendMessage",data)
      // data should include: { receiverId: string (clienteId), content: string }
      console.log('sendMessage event received:', data, 'from clienteId:', socket.clienteId);

      // Further implementation will go here: save message, emit to receiver, create notification.
      const room = await Room.findOne({_id:data.roomId}).populate('users').populate('clients')
      console.log("room",room)
      
      if(room){
        const message = new Message({
          user_sender:data.user_sender ? data.user_sender : null,
          client_sender:data.client_sender ? data.client_sender : null,
          content:data.content,
          type:data.type,
          time:data.time,
          room:room._id
        })
        await message.save()

        room.messages.push(message)
        await room.save()
      }
      room.users.forEach(async(user)=>{
        
     
          const user_id = connectedUsers.get(user._id.toString())
        
          if(user_id){
            
            io.to(user_id).emit('reciveMessage', {...data,user:{
             ...user,
              name:user.username,
              avatar:"https://i.pravatar.cc/150?img=64"
            }})
          }
          /* user1.notifications.push(data)
          await user1.save() */
        
        //generar una ntificacion y mandarla
       /*  const notification = new Notification({
          user:user,
          message:data.content,
          room:room,
          type:"message"
        })
 */

         })
      /*   await notification.save()
        await notification.populate('user')
        await notification.populate('room')
        sendNotificationToUser(user._id, notification)
 */

       /*  const notification = new Notification({ 
          user:user,
          message:data.content,
          room:room,
          type:"message"
        })
        await notification.save()

        const message = new Message({
          user_sender:user,
          content:data.content,
          room:room._id,
          type:"text"
        })
        
        await message.save()
        
        const uer_id = connectedUsers.get(user._id.toString())
        
        if(user_id){
          
          io.to(user_id).emit('reciveMessage', data)
        }
      }) */
     /*  room.connected_clients.forEach(async(client)=>{
        const client1 = await Cliente.findOne({_id:client})
        if(client1){
          client1.notifications.push(data)
          await client1.save()
        }

        if(connectedUsers.get(client.toString())){
          io.to(connectedUsers.get(client.toString())).emit('newMessage', data)
        }
      }) */
    });

    socket.on('typing', (data) => {
       console.log('typing event received:', data);
       // const receiverSocketId = connectedUsers.get(data.receiverId.toString());
       // if (receiverSocketId) io.to(receiverSocketId).emit('userTyping', { senderId: socket.clienteId, isTyping: data.isTyping });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}, ClienteID: ${socket.clienteId || 'Anonymous'}`);
      if (socket.clienteId) {
        connectedUsers.delete(socket.clienteId.toString());
        console.log('Connected clients after disconnect:', Array.from(connectedUsers.keys()));
        io.emit('userOnlineStatus', { userId: socket.clienteId, isOnline: false, onlineUsers: Array.from(connectedUsers.keys()) });
      }
    });
  });
}

export function getReceiverSocketId(receiverId) {
  return connectedUsers.get(receiverId.toString());
}

/**
 * Envía una notificación a un usuario específico si está conectado.
 * @param {string} clienteId El ID del cliente que recibirá la notificación.
 * @param {object} notificationData Datos de la notificación (debe coincidir con la interfaz Notification del frontend).
 *                                  Ej: { id: uuidv4(), type: 'info', title: 'Título', message: 'Mensaje', timestamp: new Date().toISOString(), read: false, link?: '/ruta' }
 */
export function sendNotificationToUser(clienteId, notificationData) {
  if (!mainIo) { // Usar mainIo, la instancia exportada de index.js
    console.error('Socket.IO server (mainIo) not initialized in socketHandler.');
    return;
  }
  const socketId = getReceiverSocketId(clienteId);
  if (socketId) {
    console.log(`Sending notification to clienteId ${clienteId} (socketId ${socketId}):`, notificationData);
    mainIo.to(socketId).emit('new_notification', notificationData);
  } else {
    console.log(`Cliente ${clienteId} no conectado. Notificación no enviada en tiempo real.`);
    // Aquí podrías guardar la notificación en la BD para mostrarla cuando el usuario se conecte,
    // o si ya tienes un sistema de notificaciones persistentes, asegurar que se guarde.
  }
} 