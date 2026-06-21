import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "jinsei-note-v3";

// ===== カラー定数 =====
const C = {
  ink: "#2C2420",
  terra: "#C0784A",
  cream: "#F7F3EE",
  white: "#FFFFFF",
  border: "#EDE8E3",
  muted: "#AAA",
  gold: "#F5A623",
  silver: "#9B9B9B",
  bronze: "#C0784A",
};

// ===== おすすめ度定義（⑨: 人生で必ず=3が最上位） =====
const REC_LEVELS = [
  { value: 3, label: "人生で必ず行くべき",   short: "人生で必ず",   color: "#E65100", bg: "#FFF3E0", border: "#FFCC80" },
  { value: 2, label: "好きなら行って損なし", short: "好きなら行って", color: "#1565C0", bg: "#F3F8FF", border: "#BBDEFB" },
  { value: 1, label: "良い思い出になる",     short: "良い思い出",   color: "#33691E", bg: "#F1F8E9", border: "#C5E1A5" },
];

// おすすめ度スコアで降順ソート（rec=3が1位）
function sortEntriesByRec(entries) {
  return [...entries].sort((a, b) => (b.rec ?? 2) - (a.rec ?? 2));
}

// ===== タグ辞書 =====
const TAG_DICTIONARY = [
  { tag: "うどん", aliases: ["うどん屋","讃岐うどん","手打ちうどん","釜揚げうどん"], group: "🍜 麺" },
  { tag: "ラーメン", aliases: ["らーめん","ラーメン屋","拉麺","豚骨ラーメン","醤油ラーメン"], group: "🍜 麺" },
  { tag: "そば", aliases: ["蕎麦","そば屋","手打ちそば","日本そば"], group: "🍜 麺" },
  { tag: "パスタ", aliases: ["スパゲッティ","スパゲティ","ペペロンチーノ"], group: "🍜 麺" },
  { tag: "つけ麺", aliases: ["つけめん"], group: "🍜 麺" },
  { tag: "冷麺", aliases: ["冷やし中華","れいめん"], group: "🍜 麺" },
  { tag: "フォー", aliases: ["pho","ベトナム麺"], group: "🍜 麺" },
  { tag: "素麺", aliases: ["そうめん","流しそうめん"], group: "🍜 麺" },
  { tag: "焼きそば", aliases: ["やきそば"], group: "🍜 麺" },
  { tag: "寿司", aliases: ["すし","鮨","回転寿司","握り寿司"], group: "🍱 和食" },
  { tag: "天ぷら", aliases: ["てんぷら","天丼"], group: "🍱 和食" },
  { tag: "とんかつ", aliases: ["トンカツ","豚カツ","カツレツ"], group: "🍱 和食" },
  { tag: "焼き鳥", aliases: ["やきとり","焼鳥"], group: "🍱 和食" },
  { tag: "うなぎ", aliases: ["鰻","うな重","蒲焼"], group: "🍱 和食" },
  { tag: "おでん", aliases: ["おでん屋"], group: "🍱 和食" },
  { tag: "鍋", aliases: ["鍋料理","もつ鍋","ちゃんこ","湯豆腐"], group: "🍱 和食" },
  { tag: "しゃぶしゃぶ", aliases: ["しゃぶしゃぶ屋"], group: "🍱 和食" },
  { tag: "すき焼き", aliases: ["すきやき"], group: "🍱 和食" },
  { tag: "刺身", aliases: ["お刺身","刺し身"], group: "🍱 和食" },
  { tag: "海鮮丼", aliases: ["海鮮","ちらし寿司"], group: "🍱 和食" },
  { tag: "丼もの", aliases: ["丼","親子丼","牛丼","カツ丼","天丼"], group: "🍱 和食" },
  { tag: "餃子", aliases: ["ぎょうざ","ギョーザ","餃子専門店"], group: "🌍 各国料理" },
  { tag: "中華", aliases: ["中華料理","中国料理","中華料理店"], group: "🌍 各国料理" },
  { tag: "焼肉", aliases: ["焼き肉","バーベキュー","BBQ","炭火焼肉"], group: "🌍 各国料理" },
  { tag: "ホルモン", aliases: ["もつ焼き","ホルモン焼き","内臓"], group: "🌍 各国料理" },
  { tag: "韓国料理", aliases: ["Korean","チヂミ","ビビンバ","サムギョプサル"], group: "🌍 各国料理" },
  { tag: "タイ料理", aliases: ["タイ","Thai","パッタイ","グリーンカレー"], group: "🌍 各国料理" },
  { tag: "インド料理", aliases: ["インド","Indian","ナン","タンドリー"], group: "🌍 各国料理" },
  { tag: "イタリアン", aliases: ["イタリア料理","Italian","リストランテ"], group: "🌍 各国料理" },
  { tag: "フレンチ", aliases: ["フランス料理","French","ビストロ"], group: "🌍 各国料理" },
  { tag: "メキシコ料理", aliases: ["メキシカン","タコス","ブリトー"], group: "🌍 各国料理" },
  { tag: "ベトナム料理", aliases: ["ベトナム","バインミー"], group: "🌍 各国料理" },
  { tag: "トルコ料理", aliases: ["トルコ","ケバブ"], group: "🌍 各国料理" },
  { tag: "カレー", aliases: ["curry","カレーライス","スープカレー"], group: "🍔 カジュアル" },
  { tag: "ハンバーガー", aliases: ["バーガー","burger"], group: "🍔 カジュアル" },
  { tag: "ピザ", aliases: ["pizza","ピッツァ"], group: "🍔 カジュアル" },
  { tag: "唐揚げ", aliases: ["からあげ","フライドチキン"], group: "🍔 カジュアル" },
  { tag: "たこ焼き", aliases: ["タコ焼き","明石焼き"], group: "🍔 カジュアル" },
  { tag: "お好み焼き", aliases: ["おこのみやき","広島焼き"], group: "🍔 カジュアル" },
  { tag: "もんじゃ", aliases: ["もんじゃ焼き"], group: "🍔 カジュアル" },
  { tag: "串カツ", aliases: ["串かつ","串揚げ"], group: "🍔 カジュアル" },
  { tag: "ケーキ", aliases: ["ショートケーキ","チーズケーキ","洋菓子"], group: "🍰 スイーツ" },
  { tag: "パフェ", aliases: ["parfait"], group: "🍰 スイーツ" },
  { tag: "アイスクリーム", aliases: ["ジェラート","アイス","gelato"], group: "🍰 スイーツ" },
  { tag: "和菓子", aliases: ["おはぎ","大福","羊羹","饅頭"], group: "🍰 スイーツ" },
  { tag: "パン", aliases: ["ベーカリー","bakery","クロワッサン"], group: "🍰 スイーツ" },
  { tag: "クレープ", aliases: ["crepe"], group: "🍰 スイーツ" },
  { tag: "ソフトクリーム", aliases: ["ソフトアイス","soft cream"], group: "🍰 スイーツ" },
  { tag: "プリン", aliases: ["pudding","焼きプリン"], group: "🍰 スイーツ" },
  { tag: "カフェ・喫茶店", aliases: ["カフェ","喫茶店","コーヒー","cafe","珈琲"], group: "☕ 飲む" },
  { tag: "居酒屋", aliases: ["いざかや","大衆酒場","酒場"], group: "☕ 飲む" },
  { tag: "バー", aliases: ["bar","BAR","ワインバー","立ち飲み"], group: "☕ 飲む" },
  { tag: "ワイナリー", aliases: ["ワイン醸造所","winery"], group: "☕ 飲む" },
  { tag: "日本酒蔵", aliases: ["酒蔵","蔵元","醸造所"], group: "☕ 飲む" },
  { tag: "クラフトビール", aliases: ["ブルワリー","brewery","地ビール"], group: "☕ 飲む" },
  { tag: "ウイスキー蒸留所", aliases: ["蒸溜所","distillery"], group: "☕ 飲む" },
  { tag: "茶室", aliases: ["お茶室","茶道","抹茶"], group: "☕ 飲む" },
  { tag: "夕日", aliases: ["夕焼け","サンセット","sunset"], group: "🌅 景色" },
  { tag: "朝日", aliases: ["日の出","sunrise","御来光"], group: "🌅 景色" },
  { tag: "夜景", aliases: ["夜の景色","イルミネーション","ナイトビュー"], group: "🌅 景色" },
  { tag: "星空", aliases: ["星","天の川","プラネタリウム","stargazing"], group: "🌅 景色" },
  { tag: "紅葉", aliases: ["もみじ","紅葉狩り","秋の景色"], group: "🌅 景色" },
  { tag: "桜", aliases: ["さくら","花見","お花見","cherry blossom"], group: "🌅 景色" },
  { tag: "雪景色", aliases: ["雪","冬景色","雪原"], group: "🌅 景色" },
  { tag: "雲海", aliases: ["雲の海","雲上"], group: "🌅 景色" },
  { tag: "富士山", aliases: ["ふじさん","Mt.Fuji","富士"], group: "🌅 景色" },
  { tag: "オーロラ", aliases: ["aurora","北極光","南極光"], group: "🌅 景色" },
  { tag: "花火", aliases: ["花火大会","fireworks"], group: "🌅 景色" },
  { tag: "海", aliases: ["ビーチ","海岸","砂浜","ocean","sea"], group: "🌿 自然" },
  { tag: "山・登山", aliases: ["山","登山","ハイキング","山頂"], group: "🌿 自然" },
  { tag: "滝", aliases: ["たき","waterfall","名瀑"], group: "🌿 自然" },
  { tag: "湖", aliases: ["こ","lake","湖畔"], group: "🌿 自然" },
  { tag: "川", aliases: ["河川","川辺","渓流"], group: "🌿 自然" },
  { tag: "岬", aliases: ["みさき","cape","断崖","絶壁"], group: "🌿 自然" },
  { tag: "棚田", aliases: ["段々畑","たなだ"], group: "🌿 自然" },
  { tag: "ひまわり畑", aliases: ["ひまわり","向日葵"], group: "🌿 自然" },
  { tag: "ラベンダー畑", aliases: ["ラベンダー","lavender"], group: "🌿 自然" },
  { tag: "森林", aliases: ["森","林","forest","樹海"], group: "🌿 自然" },
  { tag: "鍾乳洞", aliases: ["洞窟","cave","洞穴"], group: "🌿 自然" },
  { tag: "珊瑚礁", aliases: ["サンゴ","coral reef"], group: "🌿 自然" },
  { tag: "スキー場", aliases: ["スキー","スノーボード","ゲレンデ","ski"], group: "🎿 アクティビティ" },
  { tag: "サーフィン", aliases: ["surf","波乗り"], group: "🎿 アクティビティ" },
  { tag: "ダイビング", aliases: ["diving","スキューバ","スキューバダイビング"], group: "🎿 アクティビティ" },
  { tag: "カヤック", aliases: ["カヌー","kayak","SUP"], group: "🎿 アクティビティ" },
  { tag: "ラフティング", aliases: ["rafting","川下り"], group: "🎿 アクティビティ" },
  { tag: "トレッキング", aliases: ["ウォーキング","ハイキング","trekking"], group: "🎿 アクティビティ" },
  { tag: "乗馬", aliases: ["horse riding","馬","ホーストレッキング"], group: "🎿 アクティビティ" },
  { tag: "パラグライダー", aliases: ["paragliding","パラセーリング"], group: "🎿 アクティビティ" },
  { tag: "バンジージャンプ", aliases: ["bungee","バンジー"], group: "🎿 アクティビティ" },
  { tag: "釣り", aliases: ["フィッシング","fishing","渓流釣り","海釣り"], group: "🎿 アクティビティ" },
  { tag: "ゴルフ場", aliases: ["ゴルフ","golf","コース"], group: "🎿 アクティビティ" },
  { tag: "サイクリング", aliases: ["自転車","cycling","ポタリング"], group: "🎿 アクティビティ" },
  { tag: "テーマパーク・遊園地", aliases: ["テーマパーク","遊園地","ディズニー","USJ","アミューズメント"], group: "🎡 施設" },
  { tag: "水族館", aliases: ["aquarium"], group: "🎡 施設" },
  { tag: "動物園", aliases: ["zoo"], group: "🎡 施設" },
  { tag: "植物園", aliases: ["botanical garden"], group: "🎡 施設" },
  { tag: "博物館", aliases: ["museum","歴史博物館"], group: "🎡 施設" },
  { tag: "科学館", aliases: ["科学博物館","planetarium"], group: "🎡 施設" },
  { tag: "プラネタリウム", aliases: ["星空観察","天文台"], group: "🎡 施設" },
  { tag: "神社", aliases: ["shrine","大社","神宮","お宮"], group: "🎭 文化・歴史" },
  { tag: "寺", aliases: ["temple","お寺","仏閣","大仏"], group: "🎭 文化・歴史" },
  { tag: "城", aliases: ["お城","castle","城跡"], group: "🎭 文化・歴史" },
  { tag: "世界遺産", aliases: ["world heritage","UNESCO"], group: "🎭 文化・歴史" },
  { tag: "美術館", aliases: ["art museum","ギャラリー","gallery","アート"], group: "🎭 文化・歴史" },
  { tag: "街並み", aliases: ["古民家","町並み","レトロ","古い街","商店街"], group: "🎭 文化・歴史" },
  { tag: "市場", aliases: ["マーケット","市場","朝市","錦市場"], group: "🎭 文化・歴史" },
  { tag: "陶芸", aliases: ["pottery","焼き物","陶芸体験"], group: "🎪 体験" },
  { tag: "ガラス工芸", aliases: ["吹きガラス","琉球ガラス"], group: "🎪 体験" },
  { tag: "酒造見学", aliases: ["蔵見学","醸造見学"], group: "🎪 体験" },
  { tag: "農業体験", aliases: ["農園","収穫体験","果物狩り","いちご狩り"], group: "🎪 体験" },
  { tag: "漁業体験", aliases: ["漁師体験","釣り体験"], group: "🎪 体験" },
  { tag: "料理教室", aliases: ["cooking class","クッキング"], group: "🎪 体験" },
  { tag: "茶道", aliases: ["tea ceremony","お茶","茶道体験"], group: "🎪 体験" },
  { tag: "座禅", aliases: ["禅","zen","瞑想"], group: "🎪 体験" },
  { tag: "パン作り", aliases: ["bread making","ベーキング"], group: "🎪 体験" },
  { tag: "野球場", aliases: ["野球","baseball","球場","プロ野球"], group: "🏟️ スポーツ観戦" },
  { tag: "サッカースタジアム", aliases: ["サッカー","football","スタジアム"], group: "🏟️ スポーツ観戦" },
  { tag: "バスケ観戦", aliases: ["バスケットボール","basketball","NBA","Bリーグ"], group: "🏟️ スポーツ観戦" },
  { tag: "ラグビー観戦", aliases: ["ラグビー","rugby"], group: "🏟️ スポーツ観戦" },
  { tag: "テニス観戦", aliases: ["テニス","tennis"], group: "🏟️ スポーツ観戦" },
  { tag: "競馬場", aliases: ["競馬","horse racing"], group: "🏟️ スポーツ観戦" },
  { tag: "相撲", aliases: ["大相撲","国技館","sumo"], group: "🏟️ スポーツ観戦" },
  { tag: "温泉", aliases: ["onsen","湯","お風呂","露天風呂","湯治"], group: "♨️ 癒し" },
  { tag: "サウナ", aliases: ["sauna","ととのう","フィンランドサウナ"], group: "♨️ 癒し" },
  { tag: "銭湯", aliases: ["公衆浴場","お風呂","銭湯"], group: "♨️ 癒し" },
  { tag: "スパ", aliases: ["spa","エステ","リラクゼーション"], group: "♨️ 癒し" },
  { tag: "リトリート", aliases: ["retreat","瞑想リトリート","ヨガ"], group: "♨️ 癒し" },
  { tag: "ホテル", aliases: ["hotel","リゾートホテル","シティホテル"], group: "🏨 泊まる" },
  { tag: "旅館", aliases: ["ryokan","和風旅館","老舗旅館"], group: "🏨 泊まる" },
  { tag: "民宿", aliases: ["民泊","B&B","ペンション"], group: "🏨 泊まる" },
  { tag: "ゲストハウス", aliases: ["hostel","ホステル","ドミトリー"], group: "🏨 泊まる" },
  { tag: "グランピング", aliases: ["glamping","豪華キャンプ"], group: "🏨 泊まる" },
  { tag: "ツリーハウス", aliases: ["treehouse","木の上の宿"], group: "🏨 泊まる" },
  { tag: "マルシェ", aliases: ["marche","朝市","ファーマーズマーケット"], group: "🛍️ 買う" },
  { tag: "骨董市", aliases: ["アンティーク","蚤の市","フリマ"], group: "🛍️ 買う" },
  { tag: "道の駅・産直", aliases: ["道の駅","産直","直売所","JAショップ"], group: "🛍️ 買う" },
  { tag: "アウトレット", aliases: ["outlet","アウトレットモール"], group: "🛍️ 買う" },
  { tag: "ライブ・コンサート", aliases: ["ライブ","コンサート","live","concert","フェス","音楽フェス"], group: "🎵 エンタメ" },
  { tag: "映画館", aliases: ["シネマ","cinema","movie","映画"], group: "🎵 エンタメ" },
  { tag: "演劇・落語", aliases: ["演劇","落語","歌舞伎","宝塚","ミュージカル"], group: "🎵 エンタメ" },
  { tag: "祭り", aliases: ["お祭り","festival","縁日","夏祭り"], group: "🎵 エンタメ" },
  { tag: "猫カフェ", aliases: ["ねこカフェ","猫","cat cafe"], group: "🐾 動物・生き物" },
  { tag: "牧場", aliases: ["ファーム","farm","動物ふれあい"], group: "🐾 動物・生き物" },
  { tag: "イルカウォッチング", aliases: ["イルカ","dolphin","クジラ","whale"], group: "🐾 動物・生き物" },
  { tag: "ホタル", aliases: ["蛍","firefly"], group: "🐾 動物・生き物" },
  { tag: "ローカル線", aliases: ["ローカル電車","路面電車","トロッコ列車","観光列車"], group: "🚂 乗り物体験" },
  { tag: "ロープウェイ", aliases: ["ゴンドラ","リフト","cable car"], group: "🚂 乗り物体験" },
  { tag: "クルーズ船", aliases: ["クルーズ","cruise","遊覧船","屋形船"], group: "🚂 乗り物体験" },
  { tag: "人力車", aliases: ["rickshaw","じんりきしゃ"], group: "🚂 乗り物体験" },
];

const GROUP_EMOJIS = {
  "🍜 麺":"🍜","🍱 和食":"🍱","🌍 各国料理":"🌍","🍔 カジュアル":"🍔",
  "🍰 スイーツ":"🍰","☕ 飲む":"☕","🌅 景色":"🌅","🌿 自然":"🌿",
  "🎿 アクティビティ":"🎿","🎡 施設":"🎡","🎭 文化・歴史":"🎭","🎪 体験":"🎪",
  "🏟️ スポーツ観戦":"🏟️","♨️ 癒し":"♨️","🏨 泊まる":"🏨","🛍️ 買う":"🛍️",
  "🎵 エンタメ":"🎵","🐾 動物・生き物":"🐾","🚂 乗り物体験":"🚂",
};

const ACCENT_COLORS = [
  "#F5A623","#5DCAA5","#7F77DD","#D85A30","#4A90D9","#E91E8C",
  "#26A69A","#8D6E63","#78909C","#66BB6A",
];

function getAccentColor(idx) { return ACCENT_COLORS[idx % ACCENT_COLORS.length]; }
function getTagEmoji(tagName) {
  const entry = TAG_DICTIONARY.find(e => e.tag === tagName);
  return entry ? (GROUP_EMOJIS[entry.group] || "⭐") : "⭐";
}
function normalizeTag(input) {
  const trimmed = input.trim();
  for (const entry of TAG_DICTIONARY) {
    if (entry.tag === trimmed) return entry.tag;
    if (entry.aliases.some(a => a === trimmed)) return entry.tag;
  }
  return trimmed;
}
function getSuggestions(input) {
  if (!input || input.length < 1) return [];
  const lower = input.toLowerCase();
  const results = [];
  for (const entry of TAG_DICTIONARY) {
    const allTerms = [entry.tag, ...entry.aliases];
    if (allTerms.some(t => t.toLowerCase().includes(lower))) {
      results.push(entry);
      if (results.length >= 8) break;
    }
  }
  return results;
}

// ① iOSズーム防止: font-size:16px + touch-action:manipulation
const inputStyle = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  padding: "12px 14px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 16,
  lineHeight: "1.4",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  background: C.white,
  WebkitAppearance: "none",
  MozAppearance: "none",
  appearance: "none",
  touchAction: "manipulation",
  minWidth: 0,
  color: C.ink,
};
const labelStyle = {
  display: "block", fontSize: 11, fontWeight: "bold",
  color: "#888", marginBottom: 6, letterSpacing: 0.5,
};

// ===== おすすめ度バッジ =====
function RecBadge({ value, large }) {
  const rec = REC_LEVELS.find(r => r.value === value);
  if (!rec) return null;
  return (
    <span style={{
      fontSize: large ? 13 : 11, fontWeight: "bold",
      padding: large ? "4px 12px" : "3px 8px", borderRadius: 20,
      color: rec.color, background: rec.bg, border: `1px solid ${rec.border}`,
      whiteSpace: "nowrap", display: "inline-block",
    }}>{rec.short}</span>
  );
}

// ⑦ 順位バッジ（目立つデザイン）
function RankBadge({ rank }) {
  if (rank === 1) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 32 }}>🥇</span>
      <span style={{ fontSize: 10, fontWeight: "bold", color: "#C8941A", marginTop: -2 }}>1位</span>
    </div>
  );
  if (rank === 2) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 32 }}>🥈</span>
      <span style={{ fontSize: 10, fontWeight: "bold", color: "#7B7B7B", marginTop: -2 }}>2位</span>
    </div>
  );
  if (rank === 3) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 32 }}>🥉</span>
      <span style={{ fontSize: 10, fontWeight: "bold", color: "#A0622A", marginTop: -2 }}>3位</span>
    </div>
  );
  return (
    <div style={{
      minWidth: 40, height: 40, borderRadius: "50%",
      background: "#F0EDE8", color: "#888",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: "bold", fontSize: 15, flexShrink: 0,
    }}>{rank}</div>
  );
}

// ===== カテゴリ入力（サジェスト付き）=====
function CategoryInput({ value, onChange, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const suggestions = getSuggestions(value);
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={inputStyle}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto", marginTop: 4,
        }}>
          {suggestions.map(s => (
            <div key={s.tag}
              onMouseDown={() => { onSelect(s.tag); setOpen(false); }}
              onTouchEnd={e => { e.preventDefault(); onSelect(s.tag); setOpen(false); }}
              style={{ padding: "12px 14px", cursor: "pointer", borderBottom: `1px solid #F5F5F5`, display: "flex", alignItems: "center", gap: 10 }}
            >
              <span style={{ fontSize: 20 }}>{GROUP_EMOJIS[s.group]}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: "bold", color: C.ink }}>{s.tag}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.group}</div>
              </div>
            </div>
          ))}
          {value && !suggestions.find(s => s.tag === value) && (
            <div
              onMouseDown={() => { onSelect(value); setOpen(false); }}
              onTouchEnd={e => { e.preventDefault(); onSelect(value); setOpen(false); }}
              style={{ padding: "12px 14px", cursor: "pointer", color: C.terra, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>＋</span>「{value}」を新しく追加
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Places API ローダー（Session Token + デバウンス + キャッシュ）=====
let _mapsLoaded = false;
let _mapsLoading = false;
const _mapsCallbacks = [];
const _suggestCache = {};
const MAPS_KEY = typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_GOOGLE_MAPS_KEY : undefined;

function loadGoogleMaps(callback) {
  if (_mapsLoaded) { callback(); return; }
  _mapsCallbacks.push(callback);
  if (_mapsLoading) return;
  _mapsLoading = true;
  if (!MAPS_KEY) { console.warn("NEXT_PUBLIC_GOOGLE_MAPS_KEY が未設定です"); return; }
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=ja`;
  script.async = true;
  script.onload = () => { _mapsLoaded = true; _mapsCallbacks.forEach(cb => cb()); };
  document.head.appendChild(script);
}

// ② 都道府県自動入力 + コスト最適化Places入力
function PlacesInput({ onSelect, initialName = "" }) {
  const [query, setQuery] = useState(initialName);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const acRef = useRef(null);
  const psRef = useRef(null);
  const mapDivRef = useRef(null);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const sessionTokenRef = useRef(null); // Session Token でコスト削減

  useEffect(() => {
    loadGoogleMaps(() => {
      acRef.current = new window.google.maps.places.AutocompleteService();
      psRef.current = new window.google.maps.places.PlacesService(mapDivRef.current);
      // Session Token 生成（1記録につき1トークン = コスト最小化）
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    });
  }, []);

  useEffect(() => {
    function handleClick(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function search(value) {
    // 漢字・カタカナは1文字でもOK、ひらがなは2文字以上
    const hasCJK = /[\u4e00-\u9fff\u30A0-\u30FF]/.test(value); // 漢字 or カタカナ
    const minLen = hasCJK ? 1 : 2;
    if (!value || value.length < minLen || !acRef.current) { setSuggestions([]); return; }
    // キャッシュチェック（同じ検索ワードは再リクエストしない）
    if (_suggestCache[value]) { setSuggestions(_suggestCache[value]); return; }
    setLoading(true);
    acRef.current.getPlacePredictions(
      { input: value, language: "ja", sessionToken: sessionTokenRef.current },
      (predictions, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const result = predictions.slice(0, 6);
          _suggestCache[value] = result; // キャッシュ保存
          setSuggestions(result);
        } else { setSuggestions([]); }
      }
    );
  }

  function handleChange(e) {
    const v = e.target.value;
    setQuery(v); setSelected(null); setOpen(true); onSelect(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300); // 300msデバウンス
  }

  function handleSelect(prediction) {
    setQuery(prediction.structured_formatting.main_text);
    setOpen(false); setSuggestions([]);
    psRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["name","formatted_address","geometry","address_components","url"], sessionToken: sessionTokenRef.current },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;
        // ② address_componentsから都道府県を自動抽出
        const prefComp = place.address_components?.find(c =>
          c.types.includes("administrative_area_level_1")
        );
        const result = {
          name: place.name,
          address: place.formatted_address,
          prefecture: prefComp?.long_name || "",
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          googleMapsUrl: place.url,
          placeId: prediction.place_id,
        };
        setSelected(result);
        onSelect(result);
        // 次の検索用に新しいSession Token を生成
        if (window.google?.maps?.places?.AutocompleteSessionToken) {
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  }

  function handleClear() { setSelected(null); setQuery(""); onSelect(null); }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div ref={mapDivRef} style={{ display: "none" }} />
      <div style={{ position: "relative" }}>
        <input
          value={query} onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="店名・場所名を入力..." autoComplete="off"
          style={{
            ...inputStyle,
            paddingRight: 40,
            border: `1.5px solid ${selected ? C.terra : C.border}`,
            background: selected ? "#FFF8F5" : C.white,
          }}
        />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: selected ? 18 : 14, color: selected ? C.terra : C.muted, pointerEvents: "none" }}>
          {loading ? "…" : selected ? "✓" : "🔍"}
        </span>
      </div>
      {open && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          {suggestions.map(s => (
            <div key={s.place_id}
              onMouseDown={() => handleSelect(s)}
              onTouchEnd={e => { e.preventDefault(); handleSelect(s); }}
              style={{ padding: "13px 14px", cursor: "pointer", borderBottom: `1px solid #F5F0EB`, display: "flex", alignItems: "flex-start", gap: 10 }}
            >
              <span style={{ fontSize: 16, marginTop: 2, flexShrink: 0, color: C.terra }}>📍</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: "bold", color: C.ink }}>{s.structured_formatting.main_text}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.structured_formatting.secondary_text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div style={{ marginTop: 8, background: "#FFF8F5", border: "1px solid #F0E8E0", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📍</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: "bold", color: C.ink, marginBottom: 4 }}>{selected.name}</div>
            {selected.prefecture && (
              <div style={{ fontSize: 12, color: C.terra, fontWeight: "bold", marginBottom: 3 }}>📌 {selected.prefecture}</div>
            )}
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, lineHeight: 1.4 }}>{selected.address}</div>
            {selected.googleMapsUrl && (
              <a href={selected.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#4A90D9", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                🗺 Googleマップで確認
              </a>
            )}
          </div>
          <button onMouseDown={handleClear} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", flexShrink: 0, padding: 4 }}>✕</button>
        </div>
      )}
      {!MAPS_KEY && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#E57373" }}>⚠️ NEXT_PUBLIC_GOOGLE_MAPS_KEY が未設定です</div>
      )}
    </div>
  );
}

// ===== 画像リサイズ =====
function resizeImage(file, maxSize = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
        else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ===== エントリーフォーム =====
function EntryForm({ onSave, onCancel, initial, categoryName }) {
  const [name, setName] = useState(initial?.name || "");
  const [prefecture, setPrefecture] = useState(initial?.prefecture || "");
  const [placeData, setPlaceData] = useState(initial?.placeData || null);
  const [rec, setRec] = useState(initial?.rec ?? 3);
  const [comment, setComment] = useState(initial?.comment || "");
  const [visitDate, setVisitDate] = useState(initial?.visitDate || "");
  const [photo, setPhoto] = useState(initial?.photo || null);
  const fileInputRef = useRef(null);

  // ② サジェスト選択時に都道府県を自動セット
  function handlePlaceSelect(place) {
    if (place) {
      setPlaceData(place);
      setName(place.name);
      setPrefecture(place.prefecture || "");
    } else {
      setPlaceData(null);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setPhoto(resized);
  }

  const PREFS = ["北海道","青森","岩手","宮城","秋田","山形","福島","茨城","栃木","群馬","埼玉","千葉","東京","神奈川","新潟","富山","石川","福井","山梨","長野","岐阜","静岡","愛知","三重","滋賀","京都","大阪","兵庫","奈良","和歌山","鳥取","島根","岡山","広島","山口","徳島","香川","愛媛","高知","福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄","海外"];

  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "20px 16px", border: `1px solid ${C.border}`, width: "100%", boxSizing: "border-box", overflow: "hidden" }}>
      {/* 場所検索 */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>店名・場所名 *</label>
        <PlacesInput onSelect={handlePlaceSelect} initialName={initial?.name || ""} />
        {!MAPS_KEY && (
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={`例：おすすめの${categoryName}`}
            style={{ ...inputStyle, marginTop: 8 }} />
        )}
      </div>

      {/* ③ 都道府県：ネイティブselectをラッパーで完全に包む */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>都道府県</label>
        <div style={{ position: "relative", width: "100%" }}>
          <select
            value={prefecture}
            onChange={e => setPrefecture(e.target.value)}
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: "100%", height: "100%",
              opacity: 0,
              zIndex: 2,
              cursor: "pointer",
            }}>
            <option value="">選択してください</option>
            {PREFS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{
            width: "100%",
            padding: "12px 40px 12px 14px",
            border: `1.5px solid ${prefecture ? C.terra : C.border}`,
            borderRadius: 10,
            fontSize: 16,
            boxSizing: "border-box",
            background: prefecture ? "#FFF8F5" : C.white,
            color: prefecture ? C.ink : C.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pointerEvents: "none",
            minHeight: 48,
          }}>
            <span>{prefecture || "選択してください"}</span>
            <span style={{ fontSize: 12, color: C.muted }}>▼</span>
          </div>
        </div>
      </div>

      {/* ③ 訪問日：textで受け取りdateピッカーと重ねる */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>訪問日</label>
        <div style={{ position: "relative", width: "100%" }}>
          <input
            type="date"
            value={visitDate}
            onChange={e => setVisitDate(e.target.value)}
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: "100%", height: "100%",
              opacity: 0,
              zIndex: 2,
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          />
          <div style={{
            width: "100%",
            padding: "12px 14px",
            border: `1.5px solid ${visitDate ? C.terra : C.border}`,
            borderRadius: 10,
            fontSize: 16,
            boxSizing: "border-box",
            background: visitDate ? "#FFF8F5" : C.white,
            color: visitDate ? C.ink : C.muted,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 48,
            pointerEvents: "none",
          }}>
            <span>📅</span>
            <span>
              {visitDate
                ? new Date(visitDate + "T00:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
                : "日付を選択"}
            </span>
          </div>
        </div>
      </div>

      {/* おすすめ度（⑨: 人生で必ず=最上位を上に表示） */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>おすすめ度 *</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {REC_LEVELS.map(r => (
            <button key={r.value} onClick={() => setRec(r.value)} style={{
              width: "100%", borderRadius: 10, padding: "12px 16px",
              fontSize: 14, fontFamily: "inherit", cursor: "pointer",
              textAlign: "left", display: "flex", alignItems: "center", gap: 10,
              fontWeight: rec === r.value ? "bold" : "normal",
              border: rec === r.value ? `2px solid ${r.color}` : `1.5px solid ${C.border}`,
              background: rec === r.value ? r.bg : C.white,
              color: rec === r.value ? r.color : "#888",
            }}>
              <span style={{ fontSize: 18 }}>
                {r.value === 3 ? "🥇" : r.value === 2 ? "🥈" : "🥉"}
              </span>
              <span>{r.label}</span>
              {rec === r.value && <span style={{ marginLeft: "auto", fontSize: 16 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>一言コメント</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="ここが最高だった！" rows={3}
          style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {/* 写真 */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>写真（1枚）</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        {photo ? (
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <img src={photo} alt="写真" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
            <button onClick={() => setPhoto(null)}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 8, padding: "5px 12px", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              変更
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} style={{
            width: "100%", height: 100, border: `2px dashed ${C.border}`, borderRadius: 10,
            background: "#FAFAF9", cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            touchAction: "manipulation",
          }}>
            <span style={{ fontSize: 28 }}>📷</span>
            <span style={{ fontSize: 13, color: C.muted }}>タップして写真を追加</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => {
            const finalName = (MAPS_KEY ? placeData?.name : name)?.trim() || name.trim();
            if (!finalName) return;
            onSave({ name: finalName, prefecture, placeData: placeData || null, rec, comment, visitDate, photo, id: initial?.id || Date.now() });
          }}
          style={{ flex: 2, background: C.ink, color: C.white, border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: "bold", cursor: "pointer", touchAction: "manipulation" }}>
          保存する
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, background: "#F0F0F0", color: "#555", border: "none", borderRadius: 12, padding: "14px", fontSize: 16, cursor: "pointer", touchAction: "manipulation" }}>
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ===== ④ モバイルドラッグ&ドロップ（長押し振動対応）=====
function useTouchDnD(entries, setEntries) {
  const draggingIdx = useRef(null);
  const longPressTimer = useRef(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  function onTouchStart(idx) {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50); // 振動フィードバック
      draggingIdx.current = idx;
      setActiveDrag(idx);
    }, 400); // 400ms長押し
  }

  function onTouchEnd() {
    clearTimeout(longPressTimer.current);
    if (draggingIdx.current !== null && overIdx !== null && draggingIdx.current !== overIdx) {
      const next = [...entries];
      const [moved] = next.splice(draggingIdx.current, 1);
      next.splice(overIdx, 0, moved);
      setEntries(next);
    }
    draggingIdx.current = null;
    setActiveDrag(null);
    setOverIdx(null);
  }

  function onTouchMove(e, itemRefs) {
    if (draggingIdx.current === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    for (let i = 0; i < itemRefs.length; i++) {
      const el = itemRefs[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setOverIdx(i);
        break;
      }
    }
  }

  return { activeDrag, overIdx, onTouchStart, onTouchEnd, onTouchMove };
}

// ===== カテゴリ詳細ビュー =====
function CategoryView({ category, data, accentColor, onUpdate, onBack }) {
  // ⑨ おすすめ度でソートされた状態で管理
  const [entries, setEntries] = useState(() => sortEntriesByRec(data.entries || []));
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [sortMode, setSortMode] = useState("rank"); // "rank" | "date" ⑩
  const itemRefs = useRef([]);
  const { activeDrag, overIdx, onTouchStart, onTouchEnd, onTouchMove } = useTouchDnD(entries, setEntries);

  useEffect(() => { onUpdate({ ...data, entries }); }, [entries]);

  // ⑨ エントリー保存時：おすすめ度変更なら自動ソート
  function saveEntry(entry) {
    let next;
    if (editingEntry) {
      next = entries.map(e => e.id === entry.id ? entry : e);
    } else {
      next = [...entries, entry];
    }
    // おすすめ度でソート
    next = sortEntriesByRec(next);
    setEntries(next);
    setShowForm(false);
    setEditingEntry(null);
  }

  function deleteEntry(id) {
    if (confirm("削除しますか？")) {
      setEntries(entries.filter(e => e.id !== id));
      setExpandedId(null);
    }
  }

  // デスクトップD&D
  function handleDragStart(idx) { setDragging(idx); }
  function handleDragOver(e, idx) { e.preventDefault(); setDragOver(idx); }
  function handleDrop(idx) {
    if (dragging === null || dragging === idx) return;
    const next = [...entries];
    const [moved] = next.splice(dragging, 1);
    next.splice(idx, 0, moved);
    setEntries(next);
    setDragging(null); setDragOver(null);
  }

  // ⑩ 表示用エントリー（ソートモード）
  const displayEntries = sortMode === "date"
    ? [...entries].sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""))
    : entries;

  const emoji = getTagEmoji(category.name);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#E8DDD0", fontSize: 15, cursor: "pointer", padding: "8px 14px", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, touchAction: "manipulation" }}><span>←</span> 戻る</button>
        <div style={{ fontSize: 22, fontWeight: "bold" }}>{emoji} 人生{category.name}</div>
        <div style={{ fontSize: 12, color: "#9A8A7A", marginTop: 3 }}>{entries.length}件記録済み</div>
      </div>

      <div style={{ padding: "14px 16px", maxWidth: 600, margin: "0 auto", boxSizing: "border-box", width: "100%" }}>
        {/* ⑩ ソート切替 */}
        {entries.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["rank","順位順"],["date","訪問日順"]].map(([mode, label]) => (
              <button key={mode} onClick={() => setSortMode(mode)} style={{
                flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                background: sortMode === mode ? C.ink : C.white,
                color: sortMode === mode ? C.white : "#888",
                border: `1.5px solid ${sortMode === mode ? C.ink : C.border}`,
                fontWeight: sortMode === mode ? "bold" : "normal",
              }}>{label}</button>
            ))}
          </div>
        )}

        {!showForm && !editingEntry && (
          <button onClick={() => setShowForm(true)} style={{
            width: "100%", background: C.terra, color: C.white, border: "none",
            borderRadius: 12, padding: "15px", fontSize: 16, fontWeight: "bold",
            cursor: "pointer", marginBottom: 16, touchAction: "manipulation",
          }}>
            ＋ 新しい{category.name}を追加
          </button>
        )}

        {showForm && (
          <div style={{ marginBottom: 16, width: "100%", boxSizing: "border-box" }}>
            <EntryForm onSave={saveEntry} onCancel={() => setShowForm(false)} categoryName={category.name} />
          </div>
        )}

        {entries.length === 0 && !showForm && (
          <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 15 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{emoji}</div>
            <div style={{ fontWeight: "bold", color: "#666" }}>まだ記録がありません</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>最初の{category.name}を追加しよう！</div>
          </div>
        )}

        {/* ④ モバイル対応D&Dリスト */}
        <div
          onTouchMove={e => onTouchMove(e, itemRefs.current)}
          onTouchEnd={onTouchEnd}
        >
          {displayEntries.map((entry, idx) => {
            const isExpanded = expandedId === entry.id;
            const isEditing = editingEntry?.id === entry.id;
            const isTouchDragging = activeDrag === idx;
            const isTouchOver = overIdx === idx && activeDrag !== null;

            if (isEditing) return (
              <div key={entry.id} style={{ marginBottom: 12, width: "100%", boxSizing: "border-box" }}>
                <EntryForm initial={entry} onSave={saveEntry} onCancel={() => setEditingEntry(null)} categoryName={category.name} />
              </div>
            );

            return (
              <div key={entry.id} ref={el => itemRefs.current[idx] = el}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragging(null); setDragOver(null); }}
                onTouchStart={() => onTouchStart(idx)}
                onContextMenu={e => e.preventDefault()}
                style={{
                  background: C.white, borderRadius: 16, marginBottom: 12,
                  WebkitUserSelect: "none", userSelect: "none",
                  WebkitTouchCallout: "none",
                  border: (dragOver === idx || isTouchOver) ? `2px solid ${C.terra}` : `1px solid ${C.border}`,
                  opacity: (dragging === idx || isTouchDragging) ? 0.5 : 1,
                  transform: isTouchDragging ? "scale(1.02)" : "scale(1)",
                  transition: "transform 0.15s, opacity 0.15s",
                  boxShadow: isTouchDragging ? "0 8px 24px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <div style={{ padding: "16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {/* ⑦ 大きく目立つランクバッジ */}
                  <RankBadge rank={idx + 1} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "bold", fontSize: 17, color: C.ink, marginBottom: 6 }}>{entry.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      <RecBadge value={entry.rec} large />
                      {entry.prefecture && (
                        <span style={{ fontSize: 12, color: "#888", background: "#F5F5F5", padding: "3px 10px", borderRadius: 10 }}>{entry.prefecture}</span>
                      )}
                    </div>
                    {entry.visitDate && (
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>📅 {entry.visitDate}</div>
                    )}
                    {entry.photo && (
                      <div style={{ marginBottom: 10, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <img src={entry.photo} alt="写真" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                      </div>
                    )}
                    {entry.comment && (
                      <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 10, background: "#FAFAF9", borderRadius: 8, padding: "8px 10px", borderLeft: `3px solid ${C.terra}` }}>
                        「{entry.comment}」
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <a href={entry.placeData?.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(entry.name + " " + (entry.prefecture || ""))}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: "#4A90D9", background: "#F0F6FF", border: "1px solid #C5DCF5", borderRadius: 8, padding: "5px 12px", textDecoration: "none", touchAction: "manipulation" }}>
                        🗺 地図
                      </a>
                      <button onClick={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                        style={{ fontSize: 13, color: C.muted, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                        {isExpanded ? "閉じる ▲" : "編集・削除 ▼"}
                      </button>
                    </div>
                  </div>

                  <div style={{ color: "#CCC", fontSize: 20, flexShrink: 0, alignSelf: "center", userSelect: "none" }}>⠿</div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid #F0E8E0`, padding: "12px 16px 16px", display: "flex", gap: 10 }}>
                    <button onClick={() => { setEditingEntry(entry); setExpandedId(null); }}
                      style={{ flex: 1, fontSize: 14, color: "#555", background: "#F5F5F5", border: "none", borderRadius: 10, padding: "11px", cursor: "pointer", fontFamily: "inherit", fontWeight: "bold", touchAction: "manipulation" }}>
                      ✏️ 編集
                    </button>
                    <button onClick={() => deleteEntry(entry.id)}
                      style={{ flex: 1, fontSize: 14, color: "#E57373", background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 10, padding: "11px", cursor: "pointer", fontFamily: "inherit", fontWeight: "bold", touchAction: "manipulation" }}>
                      🗑 削除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {entries.length > 0 && sortMode === "rank" && (
          <div style={{ marginTop: 4, padding: "12px 0" }}>
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>⠿ 長押し（モバイル）またはドラッグで順位を変更できます</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ブラウズビュー =====
function BrowseView({ onSelect, onBack }) {
  const [query, setQuery] = useState("");
  const groups = [...new Set(TAG_DICTIONARY.map(t => t.group))];
  const filtered = query.trim()
    ? TAG_DICTIONARY.filter(t => [t.tag, ...t.aliases].some(a => a.toLowerCase().includes(query.toLowerCase())))
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#E8DDD0", fontSize: 15, cursor: "pointer", padding: "8px 14px", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, touchAction: "manipulation" }}><span>←</span> 戻る</button>
        <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>カテゴリを選ぶ</div>
        <div style={{ position: "relative" }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="カテゴリを検索..."
            style={{ width: "100%", padding: "11px 36px 11px 14px", borderRadius: 10, border: "none", fontSize: 16, fontFamily: "inherit", background: "rgba(255,255,255,0.12)", color: C.white, outline: "none", boxSizing: "border-box", touchAction: "manipulation" }} />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.5)", pointerEvents: "none" }}>🔍</span>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
        {filtered ? (
          filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14 }}>「{query}」に一致するカテゴリがありません</div>
              <button onClick={() => onSelect(query)}
                style={{ marginTop: 16, background: C.terra, color: C.white, border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                ＋「{query}」を新しく追加
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 10 }}>{filtered.length}件見つかりました</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {filtered.map(t => (
                  <button key={t.tag} onClick={() => onSelect(t.tag)}
                    style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "9px 16px", fontSize: 14, cursor: "pointer", color: "#333", fontFamily: "inherit", touchAction: "manipulation" }}>
                    {GROUP_EMOJIS[t.group]} {t.tag}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          groups.map(group => (
            <div key={group} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#888", marginBottom: 10, letterSpacing: 0.5 }}>{group}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TAG_DICTIONARY.filter(t => t.group === group).map(t => (
                  <button key={t.tag} onClick={() => onSelect(t.tag)}
                    style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "9px 16px", fontSize: 14, cursor: "pointer", color: "#333", fontFamily: "inherit", touchAction: "manipulation" }}>
                    {GROUP_EMOJIS[group]} {t.tag}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ===== マップビュー =====
function MapView({ categories, onBack }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [activeFilter, setActiveFilter] = useState("すべて");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const allEntries = categories.flatMap(cat =>
    (cat.entries || [])
      .filter(e => e.placeData?.lat && e.placeData?.lng)
      .map((e, idx) => ({ ...e, categoryName: cat.name, rank: idx + 1, accentColor: getAccentColor(categories.indexOf(cat)) }))
  );
  const filteredEntries = activeFilter === "すべて" ? allEntries : allEntries.filter(e => e.categoryName === activeFilter);

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 5, center: { lat: 36.5, lng: 137.0 },
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
      });
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    filteredEntries.forEach(entry => {
      const marker = new window.google.maps.Marker({
        position: { lat: entry.placeData.lat, lng: entry.placeData.lng },
        map: mapInstanceRef.current, title: entry.name,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: entry.accentColor, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      marker.addListener("click", () => {
        setSelectedPlace(entry);
        mapInstanceRef.current.panTo({ lat: entry.placeData.lat, lng: entry.placeData.lng });
      });
      markersRef.current.push(marker);
    });
    if (filteredEntries.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredEntries.forEach(e => bounds.extend({ lat: e.placeData.lat, lng: e.placeData.lng }));
      mapInstanceRef.current.fitBounds(bounds, { padding: 60 });
    } else if (filteredEntries.length === 1) {
      mapInstanceRef.current.setCenter({ lat: filteredEntries[0].placeData.lat, lng: filteredEntries[0].placeData.lng });
      mapInstanceRef.current.setZoom(14);
    }
  }, [mapReady, filteredEntries.length, activeFilter]);

  return (
    <div style={{ height: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.ink, color: C.white, padding: "16px 16px 12px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#E8DDD0", fontSize: 15, cursor: "pointer", padding: "8px 14px", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, touchAction: "manipulation" }}><span>←</span> 戻る</button>
        <div style={{ fontSize: 20, fontWeight: "bold" }}>マイマップ</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
          {["すべて", ...categories.map(c => c.name)].map(name => (
            <button key={name} onClick={() => { setActiveFilter(name); setSelectedPlace(null); }}
              style={{ background: activeFilter === name ? C.terra : "rgba(255,255,255,0.1)", border: `0.5px solid ${activeFilter === name ? C.terra : "rgba(255,255,255,0.2)"}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, color: C.white, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
              {name === "すべて" ? "すべて" : `${getTagEmoji(name)} ${name}`}
            </button>
          ))}
        </div>
      </div>
      <div ref={mapRef} style={{ height: 320, flexShrink: 0, background: "#E8F0E4" }} />
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", marginTop: -20, flex: 1, padding: "14px 14px 90px", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: "#E0E0E0", borderRadius: 2, margin: "0 auto 16px" }} />
        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
            <div>座標付きの記録がありません</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(selectedPlace ? [selectedPlace, ...filteredEntries.filter(e => e.id !== selectedPlace.id)] : filteredEntries).map(entry => (
              <div key={entry.id}
                onClick={() => { setSelectedPlace(entry); if (mapInstanceRef.current) mapInstanceRef.current.panTo({ lat: entry.placeData.lat, lng: entry.placeData.lng }); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: selectedPlace?.id === entry.id ? "#FFF8F5" : "#FAFAF9", border: `0.5px solid ${selectedPlace?.id === entry.id ? C.terra : C.border}`, cursor: "pointer" }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{getTagEmoji(entry.categoryName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: C.ink }}>{entry.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>人生{entry.categoryName}</div>
                </div>
                <RankBadge rank={entry.rank} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ⑥ アカウント登録（モック：実装時はFirebase/Supabase Authに置き換え）
// ===== 趣味タグ定義（大カテゴリと連動）=====
const HOBBY_TAGS = [
  { id: "food",       label: "グルメ",       emoji: "🍜" },
  { id: "washoku",    label: "和食",         emoji: "🍱" },
  { id: "sweets",     label: "スイーツ",     emoji: "🍰" },
  { id: "cafe",       label: "カフェ・お酒", emoji: "☕" },
  { id: "scenery",    label: "絶景・景色",   emoji: "🌅" },
  { id: "nature",     label: "自然・アウトドア", emoji: "🌿" },
  { id: "activity",   label: "アクティビティ", emoji: "🎿" },
  { id: "culture",    label: "文化・歴史",   emoji: "🎭" },
  { id: "healing",    label: "温泉・癒し",   emoji: "♨️" },
  { id: "hotel",      label: "宿泊・旅館",   emoji: "🏨" },
  { id: "sports",     label: "スポーツ観戦", emoji: "🏟️" },
  { id: "entertain",  label: "エンタメ",     emoji: "🎵" },
  { id: "shopping",   label: "買い物・市場", emoji: "🛍️" },
  { id: "animal",     label: "動物・生き物", emoji: "🐾" },
  { id: "travel",     label: "乗り物・旅",   emoji: "🚂" },
  { id: "facility",   label: "テーマパーク・施設", emoji: "🎡" },
];

// ===== LJアイコンSVG =====
function LJIcon({ size = 48, darkBg = true }) {
  const gold = "#C8941A";
  const brown = darkBg ? "#E8DDD0" : "#6B5344";
  const green = "#7A9E7E";
  const white = darkBg ? "#FFFFFF" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 円弧 */}
      <path d="M12 40 A28 28 0 1 1 40 12" stroke={gold} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* ゴールドドット */}
      <circle cx="40" cy="10" r="3" fill={gold}/>
      {/* L文字 */}
      <text x="10" y="52" fontFamily="Georgia, serif" fontSize="34" fontWeight="bold" fill={brown} letterSpacing="-1">L</text>
      {/* J文字 */}
      <text x="36" y="52" fontFamily="Georgia, serif" fontSize="34" fontWeight="bold" fill={brown} letterSpacing="-1">j</text>
      {/* 本のページ線 */}
      <path d="M8 58 Q40 53 72 58" stroke={brown} strokeWidth="1.2" fill="none" opacity="0.7"/>
      <path d="M10 61 Q40 56 70 61" stroke={brown} strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M12 64 Q40 59 68 64" stroke={brown} strokeWidth="0.8" fill="none" opacity="0.3"/>
      {/* 植物の葉 */}
      <path d="M58 28 Q65 18 60 12" stroke={green} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M60 22 Q68 20 65 14" stroke={green} strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M59 26 Q67 26 66 19" stroke={green} strokeWidth="1" fill="none" strokeLinecap="round"/>
      <ellipse cx="63" cy="19" rx="4" ry="2.5" fill={green} opacity="0.7" transform="rotate(-30 63 19)"/>
      <ellipse cx="61" cy="24" rx="4" ry="2.5" fill={green} opacity="0.6" transform="rotate(-10 61 24)"/>
      <ellipse cx="64" cy="15" rx="3.5" ry="2" fill={green} opacity="0.8" transform="rotate(-50 64 15)"/>
    </svg>
  );
}

// ===== 横長ロゴ（ヘッダー用）=====
function LogoBanner({ darkBg = true }) {
  const textColor = darkBg ? "#E8DDD0" : "#6B5344";
  const subColor = darkBg ? "#9A8A7A" : "#9A8A7A";
  const goldColor = "#C8941A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LJIcon size={44} darkBg={darkBg} />
      <div>
        <div style={{ fontSize: 20, fontWeight: "bold", color: textColor, letterSpacing: 2, lineHeight: 1.1, fontFamily: "Georgia, 'Hiragino Mincho ProN', serif" }}>
          人生ノート
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div style={{ width: 16, height: 1, background: goldColor }} />
          <div style={{ fontSize: 9, color: goldColor, letterSpacing: 2, fontFamily: "Georgia, serif" }}>Life Journal</div>
          <div style={{ width: 16, height: 1, background: goldColor }} />
        </div>
      </div>
    </div>
  );
}

// ===== ロゴヘッダー（認証画面用・縦型）=====
function LogoHeader({ subtitle = "人生で最高だったものを記録しよう" }) {
  return (
    <div style={{ background: C.ink, padding: "48px 24px 32px", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <LJIcon size={72} darkBg={true} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "#E8DDD0", letterSpacing: 3, lineHeight: 1, fontFamily: "Georgia, 'Hiragino Mincho ProN', serif" }}>人生ノート</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 5 }}>
            <div style={{ width: 20, height: 1, background: "#C8941A" }} />
            <div style={{ fontSize: 10, color: "#C8941A", letterSpacing: 3, fontFamily: "Georgia, serif" }}>Life Journal</div>
            <div style={{ width: 20, height: 1, background: "#C8941A" }} />
          </div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#9A8A7A", marginTop: 4 }}>{subtitle}</div>
    </div>
  );
}

// ===== メール確認待ち画面 =====
function EmailVerifyScreen({ email, onBack }) {
  const [resent, setResent] = useState(false);
  function handleResend() {
    // 実装時: supabase.auth.resend({ type: 'signup', email })
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
      <LogoHeader subtitle="メールアドレスを確認してください" />
      <div style={{ flex: 1, padding: "40px 24px", maxWidth: 400, margin: "0 auto", width: "100%", boxSizing: "border-box", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📬</div>
        <div style={{ fontSize: 18, fontWeight: "bold", color: C.ink, marginBottom: 12 }}>確認メールを送信しました</div>
        <div style={{ fontSize: 14, color: "#666", lineHeight: 1.8, marginBottom: 8 }}>
          <span style={{ fontWeight: "bold", color: C.terra }}>{email}</span> に<br />
          確認メールを送りました。
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 32 }}>
          メール内のリンクをクリックすると<br />登録が完了します。<br />
          iCloudメールの場合は迷惑メールフォルダも<br />ご確認ください。
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 12, fontWeight: "bold", color: "#888", marginBottom: 10, letterSpacing: 0.5 }}>届かない場合</div>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>
            ① 迷惑メールフォルダを確認<br />
            ② 数分待ってから再送信<br />
            ③ 別のメールアドレスで再登録
          </div>
        </div>

        <button onClick={handleResend} style={{
          width: "100%", background: resent ? "#E8F5E9" : C.white,
          color: resent ? "#388E3C" : C.ink,
          border: `1.5px solid ${resent ? "#A5D6A7" : C.border}`,
          borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: "bold",
          cursor: "pointer", fontFamily: "inherit", marginBottom: 12, touchAction: "manipulation",
        }}>
          {resent ? "✓ 再送信しました" : "📨 確認メールを再送信"}
        </button>

        <button onClick={onBack} style={{
          width: "100%", background: "none", border: "none",
          color: C.muted, fontSize: 14, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation",
        }}>
          ← メールアドレスを変更する
        </button>
      </div>
    </div>
  );
}

// ===== プロフィール設定画面 =====
function ProfileSetupScreen({ initialName = "", initialEmail = "", onComplete }) {
  const [name, setName] = useState(initialName);
  const [birthdate, setBirthdate] = useState("");
  const [hobbies, setHobbies] = useState([]);
  const [error, setError] = useState("");

  function toggleHobby(id) {
    setHobbies(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  }

  // 生年月日のバリデーション
  function validateBirthdate(val) {
    if (!val) return true; // 任意
    const d = new Date(val);
    const now = new Date();
    const age = now.getFullYear() - d.getFullYear();
    return age >= 0 && age <= 120;
  }

  function handleSubmit() {
    if (!name.trim()) { setError("お名前を入力してください"); return; }
    if (birthdate && !validateBirthdate(birthdate)) { setError("正しい生年月日を入力してください"); return; }
    const profile = { name: name.trim(), birthdate, hobbies, email: initialEmail };
    onComplete(profile);
  }

  // 年齢計算（表示用）
  const age = birthdate ? new Date().getFullYear() - new Date(birthdate).getFullYear() : null;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.ink, padding: "28px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24 }}>📖</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.white, letterSpacing: 2 }}>人生ノート</div>
            <div style={{ fontSize: 10, color: C.terra, letterSpacing: 3 }}>JINSEI NOTE</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 18, fontWeight: "bold", color: C.white }}>プロフィールを設定</div>
          <div style={{ fontSize: 12, color: "#9A8A7A", marginTop: 4 }}>あとから変更できます</div>
        </div>
        {/* ステップインジケーター */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
          <div style={{ width: 28, height: 4, borderRadius: 2, background: "#9A8A7A" }} />
          <div style={{ width: 28, height: 4, borderRadius: 2, background: C.terra }} />
        </div>
        <div style={{ fontSize: 11, color: "#9A8A7A", marginTop: 4 }}>ステップ 2 / 2</div>
      </div>

      <div style={{ flex: 1, padding: "24px 20px 40px", maxWidth: 480, margin: "0 auto", width: "100%", boxSizing: "border-box", overflowY: "auto" }}>

        {/* 名前 */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>お名前 <span style={{ color: C.terra }}>*</span></label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="山田 太郎" style={inputStyle}
            autoComplete="name" />
        </div>

        {/* 生年月日 - オーバーレイ方式（iOS幅問題対策）*/}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            生年月日
            <span style={{ fontSize: 10, color: C.muted, fontWeight: "normal", marginLeft: 8 }}>任意</span>
          </label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min="1900-01-01"
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%", height: "100%",
                opacity: 0,
                zIndex: 2,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            />
            <div style={{
              width: "100%",
              padding: "12px 14px",
              border: `1.5px solid ${birthdate ? C.terra : C.border}`,
              borderRadius: 10,
              fontSize: 16,
              boxSizing: "border-box",
              background: birthdate ? "#FFF8F5" : C.white,
              color: birthdate ? C.ink : C.muted,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minHeight: 48,
              pointerEvents: "none",
            }}>
              <span>🎂</span>
              <span>
                {birthdate
                  ? new Date(birthdate + "T00:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
                  : "生年月日を選択"}
              </span>
            </div>
          </div>
          {age !== null && age >= 0 && age <= 120 && (
            <div style={{ fontSize: 12, color: C.terra, marginTop: 6, fontWeight: "bold" }}>
              {age}歳
            </div>
          )}
        </div>

        {/* 趣味タグ */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            好きなジャンル
            <span style={{ fontSize: 10, color: C.muted, fontWeight: "normal", marginLeft: 8 }}>任意・複数選択OK</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {HOBBY_TAGS.map(h => {
              const selected = hobbies.includes(h.id);
              return (
                <button key={h.id} onClick={() => toggleHobby(h.id)}
                  style={{
                    padding: "8px 14px", borderRadius: 20, fontSize: 13,
                    fontFamily: "inherit", cursor: "pointer", touchAction: "manipulation",
                    display: "flex", alignItems: "center", gap: 6,
                    background: selected ? C.terra : C.white,
                    color: selected ? C.white : "#555",
                    border: `1.5px solid ${selected ? C.terra : C.border}`,
                    fontWeight: selected ? "bold" : "normal",
                    transition: "all 0.15s",
                  }}>
                  <span>{h.emoji}</span>
                  <span>{h.label}</span>
                  {selected && <span style={{ fontSize: 11 }}>✓</span>}
                </button>
              );
            })}
          </div>
          {hobbies.length > 0 && (
            <div style={{ fontSize: 12, color: C.terra, marginTop: 10, fontWeight: "bold" }}>
              {hobbies.length}個選択中
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: "#E57373", fontSize: 13, marginBottom: 14, background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 8, padding: "10px 14px" }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} style={{
          width: "100%", background: C.ink, color: C.white, border: "none",
          borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: "bold",
          cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation",
        }}>
          人生ノートをはじめる 🎉
        </button>

        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
          プロフィール情報は本人確認・<br />フレンド機能のみに使用します
        </div>
      </div>
    </div>
  );
}

// ===== 認証画面 =====
function AuthScreen({ onLogin, onPendingAuth }) {
  // "login" | "register" | "verify" | "profile_setup"
  const [step, setStep] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingProvider, setPendingProvider] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (!email.trim()) { setError("メールアドレスを入力してください"); setLoading(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("正しいメールアドレスを入力してください"); setLoading(false); return; }
    if (!password) { setError("パスワードを入力してください"); setLoading(false); return; }

    if (step === "register") {
      if (password.length < 8) { setError("パスワードは8文字以上にしてください"); setLoading(false); return; }
      if (password !== confirmPassword) { setError("パスワードが一致しません"); setLoading(false); return; }
      const { error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (signUpError) { setError(signUpError.message); return; }
      setPendingEmail(email);
      setStep("verify");
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) { setError("メールアドレスまたはパスワードが正しくありません"); return; }
      // プロフィール取得
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      if (!profile?.name) {
        setPendingEmail(email);
        setStep("profile_setup");
      } else {
        onLogin({ id: data.user.id, email: data.user.email, ...profile });
      }
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    // リダイレクト方式（最もシンプルで確実）
    // リダイレクト後は /auth/callback → onAuthStateChange の INITIAL_SESSION で処理
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (oauthError) { setError(oauthError.message); setLoading(false); }
    // ページ遷移するのでここ以降は実行されない
  }

  function handleApple() {
    alert("「Appleでサインイン」は近日対応予定です。\n\nApple Developer Program への登録後に有効になります。");
  }

  async function handleProfileComplete(profile) {
    // Supabaseのprofilesテーブルに保存
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await supabase.from("profiles").upsert({
        id: currentUser.id,
        name: profile.name,
        birthdate: profile.birthdate || null,
        hobbies: profile.hobbies || [],
      });
      onLogin({ id: currentUser.id, email: currentUser.email, ...profile });
    }
  }

  // メール確認待ち画面
  if (step === "verify") {
    return <EmailVerifyScreen email={pendingEmail} onBack={() => setStep("register")} />;
  }

  // プロフィール設定画面
  if (step === "profile_setup") {
    return (
      <ProfileSetupScreen
        initialName=""
        initialEmail={pendingEmail}
        onComplete={handleProfileComplete}
      />
    );
  }

  const isLogin = step === "login";

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
      <LogoHeader />

      <div style={{ flex: 1, padding: "28px 24px 40px", maxWidth: 420, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* タブ */}
        <div style={{ display: "flex", background: "#EDE8E3", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[["login","ログイン"],["register","新規登録"]].map(([s, label]) => (
            <button key={s} onClick={() => { setStep(s); setError(""); setConfirmPassword(""); }}
              style={{ flex: 1, padding: "11px", borderRadius: 9, fontSize: 14, fontFamily: "inherit", cursor: "pointer", fontWeight: step === s ? "bold" : "normal", background: step === s ? C.white : "transparent", color: step === s ? C.ink : C.muted, border: "none", touchAction: "manipulation" }}>
              {label}
            </button>
          ))}
        </div>

        {/* メール */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>メールアドレス</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" style={inputStyle}
            autoComplete="email" inputMode="email" />
        </div>

        {/* パスワード */}
        <div style={{ marginBottom: step === "register" ? 14 : 8, position: "relative" }}>
          <label style={labelStyle}>パスワード{!isLogin && <span style={{ fontSize: 10, color: C.muted, fontWeight: "normal", marginLeft: 6 }}>8文字以上</span>}</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isLogin ? "パスワード" : "8文字以上"} style={{ ...inputStyle, paddingRight: 44 }}
              autoComplete={isLogin ? "current-password" : "new-password"} />
            <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* パスワード確認（新規登録のみ）*/}
        {!isLogin && (
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>パスワード（確認）</label>
            <input type={showPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力" style={{
                ...inputStyle,
                border: `1.5px solid ${confirmPassword && confirmPassword !== password ? "#E57373" : C.border}`,
              }}
              autoComplete="new-password" />
            {confirmPassword && confirmPassword !== password && (
              <div style={{ fontSize: 12, color: "#E57373", marginTop: 4 }}>パスワードが一致しません</div>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: "#E57373", fontSize: 13, marginBottom: 12, background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 8, padding: "10px 14px" }}>
            ⚠️ {error}
          </div>
        )}

        {isLogin && (
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <button style={{ background: "none", border: "none", color: C.terra, fontSize: 13, cursor: "pointer", padding: 0, touchAction: "manipulation" }}>
              パスワードを忘れた方
            </button>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", background: loading ? "#888" : C.ink, color: C.white, border: "none",
          borderRadius: 12, padding: "15px", fontSize: 16, fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer", marginTop: isLogin ? 0 : 8, touchAction: "manipulation",
        }}>
          {loading ? "処理中..." : isLogin ? "ログイン" : "アカウントを作成 →"}
        </button>

        {/* 区切り */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted }}>またはSNSで続ける</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Googleログイン */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: "100%", background: C.white, color: C.ink, border: `1.5px solid ${C.border}`,
          borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontFamily: "inherit", marginBottom: 10, touchAction: "manipulation",
          opacity: loading ? 0.6 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Googleで続ける
        </button>

        {/* Appleログイン（準備済み・近日対応）*/}
        <button onClick={handleApple} style={{
          width: "100%", background: C.ink, color: C.white, border: "none",
          borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: "bold", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontFamily: "inherit", opacity: 0.6, touchAction: "manipulation",
        }}>
          <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.769 10.625c-.022-2.3 1.878-3.412 1.963-3.468-1.07-1.565-2.733-1.778-3.322-1.8-1.408-.143-2.762.833-3.477.833-.727 0-1.841-.816-3.03-.793-1.549.023-2.984.9-3.782 2.278C.345 10.204 1.472 14.51 3.16 16.85c.84 1.194 1.832 2.53 3.133 2.483 1.263-.05 1.737-.806 3.263-.806 1.511 0 1.948.806 3.264.783 1.355-.022 2.21-1.213 3.04-2.414.963-1.378 1.355-2.724 1.373-2.794-.03-.013-2.627-1.006-2.664-3.977zM11.45 3.535C12.11 2.727 12.56 1.617 12.43.5c-.942.038-2.1.625-2.783 1.415-.604.695-1.142 1.83-1.002 2.904 1.058.081 2.137-.534 2.805-1.284z" fill="white"/>
          </svg>
          Appleで続ける
          <span style={{ fontSize: 10, background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "2px 6px" }}>近日対応</span>
        </button>

        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 20, lineHeight: 1.8 }}>
          ※ 現在はプロトタイプです。<br />データはブラウザに保存されます。
        </div>
      </div>
    </div>
  );
}

// ===== ⑤ 下部ナビゲーションバー =====
const NAV_ITEMS = [
  { id: "list",        label: "リスト",     icon: "📋" },
  { id: "map",         label: "地図",       icon: "🗺" },
  { id: "add",         label: "追加",       icon: "＋",  primary: true },
  { id: "friends",     label: "フレンド",   icon: "👥" },
  { id: "friendsmap",  label: "フレンド地図", icon: "🌐" },
];

function BottomNav({ activeTab, onTabChange }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: C.white, borderTop: `1px solid ${C.border}`,
      display: "flex", alignItems: "center",
      paddingBottom: "env(safe-area-inset-bottom, 8px)", // ノッチ対応
    }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => onTabChange(item.id)} style={{
          flex: 1, padding: "8px 0 6px", border: "none", background: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          touchAction: "manipulation",
        }}>
          {item.primary ? (
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: C.terra, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: C.white, marginTop: -20,
              boxShadow: "0 4px 12px rgba(192,120,74,0.4)",
            }}>＋</div>
          ) : (
            <span style={{ fontSize: 22 }}>{item.icon}</span>
          )}
          <span style={{
            fontSize: 10, fontWeight: activeTab === item.id ? "bold" : "normal",
            color: activeTab === item.id ? C.terra : C.muted,
          }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ===== フレンドリスト（スタブ） =====
function FriendsView() {
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "28px 20px 20px" }}>
        {/* ⑧ ロゴ */}
        <LogoBanner darkBg={true} />
        <div style={{ fontSize: 20, fontWeight: "bold", marginTop: 12 }}>👥 フレンド</div>
      </div>
      <div style={{ padding: "60px 24px", textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#666", marginBottom: 8 }}>フレンド機能は近日公開</div>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>友達の人生ランキングを<br />旅先でチェックできるようになります</div>
      </div>
    </div>
  );
}

function FriendMapView() {
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "28px 20px 20px" }}>
        <LogoBanner darkBg={true} />
        <div style={{ fontSize: 20, fontWeight: "bold", marginTop: 12 }}>🌐 フレンド地図</div>
      </div>
      <div style={{ padding: "60px 24px", textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌐</div>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#666", marginBottom: 8 }}>フレンド地図は近日公開</div>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>旅先で友達の記録が地図に現れ<br />「え、私もここ行ったよ！」が生まれます</div>
      </div>
    </div>
  );
}

// ===== プロフィール編集画面 =====
function ProfileEditScreen({ user, onSave, onClose }) {
  const [name, setName] = useState(user.name || "");
  const [birthdate, setBirthdate] = useState(user.birthdate || "");
  const [hobbies, setHobbies] = useState(user.hobbies || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleHobby(id) {
    setHobbies(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  }

  const age = birthdate ? new Date().getFullYear() - new Date(birthdate).getFullYear() : null;

  async function handleSave() {
    if (!name.trim()) { setError("お名前を入力してください"); return; }
    setSaving(true);
    const { error: dbError } = await supabase.from("profiles").upsert({
      id: user.id,
      name: name.trim(),
      birthdate: birthdate || null,
      hobbies: hobbies,
    });
    setSaving(false);
    if (dbError) { setError("保存に失敗しました"); return; }
    onSave({ ...user, name: name.trim(), birthdate, hobbies });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", paddingBottom: 40 }}>
      <div style={{ background: C.ink, padding: "20px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LogoBanner darkBg={true} />
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#E8DDD0", fontSize: 15, cursor: "pointer", padding: "8px 14px", borderRadius: 20, touchAction: "manipulation" }}>✕ 閉じる</button>
        </div>
        <div style={{ fontSize: 18, fontWeight: "bold", color: C.white, marginTop: 16 }}>プロフィール編集</div>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 480, margin: "0 auto", boxSizing: "border-box", width: "100%" }}>
        {/* アバター */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.terra, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: C.white, marginBottom: 8 }}>
            {name.charAt(0) || "?"}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{user.email}</div>
        </div>

        {/* 名前 */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>お名前 <span style={{ color: C.terra }}>*</span></label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="山田 太郎" style={inputStyle} autoComplete="name" />
        </div>

        {/* 生年月日 */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>生年月日<span style={{ fontSize: 10, color: C.muted, fontWeight: "normal", marginLeft: 8 }}>任意</span></label>
          <div style={{ position: "relative", width: "100%" }}>
            <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
              max={new Date().toISOString().split("T")[0]} min="1900-01-01"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, zIndex: 2, cursor: "pointer", boxSizing: "border-box" }} />
            <div style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${birthdate ? C.terra : C.border}`, borderRadius: 10, fontSize: 16, boxSizing: "border-box", background: birthdate ? "#FFF8F5" : C.white, color: birthdate ? C.ink : C.muted, display: "flex", alignItems: "center", gap: 8, minHeight: 48, pointerEvents: "none" }}>
              <span>🎂</span>
              <span>{birthdate ? new Date(birthdate + "T00:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }) : "生年月日を選択"}</span>
            </div>
          </div>
          {age !== null && age >= 0 && age <= 120 && (
            <div style={{ fontSize: 12, color: C.terra, marginTop: 6, fontWeight: "bold" }}>{age}歳</div>
          )}
        </div>

        {/* 趣味タグ */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>好きなジャンル<span style={{ fontSize: 10, color: C.muted, fontWeight: "normal", marginLeft: 8 }}>任意・複数選択OK</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {HOBBY_TAGS.map(h => {
              const selected = hobbies.includes(h.id);
              return (
                <button key={h.id} onClick={() => toggleHobby(h.id)}
                  style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, fontFamily: "inherit", cursor: "pointer", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 6, background: selected ? C.terra : C.white, color: selected ? C.white : "#555", border: `1.5px solid ${selected ? C.terra : C.border}`, fontWeight: selected ? "bold" : "normal" }}>
                  <span>{h.emoji}</span><span>{h.label}</span>
                  {selected && <span style={{ fontSize: 11 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ color: "#E57373", fontSize: 13, marginBottom: 14, background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 8, padding: "10px 14px" }}>⚠️ {error}</div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ width: "100%", background: saving ? "#888" : C.ink, color: C.white, border: "none", borderRadius: 12, padding: "15px", fontSize: 16, fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}

// ===== ユーザーメニュー =====
function UserMenu({ user, onEdit, onLogout, onClose }) {
  const age = user.birthdate ? new Date().getFullYear() - new Date(user.birthdate).getFullYear() : null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.white, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", zIndex: 1 }}>
        {/* プロフィールサマリー */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.terra, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.white, flexShrink: 0 }}>
            {user.name?.charAt(0) || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: "bold", color: C.ink }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{user.email}</div>
            {age && <div style={{ fontSize: 12, color: C.terra, marginTop: 2, fontWeight: "bold" }}>{age}歳</div>}
            {user.hobbies?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {user.hobbies.slice(0, 4).map(id => {
                  const h = HOBBY_TAGS.find(t => t.id === id);
                  return h ? <span key={id} style={{ fontSize: 11, background: "#FFF3E0", color: C.terra, borderRadius: 10, padding: "2px 8px" }}>{h.emoji} {h.label}</span> : null;
                })}
                {user.hobbies.length > 4 && <span style={{ fontSize: 11, color: C.muted }}>+{user.hobbies.length - 4}</span>}
              </div>
            )}
          </div>
        </div>

        {/* メニュー項目 */}
        <button onClick={onEdit} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
          <span style={{ fontSize: 20 }}>✏️</span>
          <span style={{ fontSize: 15, color: C.ink, fontWeight: "bold" }}>プロフィールを編集</span>
          <span style={{ marginLeft: "auto", color: C.muted }}>›</span>
        </button>

        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", marginTop: 4 }}>
          <span style={{ fontSize: 20 }}>🚪</span>
          <span style={{ fontSize: 15, color: "#E57373", fontWeight: "bold" }}>ログアウト</span>
        </button>
      </div>
    </div>
  );
}

// ===== メインアプリ =====
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Supabase Auth: セッション監視
  const [pendingAuthUser, setPendingAuthUser] = useState(null); // プロフィール未設定のユーザー

  useEffect(() => {
    async function handleSession(sessionUser) {
      if (!sessionUser) return;
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", sessionUser.id).single();
      if (profile?.name) {
        // プロフィール設定済み → ホームへ
        setUser({ id: sessionUser.id, email: sessionUser.email, ...profile });
        setPendingAuthUser(null);
      } else {
        // プロフィール未設定 → プロフィール設定画面へ
        setPendingAuthUser(sessionUser);
      }
    }

    // 初回セッション確認
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await handleSession(session.user);
      setAuthChecked(true);
    });

    // 認証状態の変化を監視（Googleログイン後のリダイレクト対応）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await handleSession(session.user);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setPendingAuthUser(null);
        setCategories([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (categories.length === 0 || !user) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(categories)); } catch {}
  }, [categories]);

  function handleLogin(u) { setUser(u); }
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setCategories([]);
  }

  function addCategory(name) {
    const normalized = normalizeTag(name);
    if (!normalized) return;
    if (categories.find(c => c.name === normalized)) {
      const existing = categories.find(c => c.name === normalized);
      setActiveCategory(existing);
      setShowAddModal(false); setShowBrowse(false); setNewCatInput("");
      return;
    }
    const cat = { id: Date.now(), name: normalized, entries: [] };
    setCategories(prev => [...prev, cat]);
    setNewCatInput(""); setShowAddModal(false); setShowBrowse(false);
    setActiveCategory(cat);
  }

  function updateCategory(updated) { setCategories(prev => prev.map(c => c.id === updated.id ? updated : c)); }
  function deleteCategory(id) { if (confirm("このカテゴリを削除しますか？")) setCategories(prev => prev.filter(c => c.id !== id)); }

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <div style={{ fontSize: 14, color: C.muted }}>読み込み中...</div>
      </div>
    </div>
  );

  // Googleログイン後などプロフィール未設定の場合
  if (pendingAuthUser) {
    return (
      <ProfileSetupScreen
        initialName={pendingAuthUser.user_metadata?.full_name || pendingAuthUser.user_metadata?.name || ""}
        initialEmail={pendingAuthUser.email || ""}
        onComplete={async (profile) => {
          await supabase.from("profiles").upsert({
            id: pendingAuthUser.id,
            name: profile.name,
            birthdate: profile.birthdate || null,
            hobbies: profile.hobbies || [],
          });
          setUser({ id: pendingAuthUser.id, email: pendingAuthUser.email, ...profile });
          setPendingAuthUser(null);
        }}
      />
    );
  }

  if (!user) return <AuthScreen onLogin={handleLogin} onPendingAuth={setPendingAuthUser} />;

  // プロフィール編集画面
  if (showProfileEdit) return (
    <ProfileEditScreen
      user={user}
      onSave={(updated) => { setUser(updated); setShowProfileEdit(false); }}
      onClose={() => setShowProfileEdit(false)}
    />
  );

  // サブ画面（ブラウズ・カテゴリ詳細）はナビを隠す
  if (showBrowse) return <BrowseView onSelect={name => addCategory(name)} onBack={() => setShowBrowse(false)} />;
  if (activeCategory) {
    const accentColor = getAccentColor(categories.findIndex(c => c.id === activeCategory.id));
    return (
      <CategoryView
        category={activeCategory}
        data={categories.find(c => c.id === activeCategory.id) || activeCategory}
        accentColor={accentColor}
        onUpdate={updated => { updateCategory(updated); setActiveCategory(updated); }}
        onBack={() => setActiveCategory(null)}
      />
    );
  }

  // タブ切替で地図・フレンド表示
  if (activeTab === "map") return (
    <>
      <MapView categories={categories} onBack={() => setActiveTab("list")} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
  if (activeTab === "friends") return (
    <>
      <FriendsView />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
  if (activeTab === "friendsmap") return (
    <>
      <FriendMapView />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );

  const totalEntries = categories.reduce((sum, c) => sum + (c.entries?.length || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif", paddingBottom: 80 }}>
      {/* ⑧ ヘッダー with ロゴ */}
      <div style={{ background: C.ink, padding: "28px 20px 20px", color: C.white }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <LogoBanner darkBg={true} />
            <button onClick={() => setShowUserMenu(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#9A8A7A", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 16 }}>👤</span>
              <span>{user.name?.split(" ")[0] || "メニュー"}</span>
              <span>▾</span>
            </button>
          </div>
          {totalEntries > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.11)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.terra }}>
                📝 {totalEntries}件
              </div>
              <div style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.11)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.terra }}>
                📂 {categories.length}カテゴリ
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
        {categories.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 12 }}>マイリスト</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {categories.map((cat, idx) => {
                const emoji = getTagEmoji(cat.name);
                const count = cat.entries?.length || 0;
                const top = cat.entries?.[0];
                const accent = getAccentColor(idx);
                return (
                  <div key={cat.id} onClick={() => { setActiveCategory(cat); setActiveTab("list"); }}
                    style={{ background: C.white, borderRadius: 16, overflow: "hidden", cursor: "pointer", border: `1px solid ${C.border}`, position: "relative" }}>
                    <div style={{ height: 4, background: accent }} />
                    <div style={{ padding: "12px 12px 0" }}>
                      <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
                        style={{ position: "absolute", top: 12, right: 10, background: "none", border: "none", color: "#CCC", fontSize: 14, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>✕</button>
                      <div style={{ fontSize: 30, marginBottom: 6 }}>{emoji}</div>
                      <div style={{ fontWeight: "bold", fontSize: 14, color: C.ink }}>人生{cat.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{count}件</div>
                    </div>
                    {top && (
                      <div style={{ margin: "8px 10px 12px", background: "#FFF8F5", borderRadius: 10, padding: "7px 10px" }}>
                        {/* ⑦ カード内も目立つランク表示 */}
                        <div style={{ fontSize: 10, color: C.terra, fontWeight: "bold", marginBottom: 2 }}>🥇 1位</div>
                        <div style={{ fontSize: 12, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{top.name}</div>
                        <RecBadge value={top.rec} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {categories.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📖</div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#555", marginBottom: 8 }}>人生ノートをはじめよう</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>「人生うどん」「人生夕日」など<br />自分だけのランキングを作れます</div>
          </div>
        )}
      </div>

      {/* ⑤ 追加モーダル（＋ボタン押下時） */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowAddModal(false)} />
          <div style={{ position: "relative", background: C.white, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", zIndex: 1 }}>
            <div style={{ fontWeight: "bold", fontSize: 16, color: C.ink, marginBottom: 16 }}>新しいカテゴリを追加</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button onClick={() => { setShowAddModal(false); setShowBrowse(true); }}
                style={{ flex: 1, background: C.white, color: C.ink, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                📋 一覧から選ぶ
              </button>
              <button onClick={() => { setShowAddModal(false); setTimeout(() => setShowAddModal("input"), 10); }}
                style={{ flex: 1, background: C.terra, color: C.white, border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                ✏️ 自由に入力
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal === "input" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowAddModal(false)} />
          <div style={{ position: "relative", background: C.white, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", zIndex: 1 }}>
            <div style={{ fontWeight: "bold", fontSize: 16, color: C.ink, marginBottom: 16 }}>カテゴリ名を入力</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: "#888", whiteSpace: "nowrap" }}>人生</span>
              <div style={{ flex: 1 }}>
                <CategoryInput value={newCatInput} onChange={setNewCatInput} onSelect={name => addCategory(name)} placeholder="うどん、夕日、スキー場..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={() => addCategory(newCatInput)}
                style={{ flex: 2, background: C.ink, color: C.white, border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                作成
              </button>
              <button onClick={() => { setShowAddModal(false); setNewCatInput(""); }}
                style={{ flex: 1, background: "#F0F0F0", color: "#555", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ユーザーメニュー */}
      {showUserMenu && (
        <UserMenu
          user={user}
          onEdit={() => { setShowUserMenu(false); setShowProfileEdit(true); }}
          onLogout={async () => {
            setShowUserMenu(false);
            if (confirm("ログアウトしますか？")) {
              await supabase.auth.signOut();
              setUser(null);
              setCategories([]);
            }
          }}
          onClose={() => setShowUserMenu(false)}
        />
      )}

      {/* ⑤ 下部ナビゲーション */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={tab => {
          if (tab === "add") { setShowAddModal(true); return; }
          setActiveTab(tab);
        }}
      />
    </div>
  );
}