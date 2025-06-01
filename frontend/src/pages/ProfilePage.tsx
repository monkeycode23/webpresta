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
import { toast } from 'react-toastify'; // Importar toast
import socketService from '../services/socketService';
// Icono de Usuario SVG simple
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

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

    const profileDataToUpdate: Partial<Omit<Cliente, 'id' | 'codigoAcceso' | 'nickname'>> = {};

    const editableKeys: Array<keyof typeof profileDataToUpdate> = [
        'name', 'lastname', 'email', 'phone', 'address', 'cbu', 'aliasCbu'
    ];

    editableKeys.forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
            profileDataToUpdate[key] = formData[key] as any;
        }
    });
    
    try {
      const response = await apiService.updateProfile(profileDataToUpdate);
      toast.success(response.mensaje || 'Perfil actualizado con éxito');
      if (response.cliente) {
        dispatch(updateUserProfileInSlice(response.cliente as Cliente)); 
        socketService.emit('update_client_profile', response.cliente);
      }
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.mensaje || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user && loading) {
    return <LoadingSpinner />;
  }
  if (!user) {
    return <p className="text-center p-4">Usuario no encontrado o no autenticado.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
          <div className="flex flex-col items-center mb-8">
            <UserIcon />
            <h2 className="text-3xl font-bold text-gray-800 mt-4">Hola, {user.nickname || user.name}!</h2>
            <p className="text-gray-600">Administra la información de tu perfil.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
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
              <div>
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
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Información Bancaria</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
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
                <div>
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
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Actualizando...</span>
                  </>
                ) : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 