import { CSSProperties } from "react";

export const S = {
  // 画面全体のコンテナ
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#002D62", // ロゴの開始色
    color: "white",
    fontFamily: "sans-serif"
  } as CSSProperties,

  // ログインカード
  card: {
    width: "350px",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)", // 濃い背景用の深い影
    color: "#2c3e50"
  } as CSSProperties,

  inputGroup: {
    marginBottom: "20px"
  } as CSSProperties,

  label: {
    fontSize: "12px",
    color: "#4a5568",
    fontWeight: "bold"
  } as CSSProperties,

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "5px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "16px",
    outlineColor: "#0055A4" // フォーカス時の色
  } as CSSProperties,

  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#0055A4", // ロゴの終了色
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "all 0.2s"
  } as CSSProperties,

  // エラーテキスト
  errorText: {
    color: "#e74c3c",
    fontSize: "13px",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  } as CSSProperties,
};