/**
 * 都道府県マスター (JISコード準拠)
 */
export const PREFECTURE_MASTER = [
  { code: 1, name: "北海道", kana: "ホッカイドウ" },
  { code: 2, name: "青森県", kana: "アオモリケン" },
  { code: 3, name: "岩手県", kana: "イワテケン" },
  { code: 4, name: "宮城県", kana: "ミヤギケン" },
  { code: 5, name: "秋田県", kana: "アキタケン" },
  { code: 6, name: "山形県", kana: "ヤマガタケン" },
  { code: 7, name: "福島県", kana: "フクシマケン" },
  { code: 8, name: "茨城県", kana: "イバラキケン" },
  { code: 9, name: "栃木県", kana: "トチギケン" },
  { code: 10, name: "群馬県", kana: "グンマケン" },
  { code: 11, name: "埼玉県", kana: "サイタマケン" },
  { code: 12, name: "千葉県", kana: "チバケン" },
  { code: 13, name: "東京都", kana: "トウキョウト" },
  { code: 14, name: "神奈川県", kana: "カナガワケン" },
  { code: 15, name: "新潟県", kana: "ニイガタケン" },
  { code: 16, name: "富山県", kana: "トヤマケン" },
  { code: 17, name: "石川県", kana: "イシカワケン" },
  { code: 18, name: "福井県", kana: "フクイケン" },
  { code: 19, name: "山梨県", kana: "ヤマナシケン" },
  { code: 20, name: "長野県", kana: "ナガノケン" },
  { code: 21, name: "岐阜県", kana: "ギフケン" },
  { code: 22, name: "静岡県", kana: "シズオカケン" },
  { code: 23, name: "愛知県", kana: "アイチケン" },
  { code: 24, name: "三重県", kana: "ミエケン" },
  { code: 25, name: "滋賀県", kana: "シガケン" },
  { code: 26, name: "京都府", kana: "キョウトフ" },
  { code: 27, name: "大阪府", kana: "オオサカフ" },
  { code: 28, name: "兵庫県", kana: "ヒョウゴケン" },
  { code: 29, name: "奈良県", kana: "ナラケン" },
  { code: 30, name: "和歌山県", kana: "ワカヤマケン" },
  { code: 31, name: "鳥取県", kana: "トットリケン" },
  { code: 32, name: "島根県", kana: "シマネケン" },
  { code: 33, name: "岡山県", kana: "オカヤマケン" },
  { code: 34, name: "広島県", kana: "ヒロシマケン" },
  { code: 35, name: "山口県", kana: "ヤマグチケン" },
  { code: 36, name: "徳島県", kana: "トクシマケン" },
  { code: 37, name: "香川県", kana: "カガワケン" },
  { code: 38, name: "愛媛県", kana: "エヒメケン" },
  { code: 39, name: "高知県", kana: "コウチケン" },
  { code: 40, name: "福岡県", kana: "フクオカケン" },
  { code: 41, name: "佐賀県", kana: "サガケン" },
  { code: 42, name: "長崎県", kana: "ナガサキケン" },
  { code: 43, name: "熊本県", kana: "クマモトケン" },
  { code: 44, name: "大分県", kana: "オオイタケン" },
  { code: 45, name: "宮崎県", kana: "ミヤザキケン" },
  { code: 46, name: "鹿児島県", kana: "カゴシマケン" },
  { code: 47, name: "沖縄県", kana: "オキナワケン" }
] as const;

/**
 * 都道府県に関連する型定義
 */
export type Prefecture = (typeof PREFECTURE_MASTER)[number];
export type PrefectureCode = Prefecture['code'];
export type PrefectureName = Prefecture['name'];