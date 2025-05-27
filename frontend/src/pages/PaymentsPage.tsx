import React, { useState, useEffect } from 'react';
import { Card, Tab, Tabs, Table, Alert, Badge, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { Pago, PagosPendientesResponse, PagosHistorialResponse } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('pending');
  
  // Estado para pagos pendientes
  const [pagosPendientes, setPagosPendientes] = useState<PagosPendientesResponse | null>(null);
  const [loadingPendientes, setLoadingPendientes] = useState<boolean>(true);
  const [errorPendientes, setErrorPendientes] = useState<string | null>(null);
  
  // Estado para historial de pagos
  const [historialPagos, setHistorialPagos] = useState<PagosHistorialResponse | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState<boolean>(true);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Cargar pagos pendientes
  useEffect(() => {
    const fetchPagosPendientes = async () => {
      if (!user) return;
      
      try {
        setLoadingPendientes(true);
        const data = await apiService.getPagosPendientes(user._id);
        console.log("data", data);
        setPagosPendientes(data);
        setErrorPendientes(null);
      } catch (err: any) {
        console.error('Error al obtener pagos pendientes:', err);
        setErrorPendientes('No se pudieron cargar los pagos pendientes. Intente nuevamente.');
      } finally {
        setLoadingPendientes(false);
      }
    };

    //console.log(fetchPagosPendientes);

    if (activeTab === 'pending') {
      fetchPagosPendientes();
    }
  }, [user, activeTab]);

  // Cargar historial de pagos
  useEffect(() => {
    const fetchHistorialPagos = async () => {
      if (!user) return;
      
      try {
        setLoadingHistorial(true);
        const data = await apiService.getHistorialPagos(user._id, currentPage, limit);
        setHistorialPagos(data);
        setErrorHistorial(null);
      } catch (err: any) {
        console.error('Error al obtener historial de pagos:', err);
        setErrorHistorial('No se pudo cargar el historial de pagos. Intente nuevamente.');
      } finally {
        setLoadingHistorial(false);
      }
    };

    if (activeTab === 'history') {
      fetchHistorialPagos();
    }
  }, [user, activeTab, currentPage, limit]);

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

  const renderPaginationItems = () => {
    if (!historialPagos || !historialPagos.paginacion) return null;
    
    const { totalPages, currentPage } = historialPagos.paginacion;
    const items = [];
    
    // Flecha "anterior"
    items.push(
      <Pagination.Prev 
        key="prev"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      />
    );
    
    // Primera página
    if (currentPage > 2) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
    }
    
    // Elipsis si es necesario
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
    
    // Página anterior si no es la primera
    if (currentPage > 1) {
      items.push(
        <Pagination.Item key={currentPage - 1} onClick={() => setCurrentPage(currentPage - 1)}>
          {currentPage - 1}
        </Pagination.Item>
      );
    }
    
    // Página actual
    items.push(
      <Pagination.Item key={currentPage} active>
        {currentPage}
      </Pagination.Item>
    );
    
    // Página siguiente si no es la última
    if (currentPage < totalPages) {
      items.push(
        <Pagination.Item key={currentPage + 1} onClick={() => setCurrentPage(currentPage + 1)}>
          {currentPage + 1}
        </Pagination.Item>
      );
    }
    
    // Elipsis si es necesario
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    
    // Última página
    if (currentPage < totalPages - 1) {
      items.push(
        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Flecha "siguiente"
    items.push(
      <Pagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      />
    );
    
    return items;
  };

  return (
    <div>
      <h1 className="mb-4">Mis Pagos</h1>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="pending" title="Pagos Pendientes">
          {loadingPendientes ? (
            <LoadingSpinner />
          ) : errorPendientes ? (
            <Alert variant="danger">{errorPendientes}</Alert>
          ) : !pagosPendientes || pagosPendientes.pagosPendientes.length === 0 ? (
            <Alert variant="info">No tiene pagos pendientes.</Alert>
          ) : (
            <Card>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Préstamo</th>
                        <th>Fecha Estimada</th>
                        <th>Cuota</th>
                        <th>Monto</th>
                        <th>Días Restantes</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                     {pagosPendientes.pagosPendientes.map((item, index) => (
                      <>
                      {
                        item.proximoPago ? (
                          <tr key={index}>
                            <td>{item.prestamo.label}</td>
                            <td>{formatDate(item.proximoPago.payment_date)}</td>
                            <td>{item.proximoPago.installment_number} de {item.prestamo.numeroCuotas}</td>
                            <td>{formatCurrency(item.proximoPago.amount)}</td>
                            <td>{Math.abs(Math.floor((new Date().getTime() - new Date(item.proximoPago.payment_date).getTime()) / (1000 * 60 * 60 * 24)))} días</td>
                            <td>
                              <Link to={`/loans/${item.prestamo.id}`} className="btn btn-sm btn-primary">
                                Detalles
                              </Link>
                            </td>
                          </tr>
                        ) : (
                          <tr key={index}>
                            <td>{item.prestamo.label}</td>
                            <td>No hay proximo pago</td>
                          </tr>
                        )   
                      }
                      </>
                     ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Tab>
        
        <Tab eventKey="history" title="Historial de Pagos">
          {loadingHistorial ? (
            <LoadingSpinner />
          ) : errorHistorial ? (
            <Alert variant="danger">{errorHistorial}</Alert>
          ) : !historialPagos || historialPagos.pagos.length === 0 ? (
            <Alert variant="info">No tiene historial de pagos.</Alert>
          ) : (
            <>
              <Card>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover className="payment-history-table">
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
                        {historialPagos.pagos.map((pago) => (
                          <tr key={pago._id}>
                            <td>{formatDate(pago.payment_date)}</td>
                            <td>
                              {typeof pago.prestamo === 'object' && pago.prestamo !== null ? (
                                <Link to={`/loans/${pago.prestamo._id}`}>
                                  {formatCurrency(pago.prestamo.amount)}
                                </Link>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td>{pago.installment_number}</td>
                            <td>{formatCurrency(pago.amount)}</td>
                            <td>efectivo</td>
                            <td>
                              <Badge bg={pago.status === 'Completado' ? 'success' : pago.status === 'Incompleto' ? 'warning' : 'primary'}>
                                {pago.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
              
              {historialPagos.paginacion.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>{renderPaginationItems()}</Pagination>
                </div>
              )}
            </>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default PaymentsPage; 