import mongoose from 'mongoose';
import fs from 'fs';
import MigracionUtil from '../utils/migracion.js';

// Configuración de la conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prestaweb';

/**
 * Script de ejemplo para migrar datos desde archivos JSON a MongoDB
 * 
 * Este script asume que los datos de la base de datos relacional
 * fueron exportados previamente a archivos JSON.
 */
async function main() {
  try {
    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión a MongoDB establecida con éxito.');
    
    // Cargar datos de los archivos JSON
    console.log('Cargando datos desde archivos JSON...');
    
    // Nota: Ajustar las rutas según sea necesario
    const clientes = JSON.parse(fs.readFileSync('./data/clientes.json', 'utf8'));
    const prestamos = JSON.parse(fs.readFileSync('./data/prestamos.json', 'utf8'));
    const pagos = JSON.parse(fs.readFileSync('./data/pagos.json', 'utf8'));
    
    console.log(`Datos cargados: ${clientes.length} clientes, ${prestamos.length} préstamos, ${pagos.length} pagos.`);
    
    // Ejecutar la migración
    const resultado = await MigracionUtil.migrarTodo({
      clientes,
      prestamos,
      pagos
    });
    
    // Mostrar resultados
    console.log('=== RESULTADOS DE LA MIGRACIÓN ===');
    console.log(`Clientes migrados: ${resultado.clientesMigrados.length}`);
    console.log(`Préstamos migrados: ${resultado.prestamosMigrados.length}`);
    console.log(`Pagos migrados: ${resultado.pagosMigrados.length}`);
    
    // Guardar mapeo de IDs para referencia futura
    const mapeoIds = {
      clientes: Object.fromEntries(resultado.mapeoIdsClientes),
      prestamos: Object.fromEntries(resultado.mapeoIdsPrestamos)
    };
    
    fs.writeFileSync('./data/mapeo_ids.json', JSON.stringify(mapeoIds, null, 2));
    console.log('Mapeo de IDs guardado en ./data/mapeo_ids.json');
    
    console.log('Migración completada con éxito.');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    // Cerrar conexión a MongoDB
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}

// Ejecutar el script
main(); 