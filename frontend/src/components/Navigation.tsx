import React, { useState/*, useEffect*/ } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  // State for mobile menu visibility (you'll need to implement toggle logic)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Estado para notificaciones
  const [notifications, /*setNotifications*/] = useState<any[]>([]);
  const [unreadCount, /*setUnreadCount*/] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // useEffect(() => {
  //   if (!user) return; 
  //   socket.on('new_notification', (notification) => {
  //     setNotifications(prev => [notification, ...prev].slice(0, 10)); 
  //     if (!notification.read) {
  //        setUnreadCount(prev => prev + 1);
  //     }
  //   });
  //   const fetchNotifications = async () => {
  //     try {
  //       const token = localStorage.getItem('authToken'); 
  //       if (!token) return;
  //       const endpoint = '/api/notifications/client'; 
  //       const response = await fetch(endpoint, {
  //         headers: { 'Authorization': `Bearer ${token}` }
  //       });
  //       if (response.ok) {
  //         const data = await response.json();
  //         setNotifications(data.slice(0, 10));
  //         setUnreadCount(data.filter(n => !n.read).length);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching notifications:", error);
  //     }
  //   };
  //   fetchNotifications();
  //   // socket.auth = { token: localStorage.getItem('authToken') }; 
  //   // socket.connect();
  //   return () => {
  //     socket.off('new_notification');
  //     // socket.disconnect();
  //   };
  // }, [user]); 

  // const handleMarkAsRead = async (notificationId: string) => {
  //   try {
  //     const token = localStorage.getItem('authToken');
  //     const response = await fetch(`/api/notifications/${notificationId}/read`, {
  //       method: 'PATCH',
  //       headers: { 'Authorization': `Bearer ${token}` }
  //     });
  //     if (response.ok) {
  //        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
  //        setUnreadCount(prev => Math.max(0, prev - 1));
  //     }
  //   } catch (error) {
  //     console.error("Error marking notification as read:", error);
  //   }
  // };

  return (
    <nav className="bg-blue-600 text-white p-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <NavLink to="/dashboard" className="text-xl font-bold hover:text-blue-200">PrestaWeb</NavLink>
        
        <div className="flex items-center">
          {/* Desktop Menu & Mobile Menu (conditionally rendered) - Agrupado con notificaciones y botón de logout */}
          <div className={`lg:flex items-center space-x-4 ${isMobileMenuOpen ? 'block' : 'hidden'} absolute lg:static top-16 left-0 right-0 w-full lg:w-auto bg-blue-600 lg:bg-transparent p-4 lg:p-0 shadow-md lg:shadow-none z-10`}>
            <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Inicio</NavLink>
            <NavLink to="/loans" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Mis Préstamos</NavLink>
            <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block lg:inline-block py-2 lg:py-0 ${isActive ? "text-blue-200 font-semibold" : "hover:text-blue-200"}`}>Mi Perfil</NavLink>
            
            {/* Contenedor para notificaciones y logout, visible en desktop y mobile expandido */}
            <div className="mt-4 lg:mt-0 lg:ml-4 flex flex-col lg:flex-row items-start lg:items-center">
              {/* Notification Icon and Dropdown - Integrado aquí */}
              {user && (
                <div className="relative mr-3">
                  <button onClick={() => setShowNotificationDropdown(!showNotificationDropdown)} className="relative p-2 rounded hover:bg-blue-700">
                    ntific
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                      <div className="py-2 px-4 text-gray-700 font-semibold border-b">Notificaciones</div>
                      {notifications.length === 0 ? (
                        <p className="text-gray-700 p-4 text-sm">No tienes notificaciones nuevas.</p>
                      ) : (
                        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                          {notifications.map(notif => (
                            <li key={notif._id} className={`p-3 hover:bg-gray-50 ${!notif.read ? 'bg-blue-50' : ''}`}>
                              <Link 
                                to={notif.link || '#'} 
                                onClick={() => {
                                  setShowNotificationDropdown(false);
                                }}
                                className="block"
                              >
                                <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.message}</p>
                                <p className={`text-xs ${!notif.read ? 'text-blue-600' : 'text-gray-500'}`}>
                                  {new Date(notif.created_at).toLocaleString()}
                                </p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {user && (
                <span className="mb-2 lg:mb-0 lg:mr-3 text-sm">
                  Hola, {user.nickname || `${user.name} ${user.lastname}`}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="w-full lg:w-auto px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Toggle Button - movido al final del flex container para mejor alineación */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 