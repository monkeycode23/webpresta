import React from 'react';
import { Modal, Row, Col, Badge } from 'react-bootstrap';
import { Pago, Prestamo } from '../services/api'; // Assuming Pago might contain Prestamo object

interface PaymentModalProps {
  show: boolean;
  onHide: () => void;
  payment: Pago | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ show, onHide, payment }) => {
  if (!payment) {
    return null;
  }

  // Helper functions (copied from LoanDetailPage/DashboardPage for now)
  // Consider moving these to a shared utils file if used elsewhere
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', { // Using es-GT as per LoanDetailPage
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

  const getBadgeVariant = (status: string): string => {
    switch (status) {
      case 'Completado':
        return 'success';
      case 'Pendiente':
        return 'primary';
      case 'Incompleto':
        return 'warning';
      case 'Vencido':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const isPaymentActuallyLate = (paymentDate: string, paidDate?: string | null, status?: string): boolean => {
    // If already paid or completed, it's not "late" in terms of needing action.
    // It might have been paid late, but its current state is resolved.
    if (status === 'Completado' || status === 'Pagado') {
      if (paidDate) {
        const dueDate = new Date(paymentDate);
        const actualPaidDate = new Date(paidDate);
        dueDate.setHours(0, 0, 0, 0);
        actualPaidDate.setHours(0, 0, 0, 0);
        return actualPaidDate > dueDate; // Was it paid after its due date?
      }
      return false; // Paid, but no paid_date to compare, assume on time or not relevant for "days overdue"
    }
    // For pending/incomplete/vencido, compare payment_date (due date) to today
    const dueDate = new Date(paymentDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return today > dueDate; // Is today past the due date and still not fully paid?
  };

  const calculateActualDaysOverdue = (paymentDate: string, paidDate?: string | null, status?: string): number => {
    if (status === 'Completado' || status === 'Pagado') {
      if (paidDate) {
        const dueDate = new Date(paymentDate);
        const actualPaidDate = new Date(paidDate);
        dueDate.setHours(0, 0, 0, 0);
        actualPaidDate.setHours(0, 0, 0, 0);
        if (actualPaidDate > dueDate) {
          return Math.floor((actualPaidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
      return 0; // Not overdue or paid on time
    }

    // For pending/incomplete/vencido payments
    const dueDate = new Date(paymentDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (today <= dueDate) return 0;
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const prestamoLabel = payment.prestamo_label;

  const paymentStatusText = () => {
    if (payment.paid_date) {
      if (isPaymentActuallyLate(payment.payment_date, payment.paid_date, payment.status)) {
        return `Pagado con Atraso el ${formatDate(payment.paid_date)}`;
      }
      return `Pagado a Tiempo el ${formatDate(payment.paid_date)}`;
    }
    if (payment.status === 'Vencido') {
      return 'Vencido - No Pagado';
    }
    if (payment.status === 'Pendiente') {
      return 'Pendiente de Pago';
    }
    if (payment.status === 'Incompleto') {
      return 'Pago Incompleto';
    }
    return payment.status; // Fallback
  };

  const paymentStatusBadgeVariant = () => {
    if (payment.paid_date) {
      return isPaymentActuallyLate(payment.payment_date, payment.paid_date, payment.status) ? 'warning' : 'success';
    }
    return getBadgeVariant(payment.status); // Default to overall status if not explicitly paid
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalles del Pago - Cuota: {payment.label || payment.installment_number}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="payment-details">
          <Row>
            {/* Columna Izquierda: Detalles del Préstamo y Cuota */}
            <Col md={6} className="mb-3 mb-md-0">
              <h6 className="text-muted">Identificación</h6>
              <div className="mb-2">
                <strong>Préstamo:</strong> {prestamoLabel}
              </div>
              <div className="mb-2">
                <strong>Cuota (Nombre/ID):</strong> {payment.label || 'N/A'}
              </div>

              <div className="mb-2">
                <strong>Referencia del Pago:</strong> {payment.reference || 'N/A'}
              </div>
              <div className="mb-2">
                <strong>Método de Pago:</strong> {payment.payment_method || 'N/A'}
              </div>

              <hr className="my-3" />
              <h6 className="text-muted">Estado y Fechas</h6>
              <div className="mb-2">
                <strong>Estado General de la Cuota:</strong>{' '}
                <Badge bg={getBadgeVariant(payment.status)}>
                  {payment.status}
                </Badge>
              </div>
              <div className="mb-2">
                <strong>Fecha de Vencimiento:</strong>{' '}
                {formatDate(payment.payment_date)}
              </div>
              <div className="mb-2">
                <strong>Estado Detallado:</strong>{' '}
                <Badge bg={paymentStatusBadgeVariant()}>
                  {paymentStatusText()}
                </Badge>
              </div>
              {isPaymentActuallyLate(payment.payment_date, payment.paid_date, payment.status) && (
                <div className="mb-2">
                  <strong>Días de Atraso:</strong>{' '}
                  {calculateActualDaysOverdue(payment.payment_date, payment.paid_date, payment.status)} días
                </div>
              )}
              <div className="mb-2">
                <strong>Registrado el:</strong>{' '}
                {formatDate(payment.created_at)}
              </div>
              <div className="mb-2">
                <strong>Última Actualización:</strong>{' '}
                {formatDate(payment.updated_at)}
              </div>
            </Col>

            {/* Columna Derecha: Montos y Notas */}
            <Col md={6}>
              <h6 className="text-muted">Información Monetaria</h6>
              <div className="mb-2">
                <strong>Monto Total Cuota:</strong>{' '}
                <span className="fw-bold">{formatCurrency(payment.amount)}</span>
              </div>
              {payment.status === 'Incompleto' && (
                <>
                  <div className="mb-2">
                    <strong>Monto Pagado:</strong>{' '}
                    {formatCurrency(payment.incomplete_amount || 0)}
                  </div>
                  <div className="mb-2">
                    <strong>Monto Pendiente:</strong>{' '}
                    <span className="text-danger fw-bold">{formatCurrency(payment.amount - (payment.incomplete_amount || 0))}</span>
                  </div>
                </>
              )}
              {(payment.status === 'Completado' || payment.status === 'Pagado') && payment.paid_date && (
                <div className="mb-2">
                  <strong>Monto Efectivamente Pagado:</strong>{' '}
                  <span className="text-success fw-bold">{formatCurrency(payment.amount)}</span>
                </div>
              )}

              <hr className="my-3" />
              <h6 className="text-muted">Comentarios</h6>
              <div className="mb-2">
                {/* <strong>Notas:</strong> {payment.notes || 'Sin notas'} */}
                Sin comentarios
              </div>
            </Col>
          </Row>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentModal; 