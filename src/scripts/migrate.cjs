const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const url = require('url');

// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

// Definir esquemas de MongoDB
const ClienteSchema = new mongoose.Schema({
  nickname: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PrestamoSchema = new mongoose.Schema({
  label: String,
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  amount: Number,
  gain: Number,
  installmentNumber: Number,
  totalAmount: Number,
  loanDate: Date,
  generatePaymentsDate: Date,
  interestRate: Number,
  term: Number,
  status: String,
  paymentInterval: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PagoSchema = new mongoose.Schema({
  label: String,
  prestamo: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestamo' },
  gain: Number,
  totalAmount: Number,
  paymentDate: Date,
  netAmount: Number,
  amount: Number,
  status: String,
  paidDate: Date,
  incompleteAmount: Number,
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Crear modelos
const Cliente = mongoose.model('Cliente', ClienteSchema);
const Prestamo = mongoose.model('Prestamo', PrestamoSchema);
const Pago = mongoose.model('Pago', PagoSchema);

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
  let db;
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Conectar a SQLite
    const dbPath = path.join(__dirname, '../../test.db');
    console.log('Intentando conectar a SQLite en:', dbPath);
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Conectado a SQLite');

    // Verificar tablas existentes
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('\nTablas encontradas en la base de datos:');
    tables.forEach(table => console.log(table.name));

    // Verificar estructura de las tablas
    await getTableInfo(db, 'clients');
    await getTableInfo(db, 'loans');
    await getTableInfo(db, 'payments');

    // Migrar clientes
    console.log('\nMigrando clientes...');
    const clients = await db.all('SELECT * FROM clients');
    console.log(`Encontrados ${clients.length} clientes para migrar`);
    
    // Mapeo de SQLite client.id a MongoDB _id
    const clientIdMap = new Map();
    
    for (const client of clients) {
      // nickname → nombre, status → activo
      const cliente = new Cliente({
        nombre: client.nickname || '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        documentoIdentidad: '',
        tipoDocumento: 'DNI',
        password: '',
        fechaRegistro: client.created_at ? new Date(client.created_at) : new Date(),
        activo: client.status === 'active' || client.status === 'activo',
        ultimoAcceso: client.updated_at ? new Date(client.updated_at) : null,
        nickname: client.nickname || ''
      });
      const savedCliente = await cliente.save();
      clientIdMap.set(client.id, savedCliente._id);
    }
    console.log('Clientes migrados');

    // Migrar préstamos
    console.log('\nMigrando préstamos...');
    const loans = await db.all('SELECT * FROM loans');
    console.log(`Encontrados ${loans.length} préstamos para migrar`);
    
    const loanIdMap = new Map();
    
    for (const loan of loans) {
      try {
        const clienteId = clientIdMap.get(loan.client_id);
        if (!clienteId) {
          console.log(`Cliente no encontrado para el préstamo con client_id: ${loan.client_id}`);
          continue;
        }
        const prestamo = new Prestamo({
          cliente: clienteId,
          monto: loan.amount,
          tasaInteres: loan.interest_rate,
          plazo: loan.term,
          fechaDesembolso: loan.loan_date ? new Date(loan.loan_date) : new Date(),
          fechaVencimiento: loan.generate_payments_date ? new Date(loan.generate_payments_date) : new Date(),
          estado: loan.status || 'Pendiente',
          montoCuota: loan.total_amount || 0,
          totalPagado: 0,
          montoRestante: loan.amount || 0,
          numeroCuotas: loan.installment_number || 1,
          cuotasPagadas: 0,
          cuotasRestantes: loan.installment_number || 1,
          proposito: loan.label || '',
          garantia: '',
          observaciones: '',
        });
        const savedPrestamo = await prestamo.save();
        loanIdMap.set(loan.id, savedPrestamo._id);
      } catch (error) {
        console.error('Error al migrar préstamo:', loan, error);
      }
    }
    console.log('Préstamos migrados');

    // Migrar pagos
    console.log('\nMigrando pagos...');
    const payments = await db.all('SELECT * FROM payments');
    console.log(`Encontrados ${payments.length} pagos para migrar`);
    
    for (const payment of payments) {
      try {
        const prestamoId = loanIdMap.get(payment.loan_id);
        if (!prestamoId) {
          console.log(`Préstamo no encontrado para el pago con loan_id: ${payment.loan_id}`);
          continue;
        }
        // Buscar el cliente a partir del préstamo
        const prestamo = await Prestamo.findById(prestamoId);
        const pago = new Pago({
          prestamo: prestamoId,
          cliente: prestamo ? prestamo.cliente : undefined,
          monto: payment.amount || 0,
          fechaPago: payment.payment_date ? new Date(payment.payment_date) : new Date(),
          numeroCuota: payment.id || 1,
          metodoPago: payment.payment_method || 'Efectivo',
          comprobante: '',
          estado: payment.status || 'Completado',
          comentarios: '',
        });
        await pago.save();
      } catch (error) {
        console.error('Error al migrar pago:', payment, error);
      }
    }
    console.log('Pagos migrados');

    console.log('\nMigración completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    // Cerrar conexiones
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    if (db) {
      await db.close();
    }
  }
}

// Ejecutar migración
migrateData(); 