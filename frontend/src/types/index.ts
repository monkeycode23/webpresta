export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string; // Usaremos string para simplificar, se puede convertir a Date si es necesario
  read: boolean;
  link?: string; // Opcional: para redirigir al hacer clic
}

// Puedes añadir otras interfaces globales aquí si es necesario 