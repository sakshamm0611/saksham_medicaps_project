import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSeatSocket(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.on('join_show', (showId: string) => {
      socket.join(`show_${showId}`);
    });

    socket.on('leave_show', (showId: string) => {
      socket.leave(`show_${showId}`);
    });

    socket.on('disconnect', () => {});
  });
}

export function broadcastSeatHold(showId: string, seatNumbers: string[], expiresAt: string) {
  if (ioInstance) {
    ioInstance.to(`show_${showId}`).emit('seats_held', {
      showId,
      seatNumbers,
      expiresAt
    });
  }
}

export function broadcastSeatRelease(showId: string, seatNumbers: string[]) {
  if (ioInstance) {
    ioInstance.to(`show_${showId}`).emit('seats_released', {
      showId,
      seatNumbers
    });
  }
}

export function broadcastSeatsConfirmed(showId: string, seatNumbers: string[]) {
  if (ioInstance) {
    ioInstance.to(`show_${showId}`).emit('seats_confirmed', {
      showId,
      seatNumbers
    });
  }
}
