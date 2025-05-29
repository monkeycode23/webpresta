import Pago from '../models/pago.js';
import Prestamo from '../models/prestamo.js';
// Obtener pago por ID
export const getPagoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pago = await Pago.findById(id)
      .populate('prestamo')
      .populate('cliente');
    
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }
    
    res.json(pago);
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener historial de pagos por cliente
export const getHistorialPagosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener total de pagos
    const total = await Pago.countDocuments({ client_id: clienteId });
    
    // Obtener pagos paginados
    const prestamos = await Prestamo.find({ client_id: clienteId })
      .populate('payments')
      
    console.log("prestamos", prestamos)
    // Calcular información de paginación
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      pagos: prestamos.map(prestamo => prestamo.payments),
      paginacion: {
        total,
        totalPages,
        currentPage: parseInt(page),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener pagos pendientes por cliente
export const getPagosPendientesCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Buscar todos los préstamos activos del cliente
    const prestamosActivos = await Prestamo.find({
      client_id: clienteId,
      
      installment_number: { $gt: 0 }
    })
    .populate('payments');
    
    if (prestamosActivos.length === 0) {
      return res.json({ pagosPendientes: [] });
    }
    
    // Crear un array de pagos pendientes
    const pagosPendientes = prestamosActivos.map(prestamo => {

      console.log("prestamo.payments", prestamo.payments)
      return {
        prestamo: {
          id: prestamo._id,
          label: prestamo.label,
          monto: prestamo.amount,
          montoCuota: prestamo.montoCuota,
          cuotasPagadas: prestamo.payments.filter(pago => pago.status === 'Completado').length,
          cuotasRestantes: prestamo.installment_number - prestamo.payments.filter(pago => pago.status === 'Completado').length,
          numeroCuotas: prestamo.installment_number
        },
        pagos: prestamo.payments.filter(pago => pago.status === 'Pendiente'),
        proximoPago: prestamo.payments.filter(pago => pago.status === 'Pendiente')[0] || null,
       /* 
        diasRestantes: Math.max(0, Math.floor((
          prestamo.payments.filter(pago => pago.status === 'Pendiente')[0].payment_date - new Date()) / (1000 * 60 * 60 * 24)))
         
        */
      };
    });
    
    res.json({ pagosPendientes });
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Crear nuevo pago
export const createPago = async (req, res) => {
  try {
    const pagoData = req.body;
    
    // Validar que el préstamo existe
    const prestamo = await Prestamo.findById(pagoData.loan_id);
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    // Validar que el préstamo está activo
    if (!['En curso', 'Aprobado'].includes(prestamo.status)) {
      return res.status(400).json({
        mensaje: 'No se pueden registrar pagos para préstamos no activos'
      });
    }
    
    // Calcular montos si no se proporcionan
    if (!pagoData.total_amount) {
      pagoData.total_amount = pagoData.amount + pagoData.gain;
    }
    
    const pago = new Pago(pagoData);
    const savedPago = await pago.save();
    
    // Actualizar el préstamo con la referencia al pago y los montos
    await Prestamo.findByIdAndUpdate(
      pagoData.loan_id,
      {
        $push: { payments: savedPago._id },
        $inc: { total_paid: pagoData.amount || 0 },
        $set: {
          last_payment_date: pagoData.payment_date || new Date(),
          remaining_amount: prestamo.total_amount - (prestamo.total_paid + (pagoData.amount || 0))
        }
      }
    );
    
    res.status(201).json(savedPago);
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar pago
export const updatePago = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // No permitir actualizar ciertos campos
    delete updateData.loan_id;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const pago = await Pago.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }
    
    res.json(pago);
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Eliminar pago
export const deletePago = async (req, res) => {
  try {
    const { pagoId } = req.params;

    const pago = await Pago.findById(pagoId);
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    const prestamo = await Prestamo.findById(pago.loan_id);
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo asociado no encontrado. No se pudo actualizar el préstamo.' });
    }

    const nuevoTotalPagado = prestamo.total_paid - (pago.amount || 0);
    await Prestamo.findByIdAndUpdate(
      pago.loan_id,
      {
        $pull: { payments: pagoId },
        $set: {
          total_paid: nuevoTotalPagado,
          remaining_amount: prestamo.total_amount - nuevoTotalPagado,
        }
      }
    );

    await Pago.findByIdAndDelete(pagoId);

    res.json({ mensaje: 'Pago eliminado exitosamente y préstamo actualizado.' });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Nuevo: Obtener pagos filtrados, paginados y ordenados para el usuario autenticado
export const getFilteredUserPayments = async (req, res) => {
    try {
        const userId = req.user._id; // ID del usuario autenticado
        let { 
            page = 1, 
            limit = 10, 
            startDate,
            endDate,
            status,
            loanId,
            sortBy = 'payment_date', 
            sortOrder = 'desc' 
        } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const query = { client_id: userId }; 

        if (startDate) {
            query.payment_date = { ...query.payment_date, $gte: new Date(startDate) };
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            query.payment_date = { ...query.payment_date, $lte: endOfDay };
        }
        if (status) {
            query.status = status;
        }
        if (loanId) {
            query.loan_id = loanId; 
        }

        const sortOptions = {};
        if (sortBy && sortOrder) {
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        
        let paymentsQuery = Pago.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit);

        paymentsQuery = paymentsQuery.populate({
            path: 'loan_id',
            select: 'label amount client_id' // Ajusta según los campos que necesites de Loan
        }).lean();

        const paymentsData = await paymentsQuery;
        const totalPayments = await Pago.countDocuments(query);
        const totalPages = Math.ceil(totalPayments / limit);

        const processedPayments = paymentsData.map(p => {
            const paymentResult = {
                ...p,
                loan_id: p.loan_id && p.loan_id._id ? p.loan_id._id.toString() : (p.loan_id ? p.loan_id.toString() : undefined),
                loan_label: p.loan_id && p.loan_id.label ? p.loan_id.label : (p.loan_label || 'N/A'),
            };
            return paymentResult;
        });

        res.json({ 
            payments: processedPayments,
            currentPage: page,
            totalPages,
            totalItems: totalPayments
        });

    } catch (error) {
        console.error("Error fetching filtered payments:", error);
        res.status(500).json({ message: "Error al obtener los pagos: " + error.message });
    }
}; 