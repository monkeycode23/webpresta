import React, { useState, useEffect/*, useMemo*/ } from 'react';
import { Link } from 'react-router-dom';
// import { Button } from 'react-bootstrap';
// Comentado o eliminado: import { Row, Col, Card, /*ListGroup,*/ Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import apiService, { Prestamo } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface PrestamoConTotales extends Prestamo {
  totalPagadoCuotas: number;
  totalDeudaCuotas: number;
}

const LoansPage: React.FC = () => {
  const { user } = useAuth();
  const [prestamos, setPrestamos] = useState<PrestamoConTotales[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [cuotasPagadas, setCuotasPagadas] = useState(0);
  // const [montoTotalPagado, setMontoTotalPagado] = useState(0);
  // const [montoTotalDeuda, setMontoTotalDeuda] = useState(0);

  useEffect(() => {
    const fetchPrestamos = async () => {
      if (!user || !user._id) return;
      
      try {
        setIsLoading(true);
        const data = await apiService.getPrestamosCliente(user._id);
        // setPrestamos(data);
        //console.log(data)
        const totals = data.reduce((acc, prestamo) => {
          const totalPagado = prestamo.payments.reduce((sum, pago) => 
            pago.status === 'paid' ? sum + pago.amount : sum, 0);
          const totalPendiente = prestamo.total_amount - totalPagado;
          
          acc[prestamo._id] = { ...prestamo, totalPagadoCuotas: totalPagado, totalDeudaCuotas: totalPendiente };
          return acc;
        }, {} as {[key: string]: PrestamoConTotales});
        
        //console.log(totals)
        setPrestamos(Object.values(totals));
        setError(null);
      } catch (err: any) {
        console.error('Error al obtener préstamos:', err);
        setError('No se pudieron cargar los préstamos. Intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrestamos();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="m-3 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (prestamos.length === 0) {
    return (
      <div className="m-3 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-md shadow-sm" role="alert">
        <p className="font-bold">Información</p>
        <p>No tiene préstamos registrados en el sistema.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getBadgeClasses = (estado?: string) => {
    switch (estado?.toLowerCase()) {
      case 'pagado':
      case 'completed':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'en curso':
      case 'active':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'vencido':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
      case 'incompleto':
        return 'bg-orange-100 text-orange-700 border border-orange-300';
      case 'aprobado':
        return 'bg-teal-100 text-teal-700 border border-teal-300';
      case 'rechazado':
        return 'bg-gray-100 text-gray-700 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const translateLoanStatusToSpanish = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'En curso';
      case 'completed':
        return 'Completado';
        case "paid":
          return "pagado"
      case 'pagado':
        return 'Pagado';
      case 'en curso':
        return 'En curso';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
        return 'Pendiente';
      case 'incompleto':
        return 'Incompleto';
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      default:
        return status || 'Desconocido';
    }
  };

  const getProgressBarBgClass = (estado?: string) => {
    switch (estado?.toLowerCase()) {
      case 'paid':
      case 'pagado':
      case 'completed':
        return 'bg-green-500';
      case 'en curso':
      case 'active':
      case 'pending':
      case 'pendiente': 
        return 'bg-blue-500';
      case 'vencido':
      case 'expired':
        return 'bg-red-500';
      case 'incomplete':
      case 'incompleto':
        return 'bg-orange-500';
      case 'aprobado':
        return 'bg-teal-500';
      default:
        return 'bg-gray-400';
    }
  };

  const translatePaymentIntervalToSpanish = (interval: string) => {
    switch (interval) {
      case 'daily':
        return 'Diario';
      case 'fortnightly':
      case 'fortnight':
        return 'Quincenal';
      case 'monthly':
        return 'Mensual';
      case 'quarterly':
        return 'Trimestral';
      case 'semiannual':
        return 'Semestral';
      case 'yearly':
      case 'weekly':
        return 'Semanal';
      case 'biweekly':
        return 'Bi-Semanal';
      case "custom":
        return "Irregular"
      case 'monthly':
        return 'Mensual';
      case 'quarterly':
        return 'Trimestral';
      case 'semiannual':
        return 'Semestral';
      case 'yearly':
        return 'Anual';
      default:
        return interval;
    }
  };

  const getProgressPercent = (prestamo: PrestamoConTotales) => {
    if (prestamo.total_amount === 0) return '0'; // Evitar división por cero
    return ((prestamo.totalPagadoCuotas / prestamo.total_amount) * 100).toFixed(0);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Mis Préstamos</h1>
      
      <div className="flex flex-wrap -mx-2"> {/* Equivalente a Row, con margen negativo para compensar padding de columnas */}
        {prestamos.map((prestamo) => (
          <div className="w-full md:w-1/2 lg:w-1/3 px-2 mb-4" key={prestamo._id}> {/* Equivalente a Col */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden"> {/* Card */}
              <div className="p-5"> {/* Card.Body */}
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-xl font-semibold text-gray-700">{formatCurrency(prestamo.amount)}</h5>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getBadgeClasses(prestamo.status)}`}>
                    {translateLoanStatusToSpanish(prestamo.status)}
                  </span>
                </div>
                
                <div className="mb-4">
                  {/* Barra de progreso con Tailwind */}
                  <div className="bg-gray-200 rounded-full h-2.5 w-full">
                    <div 
                      className={`h-2.5 rounded-full ${getProgressBarBgClass(prestamo.status)}`}
                      style={{ width: `${getProgressPercent(prestamo)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{formatCurrency(prestamo.totalPagadoCuotas)} pagado</span>
                    <span>{getProgressPercent(prestamo)}%</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <div><strong>Plazo:</strong> {translatePaymentIntervalToSpanish(prestamo.payment_interval)}</div>
                  <div><strong>Tasa:</strong> {prestamo.interest_rate}%</div>
                  <div><strong>Fecha desembolso:</strong> {formatDate(prestamo.loan_date)}</div>
                  <div>
                    <strong>Cuotas Pagadas:</strong> {
                      prestamo.payments.filter(pago => pago.status === 'paid').length
                    } de {prestamo.installment_number}
                  </div>
                </div>
                
                <Link 
                  to={`/loans/${prestamo._id}`} 
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md text-center transition duration-150 ease-in-out"
                >
                  Ver Detalle
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoansPage; 