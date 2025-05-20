import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cliente from '../models/cliente.js';

dotenv.config();

// Función para generar código de acceso único de 5 dígitos
const generarCodigoAcceso = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Función para verificar si un código ya existe
const codigoExiste = async (codigo) => {
  const cliente = await Cliente.findOne({ codigoAcceso: codigo });
  return !!cliente;
};

// Función para generar un código único
const generarCodigoUnico = async () => {
  let codigo;
  do {
    codigo = generarCodigoAcceso();
  } while (await codigoExiste(codigo));
  return codigo;
};

// Función principal para actualizar códigos de acceso
const actualizarCodigosAcceso = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Obtener todos los clientes
    const clientes = await Cliente.find({});
    console.log(`Encontrados ${clientes.length} clientes`);

    // Actualizar cada cliente con un nuevo código de acceso
    for (const cliente of clientes) {
      const nuevoCodigo = await generarCodigoUnico();
      cliente.codigoAcceso = nuevoCodigo;
      await cliente.save();
      console.log(`Cliente ${cliente._id} actualizado con código: ${nuevoCodigo}`);
    }

    console.log('Actualización de códigos de acceso completada');
  } catch (error) {
    console.error('Error durante la actualización:', error);
  } finally {
    // Cerrar la conexión a MongoDB
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
};

// Ejecutar el script
actualizarCodigosAcceso(); 