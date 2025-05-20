import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';
import Cliente from '../models/cliente.js';

// Obtener préstamo por ID
export const getPrestamoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prestamo = await Prestamo.findById(id).populate('cliente');
    
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    res.json(prestamo);
  } catch (error) {
    console.error('Error al obtener préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener detalle de un préstamo con sus pagos
export const getDetallePrestamoConPagos = async (req, res) => {
  try {
    const { prestamoId } = req.params;
    
    const prestamo = await Prestamo.findById(prestamoId).populate('client_id').populate('payments');
    
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    // Obtener todos los pagos relacionados con este préstamo
    const pagos = prestamo.payments;
    
    // Calcular información adicional
    const proximaFechaPago = calcularProximaFechaPago(prestamo, prestamo.payments);
    const cuotasRestantesProgramadas = pagos.filter(pago => pago.status === 'Pendiente').map(pago => ({
      numeroCuota: pago.label,
      fechaEstimada: pago.payment_date,
      monto: pago.amount,
      status: pago.status,
      pagada: pago.status === 'Completado'
    }));
    //generarCuotasRestantes(prestamo, prestamo.payments);
    console.log(cuotasRestantesProgramadas);
    console.log(proximaFechaPago);
    // Crear el objeto de respuesta
    const detallePrestamo = {
      prestamo,
      pagos,
      resumen: {
        cuotasPagadas: prestamo.payments.filter(pago => pago.status === 'Completado').length,
        cuotasRestantes: prestamo.installment_number - prestamo.payments.filter(pago => pago.status === 'Completado').length,
        totalPagado: prestamo.payments.reduce((acc, pago) => pago.status === 'Completado' ? acc + pago.amount : acc, 0),
        montoRestante: prestamo.total_amount - prestamo.payments.reduce((acc, pago) => pago.status === 'Completado' ? acc + pago.amount : acc, 0),
        proximaFechaPago,
        porcentajePagado: (prestamo.payments.reduce((acc, pago) => pago.status === 'Completado' ? acc + pago.amount : acc, 0) / prestamo.total_amount * 100).toFixed(2)
      },
      cuotasRestantesProgramadas
    };
    
    res.json(detallePrestamo);
  } catch (error) {
    console.error('Error al obtener detalle del préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Función para calcular la próxima fecha de pago
const calcularProximaFechaPago = (prestamo, pagos) => {

  const cuotasRestantes = prestamo.installment_number - prestamo.payments.filter(pago => pago.status === 'completado').length;

  console.log(cuotasRestantes);
 /*  if (prestamo.status === 'Pendiente' || cuotasRestantes <= 0) {
    return null;
  } */
 console.log("pagos",pagos);
  
  const fechaDesembolso = new Date(prestamo.loan_date);
  const ultimoPago =  pagos.filter(pago => pago.status === 'Pendiente')[0]
  console.log("ultimoPago",ultimoPago);
  // Si no hay pagos, la próxima fecha es un mes después del desembolso
 /*  if (!ultimoPago) {
    const proximaFecha = new Date(fechaDesembolso);
    proximaFecha.setMonth(proximaFecha.getMonth() + 1);
    return proximaFecha;
  } */
  
  // Si hay pagos, la próxima fecha es un mes después del último pago
  const proximaFecha = ultimoPago ? new Date(ultimoPago.payment_date) : null
  //proximaFecha.setMonth(proximaFecha.getMonth() + 1);
  return proximaFecha;
};

// Función para generar un cronograma de cuotas restantes
const generarCuotasRestantes = (prestamo, pagos) => {
  const cuotas = prestamo.installment_number - prestamo.payments.filter(pago => pago.status === 'Completado').length;
  if (prestamo.status === 'Pagado' || cuotas <= 0) {
    return [];
  }
  
  const cuotasRestantes = [];
  const ultimoPago = pagos.length > 0 ? new Date(pagos[0].payment_date) : new Date(prestamo.loan_date);
  //const proximaFecha = new Date(ultimoPago);
  //proximaFecha.setMonth(proximaFecha.getMonth() + 1);
  
  // Generar las cuotas restantes
  for (let i = 0; i < cuotas; i++) {
    //const fechaCuota = new Date(proximaFecha);
    //fechaCuota.setMonth(fechaCuota.getMonth() + i);
    
    cuotasRestantes.push({
      numeroCuota: prestamo.payments.filter(pago => pago.status === 'Completado').length + i + 1,
      fechaEstimada: ultimoPago.payment_date,
      monto: prestamo.amount,
      pagada: false
    });
  }
  
  return cuotasRestantes;
};

// Obtener pagos de un préstamo
export const getPagosPrestamo = async (req, res) => {
  try {
    const { prestamoId } = req.params;
    
    const prestamo = await Prestamo.findById(prestamoId);
    
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    const pagos = await Pago.find({ prestamo: prestamoId }).sort({ fechaPago: -1 });
    
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos del préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Crear nuevo préstamo
export const createPrestamo = async (req, res) => {
  try {
    const prestamoData = req.body;
    
    // Validar que el cliente existe
    const cliente = await Cliente.findById(prestamoData.client_id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    // Calcular montos si no se proporcionan
    if (!prestamoData.total_amount) {
      prestamoData.total_amount = prestamoData.amount + prestamoData.gain;
    }
    
    const prestamo = new Prestamo(prestamoData);
    const savedPrestamo = await prestamo.save();
    
    // Actualizar el cliente con la referencia al préstamo
    await Cliente.findByIdAndUpdate(
      prestamoData.client_id,
      { $push: { loans: savedPrestamo._id } }
    );
    
    res.status(201).json(savedPrestamo);
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar préstamo
export const updatePrestamo = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // No permitir actualizar ciertos campos
    delete updateData.client_id;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const prestamo = await Prestamo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    res.json(prestamo);
  } catch (error) {
    console.error('Error al actualizar préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Eliminar préstamo
export const deletePrestamo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el préstamo tiene pagos
    const prestamo = await Prestamo.findById(id);
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    if (prestamo.payments && prestamo.payments.length > 0) {
      return res.status(400).json({
        mensaje: 'No se puede eliminar el préstamo porque tiene pagos registrados'
      });
    }
    
    // Eliminar el préstamo
    await Prestamo.findByIdAndDelete(id);
    
    // Actualizar el cliente eliminando la referencia al préstamo
    await Cliente.findByIdAndUpdate(
      prestamo.client_id,
      { $pull: { loans: id } }
    );
    
    res.json({ mensaje: 'Préstamo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
}; 