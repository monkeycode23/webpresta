import React from 'react';
// import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Página no encontrada</h2>
        <p className="text-lg text-gray-700 mb-8">
          La página que estás buscando no existe o ha sido movida.
        </p>
        <Link to="/dashboard">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Volver al inicio
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 