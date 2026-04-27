import { CSSProperties } from "react";

/**
 * アプリ全体のレイアウト
 */
export const container: CSSProperties = {
  display: "flex",
  height: "100vh",
  fontFamily: "sans-serif",
  backgroundColor: "#f4f7f6",
};

/**
 * サイドバー（ナビゲーション）
 */
export const sidebar: CSSProperties = {
  width: "220px",
  backgroundColor: "#2c3e50",
  color: "#ecf0f1",
  display: "flex",
  flexDirection: "column",
};

/**
 * サイドバー最上部（会社名エリア）
 */
export const sidebarHeader: CSSProperties = {
  padding: "20px",
  fontSize: "18px",
  fontWeight: "bold",
  borderBottom: "1px solid #34495e",
  color: "#ecf0f1",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  height: "70px",
};

/**
 * サイドバーのメニューリスト
 */
export const menuList: CSSProperties = {
  listStyle: "none",
  padding: "10px",
  margin: 0,
};

/**
 * メインコンテンツの外枠（ヘッダー + コンテンツ）
 */
export const mainWrapper: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/**
 * 右上ヘッダー
 */
export const header: CSSProperties = {
  height: "40px",
  backgroundColor: "#fff",
  borderBottom: "1px solid #e0e0e0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 30px",
  flexShrink: 0,
};

/**
 * メイン表示エリア
 */
export const mainContent: CSSProperties = {
  flex: 1,
  padding: "30px",
  overflowY: "auto",
};

/**
 * ガイドメッセージエリア
 */
export const guideBox: CSSProperties = {
  padding: "20px",
  fontSize: "12px",
  color: "#95a5a6",
  lineHeight: "1.6",
};

/**
 * 動的なタブスタイルを取得する関数
 */
export const getTabStyle = (isActive: boolean, isDisabled: boolean = false): CSSProperties => ({
  padding: "12px 15px",
  cursor: isDisabled ? "not-allowed" : "pointer",
  borderRadius: "5px",
  marginBottom: "5px",
  backgroundColor: isActive ? "#3498db" : "transparent",
  transition: "all 0.2s",
  opacity: isDisabled ? 0.4 : 1,
  pointerEvents: isDisabled ? "none" : "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: "#ecf0f1",
});

/**
 * バージョン表記
 */
export const versionText: CSSProperties = {
  padding: "10px 20px",
  fontSize: "10px",
  color: "#bdc3c7",
  textAlign: "right",
  fontFamily: "monospace",
  opacity: 0.7,
};