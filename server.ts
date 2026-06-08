import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      // Security headers for production
      if (!dev) {
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader(
          "Strict-Transport-Security",
          "max-age=31536000; includeSubDomains",
        );
      }
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin:
          process.env.NEXT_PUBLIC_URL ||
          (dev ? "http://localhost:3000" : false),
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.use((socket, next) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie || "";
        const token = cookieHeader.match(/token=([^;]+)/)?.[1];
        if (!token || !process.env.JWT_SECRET)
          return next(new Error("Unauthorized"));
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
          id: string;
          role: string;
          email: string;
        };
        socket.data.userId = decoded.id;
        socket.data.role = decoded.role;
        socket.data.email = decoded.email;
        next();
      } catch {
        next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      const { userId, role } = socket.data;

      socket.join(`user:${userId}`);
      if (role === "client") socket.join(`room:client_${userId}`);
      if (role === "admin" || role === "employee") socket.join("room:staff");

      socket.on(
        "send_message",
        async (data: { text: string; roomId: string; receiverId?: string }) => {
          try {
            const { text, roomId, receiverId } = data;
            if (!text?.trim()) return;

            const res = await fetch(
              `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/messages`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Cookie: `token=${socket.handshake.headers.cookie?.match(/token=([^;]+)/)?.[1] || ""}`,
                },
                body: JSON.stringify({ text: text.trim(), roomId, receiverId }),
              },
            );

            type MessageResponse = {
              message?: {
                _id?: string;
                [key: string]: any;
              };
            };

            const saved = (await res.json()) as MessageResponse;
            if (!saved.message) return;

            const payload = {
              ...saved.message,
              _id: saved.message._id || Date.now().toString(),
            };

            io.to(`room:${roomId}`).emit("new_message", payload);
            if (role === "client") {
              io.to("room:staff").emit("new_message", { ...payload, roomId });
            } else if (receiverId) {
              io.to(`room:client_${receiverId}`).emit("new_message", payload);
            }
          } catch (err) {
            console.error("[Socket] send_message error:", err);
          }
        },
      );

      socket.on("typing_start", (data: { roomId: string }) => {
        socket
          .to(`room:${data.roomId}`)
          .emit("user_typing", { userId, role, roomId: data.roomId });
      });
      socket.on("typing_stop", (data: { roomId: string }) => {
        socket
          .to(`room:${data.roomId}`)
          .emit("user_stop_typing", { userId, roomId: data.roomId });
      });
      socket.on("mark_read", (data: { roomId: string }) => {
        socket
          .to(`room:${data.roomId}`)
          .emit("messages_read", { roomId: data.roomId, by: userId });
      });
      socket.on("disconnect", () => {
        if (dev) console.log(`[Socket] Disconnected: ${role} ${userId}`);
      });
    });

    httpServer.listen(port, () => {
      console.log(
        `> Ready on http://localhost:${port} (${dev ? "dev" : "production"})`,
      );
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
