/**
 * 労働基準法・就業規則関連の定数
 */

/** 深夜労働の定義 (22:00 - 05:00) */
export const NIGHT_START_HOUR = 22;
export const NIGHT_END_HOUR = 5;
export const NIGHT_END_HOUR_NEXT_DAY = 29; // 翌日5時 (24 + 5)

export const NIGHT_START_MINUTES = NIGHT_START_HOUR * 60;
export const NIGHT_END_MINUTES = NIGHT_END_HOUR_NEXT_DAY * 60;

/** 労働時間の法的基準 */
export const LEGAL_WORK_HOURS_DAILY = 8;
export const LEGAL_WORK_HOURS_WEEKLY = 40;

/** 割増率（法定基準） */
export const OVERTIME_RATE = 1.25;      // 時間外労働
export const NIGHT_SHIFT_RATE = 0.25;   // 深夜割増分
export const HOLIDAY_WORK_RATE = 1.35;  // 法定休日労働
export const OVERTIME_PREMIUM_LIMIT_HOURS = 60; // 月間残業の割増率が変わるしきい値
export const OVERTIME_PREMIUM_RATE = 1.50;  // 月60時間超の時間外労働

/** 有給休暇・時間単位年休（法定基準） */
export const PAID_LEAVE_UNIT = 1.0;           // 時間単位年休の最小単位
export const ANNUAL_PAID_LEAVE_MAX_DAYS = 5;  // 時間単位年休の年間上限日数
export const MAX_PAID_LEAVE_PER_DAY = 8.0;    // 1日の時間有給取得上限

/** 端数処理の型定義 */
/** 端数処理のモード定義 */
export type RoundingMode = 'floor' | 'round' | 'ceil';

/** UIでの表示用ラベルと値のセット */
export const ROUNDING_OPTIONS: { label: string; value: RoundingMode }[] = [
  { label: '切り捨て', value: 'floor' },
  { label: '四捨五入', value: 'round' },
  { label: '切り上げ', value: 'ceil' },
];