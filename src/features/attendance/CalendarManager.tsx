import React, { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { fetch } from "@tauri-apps/plugin-http";
import { ask, open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { Pencil, Trash2, Check, CheckCircle2, X, Plus, RotateCw, FileUp, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
// import { HOLIDAY_CSV_URL_DEFAULT } from "../../constants/appConfig";
import { S } from "./CalendarManager.styles";

interface CalendarManagerProps {
  db: Database;
}

// --- 型定義を更新 ---
interface CalendarPattern {
  id: number;
  name: string;
  is_invalid: number;
}

const currentYear = dayjs().year();

const CalendarManager: React.FC<CalendarManagerProps> = ({ db }) => {
  // const [csvUrl, setCsvUrl] = useState("");
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [companyHolidays, setCompanyHolidays] = useState<Record<string, number>>({});
  const [patterns, setPatterns] = useState<CalendarPattern[]>([]);
  const [currentPatternId, setCurrentPatternId] = useState<number>(1); // 初期値は「標準」
  const [weekStartDay, setWeekStartDay] = useState(0); // ✨追加
  const [holidaySource, setHolidaySource] = useState<"url" | "file">("url"); 
  const [fixedCsvUrl, setFixedCsvUrl] = useState("");
  const [hasHeader, setHasHeader] = useState(true); // デフォルトは「あり」

  const [isAddingPattern, setIsAddingPattern] = useState(false);
  const [newPatternName, setNewPatternName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");


  // 1. パターン一覧の読み込み（初回とパターン追加時に呼ぶ）
  const loadPatterns = async () => {
    try {
      // App.tsxで作られているはずなので、selectするだけでOK
      const res = await db.select<CalendarPattern[]>("SELECT id, name, is_invalid FROM calendar_patterns ORDER BY id ASC");
      setPatterns(res);
      
      // currentPatternId が未設定（初期状態）なら、最初のパターン（標準）を選択
      if (res.length > 0 && !currentPatternId) {
        setCurrentPatternId(res[0].id);
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  // 2. カレンダーデータの読み込み（年、またはカレンダーパターンが変わった時に呼ぶ）
  const loadAllCalendarData = async () => {
    try {
      const resHolidays = await db.select<any[]>("SELECT holiday_date, name FROM holiday_master");
      const hMap: Record<string, string> = {};
      resHolidays.forEach((h) => { hMap[h.holiday_date.replaceAll("/", "-")] = h.name; });
      setHolidays(hMap);

      const resCompany = await db.select<any[]>(
        "SELECT work_date, is_holiday FROM company_calendar WHERE pattern_id = ?",
        [currentPatternId]
      );
      const cMap: Record<string, number> = {};
      resCompany.forEach((c) => { cMap[c.work_date] = c.is_holiday; });
      setCompanyHolidays(cMap);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // holiday_source も select 対象に追加
        const res = await db.select<any[]>("SELECT holiday_csv_url, week_start_day, holiday_source FROM company WHERE id = 1");
        
        if (res && res.length > 0) {
          const urlFromDb = res[0].holiday_csv_url;
          
          if (urlFromDb) {
            // setCsvUrl(urlFromDb);
            setFixedCsvUrl(urlFromDb);
          }
          
          if (res[0].week_start_day !== undefined) {
            setWeekStartDay(res[0].week_start_day);
          }

          // 🆕 取得モード（url か file）をセット
          if (res[0].holiday_source) {
            setHolidaySource(res[0].holiday_source);
          }
        }
        await loadPatterns();
      } catch (e) {
        console.error("Calendar init error:", e);
      }
    };
    init();
  }, [db]);

  // パターンや年が切り替わったらデータを再ロード
  useEffect(() => {
    loadAllCalendarData();
  }, [currentPatternId, year]);

  // --- ✨ 統計計算 & 労務バリデーションロジック ---
  const stats = { workDays: 0, holidayDays: 0 };
  const invalidWeeks: string[] = [];
  let currentWeekHolidays = 0;
  let weekStartDate = "";

  const getDaysInYear = () => {
    const days = [];
    // その年の1月1日 00:00:00 から開始
    let current = dayjs().year(year).startOf('year');
    // その年の12月31日の終わりまで
    const end = dayjs().year(year).endOf('year');

    while (current.isBefore(end) || current.isSame(end)) {
      // 既存のロジックが Date型を期待している場合は .toDate()
      // もし以降の処理も dayjs で統一できるなら current そのままでもOK
      days.push(current.toDate()); 
      current = current.add(1, 'day');
    }
    return days;
  };

  getDaysInYear().forEach(d => {
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (d.getDay() === weekStartDay) {
      if (weekStartDate !== "" && currentWeekHolidays === 0) {
        invalidWeeks.push(weekStartDate);
      }
      weekStartDate = dateKey;
      currentWeekHolidays = 0;
    }

    const isSun = d.getDay() === 0;
    const isSat = d.getDay() === 6;

    const setting = companyHolidays[dateKey];
    const isHolidayMaster = !!holidays[dateKey];

    // ✅ デフォルト休日（土日＋祝日）
    const isDefaultHoliday = isSun || isSat || isHolidayMaster;

    // ✅ 最終判定（UIと完全一致させる）
    const isFinallyHoliday =
      setting !== undefined ? setting === 1 : isDefaultHoliday;

    if (isFinallyHoliday) {
      stats.holidayDays++;
      currentWeekHolidays++;
    } else {
      stats.workDays++;
    }
  });
  // 最後の週のチェック
  if (weekStartDate !== "" && currentWeekHolidays === 0) {
      invalidWeeks.push(weekStartDate);
  }

  const isLawful = invalidWeeks.length === 0;

  // ✨ 判定結果をDBに自動同期
  useEffect(() => {
    const syncStatus = async () => {
      const errorMsg = isLawful ? "" : `${invalidWeeks.length}箇所の休日不足`;
      await db.execute(
        "UPDATE calendar_patterns SET is_invalid = ?, error_message = ? WHERE id = ?",
        [isLawful ? 0 : 1, errorMsg, currentPatternId]
      );
      await loadPatterns();
    };
    if (currentPatternId) syncStatus();
  }, [isLawful, currentPatternId, db]);

  // 3. 日付の切り替え（反転ロジックへ修正）
  const toggleDay = async (dateKey: string) => {
    const d = dayjs(dateKey);
    const isSunOrSat = d.day() === 0 || d.day() === 6; // 0:日, 6:土
    const isHolidayMaster = holidays[dateKey] !== undefined;
    const isDefaultHoliday = isSunOrSat || isHolidayMaster;
    
    const currentStatus = companyHolidays[dateKey]; // DB上の現在の値 (0:出勤, 1:休日, undefined:デフォルト)

    let newStatus: number;

    if (currentStatus === undefined) {
      // 1. 未設定の場合：デフォルトの逆にする
      newStatus = isDefaultHoliday ? 0 : 1;
    } else {
      // 2. 設定済みの場合：現在の値を反転させる (0 -> 1, 1 -> 0)
      newStatus = currentStatus === 1 ? 0 : 1;
    }

    // ✨ 判定のポイント：
    // 「新しく設定しようとしている値」が「カレンダー本来のデフォルト値」と同じになるなら、
    // DBにレコードを持つ必要がないので DELETE する。そうでなければ INSERT する。
    const defaultOfThisDay = isDefaultHoliday ? 1 : 0;

    if (newStatus === defaultOfThisDay) {
      await db.execute(
        "DELETE FROM company_calendar WHERE pattern_id = ? AND work_date = ?", 
        [currentPatternId, dateKey]
      );
    } else {
      await db.execute(
        "INSERT OR REPLACE INTO company_calendar (pattern_id, work_date, is_holiday) VALUES (?, ?, ?)", 
        [currentPatternId, dateKey, newStatus]
      );
    }

    await loadAllCalendarData();
  };

  const processCsvData = async (csvText: string) => {
    const cleanText = csvText.replace(/^\uFEFF/, "");
    const lines = cleanText.split(/\r\n|\r|\n/).map(l => l.trim()).filter(l => l !== "");
    
    // 🆕 1. まずその年の祝日情報をリセット
    await db.execute(
      "DELETE FROM holiday_master WHERE holiday_date LIKE ?",
      [`${year}-%`]
    );
    // 🆕 2. その年の「祝日による休日設定(is_holiday=1)」をリセット
    // await db.execute(
    //   "DELETE FROM company_calendar WHERE pattern_id = ? AND work_date LIKE ? AND is_holiday = 1",
    //   [currentPatternId, `${year}-%`]
    // );

    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const columns = lines[i].split(",");
      if (columns.length < 2) continue;

      const dateStr = columns[0].replace(/"/g, "").trim();
      const name = columns[1].replace(/"/g, "").trim();
      
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const fDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        
        // ① 全社共通の「名前」だけマスタへ（これで十分です）
        await db.execute(
          "INSERT OR REPLACE INTO holiday_master (holiday_date, name) VALUES (?, ?)", 
          [fDate, name]
        );

        // 🆕 このパターンにおける休日(1)として保存
        // await db.execute(
        //   "INSERT OR REPLACE INTO company_calendar (pattern_id, work_date, is_holiday) VALUES (?, ?, 1)",
        //   [currentPatternId, fDate]
        // );
      }
    }
    await loadAllCalendarData();
  };

  // --- 祝日取得アクション (一つに統合) ---
  const handleFetchHolidays = async () => {
    setLoading(true);

    try {
      const res = await db.select("SELECT holiday_source, holiday_csv_url FROM company WHERE id = 1") as any[];
      const source = res[0]?.holiday_source || "url";
      const targetUrl = res[0]?.holiday_csv_url || fixedCsvUrl;

      if (source === "url") {
        if (!targetUrl) {
          alert("祝日取得用のURLが設定されていません。");
          return;
        }
        // --- オンライン取得モード ---
        const response = await fetch(targetUrl, { method: "GET" });
        const buffer = await response.arrayBuffer();
        // 内閣府はShift-JIS確定なのでそのまま
        await processCsvData(new TextDecoder("shift-jis").decode(new Uint8Array(buffer)));
      } else {
        // --- ローカルファイルモード ---
        const selected = await open({ 
          multiple: false, 
          filters: [{ name: "CSV", extensions: ["csv"] }] 
        });
        if (!selected) return;
        const fileData = await readFile(selected as string);
        
        // 🆕 文字コードの自動判別ロジック
        let decodedText = "";
        try {
          // 1. まずは UTF-8 で試みる (fatal: true で失敗を検知)
          decodedText = new TextDecoder("utf-8", { fatal: true }).decode(fileData);
        } catch (e) {
          // 2. UTF-8 で失敗したら Shift-JIS (CP932) でデコード
          console.log("UTF-8 decode failed, trying Shift-JIS...");
          decodedText = new TextDecoder("shift-jis").decode(fileData);
        }
              
        await processCsvData(decodedText);
      }
    } catch (e) {
      console.error(e);
      alert("祝日データの取得に失敗しました。ファイルが壊れているか、形式が違います。");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (y: number, m: number) => {
    const startOfMonth = dayjs().year(y).month(m).startOf('month');
    const daysCount = startOfMonth.daysInMonth();
    
    return Array.from({ length: daysCount }, (_, i) => startOfMonth.add(i, 'day').toDate());
  };

  // --- 新規パターンの保存処理 ---
  const handleSavePattern = async () => {
    if (!newPatternName.trim()) return;

    try {
      await db.execute("INSERT INTO calendar_patterns (name) VALUES (?)", [newPatternName.trim()]);
      await loadPatterns(); 
      setNewPatternName(""); // 入力欄を空にする
      setIsAddingPattern(false); // 入力モードを閉じる
    } catch (e) {
      console.error(e);
      alert("パターンの追加に失敗しました。");
    }
  };

  // --- パターン名の変更保存 ---
  const handleUpdateName = async () => {
    if (!editName.trim()) return;
    try {
      await db.execute("UPDATE calendar_patterns SET name = ? WHERE id = ?", [editName.trim(), currentPatternId]);
      await loadPatterns();
      setIsEditing(false);
    } catch (e) { console.error(e); }
  };

  // --- パターンの削除 ---
  const handleDeletePattern = async () => {
    if (currentPatternId === 1) {
      alert("「標準」パターンは削除できません。");
      return;
    }

    // ✨ window.confirm を ask に置き換え
    const ok = await ask(
      "このカレンダーパターンを削除しますか？\n（このパターンを使用している従業員の設定に影響が出る場合があります）",
      { 
        title: 'パターンの削除確認', 
        kind: 'warning',
        okLabel: '削除する',
        cancelLabel: 'キャンセル'
      }
    );

    if (!ok) return;

    try {
      await db.execute("DELETE FROM calendar_patterns WHERE id = ?", [currentPatternId]);
      setCurrentPatternId(1); // 削除したら標準に戻す
      await loadPatterns();
    } catch (e) { 
      console.error(e);
      alert("パターンの削除に失敗しました。");
    }
  };

  return (
    <div style={S.container}>
      {/* 1. ヘッダー：年選択と祝日取得ボタンのみ */}
      <div style={S.header}>
        {/* 左側：年選択 */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={S.yearSelector}>
            {/* 前年ボタン（必要に応じて過去の制限もかけられます） */}
            <button 
              onClick={() => setYear(year - 1)} 
              style={S.navBtn}
            >
              ◀
            </button>

            <span style={{ fontWeight: "bold", fontSize: "1.2rem", width: "70px", textAlign: "center" }}>
              {year}年
            </span>

            {/* 翌年ボタン：現在の年 + 1 を超えないように制限 */}
            <button 
              onClick={() => setYear(year + 1)} 
              disabled={year >= currentYear + 1}
              style={{
                ...S.navBtn,
                cursor: year >= currentYear + 1 ? 'not-allowed' : 'pointer',
                opacity: year >= currentYear + 1 ? 0.5 : 1
              }}
            >
              ▶
            </button>
          </div>
        </div>

        {/* 右側：設定（ファイルモード時のみ）と実行ボタンをまとめるグループ */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {holidaySource === "file" && (
            <label style={S.csvHeaderLabel}>
              <input 
                type="checkbox" 
                checked={hasHeader} 
                onChange={(e) => setHasHeader(e.target.checked)} 
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
              1行目は見出し
            </label>
          )}

          <button onClick={handleFetchHolidays} disabled={loading} style={S.fetchBtn(holidaySource)}>
            {loading ? <RotateCw size={18} className="animate-spin" /> : (holidaySource === 'url' ? <RotateCw size={18} /> : <FileUp size={18} />)}
            {holidaySource === 'url' ? "最新の祝日を取得" : "祝日CSVを読み込む"}
          </button>
        </div>
      </div>

      {/* 2. パターン管理 & 統計エリア */}
      <div style={S.patternContainer}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#94a3b8" }}>カレンダー形式:</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {patterns.map((p) => {
              const isSelected = currentPatternId === p.id;
              const isError = p.is_invalid === 1;

              if (isSelected && isEditing) {
                return (
                  <div key={p.id} style={S.editInputWrapper}>
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()} style={S.editInput} />
                    <Check size={16} onClick={handleUpdateName} style={{ color: "#2ecc71", cursor: "pointer" }} />
                    <X size={16} onClick={() => setIsEditing(false)} style={{ color: "#94a3b8", cursor: "pointer" }} />
                  </div>
                );
              }

              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => { setCurrentPatternId(p.id); setIsEditing(false); }}
                    style={S.patternBtn(isSelected, isError)}
                  >
                    {isError && <AlertTriangle size={14} style={{ marginRight: "4px" }} />}
                    {p.name}
                  </button>
                  {isSelected && (
                    <div style={S.actionBtnGroup}>
                      <button onClick={() => { setEditName(p.name); setIsEditing(true); }} style={S.iconBtn}><Pencil size={14} /></button>
                      {p.id !== 1 && (
                        <button onClick={handleDeletePattern} style={{ ...S.iconBtn, color: "#e74c3c" }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {/* 追加ボタンと入力欄の切り替えロジック */}
            {isAddingPattern ? (
              <div style={S.editInputWrapper}>
                <input 
                  autoFocus 
                  value={newPatternName} 
                  onChange={(e) => setNewPatternName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePattern()} 
                  placeholder="名称入力..." 
                  style={S.editInput} 
                />
                <Check size={16} onClick={handleSavePattern} style={{ color: "#2ecc71", cursor: "pointer" }} />
                <X size={16} onClick={() => { setIsAddingPattern(false); setNewPatternName(""); }} style={{ color: "#e74c3c", cursor: "pointer" }} />
              </div>
            ) : (
              <button onClick={() => setIsAddingPattern(true)} style={S.addBtn}>
                <Plus size={14} /> 追加
              </button>
            )}
          </div>
        </div>

        <div style={S.statsWrapper}>
          {/* 労務アラートの追加 */}
          <div style={S.lawfulBadge(isLawful)}>
            {isLawful ? (
              <>
                <CheckCircle2 size={14} />
                法定休日遵守
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                休日不足 ({invalidWeeks.length}箇所)
              </>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>稼働日数: <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#2c3e50" }}>{stats.workDays}</span> 日</div>
          <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>休日数: <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#e74c3c" }}>{stats.holidayDays}</span> 日</div>
        </div>
      </div>

      {/* 3. カレンダーグリッド */}
      <div style={S.gridContainer}>
        {Array.from({ length: 12 }, (_, m) => {
          // 月の初日を dayjs で取得
          const firstDayOfMonth = dayjs().year(year).month(m).startOf('month');
          // カレンダーの開始位置（空セルの数）を計算
          const emptyCells = firstDayOfMonth.day();

          return (
            <div key={m} style={S.monthCard}>
              <div style={S.monthTitle}>{m + 1}月</div>
              <div style={S.daysGrid}>
                {/* 月初までの空セル */}
                {Array.from({ length: emptyCells }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}

                {/* 日付セル */}
                {getDaysInMonth(year, m).map((dateObj) => {
                  const d = dayjs(dateObj);
                  const dateKey = d.format("YYYY-MM-DD"); // ✨ これだけで "2026-01-01" 形式になる
                  
                  const hName = holidays[dateKey];
                  const setting = companyHolidays[dateKey];

                  const isSun = d.day() === 0;
                  const isSat = d.day() === 6;

                  // ✅ ① デフォルト休日（土日＋祝日）
                  const isHolidayMaster = !!hName;
                  const isDefaultHoliday = isSun || isSat || isHolidayMaster;

                  // ✅ ② 最終判定（DB優先）
                  const isFinallyHoliday =
                    setting !== undefined ? setting === 1 : isDefaultHoliday;

                  // ✅ ③ 文字色
                  let textColor = "#2c3e50"; 
                  if (isSun || isHolidayMaster) textColor = "#e74c3c"; 
                  else if (isSat) textColor = "#3498db"; 

                  // ✅ ④ 枠線
                  const borderStyle =
                    setting === 0
                      ? "1px solid #bdc3c7"
                      : isFinallyHoliday
                        ? "1px solid #e74c3c"
                        : "1px solid transparent";

                  const isCustomized = setting !== undefined;

                  return (
                    <div 
                      key={dateKey} 
                      onClick={() => toggleDay(dateKey)}
                      style={S.dayCell(isFinallyHoliday, textColor, borderStyle, isCustomized, isHolidayMaster)}
                    >
                      {d.date()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarManager;