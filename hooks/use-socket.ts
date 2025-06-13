"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketProps {
  formId?: string;
  userId?: string;
  email?: string;
}

interface FieldUpdateData {
  responseId: string;
  fieldId: string;
  value: string;
  userId?: string;
}

interface UserJoinedData {
  userId: string;
  email: string;
}

interface UserLeftData {
  userId: string;
}

export function useSocket({ formId, userId, email }: UseSocketProps = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<{ userId: string; email: string }[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize socket connection
    socketRef.current = io({
      path: "/socket.io",
      addTrailingSlash: false,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      
      // Join form room if formId is provided
      if (formId) {
        socket.emit("join-form", formId);
        
        // Announce user joined if user info is provided
        if (userId && email) {
          socket.emit("user-joined", { formId, userId, email });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setIsConnected(false);
    });

    socket.on("field-updated", (data: FieldUpdateData) => {
      console.log("Field updated:", data);
      // This will be handled by the form component
    });

    socket.on("user-joined", (data: UserJoinedData) => {
      console.log("User joined:", data);
      setCollaborators(prev => {
        const exists = prev.some(c => c.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on("user-left", (data: UserLeftData) => {
      console.log("User left:", data);
      setCollaborators(prev => prev.filter(c => c.userId !== data.userId));
    });

    socket.on("field-update-error", (error) => {
      console.error("Field update error:", error);
    });

    return () => {
      if (formId && userId) {
        socket.emit("user-left", { formId, userId });
      }
      socket.disconnect();
    };
  }, [formId, userId, email]);

  const emitFieldUpdate = (data: FieldUpdateData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("field-update", {
        formId,
        ...data,
      });
    }
  };

  const joinForm = (newFormId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join-form", newFormId);
    }
  };

  const leaveForm = (oldFormId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave-form", oldFormId);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    collaborators,
    emitFieldUpdate,
    joinForm,
    leaveForm,
  };
}