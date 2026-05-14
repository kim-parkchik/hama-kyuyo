export const generateAttendanceCSV = (data: any[]) => {
  if (!data || data.length === 0) return "";

  // 1. 詳細モード（isFull）の判定
  // DBの「修正用カラム（entry_time）」があるかどうかで判断
  const isFull = data[0] && ("entry_time" in data[0] || "work_type" in data[0]);

  // 2. ヘッダー定義
  const header = isFull 
    ? [
        "スタッフID", "名前", "日付", 
        "打刻_出勤", "打刻_退勤", "打刻_休憩始", "打刻_休憩終", "打刻_外出", "打刻_戻り", // 生データ
        "修正_出勤", "修正_退勤", "修正_休憩始", "修正_休憩終", "修正_外出", "修正_戻り", // 修正データ
        "区分", "有給h", "備考", "確定"
      ]
    : ["スタッフID", "日付", "出勤", "退勤", "休憩始", "休憩終", "外出", "戻り"];

  const rows = data.map(row => {
    if (isFull) {
      // --- 確定フラグ付きの詳細データ ---
      return [
        row.staff_id,
        row.staff_name || "",
        row.work_date,
        // 打刻（生）
        row.csv_entry_time || "",
        row.csv_exit_time || "",
        row.csv_break_start || "",
        row.csv_break_end || "",
        row.csv_out_time || "",
        row.csv_return_time || "",
        // 修正（手入力）
        row.entry_time || "",
        row.exit_time || "",
        row.break_start || "",
        row.break_end || "",
        row.out_time || "",
        row.return_time || "",
        // 付随情報
        row.work_type || "normal",
        row.paid_leave_hours || 0,
        (row.memo || "").replace(/[\n\r,]/g, " "), // CSVを壊さないよう改行・カンマを除去
        row.is_finalized ? "1" : "0"
      ].join(",");
    } else {
      // --- シンプルな打刻ログ（Raw） ---
      return [
        row.staff_id,
        row.work_date,
        row.csv_entry_time || "",
        row.csv_exit_time || "",
        row.csv_break_start || "",
        row.csv_break_end || "",
        row.csv_out_time || "",
        row.csv_return_time || ""
      ].join(",");
    }
  });

  // UTF-8 BOMを付与（Excelでの文字化け防止）
  const bom = "\uFEFF";
  return bom + [header.join(","), ...rows].join("\n");
};

export const parseAttendanceCSV = (csvText: string) => {
  // 1. 文頭のBOMを削除し、改行で分割
  const cleanText = csvText.replace(/^\uFEFF/, ''); 
  const lines = cleanText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // 2. ヘッダーを取得し、ダブルクォーテーションと前後の空白を徹底除去
  const headers = lines[0].split(',').map(h => 
    h.replace(/^["']|["']$/g, '').trim()
  );

  // 3. データ行をオブジェクトに変換
  return lines.slice(1).map(line => {
    // カンマ分割（引用符内のカンマを考慮）
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => 
      v.replace(/^["']|["']$/g, '').trim() // 前後の引用符を消す
    );

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
};