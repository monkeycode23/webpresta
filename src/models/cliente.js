import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const clienteSchema = new mongoose.Schema({
  sqlite_id: {
    type: String, // Or Number, depending on your SQLite ID type
    unique: true,
    sparse: true // Allows multiple documents to have no sqlite_id
  },
  nickname: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  lastname: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    //trim: true
  },
  address: {
    type: String,
    //trim: true
  },
  status: {
    type: String,
    enum: ['activo', 'inactivo', 'pendiente', 'bloqueado'], // Added enum for valid statuses
    default: 'activo'
  },
  gender: {
    type: String,
    trim: true
  },
  birthdate: {
    type: String,
    trim: true
  },
  document_id: {
    type: Number
  },
  cbu: {
    type: String,
    trim: true,
    sparse: true
  },
  aliasCbu: {
    type: String,
    trim: true
  },
  codigoAcceso: {
    type: String,
    trim: true,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isConnected: Boolean,
  loans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestamo'
  }],
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  notification: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }]	
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Pre-save hook para encriptar contraseña
clienteSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
clienteSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Obtener la contraseña incluida
    const cliente = await this.constructor.findById(this._id).select('+password');
    if (!cliente.password) return false;
    
    return await bcrypt.compare(candidatePassword, cliente.password);
  } catch (error) {
    throw error;
  }
};

const Cliente = mongoose.model('Cliente', clienteSchema);

export default Cliente; 