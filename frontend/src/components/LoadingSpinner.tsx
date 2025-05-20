import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const LoadingSpinner: React.FC = () => {
  return (
    <Container className="loader-container">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Cargando...</span>
      </Spinner>
    </Container>
  );
};

export default LoadingSpinner; 