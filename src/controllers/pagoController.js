import Pago from '../models/pago.js';
import Prestamo from '../models/prestamo.js';
import { sendNotificationToUser } from '../socketHandler.js'; // Importar función de notificación
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs para las notificaciones
import cloudinary from '../config/cloudinaryConfig.js'; // Importar Cloudinary

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
    // const { client_id } = req.user; // Asumiendo que el ID del cliente está en req.user. client_id vendrá de prestamo.client_id
    
    // Validar que el préstamo existe
    const prestamo = await Prestamo.findOne({sqlite_id:pagoData.loan_id})
    
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    // Considera validar el estado del préstamo aquí si es necesario
    // if (!['active', 'approved'].includes(prestamo.status)) { ... }
    
    // Calcular montos si no se proporcionan (asegurando que amount y gain existan)
    if (typeof pagoData.amount === 'number' && typeof pagoData.gain === 'number' && typeof pagoData.total_amount !== 'number') {
      pagoData.total_amount = pagoData.amount + pagoData.gain;
    }
    


    const pago = new Pago({
        ...pagoData,
        client_id: prestamo.client_id, // Tomar client_id del préstamo asociado
        status: pagoData.status || 'completed' // Si no se envía, por defecto es completado
    });
    const savedPago = await pago.save();
    
    // Actualizar el préstamo con la referencia al pago y los montos
    const updatedPrestamo = await Prestamo.findByIdAndUpdate(
      savedPago.loan_id, // Usar savedPago.loan_id que es el ID del préstamo
      {
        $push: { payments: savedPago._id },
        $inc: { total_paid: savedPago.amount || 0 }, 
        $set: {
          last_payment_date: savedPago.payment_date || new Date(),
          // Calcular remaining_amount con el valor actualizado de total_paid
          remaining_amount: prestamo.total_amount - (prestamo.total_paid + (savedPago.amount || 0))
        }
      },
      { new: true } // Para obtener el documento actualizado
    ).populate('client_id'); // Popular client_id para tener el objeto cliente o al menos el ID

    // Enviar notificación al usuario
    // Asegurarse que updatedPrestamo y updatedPrestamo.client_id existen
    if (updatedPrestamo && updatedPrestamo.client_id) {
      const clienteIdParaNotificar = updatedPrestamo.client_id._id ? updatedPrestamo.client_id._id.toString() : updatedPrestamo.client_id.toString();
      
      const notificationData = {
        id: uuidv4(), // ID único para la notificación
        type: 'success',
        title: 'Pago Registrado',
        message: `Se registró un pago de ${savedPago.amount} para el préstamo "${updatedPrestamo.label}".`,
        timestamp: new Date().toISOString(),
        read: false,
        link: `/loans/${updatedPrestamo._id}` // Enlace al detalle del préstamo
      };
      sendNotificationToUser(clienteIdParaNotificar, notificationData);
    }
    
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
    const pago_id = await Pago.findOne({sqlite_id:id.toString()})
    const pago = await Pago.findByIdAndUpdate(
      pago_id._id,
      updateData,
      { new: false, runValidators: true }
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
    const { id } = req.params;

    const pago = await Pago.findOne({sqlite_id:id})
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    const prestamo = await Prestamo.findOne({_id:pago.loan_id})
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo asociado no encontrado. No se pudo actualizar el préstamo.' });
    }

    const nuevoTotalPagado = prestamo.total_paid - (pago.amount || 0);
    await Prestamo.findByIdAndUpdate(
      prestamo._id,
      {
        $pull: { payments: pago._id },
        $set: {
          total_paid: nuevoTotalPagado,
          remaining_amount: prestamo.total_amount - nuevoTotalPagado,
        }
      }
    );

    await Pago.findByIdAndDelete(pago._id);

    res.json({ mensaje: 'Pago eliminado exitosamente y préstamo actualizado.' });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Nuevo: Obtener pagos filtrados, paginados y ordenados para el usuario autenticado
export const getFilteredUserPayments = async (req, res) => {
    try {
        const clienteIdFromToken = req.user?._id || req.clienteId;

        if (!clienteIdFromToken) {
            return res.status(400).json({ message: "No se pudo determinar el ID del cliente desde el token para filtrar pagos." });
        }

        let { 
            page = 1, 
            limit = 10, 
            startDate,
            endDate,
            status,
            loanId, // Este loanId es para filtrar por un préstamo específico
        } = req.query;
        
        const sortBy = req.query.sortBy || 'payment_date';
        const sortOrder = req.query.sortOrder || 'desc';

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        // La query para el modelo Pago comienza vacía o con filtros directos de Pago.
        // El filtro por cliente se aplica indirectamente a través de los loan_id.
        const query = {}; 

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
            // Si se filtra por un loanId específico, verificar que pertenezca al cliente.
            // Usar 'client_id' según el modelo Prestamo.
            const prestamoDelCliente = await Prestamo.findOne({ _id: loanId, client_id: clienteIdFromToken }).lean();
            if (!prestamoDelCliente) {
                return res.json({ 
                    payments: [],
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0
                });
            }
            query.loan_id = loanId; // Aplicar filtro de préstamo a la consulta de Pagos
        } else {
            // Si no se filtra por un loanId específico, obtener todos los IDs de préstamos del cliente.
            // Usar 'client_id' según el modelo Prestamo.
            const prestamosDelCliente = await Prestamo.find({ client_id: clienteIdFromToken }).select('_id').lean();
            if (!prestamosDelCliente.length) {
                 // Si el cliente no tiene préstamos, no tendrá pagos.
                return res.json({ 
                    payments: [],
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0
                });
            }
            const idsDePrestamosDelCliente = prestamosDelCliente.map(p => p._id);
            query.loan_id = { $in: idsDePrestamosDelCliente }; // Aplicar filtro a la consulta de Pagos
        }

        const sortOptions = {};
        if (sortBy && sortOrder) {
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        
        const totalPayments = await Pago.countDocuments(query); // Contar antes de popular y paginar para el total correcto

        if (totalPayments === 0) {
            return res.json({
                payments: [],
                currentPage: page,
                totalPages: 0,
                totalItems: 0
            });
        }
        
        const paymentsData = await Pago.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'loan_id',
                select: 'label' 
            })
            .lean();

        const totalPages = Math.ceil(totalPayments / limit);

        const processedPayments = paymentsData.map(p => {
            return {
                ...p,
                loan_label: p.loan_id && p.loan_id.label ? p.loan_id.label : (p.loan_label || 'N/A'),
                _id: p._id 
            };
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

// Nueva función para subir comprobante de pago
export const uploadComprobantePago = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const clienteId = req.clienteId; // Asumimos que verificarToken añade clienteId

    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó ningún archivo.' });
    }

    // Verificar que el pago existe y pertenece al cliente (o que el usuario tiene permisos)
    const pago = await Pago.findById(pagoId);
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado.' });
    }

    // Opcional: Verificar propiedad (que el pago pertenezca al clienteId autenticado)
    // Esto requeriría que el modelo Pago tenga una referencia directa a client_id o 
    // buscar el Préstamo asociado y verificar su client_id.
    const prestamoAsociado = await Prestamo.findById(pago.loan_id);
    if (!prestamoAsociado || prestamoAsociado.client_id.toString() !== clienteId.toString()) {
        return res.status(403).json({ mensaje: 'No tienes permiso para modificar este pago.' });
    }

    if(pago.comprobantes.length > 3){
      return res.status(400).json({ mensaje: 'Este pago ya tiene el máximo de comprobantes subidos.' });
    }
    // Subir archivo a Cloudinary
    // Es buena práctica subir a una carpeta específica y usar el public_id original o uno generado
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'webpresta/comprobantes_pago',
          // public_id: req.file.originalname, // Podrías usar el nombre original o dejar que Cloudinary genere uno
          resource_type: 'auto' // Detecta si es imagen, pdf, etc.
        }, 
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    if (!uploadResult || !uploadResult.secure_url || !uploadResult.public_id) {
        console.error('Error en la subida a Cloudinary:', uploadResult);
        return res.status(500).json({ mensaje: 'Error al subir el archivo a Cloudinary.' });
    }


    const nuevoComprobante = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      filename: req.file.originalname,
      uploadedAt: new Date()
    };

    // Añadir el nuevo comprobante al array y guardar
    pago.comprobantes.push(nuevoComprobante);
    await pago.save();

    res.status(200).json({ 
      mensaje: 'Comprobante subido y asociado al pago exitosamente.', 
      pagoActualizado: pago 
    });

    /* //TODO: Enviar notificación al usuario
    const users = await User.find()
    const cliente = await Cliente.findById(req.clienteId)

    users.forEach(async (user) => {
      const notification = new Notification({
        type: 'success',
        title: 'Comprobante subido',
        message: `El cliente ${cliente.name} ha subido un comprobante de pago para el préstamo ${pago.loan_id}`,
        link: `/loans/${pago.loan_id}`,
        sender_client_id:req.clienteId,
        user_id:user._id
      });
      await notification.save();

      user.notifications.push(notification._id)
      await user.save()

      sendNotificationToUser("user",user._id, notification)

    }); */

  } catch (error) {
    console.error('Error al subir comprobante de pago:', error);
    if (error.message && error.message.includes('Tipo de archivo no permitido')) {
        return res.status(400).json({ mensaje: error.message });
    }
    if (error.http_code === 404) { // Error específico de Cloudinary si la configuración es incorrecta, etc.
        return res.status(500).json({ mensaje: 'Error con el servicio de Cloudinary. Verifica la configuración.'});
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al subir el comprobante.' });
  }
};

// Nueva función para borrar un comprobante de pago
export const deleteComprobantePago = async (req, res) => {
  try {
    const { pagoId,  } = req.params;
    console.log(req.body)
    const {comprobanteCloudinaryId} = req.body;
    const clienteId = req.clienteId; // Asumimos que verificarToken añade clienteId

    // Verificar que el pago existe
    const pago = await Pago.findById(pagoId);
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado.' });
    }

    // Verificar propiedad del pago (a través del préstamo asociado)
    const prestamoAsociado = await Prestamo.findById(pago.loan_id);
    if (!prestamoAsociado || prestamoAsociado.client_id.toString() !== clienteId.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permiso para modificar este pago.' });
    }

    // Encontrar el índice del comprobante a borrar
    const comprobanteIndex = pago.comprobantes.findIndex(
      (comp) => comp.public_id === comprobanteCloudinaryId
    );

    if (comprobanteIndex === -1) {
      return res.status(404).json({ mensaje: 'Comprobante no encontrado en este pago.' });
    }

    // Eliminar de Cloudinary
    const destroyResult = await cloudinary.uploader.destroy(comprobanteCloudinaryId);
    
    // Cloudinary devuelve { result: 'ok' } o { result: 'not found' }, etc.
    if (destroyResult.result !== 'ok' && destroyResult.result !== 'not found') {
      // Si no es 'ok' ni 'not found', podría ser un error o una configuración inesperada.
      // 'not found' es aceptable porque quizás ya fue borrado o el ID era incorrecto, 
      // pero igual queremos eliminar la referencia de nuestra BD.
      console.warn('Resultado inesperado al borrar de Cloudinary:', destroyResult);
      // Considera si quieres detener la operación aquí o continuar para limpiar la BD
    }

    // Eliminar del array en la base de datos
    pago.comprobantes.splice(comprobanteIndex, 1);
    await pago.save();

    res.status(200).json({ 
      mensaje: 'Comprobante eliminado exitosamente.', 
      pagoActualizado: pago 
    });

  } catch (error) {
    console.error('Error al eliminar comprobante de pago:', error);
    if (error.http_code) { // Errores específicos de la API de Cloudinary
        return res.status(500).json({ mensaje: `Error con el servicio de Cloudinary: ${error.message}`});
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el comprobante.' });
  }
}; 