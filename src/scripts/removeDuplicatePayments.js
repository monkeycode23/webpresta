import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prestamo from '../models/prestamo.js';

// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

async function removeDuplicatePayments() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Obtener todos los préstamos
    const prestamos = await Prestamo.find({});
    console.log(`Encontrados ${prestamos.length} préstamos para procesar`);

    let totalDuplicatesRemoved = 0;
    let processedLoans = 0;

    // Procesar cada préstamo
    for (const prestamo of prestamos) {
      const originalLength = prestamo.payments.length;
      
      // Usar Set para eliminar duplicados
      const uniquePayments = [...new Set(prestamo.payments.map(p => p.toString()))];
      
      const duplicatesRemoved = originalLength - uniquePayments.length;
      totalDuplicatesRemoved += duplicatesRemoved;

      if (duplicatesRemoved > 0) {
        // Actualizar el préstamo con los pagos únicos
        await Prestamo.findByIdAndUpdate(
          prestamo._id,
          { $set: { payments: uniquePayments } }
        );
        console.log(`Préstamo ${prestamo._id}: Eliminados ${duplicatesRemoved} pagos duplicados`);
      }

      processedLoans++;
      if (processedLoans % 100 === 0) {
        console.log(`Procesados ${processedLoans} préstamos...`);
      }
    }

    console.log('\nResumen:');
    console.log(`Total de préstamos procesados: ${processedLoans}`);
    console.log(`Total de pagos duplicados eliminados: ${totalDuplicatesRemoved}`);

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Proceso completado exitosamente');

  } catch (error) {
    console.error('Error durante el proceso:', error);
    process.exit(1);
  }
}

// Ejecutar el script
removeDuplicatePayments(); 