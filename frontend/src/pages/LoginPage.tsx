import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
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
     const res= await dispatch(login({ codigoAcceso })).unwrap();
     console.log(res)
    } catch (error) {
      // El error ya está manejado por el reducer
      console.error('Error en el login:', error);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center bg-gray-100"
    >
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          {/* Consider adding an <img> tag here if you have a graphical logo */}
          <h1 className="text-4xl font-bold text-blue-700">PrestaWeb</h1>
          <p className="text-gray-600">Sistema de Gestión de Préstamos</p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-center mb-6">Iniciar Sesión</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
              <button 
                onClick={() => dispatch(clearError())} 
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="codigoAcceso" className="block text-sm font-medium text-gray-700 mb-1">Código de Acceso</label>
              <input
                type="text"
                id="codigoAcceso"
                placeholder="Ingrese su código de acceso"
                value={codigoAcceso}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCodigoAcceso(e.target.value)}
                disabled={isLoading}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full mt-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-4">
          <small className="text-gray-600">
            Si olvidó su código de acceso o no tiene uno, por favor contacte al administrador.
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 