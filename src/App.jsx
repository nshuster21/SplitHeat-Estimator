import { useState } from "react";

// ─── CURRENT AC SYSTEMS ───────────────────────────────────────────────────────
const CURRENT_AC = {
"Central AC (standard)": { seer: 14 },
"Older Central (pre-2006)": { seer: 9 },
"Window Unit(s)": { seer: 10 },
"Portable AC": { seer: 8 },
"No AC / First Install": { seer: 0 },
};

// ─── CURRENT HEATING SYSTEMS ──────────────────────────────────────────────────
const HEATING_SYSTEMS = {
"Gas Furnace": {
icon: "🔥", savingsPct: 0.30,
note: "Gas is often cheaper per BTU, so heating savings vary by local rates. National avg ~30% savings.",
warningColor: "#f4a44a",
},
"Electric Resistance / Baseboard": {
icon: "⚡", savingsPct: 0.55,
note: "Heat pumps are 2–3× more efficient than electric resistance — one of the biggest savings scenarios.",
warningColor: "#4cca8a",
},
"Oil / Propane": {
icon: "🛢️", savingsPct: 0.48,
note: "Oil and propane are expensive fuels. Heat pumps consistently save 40–55% on heating costs.",
warningColor: "#4cca8a",
},
"Existing Heat Pump": {
icon: "🔄", savingsPct: 0.20,
note: "Upgrading to a higher-SEER heat pump still saves ~15–25% on combined heating & cooling.",
warningColor: "#5fb4d4",
},
"No Heating / Other": {
icon: "❓", savingsPct: 0,
note: "Adding a heat pump gives you efficient heating you didn't have before.",
warningColor: "#5fb4d4",
},
};

const AGE_OPTIONS = ["0–5 yrs","6–10 yrs","11–15 yrs","15+ yrs"];
const AGE_SEER_LOSS = { "0–5 yrs":0, "6–10 yrs":1.5, "11–15 yrs":3, "15+ yrs":5 };

// ─── UPGRADE SYSTEMS ──────────────────────────────────────────────────────────
const TARGET_SYSTEMS = {
"Mini Split (AC Only)": {
mode:"ac", seer:22, icon:"❄️", color:"#00c8ff",
description:"Zone-by-zone cooling, no ductwork needed. Best per-zone efficiency.",
isMinisplit:true, perZoneLaborBase:600, laborFixed:400, miniCostMult:1.0,
},
"16 SEER Central AC": {
mode:"ac", seer:16, icon:"🏠", color:"#4cca8a",
description:"High-efficiency whole-home cooling. Great duct-based upgrade.",
isMinisplit:false, laborFixed:2200,
},
"18 SEER Central AC": {
mode:"ac", seer:18, icon:"⚡", color:"#f4c44a",
description:"Premium central cooling. Major savings over standard units.",
isMinisplit:false, laborFixed:2800,
},
"Mini Split Heat Pump": {
mode:"hp", seer:22, icon:"🔄", color:"#b67cff",
description:"Zone-by-zone heating & cooling. No ductwork, maximum efficiency.",
isMinisplit:true, perZoneLaborBase:700, laborFixed:400, miniCostMult:1.15,
},
"Central Heat Pump (17 SEER)": {
mode:"hp", seer:17, icon:"🌡️", color:"#ff8c5a",
description:"Whole-home heating & cooling. Replaces your AC and furnace in one system.",
isMinisplit:false, laborFixed:3000,
},
"Central Heat Pump (20 SEER)": {
mode:"hp", seer:20, icon:"🌟", color:"#ff5aaa",
description:"Top-tier whole-home heat pump. Best long-term efficiency and comfort.",
isMinisplit:false, laborFixed:3600,
},
};

// ─── SIZING TABLES ────────────────────────────────────────────────────────────
const MINI_BTU = [6000,9000,12000,18000,24000,36000];
const MINI_COSTS = { 6000:1600,9000:2000,12000:2500,18000:3100,24000:3700,36000:5000 };

const CENTRAL_TONS = [
{ tons:1.5, btu:18000, sqftMax:900 },
{ tons:2, btu:24000, sqftMax:1200 },
{ tons:2.5, btu:30000, sqftMax:1500 },
{ tons:3, btu:36000, sqftMax:1900 },
{ tons:3.5, btu:42000, sqftMax:2300 },
{ tons:4, btu:48000, sqftMax:2700 },
{ tons:5, btu:60000, sqftMax:9999 },
];

const CENTRAL_COSTS = {
"16 SEER Central AC": { 1.5:3200,2:3700,2.5:4200,3:4800,3.5:5400,4:6000,5:7000 },
"18 SEER Central AC": { 1.5:4100,2:4700,2.5:5300,3:6000,3.5:6800,4:7500,5:8800 },
"Central Heat Pump (17 SEER)": { 1.5:4500,2:5200,2.5:5900,3:6700,3.5:7500,4:8400,5:9800 },
"Central Heat Pump (20 SEER)": { 1.5:5800,2:6700,2.5:7600,3:8600,3.5:9600,4:10800,5:12500 },
};

const HEATING_MONTHLY_EST = {
"Gas Furnace": 110,
"Electric Resistance / Baseboard": 160,
"Oil / Propane": 180,
"Existing Heat Pump": 90,
"No Heating / Other": 0,
};

const AC_BILL_PCT = 0.42;

// ─── ROOM PRESETS ─────────────────────────────────────────────────────────────
const PRESETS = [
{ name:"Living Room", sqft:300, icon:"🛋️" },
{ name:"Kitchen", sqft:180, icon:"🍳" },
{ name:"Primary Bedroom", sqft:220, icon:"🛏️" },
{ name:"Bedroom", sqft:160, icon:"🛏️" },
{ name:"Home Office", sqft:130, icon:"💻" },
{ name:"Dining Room", sqft:160, icon:"🍽️" },
{ name:"Basement", sqft:450, icon:"🏚️" },
{ name:"Garage", sqft:400, icon:"🚗" },
{ name:"Sunroom", sqft:200, icon:"☀️" },
{ name:"Studio", sqft:500, icon:"🏠" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = n => "$" + Math.round(n).toLocaleString();
const btuForSqft = s => MINI_BTU.find(b => b >= s*20) || 36000;
const miniLabel = b => b < 12000 ? `${b/1000}k BTU` : `${b/12000}-Ton (${b/1000}k BTU)`;

function centralSizing(sqft, key) {
const row = CENTRAL_TONS.find(r => sqft <= r.sqftMax) || CENTRAL_TONS[CENTRAL_TONS.length-1];
const cost = (CENTRAL_COSTS[key]||{})[row.tons] || 5000;
return { tons:row.tons, btu:row.btu, equipCost:cost };
}

function autoZones(sqft) {
const n = Math.max(1, Math.ceil(sqft/450));
const z = Math.round(sqft/n);
return Array.from({length:n},(_,i)=>({name:i===0?"Main Zone":`Zone ${i+1}`,sqft:z,icon:"❄️"}));
}

function calcResults(form, rooms, targetKey) {
const bill = parseFloat(form.monthlyBill) || 0;
const sqft = parseFloat(form.sqft) || 0;
const isNew = form.acType === "No AC / First Install";
const curSys = CURRENT_AC[form.acType];
const ageLoss = AGE_SEER_LOSS[form.acAge] || 0;
const curSeer = isNew ? 10 : Math.max(curSys.seer - ageLoss, 5);
const tgt = TARGET_SYSTEMS[targetKey];
const isHP = tgt.mode === "hp";

const savingsPct = isNew ? 0 : Math.max(0, 1 - curSeer / tgt.seer);
const acBill = bill * AC_BILL_PCT;
const monthlyCoolSavings = isNew ? 0 : acBill * savingsPct;
const annualCoolSavings = monthlyCoolSavings * 12;

let monthlyHeatSavings = 0, annualHeatSavings = 0;
let heatNote = "", heatColor = "#5fb4d4";
if (isHP && form.heatingType) {
const hs = HEATING_SYSTEMS[form.heatingType];
const estHeatBill = HEATING_MONTHLY_EST[form.heatingType];
monthlyHeatSavings = estHeatBill * hs.savingsPct;
annualHeatSavings = monthlyHeatSavings * 12;
heatNote = hs.note;
heatColor = hs.warningColor;
}

const totalAnnualSavings = annualCoolSavings + annualHeatSavings;
const totalMonthlySavings = monthlyCoolSavings + monthlyHeatSavings;

let units=[], equipCost=0, laborCost=0, systemSummary="";
if (tgt.isMinisplit) {
const src = rooms.length > 0 ? rooms : autoZones(sqft);
const mult = tgt.miniCostMult || 1;
units = src.map(r => {
const btu = btuForSqft(parseInt(r.sqft)||50);
const cost = Math.round(MINI_COSTS[btu] * mult);
return { name:r.name, sqft:r.sqft, icon:r.icon||tgt.icon, btu, cost, label:miniLabel(btu) };
});
equipCost = units.reduce((s,u)=>s+u.cost,0);
laborCost = units.length * tgt.perZoneLaborBase + tgt.laborFixed;
systemSummary = `${units.length} zone${units.length>1?"s":""} · SEER ${tgt.seer} · ${isHP?"Heating & Cooling":"Cooling Only"}`;
} else {
const sz = centralSizing(sqft, targetKey);
equipCost = sz.equipCost;
laborCost = tgt.laborFixed;
units = [{ name:`${sz.tons}-Ton ${targetKey}`, sqft, icon:tgt.icon, label:`${sz.tons} Tons · ${sz.btu/1000}k BTU`, cost:sz.equipCost, btu:sz.btu }];
systemSummary = `${sz.tons}-Ton · SEER ${tgt.seer} · ${isHP?"Heating & Cooling":"Cooling Only"}`;
}

const totalCost = equipCost + laborCost;
const netCost = totalCost;
const payback = totalAnnualSavings > 0 ? netCost / totalAnnualSavings : null;
const roi10 = totalAnnualSavings * 10 - netCost;
const roi20 = totalAnnualSavings * 20 - netCost;

return {
monthlyCoolSavings, annualCoolSavings,
monthlyHeatSavings, annualHeatSavings,
totalMonthlySavings, totalAnnualSavings,
units, equipCost, laborCost, totalCost, netCost,
payback, roi10, roi20, savingsPct, isNew, isHP,
curSeer, newSeer:tgt.seer, systemSummary, heatNote, heatColor,
};
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const BRAND = "#EC2700";
const PAGE = { minHeight:"100vh", background:"linear-gradient(160deg,#0f0a0a 0%,#1a0a08 40%,#0d1520 100%)", fontFamily:"'Trebuchet MS','Segoe UI',sans-serif", color:"#ddeef8", paddingBottom:60 };
const WRAP = { maxWidth:740, margin:"0 auto", padding:"32px 20px" };
const CARD = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"22px", marginBottom:16 };
const LBL = { display:"block", fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"#c47060", marginBottom:10 };
const INP = { width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#ddeef8", fontSize:15, fontFamily:"inherit", boxSizing:"border-box", outline:"none" };
const chip = a => ({ padding:"10px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"inherit", textAlign:"center", transition:"all .15s", background:a?"rgba(0,180,255,0.15)":"rgba(255,255,255,0.04)", border:`1.5px solid ${a?"#00c8ff":"rgba(255,255,255,0.1)"}`, color:a?"#00c8ff":"#9bbfd4" });
const PRI = d => ({ width:"100%", padding:"15px", background:d?"rgba(180,30,0,0.2)":"linear-gradient(135deg,#b31a00,#EC2700)", color:d?"#6a3030":"#fff", border:"none", borderRadius:10, fontSize:16, fontFamily:"inherit", fontWeight:700, cursor:d?"not-allowed":"pointer", letterSpacing:"0.04em", marginTop:10 });
const GHOST = { padding:"10px 20px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#9bbfd4", fontSize:13, fontFamily:"inherit", cursor:"pointer" };

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function Steps({ cur }) {
const list = ["Your System","Upgrade Choice","Your Space","Results"];
return (
<div style={{display:"flex", marginBottom:32}}>
{list.map((s,i) => (
<div key={s} style={{flex:1, textAlign:"center"}}>
<div style={{height:3, background:i<cur?"linear-gradient(90deg,#b31a00,#EC2700)":"rgba(255,255,255,0.1)", marginBottom:7, borderRadius:2}}/>
<span style={{fontSize:10, color:i<cur?"#EC2700":"#3a6a88", letterSpacing:"0.08em", textTransform:"uppercase"}}>{s}</span>
</div>
))}
</div>
);
}

function SysBtn({ sysKey, active, onClick }) {
const s = TARGET_SYSTEMS[sysKey];
return (
<button onClick={onClick} style={{
display:"flex", alignItems:"flex-start", gap:14, padding:"16px 18px",
background:active?`${s.color}18`:"rgba(255,255,255,0.03)",
border:`2px solid ${active?s.color:"rgba(255,255,255,0.08)"}`,
borderRadius:12, cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .2s", width:"100%",
}}>
<div style={{fontSize:26, flexShrink:0, marginTop:2}}>{s.icon}</div>
<div style={{flex:1}}>
<div style={{fontSize:15, fontWeight:700, color:active?s.color:"#ddeef8", marginBottom:3}}>{sysKey}</div>
<div style={{fontSize:12, color:"#7ab4cc", lineHeight:1.5, marginBottom:6}}>{s.description}</div>
<span style={{background:`${s.color}20`, borderRadius:20, padding:"2px 10px", fontSize:11, color:s.color, fontWeight:600}}>SEER {s.seer}</span>
</div>
<div style={{width:20, height:20, borderRadius:"50%", border:`2px solid ${active?s.color:"rgba(255,255,255,0.2)"}`, background:active?s.color:"transparent", flexShrink:0, marginTop:3, display:"flex", alignItems:"center", justifyContent:"center"}}>
{active && <span style={{color:"#fff", fontSize:11, fontWeight:900}}>✓</span>}
</div>
</button>
);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
const [step, setStep] = useState(1);
const [form, setForm] = useState({ acType:"Central AC (standard)", acAge:"6–10 yrs", heatingType:"", sqft:"", monthlyBill:"" });
const [target, setTarget] = useState("Mini Split (AC Only)");
const [mode, setMode] = useState("ac");
const [rooms, setRooms] = useState([]);
const [results, setRes] = useState(null);
const [adding, setAdd] = useState(false);
const [custom, setCust] = useState({ name:"", sqft:"" });
const [sqftEdited, setSqftEdited]= useState(false);

const set = (k,v) => setForm(f => ({...f,[k]:v}));
const isNew = form.acType === "No AC / First Install";
const isHP = mode === "hp";
const isMini = TARGET_SYSTEMS[target]?.isMinisplit;

const syncSqft = (updated) => {
if (sqftEdited) return;
const total = updated.reduce((s,r) => s+(parseInt(r.sqft)||0), 0);
setForm(f => ({...f, sqft:total>0?String(total):""}));
};

const addPreset = p => { const u=[...rooms,{...p,id:Date.now()}]; setRooms(u); syncSqft(u); };
const removeRoom = id => { const u=rooms.filter(x=>x.id!==id); setRooms(u); syncSqft(u); };
const updateSqft = (id,val) => { const u=rooms.map(x=>x.id===id?{...x,sqft:val===""?"":Math.max(1,parseInt(val)||1)}:x); setRooms(u); syncSqft(u); };
const addCustom = () => {
if (!custom.name||!custom.sqft) return;
const u=[...rooms,{...custom,sqft:parseFloat(custom.sqft),icon:"📐",id:Date.now()}];
setRooms(u); syncSqft(u); setCust({name:"",sqft:""}); setAdd(false);
};

const switchMode = m => {
setMode(m);
const first = Object.keys(TARGET_SYSTEMS).find(k=>TARGET_SYSTEMS[k].mode===m);
setTarget(first);
if (m==="ac") setForm(f=>({...f,heatingType:""}));
};

const canCalc = !!form.sqft;
const goResults = () => { setRes(calcResults(form,rooms,target)); setStep(4); };
const reset = () => {
setStep(1);
setForm({acType:"Central AC (standard)",acAge:"6–10 yrs",heatingType:"",sqft:"",monthlyBill:""});
setTarget("Mini Split (AC Only)"); setMode("ac"); setRooms([]); setRes(null); setAdd(false); setSqftEdited(false);
};

const acSystems = Object.keys(TARGET_SYSTEMS).filter(k=>TARGET_SYSTEMS[k].mode==="ac");
const hpSystems = Object.keys(TARGET_SYSTEMS).filter(k=>TARGET_SYSTEMS[k].mode==="hp");

return (
<div style={PAGE}>
{/* Header */}
<div style={{background:"linear-gradient(135deg,#1a0500,#2a0800)", borderBottom:"2px solid #EC2700", padding:"14px 28px", display:"flex", alignItems:"center", gap:16}}>
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24 44 C14 44 8 36 8 28 C8 20 14 16 16 10 C17 14 16 18 18 20 C19 15 22 10 24 4 C26 10 30 14 32 20 C34 16 32 12 34 10 C36 16 40 20 40 28 C40 36 34 44 24 44Z" fill="#EC2700" opacity="0.9"/>
<path d="M24 40 C17 40 13 34 13 28 C13 23 17 20 18 16 C19 19 18 22 20 24 C21 20 23 17 24 12 C25 17 27 20 28 24 C30 22 29 19 30 16 C31 20 35 23 35 28 C35 34 31 40 24 40Z" fill="#ff5500" opacity="0.7"/>
<line x1="24" y1="16" x2="24" y2="32" stroke="#00c8ff" strokeWidth="2.5" strokeLinecap="round"/>
<line x1="16" y1="24" x2="32" y2="24" stroke="#00c8ff" strokeWidth="2.5" strokeLinecap="round"/>
<line x1="18.5" y1="18.5" x2="29.5" y2="29.5" stroke="#00c8ff" strokeWidth="2.5" strokeLinecap="round"/>
<line x1="29.5" y1="18.5" x2="18.5" y2="29.5" stroke="#00c8ff" strokeWidth="2.5" strokeLinecap="round"/>
<circle cx="24" cy="15" r="2" fill="#00c8ff"/>
<circle cx="24" cy="33" r="2" fill="#00c8ff"/>
<circle cx="15" cy="24" r="2" fill="#00c8ff"/>
<circle cx="33" cy="24" r="2" fill="#00c8ff"/>
<circle cx="18" cy="18" r="1.5" fill="#00c8ff"/>
<circle cx="30" cy="30" r="1.5" fill="#00c8ff"/>
<circle cx="30" cy="18" r="1.5" fill="#00c8ff"/>
<circle cx="18" cy="30" r="1.5" fill="#00c8ff"/>
</svg>
<div>
<div style={{fontSize:10, letterSpacing:"0.25em", textTransform:"uppercase", color:"#EC2700", fontWeight:600}}>by Alpha Group</div>
<div style={{fontSize:20, fontWeight:800, letterSpacing:"-0.01em"}}>
<span style={{color:"#00c8ff"}}>Split</span><span style={{color:"#EC2700"}}>Heat</span>
<span style={{color:"#ddeef8", fontWeight:400, fontSize:16}}> Estimator</span>
</div>
</div>
</div>

<div style={WRAP}>
<Steps cur={step}/>

{/* ══ STEP 1 ══ */}
{step===1 && (
<div>
<h2 style={{fontSize:21,fontWeight:700,marginBottom:5}}>What's your current setup?</h2>
<p style={{color:"#5fb4d4",fontSize:14,marginBottom:26}}>We'll use this to calculate exactly how much you could save by upgrading.</p>

<div style={CARD}>
<label style={LBL}>Current AC System</label>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
{Object.keys(CURRENT_AC).map(t=>(
<button key={t} onClick={()=>set("acType",t)} style={chip(form.acType===t)}>{t}</button>
))}
</div>
</div>

{!isNew && (
<div style={CARD}>
<label style={LBL}>How old is your current AC unit?</label>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
{AGE_OPTIONS.map(a=>(
<button key={a} onClick={()=>set("acAge",a)} style={chip(form.acAge===a)}>{a}</button>
))}
</div>
<p style={{fontSize:12,color:"#3a6a88",marginTop:10}}>Older units degrade — a 15-year-old 14 SEER unit may only perform at ~9 SEER.</p>
</div>
)}

<div style={CARD}>
<label style={LBL}>Current Heating System</label>
<p style={{fontSize:12,color:"#3a6a88",marginBottom:12}}>Needed if you're considering a heat pump — we'll calculate your combined heating & cooling savings.</p>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
{Object.entries(HEATING_SYSTEMS).map(([k,v])=>(
<button key={k} onClick={()=>set("heatingType",k)} style={{...chip(form.heatingType===k),display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
<span>{v.icon}</span><span>{k}</span>
</button>
))}
</div>
</div>

<div style={CARD}>
<label style={LBL}>Monthly Electric Bill</label>
<div style={{position:"relative"}}>
<span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#5fb4d4",fontSize:15}}>$</span>
<input type="number" placeholder="e.g. 180" value={form.monthlyBill}
onChange={e=>set("monthlyBill",e.target.value)} style={{...INP,paddingLeft:28}}/>
</div>
<p style={{fontSize:12,color:"#3a6a88",marginTop:8}}>AC typically makes up ~42% of your electric bill.</p>
</div>

<button onClick={()=>setStep(2)} disabled={!form.monthlyBill} style={PRI(!form.monthlyBill)}>
Next: Choose Your Upgrade →
</button>
</div>
)}

{/* ══ STEP 2 ══ */}
{step===2 && (
<div>
<h2 style={{fontSize:21,fontWeight:700,marginBottom:5}}>What would you like to upgrade to?</h2>
<p style={{color:"#5fb4d4",fontSize:14,marginBottom:22}}>First choose whether you want cooling only or a full heat pump system.</p>

{/* Incentive banner */}
<div style={{...CARD,background:"linear-gradient(135deg,rgba(76,202,138,0.1),rgba(0,180,255,0.08))",border:"1px solid rgba(76,202,138,0.3)",marginBottom:20}}>
<div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
<div style={{fontSize:26,flexShrink:0}}>💰</div>
<div style={{flex:1}}>
<div style={{fontSize:14,fontWeight:700,color:"#4cca8a",marginBottom:6}}>New York Rebates & Incentives Available</div>
<p style={{fontSize:12,color:"#7ab4cc",lineHeight:1.6,marginBottom:10}}>
As a New York homeowner, you may qualify for rebates that significantly reduce your upgrade cost. These programs are especially generous for heat pump systems.
</p>
<div style={{display:"flex",flexWrap:"wrap",gap:8}}>
{[{name:"HOMES Rebate",color:"#4cca8a"},{name:"NYS Clean Heat",color:"#00c8ff"},{name:"Con Edison",color:"#f4c44a"},{name:"NYSEG",color:"#ff8c5a"}].map(p=>(
<span key={p.name} style={{background:`${p.color}18`,border:`1px solid ${p.color}44`,borderRadius:20,padding:"3px 12px",fontSize:11,color:p.color,fontWeight:600}}>✓ {p.name}</span>
))}
</div>
<p style={{fontSize:11,color:"#3a6a88",marginTop:10}}>Links to apply for each program will appear on your results page after you calculate your savings.</p>
</div>
</div>
</div>

{/* Mode toggle */}
<div style={{display:"flex",gap:12,marginBottom:20}}>
{[
{key:"ac",icon:"❄️",label:"AC Only", desc:"Cooling only — keep your existing heater.", color:"#00c8ff"},
{key:"hp",icon:"🔄",label:"Heat Pump", desc:"Heating AND cooling — one system does both.", color:"#b67cff"},
].map(m=>(
<button key={m.key} onClick={()=>switchMode(m.key)} style={{
flex:1,padding:"18px 14px",borderRadius:12,cursor:"pointer",fontFamily:"inherit",
textAlign:"center",transition:"all .2s",
background:mode===m.key?`${m.color}18`:"rgba(255,255,255,0.03)",
border:`2px solid ${mode===m.key?m.color:"rgba(255,255,255,0.08)"}`,
}}>
<div style={{fontSize:30,marginBottom:8}}>{m.icon}</div>
<div style={{fontSize:15,fontWeight:700,color:mode===m.key?m.color:"#ddeef8",marginBottom:5}}>{m.label}</div>
<div style={{fontSize:12,color:"#7ab4cc",lineHeight:1.5}}>{m.desc}</div>
</button>
))}
</div>

{isHP && form.heatingType && form.heatingType!=="No Heating / Other" && (
<div style={{...CARD,background:"rgba(182,124,255,0.08)",border:"1px solid rgba(182,124,255,0.25)",marginBottom:16}}>
<div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
<div style={{fontSize:26,flexShrink:0}}>💜</div>
<div>
<div style={{fontSize:14,fontWeight:700,color:"#b67cff",marginBottom:4}}>Heat Pump Advantage for You</div>
<div style={{fontSize:13,color:"#c9a8ff",lineHeight:1.6}}>{HEATING_SYSTEMS[form.heatingType].note}</div>
<div style={{fontSize:12,color:"#7ab4cc",marginTop:8}}>Your results will show <strong style={{color:"#ddeef8"}}>combined cooling + heating savings</strong> — a much bigger number than AC alone.</div>
</div>
</div>
</div>
)}

{isHP && !form.heatingType && (
<div style={{...CARD,background:"rgba(244,164,74,0.08)",border:"1px solid rgba(244,164,74,0.2)",marginBottom:16}}>
<p style={{fontSize:13,color:"#f4a44a",margin:0}}>💡 Go back and select your current heating system to see combined heating & cooling savings.</p>
</div>
)}

<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
{(isHP?hpSystems:acSystems).map(k=>(
<SysBtn key={k} sysKey={k} active={target===k} onClick={()=>setTarget(k)}/>
))}
</div>

<div style={{display:"flex",gap:12}}>
<button onClick={()=>setStep(1)} style={{...GHOST,flexShrink:0}}>← Back</button>
<button onClick={()=>setStep(3)} style={{...PRI(false),marginTop:0,flex:1}}>Next: Your Space →</button>
</div>
</div>
)}

{/* ══ STEP 3 ══ */}
{step===3 && (
<div>
<h2 style={{fontSize:21,fontWeight:700,marginBottom:5}}>Tell us about your space</h2>
<p style={{color:"#5fb4d4",fontSize:14,marginBottom:26}}>
{!isMini?"Enter your total square footage — we'll size the system for your whole home."
:"Add rooms below and the total sq ft will auto-fill. Adjust upward for hallways & bathrooms."}
</p>

<div style={CARD}>
<label style={LBL}>Total Home Size (sq ft) <span style={{color:"#e05c5c",marginLeft:2}}>*</span></label>
<input type="number" placeholder="e.g. 1800" value={form.sqft}
onChange={e=>{setSqftEdited(true);set("sqft",e.target.value);}}
style={{...INP,borderColor:form.sqft?"rgba(255,255,255,0.1)":"rgba(224,92,92,0.4)"}}/>
{isMini&&rooms.length>0&&!sqftEdited&&(
<p style={{fontSize:12,color:"#4cca8a",marginTop:8}}>✓ Auto-filled from room totals. Adjust upward to include hallways, bathrooms & closets.</p>
)}
{isMini&&rooms.length>0&&sqftEdited&&(
<p style={{fontSize:12,color:"#5fb4d4",marginTop:8}}>
Manually set. Room totals: {rooms.reduce((s,r)=>s+(parseInt(r.sqft)||0),0).toLocaleString()} sq ft.
<button onClick={()=>{setSqftEdited(false);syncSqft(rooms);}} style={{background:"none",border:"none",color:"#00c8ff",cursor:"pointer",fontSize:12,marginLeft:8,textDecoration:"underline",fontFamily:"inherit"}}>Reset to room total</button>
</p>
)}
{!form.sqft&&<p style={{fontSize:12,color:"#e05c5c",marginTop:8}}>Required — needed to size your system correctly.</p>}
</div>

{isMini && (
<div style={CARD}>
<div style={{marginBottom:14}}>
<label style={{...LBL,marginBottom:4}}>Add Rooms / Zones <span style={{color:"#3a6a88",fontStyle:"italic",textTransform:"none",letterSpacing:0,marginLeft:6,fontWeight:400}}>— optional</span></label>
<p style={{fontSize:12,color:"#3a6a88",margin:0}}>Each room gets its own correctly-sized unit. Adjust sq ft to fine-tune the recommendation.</p>
</div>

{rooms.length>0&&(
<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
{rooms.map(r=>(
<div key={r.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(0,180,255,0.07)",border:"1px solid rgba(0,180,255,0.18)",borderRadius:9,padding:"10px 14px"}}>
<span style={{fontSize:18,flexShrink:0}}>{r.icon}</span>
<span style={{fontSize:14,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
<div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
<input type="number" value={r.sqft}
onChange={e=>updateSqft(r.id,e.target.value)}
onBlur={e=>{if(!e.target.value||parseInt(e.target.value)<1)updateSqft(r.id,"50");}}
style={{...INP,width:80,padding:"6px 10px",fontSize:13,textAlign:"center"}}/>
<span style={{fontSize:12,color:"#5fb4d4"}}>sq ft</span>
</div>
<div style={{background:"rgba(0,200,255,0.12)",borderRadius:6,padding:"4px 9px",fontSize:11,color:"#00c8ff",flexShrink:0}}>
{r.sqft!==""?miniLabel(btuForSqft(parseInt(r.sqft)||50)):"—"}
</div>
<button onClick={()=>removeRoom(r.id)} style={{background:"none",border:"none",color:"#3a6a88",cursor:"pointer",fontSize:18,padding:0,lineHeight:1}}>×</button>
</div>
))}
<div style={{fontSize:12,color:"#3a6a88"}}>
{rooms.length} zone{rooms.length>1?"s":""} · {rooms.reduce((s,r)=>s+(parseInt(r.sqft)||0),0).toLocaleString()} sq ft total
</div>
</div>
)}

<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
{PRESETS.map(p=>(
<button key={p.name} onClick={()=>addPreset(p)} style={{padding:"7px 13px",borderRadius:20,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",color:"#9bbfd4",fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
{p.icon} + {p.name}
</button>
))}
</div>

{!adding?(
<button onClick={()=>setAdd(true)} style={{...GHOST,fontSize:12}}>+ Custom Room</button>
):(
<div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
<div style={{flex:"2 1 130px"}}>
<label style={{...LBL,fontSize:10}}>Room Name</label>
<input placeholder="e.g. Bonus Room" value={custom.name} onChange={e=>setCust(c=>({...c,name:e.target.value}))} style={INP}/>
</div>
<div style={{flex:"1 1 80px"}}>
<label style={{...LBL,fontSize:10}}>Sq Ft</label>
<input type="number" placeholder="200" value={custom.sqft} onChange={e=>setCust(c=>({...c,sqft:e.target.value}))} style={INP}/>
</div>
<button onClick={addCustom} style={{...GHOST,background:"rgba(0,180,255,0.12)",border:"1px solid rgba(0,180,255,0.3)",color:"#00c8ff",whiteSpace:"nowrap",alignSelf:"flex-end"}}>Add</button>
<button onClick={()=>setAdd(false)} style={{...GHOST,color:"#3a6a88",alignSelf:"flex-end"}}>✕</button>
</div>
)}
</div>
)}

<div style={{display:"flex",gap:12}}>
<button onClick={()=>setStep(2)} style={{...GHOST,flexShrink:0}}>← Back</button>
<button onClick={goResults} disabled={!canCalc} style={{...PRI(!canCalc),flex:1,marginTop:0}}>Calculate My Savings →</button>
</div>
</div>
)}

{/* ══ STEP 4: Results ══ */}
{step===4&&results&&(()=>{
const tgt = TARGET_SYSTEMS[target];
const hasHeatSavings = results.isHP && results.annualHeatSavings > 0;
return (
<div>
<h2 style={{fontSize:21,fontWeight:700,marginBottom:4}}>Your Savings Report</h2>
<p style={{color:"#5fb4d4",fontSize:14,marginBottom:22}}>
{form.acType} → <strong style={{color:tgt.color}}>{target}</strong> · {parseFloat(form.sqft).toLocaleString()} sq ft · ${form.monthlyBill}/mo bill
</p>

{/* Savings hero */}
{!results.isNew&&(
<div style={{background:`linear-gradient(135deg,rgba(0,87,255,0.18),${tgt.color}22)`,border:`1px solid ${tgt.color}55`,borderRadius:16,padding:"26px",marginBottom:16,textAlign:"center"}}>
<div style={{fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"#5fb4d4",marginBottom:8}}>
{hasHeatSavings?"Total Annual Savings (Cooling + Heating)":"Estimated Annual Savings"}
</div>
<div style={{fontSize:54,fontWeight:900,color:tgt.color,lineHeight:1,marginBottom:6}}>{fmt(results.totalAnnualSavings)}</div>
<div style={{color:"#9bbfd4",fontSize:14,marginBottom:hasHeatSavings?16:0}}>
That's <strong style={{color:"#ddeef8"}}>{fmt(results.totalMonthlySavings)}/month</strong> back in your pocket
</div>
{hasHeatSavings&&(
<div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
<div style={{background:"rgba(0,200,255,0.12)",borderRadius:10,padding:"10px 18px",minWidth:130}}>
<div style={{fontSize:10,color:"#5fb4d4",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>❄️ Cooling Savings</div>
<div style={{fontSize:20,fontWeight:800,color:"#00c8ff"}}>{fmt(results.annualCoolSavings)}<span style={{fontSize:12,fontWeight:400,color:"#5fb4d4"}}>/yr</span></div>
</div>
<div style={{background:"rgba(182,124,255,0.12)",borderRadius:10,padding:"10px 18px",minWidth:130}}>
<div style={{fontSize:10,color:"#b67cff",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>🔥 Heating Savings</div>
<div style={{fontSize:20,fontWeight:800,color:"#b67cff"}}>{fmt(results.annualHeatSavings)}<span style={{fontSize:12,fontWeight:400,color:"#b67cff"}}>/yr</span></div>
</div>
</div>
)}
</div>
)}

{results.isNew&&(
<div style={{...CARD,textAlign:"center",padding:"22px"}}>
<div style={{fontSize:30,marginBottom:8}}>🏠</div>
<div style={{fontSize:15,fontWeight:700,marginBottom:4}}>New Installation</div>
<p style={{fontSize:13,color:"#5fb4d4"}}>No current AC to compare against. See your unit recommendation and install cost below.</p>
</div>
)}

{/* Heating note */}
{results.isHP&&results.heatNote&&(
<div style={{...CARD,background:`${results.heatColor}12`,border:`1px solid ${results.heatColor}33`,marginBottom:16}}>
<div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
<span style={{fontSize:20,flexShrink:0}}>💡</span>
<div>
<div style={{fontSize:13,fontWeight:700,color:results.heatColor,marginBottom:4}}>About Your Heating Savings</div>
<div style={{fontSize:13,color:"#c0d8e8",lineHeight:1.6}}>{results.heatNote}</div>
{form.heatingType&&(
<div style={{fontSize:12,color:"#3a6a88",marginTop:6}}>Based on a national avg {form.heatingType} bill of ~${HEATING_MONTHLY_EST[form.heatingType]}/mo.</div>
)}
</div>
</div>
</div>
)}

{/* SEER bar */}
{!results.isNew&&(
<div style={{...CARD,marginBottom:16}}>
<label style={LBL}>Efficiency Comparison (SEER Rating)</label>
<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
<span style={{fontSize:12,color:"#5fb4d4",width:100,flexShrink:0}}>Current: SEER {results.curSeer}</span>
<div style={{flex:1,height:10,background:"rgba(255,255,255,0.07)",borderRadius:5,overflow:"hidden"}}>
<div style={{height:"100%",width:`${(results.curSeer/results.newSeer)*100}%`,background:"linear-gradient(90deg,#f4664a,#f4a44a)",borderRadius:5}}/>
</div>
</div>
<div style={{display:"flex",alignItems:"center",gap:12}}>
<span style={{fontSize:12,color:tgt.color,width:100,flexShrink:0}}>Upgrade: SEER {results.newSeer}</span>
<div style={{flex:1,height:10,background:"rgba(255,255,255,0.07)",borderRadius:5,overflow:"hidden"}}>
<div style={{height:"100%",width:"100%",background:`linear-gradient(90deg,#0057ff,${tgt.color})`,borderRadius:5}}/>
</div>
</div>
<p style={{fontSize:12,color:"#3a6a88",marginTop:8}}>↑ {Math.round(results.savingsPct*100)}% more efficient on cooling — your AC costs drop by that much.</p>
</div>
)}

{/* ROI Cards */}
{!results.isNew&&(
<div style={{marginBottom:16}}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
{[
{ icon:"📈", label:"10-Year Savings", value:results.roi10>=0?fmt(results.roi10):fmt(0), sub:"Profit after install cost" },
{ icon:"💰", label:"20-Year Savings", value:fmt(Math.max(0,results.roi20)), sub:"Long-term profit" },
].map(c=>(
<div key={c.label} style={{...CARD,textAlign:"center",padding:"20px 14px",marginBottom:0}}>
<div style={{fontSize:26,marginBottom:8}}>{c.icon}</div>
<div style={{fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"#5fb4d4",marginBottom:6}}>{c.label}</div>
<div style={{fontSize:22,fontWeight:800,color:"#4cca8a",marginBottom:4}}>{c.value}</div>
<div style={{fontSize:11,color:"#3a6a88"}}>{c.sub}</div>
</div>
))}
</div>
<div style={{background:"linear-gradient(135deg,rgba(236,39,0,0.12),rgba(179,26,0,0.08))",border:"1px solid rgba(236,39,0,0.35)",borderRadius:10,padding:"14px 20px",textAlign:"center",lineHeight:1.6}}>
<span style={{fontSize:15,color:"#ddeef8"}}>
💡 You'll save{" "}<strong style={{color:"#EC2700",fontSize:16}}>{fmt(Math.max(0,results.roi20))}</strong>{" "}over 20 years on a{" "}<strong style={{color:"#ddeef8",fontSize:16}}>{fmt(results.netCost)}</strong>{" "}install.
</span>
</div>
</div>
)}

{/* Unit recommendations */}
<div style={CARD}>
<label style={LBL}>Recommended System Configuration</label>
<div style={{fontSize:12,color:"#3a6a88",marginBottom:12}}>{results.systemSummary}</div>
<div style={{display:"flex",flexDirection:"column",gap:8}}>
{results.units.map((u,i)=>(
<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,180,255,0.06)",border:"1px solid rgba(0,180,255,0.14)",borderRadius:10,padding:"13px 15px"}}>
<div style={{display:"flex",alignItems:"center",gap:12}}>
<div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,#0057ff,${tgt.color})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{u.icon}</div>
<div>
<div style={{fontSize:14,fontWeight:600}}>{u.name}</div>
<div style={{fontSize:12,color:"#5fb4d4"}}>{Number(u.sqft).toLocaleString()} sq ft · {u.label}</div>
</div>
</div>
<div style={{fontSize:15,fontWeight:700,flexShrink:0}}>{fmt(u.cost)}</div>
</div>
))}
</div>
<div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
{[
{label:`Equipment (${results.units.length} unit${results.units.length>1?"s":""})`,val:fmt(results.equipCost),c:"#5fb4d4"},
{label:"Labor & Installation",val:fmt(results.laborCost),c:"#5fb4d4"},
].map(row=>(
<div key={row.label} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:row.c,marginBottom:7}}>
<span>{row.label}</span><span>{row.val}</span>
</div>
))}
<div style={{display:"flex",justifyContent:"space-between",fontSize:17,fontWeight:800,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
<span>Estimated Net Cost</span>
<span style={{color:"#ddeef8"}}>{fmt(results.netCost)}</span>
</div>
</div>
</div>

<p style={{fontSize:11,color:"#2a5268",lineHeight:1.7,marginBottom:20}}>
* Estimates based on U.S. DOE averages and industry benchmarks. Heating savings use national average fuel costs and may vary significantly by region. Cooling savings calculated from SEER efficiency improvement. Actual costs vary by region, contractor, and home configuration. Consult a licensed HVAC technician for an in-home load calculation before purchase.
</p>

{/* Incentive Programs */}
<div style={{...CARD,marginBottom:16}}>
<label style={LBL}>💰 Apply for NY Rebates & Incentives</label>
<p style={{fontSize:13,color:"#7ab4cc",marginBottom:16,lineHeight:1.6}}>
{results.isHP
?"As a New York homeowner installing a heat pump, you may qualify for all four programs below. Apply through each program's website — your HVAC contractor can also help submit on your behalf."
:"New York homeowners upgrading their AC may qualify for utility rebates. Click below to check your eligibility and apply."}
</p>
<div style={{display:"flex",flexDirection:"column",gap:10}}>

<a href="https://www.energy.gov/scep/home-efficiency-rebates" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:"rgba(76,202,138,0.08)",border:"1px solid rgba(76,202,138,0.25)",borderRadius:11,textDecoration:"none"}}>
<div style={{width:42,height:42,borderRadius:10,background:"linear-gradient(135deg,#1a7a4a,#4cca8a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏠</div>
<div style={{flex:1}}>
<div style={{fontSize:14,fontWeight:700,color:"#4cca8a",marginBottom:2}}>HOMES Rebate Program</div>
<div style={{fontSize:12,color:"#7ab4cc",lineHeight:1.5}}>Home Owner Managing Energy Savings — federal rebates up to $8,000 for whole-home energy efficiency upgrades including heat pumps.</div>
</div>
<div style={{fontSize:13,fontWeight:700,color:"#4cca8a",flexShrink:0}}>Apply →</div>
</a>

<a href="https://www.nyserda.ny.gov/All-Programs/Clean-Heat" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:"rgba(0,180,255,0.08)",border:"1px solid rgba(0,180,255,0.25)",borderRadius:11,textDecoration:"none"}}>
<div style={{width:42,height:42,borderRadius:10,background:"linear-gradient(135deg,#0057aa,#00c8ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🌿</div>
<div style={{flex:1}}>
<div style={{fontSize:14,fontWeight:700,color:"#00c8ff",marginBottom:2}}>NYS Clean Heat — NYSERDA</div>
<div style={{fontSize:12,color:"#7ab4cc",lineHeight:1.5}}>Statewide NY rebate program for heat pumps. Rebates vary by system type, size, and utility provider — apply through your installer.</div>
</div>
<div style={{fontSize:13,fontWeight:700,color:"#00c8ff",flexShrink:0}}>Apply →</div>
</a>

<a href="https://www.coned.com/en/save-money/rebates-incentives-tax-credits/rebates-incentives-tax-credits-for-customers-in-new-york/heat-pump-rebate" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:"rgba(244,196,74,0.08)",border:"1px solid rgba(244,196,74,0.25)",borderRadius:11,textDecoration:"none"}}>
<div style={{width:42,height:42,borderRadius:10,background:"linear-gradient(135deg,#a07800,#f4c44a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⚡</div>
<div style={{flex:1}}>
<div style={{fontSize:14,fontWeight:700,color:"#f4c44a",marginBottom:2}}>Con Edison — Heat Pump Rebates</div>
<div style={{fontSize:12,color:"#7ab4cc",lineHeight:1.5}}>For NYC & Westchester customers. Check eligibility for rebates on qualifying heat pump and high-efficiency AC systems.</div>
</div>
<div style={{fontSize:13,fontWeight:700,color:"#f4c44a",flexShrink:0}}>Apply →</div>
</a>

<a href="https://www.nyseg.com/wps/portal/nyseg/saveenergy/heatingcooling/heatpumps" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:"rgba(255,140,90,0.08)",border:"1px solid rgba(255,140,90,0.25)",borderRadius:11,textDecoration:"none"}}>
<div style={{width:42,height:42,borderRadius:10,background:"linear-gradient(135deg,#a04020,#ff8c5a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🔆</div>
<div style={{flex:1}}>
<div style={{fontSize:14,fontWeight:700,color:"#ff8c5a",marginBottom:2}}>NYSEG — Heat Pump Rebates</div>
<div style={{fontSize:12,color:"#7ab4cc",lineHeight:1.5}}>New York State Electric & Gas customers can access rebates for heat pump installations — available for central and mini split systems.</div>
</div>
<div style={{fontSize:13,fontWeight:700,color:"#ff8c5a",flexShrink:0}}>Apply →</div>
</a>

</div>
<p style={{fontSize:11,color:"#2a5268",marginTop:14,lineHeight:1.6}}>
💡 Rebate amounts and eligibility change frequently. Always confirm current offers directly with the program before installation. Your HVAC contractor can also help identify which programs you qualify for and submit paperwork on your behalf.
</p>
</div>

{/* CTA */}
<div style={{background:"linear-gradient(135deg,rgba(180,26,0,0.2),rgba(236,39,0,0.12))",border:"1px solid rgba(236,39,0,0.35)",borderRadius:14,padding:"22px",textAlign:"center",marginBottom:16}}>
<div style={{fontSize:17,fontWeight:700,marginBottom:5}}>Ready to make the switch?</div>
<p style={{fontSize:13,color:"#ffb3a0",marginBottom:16}}>Get a free in-home assessment and exact quote from a certified technician.</p>
<button style={{padding:"13px 34px",background:"linear-gradient(135deg,#b31a00,#EC2700)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer",letterSpacing:"0.03em"}}>
Get a Free Quote →
</button>
</div>

<button onClick={reset} style={GHOST}>← Start Over</button>
</div>
);
})()}
</div>
</div>
);
}

