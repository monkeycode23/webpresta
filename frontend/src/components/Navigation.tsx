import React, { useState/*, useEffect*/ } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import { Bell20Solid, BellAlert16Solid } from './icons'; // No se usarán directamente aquí
import NotificationBell from './NotificationBell'; // Importar el nuevo componente
// import { HiBell } from 'react-icons/hi'
// import { io } from "socket.io-client"; 

// const socket = io(process.env.REACT_APP_API_URL || "http://localhost:4000"); 
 
const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // State for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // ELIMINAR ESTADO LOCAL DE NOTIFICACIONES ANTIGUO
  // const [notifications, /*setNotifications*/] = useState<any[]>([]);
  // const [unreadCount, /*setUnreadCount*/] = useState(0);
  // const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // ELIMINAR useEffect ANTIGUO DE NOTIFICACIONES

  // ELIMINAR handleMarkAsRead ANTIGUO

  return (
    <nav className="bg-blue-600 text-white p-3 shadow-md fixed top-0 left-0 right-0 z-50"> {/* Asegurar que la nav sea fija y esté por encima */}
      <div className="container mx-auto flex items-center justify-between">
        <NavLink to="/dashboard" className="text-xl font-bold hover:text-blue-200">PrestaWeb</NavLink>
        
        <div className="flex items-center">
          {/* Desktop Menu & Mobile Menu (conditionally rendered) */}
          <div className={`lg:flex items-center space-x-4 ${isMobileMenuOpen ? 'block' : 'hidden'} absolute lg:static top-full left-0 right-0 w-full lg:w-auto bg-blue-600 lg:bg-transparent p-4 lg:p-0 shadow-md lg:shadow-none z-40 lg:z-auto`}>
            <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Inicio</NavLink>
            <NavLink to="/loans" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Mis Préstamos</NavLink>
            <NavLink to="/payments" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Mis Pagos</NavLink> {/* Añadido Mis Pagos */}
            <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Mi Perfil</NavLink>
            
            {/* Contenedor para notificaciones y logout */}
            <div className="mt-4 lg:mt-0 lg:ml-4 flex flex-col lg:flex-row items-start lg:items-center">
              {user && (
                <span className="mb-2 lg:mb-0 lg:mr-3 text-sm">
                  Hola, {user.nickname || `${user.name} ${user.lastname}`.trim() || 'Usuario'}
                </span>
              )}
              
              {/* Integrar NotificationBell aquí */}
              {user && <NotificationBell />}
              
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full lg:w-auto px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2 lg:mt-0 lg:ml-3"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Toggle Button */}
          {/* Solo mostrar si el usuario está logueado */}
          {user && (
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 