import mongoose from 'mongoose';
import Cliente from '../models/cliente.js';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';
import bcrypt from 'bcrypt';

// Conectar a MongoDB con opciones mejoradas
mongoose.connect('mongodb://127.0.0.1:27017/prestaweb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Conectado a MongoDB');
  return crearDatosPrueba();
})
.catch(err => {
  console.error('Error al conectar a MongoDB:', err);
  process.exit(1);
});

const crearDatosPrueba = async () => {
  try {
    // Limpiar datos existentes
    console.log('Limpiando datos existentes...');
    await Cliente.deleteMany({});
    await Prestamo.deleteMany({});
    await Pago.deleteMany({});
    console.log('Datos existentes eliminados');

    // Crear cliente de prueba
    console.log('Creando cliente de prueba...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);
    
    const clienteData = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@ejemplo.com',
      telefono: '1234567890',
      direccion: 'Calle Principal 123',
      ciudad: 'Ciudad Ejemplo',
      estado: 'Estado Ejemplo',
      codigoPostal: '12345',
      documentoIdentidad: '12345678',
      tipoDocumento: 'DNI',
      password: passwordHash,
      activo: true
    };

    console.log('Datos del cliente a crear:', clienteData);
    
    const cliente = new Cliente(clienteData);
    console.log('Instancia de cliente creada');

    try {
      const clienteGuardado = await cliente.save();
      console.log('Cliente guardado exitosamente:', clienteGuardado._id);
    } catch (saveError) {
      console.error('Error al guardar el cliente:', saveError);
      if (saveError.code === 11000) {
        console.log('Error de duplicado. Intentando actualizar el cliente existente...');
        const clienteActualizado = await Cliente.findOneAndUpdate(
          { documentoIdentidad: clienteData.documentoIdentidad },
          clienteData,
          { new: true }
        );
        console.log('Cliente actualizado:', clienteActualizado._id);
        return clienteActualizado;
      }
      throw saveError;
    }

    // Verificar que el cliente existe
    const clienteVerificado = await Cliente.findOne({ documentoIdentidad: '12345678' });
    if (!clienteVerificado) {
      throw new Error('El cliente no se guardó correctamente');
    }
    console.log('Cliente verificado:', clienteVerificado._id);

    // Crear préstamos de prueba
    console.log('Creando préstamos...');
    const prestamos = [
      {
        cliente: clienteVerificado._id,
        monto: 5000000,
        tasaInteres: 12.5,
        plazo: 12,
        fechaDesembolso: new Date(),
        fechaVencimiento: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
        estado: 'En curso',
        montoCuota: 445333,
        totalPagado: 1335999,
        numeroCuotas: 12,
        cuotasPagadas: 3,
        proposito: 'Remodelación de casa',
        garantia: 'Vehículo',
        observaciones: 'Cliente puntual'
      },
      {
        cliente: clienteVerificado._id,
        monto: 3000000,
        tasaInteres: 10.5,
        plazo: 6,
        fechaDesembolso: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
        fechaVencimiento: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000),
        estado: 'En curso',
        montoCuota: 525000,
        totalPagado: 1050000,
        numeroCuotas: 6,
        cuotasPagadas: 2,
        proposito: 'Compra de electrodomésticos',
        garantia: 'Salario',
        observaciones: 'Cliente con buen historial'
      },
      {
        cliente: clienteVerificado._id,
        monto: 10000000,
        tasaInteres: 15.0,
        plazo: 24,
        fechaDesembolso: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
        fechaVencimiento: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
        estado: 'Pagado',
        montoCuota: 483333,
        totalPagado: 10000000,
        numeroCuotas: 24,
        cuotasPagadas: 24,
        proposito: 'Compra de vehículo',
        garantia: 'Vehículo',
        observaciones: 'Préstamo completado exitosamente'
      }
    ];

    const prestamosGuardados = await Prestamo.insertMany(prestamos);
    console.log('Préstamos creados:', prestamosGuardados.length);

    // Crear algunos pagos de prueba para el primer préstamo
    console.log('Creando pagos...');
    const pagos = [
      {
        prestamo: prestamosGuardados[0]._id,
        cliente: clienteVerificado._id,
        monto: 445333,
        fechaPago: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
        numeroCuota: 1,
        metodoPago: 'Transferencia',
        estado: 'Completado',
        comentarios: 'Pago a tiempo'
      },
      {
        prestamo: prestamosGuardados[0]._id,
        cliente: clienteVerificado._id,
        monto: 445333,
        fechaPago: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000),
        numeroCuota: 2,
        metodoPago: 'Efectivo',
        estado: 'Completado',
        comentarios: 'Pago en ventanilla'
      },
      {
        prestamo: prestamosGuardados[0]._id,
        cliente: clienteVerificado._id,
        monto: 445333,
        fechaPago: new Date(),
        numeroCuota: 3,
        metodoPago: 'Transferencia',
        estado: 'Completado',
        comentarios: 'Pago a tiempo'
      }
    ];

    const pagosGuardados = await Pago.insertMany(pagos);
    console.log('Pagos creados:', pagosGuardados.length);

    // Verificación final
    const clienteFinal = await Cliente.findOne({ documentoIdentidad: '12345678' });
    console.log('Verificación final - Cliente:', clienteFinal ? 'Existe' : 'No existe');
    
    const prestamosFinal = await Prestamo.find({ cliente: clienteVerificado._id });
    console.log('Verificación final - Préstamos:', prestamosFinal.length);
    
    const pagosFinal = await Pago.find({ cliente: clienteVerificado._id });
    console.log('Verificación final - Pagos:', pagosFinal.length);

    console.log('Datos de prueba creados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear datos de prueba:', error);
    process.exit(1);
  }
}; 