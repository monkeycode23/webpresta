import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema({
  sqlite_id: {
    type: String, // Or Number, depending on your SQLite ID type
    unique: true,
    sparse: true
  },
  label: {
    type: String,
    trim: true
  },
  loan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestamo',
    required: true
  },
  gain: {
    type: Number,
    required: true,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  net_amount: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending','expired','incomplete','paid',
      'Pendiente', 'Procesando', 'Completado', 'Reembolsado', 'Fallido', 'Cancelado'], // Aligned with pagoStatusMap
    default: 'pending' // Aligned with pagoStatusMap default
  },
  paid_date: {
    type: Date 
  },
  incomplete_amount: {
    type: Number,
    min: 0  
  },
  payment_method: {
    type: String,
    enum: [
      "cash","transfer","credit_card",
      'Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Mercado Pago', 'Otro'],
    default: 'cash'
  },
  // Campos adicionales
  installment_number: {
    type: Number,
    required: true,
    min: 1
  },
  due_date: {
    type: Date,
    required: true
  },
  late_fee: {
    type: Number,
    default: 0,
    min: 0
  },
  late_days: {
    type: Number,
    default: 0,
    min: 0
  },
  receipt_number: {
    type: String,
    trim: true
  },
  transaction_id: {
    type: String,
    trim: true
  },
  payment_proof: {
    url: String,
    type: String,
    upload_date: Date
  },
  notes: {
    type: String,
    trim: true
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Hook para actualizar el préstamo cuando se realiza un pago
pagoSchema.post('save', async function() {
  const Prestamo = mongoose.model('Prestamo');
  
  try {
    const prestamo = await Prestamo.findById(this.loan_id);
    
    if (prestamo && this.status === 'Completado') {
      // Agregar el pago al arreglo de pagos del préstamo
      if (!prestamo.payments.includes(this._id)) {
        prestamo.payments.push(this._id);
        prestamo.total_paid += this.amount;
        prestamo.last_payment_date = this.payment_date;
      }
      
      // Actualizar el estado del préstamo si está completamente pagado
      if (prestamo.total_amount <= prestamo.total_paid) {
        prestamo.status = 'Pagado';
      }
      // Ensure remaining_amount doesn't go below zero
      prestamo.remaining_amount = Math.max(0, prestamo.total_amount - prestamo.total_paid);

      await prestamo.save();
    }
  } catch (error) {
    console.error('Error al actualizar el préstamo después del pago:', error);
  }
});

const Pago = mongoose.model('Pago', pagoSchema);

export default Pago; 