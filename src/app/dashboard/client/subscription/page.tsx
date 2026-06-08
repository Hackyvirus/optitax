"use client";
import { useEffect, useState } from "react";

type Sub = { plan:string; status:string; billingCycle:string; currentPeriodEnd:string; amount:number };

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    desc: "For small businesses",
    monthly: 99900,
    yearly: 999900,
    features: ["Up to 3 active projects","GST Filing support","1GB document storage","Email support","Chat with team"],
  },
  {
    id: "professional",
    name: "Professional",
    desc: "For growing businesses",
    monthly: 249900,
    yearly: 2499900,
    features: ["Up to 10 active projects","GST + ITR Filing","Brand Rate / DBK","MOOWR & SEZ support","10GB storage","Priority support","Dedicated manager"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    desc: "For large organizations",
    monthly: 499900,
    yearly: 4999900,
    features: ["Unlimited projects","All compliance services","Unlimited storage","24/7 support","Dedicated team","Custom reports"],
  },
];

const fmt = (paise: number) => `₹${(paise/100).toLocaleString("en-IN")}`;

declare global {
  interface Window { Razorpay: new (opts: unknown) => { open(): void }; }
}

const S = {
  card: { background:"#fff", borderRadius:12, border:"1px solid #e8ecf0", padding:"24px" } as React.CSSProperties,
};

export default function ClientSubscription() {
  const [sub, setSub]       = useState<Sub|null>(null);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle]   = useState<"monthly"|"yearly">("monthly");
  const [paying, setPaying] = useState<string|null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError]   = useState("");

  const loadSub = () => {
    fetch("/api/subscription")
      .then(r=>r.json())
      .then(d=>{ setSub(d.subscription); setLoading(false); })
      .catch(()=>setLoading(false));
  };

  useEffect(() => {
    loadSub();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);

  const subscribe = async (planId: string) => {
    setPaying(planId); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/subscription/create-order", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ planId, cycle }),
      });

      let order: Record<string,unknown>;
      try {
        order = await res.json();
      } catch {
        setError("Server error — check Razorpay keys are set in .env.local");
        setPaying(null);
        return;
      }

      if (!res.ok) {
        setError((order.error as string) || "Failed to create order");
        setPaying(null);
        return;
      }

      if (!window.Razorpay) {
        setError("Payment gateway failed to load. Check your internet connection.");
        setPaying(null);
        return;
      }

      const rzp = new window.Razorpay({
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        "OptiTax",
        description: `${order.planName} — ${cycle}`,
        order_id:    order.orderId,
        prefill:     order.prefill,
        theme:       { color:"#0f1f4a" },
        handler: async (payment: { razorpay_order_id:string; razorpay_payment_id:string; razorpay_signature:string }) => {
          const plan = PLANS.find(p=>p.id===planId)!;
          const amount = cycle==="yearly" ? plan.yearly : plan.monthly;
          const vRes = await fetch("/api/subscription/verify", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ ...payment, planId, cycle, amount }),
          });
          const vData = await vRes.json();
          if (vRes.ok) { setSuccess(`Subscription activated! Valid until ${vData.validUntil}`); loadSub(); }
          else setError(vData.error || "Payment verification failed");
          setPaying(null);
        },
        modal: { ondismiss: () => setPaying(null) },
      });
      rzp.open();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPaying(null);
    }
  };

  const currentPlan = sub?.plan || "none";

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>Subscription</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Manage your OptiTax compliance plan</p>
      </div>

      {success && (
        <div style={{ marginBottom:16, padding:"12px 16px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, fontSize:13, color:"#166534", fontWeight:500 }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ marginBottom:16, padding:"12px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#991b1b" }}>
          ⚠ {error}
        </div>
      )}

      {/* Current plan */}
      {!loading && (
        <div style={{ ...S.card, marginBottom:20, background: sub?.status==="active" ? "#f0fdf4" : "#fffbeb", border: sub?.status==="active" ? "1px solid #bbf7d0" : "1px solid #fde68a" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", margin:"0 0 6px" }}>Current Plan</p>
              {sub?.status === "active" ? (
                <>
                  <p style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:"0 0 4px", textTransform:"capitalize" }}>{sub.plan} — {fmt(sub.amount)}/{sub.billingCycle==="yearly"?"year":"month"}</p>
                  <p style={{ fontSize:12, color:"#64748b", margin:0 }}>Valid until {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>Free Plan</p>
                  <p style={{ fontSize:12, color:"#92400e", margin:0 }}>Upgrade to unlock all services</p>
                </>
              )}
            </div>
            <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, background: sub?.status==="active"?"#dcfce7":"#fef3c7", color: sub?.status==="active"?"#166534":"#92400e" }}>
              {sub?.status==="active" ? "Active" : "Free"}
            </span>
          </div>
        </div>
      )}

      {/* Billing toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>Billing</span>
        <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3 }}>
          <button onClick={()=>setCycle("monthly")} style={{ padding:"6px 16px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:cycle==="monthly"?"#fff":"transparent", color:cycle==="monthly"?"#0f172a":"#94a3b8", boxShadow:cycle==="monthly"?"0 1px 3px rgba(0,0,0,0.1)":"none", transition:"all .15s" }}>Monthly</button>
          <button onClick={()=>setCycle("yearly")} style={{ padding:"6px 16px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:cycle==="yearly"?"#fff":"transparent", color:cycle==="yearly"?"#0f172a":"#94a3b8", boxShadow:cycle==="yearly"?"0 1px 3px rgba(0,0,0,0.1)":"none", transition:"all .15s" }}>
            Yearly <span style={{ fontSize:10, fontWeight:700, color:"#16a34a", marginLeft:4 }}>2 months free</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
        {PLANS.map(plan => {
          const amount    = cycle==="yearly" ? plan.yearly : plan.monthly;
          const isCurrent = currentPlan === plan.id;

          return (
            <div key={plan.id} style={{ ...S.card, border: isCurrent ? "2px solid #0f1f4a" : "1px solid #e8ecf0", position:"relative", display:"flex", flexDirection:"column" }}>
              {isCurrent && (
                <div style={{ position:"absolute", top:-1, right:16, background:"#0f1f4a", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:"0 0 6px 6px", textTransform:"uppercase", letterSpacing:".06em" }}>Current</div>
              )}
              <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>{plan.name}</h3>
              <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 14px" }}>{plan.desc}</p>
              <div style={{ marginBottom:16 }}>
                <span style={{ fontSize:26, fontWeight:800, color:"#0f1f4a" }}>{fmt(amount)}</span>
                <span style={{ fontSize:12, color:"#94a3b8" }}>/{cycle==="yearly"?"year":"month"}</span>
                {cycle==="yearly" && <p style={{ fontSize:11, color:"#16a34a", margin:"2px 0 0" }}>({fmt(plan.monthly)}/mo × 10)</p>}
              </div>
              <ul style={{ listStyle:"none", padding:0, margin:"0 0 20px", display:"flex", flexDirection:"column", gap:8, flex:1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display:"flex", gap:8, alignItems:"flex-start", fontSize:12, color:"#64748b" }}>
                    <span style={{ color:"#16a34a", fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(plan.id)}
                disabled={isCurrent || paying === plan.id}
                style={{ width:"100%", padding:"10px 0", borderRadius:8, border: isCurrent?"1px solid #e8ecf0":"none", background: isCurrent?"transparent":paying===plan.id?"#94a3b8":"#0f1f4a", color: isCurrent?"#94a3b8":"#fff", fontSize:13, fontWeight:600, cursor:isCurrent||paying===plan.id?"not-allowed":"pointer", transition:"background .15s" }}>
                {isCurrent ? "Current Plan" : paying===plan.id ? "Processing…" : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{ ...S.card, display:"flex", gap:24, flexWrap:"wrap" }}>
        {[["Secured by Razorpay","UPI, Cards, Net Banking"],["GST invoice provided","For all transactions"],["Cancel anytime","No lock-in period"]].map(([title,desc])=>(
          <div key={title}>
            <p style={{ fontSize:12, fontWeight:600, color:"#0f172a", margin:"0 0 2px" }}>{title}</p>
            <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}