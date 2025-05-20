import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

// Esquemas de MongoDB
const ClienteSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: String,
  codigoAcceso: String,
  status: String
});

const PrestamoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  monto: Number,
  tasaInteres: Number,
  plazo: Number,
  fechaDesembolso: Date,
  fechaVencimiento: Date,
  estado: String,
  montoCuota: Number,
  totalPagado: Number,
  montoRestante: Number,
  numeroCuotas: Number,
  cuotasPagadas: Number,
  cuotasRestantes: Number,
  proposito: String,
  garantia: String,
  observaciones: String
});

const PagoSchema = new mongoose.Schema({
  prestamo: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestamo' },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  monto: Number,
  fechaPago: Date,
  numeroCuota: Number,
  metodoPago: String,
  comprobante: String,
  estado: String,
  comentarios: String
});

// Modelos de MongoDB
const Cliente = mongoose.model('Cliente', ClienteSchema);
const Prestamo = mongoose.model('Prestamo', PrestamoSchema);
const Pago = mongoose.model('Pago', PagoSchema);

// Función para obtener información de las tablas
async function getTableInfo(db, tableName) {
  try {
    const info = await db.all(`PRAGMA table_info(${tableName})`);
    console.log(`\nEstructura de la tabla ${tableName}:`);
    info.forEach(column => {
      console.log(`${column.name} (${column.type})`);
    });
    return info;
  } catch (error) {
    console.error(`Error al obtener información de la tabla ${tableName}:`, error);
    return null;
  }
}

async function migrateData() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Conectar a SQLite
    const db = await open({
      filename: path.join(__dirname, '../../test.db'),
      driver: sqlite3.Database
    });
    console.log('Conectado a SQLite');

    // Obtener información de las tablas
    await getTableInfo(db, 'clients');
    await getTableInfo(db, 'loans');
    await getTableInfo(db, 'payments');

    // Migrar clientes y crear un mapa de IDs
    console.log('\nMigrando clientes...');
    const clients = await db.all('SELECT * FROM clients');
    console.log(`Encontrados ${clients.length} clientes para migrar`);
    const clientIdMap = new Map(); // id SQLite -> _id MongoDB

    for (const client of clients) {
      const cliente = new Cliente({
        nombre: client.nickname || '',
        apellido: '',
        email: client.email || '',
        codigoAcceso: client.nickname || '',
        status: client.status || 'active'
      });
      const savedCliente = await cliente.save();
      clientIdMap.set(client.id, savedCliente._id);
    }

    // Migrar préstamos y crear un mapa de IDs
    console.log('\nMigrando préstamos...');
    const loans = await db.all('SELECT * FROM loans');
    console.log(`Encontrados ${loans.length} préstamos para migrar`);
    const loanIdMap = new Map(); // id SQLite -> _id MongoDB

    for (const loan of loans) {
      const clienteMongoId = clientIdMap.get(loan.client_id);
      if (!clienteMongoId) {
        console.log(`Cliente no encontrado para el préstamo con client_id: ${loan.client_id}`);
        continue;
      }
      const prestamo = new Prestamo({
        cliente: clienteMongoId,
        monto: loan.amount || 0,
        tasaInteres: loan.interest_rate || 0,
        plazo: loan.term || 0,
        fechaDesembolso: loan.loan_date ? new Date(loan.loan_date) : new Date(),
        fechaVencimiento: loan.due_date ? new Date(loan.due_date) : new Date(),
        estado: loan.status || 'pending',
        montoCuota: loan.installment_amount || 0,
        totalPagado: loan.total_paid || 0,
        montoRestante: loan.remaining_amount || loan.amount || 0,
        numeroCuotas: loan.number_of_installments || 0,
        cuotasPagadas: loan.paid_installments || 0,
        cuotasRestantes: (loan.number_of_installments || 0) - (loan.paid_installments || 0),
        proposito: loan.purpose || '',
        garantia: loan.guarantee || '',
        observaciones: loan.notes || ''
      });
      const savedPrestamo = await prestamo.save();
      loanIdMap.set(loan.id, savedPrestamo._id);
    }

    // Migrar pagos
    console.log('\nMigrando pagos...');
    const payments = await db.all('SELECT * FROM payments');
    console.log(`Encontrados ${payments.length} pagos para migrar`);

    for (const payment of payments) {
      const prestamoId = loanIdMap.get(payment.loan_id);
      if (!prestamoId) {
        console.log(`Préstamo no encontrado para el pago con loan_id: ${payment.loan_id}`);
        continue;
      }
      const prestamo = await Prestamo.findById(prestamoId);
      if (!prestamo) {
        console.log(`Préstamo no encontrado en MongoDB para el ID: ${prestamoId}`);
        continue;
      }
      const pago = new Pago({
        prestamo: prestamoId,
        cliente: prestamo.cliente,
        monto: payment.amount || 0,
        fechaPago: payment.payment_date ? new Date(payment.payment_date) : new Date(),
        numeroCuota: payment.installment_number || 0,
        metodoPago: payment.payment_method || 'cash',
        comprobante: payment.receipt || '',
        estado: payment.status || 'completed',
        comentarios: payment.notes || ''
      });
      await pago.save();
    }

    console.log('\nMigración completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    // Cerrar conexiones
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la migración
migrateData(); 