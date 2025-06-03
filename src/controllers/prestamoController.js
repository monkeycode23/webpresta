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
    const cuotasRestantesProgramadas = pagos.filter(pago => pago.status === 'pending' || pago.status === 'incomplete').map(pago => ({
      numeroCuota: pago.label,
      fechaEstimada: pago.payment_date,
      monto: pago.amount,
      status: pago.status,
      pagada: pago.status === 'paid'
    }));
    //generarCuotasRestantes(prestamo, prestamo.payments);
    console.log(cuotasRestantesProgramadas);
    console.log(proximaFechaPago);
    // Crear el objeto de respuesta
    const detallePrestamo = {
      prestamo,
      pagos,
      resumen: {
        cuotasPagadas: prestamo.payments.filter(pago => pago.status === 'paid').length,
        cuotasRestantes: prestamo.installment_number - prestamo.payments.filter(pago => pago.status === 'paid' || pago.status === 'incomplete').length,
        totalPagado: prestamo.payments.reduce((acc, pago) => pago.status === 'paid' || pago.status === 'incomplete' ? pago.status === 'incomplete' ?
         acc+pago.incomplete_amount : acc + pago.amount : acc, 0),
        montoRestante: prestamo.total_amount - prestamo.payments.reduce((acc, pago) => pago.status === 'paid' || pago.status === 'incomplete' ? acc + pago.amount : acc, 0),
        proximaFechaPago,
        porcentajePagado: (prestamo.payments.reduce((acc, pago) => pago.status === 'paid' || pago.status === 'incomplete' ? 
        pago.status === 'incomplete' ? acc+pago.incomplete_amount : acc + pago.amount : acc, 0) / prestamo.total_amount * 100).toFixed(2)
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

  const cuotasRestantes = prestamo.installment_number - prestamo.payments.filter(pago => pago.status === 'paid').length;

  console.log(cuotasRestantes);
 /*  if (prestamo.status === 'Pendiente' || cuotasRestantes <= 0) {
    return null;
  } */
 console.log("pagos",pagos);
  
  const fechaDesembolso = new Date(prestamo.loan_date);
  const ultimoPago =  pagos.filter(pago => pago.status === 'pending')[0]
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
  const cuotas = prestamo.installment_number - prestamo.payments.filter(pago => pago.status === 'paid').length;
  if (prestamo.status === 'paid' || cuotas <= 0) {
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
      numeroCuota: prestamo.payments.filter(pago => pago.status === 'paid').length + i + 1,
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
    const {prestamo,payments} = req.body;
    
    // Validar que el cliente existe
    const cliente = await Cliente.findById(prestamo.client_id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
     
    // Calcular montos si no se proporcionan
    if (!prestamo.total_amount) {
      prestamo.total_amount = prestamo.amount + prestamo.gain;
    }

    const client = await Cliente.findOne({sqlite_id:prestamo.client_id})
    if(!client){
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    const sqlite_id = prestamo.id
    delete prestamo.id
    const _prestamo = new Prestamo({...prestamo,client_id:client._id,sqlite_id:sqlite_id});
    const savedPrestamo = await _prestamo.save();
    
    // Actualizar el cliente con la referencia al préstamo
    await Cliente.findByIdAndUpdate(
      client._id,
      { $push: { loans: savedPrestamo._id } }
    );

    const _payments = payments.map(payment =>{

      const sqlite_id = payment.id

      delete payment.id
      return {...payment, loan_id:savedPrestamo._id,sqlite_id:sqlite_id}
    });
    const savedPayments = await Pago.insertMany(_payments);
    
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
    const {prestamo,payments} = req.body;
    
    // No permitir actualizar ciertos campos
    delete prestamo.client_id;
    delete prestamo.created_at;
    delete prestamo.updated_at;
    
    const _prestamo = await Prestamo.findByIdAndUpdate(
      id,
      prestamo,
      { new: true, runValidators: true }
    );

 
    if (!_prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }


    if(payments.length > 0){

      const _payments = payments.map(payment =>{

        const sqlite_id = payment.id
  
        delete payment.id
        return {...payment, loan_id:savedPrestamo._id,sqlite_id:sqlite_id}
      });

      const savedPayments = await Pago.insertMany(_payments);
    }
    
    res.json(_prestamo);
  } catch (error) {
    console.error('Error al actualizar préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Eliminar préstamo
export const deletePrestamo = async (req, res) => {
  try {
    const { id } = req.params;

    const prestamo = await Prestamo.findOne({sqlite_id:id.toString()})
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }

    // Eliminar pagos asociados al préstamo
    await Pago.deleteMany({ loan_id: prestamo._id });

    // Eliminar el préstamo de la lista de préstamos del cliente
    await Cliente.findByIdAndUpdate(
      prestamo.client_id,
      { $pull: { loans: prestamo._id } }
    );

    // Eliminar el préstamo
    await Prestamo.findByIdAndDelete(prestamo._id);

    res.json({ mensaje: 'Préstamo y sus pagos asociados eliminados correctamente' });
  } catch (error) {
    console.error('Error al eliminar préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
}; 

// Nuevo: Obtener préstamos para el filtro de la página de pagos
export const getLoansForFilter = async (req, res) => {
    try {
      // console.log(req) // Comentado para limpiar logs
      // console.log("getLoansForFilter") // Comentado para limpiar logs
        const clienteIdFromAuth = req.user?._id || req.clienteId; // Usar req.clienteId como fallback
        console.log( "clienteIdFromAuth", clienteIdFromAuth)
        if (!clienteIdFromAuth) {
            return res.status(400).json({ message: "No se pudo determinar el ID del cliente desde el token." });
        }
        
        // Corregir el campo de búsqueda a 'cliente' según el modelo Prestamo.js (que usa 'cliente' y no 'client_id')
        const loans = await Prestamo.find({ client_id: clienteIdFromAuth }) 
                                .select('_id label') 
                                .lean(); 
        
        console.log( "loans", loans)
        const processedLoans = loans.map(loan => ({
            _id: loan._id.toString(),
            label: loan.label || `Préstamo ${loan._id.toString().substring(0,6)}` 
        }));

        console.log( "processedLoans", processedLoans)
        // console.log(processedLoans) // Comentado para limpiar logs
        res.json(processedLoans); 

    } catch (error) {
        console.error("Error fetching loans for filter:", error);
        res.status(500).json({ message: "Error al obtener los préstamos para el filtro: " + error.message });
    }
};  