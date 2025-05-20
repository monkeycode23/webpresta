const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

export function generateAccessCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

async function generateAccessCodes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');
    const clientes = await mongoose.connection.db.collection('clientes').find({}).toArray();
    for (const cliente of clientes) {
      const codigoAcceso = generateAccessCode();
      await mongoose.connection.db.collection('clientes').updateOne({ _id: cliente._id }, { $set: { codigoAcceso } });
    }
    console.log('Códigos de acceso generados para', clientes.length, 'clientes.');
  } catch (error) {
    console.error('Error al generar códigos de acceso:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

//generateAccessCodes(); 