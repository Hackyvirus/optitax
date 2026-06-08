"use client";
import { useState, useEffect } from "react";
import AuthShell, { ROLE_CONFIG } from "@/components/auth/AuthShell";
import OTPInput from "@/components/auth/OTPInput";
import StepBar from "@/components/auth/StepBar";

const cfg      = ROLE_CONFIG.client;
const STEPS    = ["Email","Personal","Business","Tax Info","Services","Review"];
const SERVICES = ["GST Filing","Brand Rate / DBK","MOOWR","SEZ Compliance","ITR Filing","Export Incentives","Customs Duty","Import Compliance","Company Incorporation","Trademark / IP","Legal Advisory","Audit Support"];
const BIZ_TYPES  = ["Private Limited","Public Limited","LLP","Partnership Firm","Proprietorship","Trust / NGO","Other"];
const INDUSTRIES = ["Manufacturing","Trading / Distribution","IT / Software","Pharmaceutical","Textile","Automotive","Chemical","Food & Beverage","Construction","Other"];
const TURNOVER   = ["Under ₹40 Lakh","₹40L – ₹1.5 Cr","₹1.5 Cr – ₹5 Cr","₹5 Cr – ₹20 Cr","₹20 Cr – ₹100 Cr","Above ₹100 Cr"];
const S: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0", borderRadius:11, fontSize:14, color:"#1e293b", background:"#fff", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

type F = {
  email:string; emailOtp:string; emailVerified:boolean;
  firstName:string; lastName:string; phone:string; password:string; confirmPassword:string;
  businessName:string; businessType:string; industry:string; pan:string;
  registeredAddress:string; operationalAddress:string;
  cpName:string; cpDesignation:string; cpPhone:string; cpEmail:string;
  gstin:string; tan:string; iec:string; cin:string; udyamReg:string;
  gstReturnFrequency:string; gstFilingType:string; annualTurnover:string;
  servicesNeeded:string[];
  hasImportExport:boolean; hasCustomsDuty:boolean; hasSEZ:boolean; hasMOOWR:boolean; hasBrandRate:boolean;
};
const INIT: F = {
  email:"", emailOtp:"", emailVerified:false,
  firstName:"", lastName:"", phone:"", password:"", confirmPassword:"",
  businessName:"", businessType:"", industry:"", pan:"",
  registeredAddress:"", operationalAddress:"",
  cpName:"", cpDesignation:"", cpPhone:"", cpEmail:"",
  gstin:"", tan:"", iec:"", cin:"", udyamReg:"",
  gstReturnFrequency:"Monthly", gstFilingType:"Regular", annualTurnover:"",
  servicesNeeded:[], hasImportExport:false, hasCustomsDuty:false, hasSEZ:false, hasMOOWR:false, hasBrandRate:false,
};

export default function ClientRegister() {
  const [step, setStep]     = useState(0);
  const [f, setF]           = useState<F>(INIT);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading]   = useState(false);
  const [globalErr, setGlobalErr] = useState("");
  const [otpSent, setOtpSent]   = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const set = (k: keyof F, v: unknown) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(c => c-1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOTP = async () => {
    if (!f.email) { setErrors(e => ({...e, email:"Enter email first"})); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:f.email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true); setCooldown(60);
    } catch(e:unknown) { setErrors(x => ({...x, email: e instanceof Error ? e.message : "Failed"})); }
    finally { setLoading(false); }
  };

  const verifyOTP = () => {
    if (f.emailOtp.replace(/\s/g,"").length < 6) { setErrors(e => ({...e, emailOtp:"Enter the complete 6-digit OTP"})); return; }
    set("emailVerified", true);
    setErrors(e => { const n={...e}; delete n.emailOtp; return n; });
  };

  const validate = () => {
    const errs: Record<string,string> = {};
    if (step===0) { if (!f.email) errs.email="Required"; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email="Invalid email"; if (!f.emailVerified) errs.emailOtp="Verify your email first"; }
    if (step===1) { if (!f.firstName) errs.firstName="Required"; if (!f.lastName) errs.lastName="Required"; if (!f.phone||!/^[6-9]\d{9}$/.test(f.phone)) errs.phone="Valid 10-digit mobile"; if (!f.password||f.password.length<8) errs.password="Min 8 characters"; else if (!/(?=.*[A-Z])(?=.*\d)/.test(f.password)) errs.password="Include uppercase & number"; if (f.password!==f.confirmPassword) errs.confirmPassword="Passwords do not match"; }
    if (step===2) { if (!f.businessName) errs.businessName="Required"; if (!f.businessType) errs.businessType="Select business type"; if (!f.pan) errs.pan="PAN is required"; else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(f.pan)) errs.pan="Invalid PAN (e.g. ABCDE1234F)"; }
    if (step===3&&f.gstin&&!/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test(f.gstin)) errs.gstin="Invalid GSTIN";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next   = () => { if (validate()) setStep(s=>s+1); };
  const back   = () => { setErrors({}); setStep(s=>s-1); };
  const submit = async () => {
    setLoading(true); setGlobalErr("");
    try {
      const res = await fetch("/api/auth/register", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...f, role:"client"}) });
      const data = await res.json();
      if (!res.ok) { setGlobalErr(data.error||"Failed"); return; }
      window.location.href = data.redirect || "/dashboard/client";
    } catch { setGlobalErr("Something went wrong."); }
    finally { setLoading(false); }
  };

  const toggleSvc = (sv: string) => set("servicesNeeded", f.servicesNeeded.includes(sv) ? f.servicesNeeded.filter(x=>x!==sv) : [...f.servicesNeeded, sv]);
  const Chip = ({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) => (
    <button type="button" onClick={onClick} style={{padding:"6px 14px",fontSize:13,borderRadius:20,border:`1.5px solid ${active?cfg.color:"#e2e8f0"}`,background:active?cfg.color:"#fff",color:active?"#fff":"#64748b",cursor:"pointer"}}>
      {active?"✓ ":""}{label}
    </button>
  );

  return (
    <AuthShell cfg={cfg} mode="register">
      <div style={{marginBottom:20}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:cfg.bg,padding:"5px 14px",borderRadius:20,marginBottom:14}}>
          <span>{cfg.icon}</span>
          <span style={{fontSize:11,fontWeight:700,color:cfg.color,textTransform:"uppercase",letterSpacing:".1em"}}>{cfg.label}</span>
        </div>
        <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:"0 0 4px"}}>Create your account</h1>
        <p style={{fontSize:13,color:"#64748b",margin:0}}>Step {step+1} of {STEPS.length} — {STEPS[step]}</p>
      </div>

      <StepBar steps={STEPS} current={step} color={cfg.color} />

      {/* Step 0 — Email */}
      {step===0 && (
        <div>
          <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Work Email <span style={{color:"#ef4444"}}>*</span></label>
          <div style={{display:"flex",gap:8,marginBottom:4}}>
            <input type="email" placeholder="you@company.com" value={f.email} disabled={f.emailVerified} onChange={e=>set("email",e.target.value)} style={f.emailVerified?{...S,background:"#f8fafc"}:S}/>
            {!f.emailVerified && <button type="button" onClick={sendOTP} disabled={loading||cooldown>0} style={{padding:"11px 16px",background:cooldown>0?"#f1f5f9":cfg.color,color:cooldown>0?"#94a3b8":"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{loading?"…":cooldown>0?`${cooldown}s`:otpSent?"Resend":"Send OTP"}</button>}
          </div>
          {errors.email && <p style={{fontSize:12,color:"#ef4444",marginBottom:8}}>⚠ {errors.email}</p>}
          {otpSent && !f.emailVerified && (
            <div>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Enter 6-digit OTP</label>
              <OTPInput value={f.emailOtp} onChange={v => set("emailOtp", v)} color={cfg.color} />
              {errors.emailOtp && <p style={{fontSize:12,color:"#ef4444",textAlign:"center",marginBottom:8}}>⚠ {errors.emailOtp}</p>}
              <button type="button" onClick={verifyOTP} style={{width:"100%",padding:13,background:cfg.color,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Verify OTP</button>
            </div>
          )}
          {f.emailVerified && <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,marginTop:8}}><span style={{fontSize:20}}>✅</span><div><div style={{fontSize:14,fontWeight:600,color:cfg.color}}>Email verified</div><div style={{fontSize:12,color:cfg.color}}>{f.email}</div></div></div>}
        </div>
      )}

      {/* Step 1 — Personal */}
      {step===1 && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>First Name <span style={{color:"#ef4444"}}>*</span></label><input style={S} placeholder="First name" value={f.firstName} onChange={e=>set("firstName",e.target.value)}/>{errors.firstName&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.firstName}</p>}</div>
            <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Last Name <span style={{color:"#ef4444"}}>*</span></label><input style={S} placeholder="Last name" value={f.lastName} onChange={e=>set("lastName",e.target.value)}/>{errors.lastName&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.lastName}</p>}</div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Mobile Number <span style={{color:"#ef4444"}}>*</span></label>
            <div style={{display:"flex",border:"1.5px solid #e2e8f0",borderRadius:11,overflow:"hidden",background:"#fff"}}>
              <span style={{padding:"11px 14px",background:"#f8fafc",fontSize:14,color:"#64748b",borderRight:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>+91</span>
              <input type="tel" placeholder="9876543210" value={f.phone} onChange={e=>set("phone",e.target.value.replace(/\D/g,"").slice(0,10))} style={{flex:1,padding:"11px 14px",border:"none",outline:"none",fontSize:14,color:"#1e293b",fontFamily:"inherit",background:"transparent"}}/>
            </div>
            {errors.phone&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.phone}</p>}
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Password <span style={{color:"#ef4444"}}>*</span></label><input style={S} type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={f.password} onChange={e=>set("password",e.target.value)}/>{errors.password&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.password}</p>}</div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Confirm Password <span style={{color:"#ef4444"}}>*</span></label><input style={S} type="password" placeholder="Re-enter password" value={f.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)}/>{errors.confirmPassword&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.confirmPassword}</p>}</div>
        </div>
      )}

      {/* Step 2 — Business */}
      {step===2 && (
        <div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Company Name <span style={{color:"#ef4444"}}>*</span></label><input style={S} placeholder="Autoliv India Pvt Limited" value={f.businessName} onChange={e=>set("businessName",e.target.value)}/>{errors.businessName&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.businessName}</p>}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Business Type <span style={{color:"#ef4444"}}>*</span></label><select style={{...S,cursor:"pointer"}} value={f.businessType} onChange={e=>set("businessType",e.target.value)}><option value="">Select type</option>{BIZ_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select>{errors.businessType&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.businessType}</p>}</div>
            <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Industry</label><select style={{...S,cursor:"pointer"}} value={f.industry} onChange={e=>set("industry",e.target.value)}><option value="">Select industry</option>{INDUSTRIES.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>PAN <span style={{color:"#ef4444"}}>*</span></label><input style={S} placeholder="ABCDE1234F" value={f.pan} onChange={e=>set("pan",e.target.value.toUpperCase())}/>{errors.pan&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors.pan}</p>}</div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Registered Address</label><input style={S} placeholder="Plot No, Street, City, State, PIN" value={f.registeredAddress} onChange={e=>set("registeredAddress",e.target.value)}/></div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Operational Address (if different)</label><input style={S} placeholder="Leave blank if same" value={f.operationalAddress} onChange={e=>set("operationalAddress",e.target.value)}/></div>
          <p style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",margin:"14px 0 8px"}}>Primary Contact Person</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {([["cpName","Name","Contact person"],["cpDesignation","Designation","Finance Manager"],["cpPhone","Phone","9876543210"],["cpEmail","Email","contact@co.com"]] as [keyof F,string,string][]).map(([k,l,p])=>(
              <div key={k} style={{marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{l}</label><input style={S} placeholder={p} value={f[k] as string} onChange={e=>set(k,e.target.value)}/></div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Tax */}
      {step===3 && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {([["gstin","GSTIN","22AAAAA0000A1Z5"],["tan","TAN","PUNE12345B"],["iec","IEC","0512345678"],["cin","CIN","U74900MH2010PTC123456"],["udyamReg","Udyam Reg.","UDYAM-MH-01-0012345"]] as [keyof F,string,string][]).map(([k,l,p])=>(
              <div key={k} style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{l}</label><input style={S} placeholder={p} value={f[k] as string} onChange={e=>set(k,e.target.value.toUpperCase())}/>{errors[k]&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>⚠ {errors[k]}</p>}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>GST Return Frequency</label><select style={{...S,cursor:"pointer"}} value={f.gstReturnFrequency} onChange={e=>set("gstReturnFrequency",e.target.value)}>{["Monthly","Quarterly"].map(o=><option key={o} value={o}>{o}</option>)}</select></div>
            <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>GST Filing Type</label><select style={{...S,cursor:"pointer"}} value={f.gstFilingType} onChange={e=>set("gstFilingType",e.target.value)}>{["Regular","Composition","QRMP"].map(o=><option key={o} value={o}>{o}</option>)}</select></div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:8}}>Annual Turnover</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {TURNOVER.map(t=><Chip key={t} label={t} active={f.annualTurnover===t} onClick={()=>set("annualTurnover",f.annualTurnover===t?"":t)}/>)}
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Services */}
      {step===4 && (
        <div>
          <p style={{fontSize:13,color:"#64748b",marginBottom:14}}>Select all services you need</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {SERVICES.map(sv=>(
              <button key={sv} type="button" onClick={()=>toggleSvc(sv)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:f.servicesNeeded.includes(sv)?"#eff6ff":"#fff",border:`1.5px solid ${f.servicesNeeded.includes(sv)?cfg.color:"#e2e8f0"}`,borderRadius:10,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${f.servicesNeeded.includes(sv)?cfg.color:"#cbd5e1"}`,background:f.servicesNeeded.includes(sv)?cfg.color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {f.servicesNeeded.includes(sv)&&<svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{fontSize:13,fontWeight:f.servicesNeeded.includes(sv)?600:400,color:f.servicesNeeded.includes(sv)?cfg.color:"#334155"}}>{sv}</span>
              </button>
            ))}
          </div>
          <p style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Trade Activities</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {([["hasImportExport","Import / Export"],["hasCustomsDuty","Customs Duty"],["hasSEZ","SEZ Unit"],["hasMOOWR","MOOWR"],["hasBrandRate","Brand Rate / DBK"]] as [keyof F,string][]).map(([k,l])=>(
              <Chip key={k} label={l} active={!!f[k]} onClick={()=>set(k,!f[k])}/>
            ))}
          </div>
        </div>
      )}

      {/* Step 5 — Review */}
      {step===5 && (
        <div>
          <p style={{fontSize:13,color:"#64748b",marginBottom:14}}>Review your details before creating your account</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[{l:"Email",v:f.email},{l:"Name",v:`${f.firstName} ${f.lastName}`},{l:"Phone",v:`+91 ${f.phone}`},{l:"Business",v:f.businessName},{l:"Type",v:f.businessType},{l:"PAN",v:f.pan},{l:"GSTIN",v:f.gstin||"Not provided"},{l:"Services",v:f.servicesNeeded.length?f.servicesNeeded.join(", "):"None"}].map(({l,v})=>(
              <div key={l} style={{display:"flex",padding:"10px 14px",background:"#f8fafc",borderRadius:10,gap:12}}>
                <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",minWidth:72,textTransform:"uppercase",letterSpacing:".05em"}}>{l}</span>
                <span style={{fontSize:13,color:"#1e293b",fontWeight:500,flex:1}}>{v}</span>
              </div>
            ))}
          </div>
          {globalErr&&<div style={{marginTop:14,padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,fontSize:13,color:"#991b1b"}}>⚠ {globalErr}</div>}
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:22}}>
        {step>0 && <button type="button" onClick={back} style={{flex:1,padding:12,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:11,fontSize:13,fontWeight:600,cursor:"pointer",color:"#64748b",fontFamily:"inherit"}}>← Back</button>}
        {step<STEPS.length-1
          ? <button type="button" onClick={next} style={{flex:2,padding:12,background:cfg.color,color:"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Continue →</button>
          : <button type="button" onClick={submit} disabled={loading} style={{flex:2,padding:12,background:loading?"#94a3b8":cfg.color,color:"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{loading?"Creating account…":"Create Account →"}</button>}
      </div>
    </AuthShell>
  );
}