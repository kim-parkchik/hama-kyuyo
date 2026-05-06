import React from "react";

export const container: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
};

// カード・外枠
export const card: React.CSSProperties = { 
  backgroundColor: "white", 
  padding: 20, 
  borderRadius: 12, 
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)", 
  marginBottom: 16 
};

// セクションタイトル
export const sectionTitle: React.CSSProperties = { 
  margin: "0 0 14px 0", 
  fontSize: 14, 
  fontWeight: "bold", 
  color: "#2c3e50", 
  borderBottom: "2px solid #ecf0f1", 
  paddingBottom: 8 
};

// 入力項目の行
export const itemRow: React.CSSProperties = { 
  display: "flex", 
  alignItems: "center", 
  padding: "8px 12px", 
  border: "1px solid #eee", 
  borderRadius: 6, 
  marginBottom: 6, 
  gap: 10 
};

// ラベルテキスト
export const label: React.CSSProperties = { 
  fontSize: 11, 
  display: "block", 
  marginBottom: 4, 
  color: "#7f8c8d" 
};

// 入力フィールド
export const input: React.CSSProperties = { 
  width: "100%", 
  padding: "7px 10px", 
  border: "1px solid #ddd", 
  borderRadius: 4, 
  fontSize: 13, 
  boxSizing: "border-box" 
};

// 基本ボタン（保存・作成など）
export const btn: React.CSSProperties = { 
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 16px", 
  backgroundColor: "#3498db", 
  color: "white", 
  border: "none", 
  borderRadius: 4, 
  cursor: "pointer", 
  fontWeight: "bold", 
  fontSize: 13 
};

// 削除ボタン
export const delBtn: React.CSSProperties = { 
  background: "none", 
  border: "none", 
  cursor: "pointer", 
  fontSize: 14, 
  padding: "0 4px" 
};

// テーブル全体
export const table: React.CSSProperties = { 
  width: "100%", 
  borderCollapse: "collapse", 
  fontSize: 12, 
  backgroundColor: "white", 
  borderRadius: 10, 
  overflow: "hidden", 
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)" 
};

// テーブルヘッダー
export const thead: React.CSSProperties = { 
  backgroundColor: "#f8f9fa", 
  borderBottom: "2px solid #eee" 
};

// テーブルヘッダーセル
export const th: React.CSSProperties = { 
  padding: "10px 8px", 
  textAlign: "left", 
  color: "#7f8c8d", 
  fontWeight: 600, 
  whiteSpace: "nowrap" 
};

// テーブルボディセル
export const td: React.CSSProperties = { 
  padding: "10px 8px", 
  borderBottom: "1px solid #f5f5f5" 
};

export const tabNav: React.CSSProperties = {
  display: "flex",
  gap: 4,
  marginBottom: 25,
  borderBottom: "2px solid #eee",
};

export const getTabButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "12px 24px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 15,
  backgroundColor: "transparent",
  color: isActive ? "#3498db" : "#7f8c8d",
  borderBottom: isActive ? "3px solid #3498db" : "3px solid transparent",
});

export const tabContainer: React.CSSProperties = {
    display: "flex",
    gap: 4,
    marginBottom: 25,
    borderBottom: "2px solid #eee"
};

export const tabBtn: React.CSSProperties = {
    padding: "12px 24px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 15,
    borderBottom: "3px solid transparent",
    color: "#7f8c8d",
    backgroundColor: "transparent"
};

export const activeTabBtn: React.CSSProperties = {
    ...tabBtn,
    borderBottom: "3px solid #3498db",
    color: "#3498db",
};

export const tabInner: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px"
};

export const tableInput: React.CSSProperties = {
    width: "100%",
    padding: "4px 6px",
    border: "1px solid #ddd",
    borderRadius: 4,
    fontSize: 12,
    textAlign: "right"
};

export const footerNote: React.CSSProperties = {
    marginTop: 12,
    fontSize: 11,
    color: "#bdc3c7",
    lineHeight: 1.8
};

// タブ②の右側にあるグレーの説明ボックス用
export const autoCalcNote: React.CSSProperties = {
    marginTop: 16,
    padding: "10px 12px",
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    fontSize: 11,
    color: "#7f8c8d",
    lineHeight: 1.8
};

// スタッフ名のフリガナ用
export const furigana: React.CSSProperties = {
    fontSize: 10,
    color: "#999"
};

// Switchのベース（外側のカプセル）
export const switchBase = {
  position: 'relative' as const,
  display: 'inline-block',
  width: '40px',
  height: '20px',
};

// 実際のチェックボックスは隠す
export const switchInput = {
  opacity: 0,
  width: 0,
  height: 0,
};

// スライダー部分
export const slider = (isActive: boolean) => ({
  position: 'absolute' as const,
  cursor: 'pointer',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: isActive ? '#3498db' : '#ccc', // ONなら青、OFFならグレー
  transition: '.2s',
  borderRadius: '20px',
});

// スライダーの中の白い丸
export const sliderCircle = (isActive: boolean) => ({
  position: 'absolute' as const,
  content: '""',
  height: '14px',
  width: '14px',
  left: '3px',
  bottom: '3px',
  backgroundColor: 'white',
  transition: '.2s',
  borderRadius: '50%',
  transform: isActive ? 'translateX(20px)' : 'translateX(0)',
});