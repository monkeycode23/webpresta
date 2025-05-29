import Cliente from '../models/cliente.js';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';

// Obtener cliente por ID
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findById(id);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener préstamos de un cliente
export const getPrestamosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    const prestamos = await Prestamo.find({ client_id: clienteId }).populate('payments');
    
    res.json(prestamos);
  } catch (error) {
    console.error('Error al obtener préstamos del cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener pagos de un cliente
export const getPagosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    const pagos = await Pago.find({ cliente: clienteId }).populate('prestamo');
    
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos del cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener resumen de préstamos y pagos del cliente
export const getResumenCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    // Obtener préstamos con sus pagos populados
    const prestamos = await Prestamo.find({ client_id: clienteId }).populate('payments');
    
    const totalPrestamos = prestamos.length;
    const totalPrestado = prestamos.reduce((sum, prestamo) => sum + prestamo.amount, 0);

    let totalPagadoReal = 0;
    let totalPendienteReal = 0;

    prestamos.forEach(prestamo => {
      if (prestamo.payments && prestamo.payments.length > 0) {
        prestamo.payments.forEach(pago => {
          if (pago.status && (pago.status.toLowerCase() === 'paid' || pago.status.toLowerCase() === 'completado')) {
            totalPagadoReal += pago.amount;
          } else if (pago.status && pago.status.toLowerCase() !== 'paid' && pago.status.toLowerCase() !== 'completado') {
            // Consideramos pendiente cualquier cosa que no sea 'paid' o 'completado'
            // Aquí podrías ser más específico si tienes otros estados como 'anulado' que no cuentan como pendiente.
            totalPendienteReal += pago.amount; 
          }
        });
      }
    });
 
    // --- INICIO: Lógica para calcular la próxima fecha de pago general ---
    let proximaFechaPagoGeneral = null;
    let detalleProximoPago = null;

    // Filtrar préstamos que no estén 'completed' o 'paid' (considera tus estados)
    const prestamosActivos = prestamos.filter(p => p.status &&  p.status !== 'completed');

    console.log(prestamosActivos,"prestamosActivos")

    if (prestamosActivos.length > 0) {
      let proximasCuotasGlobal = [];
      console.log("asasd")

      for (const prestamo of prestamosActivos) {
        if (prestamo.payments && prestamo.payments.length > 0) {
          const cuotasPendientesDelPrestamo = prestamo.payments
            .filter(p => p.status === 'pending'  && new Date(p.payment_date) >= new Date())
            .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
          console.log(cuotasPendientesDelPrestamo,"cuotasPendientesDelPrestamo")
          if (cuotasPendientesDelPrestamo.length > 0) {
            console.log(cuotasPendientesDelPrestamo,"cuotasPendientesDelPrestamo")
            proximasCuotasGlobal.push({
              fecha: cuotasPendientesDelPrestamo[0].payment_date,
              monto: cuotasPendientesDelPrestamo[0].amount,
              prestamoLabel: prestamo.label || `Préstamo ${prestamo._id.toString().substring(0,6)}`,
              cuotaLabel: cuotasPendientesDelPrestamo[0].label || `Cuota ${cuotasPendientesDelPrestamo[0].installment_number || ''}`.trim(),
              prestamoId: prestamo._id
            });
          }
        }
      }

      if (proximasCuotasGlobal.length > 0) {
        console.log(proximasCuotasGlobal,"proximasCuotasGlobal")
        proximasCuotasGlobal.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        const proximoPagoMasCercano = proximasCuotasGlobal[0];
        
        proximaFechaPagoGeneral = proximoPagoMasCercano.fecha;
        
        detalleProximoPago = {
          prestamoLabel: proximoPagoMasCercano.prestamoLabel,
          cuotaLabel: proximoPagoMasCercano.cuotaLabel,
          monto: proximoPagoMasCercano.monto,
          prestamoId: proximoPagoMasCercano.prestamoId
        };
      }
    }
    // --- FIN: Lógica para calcular la próxima fecha de pago general ---
   
    const pagosRecientesLista = prestamos.flatMap(prestamo => 
        prestamo.payments ? prestamo.payments.map(p => ({ 
          ...(p.toObject ? p.toObject() : p), // Manejar si p es un doc de Mongoose o ya un objeto
          prestamoLabel: prestamo.label || `Préstamo ${prestamo._id.toString().substring(0,6)}`,
          prestamoId: prestamo._id,
          // Asegúrate que payment_date y paid_date existen y son válidos para ordenar
          fechaOrdenamiento: p.paid_date || p.payment_date || p.updated_at 
        })) : []
      )
      .filter(p => p.status && (p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completado'))
      .sort((a,b) => new Date(b.fechaOrdenamiento).getTime() - new Date(a.fechaOrdenamiento).getTime())
      .slice(0, 5);

    const resumen = {
      cliente: {
        id: cliente._id,
        nombre: cliente.name || cliente.nickname,
        apellido: cliente.lastname,
        email: cliente.email
      },
      prestamos: {
        total: totalPrestamos,
        activos: prestamosActivos.length, // Usar la cuenta de prestamosActivos ya filtrada
        pagados: prestamos.filter(p => p.status && (p.status.toLowerCase() === 'completed' || p.status.toLowerCase() === 'paid')).length
      },
      montos: {
        totalPrestado,
        totalPagado: totalPagadoReal,
        totalPendiente: totalPendienteReal
      },
      pagosRecientes: pagosRecientesLista,
      proximaFechaPagoGeneral,
      detalleProximoPago,
    };
    
    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen del cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor', detalle: error.message });
  }
};

// Obtener cliente por documento de identidad
export const getClienteByDocumento = async (req, res) => {
  try {
    const { documento } = req.params;
    
    const cliente = await Cliente.findOne({ documentoIdentidad: documento });
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente por documento:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Crear nuevo cliente
export const createCliente = async (req, res) => {
  try {
    const clienteData = req.body;
    
    // Generar código de acceso único de 5 dígitos si no se proporciona
    if (!clienteData.codigoAcceso) {
      // Generar un número aleatorio entre 10000 y 99999
      clienteData.codigoAcceso = Math.floor(10000 + Math.random() * 90000).toString();
    }
    
    const cliente = new Cliente(clienteData);
    const savedCliente = await cliente.save();
    
    res.status(201).json(savedCliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar cliente
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const cliente = await Cliente.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar perfil del cliente autenticado
export const updateClienteProfile = async (req, res) => {
  try {
    const clienteId = req.clienteId; // Obtenido del token JWT
    const { nombre, apellido, telefono,email, direccion, cbu, aliasCbu } = req.body;

    console.log(req.body)
    const updateData = {
      name: nombre,
      lastname: apellido,
      email,
      phone: telefono,
      address: direccion,
      cbu,
      aliasCbu,
    };

    // Filtrar campos undefined para no sobrescribir con null
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    /* if (cbu) {
      // Verificar si el CBU ya está en uso por otro cliente
      const existingCbu = await Cliente.findOne({ cbu: cbu, _id: { $ne: clienteId } });
      if (existingCbu) {
        return res.status(400).json({ mensaje: 'El CBU ingresado ya está registrado por otro usuario.' });
      }
    } */

    const clienteActualizado = await Cliente.findByIdAndUpdate(
      clienteId,
      { $set: updateData },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!clienteActualizado) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Perfil actualizado correctamente', cliente: clienteActualizado });
  } catch (error) {
    console.error('Error al actualizar perfil del cliente:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.cbu) {
      return res.status(400).json({ mensaje: 'El CBU ingresado ya está en uso.' });
    }
    res.status(500).json({ mensaje: 'Error del servidor al actualizar el perfil' });
  }
};

// Eliminar cliente
export const deleteCliente = async (req, res) => {
  try {
    const { clienteId } = req.params; // Cambiado de id a clienteId para consistencia

    // Encontrar y eliminar pagos y préstamos asociados al cliente
    const prestamos = await Prestamo.find({ client_id: clienteId });
    for (const prestamo of prestamos) {
      // Eliminar pagos asociados al préstamo
      await Pago.deleteMany({ loan_id: prestamo._id });
      // Eliminar el préstamo
      await Prestamo.findByIdAndDelete(prestamo._id);
    }

    // Eliminar el cliente
    const cliente = await Cliente.findByIdAndDelete(clienteId);

    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente, sus préstamos y pagos asociados eliminados correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
}; 