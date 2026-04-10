import { useState, useEffect } from "react";
// import { calcDiff, modernIconBtnStyle, formatHours } from "./utils";
// import { calcDiff, smallBtnStyle, formatHours } from "./utils";
import { calcDetailedDiff, modernIconBtnStyle, formatHours } from "./utils";

// 将来的にDBから読み込む設定値（関数の外でも内でも良いですが、まずはここでOK）
const PAYROLL_SETTINGS = {
    OVERTIME_THRESHOLD: 8,      // 何時間を超えたら残業か
    OVERTIME_RATE: 1.25,        // 残業代の倍率
};

// 🆕 ニコイチ入力コンポーネント
function TimeInputPair({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [h, m] = (value || ":").split(":");

    // 共通のクリーンアップ処理
    const formatInput = (val: string) => {
        return val
            .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
            .replace(/[^0-9]/g, "")
            .slice(0, 2);
    };

    const handleInputChange = (newVal: string, otherPart: string, isHours: boolean) => {
        const cleaned = formatInput(newVal);
        if (isHours) {
            onChange(`${cleaned}:${otherPart}`);
        } else {
            onChange(`${otherPart}:${cleaned}`);
        }
    };

    const padValue = (val: string) => {
        if (!val) return "";
        return val.padStart(2, '0');
    };

    const inputStyle = {
        width: "22px",
        border: "none",
        outline: "none",
        textAlign: "center" as const,
        fontSize: "14px",
        fontFamily: "monospace",
        backgroundColor: "transparent",
        padding: "4px 0"
    };

    return (
        <div style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "#ffffff",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "0 2px",
            width: "60px",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
        }}>
            <input
                type="text"
                inputMode="numeric"
                value={h || ""}
                placeholder="00"
                // 🆕 ポイント: isComposingイベントを見て、IME中（下線がある時）のonChangeを無視する
                onChange={e => {
                    const isIme = (e.nativeEvent as any).isComposing;
                    if (!isIme) {
                        handleInputChange(e.target.value, m, true);
                    }
                }}
                // 確定した瞬間に反映
                onCompositionEnd={e => {
                    handleInputChange((e.target as HTMLInputElement).value, m, true);
                }}
                onBlur={() => onChange(`${padValue(h)}:${m}`)}
                style={inputStyle}
            />
            <span style={{ color: "#ccc", fontWeight: "bold", userSelect: "none" }}>:</span>
            <input
                type="text"
                inputMode="numeric"
                value={m || ""}
                placeholder="00"
                onChange={e => {
                    const isIme = (e.nativeEvent as any).isComposing;
                    if (!isIme) {
                        handleInputChange(e.target.value, h, false);
                    }
                }}
                onCompositionEnd={e => {
                    handleInputChange((e.target as HTMLInputElement).value, h, false);
                }}
                onBlur={() => onChange(`${h}:${padValue(m)}`)}
                style={inputStyle}
            />
        </div>
    );
}

interface AttendanceManagerProps {
    db: any;
    staffList: any[];
    targetYear: number;
    setTargetYear: (year: number) => void;
    targetMonth: number;
    setTargetMonth: (month: number) => void;
}

export default function AttendanceManager({
    db,
    staffList,
    targetYear,
    setTargetYear,
    targetMonth,
    setTargetMonth
}: AttendanceManagerProps) {
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [monthlyWorkData, setMonthlyWorkData] = useState<Record<string, any>>({});

    // --- (中略：loadMonthlyData, saveAttendance などの関数はそのまま) ---
    const loadMonthlyData = async () => {
        if (!db || !selectedStaffId) {
            setMonthlyWorkData({});
            return;
        }
        const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-`;
        try {
            const res = await db.select<any[]>(
                "SELECT * FROM attendance WHERE staff_id = ? AND work_date LIKE ?",
                [selectedStaffId, `${monthStr}%`]
            );
            const loaded: Record<string, any> = {};
            res.forEach(row => {
                loaded[row.work_date] = { 
                    in: row.entry_time || "", 
                    out: row.exit_time || "", 
                    bStart: row.break_start || "", 
                    bEnd: row.break_end || "",
                    outTime: row.out_time || "",
                    returnTime: row.return_time || "",
                    isSaved: true,
                    savedHours: Number(row.work_hours) || 0,
                    nightHours: Number(row.night_hours) || 0,
                    actual_hourly_wage: row.actual_hourly_wage || 0,
                    overtime_rate: row.overtime_rate || 1.25,
                    night_rate: row.night_rate || 0.25
                };
            });
            setMonthlyWorkData(loaded);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { loadMonthlyData(); }, [selectedStaffId, targetYear, targetMonth, db]);

    const handleCellChange = (date: string, field: string, value: string) => {
        setMonthlyWorkData(prev => {
            const currentRow = prev[date] || {};
            if (currentRow[field] === value) return prev;

            // 🆕 ロジックを単純化：変更があれば「未保存」確定。
            // ただし、空の状態からいじり始めた時は、まだ「保存ボタン」を出さないフラグとして使う
            return {
                ...prev,
                [date]: { 
                    ...currentRow, 
                    [field]: value, 
                    isSaved: false // フリをやめて、常に false に
                }
            };
        });
    };

    const saveAttendance = async (date: string) => {
        if (!db || !selectedStaffId) return;
        const row = monthlyWorkData[date];
        const currentStaff = staffList?.find(s => String(s.id) === String(selectedStaffId));
        if (!row || !currentStaff) return;

        if (!row.in || !row.out) {
            alert("出勤・退勤時間を入力してください。");
            return;
        }

        // 計算結果を取得
        const { total, night } = calcDetailedDiff(row.in, row.out, row.bStart, row.bEnd, row.outTime, row.returnTime);

        try {
            // 一旦消して
            await db.execute("DELETE FROM attendance WHERE staff_id = ? AND work_date = ?", [selectedStaffId, date]);
            
            // 🆕 新しいカラムを含めて保存
            await db.execute(
                `INSERT INTO attendance (
                    staff_id, work_date, entry_time, exit_time, 
                    break_start, break_end, out_time, return_time, 
                    work_hours, night_hours,
                    actual_hourly_wage, overtime_rate, night_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    selectedStaffId, date, row.in||"", row.out||"", 
                    row.bStart||"", row.bEnd||"", row.outTime||"", row.returnTime||"", 
                    Number(total), Number(night),
                    currentStaff.hourly_wage,       // ★その時の時給
                    PAYROLL_SETTINGS.OVERTIME_RATE, // ★その時の残業率(1.25)
                    0.25                            // ★その時の深夜率
                ]
            );

            setMonthlyWorkData(prev => ({ 
                ...prev, 
                [date]: { 
                    ...prev[date], 
                    isSaved: true, 
                    savedHours: Number(total), 
                    nightHours: Number(night),
                    actual_hourly_wage: currentStaff.hourly_wage 
                } 
            }));
        } catch (e) { alert("保存失敗: " + e); }
    };

    const saveAllMonthlyData = async () => {
        if (!db || !selectedStaffId) return;
        const targetDates = Object.keys(monthlyWorkData).filter(date => {
            const row = monthlyWorkData[date];
            return !row.isSaved && (row.in || row.out);
        });
        if (targetDates.length === 0) return alert("保存が必要な入力はありません。");
        try {
            for (const date of targetDates) { await saveAttendance(date); }
            alert(`${targetDates.length}件保存しました！`);
        } catch (e) { alert("エラー: " + e); }
    };

    const revertAttendance = async (date: string) => {
        if (!db || !selectedStaffId) return;
        const res = await db.select<any[]>("SELECT * FROM attendance WHERE staff_id = ? AND work_date = ?", [selectedStaffId, date]);
        if (res.length > 0) {
            const row = res[0];
            setMonthlyWorkData(prev => ({
                ...prev,
                [date]: { 
                    in: row.entry_time, 
                    out: row.exit_time, 
                    bStart: row.break_start, 
                    bEnd: row.break_end, 
                    outTime: row.out_time,     // 🆕 追加
                    returnTime: row.return_time, // 🆕 追加
                    isSaved: true, 
                    savedHours: row.work_hours,
                    nightHours: row.night_hours,     // 🆕 追加
                    actual_hourly_wage: row.actual_hourly_wage // 🆕 追加
                }
            }));
        } else {
            setMonthlyWorkData(prev => { const newData = { ...prev }; delete newData[date]; return newData; });
        }
    };

    // --- スタイル定義 ---
    const cardStyle = { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "20px" };
    const inputStyle = { padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" as const };
    const labelStyle = { fontSize: "12px", color: "#7f8c8d", marginBottom: "2px", display: "block" };
    const timeInputStyle = { padding: "4px 8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", fontFamily: "monospace", backgroundColor: "#fcfcfc" };
    const thStyle = { padding: "12px", fontSize: "14px", color: "#7f8c8d", textAlign: "left" as const };
    const tdStyle = { padding: "12px", fontSize: "14px" };
    const btnStyle = { backgroundColor: "#2ecc71", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const };
    // セットの区切りに使う、少し広めの右余白
    const tdSpacerStyle = { ...tdStyle, paddingRight: "30px" }; 
    // セット内の狭い余白（デフォルトより少し詰めたい場合）
    const tdTightStyle = { ...tdStyle, paddingRight: "4px" };

    // --- ★ 集計ロジック（60時間超・JSX対応版） ★ ---
    const savedRows = monthlyWorkData ? Object.values(monthlyWorkData).filter(row => row?.isSaved) : [];
    
    let totalHours = 0;
    let totalNightHours = 0;
    let totalOvertimeHours = 0; // 画面表示用の「全残業時間」
    let monthlyOTCounter = 0;   // 60h判定用の「累計カウンター」
    let totalEarnings = 0;      // 給与の合計（交通費以外）

    // 日付順にソートして累計計算を正確にする
    const sortedDates = Object.keys(monthlyWorkData)
        .filter(date => monthlyWorkData[date].isSaved)
        .sort();

    sortedDates.forEach(date => {
        const row = monthlyWorkData[date];
        const h = Number(row.savedHours) || 0;
        const n = Number(row.nightHours) || 0;
        
        // スタッフ情報の取得
        const staffInfo = staffList?.find(s => String(s.id) === String(selectedStaffId));
        const wage = Number(row.actual_hourly_wage) || Number(staffInfo?.hourly_wage) || 0;

        totalHours += h;
        totalNightHours += n;

        // 1日の残業時間を計算 (8時間超)
        const dailyOT = Math.max(0, h - PAYROLL_SETTINGS.OVERTIME_THRESHOLD);
        totalOvertimeHours += dailyOT;

        // --- 給与計算 ---
        let dailyAmount = wage * h; // 基本給
        dailyAmount += (wage * 0.25 * n); // 深夜割増分

        // 残業割増分（0.01h単位で累計60hをチェック）
        if (dailyOT > 0) {
            for (let i = 0; i < dailyOT; i += 0.01) {
                if (monthlyOTCounter < 60) {
                    dailyAmount += (wage * 0.25 * 0.01);
                } else {
                    dailyAmount += (wage * 0.50 * 0.01);
                }
                monthlyOTCounter += 0.01;
            }
        }
        totalEarnings += dailyAmount;
    });

    // 交通費の計算
    const currentStaff = staffList?.find(s => String(s.id) === String(selectedStaffId));
    const workDays = sortedDates.length;
    let totalCommute = 0;
    if (currentStaff) {
        const cWage = Number(currentStaff.commute_wage) || 0;
        if (currentStaff.commute_type === "daily") {
            totalCommute = cWage * workDays;
        } else if (currentStaff.commute_type === "monthly") {
            totalCommute = cWage;
        }
    }

    // JSXで使用する最終的な変数
    const totalPay = Math.ceil(totalEarnings) + totalCommute;
    const over60Hours = Math.max(0, monthlyOTCounter - 60); // もし画面に出すなら

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{ color: "#2c3e50" }}>📅 勤務記録・給与集計</h2>
            {/* ... (中略：年月選択、スタッフ選択) ... */}
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                <div>
                    <label style={labelStyle}>対象年月</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <select value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} style={{ ...inputStyle, width: "100px" }}>
                            {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}年</option>)}
                        </select>
                        <select value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))} style={{ ...inputStyle, width: "80px" }}>
                            {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}月</option>))}
                        </select>
                    </div>
                </div>
                <button onClick={() => { const d = new Date(); setTargetYear(d.getFullYear()); setTargetMonth(d.getMonth() + 1); }} style={{ ...modernIconBtnStyle("#7f8c8d"), marginTop: "15px" }}>今月に戻る</button>
            </div>

            <section style={{ ...cardStyle, borderTop: "4px solid #3498db", marginTop: "20px" }}>
                <label style={labelStyle}>対象の従業員を選択</label>
                <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} style={{ ...inputStyle, fontSize: "16px", fontWeight: "bold" }}>
                    <option value="">-- 従業員を選んでください --</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.id}: {s.name}</option>)}
                </select>
            </section>

            {selectedStaffId ? (
                <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
                    <button onClick={saveAllMonthlyData} style={{ ...btnStyle, backgroundColor: "#34495e", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    📂 今月の未保存分をすべて保存
                    </button>
                </div>
                <section style={cardStyle}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#fcfcfc", borderBottom: "2px solid #eee" }}>
                                <th style={{ ...thStyle, width: "100px" }}>日付</th>
                                <th style={thStyle}>出勤</th>
                                <th style={{ ...thStyle, paddingRight: "30px" }}>退勤</th> {/* 隙間 */}
                                <th style={thStyle}>休憩開始</th>
                                <th style={{ ...thStyle, paddingRight: "30px" }}>休憩終了</th> {/* 隙間 */}
                                <th style={thStyle}>外出</th>
                                <th style={{ ...thStyle, paddingRight: "30px" }}>戻り</th> {/* 隙間 */}
                                <th style={thStyle}>実働時間</th>
                                <th style={thStyle}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: new Date(targetYear, targetMonth, 0).getDate() }, (_, i) => {
                                const day = i + 1;
                                const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayOfWeek = new Date(targetYear, targetMonth - 1, day).toLocaleDateString('ja-JP', { weekday: 'short' });
                                
                                const rowData = monthlyWorkData[dateStr] || {};
                                const row = {
                                    in: rowData.in || "",
                                    out: rowData.out || "",
                                    bStart: rowData.bStart || "",
                                    bEnd: rowData.bEnd || "",
                                    outTime: rowData.outTime || "",
                                    returnTime: rowData.returnTime || "",
                                    isSaved: rowData.isSaved || false,
                                    savedHours: Number(rowData.savedHours) || 0
                                };

                                const isFullyTyped = (t: string) => {
                                    if (!t || t === ":") return false;
                                    const [h, m] = t.split(":");
                                    return h.length === 2 && m.length === 2;
                                };

                                const hasAnyInput = (t: string) => {
                                    return t && t !== ":" && t.replace(":", "").length > 0;
                                };

                                const toMin = (t: string) => {
                                    const [h, m] = t.split(":").map(Number);
                                    return h * 60 + m;
                                };

                                const isEmpty = !hasAnyInput(row.in) && !hasAnyInput(row.out) && 
                                                !hasAnyInput(row.bStart) && !hasAnyInput(row.bEnd) &&
                                                !hasAnyInput(row.outTime) && !hasAnyInput(row.returnTime);

                                const isBaseComplete = isFullyTyped(row.in) && isFullyTyped(row.out);

                                // 🆕 ここで定義しておくと矛盾チェックが動きます
                                const isBreakComplete = isFullyTyped(row.bStart) && isFullyTyped(row.bEnd);
                                const isOutComplete = isFullyTyped(row.outTime) && isFullyTyped(row.returnTime);

                                const isBreakIncomplete = (hasAnyInput(row.bStart) || hasAnyInput(row.bEnd)) && !isBreakComplete;
                                const isOutIncomplete = (hasAnyInput(row.outTime) || hasAnyInput(row.returnTime)) && !isOutComplete;

                                // --- 🆕 時間枠の矛盾チェック ---
                                let isTimeRangeError = false;
                                if (isBaseComplete) {
                                    const start = toMin(row.in);
                                    const end = toMin(row.out);

                                    if (end <= start) isTimeRangeError = true;

                                    if (isBreakComplete) {
                                        if (toMin(row.bStart) < start || toMin(row.bEnd) > end) isTimeRangeError = true;
                                        if (toMin(row.bEnd) <= toMin(row.bStart)) isTimeRangeError = true;
                                    }

                                    if (isOutComplete) {
                                        if (toMin(row.outTime) < start || toMin(row.returnTime) > end) isTimeRangeError = true;
                                        if (toMin(row.returnTime) <= toMin(row.outTime)) isTimeRangeError = true;
                                    }
                                }

                                // 🆕 isTimeRangeError を条件に追加
                                const isAllInputValid = isBaseComplete && !isBreakIncomplete && !isOutIncomplete && !isTimeRangeError;

                                // --- 状態判定・計算系（これらが必要！） ---
                                const hasChange = !row.isSaved;

                                const { total: currentHours } = calcDetailedDiff(
                                    row.in, row.out, row.bStart, row.bEnd, row.outTime, row.returnTime
                                );

                                const hasSavedRecord = rowData.isSaved && rowData.savedHours >= 0;

                                return (
                                    <tr key={dateStr} style={{ 
                                        borderBottom: "1px solid #f2f2f2", 
                                        backgroundColor: dayOfWeek === "日" ? "#fff5f5" : dayOfWeek === "土" ? "#f5faff" : "transparent" 
                                    }}>
                                        <td style={{ ...tdStyle, fontWeight: "bold" }}>{day}日 ({dayOfWeek})</td>
                                        <td style={tdTightStyle}><TimeInputPair value={row.in} onChange={val => handleCellChange(dateStr, 'in', val)} /></td>
                                        <td style={tdSpacerStyle}><TimeInputPair value={row.out} onChange={val => handleCellChange(dateStr, 'out', val)} /></td>
                                        <td style={tdTightStyle}><TimeInputPair value={row.bStart} onChange={val => handleCellChange(dateStr, 'bStart', val)} /></td>
                                        <td style={tdSpacerStyle}><TimeInputPair value={row.bEnd} onChange={val => handleCellChange(dateStr, 'bEnd', val)} /></td>
                                        <td style={tdTightStyle}><TimeInputPair value={row.outTime} onChange={val => handleCellChange(dateStr, 'outTime', val)} /></td>
                                        <td style={tdSpacerStyle}><TimeInputPair value={row.returnTime} onChange={val => handleCellChange(dateStr, 'returnTime', val)} /></td>

                                        <td style={{ ...tdStyle, width: "140px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "45px" }}>
                                                {rowData.isSaved && !hasChange ? (
                                                    /* 親要素に relative を指定し、高さを固定（例: 45px） */
                                                    <div style={{ 
                                                        position: "relative", 
                                                        height: "45px", 
                                                        display: "flex", 
                                                        alignItems: "center" 
                                                    }}>
                                                        
                                                        {/* メインの行（チェックと実働時間） */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <span style={{ fontSize: "14px", display: "flex", alignItems: "center" }}>✅</span>
                                                            
                                                            <div style={{ 
                                                                color: row.savedHours > PAYROLL_SETTINGS.OVERTIME_THRESHOLD ? "#e74c3c" : "#2ecc71", 
                                                                fontWeight: "bold",
                                                                display: "flex",
                                                                alignItems: "baseline",
                                                                lineHeight: "1"
                                                            }}>
                                                                <span style={{ fontSize: "16px" }}>{Math.floor(row.savedHours)}</span>
                                                                <span style={{ fontSize: "10px", marginLeft: "2px", marginRight: "4px" }}>時間</span>
                                                                <span style={{ fontSize: "16px" }}>{Math.round((row.savedHours % 1) * 60)}</span>
                                                                <span style={{ fontSize: "10px", marginLeft: "2px" }}>分</span>
                                                            </div>
                                                        </div>

                                                        {/* 🆕 残業チップ：単位を小さくして表示 */}
                                                        {row.savedHours > PAYROLL_SETTINGS.OVERTIME_THRESHOLD && (
                                                            <div style={{ 
                                                                position: "absolute",
                                                                top: "31px",
                                                                left: "20px",
                                                                fontSize: "9px", // チップ全体の基準サイズ
                                                                color: "#e74c3c", 
                                                                backgroundColor: "#fff5f5", 
                                                                padding: "0px 4px", 
                                                                borderRadius: "3px", 
                                                                border: "1px solid #ffcccc",
                                                                whiteSpace: "nowrap",
                                                                display: "flex",        // 🆕 横並び
                                                                alignItems: "baseline"  // 🆕 下端揃え
                                                            }}>
                                                                <span style={{ marginRight: "3px" }}>残業</span>
                                                                
                                                                {/* 時間の数字 */}
                                                                <span style={{ fontSize: "10px", fontWeight: "bold" }}>
                                                                    {Math.floor(row.savedHours - PAYROLL_SETTINGS.OVERTIME_THRESHOLD)}
                                                                </span>
                                                                {/* 時間の単位（さらに小さく） */}
                                                                <span style={{ fontSize: "8px", marginLeft: "1px", marginRight: "2px" }}>時間</span>
                                                                
                                                                {/* 分の数字 */}
                                                                <span style={{ fontSize: "10px", fontWeight: "bold" }}>
                                                                    {Math.round(((row.savedHours - PAYROLL_SETTINGS.OVERTIME_THRESHOLD) % 1) * 60)}
                                                                </span>
                                                                {/* 分の単位（さらに小さく） */}
                                                                <span style={{ fontSize: "8px", marginLeft: "1px" }}>分</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // --- 未保存（入力中）状態 ---
                                                    <div style={{ fontSize: "13px" }}>
                                                        {isEmpty ? (
                                                            <span style={{ color: "#bdc3c7" }}>-</span>
                                                        ) : isTimeRangeError ? (
                                                            // 🆕 矛盾がある時は赤字で警告！
                                                            <span style={{ color: "#e74c3c", fontWeight: "bold" }}>⚠️ 時間枠不正</span>
                                                        ) : isAllInputValid ? (
                                                            <span style={{ color: "#3498db", fontWeight: "bold" }}>🚀 {currentHours}h</span>
                                                        ) : (
                                                            <span style={{ color: "#bdc3c7", fontStyle: "italic" }}>
                                                                {isBreakIncomplete ? "休憩入力待ち..." : 
                                                                isOutIncomplete ? "外出入力待ち..." : 
                                                                !isBaseComplete ? "入力中..." : "保存できます"}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td style={{ ...tdStyle, textAlign: "center", width: "120px" }}>
                                            <div style={{ display: "flex", gap: "4px", justifyContent: "center", minHeight: "30px", alignItems: "center" }}>
                                                
                                                {/* 【更新・保存ボタン】: 整合性が完璧な時だけ出す */}
                                                {isAllInputValid && hasChange && (
                                                    <button 
                                                        style={row.savedHours === 0 ? modernIconBtnStyle("#3498db") : modernIconBtnStyle("#27ae60")} 
                                                        onClick={() => saveAttendance(dateStr)}
                                                    >
                                                        {row.savedHours === 0 ? "保存" : "更新"}
                                                    </button>
                                                )}

                                                {/* 【戻るボタン】: 
                                                    重要：isAllInputValid に依存させない！
                                                    「一度保存された実績(savedHours > 0)があり」かつ「変更(hasChange)がある」なら、
                                                    入力が途中（分がまだ、等）でも常に表示する。 */}
                                                {hasChange && row.savedHours > 0 && (
                                                    <button 
                                                        style={modernIconBtnStyle("#e67e22")} 
                                                        onClick={() => revertAttendance(dateStr)}
                                                    >
                                                        戻る
                                                    </button>
                                                )}
                                                
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div style={{ 
                        marginTop: "20px", 
                        padding: "20px", 
                        backgroundColor: "#2c3e50", 
                        color: "white", 
                        borderRadius: "12px",
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.5fr", // 支給額を少し広く
                        gap: "15px"
                    }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "#bdc3c7" }}>基本情報</div>
                            <div style={{ fontSize: "18px", fontWeight: "bold" }}>{workDays}日 / {formatHours(totalHours)}</div>
                        </div>
                        
                        <div>
                            <div style={{ fontSize: "12px", color: "#e74c3c" }}>残業合計 (割増込)</div>
                            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e74c3c" }}>
                                {formatHours(totalOvertimeHours)}
                            </div>
                            {/* 🆕 60h超がある時だけ、ひっそり、かつ赤く警告 */}
                            {monthlyOTCounter > 60 && (
                                <div style={{ fontSize: "11px", color: "#ff7675" }}>
                                    (うち50%増: {formatHours(monthlyOTCounter - 60)})
                                </div>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#f1c40f" }}>深夜合計</div>
                            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#f1c40f" }}>{formatHours(totalNightHours)}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#bdc3c7" }}>交通費</div>
                            <div style={{ fontSize: "18px", fontWeight: "bold" }}>¥{totalCommute.toLocaleString()}</div>
                        </div>

                        <div style={{ borderLeft: "1px solid #7f8c8d", paddingLeft: "20px", textAlign: "right" }}>
                            <div style={{ fontSize: "12px", color: "#2ecc71" }}>💰 総支給額（概算）</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2ecc71" }}>
                                ¥{totalPay.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </section>
                </>
            ) : (
                <div style={{ ...cardStyle, textAlign: "center", padding: "60px 20px", border: "2px dashed #cbd5e1", color: "#94a3b8" }}>
                    <div style={{ fontSize: "50px" }}>👤👈</div>
                    <h3>従業員を選択してください</h3>
                </div>
            )}
        </div>
    );
}