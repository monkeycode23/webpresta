import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom'; // Eliminado por no usarse
import { useAuth } from '../context/AuthContext'; // Activado
import apiService, { Prestamo } from '../services/api'; // Importar Prestamo de api.ts
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../components/PaymentModal'; // Importar el modal de pago
import ReusableTable, { Column } from '../components/ReusableTable'; // Importar la tabla reutilizable
import { Paperclip, Eye, HelpCircle } from 'lucide-react'; // HelpCircle eliminado por no usarse
// import DatePicker from 'react-datepicker'; // Se añadirá si se implementa un selector de fecha específico
// import 'react-datepicker/dist/react-datepicker.css';

// Definición local del tipo Pago para PaymentsPage, actualizada con comprobantes
// Esto asegura que tenemos los campos necesarios, incluyendo opcionales para el frontend.
// Debería coincidir con lo que el backend finalmente devuelve.

import { Pago } from '../services/api';
/* export interface Pago {
  _id: string;
  prestamo: string | Prestamo; // Cambiado a requerido y usando el tipo Prestamo importado
  loan_label?: string; // Mantener si se usa para mostrar, pero el modal usará prestamo.label si es objeto
  amount: number;
  payment_date: string | Date;
  status: string; // ej. pagado, pendiente, vencido, incompleto
  label?: string; // ej. Cuota 1, Cuota Extraordinaria
  installment_number?: number;
  payment_method?: string; // ej. PSE, Bancolombia, Efectivo
  comprobantes?: Array<{
    _id?: string;
    public_id: string;
    url: string;
    filename?: string;
    uploadedAt?: string; 
  }>;
  // Otros campos que pueda tener un pago según tu API
  [key: string]: any; // Para permitir otros campos y flexibilidad con sortConfig
}
 */
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof Pago | 'loan_label' | 'actions' | 'comprobantes' | null; direction: string }>({ key: 'payment_date', direction: 'descending' });

  const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Carga inicial de préstamos para el filtro
  const fetchLoansForFilter = useCallback(async () => {
    if (!user?._id) {
      setAvailableLoans([]);
      return;
    }
    try {
      const response = await apiService.getLoansForUserFilter();
      setAvailableLoans(response || []);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los préstamos para el filtro.");
      setAvailableLoans([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && user._id) {
        fetchLoansForFilter();
    } else {
        setAvailableLoans([]);
    }
  }, [user, fetchLoansForFilter]);

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

  // Función para cargar pagos
  const fetchPayments = useCallback(async () => {
      if (!user?._id) {
        setPayments([]);
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
          // userId: user._id // Ya no es necesario enviar userId, el backend lo toma del token
        };
        
        const response = await apiService.getFilteredPayments(params);
        setPayments(response.payments || []); 
        setTotalPages(response.totalPages || 0);

      } catch (err: any) {
        setError(err.message || "No se pudieron cargar los pagos.");
        setPayments([]);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
  // Se quita fetchPayments de sus propias dependencias para evitar bucles si no se maneja cuidadosamente.
  // Las dependencias correctas para re-disparar fetchPayments están en el useEffect de abajo.
  }, [user?._id, currentPage, startDate, endDate, statusFilter, selectedLoanId, sortConfig]);

  // useEffect para re-cargar pagos cuando cambian los filtros, paginación o el usuario.
  useEffect(() => {
    if (user?._id) {
      fetchPayments();
    } else {
      setPayments([]);
      setTotalPages(0);
      setCurrentPage(1); // Resetear página si el usuario se desloguea
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [user?._id, currentPage, startDate, endDate, statusFilter, selectedLoanId, sortConfig, fetchPayments]); // fetchPayments se incluye aquí

  // useEffect para resetear la página actual a 1 cuando los filtros (excepto paginación y ordenamiento) cambian
  useEffect(() => {
    // No resetear si es el cambio inicial o si solo cambió la página/ordenamiento
    // Esto es para evitar un doble fetch al cambiar la página.
    // Considera si este efecto es estrictamente necesario o si el efecto anterior es suficiente.
    // Por ahora, se omite para simplificar y evitar posibles bucles de re-renderizado.
    // Si se necesita, se debe implementar con cuidado para evitar re-cargas innecesarias.
    // Ejemplo:
    // const initialLoadRef = useRef(true);
    // useEffect(() => {
    //   if (initialLoadRef.current) {
    //     initialLoadRef.current = false;
    //     return;
    //   }
    //   setCurrentPage(1);
    // }, [startDate, endDate, statusFilter, selectedLoanId]);
    // Nota: Resetear currentPage disparará el useEffect anterior para llamar a fetchPayments.
  }, [startDate, endDate, statusFilter, selectedLoanId]);

  const handleOpenModal = (pago: Pago) => {
    setSelectedPayment(pago);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handlePaymentUpdate = (updatedPayment: Pago) => {
    // Actualizar la lista de pagos para reflejar los cambios (ej. nuevos comprobantes)
    setPayments(prevPayments => 
      prevPayments.map(p => p._id === updatedPayment._id ? updatedPayment : p)
    );
    // Opcionalmente, se podría llamar a fetchPayments() para recargar todo, 
    // pero la actualización local es más optimista si el modal devuelve el pago completo.
  };

  // TODO: Lógica para manejar cambio de orden (handleSort)
  // TODO: Lógica para manejar cambio de filtros (applyFilters)
  // TODO: Lógica para paginación (handlePageChange)
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  const handleSort = (key: keyof Pago | 'loan_label' | 'actions' | 'comprobantes') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  // ***** INICIO DEFINICIÓN DE COLUMNAS *****
  const paymentTableColumns: Column<Pago>[] = [
    {
      key: 'comprobantes',
      header: '', 
      className: 'w-10 text-center px-2 py-3',
      customRender: (pago) => (
        <div className="flex justify-center items-center h-full">
          {pago.comprobantes && pago.comprobantes.length > 0 ? (
            <span title="Tiene comprobantes">
              <Paperclip size={16} className="text-gray-500" />
            </span>
          ) : (
            <span className="w-[16px] inline-block" title="Sin comprobantes">
              {/* Puedes poner un ícono placeholder o dejarlo vacío */}
               <HelpCircle size={16} className="text-gray-300" /> 
            </span> 
          )}
        </div>
      ),
    },
    {
      key: 'loan_label',
      header: 'Préstamo',
      sortable: true,
      className: 'min-w-[150px] whitespace-normal break-words px-4 py-3',
      customRender: (pago) => pago.loan_label || 'N/A',
    },
    {
      key: 'label',
      header: 'Cuota',
      sortable: true,
      className: 'min-w-[100px] px-4 py-3',
      customRender: (pago) => pago.label || (pago.installment_number ? `Cuota ${pago.installment_number}` : 'N/A'),
    },
    {
      key: 'payment_date',
      header: 'Fecha Venc.',
      sortable: true,
      className: 'min-w-[120px] px-4 py-3',
      customRender: (pago) => formatDate(pago.payment_date),
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      className: 'min-w-[100px] text-right px-4 py-3',
      headerClassName: 'text-right px-4 py-3',
      customRender: (pago) => formatCurrency(pago.amount),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      className: 'min-w-[120px] text-center px-4 py-3',
      headerClassName: 'text-center px-4 py-3',
      customRender: (pago) => (
        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(pago.status)}`}>
          {translateStatusToSpanish(pago.status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-center w-20 px-4 py-3',
      headerClassName: 'text-center px-4 py-3',
      customRender: (pago) => (
        <button 
          onClick={(e) => { 
            e.stopPropagation();
            handleOpenModal(pago); 
          }}
          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors duration-150"
          title="Ver Detalles"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];
  // ***** FIN DEFINICIÓN DE COLUMNAS *****

  if (isLoading && payments.length === 0) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
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
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="expired">Vencido</option>
              <option value="incomplete">Incompleto</option>
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
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-400 rounded-md">
          Error: {error}
        </div>
      )}
      
      {/* ReusableTable Integration */}
      {isLoading && payments.length === 0 && <LoadingSpinner />} 
      {!isLoading && payments.length === 0 && !error && (
         <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No hay pagos para mostrar con los filtros actuales.</p>
          </div>
      )}
      {payments.length > 0 && (
        <ReusableTable<Pago>
          columns={paymentTableColumns}
          data={payments}
          keyExtractor={(pago) => pago._id}
          onSort={(columnKey) => handleSort(columnKey as keyof Pago | 'loan_label' | 'actions' | 'comprobantes')}
          sortColumn={sortConfig.key as string}
          sortOrder={sortConfig.direction as ('asc' | 'desc')}
          tableClassName="min-w-full divide-y divide-gray-200 bg-white shadow-md rounded-lg"
          headerRowClassName="bg-gray-50"
          bodyRowClassName="hover:bg-gray-50 transition-colors duration-150"
          emptyStateMessage="No se encontraron pagos."
          // onRowClick={handleOpenModal} // Opcional: si quieres que toda la fila abra el modal
        />
      )}

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

      {/* PaymentModal Integration */}
      {selectedPayment && (
        <PaymentModal
          show={isModalOpen}
          onHide={handleCloseModal}
          payment={selectedPayment}
          onPaymentUpdate={handlePaymentUpdate}
        />
      )}
    </div>
  );
};

export default PaymentsPage; 