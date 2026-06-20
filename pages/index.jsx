import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "jinsei-note-v2";

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
};

// ===== おすすめ度定義 =====
const REC_LEVELS = [
  { value: 1, label: "良い思い出になる",    short: "良い思い出",  color: "#33691E", bg: "#F1F8E9", border: "#C5E1A5" },
  { value: 2, label: "好きなら行って損なし", short: "好きなら行って", color: "#1565C0", bg: "#F3F8FF", border: "#BBDEFB" },
  { value: 3, label: "人生で必ず行くべき",   short: "人生で必ず",  color: "#E65100", bg: "#FFF3E0", border: "#FFCC80" },
];

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

// カテゴリごとのアクセントカラー
const ACCENT_COLORS = [
  "#F5A623","#5DCAA5","#7F77DD","#D85A30","#4A90D9","#E91E8C",
  "#26A69A","#8D6E63","#78909C","#66BB6A",
];

function getAccentColor(idx) {
  return ACCENT_COLORS[idx % ACCENT_COLORS.length];
}

function getTagEmoji(tagName) {
  const entry = TAG_DICTIONARY.find(e => e.tag === tagName);
  if (entry) return GROUP_EMOJIS[entry.group] || "⭐";
  return "⭐";
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

// ===== おすすめ度バッジ =====
function RecBadge({ value }) {
  const rec = REC_LEVELS.find(r => r.value === value);
  if (!rec) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: "bold", padding: "2px 8px", borderRadius: 10,
      color: rec.color, background: rec.bg, border: `1px solid ${rec.border}`,
      whiteSpace: "nowrap",
    }}>{rec.short}</span>
  );
}

// ===== カテゴリ入力（サジェスト付き） =====
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
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", maxHeight: 240, overflowY: "auto", marginTop: 4,
        }}>
          {suggestions.map(s => (
            <div key={s.tag}
              onMouseDown={() => { onSelect(s.tag); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid #F5F5F5`, display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = "#FFF8F5"}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
              <span style={{ fontSize: 18 }}>{GROUP_EMOJIS[s.group]}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: "bold", color: C.ink }}>{s.tag}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{s.group}</div>
              </div>
            </div>
          ))}
          {value && !suggestions.find(s => s.tag === value) && (
            <div
              onMouseDown={() => { onSelect(value); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", color: C.terra, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = "#FFF8F5"}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
              <span>＋</span>「{value}」を新しく追加
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Places API ローダー（一度だけロード） =====
let _mapsLoaded = false;
let _mapsLoading = false;
const _mapsCallbacks = [];
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

// ===== 場所検索インプット =====
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

  useEffect(() => {
    loadGoogleMaps(() => {
      acRef.current = new window.google.maps.places.AutocompleteService();
      psRef.current = new window.google.maps.places.PlacesService(mapDivRef.current);
    });
  }, []);

  useEffect(() => {
    function handleClick(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function search(value) {
    if (!value || value.length < 2 || !acRef.current) { setSuggestions([]); return; }
    setLoading(true);
    acRef.current.getPlacePredictions({ input: value, language: "ja" }, (predictions, status) => {
      setLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.slice(0, 6));
      } else { setSuggestions([]); }
    });
  }

  function handleChange(e) {
    const v = e.target.value;
    setQuery(v); setSelected(null); setOpen(true); onSelect(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 200);
  }

  function handleSelect(prediction) {
    setQuery(prediction.structured_formatting.main_text);
    setOpen(false); setSuggestions([]);
    psRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["name","formatted_address","geometry","address_components","url"] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;
        const prefComp = place.address_components?.find(c => c.types.includes("administrative_area_level_1"));
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
            width: "100%", padding: "10px 36px 10px 12px",
            border: `1.5px solid ${selected ? C.terra : C.border}`,
            borderRadius: 8, fontSize: 14, boxSizing: "border-box",
            outline: "none", fontFamily: "inherit",
            background: selected ? "#FFF8F5" : C.white,
          }}
        />
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: selected ? 16 : 13, color: selected ? C.terra : C.muted, pointerEvents: "none" }}>
          {loading ? "…" : selected ? "✓" : "🔍"}
        </span>
      </div>

      {open && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          {suggestions.map(s => (
            <div key={s.place_id} onMouseDown={() => handleSelect(s)}
              style={{ padding: "11px 14px", cursor: "pointer", borderBottom: `1px solid #F5F0EB`, display: "flex", alignItems: "flex-start", gap: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = "#FFF8F5"}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
              <span style={{ fontSize: 15, marginTop: 2, flexShrink: 0, color: C.terra }}>📍</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: "bold", color: C.ink }}>{s.structured_formatting.main_text}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.structured_formatting.secondary_text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ marginTop: 8, background: "#FFF8F5", border: "1px solid #F0E8E0", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📍</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: "bold", color: C.ink }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{selected.address}</div>
            {selected.googleMapsUrl && (
              <a href={selected.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#4A90D9", marginTop: 5, display: "inline-block", textDecoration: "none" }}>
                🗺 Googleマップで確認
              </a>
            )}
          </div>
          <button onMouseDown={handleClear} style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", flexShrink: 0, padding: 0 }}>✕</button>
        </div>
      )}

      {!MAPS_KEY && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#E57373" }}>⚠️ NEXT_PUBLIC_GOOGLE_MAPS_KEY が未設定です</div>
      )}
    </div>
  );
}

// ===== 画像リサイズ（base64） =====
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
  const [address, setAddress] = useState(initial?.placeData?.address || "");
  const [placeData, setPlaceData] = useState(initial?.placeData || null);
  const [rec, setRec] = useState(initial?.rec ?? 2);
  const [comment, setComment] = useState(initial?.comment || "");
  const [visitDate, setVisitDate] = useState(initial?.visitDate || "");
  const [photo, setPhoto] = useState(initial?.photo || null);
  const fileInputRef = useRef(null);

  function handlePlaceSelect(place) {
    if (place) {
      setPlaceData(place);
      setName(place.name);
      setPrefecture(place.prefecture || "");
      setAddress(place.address || "");
    } else {
      setPlaceData(null);
      setAddress("");
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setPhoto(resized);
  }

  return (
    <div style={{ background: C.white, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
      {/* 場所検索（Places API） */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>店名・場所名 *</label>
        <PlacesInput onSelect={handlePlaceSelect} initialName={initial?.name || ""} />
        {!MAPS_KEY && (
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder={`例：おすすめの${categoryName}`}
            style={{ ...inputStyle, marginTop: 8 }}
          />
        )}
        {address && (
          <div style={{ marginTop: 6, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span><span>{address}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>都道府県</label>
          <select value={prefecture} onChange={e => setPrefecture(e.target.value)} style={inputStyle}>
            <option value="">選択</option>
            {["北海道","青森","岩手","宮城","秋田","山形","福島","茨城","栃木","群馬","埼玉","千葉","東京","神奈川","新潟","富山","石川","福井","山梨","長野","岐阜","静岡","愛知","三重","滋賀","京都","大阪","兵庫","奈良","和歌山","鳥取","島根","岡山","広島","山口","徳島","香川","愛媛","高知","福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄","海外"].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>訪問日</label>
          <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>おすすめ度 *</label>
        <div style={{ display: "flex", gap: 6 }}>
          {REC_LEVELS.map(r => (
            <button key={r.value} onClick={() => setRec(r.value)} style={{
              flex: 1, borderRadius: 8, padding: "8px 4px", fontSize: 12, fontFamily: "inherit",
              cursor: "pointer", textAlign: "center", lineHeight: 1.4,
              fontWeight: rec === r.value ? "bold" : "normal",
              border: rec === r.value ? `1.5px solid ${r.color}` : `1.5px solid ${C.border}`,
              background: rec === r.value ? r.bg : C.white,
              color: rec === r.value ? r.color : "#888",
            }}>{r.short}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>一言コメント</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="ここが最高だった！" rows={2}
          style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {/* 写真アップロード */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>写真（1枚）</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        {photo ? (
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <img src={photo} alt="写真" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
            <button onClick={() => setPhoto(null)}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              変更
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%", height: 100, border: `2px dashed ${C.border}`, borderRadius: 10,
              background: "#FAFAF9", cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
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
            const finalPlaceData = placeData ? { ...placeData, address: address || placeData.address } : null;
            onSave({ name: finalName, prefecture, placeData: finalPlaceData, rec, comment, visitDate, photo, id: initial?.id || Date.now() });
          }}
          style={{ flex: 2, background: C.ink, color: C.white, border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: "bold", cursor: "pointer" }}>
          保存する
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, background: "#F0F0F0", color: "#555", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, cursor: "pointer" }}>
          キャンセル
        </button>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, fontWeight: "bold", color: "#888", marginBottom: 5, letterSpacing: 0.5 };
const inputStyle = { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: C.white };

// ===== カテゴリ詳細ビュー =====
function CategoryView({ category, data, accentColor, onUpdate, onBack }) {
  const [entries, setEntries] = useState(data.entries || []);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => { onUpdate({ ...data, entries }); }, [entries]);

  function saveEntry(entry) {
    if (editingEntry) setEntries(entries.map(e => e.id === entry.id ? entry : e));
    else setEntries([...entries, entry]);
    setShowForm(false);
    setEditingEntry(null);
  }

  function deleteEntry(id) {
    if (confirm("削除しますか？")) {
      setEntries(entries.filter(e => e.id !== id));
      setExpandedId(null);
    }
  }

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

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id);
  }

  const emoji = getTagEmoji(category.name);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif" }}>
      <div style={{ background: C.ink, color: C.white, padding: "16px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9A8A7A", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 8, display: "block" }}>← 戻る</button>
        <div style={{ fontSize: 22, fontWeight: "bold" }}>{emoji} 人生{category.name}</div>
        <div style={{ fontSize: 12, color: "#9A8A7A", marginTop: 3 }}>{entries.length}件記録済み</div>
      </div>

      <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
        {!showForm && !editingEntry && (
          <button onClick={() => setShowForm(true)} style={{
            width: "100%", background: C.terra, color: C.white, border: "none",
            borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: "bold",
            cursor: "pointer", marginBottom: 16,
          }}>
            ＋ 新しい{category.name}を追加
          </button>
        )}

        {showForm && (
          <div style={{ marginBottom: 16 }}>
            <EntryForm onSave={saveEntry} onCancel={() => setShowForm(false)} categoryName={category.name} />
          </div>
        )}

        {entries.length === 0 && !showForm && (
          <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
            <div>まだ記録がありません</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>最初の{category.name}を追加しよう！</div>
          </div>
        )}

        {entries.map((entry, idx) => {
          const isExpanded = expandedId === entry.id;
          const isEditing = editingEntry?.id === entry.id;

          if (isEditing) return (
            <div key={entry.id} style={{ marginBottom: 12 }}>
              <EntryForm initial={entry} onSave={saveEntry} onCancel={() => setEditingEntry(null)} categoryName={category.name} />
            </div>
          );

          return (
            <div key={entry.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragging(null); setDragOver(null); }}
              style={{
                background: C.white, borderRadius: 14, marginBottom: 10,
                border: dragOver === idx ? `2px solid ${C.terra}` : `1px solid ${C.border}`,
                opacity: dragging === idx ? 0.5 : 1,
              }}
            >
              {/* カードメイン（常に表示） */}
              <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", cursor: "grab" }}>
                {/* ランクバッジ */}
                <div style={{
                  minWidth: 36, height: 36, borderRadius: "50%",
                  background: idx === 0 ? C.gold : idx === 1 ? C.silver : idx === 2 ? C.terra : "#EEE",
                  color: idx < 3 ? C.white : "#888",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "bold", fontSize: idx < 3 ? 16 : 13, flexShrink: 0,
                }}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "bold", fontSize: 16, color: C.ink, marginBottom: 4 }}>{entry.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    <RecBadge value={entry.rec} />
                    {entry.prefecture && (
                      <span style={{ fontSize: 12, color: "#888", background: "#F5F5F5", padding: "2px 8px", borderRadius: 10 }}>{entry.prefecture}</span>
                    )}
                    {entry.visitDate && <span style={{ fontSize: 12, color: C.muted }}>{entry.visitDate}</span>}
                  </div>
                  {entry.photo && (
                    <div style={{ marginBottom: 8, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                      <img src={entry.photo} alt="写真" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  {entry.comment && (
                    <div style={{ fontSize: 14, color: "#555", lineHeight: 1.5, marginBottom: 8 }}>「{entry.comment}」</div>
                  )}
                  {/* 常時表示：地図ボタン＋もっと見る */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a href={entry.placeData?.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(entry.name + " " + (entry.prefecture || ""))}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "#4A90D9", background: "none", border: "1px solid #C5DCF5", borderRadius: 6, padding: "3px 10px", textDecoration: "none" }}>
                      🗺 地図
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(entry.id); }}
                      style={{ fontSize: 12, color: C.muted, background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                      {isExpanded ? "閉じる ▲" : "編集・削除 ▼"}
                    </button>
                  </div>
                </div>

                <div style={{ color: "#CCC", fontSize: 18, flexShrink: 0, alignSelf: "center" }}>⠿</div>
              </div>

              {/* 展開パネル：編集・削除 */}
              {isExpanded && (
                <div style={{
                  borderTop: `1px solid #F0E8E0`,
                  padding: "10px 16px 14px",
                  display: "flex", gap: 8,
                }}>
                  <button onClick={() => { setEditingEntry(entry); setExpandedId(null); }}
                    style={{ flex: 1, fontSize: 13, color: "#555", background: "#F5F5F5", border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", fontFamily: "inherit", fontWeight: "bold" }}>
                    ✏️ 編集
                  </button>
                  <button onClick={() => deleteEntry(entry.id)}
                    style={{ flex: 1, fontSize: 13, color: "#E57373", background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 8, padding: "9px", cursor: "pointer", fontFamily: "inherit", fontWeight: "bold" }}>
                    🗑 削除
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {entries.length > 0 && (
          <div style={{ marginTop: 8, padding: "12px 0", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>⠿ ドラッグで順位を入れ替えられます</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ブラウズビュー（検索付き） =====
function BrowseView({ onSelect, onBack }) {
  const [query, setQuery] = useState("");
  const groups = [...new Set(TAG_DICTIONARY.map(t => t.group))];

  const filtered = query.trim()
    ? TAG_DICTIONARY.filter(t =>
        [t.tag, ...t.aliases].some(a => a.toLowerCase().includes(query.toLowerCase()))
      )
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif" }}>
      <div style={{ background: C.ink, color: C.white, padding: "16px 20px 12px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9A8A7A", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 8, display: "block" }}>← 戻る</button>
        <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>カテゴリを選ぶ</div>
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="カテゴリを検索..."
            style={{
              width: "100%", padding: "10px 36px 10px 14px", borderRadius: 10,
              border: "none", fontSize: 14, fontFamily: "inherit",
              background: "rgba(255,255,255,0.12)", color: C.white,
              outline: "none", boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.5)", pointerEvents: "none" }}>
            🔍
          </span>
          {query && (
            <button onClick={() => setQuery("")}
              style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer", padding: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
        {filtered ? (
          filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14 }}>「{query}」に一致するカテゴリがありません</div>
              <button
                onClick={() => onSelect(query)}
                style={{ marginTop: 16, background: C.terra, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" }}>
                ＋「{query}」を新しく追加
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 10 }}>{filtered.length}件見つかりました</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {filtered.map(t => (
                  <button key={t.tag} onClick={() => onSelect(t.tag)}
                    style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#333", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FFF8F5"; e.currentTarget.style.borderColor = C.terra; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border; }}
                  >
                    {GROUP_EMOJIS[t.group]} {t.tag}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          groups.map(group => (
            <div key={group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#888", marginBottom: 8, letterSpacing: 0.5 }}>{group}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TAG_DICTIONARY.filter(t => t.group === group).map(t => (
                  <button key={t.tag} onClick={() => onSelect(t.tag)}
                    style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#333", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FFF8F5"; e.currentTarget.style.borderColor = C.terra; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border; }}
                  >
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

// ===== マイマップビュー =====
function MapView({ categories, onBack }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [activeFilter, setActiveFilter] = useState("すべて");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // 全エントリーを集約（座標があるもののみ）
  const allEntries = categories.flatMap(cat =>
    (cat.entries || [])
      .filter(e => e.placeData?.lat && e.placeData?.lng)
      .map((e, idx) => ({ ...e, categoryName: cat.name, rank: idx + 1, accentColor: getAccentColor(categories.indexOf(cat)) }))
  );

  const filteredEntries = activeFilter === "すべて"
    ? allEntries
    : allEntries.filter(e => e.categoryName === activeFilter);

  // 地図初期化
  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 5,
        center: { lat: 36.5, lng: 137.0 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });
      setMapReady(true);
    });
  }, []);

  // ピン更新
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    filteredEntries.forEach(entry => {
      const marker = new window.google.maps.Marker({
        position: { lat: entry.placeData.lat, lng: entry.placeData.lng },
        map: mapInstanceRef.current,
        title: entry.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: entry.accentColor,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        setSelectedPlace(entry);
        mapInstanceRef.current.panTo({ lat: entry.placeData.lat, lng: entry.placeData.lng });
      });
      markersRef.current.push(marker);
    });

    // 複数ピンがある場合は全体表示
    if (filteredEntries.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredEntries.forEach(e => bounds.extend({ lat: e.placeData.lat, lng: e.placeData.lng }));
      mapInstanceRef.current.fitBounds(bounds, { padding: 60 });
    } else if (filteredEntries.length === 1) {
      mapInstanceRef.current.setCenter({ lat: filteredEntries[0].placeData.lat, lng: filteredEntries[0].placeData.lng });
      mapInstanceRef.current.setZoom(14);
    }
  }, [mapReady, filteredEntries.length, activeFilter]);

  const catNames = ["すべて", ...categories.map(c => c.name)];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
      {/* ヘッダー */}
      <div style={{ background: C.ink, color: C.white, padding: "16px 16px 12px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9A8A7A", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 8, display: "block" }}>← 戻る</button>
        <div style={{ fontSize: 20, fontWeight: "bold" }}>マイマップ</div>
        <div style={{ fontSize: 11, color: "#9A8A7A", marginTop: 2 }}>{allEntries.length}件の記録</div>
        {/* フィルターチップ */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
          {catNames.map(name => (
            <button key={name} onClick={() => { setActiveFilter(name); setSelectedPlace(null); }}
              style={{
                background: activeFilter === name ? C.terra : "rgba(255,255,255,0.1)",
                border: `0.5px solid ${activeFilter === name ? C.terra : "rgba(255,255,255,0.2)"}`,
                borderRadius: 20, padding: "4px 12px", fontSize: 11,
                color: C.white, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit",
              }}>
              {name === "すべて" ? "すべて" : `${getTagEmoji(name)} ${name}`}
            </button>
          ))}
        </div>
      </div>

      {/* 地図エリア */}
      <div ref={mapRef} style={{ height: 320, flexShrink: 0, background: "#E8F0E4" }} />

      {/* ボトムシート */}
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", marginTop: -20, flex: 1, padding: "12px 14px 24px", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: "#E0E0E0", borderRadius: 2, margin: "0 auto 14px" }} />

        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
            <div style={{ fontSize: 14 }}>座標付きの記録がありません</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>場所を追加する際にPlaces APIで検索すると地図に表示されます</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 10 }}>
              {selectedPlace ? "選択中の場所" : "記録一覧"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(selectedPlace ? [selectedPlace, ...filteredEntries.filter(e => e.id !== selectedPlace.id)] : filteredEntries).map(entry => (
                <div key={entry.id}
                  onClick={() => {
                    setSelectedPlace(entry);
                    if (mapInstanceRef.current) mapInstanceRef.current.panTo({ lat: entry.placeData.lat, lng: entry.placeData.lng });
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 12,
                    background: selectedPlace?.id === entry.id ? "#FFF8F5" : "#FAFAF9",
                    border: `0.5px solid ${selectedPlace?.id === entry.id ? C.terra : C.border}`,
                    cursor: "pointer",
                  }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{getTagEmoji(entry.categoryName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: C.ink }}>{entry.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>人生{entry.categoryName} · {entry.placeData.prefecture || entry.prefecture}</div>
                    {entry.rec && <RecBadge value={entry.rec} />}
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: entry.rank === 1 ? C.gold : entry.rank === 2 ? C.silver : entry.rank === 3 ? C.terra : "#EEE",
                    color: entry.rank <= 3 ? C.white : "#888",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: entry.rank <= 3 ? 14 : 12, fontWeight: "bold",
                  }}>
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===== メインアプリ =====
export default function App() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCategories(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(categories)); } catch {}
  }, [categories]);

  function addCategory(name) {
    const normalized = normalizeTag(name);
    if (!normalized) return;
    if (categories.find(c => c.name === normalized)) {
      const existing = categories.find(c => c.name === normalized);
      setActiveCategory(existing);
      setShowNewCat(false); setShowBrowse(false); setNewCatInput("");
      return;
    }
    const cat = { id: Date.now(), name: normalized, entries: [] };
    const updated = [...categories, cat];
    setCategories(updated);
    setNewCatInput(""); setShowNewCat(false); setShowBrowse(false);
    setActiveCategory(cat);
  }

  function updateCategory(updated) { setCategories(categories.map(c => c.id === updated.id ? updated : c)); }
  function deleteCategory(id) { if (confirm("このカテゴリを削除しますか？")) setCategories(categories.filter(c => c.id !== id)); }

  if (showBrowse) return <BrowseView onSelect={name => addCategory(name)} onBack={() => setShowBrowse(false)} />;

  if (showMap) return <MapView categories={categories} onBack={() => setShowMap(false)} />;

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

  const totalEntries = categories.reduce((sum, c) => sum + (c.entries?.length || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif" }}>
      {/* ヘッダー */}
      <div style={{ background: C.ink, padding: "28px 20px 20px", color: C.white }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 28, fontWeight: "bold", letterSpacing: 1 }}>人生ノート</div>
          <div style={{ fontSize: 13, color: "#9A8A7A", marginTop: 4 }}>人生で最高だったものを記録しよう</div>
          {totalEntries > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.11)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.terra }}>
                📝 {totalEntries}件の記録
              </div>
              <div style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.11)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.terra }}>
                📂 {categories.length}カテゴリ
              </div>
              <button onClick={() => setShowMap(true)}
                style={{ marginLeft: "auto", background: C.terra, border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: C.white, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" }}>
                🗺 地図で見る
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
        {/* カテゴリグリッド */}
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
                  <div key={cat.id} onClick={() => setActiveCategory(cat)}
                    style={{
                      background: C.white, borderRadius: 14, overflow: "hidden",
                      cursor: "pointer", border: `1px solid ${C.border}`,
                      position: "relative", transition: "transform 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    {/* アクセントライン */}
                    <div style={{ height: 3, background: accent }} />
                    <div style={{ padding: "12px 12px 0" }}>
                      <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
                        style={{ position: "absolute", top: 10, right: 8, background: "none", border: "none", color: "#CCC", fontSize: 13, cursor: "pointer", padding: 2 }}>
                        ✕
                      </button>
                      <div style={{ fontSize: 30, marginBottom: 6 }}>{emoji}</div>
                      <div style={{ fontWeight: "bold", fontSize: 14, color: C.ink }}>人生{cat.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{count}件</div>
                    </div>
                    {top && (
                      <div style={{ margin: "8px 10px 10px", background: "#FFF8F5", borderRadius: 8, padding: "5px 8px" }}>
                        <div style={{ fontSize: 9, color: C.terra, fontWeight: "bold" }}>🥇 1位</div>
                        <div style={{ fontSize: 11, color: C.ink, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{top.name}</div>
                        {top.rec && <RecBadge value={top.rec} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 空状態 */}
        {categories.length === 0 && !showNewCat && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📖</div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#555", marginBottom: 8 }}>人生ノートをはじめよう</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>「人生うどん」「人生夕日」など<br />自分だけのランキングを作れます</div>
          </div>
        )}

        {/* 追加ボタン */}
        {!showNewCat && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setShowBrowse(true)}
              style={{ flex: 1, background: C.white, color: C.ink, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" }}>
              📋 一覧から選ぶ
            </button>
            <button onClick={() => setShowNewCat(true)}
              style={{ flex: 1, background: C.terra, color: C.white, border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" }}>
              ＋ 自由に入力
            </button>
          </div>
        )}

        {/* カテゴリ新規入力 */}
        {showNewCat && (
          <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ fontWeight: "bold", fontSize: 15, marginBottom: 12, color: C.ink }}>カテゴリ名を入力</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#888", whiteSpace: "nowrap" }}>人生</span>
              <div style={{ flex: 1 }}>
                <CategoryInput
                  value={newCatInput}
                  onChange={setNewCatInput}
                  onSelect={name => addCategory(name)}
                  placeholder="うどん、夕日、スキー場..."
                />
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>※ 候補から選ぶか、自由に入力してください</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => addCategory(newCatInput)}
                style={{ flex: 2, background: C.ink, color: C.white, border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" }}>
                作成
              </button>
              <button onClick={() => { setShowNewCat(false); setNewCatInput(""); }}
                style={{ flex: 1, background: "#F0F0F0", color: "#555", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}