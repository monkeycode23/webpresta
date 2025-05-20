import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={NavLink} to="/dashboard">PrestaWeb</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/dashboard">Inicio</Nav.Link>
            <Nav.Link as={NavLink} to="/loans">Mis Préstamos</Nav.Link>
            {/* <Nav.Link as={NavLink} to="/payments">Mis Pagos</Nav.Link> */}
          </Nav>
          <Nav>
            {user && (
              <Navbar.Text className="me-3">
                Hola, {user.nombre} {user.apellido}
              </Navbar.Text>
            )}
            <Button variant="outline-light" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation; 