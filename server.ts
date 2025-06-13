import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import db from "./lib/db";
import type { FieldUpdateData, UserJoinedData, UserLeftData } from "./types/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Bind to all interfaces
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      
      // Skip Next.js handling for Socket.io requests
      if (parsedUrl.pathname?.startsWith('/socket.io/')) {
        return;
      }
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? ["http://localhost:3000", "http://fedora:3000", "http://127.0.0.1:3000"] : process.env.NEXT_PUBLIC_SITE_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
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
              updated_by: data.userId || "anonymous",
              updated_at: new Date(),
            });
        } else {
          await db("field_values").insert({
            response_id: data.responseId,
            field_id: data.fieldId,
            value: data.value,
            updated_by: data.userId || "anonymous",
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