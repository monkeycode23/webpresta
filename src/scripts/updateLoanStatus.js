import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';

// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

async function updateLoanStatus() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Obtener todos los préstamos
    const prestamos = await Prestamo.find({}).populate('payments');
    console.log(`Encontrados ${prestamos.length} préstamos para procesar`);

    let updatedLoans = 0;
    let processedLoans = 0;

    // Procesar cada préstamo
    for (const prestamo of prestamos) {
      // Verificar si hay pagos pendientes
      const hasPendingPayments = prestamo.payments.some(pago => 
        pago.status === 'Pendiente' || pago.status === 'Procesando'
      );

      // Si hay pagos pendientes y el préstamo no está en estado Pendiente, actualizarlo
      if (hasPendingPayments && prestamo.status !== 'Pendiente') {
        await Prestamo.findByIdAndUpdate(
          prestamo._id,
          { $set: { status: 'Pendiente' } }
        );
        console.log(`Préstamo ${prestamo._id}: Actualizado a Pendiente`);
        updatedLoans++;
      }

      processedLoans++;
      if (processedLoans % 100 === 0) {
        console.log(`Procesados ${processedLoans} préstamos...`);
      }
    }

    console.log('\nResumen:');
    console.log(`Total de préstamos procesados: ${processedLoans}`);
    console.log(`Total de préstamos actualizados: ${updatedLoans}`);

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Proceso completado exitosamente');

  } catch (error) {
    console.error('Error durante el proceso:', error);
    process.exit(1);
  }
}

// Ejecutar el script
updateLoanStatus(); 