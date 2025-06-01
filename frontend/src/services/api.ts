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
  payment_interval: string;
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
  prestamoLabel: string;
  prestamoId: string;
  cliente: string;
  incomplete_amount: number;
  amount: number;
  paid_date: string;
  loan_label:string;
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
  };
  montos: {
    totalPrestado: number;
    totalPagado: number;
    totalPendiente: number;
  };
  pagosRecientes: (Pago & { prestamoLabel?: string, prestamoId?: string })[];
  proximaFechaPagoGeneral?: string | null;
  detalleProximoPago?: {
    prestamoLabel?: string;
    cuotaLabel?: string;
    monto?: number;
    prestamoId?: string;
  } | null;
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
    payment_interval: string;
    
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

// Interfaz para los parámetros de getFilteredPayments
interface FilteredPaymentsParams {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  loanId?: string;
  sortBy: string;
  sortOrder: string;
  userId: string;
}

// Interfaz para la respuesta de getFilteredPayments (ajusta según tu backend)
// Asumiendo que Pago es el tipo importado o definido en este archivo también.
// Si no, importa el tipo Pago de PaymentsPage.tsx o define uno aquí que coincida.
// Para este ejemplo, asumiré que Pago ya está definido/importado aquí.
interface FilteredPaymentsResponse {
  payments: Pago[]; // Reemplaza Pago con tu tipo real si es diferente
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// Interfaz para LoanForFilter (debe coincidir con la de PaymentsPage)
interface LoanForFilter {
  _id: string;
  label: string;
}

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

  getDashboardData: async (): Promise<any> => {
    const response = await api.get('/users/dashboard');
    return response.data;
  },

  getPrestamos: async (page: number = 1, limit: number = 10): Promise<any> => {
    const response = await api.get(`/loans?page=${page}&limit=${limit}`);
    return response.data;
  },

  getFilteredPayments: async (params: FilteredPaymentsParams): Promise<FilteredPaymentsResponse> => {
    // Construye la query string a partir de los parámetros, omitiendo los undefined
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    );
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
    const response = await api.get<FilteredPaymentsResponse>(`/payments/my-payments?${queryString}`);
    return response.data;
  },

  getLoansForUserFilter: async (): Promise<LoanForFilter[]> => {
    console.log("fetching loans for filter3")
    // El userId se infiere del token en el backend, por lo que no se pasa como parámetro aquí.
    const response = await api.get<LoanForFilter[]>('/loans/for-filter');
    console.log(response)
    return response.data;
  },
  
  getProfile: async (): Promise<Cliente> => {
    const response = await api.get<Cliente>('/users/profile');
    return response.data;
  },
};

export default apiService; 