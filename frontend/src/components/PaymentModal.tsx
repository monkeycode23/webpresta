import React, { useState, useCallback, useEffect } from 'react';
// Removed react-bootstrap imports
import { Pago, Prestamo} from '../services/api';
import apiService from '../services/api';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Trash2, Paperclip, AlertCircle, ExternalLinkIcon as ExternalLink } from 'lucide-react'; // Example icons, ensure ExternalLinkIcon is correctly named or aliased
import { toast } from 'react-toastify'; // Assuming react-toastify is used

interface PaymentModalProps {
  show: boolean;
  onHide: () => void;
  payment: Pago | null;
  onPaymentUpdate?: (updatedPayment: Pago) => void; // Callback to update payment in parent
}

const PaymentModal: React.FC<PaymentModalProps> = ({ show, onHide, payment: initialPayment, onPaymentUpdate }) => {
  const [currentPayment, setCurrentPayment] = useState<Pago | null>(initialPayment);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPayment(initialPayment);
    setUploadError(null); // Reset error when modal reopens or payment changes
  }, [initialPayment, show]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      // Optional: include time if needed and available
      // hour: '2-digit',
      // minute: '2-digit',
    });
  };

  // Updated to return Tailwind classes
  const getStatusClasses = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pendiente':
        return 'bg-blue-100 text-blue-800';
      case 'incomplete':
      case 'incompleto':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completado':
        return 'Pagado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'incomplete':
      case 'incompleto':
        return 'Pago Incompleto';
      case 'expired':
      case 'vencido':
        return 'Vencido';
      default:
        return status;
    }
  }

  const isPaid = currentPayment?.status?.toLowerCase() === 'paid' || currentPayment?.status?.toLowerCase() === 'completado';

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!currentPayment || !acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadError(null);
    try {
      const response = await apiService.uploadPaymentProof(currentPayment._id, file);
      if (response && response.pagoActualizado) {
        setCurrentPayment(response.pagoActualizado);
        if (onPaymentUpdate) {
          onPaymentUpdate(response.pagoActualizado);
        }
        toast.success('Comprobante subido exitosamente!');
      } else {
        throw new Error("No se recibió el pago actualizado del servidor.");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.mensaje || error.message || 'Error al subir el comprobante.';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      console.error('Error uploading proof:', error);
    } finally {
      setIsUploading(false);
    }
  }, [currentPayment, onPaymentUpdate]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'application/pdf': []
    },
    maxFiles: 1,
    disabled: isUploading || !isPaid,
  });

  const handleDeleteComprobante = async (comprobantePublicId?: string) => {
    if (!currentPayment || !comprobantePublicId) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar este comprobante? Esta acción no se puede deshacer.")) {
        return;
    }
    try {
      const response = await apiService.deletePaymentProof(currentPayment._id, comprobantePublicId);
      if (response && response.pagoActualizado) {
        setCurrentPayment(response.pagoActualizado);
         if (onPaymentUpdate) {
          onPaymentUpdate(response.pagoActualizado);
        }
        toast.success('Comprobante eliminado exitosamente!');
      } else {
        // Fallback if pagoActualizado is not returned, update locally for better UX
        setCurrentPayment(prev => {
            if (!prev) return null;
            return {
                ...prev,
                comprobantes: prev.comprobantes?.filter(c => c.public_id !== comprobantePublicId)
            };
        });
        toast.success('Comprobante eliminado (actualización local).'); // Inform user about local update
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.mensaje || 'Error al eliminar el comprobante.';
      toast.error(errorMessage);
      console.error('Error deleting proof:', error);
    }
  };
  
  const isPaymentActuallyLate = (paymentDate?: string, paidDate?: string | null, status?: string): boolean => {
    if (!paymentDate) return false;
    if (status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'completado') {
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

  const calculateActualDaysOverdue = (paymentDate?: string, paidDate?: string | null, status?: string): number => {
    if (!paymentDate) return 0;
    if (status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'completado') {
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
  
  const prestamoLabel = typeof currentPayment?.prestamo === 'object' && currentPayment?.prestamo !== null 
    ? (currentPayment?.prestamo as Prestamo).label
    : typeof currentPayment?.prestamo === 'string' 
    ? currentPayment?.prestamo
    : 'N/A';

  const paymentStatusText = () => {
    if (!currentPayment) return '';
    if (currentPayment.paid_date) {
      if (isPaymentActuallyLate(currentPayment.payment_date, currentPayment.paid_date, currentPayment.status)) {
        return `Pagado con Atraso el ${formatDate(currentPayment.paid_date)}`;
      }
      return `Pagado a Tiempo el ${formatDate(currentPayment.paid_date)}`;
    }
    if (currentPayment.status?.toLowerCase() === 'expired' || currentPayment.status?.toLowerCase() === 'vencido') return 'Vencido - No Pagado';
    if (currentPayment.status?.toLowerCase() === 'pending' || currentPayment.status?.toLowerCase() === 'pendiente') return 'Pendiente de Pago';
    if (currentPayment.status?.toLowerCase() === 'incomplete' || currentPayment.status?.toLowerCase() === 'incompleto') return 'Pago Incompleto';
    return currentPayment.status;
  };

  const paymentStatusBadgeClasses = (): string => {
    if (!currentPayment) return '';
    if (currentPayment.paid_date) {
      return isPaymentActuallyLate(currentPayment.payment_date, currentPayment.paid_date, currentPayment.status) ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
    }
    return getStatusClasses(currentPayment.status);
  }

  if (!show || !currentPayment) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out" style={{ display: show ? 'flex' : 'none'}}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h5 className="text-lg font-semibold text-gray-800">Detalles del Pago - Cuota: {currentPayment.label || currentPayment.installment_number}</h5>
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
                  <p><strong>Cuota (Nombre/ID):</strong> {currentPayment.label || 'N/A'}</p>
                  <p><strong>Número de Cuota:</strong> {currentPayment.installment_number}</p>
                  <p><strong>Referencia del Pago:</strong> {currentPayment.reference || 'N/A'}</p>
                  <p><strong>Método de Pago:</strong> {currentPayment.payment_method || 'N/A'}</p>
                </div>
              </div>
              
              <hr className="my-3"/>
              <div>
                <h6 className="text-sm font-medium text-gray-500">Estado y Fechas</h6>
                <div className="mt-1 space-y-1 text-sm text-gray-700">
                  <p>
                    <strong>Estado General de la Cuota:</strong>{' '}
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(currentPayment.status)}`}>
                      {translateStatus(currentPayment.status)}
                    </span>
                  </p>
                  <p><strong>Fecha de Vencimiento:</strong> {formatDate(currentPayment.payment_date)}</p>
                  <p>
                    <strong>Estado Detallado:</strong>{' '}
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusBadgeClasses()}`}>
                      {paymentStatusText()}
                    </span>
                  </p>
                  {isPaymentActuallyLate(currentPayment.payment_date, currentPayment.paid_date, currentPayment.status) && (
                    <p><strong>Días de Atraso:</strong> {calculateActualDaysOverdue(currentPayment.payment_date, currentPayment.paid_date, currentPayment.status)} días</p>
                  )}
                  <p><strong>Registrado el:</strong> {formatDate(currentPayment.created_at)}</p>
                  <p><strong>Última Actualización:</strong> {formatDate(currentPayment.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-3">
              <div>
                <h6 className="text-sm font-medium text-gray-500">Información Monetaria</h6>
                <div className="mt-1 space-y-1 text-sm text-gray-700">
                  <p><strong>Monto Total Cuota:</strong> <span className="font-bold">{formatCurrency(currentPayment.amount)}</span></p>
                  {currentPayment.status?.toLowerCase() === 'incomplete' || currentPayment.status?.toLowerCase() === 'incompleto' && (
                    <>
                      <p><strong>Monto Pagado:</strong> {formatCurrency(currentPayment.incomplete_amount || 0)}</p>
                      <p><strong>Monto Pendiente:</strong> <span className="text-red-600 font-bold">{formatCurrency(currentPayment.amount - (currentPayment.incomplete_amount || 0))}</span></p>
                    </>
                  )}
                  {(currentPayment.status?.toLowerCase() === 'completado' || currentPayment.status?.toLowerCase() === 'paid') && currentPayment.paid_date && (
                    <p><strong>Monto Efectivamente Pagado:</strong> <span className="text-green-600 font-bold">{formatCurrency(currentPayment.amount)}</span></p>
                  )}
                </div>
              </div>
              
              <hr className="my-3"/>
              <div>
                <h6 className="text-sm font-medium text-gray-500">Comentarios</h6>
                <div className="mt-1 text-sm text-gray-700">
                  <p><strong>Notas:</strong> {currentPayment.notes || 'Sin notas'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Comprobantes */}
          {isPaid && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h6 className="text-sm font-medium text-gray-500 mb-3">Comprobantes de Pago</h6>
              
              {currentPayment.comprobantes && currentPayment.comprobantes.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {currentPayment.comprobantes.map((comp) => (
                    <li key={comp.public_id || comp._id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 text-sm bg-white">
                      <div className="flex items-center space-x-2 flex-grow min-w-0">
                        <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <a 
                          href={comp.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline truncate"
                          title={comp.filename || 'Ver comprobante'}
                        >
                          {comp.filename || 'Ver comprobante'}
                        </a>
                        {comp.uploadedAt && <span className="text-xs text-gray-400 ml-2 flex-shrink-0">({formatDate(comp.uploadedAt)})</span>}
                      </div>
                      <button 
                        onClick={() => handleDeleteComprobante(comp.public_id)}
                        className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 ml-2 flex-shrink-0"
                        title="Eliminar comprobante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No hay comprobantes subidos para este pago.</p>
              )}

              <div 
                {...getRootProps()} 
                className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-blue-500 transition-colors
                            ${isDragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}
                            ${isUploading ? 'opacity-50 cursor-not-allowed' : 'bg-white'}`}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-sm text-gray-600">Subiendo...</p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-blue-600 text-sm flex items-center justify-center"><UploadCloud className="h-5 w-5 mr-2"/>Suelta el archivo aquí...</p>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <UploadCloud className="h-8 w-8 mx-auto mb-2 text-gray-400"/>
                    <p>Arrastra y suelta un archivo aquí, o haz clic para seleccionar.</p>
                    <p className="text-xs mt-1">(Imágenes o PDF, máx 5MB)</p>
                    {acceptedFiles.length > 0 && <p className="text-green-600 mt-1 text-xs">Archivo seleccionado: {acceptedFiles[0].name}</p>}
                  </div>
                )}
              </div>
              {uploadError && (
                <div className="mt-2 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1"/> {uploadError}
                </div>
              )}
            </div>
          )}
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