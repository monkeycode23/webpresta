# PrestaWeb

Sistema de Gestión de Préstamos con frontend en React y backend en Node.js/Express.

## Requisitos

- Node.js (versión 16 o superior)
- MongoDB (local o remoto)

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/prestaweb.git
cd prestaweb
```

2. Instalar dependencias del backend:

```bash
npm install
```

3. Instalar dependencias del frontend:

```bash
cd frontend
npm install
```

## Ejecución

### Entorno de desarrollo

1. Iniciar el servidor de backend en modo desarrollo:

```bash
npm run dev
```

2. En otra terminal, iniciar el servidor de desarrollo de React:

```bash
cd frontend
npm start
```

El frontend estará disponible en http://localhost:3001 y el backend en http://localhost:3000.

### Entorno de producción

1. Compilar el frontend:

```bash
npm run build:frontend
```

2. Iniciar el servidor en modo producción:

```bash
npm run start:prod
```

El servidor servirá tanto el backend (API) como el frontend en http://localhost:3000.

## Variables de entorno

El proyecto utiliza las siguientes variables de entorno:

- `PORT`: Puerto para el servidor (por defecto: 3000)
- `MONGODB_URI`: URI de conexión a MongoDB (por defecto: mongodb://localhost:27017/prestaweb)
- `JWT_SECRET`: Secreto para firmar tokens JWT
- `NODE_ENV`: Entorno de ejecución (development/production)

## Estructura del proyecto

- `/frontend`: Código fuente de la aplicación React
- `/src`: Código fuente del backend
  - `/controllers`: Controladores de la aplicación
  - `/middleware`: Middleware personalizado
  - `/models`: Modelos de datos Mongoose
  - `/routes`: Definición de rutas API
  - `/scripts`: Scripts de utilidad
  - `/utils`: Funciones de utilidad

## Rutas API principales

- `/api/auth`: Autenticación de usuarios
- `/api/clientes`: Gestión de clientes
- `/api/prestamos`: Gestión de préstamos
- `/api/pagos`: Gestión de pagos

# PrestaWeb - Migración de Datos

Este proyecto incluye modelos de Mongoose y utilidades para migrar datos desde una base de datos relacional hacia MongoDB.

## Estructura de Modelos

### Cliente
- Información personal (nombre, apellido, email, teléfono)
- Información de dirección
- Documento de identidad
- Estado (activo/inactivo)

### Préstamo
- Referencia al cliente
- Detalles financieros (monto, tasa de interés, plazo)
- Fechas (desembolso, vencimiento)
- Estado del préstamo
- Información de cuotas
- Campos adicionales (propósito, garantía, observaciones)

### Pago
- Referencias al préstamo y cliente
- Información del pago (monto, fecha, número de cuota)
- Método de pago
- Estado del pago

## Instrucciones de Migración

### Requisitos Previos
1. MongoDB instalado y funcionando
2. Node.js y npm instalados
3. Datos de la base de datos relacional exportados a archivos JSON

### Pasos para la Migración

1. Instalar dependencias:
```bash
npm install
```

2. Exportar los datos de la base de datos relacional a archivos JSON:
   - `data/clientes.json`: Datos de clientes
   - `data/prestamos.json`: Datos de préstamos
   - `data/pagos.json`: Datos de pagos

3. Configurar la conexión a MongoDB:
   - Editar la variable `MONGODB_URI` en `src/scripts/ejemploMigracion.js` o
   - Establecer la variable de entorno `MONGODB_URI`

4. Ejecutar el script de migración:
```bash
node src/scripts/ejemploMigracion.js
```

5. Verificar los resultados:
   - El script mostrará estadísticas sobre los datos migrados
   - Se generará un archivo `data/mapeo_ids.json` con la correlación entre IDs antiguos y nuevos

## Estructura de Datos JSON

### clientes.json
```json
[
  {
    "id": 1,
    "nombre": "Nombre",
    "apellido": "Apellido",
    "email": "correo@ejemplo.com",
    "telefono": "123456789",
    "direccion": "Calle Principal 123",
    "ciudad": "Ciudad",
    "estado": "Estado",
    "codigo_postal": "12345",
    "documento_identidad": "A1234567",
    "tipo_documento": "DNI",
    "fecha_registro": "2023-01-01T00:00:00.000Z",
    "activo": true
  }
]
```

### prestamos.json
```json
[
  {
    "id": 1,
    "cliente_id": 1,
    "monto": 5000,
    "tasa_interes": 12.5,
    "plazo": 12,
    "fecha_desembolso": "2023-02-01T00:00:00.000Z",
    "fecha_vencimiento": "2024-02-01T00:00:00.000Z",
    "estado": "En curso",
    "monto_cuota": 445.33,
    "total_pagado": 1335.99,
    "numero_cuotas": 12,
    "cuotas_pagadas": 3,
    "proposito": "Remodelación",
    "garantia": "Vehículo",
    "observaciones": "Cliente puntual"
  }
]
```

### pagos.json
```json
[
  {
    "id": 1,
    "prestamo_id": 1,
    "monto": 445.33,
    "fecha_pago": "2023-03-01T00:00:00.000Z",
    "numero_cuota": 1,
    "metodo_pago": "Transferencia",
    "comprobante": "TRF-12345",
    "estado": "Completado",
    "comentarios": "Pago a tiempo"
  }
]
```

## Personalización

Los modelos de Mongoose se pueden personalizar según las necesidades:
- Editar `src/models/cliente.js` para modificar el esquema de clientes
- Editar `src/models/prestamo.js` para modificar el esquema de préstamos
- Editar `src/models/pago.js` para modificar el esquema de pagos 