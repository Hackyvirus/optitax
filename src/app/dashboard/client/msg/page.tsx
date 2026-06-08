"use client";
import { useEffect, useState, useRef } from "react";
import Card from "@/components/Card";
import { getSocket, disconnectSocket } from "@/lib/socket";

type Msg = {
  _id: string;
  senderId: { _id: string; role: string; firstName: string };
  text: string;
  createdAt: string;
};

export default function ClientMessages() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping]     = useState(false);
  const [myId, setMyId]         = useState("");
  const bottomRef  = useRef<HTMLDivElement>(null);
  const typingRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomId     = useRef("");

  useEffect(() => {
    // Get my user ID
    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      setMyId(d.id || "");
      roomId.current = `client_${d.id}`;

      // Load message history
      fetch(`/api/messages?roomId=client_${d.id}`)
        .then(r=>r.json())
        .then(data => { setMessages(data.messages||[]); setLoading(false); })
        .catch(() => setLoading(false));

      // Connect socket
      const socket = getSocket();

      socket.on("connect", () => {
        setConnected(true);
        console.log("[Socket] Client connected");
      });

      socket.on("disconnect", () => setConnected(false));

      // Real-time message received
      socket.on("new_message", (msg: Msg) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
      });

      // Typing indicator
      socket.on("user_typing", () => setTyping(true));
      socket.on("user_stop_typing", () => setTyping(false));

    }).catch(() => setLoading(false));

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const handleTyping = () => {
    const socket = getSocket();
    socket.emit("typing_start", { roomId: roomId.current });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit("typing_stop", { roomId: roomId.current });
    }, 1500);
  };

  const send = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit("send_message", {
      text:   input.trim(),
      roomId: roomId.current,
    });
    socket.emit("typing_stop", { roomId: roomId.current });
    setInput("");
  };

  const isFromMe = (m: Msg) =>
    m.senderId?._id === myId || m.senderId?.role === "client";

  return (
    <Card className="w-full border-blue-100/70">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--text)]">Messages</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Chat with your OptiTax team</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full transition-colors ${connected ? "bg-green-400 animate-pulse" : "bg-gray-300"}`}/>
          <span className="text-xs text-[color:var(--muted)]">{connected ? "Connected" : "Connecting…"}</span>
        </div>
      </div>

      <div className="mt-6 flex h-[500px] flex-col overflow-hidden rounded-xl border border-blue-100">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 bg-[#f8fafc] p-4">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[color:var(--muted)]">Loading messages…</p>
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm text-[color:var(--muted)]">No messages yet.</p>
                <p className="text-xs text-[color:var(--muted)] mt-1">Start the conversation with your team.</p>
              </div>
            </div>
          )}
          {messages.map(m => (
            <div key={m._id} className={`flex ${isFromMe(m) ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                isFromMe(m)
                  ? "bg-[color:var(--primary)] text-white rounded-br-sm"
                  : "bg-white border border-blue-100 text-[color:var(--text)] rounded-bl-sm"
              }`}>
                {!isFromMe(m) && (
                  <p className="mb-1 text-xs font-semibold text-blue-700">OptiTax Team</p>
                )}
                <p className="leading-relaxed">{m.text}</p>
                <p className={`mt-1 text-right text-[10px] ${isFromMe(m) ? "text-blue-200" : "text-[color:var(--muted)]"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-blue-100 bg-white px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay:"0ms" }}/>
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay:"150ms" }}/>
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay:"300ms" }}/>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 border-t border-blue-100 bg-white p-3">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 rounded-lg border border-[color:var(--border)] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/10"
          />
          <button onClick={send} disabled={!input.trim()}
            className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--primary-dark)] disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
    </Card>
  );
}
