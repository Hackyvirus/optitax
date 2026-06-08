"use client";
import { useState, useRef, useEffect } from "react";
import AuthShell, { ROLE_CONFIG } from "@/components/auth/AuthShell";

const cfg   = ROLE_CONFIG.admin;
const STEPS = ["Email","Personal","Authorization","Review"];
const INP: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0", borderRadius:11, fontSize:14, color:"#1e293b", background:"#fff", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

type F = {
  email:string; emailOtp:string; emailVerified:boolean;
  firstName:string; lastName:string; phone:string;
  password:string; confirmPassword:string;
  adminSecret:string; adminLevel:string;
};

export default function AdminRegister() {
  const [step, setStep]           = useState(0);
  const [errors, setErrors]       = useState<Record<string,string>>({});
  const [loading, setLoading]     = useState(false);
  const [globalErr, setGlobalErr] = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const otpRefs  = useRef<(HTMLInputElement|null)[]>([]);
  const otpValue = useRef("");

  const [f, setF] = useState<F>({
    email:"", emailOtp:"", emailVerified:false,
    firstName:"", lastName:"", phone:"",
    password:"", confirmPassword:"",
    adminSecret:"", adminLevel:"regular",
  });

  const set = (k: keyof F, v: unknown) => {
    if (k === "emailOtp") otpValue.current = v as string;
    setF(p => ({ ...p, [k]: v }));
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleOtpChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const cur = otpValue.current.padEnd(6, "").split("").slice(0, 6);
    cur[i] = d;
    const next = cur.join("");
    otpValue.current = next;
    setF(p => ({ ...p, emailOtp: next }));
    if (d && i < 5) setTimeout(() => otpRefs.current[i + 1]?.focus(), 0);
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const cur = otpValue.current.padEnd(6, "").split("").slice(0, 6);
      cur[i] = "";
      const next = cur.join("");
      otpValue.current = next;
      setF(p => ({ ...p, emailOtp: next }));
      if (i > 0) setTimeout(() => otpRefs.current[i - 1]?.focus(), 0);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    otpValue.current = p;
    setF(prev => ({ ...prev, emailOtp: p }));
    e.preventDefault();
    setTimeout(() => otpRefs.current[Math.min(p.length, 5)]?.focus(), 0);
  };

  const sendOTP = async () => {
    if (!f.email) { setErrors(e => ({ ...e, email:"Enter email first" })); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/send-otp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:f.email, type:"email" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true); setCooldown(60);
    } catch(e:unknown) { setErrors(err => ({ ...err, email: e instanceof Error ? e.message : "Failed" })); }
    finally { setLoading(false); }
  };

  const verifyOTP = () => {
    if (otpValue.current.replace(/\s/g,"").length < 6) { setErrors(e => ({ ...e, emailOtp:"Enter the complete 6-digit OTP" })); return; }
    set("emailVerified", true);
    setErrors(e => { const n={...e}; delete n.emailOtp; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string,string> = {};
    if (step===0) {
      if (!f.email) errs.email="Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email="Invalid email";
      if (!f.emailVerified) errs.emailOtp="Please verify your email first";
    }
    if (step===1) {
      if (!f.firstName) errs.firstName="Required";
      if (!f.lastName)  errs.lastName ="Required";
      if (!f.phone||!/^[6-9]\d{9}$/.test(f.phone)) errs.phone="Valid 10-digit mobile required";
      if (!f.password||f.password.length<8) errs.password="Minimum 8 characters";
      else if (!/(?=.*[A-Z])(?=.*\d)/.test(f.password)) errs.password="Must include uppercase and number";
      if (f.password!==f.confirmPassword) errs.confirmPassword="Passwords do not match";
    }
    if (step===2) {
      if (!f.adminSecret) errs.adminSecret="Authorization key is required";
    }
    setErrors(errs);
    return Object.keys(errs).length===0;
  };

  const next   = () => { if (validate()) setStep(s=>s+1); };
  const back   = () => { setErrors({}); setStep(s=>s-1); };
  const submit = async () => {
    setLoading(true); setGlobalErr("");
    try {
      const res  = await fetch("/api/auth/register", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...f, role:"admin"}) });
      const data = await res.json();
      if (!res.ok) { setGlobalErr(data.error||"Registration failed"); return; }
      window.location.href = data.redirect||"/dashboard/admin";
    } catch { setGlobalErr("Something went wrong."); }
    finally { setLoading(false); }
  };

  const otpDigits = f.emailOtp.padEnd(6,"").split("").slice(0,6);
  const Lbl = ({t,req}:{t:string;req?:boolean}) => <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{t}{req&&<span style={{color:"#ef4444"}}> *</span>}</label>;
  const Err = ({k}:{k:string}) => errors[k]?<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors[k]}</p>:null;

  const renderStep = () => {
    if (step===0) return (
      <div>
        <div style={{padding:"12px 16px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:600,color:cfg.color,marginBottom:3}}>🛡️ Admin registration is restricted</div>
          <div style={{fontSize:12,color:"#3b82f6"}}>Only authorized personnel can register. You will need an authorization key.</div>
        </div>
        <div style={{marginBottom:14}}>
          <Lbl t="Admin Email" req/>
          <div style={{display:"flex",gap:8}}>
            <input type="email" placeholder="admin@optitax.in" value={f.email} disabled={f.emailVerified} onChange={e=>set("email",e.target.value)} style={f.emailVerified?{...INP,background:"#f8fafc"}:INP}/>
            {!f.emailVerified&&<button type="button" onClick={sendOTP} disabled={loading||cooldown>0} style={{padding:"11px 16px",background:cooldown>0?"#f1f5f9":cfg.color,color:cooldown>0?"#94a3b8":"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:600,cursor:cooldown>0?"not-allowed":"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{loading?"…":cooldown>0?`${cooldown}s`:otpSent?"Resend":"Send OTP"}</button>}
          </div>
          <Err k="email"/>
        </div>
        {otpSent&&!f.emailVerified&&(
          <div>
            <Lbl t="Enter 6-digit OTP"/>
            <div style={{display:"flex",gap:10,justifyContent:"center",margin:"12px 0"}}>
              {Array.from({length:6}).map((_,i)=>(
                <input key={i} ref={el=>{otpRefs.current[i]=el;}} type="text" inputMode="numeric" maxLength={1}
                  value={otpDigits[i]||""}
                  onChange={e=>handleOtpChange(i,e.target.value)}
                  onKeyDown={e=>handleOtpKey(i,e)}
                  onPaste={handleOtpPaste}
                  style={{width:52,height:60,textAlign:"center",fontSize:24,fontWeight:700,border:`2px solid ${otpDigits[i]?cfg.color:"#e2e8f0"}`,borderRadius:12,outline:"none",background:otpDigits[i]?`${cfg.color}12`:"#fff",color:cfg.color,fontFamily:"monospace",transition:"border-color .15s"}}/>
              ))}
            </div>
            <Err k="emailOtp"/>
            <button type="button" onClick={verifyOTP} style={{width:"100%",padding:13,background:cfg.color,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>Verify OTP</button>
          </div>
        )}
        {f.emailVerified&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,marginTop:8}}><span style={{fontSize:20}}>✅</span><div><div style={{fontSize:14,fontWeight:600,color:cfg.color}}>Email verified</div><div style={{fontSize:12,color:cfg.color}}>{f.email}</div></div></div>}
      </div>
    );

    if (step===1) return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{marginBottom:14}}><Lbl t="First Name" req/><input style={INP} placeholder="First name" value={f.firstName} onChange={e=>set("firstName",e.target.value)}/><Err k="firstName"/></div>
          <div style={{marginBottom:14}}><Lbl t="Last Name" req/><input style={INP} placeholder="Last name" value={f.lastName} onChange={e=>set("lastName",e.target.value)}/><Err k="lastName"/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Lbl t="Mobile Number" req/>
          <div style={{display:"flex",border:"1.5px solid #e2e8f0",borderRadius:11,overflow:"hidden",background:"#fff"}}>
            <span style={{padding:"11px 14px",background:"#f8fafc",fontSize:14,color:"#64748b",borderRight:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>+91</span>
            <input type="tel" placeholder="9876543210" value={f.phone} onChange={e=>set("phone",e.target.value.replace(/\D/g,"").slice(0,10))} style={{flex:1,padding:"11px 14px",border:"none",outline:"none",fontSize:14,color:"#1e293b",fontFamily:"inherit",background:"transparent"}}/>
          </div>
          <Err k="phone"/>
        </div>
        <div style={{marginBottom:14}}><Lbl t="Password" req/><input style={INP} type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={f.password} onChange={e=>set("password",e.target.value)}/><Err k="password"/></div>
        <div style={{marginBottom:14}}><Lbl t="Confirm Password" req/><input style={INP} type="password" placeholder="Re-enter password" value={f.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)}/><Err k="confirmPassword"/></div>
      </div>
    );

    if (step===2) return (
      <div>
        <div style={{padding:"12px 16px",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:600,color:"#92400e",marginBottom:3}}>⚠ Authorization required</div>
          <div style={{fontSize:12,color:"#b45309"}}>Contact your organization's super administrator for the authorization key.</div>
        </div>
        <div style={{marginBottom:14}}><Lbl t="Authorization Key" req/><input style={INP} type="password" placeholder="Enter the admin authorization key" value={f.adminSecret} onChange={e=>set("adminSecret",e.target.value)}/><Err k="adminSecret"/></div>
        <div style={{marginBottom:14}}>
          <Lbl t="Admin Level"/>
          <select style={{...INP,cursor:"pointer"}} value={f.adminLevel} onChange={e=>set("adminLevel",e.target.value)}>
            <option value="regular">Regular Admin</option>
            <option value="super">Super Admin</option>
          </select>
        </div>
      </div>
    );

    return (
      <div>
        <p style={{fontSize:13,color:"#64748b",marginBottom:16}}>Review your details</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{l:"Email",v:f.email},{l:"Name",v:`${f.firstName} ${f.lastName}`},{l:"Phone",v:`+91 ${f.phone}`},{l:"Admin Level",v:f.adminLevel}].map(({l,v})=>(
            <div key={l} style={{display:"flex",padding:"10px 14px",background:"#f8fafc",borderRadius:10,gap:12}}>
              <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",minWidth:80,textTransform:"uppercase",letterSpacing:".05em"}}>{l}</span>
              <span style={{fontSize:13,color:"#1e293b",fontWeight:500}}>{v}</span>
            </div>
          ))}
        </div>
        {globalErr&&<div style={{marginTop:14,padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,fontSize:13,color:"#991b1b"}}>⚠ {globalErr}</div>}
      </div>
    );
  };

  return (
    <AuthShell cfg={cfg} mode="register">
      <div style={{marginBottom:20}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:cfg.bg,padding:"5px 14px",borderRadius:20,marginBottom:14}}>
          <span>{cfg.icon}</span>
          <span style={{fontSize:11,fontWeight:700,color:cfg.color,textTransform:"uppercase",letterSpacing:".1em"}}>{cfg.label}</span>
        </div>
        <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:"0 0 4px"}}>Admin registration</h1>
        <p style={{fontSize:13,color:"#64748b",margin:0}}>Step {step+1} of {STEPS.length} — {STEPS[step]}</p>
      </div>
      <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
        {STEPS.map((label,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:undefined}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:i<step?"#22c55e":i===step?cfg.color:"#f1f5f9",color:i<=step?"#fff":"#94a3b8"}}>{i<step?"✓":i+1}</div>
              <span style={{fontSize:9,color:i===step?cfg.color:"#94a3b8",fontWeight:i===step?600:400,whiteSpace:"nowrap"}}>{label}</span>
            </div>
            {i<STEPS.length-1&&<div style={{flex:1,height:2,background:i<step?"#22c55e":"#f1f5f9",margin:"0 3px",marginBottom:14}}/>}
          </div>
        ))}
      </div>
      {renderStep()}
      <div style={{display:"flex",gap:10,marginTop:22}}>
        {step>0&&<button type="button" onClick={back} style={{flex:1,padding:12,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:11,fontSize:13,fontWeight:600,cursor:"pointer",color:"#64748b",fontFamily:"inherit"}}>← Back</button>}
        {step<STEPS.length-1
          ?<button type="button" onClick={next} style={{flex:2,padding:12,background:cfg.color,color:"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Continue →</button>
          :<button type="button" onClick={submit} disabled={loading} style={{flex:2,padding:12,background:loading?"#94a3b8":cfg.color,color:"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>{loading?"Creating account…":"Create Account →"}</button>}
      </div>
    </AuthShell>
  );
}