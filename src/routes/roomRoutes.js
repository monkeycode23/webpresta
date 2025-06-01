import { Router } from 'express';
import { 
  getClienteById, 
  getPrestamosCliente, 
  getPagosCliente, 
  getResumenCliente,
  getClienteByDocumento,
  createCliente,
  updateCliente,
  deleteCliente,
  updateClienteProfile
} from '../controllers/clienteController.js';
import { verificarToken, verificarPropietario } from '../middleware/authMiddleware.js';
import Room from '../models/room.js';
const router = Router();
import User from '../models/user.js';
import Message from '../models/message.js';
async function createRoom(req,res){   

   try {
    const {name,description,is_private,owner_id} = req.body

    const owner = await User.findOne({_id:req.userId})
    //const connected_users = await User.find({_id:{$in:connected_users}})
    //const connected_clients = await Cliente.find({_id:{$in:connected_clients}})
    
    console.log("owner",owner)
    const room1 = await Room.findOne({name}).populate('owner').populate('users').populate({path:'messages',model:"Message",populate:{path:'user_sender'}})
    if(room1){
      
        //res.status(200).json({type:"error",message:"La sala ya existe"})
      
        return     res.status(200).json(room1)

      
    }
    
    const room = new Room({name,description,is_private,owner:owner._id})
   
    room.users.push(owner._id)
    await room.save()

    owner.rooms.push(room._id)
    await owner.save()

    res.status(200).json(await Room.findById(room._id).populate('owner').populate('users').populate({path:'messages',populate:{path:'user'}}))


   } catch (error) {
    console.log(error)
    console.log(error.message)
    res.status(200).json({type:"error",message:"Error al crear la sala"})
   }
}

async function updateRoom(req,res){
    const {id} = req.params
    const {name,description,is_private,owner,connected_users,connected_clients} = req.body
    const room = await Room.findByIdAndUpdate(id,{name,description,is_private,owner,connected_users,connected_clients})
    res.status(200).json(room)
}

async function deleteRoom(req,res){
    const {id} = req.params
    await Room.findByIdAndDelete(id)
    res.status(200).json({message:"Room deleted"})
}

async function getRooms(req,res){
    const rooms = await Room.find({owner:req.user._id})
    res.status(200).json(rooms)
}

async function getRoomById(req,res){
    const {id} = req.params
    const room = await Room.findById(id).populate('owner')
    .populate('connected_users')
    .populate('connected_clients')
    .populate('messages')

    if(!room){
        return res.status(404).json({message:"Room not found"})
    }
    if(room.owner.toString() !== req.user._id.toString()){
        return res.status(401).json({message:"You are not the owner of this room"})
    }
    res.status(200).json(room)
}

async function joinRoom(req,res){
    const {id} = req.params
    const {user_id} = req.body
    console.log( "user_id--->",user_id)
    console.log( "id--->",id)
    const room = await Room.findById(id).populate('users')
    console.log( "room--->",room)
    const user = await User.findOne({sqlite_id:user_id})
    console.log( "user--->",user)
    if(!user){
        return res.status(404).json({message:"User not found"})
    }
    if(room.users.some(userRoom => userRoom.sqlite_id === user.sqlite_id)){
        return res.status(200).json({message:"User already in room"})
    }
    room.users.push(user._id)
    await room.save()
    res.status(200).json(room)
}
router.post('/create',verificarToken, createRoom);
router.post('/update/:id',verificarToken, updateRoom);
router.post('/delete/:id', [verificarToken], deleteRoom);
router.post('/join/:id',verificarToken, joinRoom);
// Ruta para obtener cliente por documento de identidad (solo para autenticación)
router.get('/', verificarToken, getRooms);
router.get('/:id', verificarToken, getRoomById);
export default router; 