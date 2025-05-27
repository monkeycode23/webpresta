import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileDisplayPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  console.log(user)
  if (!user) {
    return <p>Cargando perfil...</p>;
  }

  const handleEdit = () => {
    navigate('/profile/edit');
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h2">Mi Perfil</Card.Header>
            <Card.Body>
              <Card.Text><strong>Nombre:</strong> {user.name} {user.lastname}</Card.Text>
              <Card.Text><strong>Email:</strong> {user.email}</Card.Text>
              <Card.Text><strong>Teléfono:</strong> {user.phone || 'No especificado'}</Card.Text>
              <Card.Text><strong>Dirección:</strong> {user.address || 'No especificada'}</Card.Text>
              <Card.Text><strong>CBU:</strong> {user.cbu || 'No especificado'}</Card.Text>
              <Card.Text><strong>Alias CBU:</strong> {user.aliasCbu || 'No especificado'}</Card.Text>
              <Button variant="primary" onClick={handleEdit} className="mt-3">
                Editar Perfil
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfileDisplayPage; 