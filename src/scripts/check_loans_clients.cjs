const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

async function checkLoansClients() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');
    const prestamos = await mongoose.connection.db.collection('prestamos').find({}).toArray();
    let validCount = 0;
    let invalidCount = 0;
    for (const prestamo of prestamos) {
      const cliente = await mongoose.connection.db.collection('clientes').findOne({ _id: prestamo.cliente });
      if (cliente) {
        validCount++;
      } else {
        invalidCount++;
      }
    }
    console.log('Préstamos con cliente válido:', validCount);
    console.log('Préstamos sin cliente válido:', invalidCount);
  } catch (error) {
    console.error('Error al comprobar préstamos:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkLoansClients(); 