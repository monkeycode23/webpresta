const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

async function dropIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');
    try {
      const resultEmail = await mongoose.connection.db.collection('clientes').dropIndex('email_1');
      console.log('Índice email_1 eliminado:', resultEmail);
    } catch (e) {
      console.log('Índice email_1 no existe o ya fue eliminado.');
    }
    try {
      const resultDoc = await mongoose.connection.db.collection('clientes').dropIndex('documentoIdentidad_1');
      console.log('Índice documentoIdentidad_1 eliminado:', resultDoc);
    } catch (e) {
      console.log('Índice documentoIdentidad_1 no existe o ya fue eliminado.');
    }
  } catch (error) {
    console.error('Error al eliminar los índices:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

dropIndexes(); 