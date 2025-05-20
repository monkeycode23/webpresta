import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

const LoginPage: React.FC = () => {
  const [codigoAcceso, setCodigoAcceso] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!codigoAcceso) {
      return;
    }
    
    try {
      await dispatch(login({ codigoAcceso })).unwrap();
    } catch (error) {
      // El error ya está manejado por el reducer
      console.error('Error en el login:', error);
    }
  };

  return (
    <div className="auth-container">
      <Container className="auth-form-container">
        <div className="auth-logo">
          <h1>PrestaWeb</h1>
          <p className="text-muted">Sistema de Gestión de Préstamos</p>
        </div>
        
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Iniciar Sesión</h2>
            
            {error && (
              <Alert variant="danger" onClose={() => dispatch(clearError())} dismissible>
                {error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formCodigoAcceso">
                <Form.Label>Código de Acceso</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese su código de acceso"
                  value={codigoAcceso}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCodigoAcceso(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </Form.Group>
              
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mt-3" 
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        
        <div className="text-center mt-3">
          <small className="text-muted">
            Si olvidó su código de acceso o no tiene uno, por favor contacte al administrador.
          </small>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage; 