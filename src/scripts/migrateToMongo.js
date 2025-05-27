import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cliente from '../models/cliente.js';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';
//import User from '../models/user.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';
const PAYMENT_CHUNK_SIZE = 10000; // Process 10,000 payments at a time

// Mapas de conversión para enums (tus mapas existentes)
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

// Helper to generate unique access codes in batch (less efficient for huge numbers but ok for clients)
async function generateUniqueAccessCodes(count) {
  const codes = new Set();
  while (codes.size < count) {
    codes.add(String(Math.floor(10000 + Math.random() * 90000)));
  }
  // Further check against DB if necessary, but for initial migration this might be acceptable
  // or handle duplicate errors during insertMany if the DB has a unique index.
  return Array.from(codes);
}


async function migrateData() {
  let db;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    await Cliente.deleteMany({});
    await Prestamo.deleteMany({});
    await Pago.deleteMany({});
    //await User.deleteMany({});
    console.log('Colecciones limpiadas');

    db = await open({
      filename: './test.db',
      driver: sqlite3.Database
    });
    console.log('Conectado a SQLite');

    const idMap = {
      clients: new Map(), // sqlite_id -> mongo_id
      loans: new Map()    // sqlite_id -> mongo_id
    };
    const prestamoDetailsMap = new Map(); // mongo_loan_id -> { total_amount: X, client_mongo_id: Y }

    // 1. Migrar Clientes
    console.log('Iniciando migración de Clientes...');
    const sqliteClients = await db.all('SELECT * FROM clients');
    console.log(`Encontrados ${sqliteClients.length} clientes para migrar`);

    if (sqliteClients.length > 0) {
      const uniqueAccessCodes = await generateUniqueAccessCodes(sqliteClients.length);
      const clienteDataArray = sqliteClients.map((client, index) => ({
        sqlite_id: String(client.id),
        nickname: safe(client.nickname, ''),
        name: safe(client.name, ''),
        lastname: safe(client.lastname, ''),
        email: safe(client.email, ''),
        phone: safe(client.phone, ''),
        address: safe(client.address, ''),
        status: (client.status && String(client.status).trim() !== '') ? String(client.status).trim() : 'activo',
        gender: safe(client.gender, ''),
        birthdate: safe(client.birthdate, null),
        document_id: safe(client.document_id, ''), // Changed default from 0 to empty string
        cbu: safe(client.cbu, ''),
        alias: safe(client.alias, ''),
        codigoAcceso: uniqueAccessCodes[index], // Assign pre-generated unique code
        loans: [], // Will be populated later
        created_at: client.created_at ? new Date(client.created_at) : new Date(),
        updated_at: client.updated_at ? new Date(client.updated_at) : new Date()
      }));
      
      const insertedClientes = await Cliente.insertMany(clienteDataArray, { ordered: false }); // ordered:false to attempt all inserts
      insertedClientes.forEach(c => {
        if (c && c.sqlite_id) idMap.clients.set(Number(c.sqlite_id), c._id);
      });
      console.log(`${insertedClientes.length} Clientes migrados exitosamente (algunos podrían haber fallado si ordered:false).`);
    }

    // 2. Migrar Préstamos
    console.log('Iniciando migración de Préstamos...');
    const sqliteLoans = await db.all('SELECT * FROM loans');
    console.log(`Encontrados ${sqliteLoans.length} préstamos para migrar`);

    if (sqliteLoans.length > 0) {
      const prestamoDataArray = sqliteLoans.map(loan => {
        const clientMongoId = idMap.clients.get(loan.client_id);
        if (!clientMongoId) {
          console.warn(`Cliente con ID de SQLite ${loan.client_id} no encontrado en MongoDB para el préstamo ${loan.id}. Saltando préstamo.`);
          return null; // Skip this loan
        }
        const installmentNumber = safe(loan.installment_number, 1);
        const initialAmount = safe(loan.amount, 0);
        const totalAmount = safe(loan.total_amount, initialAmount); // Default total_amount to amount if not present

        return {
          sqlite_id: String(loan.id),
          label: safe(loan.label, ''),
          client_id: clientMongoId,
          amount: initialAmount,
          gain: safe(loan.gain, 0),
          installment_number: installmentNumber < 1 ? 1 : installmentNumber,
          total_amount: totalAmount,
          loan_date: loan.loan_date ? new Date(loan.loan_date) : new Date(),
          generate_payments_date: loan.generate_payments_date ? new Date(loan.generate_payments_date) : new Date(),
          interest_rate: safe(loan.interest_rate, 0),
          term: safe(loan.term, 1),
          status: statusMap[loan.status] || 'Pendiente',
          payment_interval: paymentIntervalMap[loan.payment_interval] || 'Mensual',
          total_paid: 0, // Will be calculated from payments
          remaining_amount: totalAmount, // Initial remaining is total_amount
          next_payment_date: loan.next_payment_date ? new Date(loan.next_payment_date) : null,
          last_payment_date: null, // Will be set from payments
          payment_due_day: safe(loan.payment_due_day, null),
          late_fee_rate: safe(loan.late_fee_rate, 0),
          late_fee_amount: safe(loan.late_fee_amount, 0),
          notes: safe(loan.notes, ''),
          payments: [], // Will be populated later
          created_at: loan.created_at ? new Date(loan.created_at) : new Date(),
          updated_at: loan.updated_at ? new Date(loan.updated_at) : new Date()
        };
      }).filter(p => p !== null); // Remove nulls for skipped loans

      const insertedPrestamos = await Prestamo.insertMany(prestamoDataArray, { ordered: false });
      insertedPrestamos.forEach(p => {
        if (p && p.sqlite_id) {
            idMap.loans.set(Number(p.sqlite_id), p._id);
            prestamoDetailsMap.set(p._id.toString(), { total_amount: p.total_amount, client_mongo_id: p.client_id.toString() });
        }
      });
      console.log(`${insertedPrestamos.length} Préstamos migrados exitosamente.`);
    }

    // 3. Actualizar Clientes con IDs de Préstamos (bulkWrite)
    console.log('Actualizando Clientes con referencias de Préstamos...');
    const clientLoanReferences = {}; // mongo_client_id -> [mongo_loan_id, ...]
    idMap.loans.forEach((mongoLoanId, sqliteLoanId) => {
        const sqliteLoan = sqliteLoans.find(sl => Number(sl.id) === sqliteLoanId);
        if (sqliteLoan) {
            const mongoClientId = idMap.clients.get(sqliteLoan.client_id);
            if (mongoClientId) {
                if (!clientLoanReferences[mongoClientId]) clientLoanReferences[mongoClientId] = [];
                clientLoanReferences[mongoClientId].push(mongoLoanId);
            }
        }
    });

    const clientUpdateOps = Object.entries(clientLoanReferences).map(([clientId, loanIds]) => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(clientId) },
            update: { $set: { loans: loanIds } }
        }
    }));

    if (clientUpdateOps.length > 0) {
        const clientUpdateResult = await Cliente.bulkWrite(clientUpdateOps);
        console.log(`Clientes actualizados con préstamos: ${clientUpdateResult.modifiedCount}`);
    }

    // 4. Migrar Pagos en Chunks y Agregar Datos de Préstamos
    console.log('Iniciando migración de Pagos en chunks...');
    let paymentOffset = 0;
    let totalPagosMigrados = 0;
    const loanAggregates = new Map(); // mongo_loan_id -> { total_paid_increment: 0, last_payment_date: null, payment_mongo_ids: [] }

    // Initialize aggregates for all migrated loans
    idMap.loans.forEach(mongoLoanId => {
        loanAggregates.set(mongoLoanId.toString(), { 
            total_paid_increment: 0, 
            last_payment_date: null, 
            payment_mongo_ids: [] 
        });
    });

    while (true) {
      const sqlitePaymentsChunk = await db.all('SELECT * FROM payments ORDER BY loan_id, id LIMIT ? OFFSET ?', [PAYMENT_CHUNK_SIZE, paymentOffset]);
      if (sqlitePaymentsChunk.length === 0) {
        break; // No more payments
      }
      console.log(`Procesando chunk de ${sqlitePaymentsChunk.length} pagos, offset: ${paymentOffset}`);

      const pagoDataArray = sqlitePaymentsChunk.map(payment => {
        const loanMongoId = idMap.loans.get(payment.loan_id);
        if (!loanMongoId) {
          console.warn(`Préstamo con ID de SQLite ${payment.loan_id} no encontrado para el pago ${payment.id}. Saltando pago.`);
          return null;
        }
        const installmentNumber = safe(payment.installment_number, 1);
        return {
          sqlite_id: String(payment.id),
          label: safe(payment.label, ''),
          loan_id: loanMongoId,
          gain: safe(payment.gain, 0),
          total_amount: safe(payment.total_amount, 0),
          payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date(),
          net_amount: safe(payment.net_amount, 0),
          amount: safe(payment.amount, 0),
          status: pagoStatusMap[payment.status] || 'Pendiente',
          paid_date: payment.paid_date ? new Date(payment.paid_date) : null,
          incomplete_amount: safe(payment.incomplete_amount, 0),
          payment_method: paymentMethodMap[payment.payment_method] || 'Efectivo',
          due_date: payment.due_date ? new Date(payment.due_date) : (payment.payment_date ? new Date(payment.payment_date) : new Date()),
          installment_number: installmentNumber < 1 ? 1 : installmentNumber,
          late_fee: safe(payment.late_fee, 0),
          late_days: safe(payment.late_days, 0),
          receipt_number: safe(payment.receipt_number, ''),
          transaction_id: safe(payment.transaction_id, ''),
          notes: safe(payment.notes, ''),
          created_at: payment.created_at ? new Date(payment.created_at) : new Date(),
          updated_at: payment.updated_at ? new Date(payment.updated_at) : new Date()
        };
      }).filter(p => p !== null);

      if (pagoDataArray.length > 0) {
        const insertedPagosChunk = await Pago.insertMany(pagoDataArray, { ordered: false, lean: true });
        totalPagosMigrados += insertedPagosChunk.length;
        console.log(`${insertedPagosChunk.length} pagos insertados en este chunk.`);

        insertedPagosChunk.forEach(pago => {
            if (pago && pago.loan_id) { // Ensure pago and pago.loan_id exist
                const loanIdStr = pago.loan_id.toString();
                const aggregate = loanAggregates.get(loanIdStr);
                if (aggregate) {
                    aggregate.payment_mongo_ids.push(pago._id);
                    aggregate.total_paid_increment += pago.amount;
                    if (pago.paid_date) {
                        const paymentDate = new Date(pago.paid_date);
                        if (!aggregate.last_payment_date || paymentDate > new Date(aggregate.last_payment_date)) {
                            aggregate.last_payment_date = paymentDate;
                        }
                    }
                } else {
                    // This case should ideally not happen if all loans were initialized in loanAggregates
                    console.warn(`No se encontró el agregado para el préstamo ID: ${loanIdStr} del pago ID: ${pago._id}`);
                }
            }
        });
      }
      paymentOffset += PAYMENT_CHUNK_SIZE;
    }
    console.log(`Total de ${totalPagosMigrados} Pagos migrados exitosamente.`);

    // 5. Actualizar Préstamos con datos agregados de Pagos (bulkWrite)
    console.log('Actualizando Préstamos con datos agregados de Pagos...');
    const prestamoUpdateOps = [];
    for (const [loanMongoIdStr, aggregate] of loanAggregates.entries()) {
        const details = prestamoDetailsMap.get(loanMongoIdStr);
        if (!details) {
            console.warn(`Detalles no encontrados para el préstamo ID: ${loanMongoIdStr} al actualizar. Saltando.`);
            continue;
        }
        const totalAmount = details.total_amount;
        const calculatedRemainingAmount = Math.max(0, totalAmount - aggregate.total_paid_increment);

        prestamoUpdateOps.push({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(loanMongoIdStr) },
                update: {
                    $set: {
                        payments: aggregate.payment_mongo_ids,
                        total_paid: aggregate.total_paid_increment,
                        last_payment_date: aggregate.last_payment_date,
                        remaining_amount: calculatedRemainingAmount
                    }
                }
            }
        });
    }
    
    if (prestamoUpdateOps.length > 0) {
        const prestamoUpdateResult = await Prestamo.bulkWrite(prestamoUpdateOps);
        console.log(`Préstamos actualizados con agregados de pagos: ${prestamoUpdateResult.modifiedCount}`);
    }

    // Aquí puedes agregar la migración de Usuarios si es necesario (considera batching también)

    console.log('Migración completada exitosamente');

  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
      console.log('Conexión SQLite cerrada');
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Conexión MongoDB cerrada');
    }
  }
}

migrateData();
