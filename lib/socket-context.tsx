"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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
  onFieldUpdate: (
    callback: (data: {
      responseId: string;
      fieldId: string;
      value: string;
      userId?: string;
    }) => void
  ) => void;
  offFieldUpdate: (
    callback: (data: {
      responseId: string;
      fieldId: string;
      value: string;
      userId?: string;
    }) => void
  ) => void;
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
  const [collaborators, setCollaborators] = useState<
    { userId: string; email: string }[]
  >([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const newSocket = io({
      path: "/socket.io",
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setCollaborators([]);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    newSocket.on("user-joined", (data: { userId: string; email: string }) => {
      setCollaborators((prev) => {
        const exists = prev.some((c) => c.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    newSocket.on("user-left", (data: { userId: string }) => {
      setCollaborators((prev) => prev.filter((c) => c.userId !== data.userId));
    });

    newSocket.on("field-update-error", (error) => {
      console.error("Field update error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinForm = useCallback(
    (formId: string, userId?: string, email?: string) => {
      if (socket && isConnected) {
        socket.emit("join-form", formId);

        if (userId && email) {
          socket.emit("user-joined", { formId, userId, email });
        }
      }
    },
    [isConnected, socket]
  );

  const leaveForm = useCallback(
    (formId: string, userId?: string) => {
      if (socket && isConnected) {
        socket.emit("leave-form", formId);

        if (userId) {
          socket.emit("user-left", { formId, userId });
        }
      }
    },
    [isConnected, socket]
  );

  const emitFieldUpdate = useCallback(
    (data: {
      formId: string;
      responseId: string;
      fieldId: string;
      value: string;
      userId?: string;
    }) => {
      if (socket && isConnected) {
        socket.emit("field-update", data);
      }
    },
    [isConnected, socket]
  );

  const onFieldUpdate = useCallback(
    (
      callback: (data: {
        responseId: string;
        fieldId: string;
        value: string;
        userId?: string;
      }) => void
    ) => {
      if (socket) {
        socket.on("field-updated", callback);
      }
    },
    [socket]
  );

  const offFieldUpdate = useCallback(
    (
      callback: (data: {
        responseId: string;
        fieldId: string;
        value: string;
        userId?: string;
      }) => void
    ) => {
      if (socket) {
        socket.off("field-updated", callback);
      }
    },
    [socket]
  );

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
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
