import jwt from 'jsonwebtoken';
import Cliente from './models/cliente.js'; // Use Cliente model for authentication
import User from './models/user.js';
import { io as mainIo } from './index.js'; // Importar la instancia \`io\` principal
import Room from './models/room.js'
import Message from './models/message.js'
const connectedUsers = new Map(); // Map to store clienteID -> socketID
const connectedClientes = new Map(); // Map to store clienteID -> socketID

const JWT_SECRET = process.env.JWT_SECRET || 'prestaweb-secret-key'; // Align with authMiddleware
import Notification from './models/notification.js';




export default function initializeSocket(io) {
  
  
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    //console.log("token",token)
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        //console.log("decoded",decoded)
        
        
        let cliente 
        let user 
        
        if(typeof decoded.id === "number"){
          //console.log(await User.find())
          //console.log("sqlite_id",decoded.id.toString())
          
          cliente = await Cliente.findOne({sqlite_id:decoded.id.toString()});
          user = await User.findOne({sqlite_id:decoded.id.toString()})
          //console.log(cliente)
          //console.log(user)

          if(!cliente && !user){
            
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
          cliente = await Cliente.findOne({_id:decoded.id});
          user = await User.findOne({_id:decoded.id})
          //console.log("user",user)
          //console.log("cliente",cliente)
        }
        if (!cliente && !user) {
          return next(new Error('Authentication error: Client not found.'));
        }
        // You might want to check if cliente.activo here as well
         // Assuming JWT payload from your auth has 'id' for Cliente
        
        if(cliente) socket.clienteId = cliente._id
        if(user) socket.userId = user._id
        
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

    let _connectedClientes = Array.from(connectedClientes.keys())
    let _connectedUsers = Array.from(connectedUsers.keys())
    
    if (socket.clienteId) {
      connectedClientes.set(socket.clienteId.toString(), socket.id);
      console.log('Connected clients:', Array.from(connectedClientes.keys()));
     // io.emit('userOnlineStatus', { userId: socket.clienteId, isOnline: true, onlineUsers: Array.from(connectedUsers.keys()) });
     const cliente = await Cliente.findOne({_id:socket.clienteId})
     
     if(cliente){
     // const clientes = await Cliente.find({ _id: { $in: _connectedClientes } });
      const users = await User.find({_id:{$in:_connectedUsers}})
      socket.emit('usersOnlineStatus',{onlineUsers:users})
      
      users.forEach(async(user)=>{
        if(connectedUsers.get(user._id.toString())){
          io.to(connectedUsers.get(user._id.toString()))
          .emit('clientConnected',{ clienteId: cliente._id, isOnline: true,cliente} );
          console.log("clientConnected",connectedUsers.get(user._id.toString()))
        }
      })
      //socket.emit('userOnlineStatus', { });
     }
      
    }
    if (socket.userId) {  
      connectedUsers.set(socket.userId.toString(), socket.id);
      console.log('Connected users:', Array.from(connectedUsers.keys()));
     // io.emit('userOnlineStatus', { userId: socket.clienteId, isOnline: true, onlineUsers: Array.from(connectedUsers.keys()) });
     const user = await User.findOne({_id:socket.userId})
     
     if(user){
      const users = await User.find({ _id: { $in: _connectedUsers } });
      const clientes = await Cliente.find({ _id: { $in: _connectedClientes } });

      socket.emit('clientesOnlineStatus',{onlineClientes:clientes,onlineUsers:users})
      console.log("clientesOnlineStatus",clientes)
      
      clientes.forEach(async(cliente)=>{  
        if(connectedClientes.get(cliente._id.toString())){
          io.to(connectedClientes.get(cliente._id.toString()))
          .emit('userConnected', { userId: socket.userId, isOnline: true, user:user });
          console.log("userConnected",connectedClientes.get(cliente._id.toString()))
        }
      })
     }
      
    }


    socket.on("update_client_profile",async(data)=>{
      console.log("update_client_profile",data)
      const users = await User.find()
      

      if(users.length){

        users.forEach(async(user)=>{
          console.log("user",user)
          const notification = new Notification({
            user_id:user._id,
            message:"El/la cliente "+data.nickname+" ha actualizado su perfil",
            room:null,
            type:"profile_update",
            sender_client_id:data._id,
            link:"/clients/"+data.sqlite_id
          })
          await notification.save()
          user.notification.push(notification._id)
          await user.save()
          console.log(user._id.toString())
          console.log(connectedUsers)
          if(connectedUsers.get(user._id.toString())){
            console.log("user",user.username)
           
            
            io.to(connectedUsers.get(user._id.toString())).emit('newNotification',{
              _id:notification._id,
              message:notification.message,
              type:notification.type,
              link:notification.link,
              sender_client_id:notification.sender_client_id,
              user_id:notification.user_id,
              read:notification.read,

            })
          }
        })
        
      }
    })
    

    socket.on("joinRoom",async(data)=>{
      console.log("joinRoom",data)
      const room = await Room.findOne({_id:data.roomId})
      const user = await User.findOne({_id:socket.userId})
      const client = await Cliente.findOne({_id:socket.clienteId})

      const isUserOrClient = user ? "user" : "client"
      
      if(isUserOrClient === "user"){
        user.isConnected = true
        await user.save()

        if(room){
          room.connected_users.push(socket.userId)
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
      
    });

    socket.on('typing', (data) => {
       console.log('typing event received:', data);
       // const receiverSocketId = connectedUsers.get(data.receiverId.toString());
       // if (receiverSocketId) io.to(receiverSocketId).emit('userTyping', { senderId: socket.clienteId, isTyping: data.isTyping });
    });

    socket.on('disconnect',async () => {
      console.log(`User disconnected: ${socket.id}, ClienteID: ${socket.clienteId || 'Anonymous'}`);
      if (socket.clienteId) {
        connectedUsers.delete(socket.clienteId.toString());
        console.log('Connected clients after disconnect:', Array.from(connectedUsers.keys()));
        const users = await User.find({_id:{$in:Array.from(connectedUsers.keys())}})
        if(users){
          users.forEach(async(user)=>{
            io.to(connectedUsers.get(user._id.toString())).emit('clientDisconnected',{clienteId:socket.clienteId})
          })
        }
        
        //io.emit('userOnlineStatus', { clienteId: socket.clienteId, isOnline: false, onlineUsers: Array.from(connectedUsers.keys()),onlineClientes: Array.from(connectedClientes.keys()) });
      }
      if (socket.userId) {
        connectedUsers.delete(socket.userId.toString());
        console.log('Connected users after disconnect:', Array.from(connectedUsers.keys()));
        io.emit('userDisconnected', { userId: socket.userId, isOnline: false });
      }
    });
  });
}

export function getReceiverSocketId(to,receiverId) {
  if(to === "user"){
    return connectedUsers.get(receiverId.toString());
  }
  if(to === "client"){
    return connectedClientes.get(receiverId.toString());
  }
}

/**
 * Envía una notificación a un usuario específico si está conectado.
 * @param {string} clienteId El ID del cliente que recibirá la notificación.
 * @param {object} notificationData Datos de la notificación (debe coincidir con la interfaz Notification del frontend).
 *                                  Ej: { id: uuidv4(), type: 'info', title: 'Título', message: 'Mensaje', timestamp: new Date().toISOString(), read: false, link?: '/ruta' }
 */


export function sendNotificationToUser(to,id, notificationData) {
  if (!mainIo) { // Usar mainIo, la instancia exportada de index.js
    console.error('Socket.IO server (mainIo) not initialized in socketHandler.');
    return;
  }
  if(to === "user"){
    const socketId = getReceiverSocketId(id);
    if (socketId) {
      console.log(`Sending notification to userId ${id} (socketId ${socketId}):`, notificationData);
    mainIo.to(socketId).emit('newNotification', notificationData);
    } else {
      console.log(`User ${id} no conectado. Notificación no enviada en tiempo real.`);
      // Aquí podrías guardar la notificación en la BD para mostrarla cuando el usuario se conecte,
      // o si ya tienes un sistema de notificaciones persistentes, asegurar que se guarde.
    } 
  }
  if(to === "client"){
    const socketId = getReceiverSocketId(id);
    if (socketId) {
      console.log(`Sending notification to clienteId ${id} (socketId ${socketId}):`, notificationData);
      mainIo.to(socketId).emit('new_notification', notificationData);
    } else {
      console.log(`Cliente ${id} no conectado. Notificación no enviada en tiempo real.`);
    }
  }
} 
/* export function sendNotificationToCiente(clienteId, notificationData) {
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
}  */


//const uri = ;

//pepelepu23
//