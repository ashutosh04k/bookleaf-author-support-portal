let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    // Authenticate / register user room
    socket.on("join", ({ userId, role, ticketId }) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
      if (role === "admin") {
        socket.join("admin-queue");
      }
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
      }
    });

    socket.on("joinTicket", (ticketId) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on("leaveTicket", (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on("disconnect", () => {
      // Cleanly handled by socket.io
    });
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

// Event emitter helpers
const emitNewTicket = (ticket) => {
  if (ioInstance) {
    ioInstance.to("admin-queue").emit("ticket:created", ticket);
    if (ticket.author?._id || ticket.author) {
      const authorId = ticket.author._id ? ticket.author._id.toString() : ticket.author.toString();
      ioInstance.to(`user:${authorId}`).emit("ticket:created", ticket);
    }
  }
};

const emitTicketUpdated = (ticket) => {
  if (ioInstance) {
    const ticketId = ticket._id.toString();
    ioInstance.to(`ticket:${ticketId}`).emit("ticket:updated", ticket);
    ioInstance.to("admin-queue").emit("ticket:updated", ticket);
    if (ticket.author?._id || ticket.author) {
      const authorId = ticket.author._id ? ticket.author._id.toString() : ticket.author.toString();
      ioInstance.to(`user:${authorId}`).emit("ticket:updated", ticket);
    }
  }
};

const emitNewMessage = (ticketId, message) => {
  if (ioInstance) {
    ioInstance.to(`ticket:${ticketId}`).emit("message:new", message);
    ioInstance.to("admin-queue").emit("ticket:activity", { ticketId, type: "message" });
  }
};

const emitNewInternalNote = (ticketId, note) => {
  if (ioInstance) {
    // Only admins in ticket room or admin queue receive this!
    ioInstance.to("admin-queue").emit("note:new", { ticketId, note });
    ioInstance.to(`ticket:${ticketId}`).emit("note:new", { ticketId, note });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitNewTicket,
  emitTicketUpdated,
  emitNewMessage,
  emitNewInternalNote
};
