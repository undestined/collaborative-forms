import { Server } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "../types/socket";
import db from "./db";

export const initSocket = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");
    
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === "production" 
          ? process.env.NEXT_PUBLIC_SITE_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join form room
      socket.on("join-form", (formId: string) => {
        socket.join(formId);
        console.log(`Socket ${socket.id} joined form ${formId}`);
      });

      // Leave form room
      socket.on("leave-form", (formId: string) => {
        socket.leave(formId);
        console.log(`Socket ${socket.id} left form ${formId}`);
      });

      // Handle field updates
      socket.on("field-update", async (data: {
        formId: string;
        responseId: string;
        fieldId: string;
        value: string;
        userId?: string;
      }) => {
        try {
          // Update the database
          const existingValue = await db("field_values")
            .where({
              response_id: data.responseId,
              field_id: data.fieldId,
            })
            .first();

          if (existingValue) {
            await db("field_values")
              .where({
                response_id: data.responseId,
                field_id: data.fieldId,
              })
              .update({
                value: data.value,
                updated_by: data.userId,
                updated_at: new Date(),
              });
          } else {
            await db("field_values").insert({
              response_id: data.responseId,
              field_id: data.fieldId,
              value: data.value,
              updated_by: data.userId,
            });
          }

          // Broadcast to all users in the form room except sender
          socket.to(data.formId).emit("field-updated", {
            responseId: data.responseId,
            fieldId: data.fieldId,
            value: data.value,
            userId: data.userId,
          });
        } catch (error) {
          console.error("Error updating field:", error);
          socket.emit("field-update-error", {
            fieldId: data.fieldId,
            error: "Failed to update field",
          });
        }
      });

      // User joins form collaboration
      socket.on("user-joined", (data: {
        formId: string;
        userId: string;
        email: string;
      }) => {
        socket.to(data.formId).emit("user-joined", {
          userId: data.userId,
          email: data.email,
        });
      });

      // User leaves form collaboration
      socket.on("user-left", (data: {
        formId: string;
        userId: string;
      }) => {
        socket.to(data.formId).emit("user-left", {
          userId: data.userId,
        });
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });

    res.socket.server.io = io;
  }
  
  return res.socket.server.io;
};