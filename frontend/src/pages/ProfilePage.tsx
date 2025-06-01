import React, { useState, useEffect } from 'react';
// import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap'; // Eliminadas importaciones de react-bootstrap
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
// No importamos Cliente de apiService para evitar confusión con el tipo de AuthContext
// import { Cliente as ApiCliente } from '../services/api'; 
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUserProfileInSlice, Cliente } from '../store/slices/authSlice'; // Importar Cliente de authSlice si es el tipo del frontend
// Import your Redux dispatch and user fetch action if available
// import { useDispatch } from 'react-redux';
// import { fetchUserAction } from '../store/slices/authSlice'; 
import LoadingSpinner from '../components/LoadingSpinner'; // Asumiendo que tienes un spinner

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
    // nickname no está en el formulario de edición directamente, se toma de user
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
        // nickname: user.nickname || '', // No se establece en formData si no se edita
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

    // Preparamos solo los campos que se envían a la API
    // El tipo Cliente aquí debería ser el que espera la API
    // Asumimos que es similar al Cliente del frontend pero sin id, codigoAcceso, nickname
    const profileDataToUpdate: Partial<Omit<Cliente, 'id' | 'codigoAcceso' | 'nickname'>> = {};

    // Iterar sobre las claves de formData que son editables y existen en Cliente (sin id, codigoAcceso, nickname)
    const editableKeys: Array<keyof typeof profileDataToUpdate> = [
        'name', 'lastname', 'email', 'phone', 'address', 'cbu', 'aliasCbu'
    ];

    editableKeys.forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) { // Enviar solo si tiene un valor (incluso string vacío si se permite)
            profileDataToUpdate[key] = formData[key] as any; // Usamos as any por simplicidad, idealmente tipar mejor
        }
    });
    
    // Filtrar campos que no se quieren enviar si están vacíos, si es necesario
    // Por ejemplo, si no se quiere enviar un CBU vacío:
    // if (profileDataToUpdate.cbu === '') delete profileDataToUpdate.cbu;

    try {
      const response = await apiService.updateProfile(profileDataToUpdate);
      setSuccess(response.mensaje || 'Perfil actualizado con éxito');
      if (response.cliente) {
        // Asegurarse que response.cliente sea compatible con el Cliente de authSlice
        dispatch(updateUserProfileInSlice(response.cliente as Cliente)); 
      }
      setTimeout(() => {
        navigate('/profile'); // Podría ser mejor ir a /dashboard o la página donde se vea el cambio
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user && loading) { // Mostrar spinner si user no está y está cargando (estado inicial)
    return <LoadingSpinner />;
  }
  if (!user) { // Si después de cargar, user sigue sin estar, mostrar mensaje o redirigir
    return <p className="text-center p-4">Usuario no encontrado o no autenticado.</p>;
  }

  return (
    <div className="container mx-auto mt-4 p-4 max-w-3xl"> {/* Container -> div con clases Tailwind */} 
      <div className="md:flex md:justify-center"> {/* Row justify-content-md-center -> div flex */} 
        <div className="md:w-full"> {/* Col md={8} -> div con ancho Tailwind */} 
          <h2 className="text-2xl font-semibold mb-6 text-center">Editar Perfil</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Row -> grid */} 
              <div> {/* Col md={6} */}
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div> {/* Col md={6} */}
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  id="lastname"
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                // readOnly // Si el email no es editable
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Row -> grid */} 
              <div> {/* Col md={6} */}
                <label htmlFor="cbu" className="block text-sm font-medium text-gray-700">CBU</label>
                <input
                  id="cbu"
                  type="text"
                  name="cbu"
                  value={formData.cbu}
                  onChange={handleChange}
                  pattern="[0-9]{22}"
                  title="El CBU debe tener 22 dígitos."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div> {/* Col md={6} */}
                <label htmlFor="aliasCbu" className="block text-sm font-medium text-gray-700">Alias CBU</label>
                <input
                  id="aliasCbu"
                  type="text"
                  name="aliasCbu"
                  value={formData.aliasCbu}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner /> {/* Asumiendo que LoadingSpinner es pequeño o se ajusta */}
                  <span className="ml-2">Actualizando...</span>
                </>
              ) : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 