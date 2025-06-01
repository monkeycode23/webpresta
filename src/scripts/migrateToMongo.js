import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cliente from '../models/cliente.js';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';
//import User from '../models/user.js';
//import { generateAccessCode } from './generate_access_codes.cjs';

dotenv.config();

const MONGODB_URI = 'mongodb://localhost:27017/prestaweb';

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
    console.log('Iniciando migración...');
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Limpiar colecciones existentes
    await Cliente.deleteMany({});
    await Prestamo.deleteMany({});
    await Pago.deleteMany({});
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

    for (const [i, client] of clients.entries()) {
      let codigoAcceso;
      let isUnique = false;
      while (!isUnique) {
        codigoAcceso = String(Math.floor(10000 + Math.random() * 90000));
        const existingClient = await Cliente.findOne({ codigoAcceso });
        if (!existingClient) {
          isUnique = true;
        }
      }

      const cliente = new Cliente({
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
        cbu: safe(client.cbu, ''+i),
        alias: safe(client.alias, ''),
        codigoAcceso,
        loans: [],
        created_at: client.created_at,
        updated_at: client.updated_at
      });

      const savedCliente = await cliente.save();
      idMap.clients.set(client.id, savedCliente._id);

      if ((i + 1) % 50 === 0 || i === clients.length - 1) {
        console.log(`Migrados ${i + 1} / ${clients.length} clientes`);
      }
    }
    console.log('Clientes migrados exitosamente');

    // Migrar Préstamos
    const loans = await db.all('SELECT * FROM loans');
    console.log(`Encontrados ${loans.length} préstamos para migrar`);

    for (const [i, loan] of loans.entries()) {
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
        updated_at: loan.updated_at
      });

      const savedPrestamo = await prestamo.save();
      idMap.loans.set(loan.id, savedPrestamo._id);

      // Actualizar el cliente con la referencia al préstamo
      await Cliente.findByIdAndUpdate(
        idMap.clients.get(loan.client_id),
        { $push: { loans: savedPrestamo._id } }
      );

      if ((i + 1) % 50 === 0 || i === loans.length - 1) {
        console.log(`Migrados ${i + 1} / ${loans.length} préstamos`);
      }
    }
    console.log('Préstamos migrados exitosamente');

    // Migrar Pagos
    const payments = await db.all('SELECT * FROM payments');
    console.log(`Encontrados ${payments.length} pagos para migrar`);

    for (const [i, payment] of payments.entries()) {
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

      // Actualizar el préstamo con la referencia al pago
      const currentLoanForPayment = await Prestamo.findById(idMap.loans.get(payment.loan_id));

      if (currentLoanForPayment) {
        await Prestamo.findByIdAndUpdate(
          idMap.loans.get(payment.loan_id),
          { 
            $addToSet: { payments: savedPago._id },
            $inc: { total_paid: safe(payment.amount, 0) },
            $set: { 
              last_payment_date: payment.payment_date || new Date(),
              remaining_amount: Math.max(0, safe(payment.remaining_amount, (safe(currentLoanForPayment.total_amount,0) - (safe(currentLoanForPayment.total_paid,0) + safe(payment.amount,0)))) )
            }
          }
        );
      } else {
        console.warn(`⚠️ Préstamo con SQLite ID ${payment.loan_id} no encontrado para el pago ID ${payment.id}`);
      }

      if ((i + 1) % 50 === 0 || i === payments.length - 1) {
        console.log(`Migrados ${i + 1} / ${payments.length} pagos`);
      }
    }
    console.log('Pagos migrados exitosamente');

    // Cerrar conexiones
    await db.close();
    await mongoose.connection.close();
    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

migrateData();
