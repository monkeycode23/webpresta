import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { BellAlert16Solid } from './icons'; // Usaremos este ícono
import { Notification } from '../types';
import { Link } from 'react-router-dom';

const NotificationItem: React.FC<{ notification: Notification; onRead: (id: string) => void }> = ({ notification, onRead }) => {
  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      case 'info':
      default: return 'border-blue-500';
    }
  };

  return (
    <div 
      className={`p-3 mb-2 border-l-4 ${getNotificationColor(notification.type)} ${notification.read ? 'bg-gray-50' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow duration-150 rounded-r-md cursor-pointer`}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex justify-between items-center">
        <h4 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>{notification.title}</h4>
        {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
      </div>
      <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'} mt-1`}>{notification.message}</p>
      <p className="text-xs text-gray-400 mt-2">{new Date(notification.timestamp).toLocaleString()}</p>
      {notification.link && (
        <Link to={notification.link} className="text-xs text-blue-500 hover:underline mt-1 inline-block">
          Ver detalles
        </Link>
      )}
    </div>
  );
};

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <BellAlert16Solid className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2">
            <span className="block h-full w-full rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
          <div className="p-4 flex justify-between items-center border-b">
            <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
            {notifications.length > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                disabled={unreadCount === 0}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No tienes notificaciones.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2">
              {notifications.map(notif => (
                <NotificationItem key={notif.id} notification={notif} onRead={markAsRead} />
              ))}
            </div>
          )}
          {notifications.length > 0 && (
             <div className="p-2 border-t text-center">
                <button 
                    onClick={clearNotifications} 
                    className="text-sm text-red-500 hover:underline"
                >
                    Limpiar todas
                </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 