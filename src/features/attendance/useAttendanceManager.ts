import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { generateAttendanceCSV, parseAttendanceCSV } from "../../utils/csvUtils";
import { calculateSalary, calcDetailedDiff } from "../../utils/calcSalary";
import { OVERTIME_RATE, NIGHT_SHIFT_RATE } from '../../constants/salaryMaster2026';

/**
 * 給与計算期間を算出する
 * @param year 対象年
 * @param month 対象月（支給月）
 * @param closingDay 締日 (1~28, 99:末日)
 */
const getPayrollPeriod = (year: number, month: number, closingDay: number) => {
  let startDate: dayjs.Dayjs;
  let endDate: dayjs.Dayjs;

  // 1. 基準となる「その月の1日」を作成
  const baseDate = dayjs(`${year}-${month}-01`);

  if (closingDay === 99 || closingDay === 0) {
    // 【末日締め】
    // dayjsの機能でその月の最初と最後をズバリ取得
    startDate = baseDate.startOf('month');
    endDate = baseDate.endOf('month');
  } else {
    // 【指定日締め（例：15日）】
    // 終了日：その月の指定日
    endDate = dayjs(`${year}-${month}-${closingDay}`);
    // 開始日：前月の締日の翌日
    // 15日締めなら、先月の15日の「1日後」＝16日
    startDate = endDate.subtract(1, 'month').add(1, 'day');
  }

  return {
    startStr: startDate.format('YYYY-MM-DD'),
    endStr: endDate.format('YYYY-MM-DD'),
    displayRange: `${startDate.format('YYYY/MM/DD')} 〜 ${endDate.format('YYYY/MM/DD')}`
  };
};

export function useAttendanceManager({ db, staffList, targetYear, setTargetYear, targetMonth, setTargetMonth }: any) {
  const [activeTab, setActiveTab] = useState<"csv" | "individual">("individual");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [monthlyWorkData, setMonthlyWorkData] = useState<Record<string, any>>({});
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [branchPrefecture, setBranchPrefecture] = useState<string>("京都");
  const [remainingPaidLeave, setRemainingPaidLeave] = useState<number>(0);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [companyHolidays, setCompanyHolidays] = useState<Record<string, number>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>(["active"]);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- ヘルパー: 現在選択中のスタッフ情報を取得 ---
  const selectedStaff = useMemo(() => 
    staffList?.find((s: any) => String(s.id) === String(selectedStaffId)),
    [staffList, selectedStaffId]
  );

  const loadPayrollGroup = useCallback(async (staffId: string) => {
    if (!db || !staffId) return null;
    const res = await db.select(
      `SELECT g.* FROM payroll_groups g
      JOIN staff s ON s.payroll_group_id = g.id
      WHERE s.id = ?`,
      [staffId]
    ) as any[];

    const group = res?.[0] || null;
    setCurrentGroup(group); // 状態として保持しておくとJSX側で「締日」を表示できる
    return group;
  }, [db]);

  // --- カレンダー・休日設定の読み込み ---
  const loadCalendarSettings = useCallback(async () => {
    if (!db) return;
    try {
      const resHolidays = await db.select("SELECT holiday_date, name FROM holiday_master") as any[];
      const hMap: Record<string, string> = {};
      resHolidays.forEach((h) => { hMap[h.holiday_date] = h.name; });
      setHolidays(hMap);

      if (selectedStaffId && selectedStaff) {
        const patternId = selectedStaff.calendar_pattern_id || 1;
        const resCompany = await db.select(
          "SELECT work_date, is_holiday FROM company_calendar WHERE pattern_id = ?",
          [patternId]
        ) as any[];
        const cMap: Record<string, number> = {};
        resCompany.forEach((c) => { cMap[c.work_date] = c.is_holiday; });
        setCompanyHolidays(cMap);
      }
    } catch (e) {
      console.error("Calendar settings load error:", e);
    }
  }, [db, selectedStaffId, selectedStaff]);

  const payrollPeriod = useMemo(() => {
    // closing_day がない、または currentGroup が取得できていない場合は処理しない
    if (!currentGroup?.closing_day) return null;

    // 1. 翌月払いフラグを確認 (1 なら 1ヶ月、0 なら 0ヶ月 遡る)
    const shiftAmount = currentGroup.is_next_month === 1 ? 1 : 0;

    // 2. dayjs を使って、計算のベースとなる年月を割り出す
    // 例: 5月支給で翌月払い(shift:1)なら 4月、当月払い(shift:0)なら 5月になる
    const baseDate = dayjs(`${targetYear}-${targetMonth}-01`).subtract(shiftAmount, 'month');
    
    const calcYear = baseDate.year();
    const calcMonth = baseDate.month() + 1;

    // 3. 割り出した「労働月」を元に期間を算出
    return getPayrollPeriod(
      calcYear,
      calcMonth,
      currentGroup.closing_day
    );
  }, [currentGroup, targetYear, targetMonth]);

  const dateList = useMemo(() => {
    if (!payrollPeriod) return [];

    const start = dayjs(payrollPeriod.startStr);
    const end = dayjs(payrollPeriod.endStr);

    const list: string[] = [];
    let d = start;

    while (d.isBefore(end) || d.isSame(end)) {
      list.push(d.format("YYYY-MM-DD"));
      d = d.add(1, "day");
    }

    return list;
  }, [payrollPeriod]);

  // --- 有給残日数の計算 ---
  const checkRemainingPaidLeave = useCallback(async () => {
    if (!db || !selectedStaffId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const grants = await db.select(
        "SELECT SUM(days_granted) as total FROM paid_leave_grants WHERE staff_id = ? AND expiry_date >= ?",
        [selectedStaffId, today]
      ) as any[];
      
      const used = await db.select(`
        SELECT 
          SUM(CASE WHEN work_type = 'paid_full' THEN 1.0 WHEN work_type = 'paid_half' THEN 0.5 ELSE 0 END) as used_days,
          SUM(paid_leave_hours) as used_hours
        FROM attendance WHERE staff_id = ?`,
        [selectedStaffId]
      ) as any[];

      const totalGranted = grants[0]?.total || 0;
      const daysFromType = used[0]?.used_days || 0;
      const daysFromHours = (used[0]?.used_hours || 0) / 8;
      setRemainingPaidLeave(totalGranted - (daysFromType + daysFromHours));
    } catch (e) {
      console.error("Paid leave check error:", e);
    }
  }, [db, selectedStaffId]);

  // --- 勤怠データの読み込み ---
  const loadMonthlyData = useCallback(async () => {
    // 1. まず現在の表示をクリアする（これが最重要！）
    // これをしないと、DB取得待ちの間に前の人のデータが見えてしまいます
    setMonthlyWorkData({});

    // payrollPeriod や selectedStaffId が揃うまで中断
    if (!db || !selectedStaffId || !payrollPeriod) return;

    setIsLoading(true);
    try {
      const { startStr, endStr } = payrollPeriod;
      const attendanceData = await db.select(
        "SELECT * FROM attendance WHERE staff_id = ? AND work_date BETWEEN ? AND ? ORDER BY work_date ASC",
        [selectedStaffId, startStr, endStr]
      ) as any[];

      // 2. 新しいスタッフ・期間用の空枠を、最新の dateList から作成
      const loaded: Record<string, any> = {};
      dateList.forEach(d => {
        loaded[d] = { 
          in: "", out: "", bStart: "", bEnd: "", outTime: "", returnTime: "", 
          is_finalized: 0, workType: "normal", paidHours: 0, memo: "",
          savedHours: 0, nightHours: 0, csv_entry_time: "", csv_exit_time: ""
        };
      });

      // 3. DBから取得した実データを上書き
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach(row => {
          loaded[row.work_date] = { 
            in: row.entry_time || "", 
            out: row.exit_time || "", 
            bStart: row.break_start || "", 
            bEnd: row.break_end || "",
            outTime: row.out_time || "",
            returnTime: row.return_time || "",
            is_finalized: row.is_finalized || 0,
            finalized_at: row.finalized_at,
            savedHours: Number(row.work_hours) || 0,
            nightHours: Number(row.night_hours) || 0,
            workType: row.work_type || "normal", 
            paidHours: row.paid_leave_hours || 0, 
            memo: row.memo || "",
            csv_entry_time: row.csv_entry_time,
            csv_exit_time: row.csv_exit_time
          };
        });
      }
      
      // 4. まとめて反映
      setMonthlyWorkData(loaded);

    } catch (e) {
      console.error("データ読み込みエラー:", e);
    } finally {
      setTimeout(() => setIsLoading(false), 50);
    }
    // 依存配列に dateList を忘れずに
  }, [db, selectedStaffId, payrollPeriod, dateList]);

  // --- 操作系 ---
  const handleCellChange = (date: string, field: string, value: any) => {
    if (monthlyWorkData[date][field] === value) return;
    setMonthlyWorkData(prev => ({
      ...prev,
      [date]: { 
        ...prev[date], 
        [field]: value, 
        isSaved: false 
      }
    }));
  };

  const finalizeAttendance = async (date: string) => {
    if (isClosed) return alert("この月は給与確定済みです。");
    if (!db || !selectedStaffId || !selectedStaff) return;
    
    const row = monthlyWorkData[date];
    const { total, night } = calcDetailedDiff(row.in, row.out, row.bStart, row.bEnd, row.outTime, row.returnTime);
    
    try {
      const isMonthly = selectedStaff.wage_type === "monthly";
      const now = dayjs().format('YYYY-MM-DD HH:mm');

      await db.execute(
        `INSERT OR REPLACE INTO attendance (
          staff_id, work_date, entry_time, exit_time, 
          break_start, break_end, out_time, return_time, 
          work_hours, night_hours,
          actual_base_wage, overtime_rate, night_rate,
          work_type, paid_leave_hours, memo,
          is_finalized, finalized_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          selectedStaffId, date, row.in||"", row.out||"", 
          row.bStart||"", row.bEnd||"", row.outTime||"", row.returnTime||"", 
          total, night,
          isMonthly ? 0 : selectedStaff.base_wage, 
          OVERTIME_RATE, NIGHT_SHIFT_RATE,
          row.workType, Number(row.paidHours)||0, row.memo||"",
          1, // is_finalized = 1 (確定)
          now // finalized_at
        ]
      );

      // UI側の状態を更新
      setMonthlyWorkData(prev => ({ 
        ...prev, 
        [date]: { ...prev[date], is_finalized: 1, savedHours: total, nightHours: night, finalized_at: now } 
      }));
      await checkRemainingPaidLeave();
    } catch (e) {
      alert("保存エラー");
    }
  };

    // --- 1日のデータをDBの状態に戻す（キャンセル処理） ---
  const unfinalizeAttendance = async (date: string) => {
    if (isClosed) return alert("給与確定済みの月は解除できません。");
    if (!db || !selectedStaffId) return;

    try {
      // DBの is_finalized を 0 に戻す
      await db.execute(
        "UPDATE attendance SET is_finalized = 0 WHERE staff_id = ? AND work_date = ?",
        [selectedStaffId, date]
      );

      // UI側の状態を更新（編集可能にする）
      setMonthlyWorkData(prev => ({
        ...prev,
        [date]: { ...prev[date], is_finalized: 0 }
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const saveAllMonthlyData = async () => {
    // 1. まず対象があるかチェック（この時点ではまだ Loading にしない）
    const targetDates = Object.keys(monthlyWorkData).filter(date => {
      const row = monthlyWorkData[date];
      // 「未確定」かつ「何かしら入力がある」ものを対象にする
      return row.is_finalized === 0 && (row.in || row.out || row.workType !== "normal");
    });
    
    if (targetDates.length === 0) {
      alert("保存が必要な入力はありません。");
      return; 
    }

    // 2. 対象がある場合のみ Loading 開始
    if (isLoading) return; 
    setIsLoading(true);
    
    try {
      if (!db || !selectedStaffId) return;

      for (const date of targetDates) {
        await finalizeAttendance(date);
      }
      alert(`${targetDates.length}件保存しました！`);
    } catch (e) {
      alert("エラー: " + e);
    } finally {
      // 3. 成功しても失敗しても必ず Loading を解除
      setIsLoading(false);
    }
  };

  // --- 給与集計 ---
  const calcResult = useMemo(() => {
    const defaultResult = {
      totalWorkHours: 0,
      totalOvertimeHours: 0,
      totalNightHours: 0,
      highPremiumHours: 0,
      absenceDeduction: 0,
      commutePay: 0,
      totalEarnings: 0,
    };

    // 修正ポイント：isSaved ではなく is_finalized を見る
    const attendanceRows = Object.entries(monthlyWorkData)
      .filter(([_, row]) => row.is_finalized === 1) 
      .map(([date, row]) => ({
        work_date: date,
        work_hours: row.savedHours || 0,
        night_hours: row.night_hours || 0,
        actual_base_wage: row.actual_base_wage
      }));

    if (!selectedStaff || attendanceRows.length === 0 || !companySettings) {
      return defaultResult;
    }

    // ここで calculateSalary を実行（必要な引数はフック内で管理しているはず）
    const result = calculateSalary(
      selectedStaff, 
      attendanceRows, 
      { allowanceName: "", allowanceAmount: 0, residentTax: 0, prefecture: branchPrefecture, dependents: 0, customItems: [] }, 
      targetYear, 
      targetMonth, 
      companySettings
    );

    return result || defaultResult;
  }, [monthlyWorkData, selectedStaff, companySettings, branchPrefecture, targetYear, targetMonth]);

  // --- スタッフフィルタ ---
  const filteredStaffList = useMemo(() => {
    return (staffList || []).filter((s: any) => activeFilters.includes(s.status || "active"));
  }, [staffList, activeFilters]);

  const toggleFilter = (val: string) => {
    setActiveFilters(prev => 
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const checkMonthStatus = useCallback(async () => {
    if (!db || !targetYear || !targetMonth) return;
    try {
      const res = await db.select(
        "SELECT is_closed FROM salary_closings WHERE target_year = ? AND target_month = ?",
        [targetYear, targetMonth]
      ) as any[];
      setIsClosed(res?.[0]?.is_closed === 1);
    } catch (e) {
      console.error("確定状況取得エラー:", e);
      setIsClosed(false);
    }
  }, [db, targetYear, targetMonth]);

  // --- 共通のダウンロード処理 ---
  const downloadCSV = (content: string, filename: string) => {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- 打刻ログのエクスポート ---
  const handleExportRawCSV = async () => {
    if (!db) return;
    const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-`;
    try {
      const data = await db.select(`
        SELECT 
          staff_id, work_date, 
          csv_entry_time as entry_time, csv_exit_time as exit_time,
          csv_break_start as break_start, csv_break_end as break_end,
          csv_out_time as out_time, csv_return_time as return_time
        FROM attendance 
        WHERE work_date LIKE ?
        ORDER BY staff_id, work_date
      `, [`${monthStr}%`]) as any[];

      if (!data.length) return alert("出力するデータがありません。");
      const csvContent = generateAttendanceCSV(data);
      downloadCSV(csvContent, `打刻ログ_${targetYear}年${targetMonth}月.csv`);
    } catch (e) {
      console.error(e);
      alert("エクスポートに失敗しました。");
    }
  };

  // --- 詳細データのエクスポート ---
  const handleExportFullCSV = async () => {
    if (!db || !payrollPeriod) return;
    const { startStr, endStr } = payrollPeriod;

    try {
      const data = await db.select(`
        SELECT a.*, s.name as staff_name 
        FROM attendance a
        JOIN staff s ON a.staff_id = s.id
        WHERE a.work_date BETWEEN ? AND ?
        ORDER BY a.staff_id, a.work_date
      `, [startStr, endStr]) as any[];

      if (!data.length) return alert("出力するデータがありません。");

      // CSVに確定状態の列を追加
      const csvData = data.map(row => ({
        ...row,
        "確定ステータス": isClosed ? "確定済み" : "未確定"
      }));

      const statusLabel = isClosed ? "" : "_【未確定あり】";
      const filename = `勤怠詳細_${targetYear}年${targetMonth}月支給分${statusLabel}.csv`;

      const csvContent = generateAttendanceCSV(csvData); 
      downloadCSV(csvContent, filename);
    } catch (e) {
      console.error(e);
      alert("エクスポートに失敗しました。");
    }
  };

  // --- CSVインポート ---
  const handleImportCSV = async () => {
    if (isClosed) {
      alert("この月はすでに給与確定されているため、保存できません。");
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const rows = parseAttendanceCSV(text);
          if (rows.length === 0) return;

          for (const row of rows) {
            const sId = row["スタッフID"];
            const date = row["日付"];
            if (!sId || !date) continue;

            const staff = staffList.find((s: any) => String(s.id) === String(sId));
            if (!staff) continue;

            // CSVの値を元に計算
            const { total, night } = calcDetailedDiff(
                row["出勤"], row["退勤"], row["休憩始"], row["休憩終"], row["外出"], row["戻り"]
            );

            await db.execute("DELETE FROM attendance WHERE staff_id = ? AND work_date = ?", [sId, date]);
            
            const isMonthly = staff.wage_type === "monthly";

            await db.execute(
              `INSERT OR REPLACE INTO attendance (
                staff_id, work_date, entry_time, exit_time, 
                break_start, break_end, out_time, return_time, 
                work_hours, night_hours,
                actual_base_wage, overtime_rate, night_rate,
                work_type, paid_leave_hours, 
                csv_entry_time, csv_exit_time, csv_break_start, csv_break_end, csv_out_time, csv_return_time,
                is_finalized  -- ★カラムを追加
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, // ★パラメータ(?)と 0 を追加
              [
                sId, date, row["出勤"]||"", row["退勤"]||"", 
                row["休憩始"]||"", row["休憩終"]||"", row["外出"]||"", row["戻り"]||"", 
                total, night,
                isMonthly ? 0 : staff.base_wage, 
                OVERTIME_RATE, NIGHT_SHIFT_RATE,
                "normal", 0,
                row["出勤"]||"", row["退勤"]||"", row["休憩始"]||"", row["休憩終"]||"", row["外出"]||"", row["戻り"]||""
              ]
            );
          }
          alert("インポートが完了しました。");
          // ループ終了後に一度だけ最新データを再読み込み
          await loadMonthlyData(); 
        } catch (err) {
          console.error(err);
          alert("CSV読み込み中にエラーが発生しました。");
        }
      };
      reader.readAsText(file, 'utf-8');
    };
    input.click();
  };

  // --- 副次的な副作用 ---
  useEffect(() => {
    if (selectedStaffId) {
      setIsLoading(true); // 読み込み開始を明示
      loadPayrollGroup(selectedStaffId);
    }
  }, [selectedStaffId, loadPayrollGroup]);

  useEffect(() => {
    loadCalendarSettings();
  }, [loadCalendarSettings]);

  // これがメインのデータ読み込み
  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  useEffect(() => {
    checkRemainingPaidLeave();
  }, [selectedStaffId, checkRemainingPaidLeave]);

  useEffect(() => {
    checkMonthStatus();
  }, [checkMonthStatus]);

  return {
    activeTab, setActiveTab,
    selectedStaff, selectedStaffId, setSelectedStaffId,
    isLoading,
    isClosed,
    monthlyWorkData, setMonthlyWorkData, dateList, payrollPeriod,
    remainingPaidLeave,
    holidays,
    companyHolidays,
    activeFilters, setActiveFilters,
    filteredStaffList,
    toggleFilter,
    calcResult,

    handleCellChange,
    finalizeAttendance,
    saveAllMonthlyData,
    handleExportRawCSV,
    handleExportFullCSV,
    handleImportCSV,
    unfinalizeAttendance,
    loadMonthlyData,
    checkRemainingPaidLeave
  };
}