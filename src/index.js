import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'; // Necesario para Socket.IO
import { Server } from 'socket.io'; // Importar Server de Socket.IO
import initializeSocket from './socketHandler.js'; // Importar el manejador de sockets
import authRoutes from './routes/authRoutes.js'
import clienteRoutes from './routes/clienteRoutes.js'
import prestamoRoutes from './routes/prestamoRoutes.js'
import pagoRoutes from './routes/pagoRoutes.js'
import userRoutes from './routes/userRoutes.js'
import roomRoutes from './routes/roomRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'; // Nueva ruta
import dotenv from 'dotenv'
//import ngrok from '@ngrok/ngrok'

// Cargar variables de entorno
dotenv.config();

// Configuración para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de variables de entorno
const PORT = process.env.PORT || 4000
//const uri = "mongodb+srv://wtf2233:wwfXaR1e1cOsBWZv@cluster0.2yipgj7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_URI =  /* process.env.MONGODB_URI || */  "mongodb://localhost:27017/prestaweb"
 
// Inicializar la aplicación Express
const app = express()
const httpServer = createServer(app); // Crear servidor HTTP para Socket.IO

// Exportar io ANTES de inicializarlo si otros módulos lo importan en el top level
// Sin embargo, es mejor pasar la instancia `io` a los módulos que la necesiten o inicializarla aquí y que los controladores la importen.
// Para este caso, el controlador de notificaciones la importa directamente.
export const io = new Server(httpServer, { // Inicializar Socket.IO
  cors: {
    origin: "*", // Ajustar en producción
    methods: ["GET", "POST"]
  }
});

initializeSocket(io); // Pasar la instancia de io al manejador de sockets

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev')) // Logging
   
// Manejo de CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Rutas de API
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes); // Registrar rutas de usuario
app.use('/api/clientes', clienteRoutes)
app.use('/api/prestamos', prestamoRoutes)
app.use('/api/pagos', pagoRoutes)
app.use('/api/notifications', notificationRoutes); // Registrar rutas de notificación
app.use('/api/rooms', roomRoutes)
// Servir archivos estáticos de React en producción
/* if (process.env.NODE_ENV == 'production') { */
  // Ruta a los archivos estáticos del build de React
  const staticPath = path.resolve(__dirname, '../frontend/build')
  
  // Configurar Express para servir los archivos estáticos
  app.use(express.static(staticPath))
  
  // Para cualquier otra ruta, enviar el index.html de React
  app.get('*', (req, res) => {
    // Excluimos las rutas de API que ya están manejadas
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(staticPath, 'index.html'))
    }
  })
/* } else { 
  // En desarrollo, mostrar mensaje de API
  app.get('/', (req, res) => {
    res.json({ mensaje: 'API de PrestaWeb funcionando correctamente' })
  })
  
  // Manejador de rutas no encontradas para desarrollo
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ mensaje: 'API: Ruta no encontrada' })
    }
    next()
  })
} */

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

/* // Get your endpoint online
ngrok.connect({ addr: PORT, authtoken_from_env: true })
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
 */
// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conexión a MongoDB establecida con éxito')
    
    // Iniciar el servidor HTTP (en lugar de app.listen)
    httpServer.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
      console.log(`Frontend disponible en http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err)
    process.exit(1)
  })

export default app
