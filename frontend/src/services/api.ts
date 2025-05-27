import axios from 'axios';

// Definición de tipos
export interface Cliente {
  _id: string;
  nickname: string;
  name: string;
  lastname: string;
  email: string;
  codigoAcceso: string;
  phone?: string;
  address?: string;
  cbu?: string;
  aliasCbu?: string;
}

export interface Prestamo {
  _id: string;
  cliente: string;
  amount: number;
  label: string;
  payments: Pago[];
  interest_rate: number;
  payment_interval: number;
  loan_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  fechaDesembolso: string;
  montoCuota: number;
  total_paid: number;
  remaining_amount: number;
  installment_number: number;
  cuotasPagadas: number;
  cuotasRestantes: number;
  proposito?: string;
  garantia?: string;
  observaciones?: string;
}

export interface Pago {
  _id: string;
  prestamo: string | Prestamo;
  cliente: string;
  incomplete_amount: number;
  amount: number;
  paid_date: string;
  created_at: string;
  updated_at: string;
  reference: string;
  notes: string;
  payment_date: string;
  installment_number: number;
  payment_method: string;
  comprobante?: string;
  status: string;
  comments?: string;
  label?: string;
}

export interface ResumenCliente {
  cliente: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  prestamos: {
    total: number;
    activos: number;
    pagados: number;
    prestamos: Prestamo[];
  };
  montos: {
    totalPrestado: number;
    totalPagado: number;
    totalPendiente: number;
  };
  pagosRecientes: Pago[];
}

export interface DetallePrestamo {
  prestamo: Prestamo;
  pagos: Pago[];
  resumen: {
    totalPagado: number;
    cuotasPagadas: number;
    cuotasRestantes: number;
    montoRestante: number;
    proximaFechaPago: string | null;
    porcentajePagado: string;
  };
  cuotasRestantesProgramadas: {
    numeroCuota: number;
    fechaEstimada: string;
    monto: number;
    status: string;
    pagada: boolean;
  }[];
}

export interface PagosPendientesResponse {
  pagosPendientes: {
    prestamo: {
      id: string;
      label: string;
      monto: number;
      montoCuota: number;
      cuotasPagadas: number;
      cuotasRestantes: number;
      numeroCuotas: number;
      status: string;
    };
    proximoPago: Pago;
    pagos: Pago[];
    diasRestantes: number;
  }[];
}

export interface PagosHistorialResponse {
  pagos: Pago[];
  paginacion: {
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Configuración de axios
const API_BASE_URL = /* process.env.REACT_APP_API_URL || */ 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicios de API
const apiService = {
  // Autenticación
  login: async (codigoAcceso: string) => {
    const response = await api.post('/auth/login', { codigoAcceso });
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await api.get('/auth/verificar');
    return response.data;
  },
  
  // Clientes
  getCliente: async (clienteId: string) => {
    const response = await api.get(`/clientes/${clienteId}`);
    return response.data;
  },
  
  updateProfile: async (profileData: Partial<Cliente>) => {
    const response = await api.put('/clientes/profile', profileData);
    return response.data;
  },
  
  getResumenCliente: async (clienteId: string) => {
    const response = await api.get<ResumenCliente>(`/clientes/${clienteId}/resumen`);
    return response.data;
  },
  
  // Préstamos
  getPrestamosCliente: async (clienteId: string) => {
    const response = await api.get<Prestamo[]>(`/clientes/${clienteId}/prestamos`);
    return response.data;
  },
  
  getDetallePrestamo: async (prestamoId: string) => {
    const response = await api.get<DetallePrestamo>(`/prestamos/${prestamoId}/detalle`);
    return response.data;
  },
  
  // Pagos
  getPagosCliente: async (clienteId: string) => {
    const response = await api.get<Pago[]>(`/clientes/${clienteId}/pagos`);
    return response.data;
  },
  
  getHistorialPagos: async (clienteId: string, page = 1, limit = 10) => {
    const response = await api.get<PagosHistorialResponse>(
      `/pagos/cliente/${clienteId}/historial?page=${page}&limit=${limit}`
    );
    return response.data;
  },
  
  getPagosPendientes: async (clienteId: string) => {
    const response = await api.get<PagosPendientesResponse>(`/pagos/cliente/${clienteId}/pendientes`);
    return response.data;
  },
};

export default apiService; 