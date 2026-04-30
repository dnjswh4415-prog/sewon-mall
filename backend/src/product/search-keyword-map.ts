export const SEARCH_KEYWORD_MAP: Record<string, string[]> = {
  키보드: ["キーボード", "keyboard"],
  마우스: ["マウス", "mouse"],
  웹캠: ["ウェブカメラ", "webcam"],
  마이크: ["マイク", "microphone"],
  게이밍액세서리: ["ゲーミングアクセサリー"],

  헤드셋: ["ヘッドセット", "headset"],
  이어폰: ["イヤホン", "earphone"],
  스피커: ["スピーカー", "speaker"],

  모니터: ["モニター", "monitor"],
  노트북: ["ノートパソコン", "ラップトップ", "notebook", "laptop"],
  태블릿: ["タブレット", "tablet"],
  스마트폰: ["スマートフォン", "スマホ", "phone"],
  스마트워치: ["スマートウォッチ", "watch"],

  충전기: ["充電器", "charger"],
  케이블: ["ケーブル", "cable"],
  보조배터리: ["モバイルバッテリー", "battery"],

  의자: ["椅子", "chair"],
  책상: ["机", "desk"],
  조명: ["照明", "light"],
  생활가전: ["生活家電"],

  저장장치: ["ストレージ", "storage"],
  CPU: ["cpu", "プロセッサ"],
  메인보드: ["マザーボード", "mainboard"],
  그래픽카드: ["グラフィックカード", "gpu"],
  RAM: ["ram", "メモリ"],
  SSD: ["ssd"],
  케이스: ["ケース", "case"],
  쿨러: ["クーラー", "cooler"],

  프린터: ["プリンター", "printer"],
  공유기: ["ルーター", "router"],

  스마트홈: ["スマートホーム"],
  보안: ["セキュリティ"],
  차량용품: ["カー用品"],
  블랙박스: ["ドライブレコーダー"],
  스마트도어락: ["スマートドアロック"],
  홈CCTV: ["ホームCCTV", "防犯カメラ"],
  스마트조명: ["スマート照明"],
  스마트플러그: ["スマートプラグ"],
  로봇청소기: ["ロボット掃除機"],
  차량충전기: ["車載充電器"],
  차량거치대: ["車載ホルダー"],
  차량청소기: ["車用掃除機"],
  차량공기청정기: ["車載空気清浄機"],
};

export function expandSearchKeywords(rawKeyword?: string): string[] {
  const keyword = (rawKeyword ?? "").trim();
  if (!keyword) return [];

  const result = new Set<string>();
  result.add(keyword);

  const lowerKeyword = keyword.toLowerCase();

  for (const [ko, aliases] of Object.entries(SEARCH_KEYWORD_MAP)) {
    const allWords = [ko, ...aliases];

    const matched = allWords.some((word) =>
      lowerKeyword.includes(word.toLowerCase()),
    );

    if (matched) {
      allWords.forEach((word) => result.add(word));
    }
  }

  return [...result];
}