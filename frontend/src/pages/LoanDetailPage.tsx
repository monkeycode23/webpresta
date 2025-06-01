import React, { useState, useEffect } from 'react';
import { useParams, Link /*, useNavigate*/ } from 'react-router-dom'; // useNavigate comentado
import { Alert } from 'react-bootstrap'; // Alert se mantiene temporalmente, se revisará después
// import { useAuth } from '../context/AuthContext'; // user comentado
import apiService, { DetallePrestamo, Pago } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../components/PaymentModal';

const LoanDetailPage: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  // const navigate = useNavigate(); // Comentado
  // const { user } = useAuth(); // Comentado
  const [detallePrestamo, setDetallePrestamo] = useState<DetallePrestamo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    //console.log("LoanDetailPage: useEffect triggered. Current ID:", loanId);
    const fetchDetallePrestamo = async () => {
      if (!loanId) {
        setIsLoading(false);
        setError('No se proporcionó un ID de préstamo.');
        setDetallePrestamo(null);
        return;
      }
      setIsLoading(true); 
      try {
        const data = await apiService.getDetallePrestamo(loanId);
        //console.log("DetallePrestamo:", data);
        setDetallePrestamo(data);
        setError(null);
      } catch (err) {
        //console.error('Error fetching loan details:', err);
        setError('Error al cargar los detalles del préstamo');
        setDetallePrestamo(null); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetallePrestamo();
  }, [loanId]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null): string => {
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
      
        return 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold';
      case 'active':
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
        return 'Completado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'incomplete':
      case 'incompleto':
        return 'Incompleto';
      case 'expired':
      case 'vencido':
        return 'Vencido';
      case 'active':
        return 'Activo';
      default:
        return status || 'Desconocido';
    }
  };

  const handlePaymentClick = (pago: Pago) => {
    setSelectedPayment(pago);
    setShowModal(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error && !detallePrestamo) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }
  
  if (!detallePrestamo) {
    return (
      <Alert variant="info" className="m-3">
        { error ? error : 'No se encontró el préstamo solicitado o no hay datos.'}
      </Alert>
    );
  }

  const translatePaymentIntervalToSpanish = (interval: string): string => {
    switch (interval) {
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensual';
      case 'daily':
        return 'Diario';
      case 'fortnightly':
      case 'fortnight':
        return 'Quincenal';
      case "custom":
        return "Irregular"
      case 'yearly':
        return 'Anual';
      case 'quarterly':
        return 'Trimestral';
      case 'semiannual':
        return 'Semestral';
      case 'bimonthly':
        return 'Bimestral';
      case 'biweekly':
        return 'Bi-Semanal';
      default:
        return interval;
    }
  };

  const vencidosPagosList = detallePrestamo.pagos.filter(cuota => cuota.status === 'expired');
  const historialPagosList = detallePrestamo.pagos
    .filter(pago => pago.status === 'paid' || pago.status === 'incomplete')
    .reverse();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 sm:mb-0">Detalles del Préstamo</h2>
        <Link to="/loans" className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Volver a Préstamos
        </Link>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 p-4 sm:px-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700">Información General</h4>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Monto</p>
            <p className="text-xl font-semibold text-gray-800">{formatCurrency(detallePrestamo.prestamo.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Estado</p>
            <span className={getStatusClasses(detallePrestamo.prestamo.status)}>
              {translateStatusToSpanish(detallePrestamo.prestamo.status)}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Tasa de Interés</p>
            <p className="text-md text-gray-800">{detallePrestamo.prestamo.interest_rate}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Plazo</p>
            <p className="text-md text-gray-800">{translatePaymentIntervalToSpanish(String(detallePrestamo.prestamo.payment_interval))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Número de Cuotas</p>
            <p className="text-md text-gray-800">{detallePrestamo.prestamo.installment_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Fecha Desembolso</p>
            <p className="text-md text-gray-800">{formatDate(detallePrestamo.prestamo.loan_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Fecha Vencimiento</p>
            <p className="text-md text-gray-800">{formatDate(detallePrestamo.prestamo.due_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Propósito</p>
            <p className="text-md text-gray-800">{detallePrestamo.prestamo.proposito || 'No especificado'}</p>
          </div>
        </div>
      </div>

      {/* Resumen de Pagos con Tailwind */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 p-4 sm:px-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700">Resumen de Pagos</h4>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso</span>
              <span>{detallePrestamo.resumen.porcentajePagado}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${detallePrestamo.resumen.porcentajePagado}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Cuotas Pagadas</p>
              <p className="text-md text-gray-800">{detallePrestamo.resumen.cuotasPagadas} de {detallePrestamo.prestamo.installment_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Cuotas Restantes</p>
              <p className="text-md text-gray-800">{detallePrestamo.resumen.cuotasRestantes}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Pagado</p>
              <p className="text-md font-semibold text-green-600">{formatCurrency(detallePrestamo.resumen.totalPagado)}</p>
            </div>   
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Monto Restante</p>
              <p className="text-md font-semibold text-red-600">{formatCurrency(detallePrestamo.resumen.montoRestante)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Próxima Fecha de Pago</p>
              <p className="text-md text-gray-800">
                {detallePrestamo.resumen.proximaFechaPago ? 
                  formatDate(detallePrestamo.resumen.proximaFechaPago)
                  : 'No aplica'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cuotas Pendientes con Tailwind */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 p-4 sm:px-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700">Cuotas Pendientes</h4>
        </div>
        <div className="p-4 sm:p-6">
          {detallePrestamo.cuotasRestantesProgramadas.length === 0 ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  {vencidosPagosList.length >0 && detallePrestamo.cuotasRestantesProgramadas.length === 0 ? (
                    <p className="text-sm text-green-700">No hay cuotas pendientes, pero hay cuotas vencidas</p>
                  ) : (
                    <p className="text-sm text-green-700">No hay cuotas pendientes. ¡Préstamo completamente pagado!</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Estimada</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detallePrestamo.pagos.filter(pago => pago.status === 'pending'|| 
                  pago.status === 'Incompleto' // Asegurarse que los estados coincidan con getStatusClasses y translateStatusToSpanish
                  ).map((cuota) => (
                    <tr key={cuota._id}  onClick={() => handlePaymentClick(cuota)} className="hover:bg-gray-50 cursor-pointer transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cuota.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(cuota.payment_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(cuota.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClasses(cuota.status)}>
                          {translateStatusToSpanish(cuota.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Cuotas Vencidas con Tailwind CSS */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 p-4 sm:px-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700">Cuotas Vencidas</h4>
        </div>
        <div className="p-4 sm:p-6">
          {vencidosPagosList.length === 0 ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">No hay cuotas vencidas.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Pago</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vencidosPagosList.map((cuota) => (
                    <tr key={cuota._id} onClick={() => handlePaymentClick(cuota)} className="hover:bg-gray-50 cursor-pointer transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cuota.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(cuota.payment_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(cuota.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClasses(cuota.status)}>
                          {translateStatusToSpanish(cuota.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Pagos con Tailwind CSS */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 p-4 sm:px-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700">Historial de Pagos</h4>
        </div>
        <div className="p-4 sm:p-6">
          {historialPagosList.length === 0 ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">No hay pagos registrados para este préstamo.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historialPagosList.map((pago) => (
                    <tr 
                      key={pago._id}
                      onClick={() => handlePaymentClick(pago)}
                      className="hover:bg-gray-50 cursor-pointer transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(pago.payment_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pago.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(pago.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pago.payment_method}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClasses(pago.status)}>
                          {translateStatusToSpanish(pago.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Fin de Historial de Pagos con Tailwind CSS */}

      <PaymentModal
        show={showModal}
        onHide={() => setShowModal(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default LoanDetailPage; 