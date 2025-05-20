import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const rootDir = path.resolve(__dirname, '../../');
const frontendDir = path.join(rootDir, 'frontend');
const buildDir = path.join(frontendDir, 'build');

console.log('🔨 Iniciando compilación del frontend...');

try {
  // Verificar si existe el directorio frontend
  if (!fs.existsSync(frontendDir)) {
    console.error('❌ El directorio frontend no existe.');
    process.exit(1);
  }

  // Compilar el frontend
  console.log('📦 Compilando la aplicación React...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

  // Verificar si se generó el directorio build
  if (!fs.existsSync(buildDir)) {
    console.error('❌ La compilación falló, no se generó el directorio build.');
    process.exit(1);
  }

  console.log('✅ Frontend compilado exitosamente.');
  console.log(`🚀 Los archivos estáticos están disponibles en: ${buildDir}`);
  console.log('🌐 Ejecuta el servidor con NODE_ENV=production para servir el frontend.');
} catch (error) {
  console.error('❌ Error durante la compilación:', error.message);
  process.exit(1);
} 