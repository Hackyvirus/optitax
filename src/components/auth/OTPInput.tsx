"use client";
import { useRef } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  color: string;
}

export default function OTPInput({ value, onChange, color }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = (value || "").padEnd(6, " ").split("").slice(0, 6).map(c => c.trim());

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
      margin: "12px 0",
      width: "100%",
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          value={d}
          onChange={e => {
            const digit = e.target.value.replace(/\D/g, "").slice(-1);
            const arr = (value || "").padEnd(6, " ").split("").slice(0, 6).map(c => c.trim());
            arr[i] = digit;
            onChange(arr.join(""));
            if (digit && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={e => {
            if (e.key === "Backspace") {
              const arr = (value || "").padEnd(6, " ").split("").slice(0, 6).map(c => c.trim());
              arr[i] = "";
              onChange(arr.join(""));
              if (i > 0) refs.current[i - 1]?.focus();
            }
          }}
          onPaste={e => {
            const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            onChange(p);
            e.preventDefault();
            refs.current[Math.min(p.length, 5)]?.focus();
          }}
          style={{
            display: "block",
            width: 52,
            height: 60,
            minWidth: 52,
            minHeight: 60,
            textAlign: "center",
            fontSize: 24,
            fontWeight: 700,
            border: `2px solid ${d ? color : "#e2e8f0"}`,
            borderRadius: 12,
            outline: "none",
            background: d ? `${color}15` : "#ffffff",
            color: d ? color : "#1e293b",
            fontFamily: "monospace",
            padding: 0,
            margin: 0,
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}