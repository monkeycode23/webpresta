import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import apiService, { DetallePrestamo, Pago } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../components/PaymentModal';

const LoanDetailPage: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detallePrestamo, setDetallePrestamo] = useState<DetallePrestamo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    console.log("LoanDetailPage: useEffect triggered. Current ID:", loanId);
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
        console.log("DetallePrestamo:", data);
        setDetallePrestamo(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching loan details:', err);
        setError('Error al cargar los detalles del préstamo');
        setDetallePrestamo(null); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetallePrestamo();
  }, [loanId]);

  const formatCurrencyForTable = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDateForTable = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBadgeVariantForTable = (status: string): string => {
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

  const vencidosPagosList = detallePrestamo.pagos.filter(cuota => cuota.status === 'Vencido');
  const historialPagosList = detallePrestamo.pagos
    .filter(pago => pago.status === 'Completado' || pago.status === 'Incompleto')
    .reverse();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detalles del Préstamo</h2>
        <Link to="/loans" className="btn btn-outline-secondary">
          Volver a Préstamos
        </Link>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Información General</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Monto</div>
              <div className="h4">{formatCurrencyForTable(detallePrestamo.prestamo.amount)}</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Estado</div>
              <div>
                <Badge bg={getBadgeVariantForTable(detallePrestamo.prestamo.status)}>
                  {detallePrestamo.prestamo.status}
                </Badge>
              </div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Tasa de Interés</div>
              <div>{detallePrestamo.prestamo.interest_rate}%</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Plazo</div>
              <div>{detallePrestamo.prestamo.payment_interval}</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Numero de Cuotas</div>
              <div>{detallePrestamo.prestamo.installment_number}</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Fecha Desembolso</div>
              <div>{formatDateForTable(detallePrestamo.prestamo.loan_date)}</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Fecha Vencimiento</div>
              <div>{formatDateForTable(detallePrestamo.prestamo.due_date)}</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Propósito</div>
              <div>{detallePrestamo.prestamo.proposito || 'No especificado'}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Resumen de Pagos</h4>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <div className="text-muted mb-1">Progreso</div>
            <ProgressBar now={parseFloat(detallePrestamo.resumen.porcentajePagado)} label={`${detallePrestamo.resumen.porcentajePagado}%`} />
          </div>
          
          <Row>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Cuotas Pagadas</div>
              <div>{detallePrestamo.resumen.cuotasPagadas} de {detallePrestamo.prestamo.installment_number}</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Cuotas Restantes</div>
              <div>{detallePrestamo.resumen.cuotasRestantes}</div>
            </Col>
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Total Pagado</div>
              <div>{formatCurrencyForTable(detallePrestamo.resumen.totalPagado)}</div>
            </Col>   
            <Col sm={6} className="mb-3">
              <div className="text-muted small">Monto Restante</div>
              <div>{formatCurrencyForTable(detallePrestamo.resumen.montoRestante)}</div>
            </Col>
            <Col sm={12} className="mb-3">
              <div className="text-muted small">Próxima Fecha de Pago</div>
              <div>
                {detallePrestamo.resumen.proximaFechaPago ? (
                  formatDateForTable(detallePrestamo.resumen.proximaFechaPago)
                ) : (
                  'No aplica'
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Cuotas Pendientes</h4>
        </Card.Header>
        <Card.Body>
          {detallePrestamo.cuotasRestantesProgramadas.length === 0 ? (
            <Alert variant="success">No hay cuotas pendientes. ¡Préstamo completamente pagado!</Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Cuota</th>
                    <th>Fecha Estimada</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {detallePrestamo.pagos.filter(pago => pago.status === 'Pendiente').map((cuota, index) => (
                    <tr key={index}  onClick={() => handlePaymentClick(cuota)}  style={{cursor: 'pointer'}}>
                      <td>{cuota.label}</td>
                      <td>{formatDateForTable(cuota.payment_date)}</td>
                      <td>{formatCurrencyForTable(cuota.amount)}</td>
                      <td>
                        <Badge bg={getBadgeVariantForTable(cuota.status)}>
                          {cuota.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Cuotas Vencidas</h4>
        </Card.Header>
        <Card.Body>
          {vencidosPagosList.length === 0 ? (
            <Alert variant="success">No hay cuotas vencidas.</Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Cuota</th>
                    <th>Fecha de Pago</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {vencidosPagosList.map((cuota, index) => (
                    <tr key={index} onClick={() => handlePaymentClick(cuota)} style={{cursor: 'pointer'}}>
                      <td>{cuota.label}</td>
                      <td>{formatDateForTable(cuota.payment_date)}</td>
                      <td>{formatCurrencyForTable(cuota.amount)}</td>
                      <td>
                        <Badge bg="danger">Vencido</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h4 className="mb-0">Historial de Pagos</h4>
        </Card.Header>
        <Card.Body>
          {historialPagosList.length === 0 ? (
            <Alert variant="info">No hay pagos registrados para este préstamo.</Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cuota</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPagosList.map((pago) => (
                    <tr 
                      key={pago._id}
                      onClick={() => handlePaymentClick(pago)}
                      style={{ cursor: 'pointer' }}
                      className="payment-row"
                    >
                      <td>{formatDateForTable(pago.payment_date)}</td>
                      <td>{pago.label}</td>
                      <td>{formatCurrencyForTable(pago.amount)}</td>
                      <td>{pago.payment_method}</td>
                      <td>
                        <Badge bg={getBadgeVariantForTable(pago.status)}>
                          {pago.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <PaymentModal
        show={showModal}
        onHide={() => setShowModal(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default LoanDetailPage; 