import { CSSProperties } from "react";

export const containerStyle: CSSProperties = {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // 🆕 ロゴの開始色 #002D62 を採用
    backgroundColor: "#002D62",
    fontFamily: "sans-serif"
};

export const cardStyle: CSSProperties = {
    width: "400px",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "15px",
    // 影を少し深くして、濃い背景の上で浮き出るように調整
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
};

export const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px",
    marginTop: "5px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "16px",
    outlineColor: "#0055A4" // 入力時の枠線をロゴの青に
};

export const labelStyle: CSSProperties = {
    fontSize: "12px",
    color: "#4a5568", // 少し濃いめにして読みやすく
    fontWeight: "bold",
    display: "block",
    marginTop: "15px"
};

/**
 * 🆕 ログインボタンや登録ボタン用のスタイルも追加
 */
export const primaryButtonStyle: CSSProperties = {
    width: "100%",
    padding: "14px",
    marginTop: "30px",
    // 🆕 ロゴの終了色 #0055A4 を採用
    backgroundColor: "#0055A4",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s"
};