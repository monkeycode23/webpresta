const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

async function deleteEmptyNickname() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');
    const result = await mongoose.connection.db.collection('clientes').deleteMany({ $or: [{ nickname: { $exists: false } }, { nickname: '' }] });
    console.log('Documentos eliminados:', result.deletedCount);
  } catch (error) {
    console.error('Error al eliminar documentos:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

deleteEmptyNickname(); 