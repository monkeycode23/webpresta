import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cliente from '../models/cliente.js';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';
//import User from '../models/user.js';
//import { generateAccessCode } from './generate_access_codes.cjs';
// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

// Mapas de conversión para enums
const statusMap = {
  'active': 'En curso',
  'pending': 'Pendiente',
  'approved': 'Aprobado',
  'rejected': 'Rechazado',
  'paid': 'Pagado',
  'expired': 'Vencido',
  'cancelled': 'Cancelado',
  '': 'Pendiente',
  null: 'Pendiente',
  undefined: 'Pendiente'
};
const paymentIntervalMap = {
  'monthly': 'Mensual',
  'weekly': 'Semanal',
  'biweekly': 'Quincenal',
  'daily': 'Diario',
  '': 'Mensual',
  null: 'Mensual',
  undefined: 'Mensual'
};

const pagoStatusMap = {
  'pending': 'Pendiente',
  'processing': 'Procesando',
  'completed': 'Completado',
  'paid': 'Completado',
  'reimbursed': 'Reembolsado',
  'refunded': 'Reembolsado',
  'failed': 'Fallido',
  'cancelled': 'Cancelado',
  'Pagado': 'Completado',
  'Pendiente': 'Pendiente',
  '': 'Pendiente',
  null: 'Pendiente',
  undefined: 'Pendiente'
};

const paymentMethodMap = {
  'cash': 'Efectivo',
  'transfer': 'Transferencia',
  'card': ' Tarjeta',
  'check': 'Cheque',
  'mercadopago': 'Mercado Pago',
  'other': 'Otro',
  '': 'Efectivo',
  null: 'Efectivo',
  undefined: 'Efectivo'
};

function safe(val, def) {
  return val === null || val === undefined ? def : val;
}

async function migrateData() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Limpiar colecciones existentes
    await Cliente.deleteMany({});
    await Prestamo.deleteMany({});
    await Pago.deleteMany({});
    //await User.deleteMany({});
    console.log('Colecciones limpiadas');

    // Conectar a SQLite
    const db = await open({
      filename: './test.db',
      driver: sqlite3.Database
    });
    console.log('Conectado a SQLite');

    // Mapa para almacenar las referencias de IDs
    const idMap = {
      clients: new Map(),
      loans: new Map()
    };

    // Migrar Clientes
    const clients = await db.all('SELECT * FROM clients');
    console.log(`Encontrados ${clients.length} clientes para migrar`);
    console.log('Iniciando migración de clientes...');

    for (const [i, client] of clients.entries()) {
      console.log(`Migrando cliente ${i + 1} de ${clients.length} (ID SQLite: ${client.id})`);
      let codigoAcceso;
      let isUnique = false;
      while (!isUnique) {
        codigoAcceso = String(Math.floor(10000 + Math.random() * 90000));
        const existingClient = await Cliente.findOne({ codigoAcceso });
        if (!existingClient) {
          isUnique = true;
        }
      }

      const clienteData = {
        sqlite_id: String(client.id),
        nickname: safe(client.nickname, ''),
        name: safe(client.name, ''),
        lastname: safe(client.lastname, ''),
        email: safe(client.email, ''),
        phone: safe(client.phone, ''),
        address: safe(client.address, ''),
        status: (client.status && String(client.status).trim() !== '') ? String(client.status).trim() : 'activo',
        gender: safe(client.gender, ''),
        birthdate: safe(client.birthdate, ''),
        document_id: safe(client.document_id, 0),
        alias: safe(client.alias, ''),
        codigoAcceso,
        loans: [],
        created_at: client.created_at,
        updated_at: client.updated_at
      };

      if (client.cbu && String(client.cbu).trim() !== '') {
        clienteData.cbu = String(client.cbu).trim();
      }

      const cliente = new Cliente(clienteData);
      const savedCliente = await cliente.save();
      idMap.clients.set(client.id, savedCliente._id);
      console.log(`Cliente ${savedCliente.nickname} (ID MongoDB: ${savedCliente._id}) migrado exitosamente.`);
    }
    console.log('Clientes migrados exitosamente');

    // Migrar Préstamos
    const loans = await db.all('SELECT * FROM loans');
    console.log(`Encontrados ${loans.length} préstamos para migrar`);
    console.log('Iniciando migración de préstamos...');

    for (const [i, loan] of loans.entries()) {
      console.log(`Migrando préstamo ${i + 1} de ${loans.length} (ID SQLite: ${loan.id})`);
      const installmentNumber = safe(loan.installment_number, 1);
      const prestamo = new Prestamo({
        sqlite_id: String(loan.id),
        label: safe(loan.label, ''),
        client_id: idMap.clients.get(loan.client_id),
        amount: safe(loan.amount, 0),
        gain: safe(loan.gain, 0),
        installment_number: installmentNumber < 1 ? 1 : installmentNumber,
        total_amount: safe(loan.total_amount, 0),
        loan_date: safe(loan.loan_date, new Date()),
        generate_payments_date: safe(loan.generate_payments_date, new Date()),
        interest_rate: safe(loan.interest_rate, 0),
        term: safe(loan.term, 1),
        status: statusMap[loan.status] || 'Pendiente',
        payment_interval: paymentIntervalMap[loan.payment_interval] || 'Mensual',
        total_paid: safe(loan.total_paid, 0),
        remaining_amount: safe(loan.remaining_amount, loan.amount || 0),
        next_payment_date: safe(loan.next_payment_date, null),
        last_payment_date: safe(loan.last_payment_date, null),
        payment_due_day: safe(loan.payment_due_day, null),
        late_fee_rate: safe(loan.late_fee_rate, 0),
        late_fee_amount: safe(loan.late_fee_amount, 0),
        notes: safe(loan.notes, ''),
        payments: [],
        created_at: loan.created_at,
        updated_at: loan.updated_at,
      });
      const savedPrestamo = await prestamo.save();
      idMap.loans.set(loan.id, savedPrestamo._id);
      console.log(`Préstamo ${savedPrestamo.label} (ID MongoDB: ${savedPrestamo._id}) migrado exitosamente.`);

      // Actualizar el cliente con la referencia al préstamo
      console.log(`Actualizando cliente ${idMap.clients.get(loan.client_id)} con préstamo ${savedPrestamo._id}`);
      await Cliente.findByIdAndUpdate(
        idMap.clients.get(loan.client_id),
        { $push: { loans: savedPrestamo._id } }
      );
    }
    console.log('Préstamos migrados exitosamente');

    // Migrar Pagos
    const payments = await db.all('SELECT * FROM payments');
    console.log(`Encontrados ${payments.length} pagos para migrar`);
    console.log('Iniciando migración de pagos...');

    for (const [i, payment] of payments.entries()) {
      console.log(`Migrando pago ${i + 1} de ${payments.length} (ID SQLite: ${payment.id})`);
      const installmentNumber = safe(payment.installment_number, 1);
      const pago = new Pago({
        sqlite_id: String(payment.id),
        label: safe(payment.label, ''),
        loan_id: idMap.loans.get(payment.loan_id),
        gain: safe(payment.gain, 0),
        total_amount: safe(payment.total_amount, 0),
        payment_date: safe(payment.payment_date, new Date()),
        net_amount: safe(payment.net_amount, 0),
        amount: safe(payment.amount, 0),
        status: pagoStatusMap[payment.status] || 'Pendiente',
        paid_date: safe(payment.paid_date, null),
        incomplete_amount: safe(payment.incomplete_amount, 0),
        payment_method: paymentMethodMap[payment.payment_method] || 'Efectivo',
        due_date: safe(payment.due_date, payment.payment_date || new Date()),
        installment_number: installmentNumber < 1 ? 1 : installmentNumber,
        late_fee: safe(payment.late_fee, 0),
        late_days: safe(payment.late_days, 0),
        receipt_number: safe(payment.receipt_number, ''),
        transaction_id: safe(payment.transaction_id, ''),
        notes: safe(payment.notes, ''),
        created_at: payment.created_at,
        updated_at: payment.updated_at
      });
      const savedPago = await pago.save();
      console.log(`Pago ${savedPago.label || savedPago._id} (ID MongoDB: ${savedPago._id}) migrado exitosamente.`);

      // Actualizar el préstamo con la referencia al pago
      const currentLoanForPayment = await Prestamo.findById(idMap.loans.get(payment.loan_id));
      console.log(`Actualizando préstamo ${idMap.loans.get(payment.loan_id)} con pago ${savedPago._id}`);

      if (currentLoanForPayment) {
        await Prestamo.findByIdAndUpdate(
          idMap.loans.get(payment.loan_id),
          { 
            $addToSet: { payments: savedPago._id },
            $inc: { total_paid: safe(payment.amount, 0) },
            $set: { 
              last_payment_date: payment.payment_date || new Date(),
              remaining_amount: Math.max(0, safe(payment.remaining_amount, (safe(currentLoanForPayment.total_amount,0) - (safe(currentLoanForPayment.total_paid,0) + safe(payment.amount,0))))) 
            }
          }
        );
      } else {
        console.warn(`Préstamo con ID de SQLite ${payment.loan_id} no encontrado en MongoDB para el pago ${payment.id}. No se actualizó el préstamo.`);
      }
    }
    console.log('Pagos migrados exitosamente');

    // Aquí puedes agregar la migración de Usuarios si es necesario
    // const users = await db.all('SELECT * FROM users'); // O el nombre de tu tabla de usuarios en SQLite
    // console.log(`Encontrados ${users.length} usuarios para migrar`);
    // for (const user of users) {
    //   const newUser = new User({
    //     sqlite_id: String(user.id), // Asume que la PK en SQLite es 'id'
    //     username: safe(user.username, ''),
    //     email: safe(user.email, ''),
    //     // Mapea otros campos necesarios
    //     // No migres contraseñas directamente si están hasheadas de forma diferente
    //     // Considera establecer una contraseña temporal o nula y forzar el reseteo
    //     created_at: user.created_at,
    //     updated_at: user.updated_at
    //   });
    //   await newUser.save();
    // }
    // console.log('Usuarios migrados exitosamente');

    // Cerrar conexiones
    console.log('Cerrando conexión con SQLite...');
    await db.close();
    console.log('Conexión con SQLite cerrada.');
    console.log('Cerrando conexión con MongoDB...');
    await mongoose.disconnect();
    console.log('Conexión con MongoDB cerrada.');
    console.log('Migración de datos completada exitosamente!');

  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1); // Salir con código de error
  }
}

// Ejecutar la migración
migrateData(); 