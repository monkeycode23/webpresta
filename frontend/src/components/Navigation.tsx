import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // State for mobile menu visibility (you'll need to implement toggle logic)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav className="bg-blue-600 text-white p-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <NavLink to="/dashboard" className="text-xl font-bold hover:text-blue-200">PrestaWeb</NavLink>
        
        {/* Mobile Menu Toggle Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {/* Icon (e.g., Hamburger) */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Desktop Menu & Mobile Menu (conditionally rendered) */}
        <div className={`lg:flex items-center space-x-4 ${isMobileMenuOpen ? 'block' : 'hidden'} absolute lg:static top-16 left-0 right-0 bg-blue-600 lg:bg-transparent p-4 lg:p-0 shadow-md lg:shadow-none`}>
          <NavLink to="/dashboard" className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Inicio</NavLink>
          <NavLink to="/loans" className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Mis Préstamos</NavLink>
          <NavLink to="/profile" className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Mi Perfil</NavLink>
          
          <div className="mt-4 lg:mt-0 lg:ml-4 flex flex-col lg:flex-row items-start lg:items-center">
            {user && (
              <span className="mb-2 lg:mb-0 lg:mr-3 text-sm">
                Hola, {user.nickname || `${user.name} ${user.lastname}`}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="w-full lg:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 