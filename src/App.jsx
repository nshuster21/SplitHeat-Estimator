import { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const NYC_GAS_RATE   = 1.35;   // $/therm
const NYC_STEAM_RATE = 30.0;   // $/MMBtu
const NYC_ELEC_RATE  = 0.18;   // $/kWh
const BTU_PER_ROOM_HEAT = 8500;
const BTU_PER_ROOM_COOL = 6500;
const HEAT_HRS = 4380;
const COOL_HRS = 2190;

const fmt = (n, d = 0) =>
  n == null || isNaN(n) || !isFinite(n) ? "—"
  : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const usd = (n) =>
  n == null || isNaN(n) || !isFinite(n) ? "—" : "$" + fmt(Math.abs(n));

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        "#1A1A1A",
  surface:   "#141414",
  surfaceB:  "#222222",
  border:    "#2E2E2E",
  borderB:   "#3A3A3A",
  blue:      "#2B7FD4",
  blueLight: "#0D1E30",
  blueDark:  "#5AABFF",
  text:      "#F0F0F0",
  textMid:   "#A0A0A0",
  textMute:  "#606060",
  red:       "#EC2700",
  green:     "#22A05A",
};

// ─── Components ───────────────────────────────────────────────────────────────
function Label({ children, hint, optional }) {
  return (
    <div style={{ marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMid }}>
        {children}
      </span>
      {optional && <span style={{ fontSize: 10, color: T.textMute, background: T.surfaceB, borderRadius: 3, padding: "1px 5px" }}>optional</span>}
      {hint && <span style={{ fontSize: 10, color: T.textMute }}>{hint}</span>}
    </div>
  );
}

function Field({ label, hint, optional, value, onChange, unit, min = 0, max, step = 1, readOnly = false, prefix, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label hint={hint} optional={optional}>{label}</Label>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {prefix && (
          <span style={{ background: T.surfaceB, border: `1px solid ${T.border}`, borderRight: "none", borderRadius: "5px 0 0 5px", fontSize: 13, color: T.textMute, padding: "8px 10px", display: "flex", alignItems: "center" }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={e => onChange && onChange(parseFloat(e.target.value) || 0)}
          style={{
            flex: 1,
            background: readOnly ? T.surfaceB : "#222",
            border: `1px solid ${T.border}`,
            borderLeft: prefix ? "none" : `1px solid ${T.border}`,
            borderRight: unit ? "none" : `1px solid ${T.border}`,
            borderRadius: prefix ? (unit ? "0" : "0 5px 5px 0") : (unit ? "5px 0 0 5px" : "5px"),
            color: readOnly ? T.textMute : T.text,
            fontSize: 14,
            padding: "8px 10px",
            outline: "none",
            cursor: readOnly ? "not-allowed" : "auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        {unit && (
          <span style={{ background: T.surfaceB, border: `1px solid ${T.border}`, borderRadius: "0 5px 5px 0", fontSize: 11, color: T.textMute, padding: "8px 9px", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{
        width: 38, height: 22, borderRadius: 11,
        background: checked ? T.blue : T.surfaceB,
        border: `1.5px solid ${checked ? T.blue : T.border}`,