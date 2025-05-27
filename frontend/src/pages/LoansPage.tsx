import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { Prestamo } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const LoansPage: React.FC = () => {
  const { user } = useAuth();
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loanTotals, setLoanTotals] = useState<{[key: string]: {totalPagado: number, totalPendiente: number}}>({});
  const [cuotasPagadas, setCuotasPagadas] = useState<number>(0);
  useEffect(() => {
    const fetchPrestamos = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await apiService.getPrestamosCliente(user._id);
        setPrestamos(data);
        
        // Calculate totals for each loan
        const totals = data.reduce((acc, prestamo) => {
          const totalPagado = prestamo.payments.reduce((sum, pago) => 
            pago.status === 'Completado' ? sum + pago.amount : sum, 0);
          const totalPendiente = prestamo.total_amount - totalPagado;
          
          acc[prestamo._id] = { totalPagado, totalPendiente };
          return acc;
        }, {} as {[key: string]: {totalPagado: number, totalPendiente: number}});
        
        setLoanTotals(totals);
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
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }

  if (prestamos.length === 0) {
    return (
      <Alert variant="info" className="m-3">
        No tiene préstamos registrados en el sistema.
      </Alert>
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

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return 'success';
      case 'En curso':
        return 'primary';
      case 'Vencido':
        return 'danger';
      case 'Pendiente':
        return 'primary';
      case 'Incompleto':
        return 'warning';
      case 'Aprobado':
        return 'info';
      case 'Rechazado':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getProgressPercent = (prestamo: Prestamo) => {
    const totals = loanTotals[prestamo._id] || { totalPagado: 0, totalPendiente: 0 };
    return ((totals.totalPagado / prestamo.total_amount) * 100).toFixed(0);
  };

  return (
    <div>
      <h1 className="mb-4">Mis Préstamos</h1>
      
      <Row>
        {prestamos.map((prestamo) => (
          <Col md={6} lg={4} key={prestamo._id}>
            <Card className="mb-4 card-loan">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">{formatCurrency(prestamo.amount)}</h5>
                  <Badge bg={getBadgeVariant(prestamo.status)}>{prestamo.status}</Badge>
                </div>
                
                <div className="mb-3">
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${getProgressPercent(prestamo)}%` }}
                      aria-valuenow={parseFloat(getProgressPercent(prestamo))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small>{formatCurrency(loanTotals[prestamo._id]?.totalPagado || 0)} pagado</small>
                    <small>{getProgressPercent(prestamo)}%</small>
                  </div>
                </div>
                
                <div className="small mb-3">
                  <div><strong>Plazo:</strong> {prestamo.payment_interval} </div>
                  <div><strong>Tasa:</strong> {prestamo.interest_rate}%</div>
                  <div><strong>Fecha desembolso:</strong> {formatDate(prestamo.loan_date)}</div>
                  <div>
                    <strong>Cuotas Pagadas</strong> {
                      prestamo.payments.filter(pago => pago.status === 'Completado').length
                    } de {prestamo.installment_number}
                  </div>
                </div>
                
                <Link to={`/loans/${prestamo._id}`} className="btn btn-primary w-100">
                  Ver Detalle
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default LoansPage; 