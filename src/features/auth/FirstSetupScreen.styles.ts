import { CSSProperties } from "react";

export const S = {
  // 画面全体のコンテナ
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#002D62", // ロゴの開始色
    fontFamily: "sans-serif"
  } as CSSProperties,

  // ログインカード
  card: {
    width: "400px",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "15px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)" // 濃い背景用に深めの影
  } as CSSProperties,

  // 入力フィールド
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "5px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "16px",
    outlineColor: "#0055A4" // 入力時の枠線をロゴの青に
  } as CSSProperties,

  // ラベル
  label: {
    fontSize: "12px",
    color: "#4a5568",
    fontWeight: "bold",
    display: "block",
    marginTop: "15px"
  } as CSSProperties,

  // ログイン・登録ボタン
  primaryButton: {
    width: "100%",
    padding: "14px",
    marginTop: "30px",
    backgroundColor: "#0055A4", // ロゴの終了色
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s"
  } as CSSProperties,

  iconWrapper: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
    marginRight: "8px"
  } as CSSProperties,
};