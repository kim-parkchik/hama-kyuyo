// @ts-ignore
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState, Fragment } from "react";
import { 
  User, 
  FileStack,
  FileBox, 
  FileSpreadsheet,
  Calendar, 
  Save, 
  RefreshCcw, 
  FileDown, 
  FileUp,
  Check,
  CheckCircle,
  AlertCircle,
  Banknote,
  Undo2,
  Users
} from 'lucide-react';
import dayjs from "dayjs";
import "dayjs/locale/ja"; // 日本語ロケールをインポート
dayjs.locale("ja");     // 日本語に設定
import { formatHours } from "../../utils/timeUtils";
import { modernIconBtnStyle } from "../../styles/styles";
import { calcDetailedDiff } from "../../utils/calcSalary";
import { OVERTIME_PREMIUM_LIMIT_HOURS, OVERTIME_PREMIUM_RATE } from '../../constants/salaryMaster2026';
import * as S from './AttendanceManager.styles';
import { useAttendanceManager } from "./useAttendanceManager";


// ニコイチ入力コンポーネント
function TimeInputPair({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) {
  
  const [initialH, initialM] = (value || ":").split(":");
  const [localH, setLocalH] = useState(initialH || "");
  const [localM, setLocalM] = useState(initialM || "");

  useEffect(() => {
    const [vh, vm] = (value || ":").split(":");
    setLocalH(vh || "");
    setLocalM(vm || "");
  }, [value]);

  const handleBlur = () => {
    // 🆕 補完処理
    const paddedH = localH.padStart(2, '0');
    const paddedM = localM.padStart(2, '0');
    const newValue = `${paddedH}:${paddedM}`;

    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const formatInput = (val: string) => {
    return val
      .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[^0-9]/g, "")
  };

  const inputStyle = {
    width: "32px",
    border: "none",
    outline: "none",
    textAlign: "center" as const,
    fontSize: "14px",
    fontFamily: "monospace",
    // 🆕 disabled の時は背景色やカーソルを変える
    backgroundColor: "transparent",
    padding: "4px 0",
    cursor: disabled ? "not-allowed" : "text",
    color: disabled ? "#999" : "#333"
  };

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      // 🆕 disabled の時は枠線の色や背景を変える
      backgroundColor: disabled ? "#f5f5f5" : "#ffffff",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "0 2px",
      width: "60px",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
    }}>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled} // 🆕 ここに disabled を適用
        value={localH}
        placeholder="00"
        onChange={e => {
          const cleaned = formatInput(e.target.value);
          setLocalH(cleaned);
          onChange(`${cleaned}:${localM}`);
        }}
        onBlur={handleBlur}
        style={inputStyle}
      />
      <span style={{ color: "#ccc", fontWeight: "bold", userSelect: "none" }}>:</span>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled} // 🆕 ここに disabled を適用
        value={localM}
        placeholder="00"
        onChange={e => {
          const cleaned = formatInput(e.target.value);
          setLocalM(cleaned);
          onChange(`${localH}:${cleaned}`);
        }}
        onBlur={handleBlur}
        style={inputStyle}
      />
    </div>
  );
}

const isCompleteTime = (t: string) => {
  if (!t || t === ":" || t.trim() === "") return false;
  const parts = t.split(":");
  return parts.length === 2 && parts[0].length >= 1 && parts[1].length >= 1;
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// 入力があるかどうかの判定を共通化
const checkHasInput = (row: any) => {
  const fields = [row.in, row.out, row.bStart, row.bEnd, row.outTime, row.returnTime];
  // ":" 以外の文字が含まれているか、または有給・欠勤などのタイプが選択されているか
  return fields.some(f => f && f !== ":" && f.trim() !== "") || row.workType !== "normal" || row.memo;
};

interface Staff {
  id: number | string;
  name: string;
  status?: string;
  branch_id?: number;
  wage_type?: "hourly" | "monthly";
  base_wage?: number;
  calendar_pattern_id?: number;
}

interface AttendanceManagerProps {
  db: any;
  staffList: Staff[];
  targetYear: number;
  setTargetYear: (year: number) => void;
  targetMonth: number;
  setTargetMonth: (month: number) => void;
}

export default function AttendanceManager(props: AttendanceManagerProps) {
  const { targetYear, setTargetYear, targetMonth, setTargetMonth, db, staffList } = props;

  const {
    activeTab, setActiveTab,
    selectedStaff, selectedStaffId, setSelectedStaffId,
    isLoading,
    isClosed,
    monthlyWorkData, setMonthlyWorkData, // setMonthlyWorkDataはhandleCellChangeの代わりに使用可能
    dateList, payrollPeriod,
    remainingPaidLeave,
    holidays, companyHolidays,
    activeFilters,
    setActiveFilters,
    filteredStaffList,
    toggleFilter,
    calcResult,
    handleCellChange,

    // 関数名のマッピングをフックの戻り値に合わせる
    finalizeAttendance,   // 個別の確定
    unfinalizeAttendance, // 確定の解除
    saveAllMonthlyData,   // 一括保存（未確定分のみ）
    handleExportRawCSV,
    handleExportFullCSV,
    handleImportCSV,
    loadMonthlyData,
    checkRemainingPaidLeave
  } = useAttendanceManager(props);
    
  // 2. フィルタボタンの定義
  const statusOptions = [
    { label: "在籍", value: "active", color: "#2ecc71" },   // 緑
    { label: "休職", value: "on_leave", color: "#f1c40f" }, // 黄
    { label: "退職", value: "retired", color: "#e74c3c" },  // 赤
  ];

  return (
    <div style={S.containerStyle}>
      {/* 🆕 タブメニュー */}
      <div style={S.tabContainerStyle}>
        <button 
          onClick={() => setActiveTab("individual")} 
          style={S.tabButtonStyle(activeTab === "individual")}
        >
          <User size={18} style={S.iconWrapperStyle} /> 個別編集・集計
        </button>
        <button 
          onClick={() => setActiveTab("csv")} 
          style={S.tabButtonStyle(activeTab === "csv")}
        >
          <FileBox size={18} style={S.iconWrapperStyle} /> 一括操作 (CSV)
        </button>
      </div>

      {/* --- 📂 一括操作 (CSV) タブの内容 --- */}
      {activeTab === "csv" && (
        <div style={{ ...S.cardStyle, borderTop: "4px solid #7f8c8d" }}>
          <h3 style={{ marginTop: 0 }}>データの入出力</h3>
          <p style={{ fontSize: "13px", color: "#666" }}>
            勤怠データの書き出し、およびCSVファイルからの取り込みを行います。
          </p>
          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            
            {/* エクスポート側 */}
            <div style={{ flex: 1, padding: "15px", border: "1px solid #eee", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
              <h4 style={{ marginTop: 0 }}><FileUp size={20} style={S.iconWrapperStyle} /> エクスポート設定</h4>
              
              {/* 🆕 期間指定フォーム */}
              <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #ddd" }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px" }}>
                  出力対象期間
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input 
                    type="date" 
                    value={payrollPeriod?.startStr} 
                    style={{ ...S.inputStyle, padding: "4px" }} 
                    onChange={(e) => {/* 必要に応じてカスタム期間用のstateを更新 */}}
                  />
                  <span>～</span>
                  <input 
                    type="date" 
                    value={payrollPeriod?.endStr} 
                    style={{ ...S.inputStyle, padding: "4px" }} 
                  />
                </div>
                <p style={{ fontSize: "11px", color: "#e67e22", marginTop: "5px" }}>
                  ※デフォルトで現在の選択月が表示されています
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={handleExportRawCSV} style={modernIconBtnStyle("#7f8c8d")}>
                  <FileSpreadsheet size={16} style={S.iconWrapperStyle} /> 打刻ログ（Rawデータ）を出力
                </button>
                <button onClick={handleExportFullCSV} style={modernIconBtnStyle("#34495e")}>
                  <FileUp size={16} style={S.iconWrapperStyle} /> 確定フラグ付き詳細データを出力
                </button>
              </div>
            </div>

            {/* インポート側 */}
            <div style={{ flex: 1, padding: "15px", border: "1px solid #eee", borderRadius: "8px" }}>
              <h4 style={{ marginTop: 0 }}><FileDown size={20} style={S.iconWrapperStyle} /> インポート</h4>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "10px" }}>
                ファイル内の日付に基づき、全期間のデータを一括で取り込みます。
              </p>
              <button onClick={handleImportCSV} style={{ ...modernIconBtnStyle("#2980b9"), width: "100%" }}>
                <FileDown size={16} style={S.iconWrapperStyle} /> CSVファイルを読み込む
              </button>
              <p style={{ fontSize: "11px", color: "#d35400", marginTop: "10px", fontWeight: "bold" }}>
                ※給与確定済みの期間は上書きされません。
              </p>
            </div>

          </div>
        </div>
      )}
      {/* --- 👤 個別編集・集計 タブの内容 --- */}
      {activeTab === "individual" && (
        <>
          {/* 年月選択エリア */}
          <div style={{ ...S.dateControlAreaStyle, position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            
            {/* 左側：支給月選択セレクトボックス */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "bold" }}>支給対象月</label>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <select 
                    value={targetYear} 
                    onChange={e => setTargetYear(Number(e.target.value))} 
                    style={{ ...S.inputStyle, width: "100px", fontWeight: "bold" }}
                  >
                    {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  <select 
                    value={targetMonth} 
                    onChange={e => setTargetMonth(Number(e.target.value))} 
                    style={{ ...S.inputStyle, width: "110px", fontWeight: "bold", color: "#2c3e50" }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月支給分</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => { 
                  const now = dayjs(); 
                  setTargetYear(now.year()); 
                  setTargetMonth(now.month() + 1); 
                }} 
                style={{ ...S.secondaryBtnStyle, height: "36px" }}
              >
                <Calendar size={16} style={S.iconWrapperStyle} />今月に戻る
              </button>
            </div>

            {/* 🆕 右側：スタッフ個別の計算期間ラベル（大きく、右端に固定） */}
            <div style={{ minWidth: "300px", textAlign: "right" }}>
              {selectedStaffId && payrollPeriod ? (
                <div style={{ 
                  display: "inline-block",
                  padding: "8px 20px",
                  backgroundColor: "#2c3e50", // 濃い色で引き締める
                  color: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  borderBottom: "4px solid #3498db" // アクセントの青
                }}>
                  <div style={{ fontSize: "11px", color: "#bdc3c7", marginBottom: "2px", textAlign: "left" }}>
                    集計対象期間
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "monospace", letterSpacing: "1px" }}>
                    {payrollPeriod.startStr.replace(/-/g, '/')} 
                    <span style={{ margin: "0 10px", color: "#3498db" }}>～</span>
                    {payrollPeriod.endStr.replace(/-/g, '/')}
                  </div>
                </div>
              ) : (
                /* 未選択時は枠だけ確保してガタつきを防ぐ、あるいは薄いガイドを表示 */
                <div style={{ fontSize: "12px", color: "#bdc3c7", padding: "24px" }}>
                  従業員を選択すると集計期間が表示されます
                </div>
              )}
            </div>
          </div>

          {/* 🆕 従業員選択・フィルタ・一括保存セクション */}
          <section style={S.actionSectionStyle}>
            {/* 左側：従業員選択カード（フィルタ機能付き） */}
            <div style={S.staffSelectCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* 左側：従業員選択セレクトボックス（幅をさらに拡大） */}
                <div style={{ width: "500px" }}> 
                  <select 
                    value={selectedStaffId} 
                    onChange={e => setSelectedStaffId(e.target.value)} 
                    style={{ ...S.inputStyle, height: "32px", padding: "4px 10px" }}
                  >
                    <option value="">-- 従業員を選択してください --</option>
                    {filteredStaffList.map((s: Staff) => ( // ← ここに : Staff を追加
                      <option key={s.id} value={s.id}>
                        [{s.id}] {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 右側：フィルタボタン群（右端に固定） */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleFilter(opt.value)}
                      style={S.filterButtonStyle(activeFilters.includes(opt.value), opt.color)}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button 
                    onClick={() => setActiveFilters(["active", "on_leave", "retired"])}
                    style={{ 
                      fontSize: "11px", 
                      border: "none", 
                      background: "none", 
                      color: "#3498db", 
                      cursor: "pointer", 
                      textDecoration: "underline",
                      marginLeft: "4px"
                    }}
                  >
                    すべて
                  </button>
                </div>
              </div>
            </div>

            {/* 右側：一括保存ボタンエリア（枠は固定、中身だけ条件で消える） */}
            <div style={{ flex: "0 0 235px", display: "flex", alignItems: "flex-end" }}>
              {selectedStaffId && Object.values(monthlyWorkData).some(row => !row.is_finalized && (row.in || row.out)) ? (
                <button 
                  onClick={saveAllMonthlyData} 
                  style={{ 
                    ...modernIconBtnStyle("#e67e22"), 
                    fontSize: "12px", 
                    padding: "4px 12px",
                    height: "32px",
                    width: "100%", // 235pxいっぱいに広げる
                    whiteSpace: "nowrap"
                  }}
                >
                  <FileStack size={18} style={{ ...S.iconWrapperStyle, marginRight: "0" }} /> 
                  未保存分をすべて保存
                </button>
              ) : (
                // 条件に合わない時は何も表示しない（でも枠は確保されているのでレイアウトが崩れない）
                null
              )}
            </div>
          </section>

          {selectedStaffId ? (
            <>
              <section style={{ ...S.cardStyle, position: "relative", minHeight: "200px" }}>
                {/* 🆕 読み込み中の「幕」：isLoadingがtrueの時だけ出現 */}
                {isLoading && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.6)", // 薄い白
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(2px)", // 🆕 背景を少しぼかすとおしゃれで安心感が出る
                    borderRadius: "8px"
                  }}>
                    <RefreshCcw size={32} className="animate-spin" style={{ color: "#3498db", marginBottom: "8px" }} />
                    <span style={{ color: "#3498db", fontWeight: "bold", fontSize: "14px" }}>読み込み中...</span>
                  </div>
                )}
                <table style={{ 
                  width: "100%", 
                  borderCollapse: "collapse",
                  opacity: isLoading ? 0.4 : 1, // 🆕 ロード中は少し薄くする
                  transition: "opacity 0.2s ease" // 🆕 じんわり切り替える
                }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fcfcfc", borderBottom: "2px solid #eee" }}>
                      <th style={{ ...S.thStyle, width: "100px" }}>日付</th>
                      <th style={S.thStyle}>出勤</th>
                      <th style={{ ...S.thStyle, paddingRight: "20px" }}>退勤</th>
                      <th style={S.thStyle}>休憩(始)</th>
                      <th style={{ ...S.thStyle, paddingRight: "20px" }}>休憩(終)</th>
                      <th style={S.thStyle}>外出</th>
                      <th style={{ ...S.thStyle, paddingRight: "2px" }}>戻り</th>
                      {/* 🆕 独立した時間有給列 */}
                      <th style={{ ...S.thStyle, width: "60x", color: "#3498db" }}>時間有給</th>
                      
                      {/* 🆕 実働と操作を一つのエリアとして定義 */}
                      <th style={{ ...S.thStyle, width: "130px", borderLeft: "1px solid #eee" }}>実働 / 確定</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 🆕 dateListを使ってループを回す */}
                    {dateList.map((dateStr: string) => {
                      // dateStr は "YYYY-MM-DD" 形式
                      const d = dayjs(dateStr);
                      const day = d.date();
                      const dayOfWeek = d.format('ddd');
                      
                      const rowData = monthlyWorkData[dateStr] || {};
                      const row = {
                        in: rowData.in || "",
                        out: rowData.out || "",
                        bStart: rowData.bStart || "",
                        bEnd: rowData.bEnd || "",
                        outTime: rowData.outTime || "",
                        returnTime: rowData.returnTime || "",
                        workType: rowData.workType || "normal",
                        paidHours: rowData.paidHours || 0,
                        memo: rowData.memo || "",
                        isFinalized: rowData.is_finalized === 1,
                        savedHours: Number(rowData.savedHours) || 0,
                        nightHours: Number(rowData.night_hours) || 0,
                        csvIn: rowData.csv_entry_time || "--:--",
                        csvOut: rowData.csv_exit_time || "--:--",
                      };

                      // --- 1. 状態判定（シンプルに！） ---
                      const hasInput = checkHasInput(row);
                      const isFinalized = row.isFinalized;

                      // --- 2. 矛盾チェック（エラーメッセージ） ---
                      let timeErrorMsg = "";
                      // if (isCompleteTime(row.in) && isCompleteTime(row.out)) {
                      //   const start = toMinutes(row.in);
                      //   const end = toMinutes(row.out);
                      //   if (end <= start) {
                      //     timeErrorMsg = "退勤が出勤より前です";
                      //   } else {
                      //     if (isCompleteTime(row.bStart) && isCompleteTime(row.bEnd)) {
                      //       const bs = toMinutes(row.bStart), be = toMinutes(row.bEnd);
                      //       if (be <= bs) timeErrorMsg = "休憩終了が不正です";
                      //       else if (bs < start || be > end) timeErrorMsg = "休憩が勤務時間外です";
                      //     }
                      //     if (!timeErrorMsg && isCompleteTime(row.outTime) && isCompleteTime(row.returnTime)) {
                      //       const os = toMinutes(row.outTime), or = toMinutes(row.returnTime);
                      //       if (or <= os) timeErrorMsg = "戻りが外出より前です";
                      //       else if (os < start || or > end) timeErrorMsg = "外出が勤務時間外です";
                      //     }
                      //   }
                      // }

                      // --- 3. 背景色・文字色 ---
                      const hName = holidays[dateStr];
                      const cSetting = companyHolidays[dateStr];
                      const isRedDay = (cSetting === 1) || (cSetting === undefined && (dayOfWeek === "日" || !!hName));
                      const isBlueDay = dayOfWeek === "土" && !isRedDay;
                      const rowBgColor = S.getRowBgColor(row.workType, isRedDay, isBlueDay);
                      const dateTextColor = S.getDateTextColor(isRedDay, isBlueDay);





                      return (
                        <Fragment key={dateStr}>
                          <tr style={{ backgroundColor: rowBgColor, borderTop: "3px solid #eee" }}>
                            {/* --- 1. 日付・区分 (rowSpan=3) --- */}
                            <td rowSpan={3} style={{ ...S.tdStyle, fontWeight: "bold", borderRight: "1px solid #eee", verticalAlign: "top", width: "100px" }}>
                              <div style={{ fontSize: "14px", color: dateTextColor }}>
                                <span style={{ fontSize: "10px", display: "block", color: "#95a5a6", fontWeight: "normal" }}>
                                  {d.format('YYYY/MM')}
                                </span>
                                <span style={{ fontSize: "16px" }}>{day}</span>
                                <span style={{ fontSize: "12px", marginLeft: "2px" }}>({dayOfWeek})</span>                           
                                {hName && <span style={S.holidayBadgeStyle}>{hName}</span>}
                              </div>
                              <select
                                value={row.workType}
                                onChange={e => handleCellChange(dateStr, 'workType', e.target.value)}
                                style={{ ...S.inputStyle, marginTop: "4px", fontSize: "12px", padding: "2px" }}
                                disabled={isFinalized || isClosed}
                              >
                                <option value="holiday">公休</option>
                                <option value="normal">出勤（平日）</option>
                                <option value="holiday_work">休日出勤</option>
                                <option value="paid_full">全休(有給)</option>
                                <option value="paid_half">半休(有給)</option>
                                <option value="absent">欠勤</option>
                              </select>
                            </td>

                            {/* --- 2. 打刻ログ表示エリア (グレーの文字の部分) --- */}
                            <td style={{ ...S.tdTightStyle, color: "#94a3b8" }}>
                              <span style={{ fontSize: "9px", display: "block", color: "#bdc3c7" }}>打刻(入)</span>
                              {rowData.csv_entry_time || "--:--"}
                            </td>
                            <td style={{ ...S.tdSpacerStyle, color: "#94a3b8" }}>
                              <span style={{ fontSize: "9px", display: "block", color: "#bdc3c7" }}>打刻(出)</span>
                              {rowData.csv_exit_time || "--:--"}
                            </td>
                            <td colSpan={2} style={{ ...S.tdTightStyle, fontSize: "11px", color: "#bdc3c7" }}>
                              休憩(CSV): {rowData.csv_break_start || "--:--"} ~ {rowData.csv_break_end || "--:--"}
                            </td>
                            <td colSpan={2} style={{ ...S.tdTightStyle, fontSize: "11px", color: "#bdc3c7" }}>
                              外出(CSV): {rowData.csv_out_time || "--:--"} ~ {rowData.csv_return_time || "--:--"}
                            </td>

                            {/* --- 🆕 3. 時間有給列用の空セル (1段目はログ表示なのでここは空ける) --- */}
                            <td rowSpan={3} style={{ 
                              borderLeft: "1px solid #eee", 
                              textAlign: "center", 
                              verticalAlign: "middle", // 中央寄せにすると綺麗です
                              backgroundColor: (row.workType === "paid_full" || row.workType === "absent") ? "#f9f9f9" : "#fff" 
                            }}>
                              <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>時間有給</span>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <input 
                                  type="number" 
                                  step="0.5" 
                                  value={row.paidHours} 
                                  onChange={e => handleCellChange(dateStr, 'paidHours', e.target.value)} 
                                  style={{ 
                                    width: "45px", 
                                    fontSize: "13px", 
                                    textAlign: "center",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    backgroundColor: (isFinalized || isClosed) ? "#f5f5f5" : "#fff"
                                  }} 
                                  disabled={isFinalized || isClosed} 
                                />
                                <span style={{ fontSize: "10px", color: "#7f8c8d", marginLeft: "2px" }}>h</span>
                              </div>
                            </td>

                            {/* --- 4. 実働 / 確定エリア (rowSpan=3 で統合) --- */}
                            <td rowSpan={3} style={{ ...S.tdStyle, width: "130px", borderLeft: "1px solid #eee", textAlign: "center", backgroundColor: isFinalized ? "#f8fafc" : "#fffdeb" }}>
                              <div style={{ marginBottom: "8px" }}>
                                <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>
                                  {isFinalized ? "支給対象合計" : "実働(計算中)"}
                                </span>
                                <div style={{ 
                                  fontSize: "16px",
                                  fontWeight: "bold", 
                                  color: isFinalized ? "#2ecc71" : "#f1c40f" 
                                }}>
                                  {isFinalized 
                                    ? `${Math.floor(row.savedHours + (Number(row.paidHours)||0))}h ${Math.round(((row.savedHours + (Number(row.paidHours)||0)) % 1) * 60)}m` 
                                    : "--" 
                                  }
                                </div>
                                {/* 内訳を表示すると親切 */}
                                {isFinalized && row.paidHours > 0 && (
                                  <div style={{ fontSize: "9px", color: "#3498db" }}>
                                    (内 有給 {row.paidHours}h)
                                  </div>
                                )}
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                                {timeErrorMsg ? (
                                  <div style={{ color: "#e74c3c", textAlign: "center" }}>
                                    <AlertCircle size={18} />
                                    <div style={{ fontSize: "10px" }}>時間不正</div>
                                  </div>
                                ) : isFinalized ? (
                                  <button onClick={() => unfinalizeAttendance(dateStr)} disabled={isClosed} style={S.modernIconBtnStyle("#95a5a6")}>
                                    <Undo2 size={14} /> <span>解除</span>
                                  </button>
                                ) : (
                                  <button onClick={() => finalizeAttendance(dateStr)} disabled={isClosed} style={S.modernIconBtnStyle("#3498db")}>
                                    <Check size={14} /> <span>確定</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          <tr style={{ 
                            backgroundColor: (row.workType === "paid_full" || row.workType === "absent") ? "#f9f9f9" : "#fff",
                            opacity: (row.workType === "paid_full" || row.workType === "absent") ? 0.5 : 1,
                            pointerEvents: (row.workType === "paid_full" || row.workType === "absent") ? "none" : "auto"
                          }}>
                            <td style={S.tdTightStyle}><TimeInputPair value={row.in} onChange={val => handleCellChange(dateStr, 'in', val)} disabled={isFinalized || isClosed} /></td>
                            <td style={S.tdSpacerStyle}><TimeInputPair value={row.out} onChange={val => handleCellChange(dateStr, 'out', val)} disabled={isFinalized || isClosed} /></td>
                            <td style={S.tdTightStyle}><TimeInputPair value={row.bStart} onChange={val => handleCellChange(dateStr, 'bStart', val)} disabled={isFinalized || isClosed} /></td>
                            <td style={S.tdSpacerStyle}><TimeInputPair value={row.bEnd} onChange={val => handleCellChange(dateStr, 'bEnd', val)} disabled={isFinalized || isClosed} /></td>
                            <td style={S.tdTightStyle}><TimeInputPair value={row.outTime} onChange={val => handleCellChange(dateStr, 'outTime', val)} disabled={isFinalized || isClosed} /></td>
                            
                            {/* 🆕 戻り：単独の TimeInputPair になる */}
                            <td style={{ ...S.tdSpacerStyle, paddingRight: "2px" }}>
                              <TimeInputPair 
                                value={row.returnTime} 
                                onChange={val => handleCellChange(dateStr, 'returnTime', val)} 
                                disabled={isFinalized || isClosed} 
                              />
                            </td>
                          </tr>

                          <tr style={{ backgroundColor: "#fdfdfd", borderBottom: "1px solid #eee" }}>
                            <td colSpan={6} style={{ padding: "6px 12px", pointerEvents: "auto" }}>
                              <div style={S.memoContainerStyle}>
                                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "bold", whiteSpace: "nowrap", flexShrink: 0 }}>
                                  備考：
                                </span>
                                <input 
                                  type="text" 
                                  placeholder="理由、遅刻・早退の内容など" 
                                  value={row.memo || ""}
                                  onChange={e => handleCellChange(dateStr, 'memo', e.target.value)}
                                  style={S.memoInputStyle}
                                  disabled={isFinalized || isClosed}
                                />
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {/* --- スタッフ選択済み：計算結果を表示 --- */}
                <div style={S.summaryBoardStyle}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#bdc3c7" }}>基本情報</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>{Object.values(monthlyWorkData).filter(d => d.is_finalized).length}日 / {formatHours(calcResult?.totalWorkHours || 0)}</div>
                    {/* 🆕 月給制の場合は本来の額面を小さく表示 */}
                    {selectedStaff?.wage_type === "monthly" && (
                      <div style={{ fontSize: "11px", color: "#95a5a6" }}>月給: ¥{Number(selectedStaff?.base_wage || 0).toLocaleString()}</div>
                    )}
                  </div>
                                
                  <div>
                    <div style={{ fontSize: "12px", color: "#e74c3c" }}>残業合計 (割増込)</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e74c3c" }}>
                      {formatHours(calcResult?.totalOvertimeHours ?? 0)}
                    </div>
                    {(calcResult?.highPremiumHours ?? 0) > 0 && (
                      <div style={{ fontSize: "11px", color: "#ff7675" }}> 
                        {/* 🆕 60 という数字と、50% という数字を定数から算出 */}
                        (うち{OVERTIME_PREMIUM_LIMIT_HOURS}h超 [{(OVERTIME_PREMIUM_RATE - 1) * 100}%増]: {formatHours(calcResult?.highPremiumHours ?? 0)}) 
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: "12px", color: "#f1c40f" }}>深夜合計</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#f1c40f" }}>{formatHours(calcResult?.totalNightHours ?? 0)}</div>
                  </div>

                  {/* 🆕 欠勤控除がある場合はここを表示、なければ交通費を表示 */}
                  <div>
                    {calcResult && calcResult.absenceDeduction > 0 ? (
                      <>
                        <div style={{ fontSize: "12px", color: "#ff7675" }}>欠勤控除</div>
                        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff7675" }}>
                          -¥{calcResult.absenceDeduction.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "12px", color: "#bdc3c7" }}>交通費</div>
                        <div style={{ fontSize: "18px", fontWeight: "bold" }}>¥{(calcResult?.commutePay ?? 0).toLocaleString()}</div>
                      </>
                    )}
                  </div>

                  <div style={{ borderLeft: "1px solid #7f8c8d", paddingLeft: "20px", textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "#2ecc71" }}><Banknote size={14} style={{ ...S.iconWrapperStyle, marginRight: "0" }} /> 差引総支給額（概算）</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2ecc71" }}>
                      ¥{(calcResult?.totalEarnings ?? 0).toLocaleString()}
                    </div>
                    {/* 🆕 補足: 交通費が含まれていることを明記 */}
                    <div style={{ fontSize: "10px", color: "#95a5a6" }}>※残業・深夜・交通費・控除を反映済</div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            // --- 未選択時：ガイドを表示 ---
            <div style={{ 
              ...S.summaryBoardStyle, 
              display: "flex",           // 確実にflexを適用
              flexDirection: "column",   // 縦並びにする
              alignItems: "center",      // 左右中央
              justifyContent: "center",  // 上下中央
              background: "#f9f9f9", 
              border: "1px dashed #bdc3c7",
              minHeight: "120px"         // 少し高さを出すとより「空席感」が出て綺麗です
            }}>
              <div style={{ textAlign: "center", color: "#95a5a6" }}>
                <Users size={32} style={{ marginBottom: "8px", opacity: 0.7 }} />
                <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
                  従業員を選択してください
                </div>
                <div style={{ fontSize: "12px" }}>
                  左上のリストから選択すると、ここに月次の給与概算が表示されます。
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}