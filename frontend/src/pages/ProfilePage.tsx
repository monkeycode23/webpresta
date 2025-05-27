import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Cliente } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUserProfileInSlice } from '../store/slices/authSlice';
// Import your Redux dispatch and user fetch action if available
// import { useDispatch } from 'react-redux';
// import { fetchUserAction } from '../store/slices/authSlice'; 

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<Partial<Cliente>>({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    cbu: '',
    aliasCbu: '',
    nickname: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        cbu: user.cbu || '',
        aliasCbu: user.aliasCbu || '',
        nickname: user.nickname || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { nickname, ...apiData } = formData;
    const profileDataToUpdate: Partial<Omit<Cliente, '_id' | 'codigoAcceso' | 'nickname'>> = {};

    (Object.keys(apiData) as Array<keyof typeof apiData>).forEach(key => {
        if (apiData[key] !== '' && apiData[key] !== null && key !== 'nickname') {
            profileDataToUpdate[key] = apiData[key] as any;
        }
    });

    try {
      const response = await apiService.updateProfile(profileDataToUpdate);
      setSuccess(response.mensaje || 'Perfil actualizado con éxito');
      if (response.cliente) {
        dispatch(updateUserProfileInSlice(response.cliente)); 
      }
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p>Cargando perfil...</p>;
  }

  return (
    <Container className="mt-4">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2>Editar Perfil</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formName">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formLastname">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPhone">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formAddress">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formCbu">
                  <Form.Label>CBU</Form.Label>
                  <Form.Control
                    type="text"
                    name="cbu"
                    value={formData.cbu}
                    onChange={handleChange}
                    pattern="[0-9]{22}"
                    title="El CBU debe tener 22 dígitos."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formAliasCbu">
                  <Form.Label>Alias CBU</Form.Label>
                  <Form.Control
                    type="text"
                    name="aliasCbu"
                    value={formData.aliasCbu}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage; 