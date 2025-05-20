import mongoose from 'mongoose';
import Cliente from '../models/cliente.js';

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

// Función para generar un código de acceso único
function generateAccessCode() {
  // Genera un código de 6 dígitos
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function assignAccessCodes() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Obtener todos los clientes
    const clientes = await Cliente.find({});
    console.log(`Encontrados ${clientes.length} clientes para asignar códigos`);

    // Set para mantener un registro de códigos ya asignados
    const usedCodes = new Set();

    // Asignar códigos a cada cliente
    for (const cliente of clientes) {
      let codigoAcceso;
      do {
        codigoAcceso = generateAccessCode();
      } while (usedCodes.has(codigoAcceso));

      usedCodes.add(codigoAcceso);
      
      // Actualizar el cliente con el nuevo código
      await Cliente.findByIdAndUpdate(cliente._id, {
        codigoAcceso: codigoAcceso
      });

      console.log(`Cliente ${cliente.nickname} actualizado con código: ${codigoAcceso}`);
    }

    console.log('Proceso completado exitosamente');
    await mongoose.connection.close();

  } catch (error) {
    console.error('Error durante la asignación de códigos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
assignAccessCodes(); 