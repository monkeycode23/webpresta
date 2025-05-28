import mongoose from 'mongoose';

const prestamoSchema = new mongoose.Schema({
  sqlite_id: {
    type: String, // Or Number, depending on your SQLite ID type
    unique: true,
    sparse: true
  },
  label: {
    type: String,
    trim: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  gain: {
    type: Number,
    required: true,
    min: 0
  },
  installment_number: {
    type: Number,
    required: true,
    min: 1
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  loan_date: {
    type: Date,
    default: Date.now
  },
  generate_payments_date: {
    type: Date
  },
  interest_rate: {
    type: Number,
    required: true,
    min: 0
  },
  term: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Pendiente',
      'active','completed','cancelled','refounded', 'Aprobado', 'Rechazado', 'En curso', 'Pagado', 'Vencido', 'Cancelado'],
    default: 'active'
  },
  payment_interval: {
    type: String,
    enum: ['daily','weekly','monthly','fortnightly','fortnigt','yearly','custom','fortnight',
      'Diario', 'Semanal', 'Quincenal', 'Mensual','Personalizado'],
    default: 'daily'
  },
  // Campos adicionales
  description: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    trim: true
  },
  collateral: {
    type: String,
    trim: true
  },
  next_payment_date: {
    type: Date
  },
  last_payment_date: {
    type: Date
  },
  total_paid: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining_amount: {
    type: Number,
    min: 0
  },
  payment_due_day: {
    type: Number,
    min: 1,
    max: 31
  },
  late_fee_rate: {
    type: Number,
    default: 0,
    min: 0
  },
  late_fee_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    upload_date: Date
  }],
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pago'
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Middleware para calcular el monto restante
prestamoSchema.pre('save', function(next) {
  if (this.isModified('total_paid') || this.isModified('total_amount')) {
    this.remaining_amount = this.total_amount - this.total_paid;
  }
  next();
});

const Prestamo = mongoose.model('Prestamo', prestamoSchema);

export default Prestamo; 