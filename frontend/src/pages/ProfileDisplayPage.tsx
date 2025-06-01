import React from 'react';
// import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileDisplayPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  console.log(user)
  if (!user) {
    return <p className="text-center text-gray-600 py-10">Cargando perfil...</p>;
  }

  const handleEdit = () => {
    navigate('/profile/edit');
  };

  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-blue-600 p-4 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">Mi Perfil</h2>
          </div>
          <div className="p-6 sm:p-8 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="text-lg font-semibold text-gray-800">{user.name} {user.lastname}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-semibold text-gray-800">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="text-lg font-semibold text-gray-800">{user.phone || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dirección</p>
              <p className="text-lg font-semibold text-gray-800">{user.address || 'No especificada'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CBU</p>
              <p className="text-lg font-semibold text-gray-800">{user.cbu || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Alias CBU</p>
              <p className="text-lg font-semibold text-gray-800">{user.aliasCbu || 'No especificado'}</p>
            </div>
            <div className="mt-6 text-center sm:text-right">
              <button 
                onClick={handleEdit} 
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplayPage; 