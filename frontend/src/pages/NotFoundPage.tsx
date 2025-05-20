import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <Container className="text-center py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <h1 className="display-1 fw-bold">404</h1>
          <h2 className="mb-4">Página no encontrada</h2>
          <p className="lead mb-4">
            La página que estás buscando no existe o ha sido movida.
          </p>
          <Link to="/dashboard">
            <Button variant="primary">Volver al inicio</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage; 