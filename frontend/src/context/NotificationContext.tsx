import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Notification } from '../types'; // Asegúrate que la ruta a types/index.ts es correcta
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos para las notificaciones
import socketService from '../services/socketService'; // Importar socketService
import { useAuth } from './AuthContext'; // Importar useAuth

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  addRawNotification: (notification: Notification) => void; // Para notificaciones directas del socket
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated, user } = useAuth(); // Obtener estado de autenticación

  useEffect(() => {
    // Calcular no leídas cuando cambian las notificaciones
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Limitar a 20 notificaciones
  };

  // Función para añadir una notificación que ya viene con id, timestamp y read (del backend)
  const addRawNotification = (notification: Notification) => {
    setNotifications(prev => {
        // Evitar duplicados si la notificación ya existe por alguna razón
        if (prev.find(n => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 20); 
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect();
      console.log('NotificationContext: Socket connected for user:', user._id);

      const handleNewNotification = (notification: Notification) => {
        console.log('Raw notification received from socket:', notification);
        // Aquí asumimos que la notificación del backend ya tiene id, timestamp y read (probablemente false)
        addRawNotification(notification); 
      };

      socketService.on('new_notification', handleNewNotification);
      
      // Aquí podrías cargar notificaciones iniciales/persistidas si es necesario
      // Ejemplo: fetchInitialNotifications();

      return () => {
        console.log('NotificationContext: Disconnecting socket for user:', user._id);
        socketService.off('new_notification', handleNewNotification);
        // No desconectar globalmente aquí, podría ser usado por otros contextos.
        // socketService.disconnect(); // Desconectar solo si este es el único consumidor
      };
    } else {
        // Si no está autenticado, asegurarse de que no haya listeners activos de notificaciones.
        socketService.off('new_notification');
        // Opcionalmente desconectar si es el momento adecuado:
        // socketService.disconnect(); 
    }
  }, [isAuthenticated, user]);

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        unreadCount,
        addNotification, // Para añadir notificaciones manualmente desde el frontend (ej. errores locales)
        addRawNotification, // Para notificaciones del socket
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 