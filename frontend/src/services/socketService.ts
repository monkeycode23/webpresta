import io, { Socket } from 'socket.io-client';

const SOCKET_URL =process.env.REACT_APP_SOCKET_URL /*   */ /* 'ws://localhost:4000' */

//||  ''; // Asegúrate que la URL es correcta y accesible

class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (!this.socket || !this.socket.connected) {
      console.log('Attempting to connect to WebSocket server...');
      this.socket = io(SOCKET_URL,{
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        transports: ['websocket'], // Prefer WebSocket
        auth: {
          token: localStorage.getItem('authToken')
        }
      })

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        // const token = localStorage.getItem('authToken');
        // if (token && this.socket) {
        //   this.socket.emit('authenticate', { token });
        // }
      }); 

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
 
    } else {
        console.log('Socket already connected or connection attempt in progress.');
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(eventName: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(eventName, callback);
    } else {
      console.warn(`Socket not connected. Cannot listen to event: ${eventName}`);
    }
  }

  off(eventName: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  emit(eventName: string, data: any): void {
    if (this.socket) {
      this.socket.emit(eventName, data);
    } else {
      console.warn(`Socket not connected. Cannot emit event: ${eventName}`);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService; 