import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';

// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

async function updateExpiredPayments() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Obtener la fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer a inicio del día

    // Encontrar todos los pagos que:
    // 1. Tienen fecha de pago anterior a hoy
    // 2. No están completados
    const expiredPayments = await Pago.find({
      payment_date: { $lt: today },
      status: { $nin: ['Completado', 'Vencido'] }
    });

    console.log(`Encontrados ${expiredPayments.length} pagos vencidos para actualizar`);

    let updatedPayments = 0;
    let updatedLoans = 0;
    const updatedLoanIds = new Set();

    // Actualizar cada pago vencido
    for (const pago of expiredPayments) {
      // Actualizar el estado del pago a Vencido
      await Pago.findByIdAndUpdate(
        pago._id,
        { 
          $set: { 
            status: 'Vencido',
            updated_at: new Date()
          }
        }
      );
      updatedPayments++;

      // Si el pago está asociado a un préstamo, actualizar el estado del préstamo
      if (pago.loan && !updatedLoanIds.has(pago.loan.toString())) {
        await Prestamo.findByIdAndUpdate(
          pago.loan,
          { 
            $set: { 
              status: 'Vencido',
              updated_at: new Date()
            }
          }
        );
        updatedLoanIds.add(pago.loan.toString());
        updatedLoans++;
      }

      // Mostrar progreso cada 100 pagos
      if (updatedPayments % 100 === 0) {
        console.log(`Procesados ${updatedPayments} pagos...`);
      }
    }

    console.log('\nResumen:');
    console.log(`Total de pagos actualizados: ${updatedPayments}`);
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
updateExpiredPayments(); 