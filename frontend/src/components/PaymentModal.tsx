import React from 'react';
// Removed react-bootstrap imports
import { Pago, Prestamo } from '../services/api';

interface PaymentModalProps {
  show: boolean;
  onHide: () => void;
  payment: Pago | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ show, onHide, payment }) => {
  if (!show || !payment) { // Also check for show prop to control visibility
    return null;
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Updated to return Tailwind classes
  const getStatusClasses = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isPaymentActuallyLate = (paymentDate: string, paidDate?: string | null, status?: string): boolean => {
    if (status === 'paid' || status === 'Pagado') {
        if (paidDate) {
            const dueDate = new Date(paymentDate);
            const actualPaidDate = new Date(paidDate);
            dueDate.setHours(0,0,0,0);
            actualPaidDate.setHours(0,0,0,0);
            return actualPaidDate > dueDate;
        }
        return false;
    }
    const dueDate = new Date(paymentDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return today > dueDate;
  };

  const calculateActualDaysOverdue = (paymentDate: string, paidDate?: string | null, status?: string): number => {
    if (status === 'paid' || status === 'Pagado') {
        if (paidDate) {
            const dueDate = new Date(paymentDate);
            const actualPaidDate = new Date(paidDate);
            dueDate.setHours(0,0,0,0);
            actualPaidDate.setHours(0,0,0,0);
            if (actualPaidDate > dueDate) {
                return Math.floor((actualPaidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            }
        }
        return 0;
    }
    const dueDate = new Date(paymentDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (today <= dueDate) return 0;
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const prestamoLabel = typeof payment.prestamo === 'object' && payment.prestamo !== null 
    ? (payment.prestamo as Prestamo).label
    : typeof payment.prestamo === 'string' 
    ? payment.prestamo
    : 'N/A';

  const paymentStatusText = () => {
    if (payment.paid_date) {
      if (isPaymentActuallyLate(payment.payment_date, payment.paid_date, payment.status)) {
        return `Pagado con Atraso el ${formatDate(payment.paid_date)}`;
      }
      return `Pagado a Tiempo el ${formatDate(payment.paid_date)}`;
    }
    if (payment.status === 'expired') return 'Vencido - No Pagado';
    if (payment.status === 'pending') return 'Pendiente de Pago';
    if (payment.status === 'incomplete') return 'Pago Incompleto';
    return payment.status;
  };

  const paymentStatusBadgeClasses = (): string => {
    if (payment.paid_date) {
      return isPaymentActuallyLate(payment.payment_date, payment.paid_date, payment.status) ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
    }
    return getStatusClasses(payment.status);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h5 className="text-lg font-semibold text-gray-800">Detalles del Pago - Cuota: {payment.label || payment.installment_number}</h5>
          <button onClick={onHide} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-3">
              <div>
                <h6 className="text-sm font-medium text-gray-500">Identificación</h6>
                <div className="mt-1 space-y-1 text-sm text-gray-700">
                  <p><strong>Préstamo:</strong> {prestamoLabel}</p>
                  <p><strong>Cuota (Nombre/ID):</strong> {payment.label || 'N/A'}</p>
                  <p><strong>Número de Cuota:</strong> {payment.installment_number}</p>
                  <p><strong>Referencia del Pago:</strong> {payment.reference || 'N/A'}</p>
                  <p><strong>Método de Pago:</strong> {payment.payment_method || 'N/A'}</p>
                </div>
              </div>
              
              <hr className="my-3"/>
              <div>
                <h6 className="text-sm font-medium text-gray-500">Estado y Fechas</h6>
                <div className="mt-1 space-y-1 text-sm text-gray-700">
                  <p>
                    <strong>Estado General de la Cuota:</strong>{' '}
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(payment.status)}`}>
                      {payment.status}
                    </span>
                  </p>
                  <p><strong>Fecha de Vencimiento:</strong> {formatDate(payment.payment_date)}</p>
                  <p>
                    <strong>Estado Detallado:</strong>{' '}
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusBadgeClasses()}`}>
                      {paymentStatusText()}
                    </span>
                  </p>
                  {isPaymentActuallyLate(payment.payment_date, payment.paid_date, payment.status) && (
                    <p><strong>Días de Atraso:</strong> {calculateActualDaysOverdue(payment.payment_date, payment.paid_date, payment.status)} días</p>
                  )}
                  <p><strong>Registrado el:</strong> {formatDate(payment.created_at)}</p>
                  <p><strong>Última Actualización:</strong> {formatDate(payment.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-3">
              <div>
                <h6 className="text-sm font-medium text-gray-500">Información Monetaria</h6>
                <div className="mt-1 space-y-1 text-sm text-gray-700">
                  <p><strong>Monto Total Cuota:</strong> <span className="font-bold">{formatCurrency(payment.amount)}</span></p>
                  {payment.status === 'Incompleto' && (
                    <>
                      <p><strong>Monto Pagado:</strong> {formatCurrency(payment.incomplete_amount || 0)}</p>
                      <p><strong>Monto Pendiente:</strong> <span className="text-red-600 font-bold">{formatCurrency(payment.amount - (payment.incomplete_amount || 0))}</span></p>
                    </>
                  )}
                  {(payment.status === 'Completado' || payment.status === 'Pagado') && payment.paid_date && (
                    <p><strong>Monto Efectivamente Pagado:</strong> <span className="text-green-600 font-bold">{formatCurrency(payment.amount)}</span></p>
                  )}
                </div>
              </div>
              
              <hr className="my-3"/>
              <div>
                <h6 className="text-sm font-medium text-gray-500">Comentarios</h6>
                <div className="mt-1 text-sm text-gray-700">
                  <p><strong>Notas:</strong> {payment.notes || 'Sin notas'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={onHide} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 