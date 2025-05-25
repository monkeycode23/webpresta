import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Modal, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { ResumenCliente, Pago, Prestamo } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from 'components/PaymentModal';


const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenCliente | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchResumen = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const data = await apiService.getResumenCliente(user.id);

         const allPaymentsWithLoanLabel = data.prestamos.prestamos.flatMap((loan: Prestamo) => 
          loan.payments.map((payment: Pago) => ({
            ...payment,
            prestamo_label: loan.label
          }))
        ); 
        console.log(allPaymentsWithLoanLabel);
        console.log(data);
        setResumen({
          ...data,
          pagosRecientes: allPaymentsWithLoanLabel
        });
        setError(null);
      } catch (err: any) {
        console.error('Error al obtener resumen:', err);
        setError('No se pudo cargar la información del resumen. Intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumen();
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
    return new Date(dateString).toLocaleDateString('es-CO');
  };
  
  const handlePaymentClick = (pago: Pago) => {
    setSelectedPayment(pago);
    setShowModal(true);
  };

  const getBadgeVariant = (status: string) => {
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
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }

  if (!resumen) {
    return (
      <Alert variant="info" className="m-3">
        No hay información disponible.
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Bienvenido, {resumen.cliente.nombre}</h1>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100 summary-card">
            <Card.Body>
              <Card.Title>Préstamos Activos</Card.Title>
              <h2 className="text-primary">{resumen.prestamos.activos}</h2>
              <Card.Text>
                De un total de {resumen.prestamos.total} préstamos
              </Card.Text>
            </Card.Body>
            <Card.Footer>
              <Link to="/loans" className="btn btn-sm btn-outline-primary">Ver Préstamos</Link>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 summary-card">
            <Card.Body>
              <Card.Title>Total Prestado</Card.Title>
              <h2 className="text-primary">{formatCurrency(resumen.montos.totalPrestado)}</h2>
              <Card.Text>
                Monto total de préstamos recibidos
              </Card.Text>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">Actualizado a la fecha</small>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 summary-card">
            <Card.Body>
              <Card.Title>Pendiente por Pagar</Card.Title>
              <h2 className="text-primary">{formatCurrency(resumen.montos.totalPendiente)}</h2>
              <Card.Text>
                De {formatCurrency(resumen.montos.totalPagado)} ya pagados
              </Card.Text>
            </Card.Body>
            <Card.Footer>
              <Link to="/payments" className="btn btn-sm btn-outline-primary">Ver Pagos</Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <h3 className="mb-3">Pagos Recientes</h3>
      {resumen.pagosRecientes && resumen.pagosRecientes.length > 0 ? (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <table className="table payment-history-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Préstamo</th>
                    <th>Cuota</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.pagosRecientes.map((pago: Pago) => (
                    <tr
                      key={pago._id}
                      onClick={() => handlePaymentClick(pago)}
                      style={{ cursor: 'pointer' }}
                      className="payment-row"
                    >
                      <td>{formatDate(pago.payment_date)}</td>
                      <td>
                        {pago.prestamo_label}
                      </td>
                      <td>{pago.label}</td>
                      <td>{formatCurrency(pago.amount)}</td>
                      <td>{pago.payment_method || 'Efectivo'}</td>
                      <td>
                        <Badge bg={getBadgeVariant(pago.status)}>
                          {pago.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
          <Card.Footer className="text-center">
            <Link to="/payments" className="btn btn-primary">Ver Todos los Pagos</Link>
          </Card.Footer>
        </Card>
      ) : (
        <Alert variant="info">No hay pagos recientes para mostrar</Alert>
      )}

      {/* <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Pago</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <div className="payment-details">
              <Row className="mb-3">
                <Col md={6}>
                  <h6 className="text-muted">Información del Pago</h6>
                  <div className="mb-2">
                    <strong>Estado:</strong>{' '}
                    <Badge bg={getBadgeVariant(selectedPayment.status)}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <strong>Fecha de Pago (Programada):</strong>{' '}
                    {formatDate(selectedPayment.payment_date)}
                  </div>
                  <div className="mb-2">
                    <strong>Monto Total:</strong>{' '}
                    {formatCurrency(selectedPayment.amount)}
                  </div>
                  {selectedPayment.status === 'Incompleto' && (
                    <>
                      <div className="mb-2">
                        <strong>Monto Pagado:</strong>{' '}
                        {formatCurrency(selectedPayment.incomplete_amount || 0)}
                      </div>
                      <div className="mb-2">
                        <strong>Monto Pendiente:</strong>{' '}
                        {formatCurrency(selectedPayment.amount - (selectedPayment.incomplete_amount || 0))}
                      </div>
                    </>
                  )}
                  <div className="mb-2">
                    <strong>Método de Pago:</strong> {selectedPayment.payment_method}
                  </div>
                   <div className="mb-2">
                    <strong>Fecha de Registro (Pago):</strong>{' '}
                    {formatDate(selectedPayment.created_at)}
                  </div>
                  <div className="mb-2">
                    <strong>Última Actualización (Pago):</strong>{' '}
                    {formatDate(selectedPayment.updated_at)}
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted">Información de la Cuota</h6>
                   <div className="mb-2">
                    <strong>Préstamo:</strong> {typeof selectedPayment.prestamo === 'object' ? selectedPayment.prestamo.label : 'N/A'}
                  </div>
                  <div className="mb-2">
                    <strong>Cuota:</strong> {selectedPayment.label}
                  </div>
                  <div className="mb-2">
                    <strong>Número de Cuota:</strong> {selectedPayment.installment_number}
                  </div>
                  <div className="mb-2">
                    <strong>Fecha Efectiva de Pago:</strong> {selectedPayment.paid_date ? formatDate(selectedPayment.paid_date) : 'Pendiente de pago'}
                  </div>
                  <div className="mb-2">
                    <strong>Estado del Pago:</strong>{' '}
                    {isPaymentLate(selectedPayment.payment_date, selectedPayment.status) ? (
                       <Badge bg="danger">Atrasado</Badge>
                    ) : (
                       <Badge bg="success">A Tiempo / Pagado</Badge>
                    )}
                  </div>
                   {isPaymentLate(selectedPayment.payment_date, selectedPayment.status) && (
                    <div className="mb-2">
                      <strong>Días de Atraso:</strong>{' '}
                      {calculateDaysOverdue(selectedPayment.payment_date, selectedPayment.status)} días
                    </div>
                  )}
                  <div className="mb-2">
                    <strong>Referencia:</strong> {selectedPayment.reference || 'N/A'}
                  </div>
                  <div className="mb-2">
                    <strong>Notas:</strong> {selectedPayment.notes || 'Sin notas'}
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </button>
        </Modal.Footer>
      </Modal> */}
       <PaymentModal
        show={showModal}
        onHide={() => setShowModal(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default DashboardPage; 