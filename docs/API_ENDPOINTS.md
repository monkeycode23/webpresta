# Documentación de la API de PrestaWeb

Esta documentación describe los endpoints disponibles para que los clientes puedan consultar sus préstamos y pagos desde el frontend.

## Base URL

Todos los endpoints comienzan con la base URL:

```
http://localhost:3000/api
```

## Autenticación

La API utiliza autenticación basada en JWT (JSON Web Tokens). Para acceder a los endpoints protegidos, se debe incluir el token en el encabezado `Authorization` de la siguiente manera:

```
Authorization: Bearer <token>
```

### Endpoints de autenticación

#### Login

- **URL**: `/auth/login`
- **Método**: `POST`
- **Autenticación**: No requerida
- **Body**:
  ```json
  {
    "documento": "A1234567",
    "password": "contraseña"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cliente": {
      "id": "60f5b5f3e4c8a1d7f8c74b72",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan.perez@email.com",
      "documento": "A1234567"
    }
  }
  ```

#### Verificar token

- **URL**: `/auth/verificar`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  {
    "valid": true,
    "cliente": {
      "id": "60f5b5f3e4c8a1d7f8c74b72",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan.perez@email.com",
      "documento": "A1234567"
    }
  }
  ```

## Endpoints de clientes

### Obtener perfil del cliente

- **URL**: `/clientes/:clienteId`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  {
    "_id": "60f5b5f3e4c8a1d7f8c74b72",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan.perez@email.com",
    "telefono": "123456789",
    "documentoIdentidad": "A1234567",
    "tipoDocumento": "DNI",
    "activo": true,
    "fechaRegistro": "2023-01-01T12:00:00.000Z"
  }
  ```

### Obtener resumen del cliente

- **URL**: `/clientes/:clienteId/resumen`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  {
    "cliente": {
      "id": "60f5b5f3e4c8a1d7f8c74b72",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan.perez@email.com"
    },
    "prestamos": {
      "total": 2,
      "activos": 1,
      "pagados": 1
    },
    "montos": {
      "totalPrestado": 15000,
      "totalPagado": 7500,
      "totalPendiente": 7500
    },
    "pagosRecientes": [
      {
        "_id": "60f5b5f3e4c8a1d7f8c74b73",
        "prestamo": {
          "_id": "60f5b5f3e4c8a1d7f8c74b74",
          "monto": 10000
        },
        "monto": 1000,
        "fechaPago": "2023-06-15T14:30:00.000Z",
        "numeroCuota": 3,
        "metodoPago": "Transferencia"
      }
    ]
  }
  ```

### Obtener préstamos del cliente

- **URL**: `/clientes/:clienteId/prestamos`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  [
    {
      "_id": "60f5b5f3e4c8a1d7f8c74b74",
      "cliente": "60f5b5f3e4c8a1d7f8c74b72",
      "monto": 10000,
      "tasaInteres": 12.5,
      "plazo": 12,
      "fechaDesembolso": "2023-01-15T10:00:00.000Z",
      "fechaVencimiento": "2024-01-15T10:00:00.000Z",
      "estado": "En curso",
      "montoCuota": 889.58,
      "totalPagado": 2668.74,
      "montoRestante": 7331.26,
      "numeroCuotas": 12,
      "cuotasPagadas": 3,
      "cuotasRestantes": 9
    }
  ]
  ```

### Obtener pagos del cliente

- **URL**: `/clientes/:clienteId/pagos`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  [
    {
      "_id": "60f5b5f3e4c8a1d7f8c74b73",
      "prestamo": {
        "_id": "60f5b5f3e4c8a1d7f8c74b74",
        "monto": 10000,
        "estado": "En curso"
      },
      "cliente": "60f5b5f3e4c8a1d7f8c74b72",
      "monto": 889.58,
      "fechaPago": "2023-03-15T14:30:00.000Z",
      "numeroCuota": 3,
      "metodoPago": "Transferencia",
      "estado": "Completado"
    }
  ]
  ```

## Endpoints de préstamos

### Obtener detalle de un préstamo

- **URL**: `/prestamos/:prestamoId/detalle`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  {
    "prestamo": {
      "_id": "60f5b5f3e4c8a1d7f8c74b74",
      "cliente": {
        "_id": "60f5b5f3e4c8a1d7f8c74b72",
        "nombre": "Juan",
        "apellido": "Pérez"
      },
      "monto": 10000,
      "tasaInteres": 12.5,
      "plazo": 12,
      "fechaDesembolso": "2023-01-15T10:00:00.000Z",
      "fechaVencimiento": "2024-01-15T10:00:00.000Z",
      "estado": "En curso",
      "montoCuota": 889.58,
      "totalPagado": 2668.74,
      "montoRestante": 7331.26,
      "numeroCuotas": 12,
      "cuotasPagadas": 3,
      "cuotasRestantes": 9
    },
    "pagos": [
      {
        "_id": "60f5b5f3e4c8a1d7f8c74b75",
        "monto": 889.58,
        "fechaPago": "2023-03-15T14:30:00.000Z",
        "numeroCuota": 3,
        "metodoPago": "Transferencia",
        "estado": "Completado"
      },
      {
        "_id": "60f5b5f3e4c8a1d7f8c74b76",
        "monto": 889.58,
        "fechaPago": "2023-02-15T10:15:00.000Z",
        "numeroCuota": 2,
        "metodoPago": "Efectivo",
        "estado": "Completado"
      },
      {
        "_id": "60f5b5f3e4c8a1d7f8c74b77",
        "monto": 889.58,
        "fechaPago": "2023-01-15T16:45:00.000Z",
        "numeroCuota": 1,
        "metodoPago": "Transferencia",
        "estado": "Completado"
      }
    ],
    "resumen": {
      "cuotasPagadas": 3,
      "cuotasRestantes": 9,
      "totalPagado": 2668.74,
      "montoRestante": 7331.26,
      "proximaFechaPago": "2023-04-15T14:30:00.000Z",
      "porcentajePagado": "26.69"
    },
    "cuotasRestantesProgramadas": [
      {
        "numeroCuota": 4,
        "fechaEstimada": "2023-04-15T14:30:00.000Z",
        "monto": 889.58,
        "pagada": false
      },
      {
        "numeroCuota": 5,
        "fechaEstimada": "2023-05-15T14:30:00.000Z",
        "monto": 889.58,
        "pagada": false
      }
    ]
  }
  ```

### Obtener pagos de un préstamo

- **URL**: `/prestamos/:prestamoId/pagos`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  [
    {
      "_id": "60f5b5f3e4c8a1d7f8c74b75",
      "prestamo": "60f5b5f3e4c8a1d7f8c74b74",
      "cliente": "60f5b5f3e4c8a1d7f8c74b72",
      "monto": 889.58,
      "fechaPago": "2023-03-15T14:30:00.000Z",
      "numeroCuota": 3,
      "metodoPago": "Transferencia",
      "estado": "Completado"
    }
  ]
  ```

## Endpoints de pagos

### Obtener historial de pagos del cliente

- **URL**: `/pagos/cliente/:clienteId/historial`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Parámetros de consulta**:
  - `page`: Número de página (por defecto: 1)
  - `limit`: Número de elementos por página (por defecto: 10)
- **Respuesta exitosa**:
  ```json
  {
    "pagos": [
      {
        "_id": "60f5b5f3e4c8a1d7f8c74b75",
        "prestamo": {
          "_id": "60f5b5f3e4c8a1d7f8c74b74",
          "monto": 10000,
          "estado": "En curso"
        },
        "cliente": "60f5b5f3e4c8a1d7f8c74b72",
        "monto": 889.58,
        "fechaPago": "2023-03-15T14:30:00.000Z",
        "numeroCuota": 3,
        "metodoPago": "Transferencia",
        "estado": "Completado"
      }
    ],
    "paginacion": {
      "total": 5,
      "totalPages": 1,
      "currentPage": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### Obtener pagos pendientes del cliente

- **URL**: `/pagos/cliente/:clienteId/pendientes`
- **Método**: `GET`
- **Autenticación**: Token requerido
- **Respuesta exitosa**:
  ```json
  {
    "pagosPendientes": [
      {
        "prestamo": {
          "id": "60f5b5f3e4c8a1d7f8c74b74",
          "monto": 10000,
          "montoCuota": 889.58,
          "cuotasPagadas": 3,
          "cuotasRestantes": 9,
          "numeroCuotas": 12
        },
        "proximoPago": {
          "fechaEstimada": "2023-04-15T14:30:00.000Z",
          "numeroCuota": 4,
          "monto": 889.58,
          "estado": "Pendiente"
        },
        "diasRestantes": 10
      }
    ]
  }
  ```

## Recomendaciones para integración en el frontend

1. **Manejo de autenticación**:
   - Almacenar el token en `localStorage` o `sessionStorage`
   - Incluir el token en todas las solicitudes a endpoints protegidos
   - Verificar periódicamente la validez del token con el endpoint `/auth/verificar`

2. **Flujo de navegación recomendado**:
   - Pantalla de login (solicitar documento y contraseña)
   - Dashboard con resumen del cliente (usando `/clientes/:clienteId/resumen`)
   - Listado de préstamos (usando `/clientes/:clienteId/prestamos`)
   - Detalle de préstamo (usando `/prestamos/:prestamoId/detalle`)
   - Historial de pagos (usando `/pagos/cliente/:clienteId/historial`)
   - Pagos pendientes (usando `/pagos/cliente/:clienteId/pendientes`)

3. **Manejo de errores**:
   - Implementar interceptores para manejar errores 401 (Unauthorized) y redirigir a la pantalla de login
   - Mostrar mensajes amigables para errores 404 (Not Found) y 500 (Internal Server Error)

4. **Consideraciones de UX**:
   - Mostrar indicadores de carga cuando se realizan peticiones
   - Aplicar caché local para reducir peticiones innecesarias
   - Implementar formularios de búsqueda y filtros para listas extensas 