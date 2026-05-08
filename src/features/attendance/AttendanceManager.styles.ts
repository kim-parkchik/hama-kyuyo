import React from 'react';

export const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

export const tabContainerStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "2px solid #eee",
  marginBottom: "20px",
  gap: "10px"
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  marginBottom: "20px"
};

export const inputStyle: React.CSSProperties = {
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "14px",
  width: "100%",
  boxSizing: "border-box"
};

export const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#7f8c8d",
  marginBottom: "2px",
  display: "block"
};

export const btnStyle: React.CSSProperties = {
  backgroundColor: "#2ecc71",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold"
};

// --- テーブル関連 ---
export const thStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "14px",
  color: "#7f8c8d",
  textAlign: "left"
};

export const tdStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "14px",
};

// セットの区切りに使う、少し広めの右余白
export const tdSpacerStyle: React.CSSProperties = {
  ...tdStyle,
  paddingRight: "30px"
};

// セット内の狭い余白
export const tdTightStyle: React.CSSProperties = {
  ...tdStyle,
  paddingRight: "4px"
};

// --- 関数型スタイル（状態や引数で変化するもの） ---

export const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "12px 24px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "bold",
  border: "none",
  borderBottom: isActive ? "3px solid #3498db" : "3px solid transparent",
  backgroundColor: "transparent",
  color: isActive ? "#3498db" : "#7f8c8d",
  transition: "0.2s"
});

export const modernIconBtnStyle = (color: string): React.CSSProperties => ({
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
});

export const filterButtonStyle = (isActive: boolean, color: string): React.CSSProperties => ({
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
});

// 日付ごとの背景色を決定する関数
export const getRowBgColor = (workType: string, isRedDay: boolean, isBlueDay: boolean): string => {
  if (workType === "paid_full") return "#e8f5e9"; // 有給全休
  if (workType === "absent") return "#fff3e0";    // 欠勤
  if (isRedDay) return "#fff5f5";                 // 休日（赤）
  if (isBlueDay) return "#f5faff";                // 土曜（青）
  return "#fcfcfc";                               // 平日
};

// 日付の文字色
export const getDateTextColor = (isRedDay: boolean, isBlueDay: boolean): string => {
  if (isRedDay) return "#e74c3c";
  if (isBlueDay) return "#3498db";
  return "#2c3e50";
};

// 下部の集計ボード（ダークブルーのエリア）
export const summaryBoardStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "20px",
  backgroundColor: "#2c3e50",
  color: "white",
  borderRadius: "12px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr",
  gap: "15px"
};

// 備考入力欄のコンテナ
export const memoContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  width: "100%"
};

// 備考入力欄（アンダーライン形式）
export const memoInputStyle: React.CSSProperties = {
  flex: 1,
  fontSize: "12px",
  border: "none",
  borderBottom: "1px dashed #cbd5e1",
  background: "transparent",
  outline: "none",
  minWidth: 0
};

// 年月選択＋「今月に戻る」のコンテナ
export const dateControlAreaStyle: React.CSSProperties = {
  display: "flex", 
  gap: "8px", 
  alignItems: "center",
  marginTop: "15px",
  marginBottom: "5px"
};

// 従業員選択・フィルタ・保存ボタンの横並びセクション
export const actionSectionStyle: React.CSSProperties = {
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "stretch", 
  gap: "20px", 
  marginBottom: "10px"
};

// 従業員選択カード
export const staffSelectCardStyle: React.CSSProperties = {
  ...cardStyle, 
  width: "780px",
  flex: "none",
  boxSizing: "border-box", 
  margin: "5px 0",
  padding: "12px 20px"
};

// 「今月に戻る」ボタン専用（modernIconBtnStyleをベースに拡張）
export const secondaryBtnStyle: React.CSSProperties = {
  ...modernIconBtnStyle("#7f8c8d"),
  height: "32px",
  padding: "0 12px",
  fontSize: "12px",
  border: "1px solid #7f8c8d",
  boxSizing: "border-box"
};

export const iconWrapperStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  verticalAlign: "middle",
  marginRight: "6px" // テキストとの間隔
};

export const holidayBadgeStyle: React.CSSProperties = {
  fontSize: "9px", 
  fontWeight: "normal", 
  color: "#e74c3c",
  backgroundColor: "#fff1f0", // 薄い赤背景でバッジ風に
  padding: "1px 4px",
  borderRadius: "3px",
  whiteSpace: "nowrap",
  display: "inline-block", // レイアウトを安定させるために追加
  marginLeft: "4px"        // 日付との間隔を少し空ける
};