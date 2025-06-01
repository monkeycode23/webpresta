import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Activado
import apiService, { /* Pago as ApiPago */ } from '../services/api'; // ApiPago comentado para definir localmente
import LoadingSpinner from '../components/LoadingSpinner';
// import DatePicker from 'react-datepicker'; // Se añadirá si se implementa un selector de fecha específico
// import 'react-datepicker/dist/react-datepicker.css';

// Definición local del tipo Pago para PaymentsPage
// Esto asegura que tenemos los campos necesarios, incluyendo opcionales para el frontend.
// Debería coincidir con lo que el backend finalmente devuelve.
export interface Pago {
  _id: string;
  loan_id?: string; // ID del préstamo asociado, opcional pero preferido
  loan_label?: string; // Label del préstamo, opcional
  amount: number;
  payment_date: string | Date;
  status: string; // ej. pagado, pendiente, vencido, incompleto
  label?: string; // ej. Cuota 1, Cuota Extraordinaria
  installment_number?: number;
  payment_method?: string; // ej. PSE, Bancolombia, Efectivo
  // Otros campos que pueda tener un pago según tu API
  [key: string]: any; // Para permitir otros campos y flexibilidad con sortConfig
}

interface LoanForFilter {
  _id: string;
  label: string;
}

// Tipos para filtros y ordenamiento (se definirán más adelante si es necesario)
// interface Filters {
//   startDate?: string;
//   endDate?: string;
//   status?: string;
// }

// interface SortConfig {
//   key: keyof Pago | null;
//   direction: 'ascending' | 'descending';
// }

const ITEMS_PER_PAGE = 10;

const PaymentsPage: React.FC = () => {
  const { user } = useAuth(); // Activado

  const [payments, setPayments] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  // TODO: Definir estados para filtros (startDate, endDate, status)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(''); // Todos los estados por defecto
  const [selectedLoanId, setSelectedLoanId] = useState<string>(''); // Para el filtro de préstamo
  const [availableLoans, setAvailableLoans] = useState<LoanForFilter[]>([]); // Para poblar el select de préstamos

  // TODO: Definir estado para ordenamiento (sortConfig)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Pago | 'loan_label' | null; direction: string }>({ key: 'payment_date', direction: 'descending' });

  // Simulación de carga de préstamos para el filtro
  const fetchLoansForFilter = useCallback(async () => {
    //console.log("Attempting to fetch loans for filter. User ID:", user?._id);
    if (!user?._id) {
      //console.log("User ID not available, skipping fetchLoansForFilter.");
      setAvailableLoans([]); // Asegurar que esté vacío si no hay usuario
      return;
    }
    // setIsLoading(true); // Podrías tener un loader específico para el filtro de préstamos
    
    try {
      //console.log("Inside try: fetching loans for filter"); // Corregido y mensaje modificado
      const response = await apiService.getLoansForUserFilter(); // LLAMADA REAL
      //console.log("Response from getLoansForUserFilter:", response);
      setAvailableLoans(response || []); // response directamente es el array
    } catch (err: any) {
      //console.error("Error fetching loans for filter:", err);
      setError(err.message || "No se pudieron cargar los préstamos para el filtro.");
      setAvailableLoans([]); // Asegurar que sea un array vacío en caso de error
    }
    // setIsLoading(false);
  }, [user]); // fetchLoansForFilter depende de 'user'

  useEffect(() => {
    //console.log("useEffect for fetchLoansForFilter triggered. User:", user);
    if (user && user._id) { // Condición más explícita
        fetchLoansForFilter();
    } else {
        //console.log("User or user._id not present, clearing available loans.");
        setAvailableLoans([]); // Limpiar si el usuario se desloguea o no está presente
    }
  }, [user, fetchLoansForFilter]); // Dependencias actualizadas

  // Funciones de utilidad (copiadas de LoanDetailPage para consistencia)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusClasses = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'pagado': // Añadido para consistencia
        return 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold';
      case 'pendiente':
      case 'pending':
        return 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold';
      case 'incompleto':
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold';
      case 'vencido':
      case 'expired':
        return 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold';
      default:
        return 'bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold';
    }
  };
  
  const translateStatusToSpanish = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'pagado': // Añadido
        return 'Pagado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'incomplete':
      case 'incompleto':
        return 'Incompleto';
      case 'expired':
      case 'vencido':
        return 'Vencido';
      default:
        return status || 'Desconocido';
    }
  };

  // TODO: Lógica para cargar pagos (fetchPayments)
  // Esta función debería llamar a un servicio (apiService.getAllPaymentsByUser o similar)
  // y actualizar los estados: payments, totalPages, isLoading, error.
  // Debería aceptar filtros, ordenamiento y paginación como parámetros.
  const fetchPayments = useCallback(async () => {
      if (!user?._id) {
        setPayments([]); // Limpiar pagos si no hay usuario
        setTotalPages(0);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
          endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
          status: statusFilter || undefined,
          loanId: selectedLoanId || undefined,
          sortBy: sortConfig.key as string,
          sortOrder: sortConfig.direction,
          userId: user._id
        };
        //console.log("Fetching payments with params:", params);
        
        const response = await apiService.getFilteredPayments(params); // LLAMADA REAL
        
        // Ajuste aquí: la respuesta ya es el objeto FilteredPaymentsResponse
        setPayments(response.payments || []); 
        setTotalPages(response.totalPages || 0);

      } catch (err: any) {
        //console.error("Error fetching payments:", err);
        setError(err.message || "No se pudieron cargar los pagos.");
        setPayments([]);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
  }, [user?._id, currentPage, startDate, endDate, statusFilter, selectedLoanId, sortConfig]);

  useEffect(() => {
    if (user?._id) {
      fetchPayments();
    } else {
      // Si no hay usuario, limpiar los pagos y resetear la paginación
      setPayments([]);
      setTotalPages(0);
      setCurrentPage(1);
      setIsLoading(false); // Asegurarse que no se quede cargando
    }
  }, [fetchPayments, user?._id]); // user?._id sigue siendo válido aquí, ya que fetchPayments depende de él

  // TODO: Lógica para manejar cambio de orden (handleSort)
  // TODO: Lógica para manejar cambio de filtros (applyFilters)
  // TODO: Lógica para paginación (handlePageChange)
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  const handleSort = (key: keyof Pago | 'loan_label') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  // Renderizado
  if (isLoading && payments.length === 0) { // Mostrar spinner solo si no hay datos previos
    return <LoadingSpinner />;
  }

  // TODO: Mejorar la presentación de errores
  if (error && payments.length === 0) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Mis Pagos</h2>

      {/* Sección de Filtros */}
      <div className="mb-6 p-4 bg-white shadow-md rounded-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input 
              type="date" 
              id="startDate" 
              value={startDate ? startDate.toISOString().split('T')[0] : ''} 
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)} 
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate ? endDate.toISOString().split('T')[0] : ''} 
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)} 
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
            />
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select 
              id="statusFilter" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[42px]"
            >
              <option value="">Todos</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="vencido">Vencido</option>
              <option value="incompleto">Incompleto</option>
            </select>
          </div>
          <div>
            <label htmlFor="loanFilter" className="block text-sm font-medium text-gray-700 mb-1">Préstamo</label>
            <select 
              id="loanFilter" 
              value={selectedLoanId} 
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[42px]"
              disabled={availableLoans.length === 0 || isLoading} 
            >
              <option value="">Todos los Préstamos</option>
              {availableLoans.map(loan => (
                <option key={loan._id} value={loan._id}>{loan.label}</option>
              ))}
            </select>
          </div>
          <div className="flex">
            <button 
              onClick={fetchPayments} 
              disabled={isLoading || !user?._id}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
            >
              {isLoading ? 'Filtrando...' : 'Aplicar Filtros'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos */}
      {isLoading && payments.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center z-10">
            <LoadingSpinner />
        </div>
      )}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('payment_date')}>
                  Fecha {sortConfig.key === 'payment_date' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('loan_label')}>
                  Préstamo {sortConfig.key === 'loan_label' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('label')}>
                  Cuota {sortConfig.key === 'label' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                  Monto {sortConfig.key === 'amount' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('payment_method')}>
                  Método {sortConfig.key === 'payment_method' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  Estado {sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                </th>
                {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/*!isLoading &&*/ !error && payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 px-4 text-gray-500">
                    No se encontraron pagos con los filtros seleccionados o no hay pagos registrados.
                  </td>
                </tr>
              )}
              {/*!isLoading &&*/ error && (
                 <tr>
                  <td colSpan={6} className="text-center py-10 px-4 text-red-600 bg-red-50">
                    {error} Intente aplicar los filtros nuevamente o recargue la página.
                  </td>
                </tr>
              )}
              {/*!isLoading &&*/ payments.length > 0 && payments.map((pago) => (
                <tr key={pago._id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(pago.payment_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {pago.loan_id ? 
                      <Link to={`/loans/${pago.loan_id}`} className="text-blue-600 hover:underline">
                        {/* Asumimos que el backend podría enviar algo como pago.loan_details.label o pago.loan_label */}
                        { (pago as any).loan_label || `Préstamo ${pago.loan_id.substring(0,8)}...`}
                      </Link> 
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pago.label || pago.installment_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(pago.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{pago.payment_method || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusClasses(pago.status)}>
                      {translateStatusToSpanish(pago.status)}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"> */}
                    {/* Acciones como ver detalle de pago podrían ir aquí */}
                  {/* </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex-1 flex justify-center items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Primera
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {/* TODO: Componente de números de página intermedios */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Última
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage; 