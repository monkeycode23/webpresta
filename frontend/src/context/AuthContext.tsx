import React, { createContext, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login as loginAction, logout as logoutAction } from '../store/slices/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  codigoAcceso: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Cliente | null;
  token: string | null;
  login: (codigoAcceso: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, user, token } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (codigoAcceso: string) => {
    try {
      await dispatch(loginAction({ codigoAcceso })).unwrap();
    } catch (error) {
      console.error('Error de login:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 