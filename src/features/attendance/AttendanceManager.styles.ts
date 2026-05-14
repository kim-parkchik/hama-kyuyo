import { CSSProperties } from 'react';

export const S = {
  // --- レイアウト・コンテナ ---
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    color: "#2c3e50"
  } as CSSProperties,

  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    marginBottom: "20px"
  } as CSSProperties,

  tabContainer: {
    display: "flex",
    borderBottom: "2px solid #eee",
    marginBottom: "25px",
    gap: "10px"
  } as CSSProperties,

  // --- 入力・ラベル・ボタン ---
  label: {
    fontSize: "12px",
    color: "#7f8c8d",
    marginBottom: "2px",
    display: "block"
  } as CSSProperties,

  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box"
  } as CSSProperties,

  btn: {
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  } as CSSProperties,

  // --- テーブル関連 ---
  th: {
    padding: "12px",
    fontSize: "14px",
    color: "#7f8c8d",
    textAlign: "left"
  } as CSSProperties,

  td: {
    padding: "12px",
    fontSize: "14px",
  } as CSSProperties,

  tdSpacer: {
    padding: "12px",
    fontSize: "14px",
    paddingRight: "30px"
  } as CSSProperties,

  tdTight: {
    padding: "12px",
    fontSize: "14px",
    paddingRight: "4px"
  } as CSSProperties,

  // --- 動的スタイル (関数) ---
  tabButton: (isActive: boolean): CSSProperties => ({
    padding: "12px 24px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
    border: "none",
    borderBottom: isActive ? "3px solid #3498db" : "3px solid transparent",
    backgroundColor: "transparent",
    color: isActive ? "#3498db" : "#7f8c8d",
    transition: "0.3s"
  }),

  modernIconBtn: (color: string): CSSProperties => ({
    backgroundColor: color,
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  }),

  secondaryBtn: {
    backgroundColor: "#7f8c8d", // modernIconBtnStyle("#7f8c8d") の結果
    color: "white",
    border: "1px solid #7f8c8d", // 上書き部分
    borderRadius: "6px",
    padding: "0 12px",           // 上書き部分
    cursor: "pointer",
    fontSize: "12px",            // 上書き部分
    fontWeight: "bold",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    height: "32px",              // 上書き部分
    boxSizing: "border-box"      // 上書き部分
  } as CSSProperties,

  filterButton: (isActive: boolean, color: string): CSSProperties => ({
    padding: "4px 12px",
    borderRadius: "15px",
    border: `1px solid ${color}`,
    backgroundColor: isActive ? color : "white",
    color: isActive ? "white" : color,
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold",
    height: "28px",
    transition: "0.2s",
    whiteSpace: "nowrap"
  }),

  // --- 特殊コンポーネント ---
  summaryBoard: {
    marginTop: "20px",
    padding: "20px",
    backgroundColor: "#2c3e50",
    color: "white",
    borderRadius: "12px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr",
    gap: "15px"
  } as CSSProperties,

  memoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    width: "100%"
  } as CSSProperties,

  memoInput: {
    flex: 1,
    fontSize: "12px",
    border: "none",
    borderBottom: "1px dashed #cbd5e1",
    background: "transparent",
    outline: "none",
    minWidth: 0
  } as CSSProperties,

  // --- レイアウトパーツ ---
  dateControlArea: {
    display: "flex", 
    gap: "8px", 
    alignItems: "center",
    marginTop: "15px",
    marginBottom: "5px"
  } as CSSProperties,

  actionSection: {
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "stretch", 
    gap: "20px", 
    marginBottom: "10px"
  } as CSSProperties,

  staffSelectCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    width: "780px",
    flex: "none",
    boxSizing: "border-box", 
    margin: "5px 0",
    padding: "12px 20px"
  } as CSSProperties,

  holidayBadge: {
    fontSize: "9px", 
    fontWeight: "normal", 
    color: "#e74c3c",
    backgroundColor: "#fff1f0",
    padding: "1px 4px",
    borderRadius: "3px",
    whiteSpace: "nowrap",
    display: "inline-block",
    marginLeft: "4px"
  } as CSSProperties,

  iconWrapper: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
    marginRight: "6px" // テキストとの間隔
  } as CSSProperties,

  // --- 状態依存の動的スタイル (関数) ---
  rowBgColor: (isRedDay: boolean, isBlueDay: boolean): string => {
    if (isRedDay) return "#fff5f5";
    if (isBlueDay) return "#f5faff";
    return "#fcfcfc";
  },

  dateTextColor: (isRedDay: boolean, isBlueDay: boolean): string => {
    if (isRedDay) return "#e74c3c";
    if (isBlueDay) return "#3498db";
    return "#2c3e50";
  },

  finalizedRow: (isFinalized: boolean, baseBgColor: string): CSSProperties => ({
    backgroundColor: isFinalized ? "#f0fff4" : baseBgColor,
    borderLeft: isFinalized ? "5px solid #2ecc71" : "5px solid transparent",
    transition: "all 0.3s ease",
  }),

  finalizedText: (isFinalized: boolean, defaultColor: string): CSSProperties => ({
    color: isFinalized ? "#1e8449" : defaultColor,
    fontWeight: isFinalized ? "bold" : "normal",
  }),
};