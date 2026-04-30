import { CSSProperties } from "react";

export const containerStyle: CSSProperties = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  // 🆕 ロゴの開始色 #002D62 に変更
  backgroundColor: "#002D62",
  color: "white",
  fontFamily: "sans-serif"
};

export const cardStyle: CSSProperties = {
  width: "350px",
  padding: "40px",
  backgroundColor: "white",
  borderRadius: "12px",
  // 濃い背景に合わせて影の広がりと不透明度を調整
  boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
  color: "#2c3e50"
};

export const inputGroupStyle: CSSProperties = {
  marginBottom: "20px"
};

export const labelStyle: CSSProperties = {
  fontSize: "12px",
  color: "#4a5568", // 視認性を高めるため少し濃いグレーに
  fontWeight: "bold"
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  marginTop: "5px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  boxSizing: "border-box",
  fontSize: "16px",
  outlineColor: "#0055A4" // フォーカス時の色をロゴの青に
};

export const buttonStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  // 🆕 ロゴの終了色 #0055A4 に変更
  backgroundColor: "#0055A4",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
  transition: "all 0.2s",
};