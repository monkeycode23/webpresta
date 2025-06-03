import React, { useState, useEffect } from 'react';
// import { Alert, Modal, Badge } from 'react-bootstrap'; // Eliminadas todas las importaciones de react-bootstrap
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { ResumenCliente, Pago } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../components/PaymentModal';
import { Paperclip, HelpCircle } from 'lucide-react';
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenCliente | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchResumen = async () => {
      if (!user || !user._id) { 
        setError("Usuario no disponible o ID no encontrado.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await apiService.getResumenCliente(user._id); 
        ////console.log(data)
        setResumen(data);
        setError(null);
      } catch (err: any) {
        //console.error('Error al obtener resumen:', err);
        setError(err.response?.data?.message || 'No se pudo cargar la información del resumen. Intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchResumen();
    } else {
      setIsLoading(false); 
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handlePaymentClick = (pago: Pago) => {
    setSelectedPayment(pago);
    setShowModal(true);
  };

  const getStatusClass = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completado':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'pendiente':
        return 'bg-blue-100 text-blue-700';
      case 'incomplete':
      case 'incompleto':
        return 'bg-yellow-100 text-yellow-700';
      case 'expired':
      case 'vencido':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const translateStatusToSpanish = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completado':
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

  const isPaymentLate = (paymentDate: string, status?: string): boolean => {
    if (status === 'Completado' || status === 'Pagado') return false;
    const dueDate = new Date(paymentDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return today > dueDate;
  };

  const calculateDaysOverdue = (paymentDate: string, status?: string): number => {
    if (status === 'Completado' || status === 'Pagado') return 0;
    const dueDate = new Date(paymentDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (today <= dueDate) return 0;
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 m-auto max-w-lg">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="p-4 m-auto max-w-lg">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">No hay información de resumen disponible.</span>
        </div>
      </div>
    );
  }
 
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Bienvenido, {resumen.cliente.nombre} {resumen.cliente.apellido}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Préstamos Activos</h2>
            <p className="text-4xl font-bold text-blue-600 mb-1">{resumen.prestamos.activos}</p>
            <p className="text-sm text-gray-500">De un total de {resumen.prestamos.total} préstamos</p>
          </div>
          <Link to="/loans" className="mt-4 inline-block text-center w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150">
            Ver Préstamos
          </Link>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Prestado</h2>
            <p className="text-4xl font-bold text-green-600 mb-1">{formatCurrency(resumen.montos.totalPrestado)}</p>
            <p className="text-sm text-gray-500">Monto total de préstamos recibidos</p>
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center">Actualizado a la fecha</p>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Pendiente por Pagar</h2>
            <p className="text-4xl font-bold text-red-600 mb-1">{formatCurrency(resumen.montos.totalPendiente)}</p>
            <p className="text-sm text-gray-500">De {formatCurrency(resumen.montos.totalPagado)} ya pagados</p>
          </div>
          <Link to="/payments" className="mt-4 inline-block text-center w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150">
            Ver Pagos
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Próximo Pago</h2>
            {resumen.proximaFechaPagoGeneral && resumen.detalleProximoPago ? (
              <>
                <p className="text-3xl font-bold text-orange-500 mb-1">
                  {formatCurrency(resumen.detalleProximoPago.monto || 0)}
                </p>
                <p className="text-lg text-gray-600 font-medium">
                  {formatDate(resumen.proximaFechaPagoGeneral)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {resumen.detalleProximoPago.prestamoLabel} - {resumen.detalleProximoPago.cuotaLabel}
                </p>
              </>
            ) : resumen.proximaFechaPagoGeneral ? (
                 <p className="text-lg font-semibold text-gray-600">
                    Próximo pago el: {formatDate(resumen.proximaFechaPagoGeneral)}
                 </p>
            ) : (
              <p className="text-lg font-semibold text-gray-600">
                ¡Estás al día! No hay pagos próximos programados.
              </p>
            )}
          </div>
          {resumen.proximaFechaPagoGeneral && resumen.detalleProximoPago && resumen.detalleProximoPago.prestamoId ? (
            <Link 
              to={`/loans/${resumen.detalleProximoPago.prestamoId}`} 
              className="mt-4 inline-block text-center w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150"
            >
              Ver Préstamo Asociado
            </Link>
          ) : (
            <p className="mt-4 text-xs text-gray-400 text-center">Información de tu siguiente cuota</p>
          )}
        </div>
      </div>
      
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pagos Recientes</h3>
      {resumen.pagosRecientes && resumen.pagosRecientes.length > 0 ? (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préstamo</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resumen.pagosRecientes.map((pago: Pago) =>(
                    <tr 
                      key={pago._id} 
                      onClick={() => handlePaymentClick(pago)}
                      className="hover:bg-gray-50 cursor-pointer transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(pago.payment_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pago.prestamoLabel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pago.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(pago.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pago.payment_method || 'Efectivo'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(pago.status)}`}>
                          {translateStatusToSpanish(pago.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 text-center">
            <Link to="/payments" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150">
              Ver Todos los Pagos
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">No hay pagos recientes para mostrar.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal con Tailwind CSS */}
     <PaymentModal
        show={showModal}
        onHide={() => setShowModal(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default DashboardPage;