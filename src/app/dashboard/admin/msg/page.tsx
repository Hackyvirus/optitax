"use client";
import { useEffect, useState, useRef } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";

type Client = { _id:string; firstName:string; lastName:string; email:string; businessName?:string };
type Msg    = { _id:string; senderId:{ _id:string; role:string }; text:string; createdAt:string; roomId?:string };

export default function AdminMessages() {
  const [clients, setClients]     = useState<Client[]>([]);
  const [selected, setSelected]   = useState<Client|null>(null);
  const [messages, setMessages]   = useState<Msg[]>([]);
  const [input, setInput]         = useState("");
  const [myId, setMyId]           = useState("");
  const [connected, setConnected] = useState(false);
  const [unread, setUnread]       = useState<Record<string,number>>({});
  const bottomRef   = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<Client|null>(null);
  const typingRef   = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d=>setMyId(d.id||"")).catch(()=>{});
    fetch("/api/admin/clients").then(r=>r.json()).then(d=>setClients(d.clients||[])).catch(()=>{});

    const socket = getSocket();
    socket.on("connect",    ()=>setConnected(true));
    socket.on("disconnect", ()=>setConnected(false));
    socket.on("new_message", (msg:Msg) => {
      const roomId = msg.roomId||"";
      if (selectedRef.current && roomId===`client_${selectedRef.current._id}`) {
        setMessages(prev=>prev.find(m=>m._id===msg._id)?prev:[...prev,msg]);
        setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);
      } else {
        const clientId = roomId.replace("client_","");
        setUnread(u=>({...u,[clientId]:(u[clientId]||0)+1}));
      }
    });
    return ()=>{ disconnectSocket(); };
  }, []);

  const selectClient = async (c:Client) => {
    setSelected(c); selectedRef.current=c;
    setUnread(u=>({...u,[c._id]:0}));
    const res  = await fetch(`/api/messages?roomId=client_${c._id}`);
    const data = await res.json();
    setMessages(data.messages||[]);
    setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  const handleTyping = () => {
    if (!selected) return;
    const socket=getSocket();
    socket.emit("typing_start",{roomId:`client_${selected._id}`});
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current=setTimeout(()=>socket.emit("typing_stop",{roomId:`client_${selected._id}`}),1500);
  };

  const send = () => {
    if (!input.trim()||!selected) return;
    getSocket().emit("send_message",{text:input.trim(),roomId:`client_${selected._id}`,receiverId:selected._id});
    setInput("");
  };

  const card: React.CSSProperties = { background:"#fff", borderRadius:12, border:"1px solid #e8ecf0", overflow:"hidden" };

  return (
    <div>
      <div style={{ marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>Messages</h1>
          <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Real-time chat with clients</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:connected?"#22c55e":"#e2e8f0" }}/>
          <span style={{ fontSize:12, color:"#94a3b8" }}>{connected?"Connected":"Offline"}</span>
        </div>
      </div>

      <div style={{ ...card, display:"flex", height:560 }}>
        {/* Client list */}
        <div style={{ width:240, flexShrink:0, borderRight:"1px solid #f1f5f9", overflowY:"auto" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9", background:"#f8fafc" }}>
            <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", margin:0 }}>
              Clients ({clients.length})
            </p>
          </div>
          {clients.length===0 && <p style={{ padding:16, fontSize:13, color:"#94a3b8" }}>No clients yet</p>}
          {clients.map(c=>(
            <button key={c._id} onClick={()=>selectClient(c)}
              style={{ width:"100%", padding:"12px 16px", textAlign:"left", background:selected?._id===c._id?"#f0f9ff":"transparent", border:"none", borderBottom:"1px solid #f9fafb", cursor:"pointer", borderLeft:selected?._id===c._id?"3px solid #0f1f4a":"3px solid transparent" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:"#0f1f4a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
                  {(c.firstName||"C").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.firstName} {c.lastName}</p>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.businessName||c.email}</p>
                </div>
                {(unread[c._id]||0)>0 && (
                  <span style={{ width:18, height:18, borderRadius:"50%", background:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>
                    {unread[c._id]}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {!selected ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
                <p style={{ fontSize:14, margin:0 }}>Select a client to chat</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:10, background:"#fff" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"#0f1f4a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>
                  {(selected.firstName||"C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:0 }}>{selected.firstName} {selected.lastName}</p>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{selected.businessName||selected.email}</p>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:connected?"#22c55e":"#e2e8f0" }}/>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>Live</span>
                </div>
              </div>

              <div style={{ flex:1, overflowY:"auto", padding:16, background:"#f8fafc", display:"flex", flexDirection:"column", gap:12 }}>
                {messages.length===0 && <p style={{ textAlign:"center", fontSize:13, color:"#94a3b8", marginTop:40 }}>No messages yet.</p>}
                {messages.map(m=>{
                  const mine = m.senderId?._id===myId;
                  return (
                    <div key={m._id} style={{ display:"flex", justifyContent:mine?"flex-end":"flex-start" }}>
                      <div style={{ maxWidth:"72%", padding:"10px 14px", borderRadius:mine?"16px 16px 4px 16px":"16px 16px 16px 4px", background:mine?"#0f1f4a":"#fff", color:mine?"#fff":"#0f172a", fontSize:13, border:mine?"none":"1px solid #e8ecf0" }}>
                        {!mine && <p style={{ fontSize:11, fontWeight:600, color:"#3b82f6", margin:"0 0 4px" }}>{selected.firstName}</p>}
                        <p style={{ margin:0 }}>{m.text}</p>
                        <p style={{ fontSize:10, color:mine?"rgba(255,255,255,0.5)":"#94a3b8", margin:"4px 0 0", textAlign:"right" }}>
                          {new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>

              <div style={{ padding:12, borderTop:"1px solid #f1f5f9", display:"flex", gap:8, background:"#fff" }}>
                <input value={input} onChange={e=>{setInput(e.target.value);handleTyping();}}
                  onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message…"
                  style={{ flex:1, padding:"9px 14px", border:"1px solid #e8ecf0", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit" }}/>
                <button onClick={send} disabled={!input.trim()}
                  style={{ padding:"9px 18px", background:"#0f1f4a", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", opacity:input.trim()?1:0.5 }}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}