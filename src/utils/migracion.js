import mongoose from 'mongoose';
import Cliente from '../models/cliente.js';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';

/**
 * Utilidad para migrar datos desde una base de datos relacional a MongoDB
 * 
 * Esta clase asume que los datos ya fueron exportados de la base relacional
 * a archivos JSON o que están disponibles a través de una conexión directa.
 */
class MigracionUtil {
  
  /**
   * Migra datos de clientes
   * @param {Array} clientesData - Array de objetos con datos de clientes
   * @returns {Promise<Array>} - Array de clientes migrados con sus IDs de MongoDB
   */
  static async migrarClientes(clientesData) {
    console.log(`Iniciando migración de ${clientesData.length} clientes...`);
    const clientesMigrados = [];
    const mapeoIds = new Map(); // Para mapear IDs antiguos a nuevos
    
    try {
      // Migrar cada cliente
      for (const clienteData of clientesData) {
        const nuevoCliente = new Cliente({
          nombre: clienteData.nombre,
          apellido: clienteData.apellido,
          email: clienteData.email,
          telefono: clienteData.telefono,
          direccion: clienteData.direccion,
          ciudad: clienteData.ciudad,
          estado: clienteData.estado,
          codigoPostal: clienteData.codigo_postal || clienteData.codigoPostal,
          documentoIdentidad: clienteData.documento_identidad || clienteData.documentoIdentidad,
          tipoDocumento: clienteData.tipo_documento || clienteData.tipoDocumento || 'DNI',
          fechaRegistro: clienteData.fecha_registro || clienteData.fechaRegistro || new Date(),
          activo: clienteData.activo !== undefined ? clienteData.activo : true
        });
        
        const clienteGuardado = await nuevoCliente.save();
        mapeoIds.set(clienteData.id, clienteGuardado._id);
        clientesMigrados.push({
          idAntiguo: clienteData.id,
          idNuevo: clienteGuardado._id,
          cliente: clienteGuardado
        });
      }
      
      console.log(`${clientesMigrados.length} clientes migrados exitosamente.`);
      return { clientesMigrados, mapeoIds };
    } catch (error) {
      console.error('Error al migrar clientes:', error);
      throw error;
    }
  }
  
  /**
   * Migra datos de préstamos
   * @param {Array} prestamosData - Array de objetos con datos de préstamos
   * @param {Map} mapeoIdsClientes - Mapeo de IDs antiguos a nuevos de clientes
   * @returns {Promise<Array>} - Array de préstamos migrados con sus IDs de MongoDB
   */
  static async migrarPrestamos(prestamosData, mapeoIdsClientes) {
    console.log(`Iniciando migración de ${prestamosData.length} préstamos...`);
    const prestamosMigrados = [];
    const mapeoIds = new Map(); // Para mapear IDs antiguos a nuevos
    
    try {
      // Migrar cada préstamo
      for (const prestamoData of prestamosData) {
        const idClienteMongo = mapeoIdsClientes.get(prestamoData.cliente_id || prestamoData.clienteId);
        
        if (!idClienteMongo) {
          console.warn(`Cliente con ID ${prestamoData.cliente_id || prestamoData.clienteId} no encontrado. Omitiendo préstamo.`);
          continue;
        }
        
        const nuevoPrestamo = new Prestamo({
          cliente: idClienteMongo,
          monto: prestamoData.monto,
          tasaInteres: prestamoData.tasa_interes || prestamoData.tasaInteres,
          plazo: prestamoData.plazo,
          fechaDesembolso: prestamoData.fecha_desembolso || prestamoData.fechaDesembolso || new Date(),
          fechaVencimiento: prestamoData.fecha_vencimiento || prestamoData.fechaVencimiento,
          estado: prestamoData.estado || 'En curso',
          montoCuota: prestamoData.monto_cuota || prestamoData.montoCuota,
          totalPagado: prestamoData.total_pagado || prestamoData.totalPagado || 0,
          numeroCuotas: prestamoData.numero_cuotas || prestamoData.numeroCuotas,
          cuotasPagadas: prestamoData.cuotas_pagadas || prestamoData.cuotasPagadas || 0,
          proposito: prestamoData.proposito,
          garantia: prestamoData.garantia,
          observaciones: prestamoData.observaciones
        });
        
        const prestamoGuardado = await nuevoPrestamo.save();
        mapeoIds.set(prestamoData.id, prestamoGuardado._id);
        prestamosMigrados.push({
          idAntiguo: prestamoData.id,
          idNuevo: prestamoGuardado._id,
          prestamo: prestamoGuardado
        });
      }
      
      console.log(`${prestamosMigrados.length} préstamos migrados exitosamente.`);
      return { prestamosMigrados, mapeoIds };
    } catch (error) {
      console.error('Error al migrar préstamos:', error);
      throw error;
    }
  }
  
  /**
   * Migra datos de pagos
   * @param {Array} pagosData - Array de objetos con datos de pagos
   * @param {Map} mapeoIdsPrestamos - Mapeo de IDs antiguos a nuevos de préstamos
   * @param {Map} mapeoIdsClientes - Mapeo de IDs antiguos a nuevos de clientes
   * @returns {Promise<Array>} - Array de pagos migrados con sus IDs de MongoDB
   */
  static async migrarPagos(pagosData, mapeoIdsPrestamos, mapeoIdsClientes) {
    console.log(`Iniciando migración de ${pagosData.length} pagos...`);
    const pagosMigrados = [];
    
    try {
      // Migrar cada pago
      for (const pagoData of pagosData) {
        const idPrestamoMongo = mapeoIdsPrestamos.get(pagoData.prestamo_id || pagoData.prestamoId);
        
        if (!idPrestamoMongo) {
          console.warn(`Préstamo con ID ${pagoData.prestamo_id || pagoData.prestamoId} no encontrado. Omitiendo pago.`);
          continue;
        }
        
        // Obtener el préstamo para identificar al cliente
        const prestamo = await Prestamo.findById(idPrestamoMongo);
        
        if (!prestamo) {
          console.warn(`Préstamo con ID MongoDB ${idPrestamoMongo} no encontrado. Omitiendo pago.`);
          continue;
        }
        
        const nuevoPago = new Pago({
          prestamo: idPrestamoMongo,
          cliente: prestamo.cliente,
          monto: pagoData.monto,
          fechaPago: pagoData.fecha_pago || pagoData.fechaPago || new Date(),
          numeroCuota: pagoData.numero_cuota || pagoData.numeroCuota,
          metodoPago: pagoData.metodo_pago || pagoData.metodoPago || 'Efectivo',
          comprobante: pagoData.comprobante,
          estado: pagoData.estado || 'Completado',
          comentarios: pagoData.comentarios
        });
        
        const pagoGuardado = await nuevoPago.save();
        pagosMigrados.push({
          idAntiguo: pagoData.id,
          idNuevo: pagoGuardado._id,
          pago: pagoGuardado
        });
      }
      
      console.log(`${pagosMigrados.length} pagos migrados exitosamente.`);
      return pagosMigrados;
    } catch (error) {
      console.error('Error al migrar pagos:', error);
      throw error;
    }
  }
  
  /**
   * Ejecuta la migración completa de datos
   * @param {Object} datos - Objeto con arrays de clientes, préstamos y pagos
   * @returns {Promise<Object>} - Resultado de la migración
   */
  static async migrarTodo(datos) {
    try {
      // Migrar clientes
      const { clientesMigrados, mapeoIds: mapeoIdsClientes } = await this.migrarClientes(datos.clientes);
      
      // Migrar préstamos
      const { prestamosMigrados, mapeoIds: mapeoIdsPrestamos } = await this.migrarPrestamos(datos.prestamos, mapeoIdsClientes);
      
      // Migrar pagos
      const pagosMigrados = await this.migrarPagos(datos.pagos, mapeoIdsPrestamos, mapeoIdsClientes);
      
      return {
        clientesMigrados,
        prestamosMigrados,
        pagosMigrados,
        mapeoIdsClientes,
        mapeoIdsPrestamos
      };
    } catch (error) {
      console.error('Error en la migración completa:', error);
      throw error;
    }
  }
}

export default MigracionUtil; 