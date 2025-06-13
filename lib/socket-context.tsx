"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinForm: (formId: string, userId?: string, email?: string) => void;
  leaveForm: (formId: string, userId?: string) => void;
  emitFieldUpdate: (data: {
    formId: string;
    responseId: string;
    fieldId: string;
    value: string;
    userId?: string;
  }) => void;
  collaborators: { userId: string; email: string }[];
  onFieldUpdate: (callback: (data: any) => void) => void;
  offFieldUpdate: (callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<{ userId: string; email: string }[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const newSocket = io(window.location.origin, {
      path: "/socket.io",
      addTrailingSlash: false,
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setIsConnected(false);
      setCollaborators([]);
    });

    newSocket.on("user-joined", (data: { userId: string; email: string }) => {
      console.log("User joined:", data);
      setCollaborators(prev => {
        const exists = prev.some(c => c.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    newSocket.on("user-left", (data: { userId: string }) => {
      console.log("User left:", data);
      setCollaborators(prev => prev.filter(c => c.userId !== data.userId));
    });

    newSocket.on("field-update-error", (error) => {
      console.error("Field update error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinForm = (formId: string, userId?: string, email?: string) => {
    if (socket && isConnected) {
      socket.emit("join-form", formId);
      
      if (userId && email) {
        socket.emit("user-joined", { formId, userId, email });
      }
    }
  };

  const leaveForm = (formId: string, userId?: string) => {
    if (socket && isConnected) {
      socket.emit("leave-form", formId);
      
      if (userId) {
        socket.emit("user-left", { formId, userId });
      }
    }
  };

  const emitFieldUpdate = (data: {
    formId: string;
    responseId: string;
    fieldId: string;
    value: string;
    userId?: string;
  }) => {
    if (socket && isConnected) {
      socket.emit("field-update", data);
    }
  };

  const onFieldUpdate = (callback: (data: any) => void) => {
    if (socket) {
      socket.on("field-updated", callback);
    }
  };

  const offFieldUpdate = (callback: (data: any) => void) => {
    if (socket) {
      socket.off("field-updated", callback);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinForm,
    leaveForm,
    emitFieldUpdate,
    collaborators,
    onFieldUpdate,
    offFieldUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}