import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import db from "./lib/db";
import type {
  FieldUpdateData,
  UserJoinedData,
  UserLeftData,
} from "./types/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Bind to all interfaces
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: dev
        ? [
            "http://localhost:3000",
            "http://fedora:3000",
            "http://127.0.0.1:3000",
          ]
        : process.env.NEXT_PUBLIC_SITE_URL,
      credentials: true,
    },
    transports: ["websocket"],
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
    socket.on("field-update", async (data: FieldUpdateData) => {
      try {
        // Update the form field value directly
        await db("form_fields")
          .where("id", data.fieldId)
          .update({
            value: data.value,
            updated_at: new Date(),
          });

        // Broadcast to all users in the form room except sender
        socket.to(data.formId).emit("field-updated", {
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
    socket.on("user-joined", (data: UserJoinedData) => {
      socket.to(data.formId).emit("user-joined", {
        userId: data.userId,
        email: data.email,
      });
    });

    // User leaves form collaboration
    socket.on("user-left", (data: UserLeftData) => {
      socket.to(data.formId).emit("user-left", {
        userId: data.userId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  }).on("error", (err) => {
    console.error(err);
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
