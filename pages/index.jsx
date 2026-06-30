import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "jinsei-note-v3";

// ===== カラー定数 =====
const C = {
  ink:    "#1A1208",
  terra:  "#C87040",
  gold:   "#C8A050",
  cream:  "#F2EDE4",
  white:  "#FFFFFF",
  border: "#E0D5C0",
  muted:  "#B09878",
  sub:    "#A08060",
  leather:"#2C1F0E",
  goldLight:"#E8C870",
};

// ===== おすすめ度定義 =====
const REC_LEVELS = [
  { value: 3, label: "人生で必ず",    short: "人生で必ず",    color: "#C07040", bg: "#FFF3EC", bar: "#E8935A" },
  { value: 2, label: "好きなら行って", short: "好きなら行って", color: "#4878A8", bg: "#EEF4FF", bar: "#7CA8D8" },
  { value: 1, label: "良い思い出",    short: "良い思い出",    color: "#488858", bg: "#EEF7EE", bar: "#78B880" },
];

// ===== 大カテゴリ =====
const BIG_CATS = [
  { id:"eat",   label:"食べる・飲む" },
  { id:"see",   label:"見る・感じる" },
  { id:"do",    label:"体験・やる"   },
  { id:"relax", label:"整う・癒し"   },
  { id:"enjoy", label:"楽しむ"       },
  { id:"stay",  label:"泊まる"       },
];

// ===== 大カテゴリSVGアイコン（立体版）=====
function BigCatIcon({ id, size = 28 }) {
  const s = size;
  const vb = "0 0 52 52";
  const icons = {
    eat: (
      <svg width={s} height={s} viewBox={vb} fill="none">
        <defs>
          <radialGradient id="bc_bowl" cx="40%" cy="25%" r="70%"><stop offset="0%" stopColor="#FFE0C8"/><stop offset="100%" stopColor="#E8935A"/></radialGradient>
          <radialGradient id="bc_soup" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor="#FFF0D8"/><stop offset="100%" stopColor="#F0C87A"/></radialGradient>
          <linearGradient id="bc_fork" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C0C0C0"/><stop offset="100%" stopColor="#808080"/></linearGradient>
          <linearGradient id="bc_chop" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#D4A843"/><stop offset="100%" stopColor="#8A6010"/></linearGradient>
        </defs>
        <ellipse cx="27" cy="41" rx="14" ry="3" fill="rgba(0,0,0,0.1)"/>
        <path d="M13 32 Q13 42 27 42 Q41 42 41 32 L39 28 L15 28 Z" fill="url(#bc_bowl)" stroke="#C87040" strokeWidth="1"/>
        <ellipse cx="27" cy="28" rx="12" ry="4" fill="url(#bc_soup)" stroke="#D4A843" strokeWidth="0.8"/>
        <path d="M19 26 Q23 22 27 26 Q31 30 35 26" stroke="#C8941A" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M18 28.5 Q22 25 26 28.5 Q30 32 34 28.5" stroke="#C8941A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
        <line x1="36" y1="8" x2="28" y2="26" stroke="url(#bc_chop)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="40" y1="10" x2="31" y2="26" stroke="url(#bc_chop)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="13" y1="10" x2="13" y2="24" stroke="url(#bc_fork)" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="11" y1="10" x2="11" y2="15" stroke="url(#bc_fork)" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="13" y1="10" x2="13" y2="15" stroke="url(#bc_fork)" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="15" y1="10" x2="15" y2="15" stroke="url(#bc_fork)" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M21 22 Q22 18 21 14 Q20 10 21 6" stroke="#FFD0A0" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M27 20 Q28 16 27 12 Q26 8 27 4" stroke="#FFD0A0" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
        <ellipse cx="22" cy="30" rx="4" ry="1.5" fill="white" opacity="0.25" transform="rotate(-10 22 30)"/>
      </svg>
    ),
    see: (
      <svg width={s} height={s} viewBox={vb} fill="none">
        <defs>
          <radialGradient id="bc_eye" cx="38%" cy="30%" r="65%"><stop offset="0%" stopColor="#7BBCE8"/><stop offset="100%" stopColor="#0C447C"/></radialGradient>
          <radialGradient id="bc_iris" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#378ADD"/><stop offset="100%" stopColor="#042C53"/></radialGradient>
        </defs>
        <path d="M4 26 Q15 10 26 10 Q37 10 48 26 Q37 42 26 42 Q15 42 4 26Z" fill="#E8F4FF" stroke="#185FA5" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx="26" cy="26" r="10" fill="url(#bc_eye)" stroke="#0C447C" strokeWidth="1"/>
        <circle cx="26" cy="26" r="5.5" fill="url(#bc_iris)"/>
        <circle cx="26" cy="26" r="3" fill="#042C53"/>
        <circle cx="28.5" cy="23" r="2.5" fill="white" opacity="0.7"/>
        <circle cx="23" cy="28" r="1.2" fill="white" opacity="0.3"/>
        <line x1="14" y1="14" x2="16" y2="18" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="20" y1="11" x2="21" y2="15" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="26" y1="10" x2="26" y2="14" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="32" y1="11" x2="31" y2="15" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="38" y1="14" x2="36" y2="18" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M42 8 L43.2 11 L46 11 L43.8 12.8 L44.6 16 L42 14.2 L39.4 16 L40.2 12.8 L38 11 L40.8 11 Z" fill="#D4A843"/>
        <path d="M6 8 L6.8 10.5 L9 10.5 L7.2 12 L7.8 14.5 L6 13 L4.2 14.5 L4.8 12 L3 10.5 L5.2 10.5 Z" fill="#D4A843" opacity="0.6"/>
      </svg>
    ),
    do: (
      <svg width={s} height={s} viewBox={vb} fill="none">
        <defs>
          <linearGradient id="bc_wave" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#5DCAA5"/><stop offset="100%" stopColor="#1D9E75"/></linearGradient>
          <radialGradient id="bc_pers" cx="35%" cy="25%" r="70%"><stop offset="0%" stopColor="#7BBCE8"/><stop offset="100%" stopColor="#185FA5"/></radialGradient>
        </defs>
        <path d="M2 36 Q10 30 18 36 Q26 42 34 36 Q42 30 50 36 L50 48 L2 48 Z" fill="#9FE1CB" opacity="0.5"/>
        <path d="M2 40 Q10 34 18 38 Q26 42 34 38 Q42 34 50 40 L50 52 L2 52 Z" fill="url(#bc_wave)"/>
        <path d="M2 40 Q10 34 18 38 Q26 42 34 38 Q42 34 50 40" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <path d="M8 38 Q26 30 46 36" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <path d="M8 38 Q26 30 46 36" stroke="#185FA5" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
        <circle cx="32" cy="24" r="4.5" fill="url(#bc_pers)" stroke="#0C447C" strokeWidth="0.8"/>
        <circle cx="30" cy="22" r="1.8" fill="white" opacity="0.3"/>
        <path d="M32 28.5 L28 36" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M28 36 L22 40" stroke="#185FA5" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M28 36 L34 38" stroke="#185FA5" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M31 30 L22 26" stroke="#185FA5" strokeWidth="2" strokeLinecap="round"/>
        <path d="M31 30 L40 27" stroke="#185FA5" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 38 L8 34 M12 37 L11 33" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      </svg>
    ),
    relax: (
      <svg width={s} height={s} viewBox={vb} fill="none">
        <defs>
          <linearGradient id="bc_tub" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#9FE1CB"/><stop offset="100%" stopColor="#0F6E56"/></linearGradient>
          <radialGradient id="bc_water" cx="30%" cy="20%" r="80%"><stop offset="0%" stopColor="#B8EEE0"/><stop offset="100%" stopColor="#1D9E75"/></radialGradient>
          <radialGradient id="bc_head" cx="35%" cy="25%" r="70%"><stop offset="0%" stopColor="#F0D0B0"/><stop offset="100%" stopColor="#C09060"/></radialGradient>
        </defs>
        <ellipse cx="27" cy="44" rx="16" ry="3" fill="rgba(0,0,0,0.08)"/>
        <path d="M8 32 Q8 46 27 46 Q46 46 46 32 L44 28 L10 28 Z" fill="url(#bc_tub)" stroke="#0F6E56" strokeWidth="1.2"/>
        <ellipse cx="27" cy="28" rx="17" ry="5.5" fill="url(#bc_water)" stroke="#1D9E75" strokeWidth="1"/>
        <path d="M14 28 Q19 25 24 28 Q29 31 34 28 Q39 25 44 28" stroke="white" strokeWidth="1" fill="none" opacity="0.5"/>
        <circle cx="27" cy="24" r="5.5" fill="url(#bc_head)" stroke="#A07040" strokeWidth="0.8"/>
        <circle cx="25" cy="22" r="2" fill="white" opacity="0.2"/>
        <path d="M22 21 Q27 18.5 32 21" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M22 21 Q27 18.5 32 21" stroke="#E8935A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <path d="M10 30 Q14 26 19 28" stroke="url(#bc_head)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M44 30 Q40 26 35 28" stroke="url(#bc_head)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18 22 Q19.5 17 18 12 Q16.5 7 18 2" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M27 20 Q28.5 15 27 10 Q25.5 5 27 0" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M36 22 Q37.5 17 36 12 Q34.5 7 36 2" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
        <ellipse cx="18" cy="34" rx="5" ry="2" fill="white" opacity="0.15" transform="rotate(-10 18 34)"/>
      </svg>
    ),
    enjoy: (
      <svg width={s} height={s} viewBox={vb} fill="none">
        <defs>
          <linearGradient id="bc_stage" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F5D060"/><stop offset="100%" stopColor="#C8941A"/></linearGradient>
        </defs>
        <path d="M14 4 L8 22 L20 22 Z" fill="#FFF8C0" opacity="0.7"/>
        <path d="M26 4 L20 22 L32 22 Z" fill="#C0E0FF" opacity="0.6"/>
        <path d="M38 4 L32 22 L44 22 Z" fill="#FFF8C0" opacity="0.5"/>
        <circle cx="14" cy="5" r="3" fill="#E8935A" stroke="#C07030" strokeWidth="0.8"/>
        <circle cx="26" cy="4" r="3" fill="#378ADD" stroke="#185FA5" strokeWidth="0.8"/>
        <circle cx="38" cy="5" r="3" fill="#E8935A" stroke="#C07030" strokeWidth="0.8"/>
        <rect x="4" y="22" width="44" height="6" rx="1.5" fill="url(#bc_stage)" stroke="#A07010" strokeWidth="1"/>
        <rect x="4" y="22" width="44" height="2" rx="1" fill="white" opacity="0.2"/>
        <circle cx="26" cy="32" r="3.5" fill="#854F0B"/>
        <path d="M26 35.5 L26 42" stroke="#854F0B" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M26 38 L21 44" stroke="#854F0B" strokeWidth="2" strokeLinecap="round"/>
        <path d="M26 38 L31 44" stroke="#854F0B" strokeWidth="2" strokeLinecap="round"/>
        <path d="M25 36 L19 32" stroke="#854F0B" strokeWidth="2" strokeLinecap="round"/>
        <path d="M27 36 L33 32" stroke="#854F0B" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="13" cy="33" r="3" fill="#BA7517"/>
        <path d="M13 36 L13 42" stroke="#BA7517" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 37 L8 33" stroke="#BA7517" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M14 37 L18 34" stroke="#BA7517" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="39" cy="33" r="3" fill="#BA7517"/>
        <path d="M39 36 L39 42" stroke="#BA7517" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M38 37 L34 34" stroke="#BA7517" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M40 37 L44 33" stroke="#BA7517" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    stay: (
      <svg width={s} height={s} viewBox={vb} fill="none">
        <defs>
          <linearGradient id="bc_hotel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C8C0F0"/><stop offset="100%" stopColor="#534AB7"/></linearGradient>
          <linearGradient id="bc_roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9A92E0"/><stop offset="100%" stopColor="#3C3489"/></linearGradient>
          <linearGradient id="bc_win" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFF8C0"/><stop offset="100%" stopColor="#F5D060"/></linearGradient>
        </defs>
        <rect x="13" y="16" width="28" height="34" rx="1" fill="#3C3489" opacity="0.25" transform="translate(2 2)"/>
        <rect x="11" y="14" width="30" height="34" rx="1.5" fill="url(#bc_hotel)" stroke="#3C3489" strokeWidth="1.2"/>
        <rect x="9" y="11" width="34" height="5" rx="1" fill="url(#bc_roof)" stroke="#26215C" strokeWidth="1"/>
        <rect x="9" y="11" width="34" height="2" rx="1" fill="white" opacity="0.2"/>
        <rect x="14" y="18" width="6" height="6" rx="1" fill="#EEEDFE" stroke="#7F77DD" strokeWidth="0.8"/>
        <rect x="23" y="18" width="6" height="6" rx="1" fill="#EEEDFE" stroke="#7F77DD" strokeWidth="0.8"/>
        <rect x="32" y="18" width="6" height="6" rx="1" fill="#EEEDFE" stroke="#7F77DD" strokeWidth="0.8"/>
        <rect x="14" y="27" width="6" height="6" rx="1" fill="url(#bc_win)" stroke="#7F77DD" strokeWidth="0.8"/>
        <rect x="23" y="27" width="6" height="6" rx="1" fill="#EEEDFE" stroke="#7F77DD" strokeWidth="0.8"/>
        <rect x="32" y="27" width="6" height="6" rx="1" fill="url(#bc_win)" stroke="#7F77DD" strokeWidth="0.8"/>
        <rect x="14.5" y="18.5" width="2" height="2" rx="0.3" fill="white" opacity="0.5"/>
        <rect x="14.5" y="27.5" width="2" height="2" rx="0.3" fill="white" opacity="0.5"/>
        <rect x="32.5" y="27.5" width="2" height="2" rx="0.3" fill="white" opacity="0.5"/>
        <rect x="20" y="37" width="12" height="11" rx="1.5" fill="#3C3489" stroke="#26215C" strokeWidth="0.8"/>
        <rect x="22" y="37" width="4" height="11" rx="0.5" fill="#534AB7" opacity="0.5"/>
        <circle cx="30" cy="43" r="1" fill="#D4A843"/>
        <path d="M21 10 L21.8 12.5 L24.5 12.5 L22.3 14 L23.1 16.5 L21 15 L18.9 16.5 L19.7 14 L17.5 12.5 L20.2 12.5 Z" fill="#D4A843"/>
        <path d="M26 9.5 L26.6 11.5 L28.7 11.5 L27.1 12.8 L27.7 14.8 L26 13.5 L24.3 14.8 L24.9 12.8 L23.3 11.5 L25.4 11.5 Z" fill="#D4A843"/>
        <path d="M31 10 L31.8 12.5 L34.5 12.5 L32.3 14 L33.1 16.5 L31 15 L28.9 16.5 L29.7 14 L27.5 12.5 L30.2 12.5 Z" fill="#D4A843"/>
        <rect x="11" y="14" width="6" height="34" rx="1.5" fill="white" opacity="0.08"/>
      </svg>
    ),
  };
  return icons[id] || <span style={{ fontSize: s * 0.6 }}>✦</span>;
}

// ===== 体験タグ =====
const EXPERIENCE_TAGS = {
  "シーン": ["#一人旅","#デート","#家族","#友達","#仕事後"],
  "感情":   ["#感動した","#また行きたい","#人生変わった","#泣いた"],
  "状況":   ["#穴場","#行列必至","#予約必須","#ふらっと行ける"],
  "季節":   ["#春限定","#夏限定","#秋限定","#冬がベスト"],
  "価値":   ["#遠征する価値あり","#近くに寄ったら","#わざわざ行く価値あり"],
};

// ★スコアで降順ソート（デフォルト）
function sortEntriesByStar(entries) {
  return [...entries].sort((a, b) => (b.star ?? 0) - (a.star ?? 0));
}
// おすすめ度でソート
function sortEntriesByRec(entries) {
  return [...entries].sort((a, b) => (b.rec ?? 2) - (a.rec ?? 2));
}
// 日付の新しい順
function sortEntriesByDate(entries) {
  return [...entries].sort((a, b) => {
    if (!a.visitDate && !b.visitDate) return 0;
    if (!a.visitDate) return 1;
    if (!b.visitDate) return -1;
    return b.visitDate.localeCompare(a.visitDate);
  });
}

// ===== タグ辞書 =====
const TAG_DICTIONARY = [
  // 🍜 麺
  { tag: "うどん", aliases: ["うどん屋","讃岐うどん","手打ちうどん","釜揚げうどん"], group: "🍜 麺" },
  { tag: "ラーメン", aliases: ["らーめん","ラーメン屋","拉麺","豚骨ラーメン","醤油ラーメン"], group: "🍜 麺" },
  { tag: "そば", aliases: ["蕎麦","そば屋","手打ちそば","日本そば"], group: "🍜 麺" },
  { tag: "パスタ", aliases: ["スパゲッティ","スパゲティ","ペペロンチーノ"], group: "🍜 麺" },
  { tag: "つけ麺", aliases: ["つけめん"], group: "🍜 麺" },
  { tag: "冷麺", aliases: ["冷やし中華","れいめん"], group: "🍜 麺" },
  { tag: "フォー", aliases: ["pho","ベトナム麺"], group: "🍜 麺" },
  { tag: "素麺", aliases: ["そうめん","流しそうめん"], group: "🍜 麺" },
  { tag: "焼きそば", aliases: ["やきそば"], group: "🍜 麺" },
  // 🍱 和食
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
  // 🌍 各国料理
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
  // 🍔 カジュアル
  { tag: "カレー", aliases: ["curry","カレーライス","スープカレー"], group: "🍔 カジュアル" },
  { tag: "ハンバーガー", aliases: ["バーガー","burger"], group: "🍔 カジュアル" },
  { tag: "ピザ", aliases: ["pizza","ピッツァ"], group: "🍔 カジュアル" },
  { tag: "唐揚げ", aliases: ["からあげ","フライドチキン"], group: "🍔 カジュアル" },
  { tag: "たこ焼き", aliases: ["タコ焼き","明石焼き"], group: "🍔 カジュアル" },
  { tag: "お好み焼き", aliases: ["おこのみやき","広島焼き"], group: "🍔 カジュアル" },
  { tag: "もんじゃ", aliases: ["もんじゃ焼き"], group: "🍔 カジュアル" },
  { tag: "串カツ", aliases: ["串かつ","串揚げ"], group: "🍔 カジュアル" },
  // 🍰 スイーツ
  { tag: "ケーキ", aliases: ["ショートケーキ","チーズケーキ","洋菓子"], group: "🍰 スイーツ" },
  { tag: "パフェ", aliases: ["parfait"], group: "🍰 スイーツ" },
  { tag: "アイスクリーム", aliases: ["ジェラート","アイス","gelato"], group: "🍰 スイーツ" },
  { tag: "和菓子", aliases: ["おはぎ","大福","羊羹","饅頭"], group: "🍰 スイーツ" },
  { tag: "パン", aliases: ["ベーカリー","bakery","クロワッサン"], group: "🍰 スイーツ" },
  { tag: "クレープ", aliases: ["crepe"], group: "🍰 スイーツ" },
  { tag: "ソフトクリーム", aliases: ["ソフトアイス","soft cream"], group: "🍰 スイーツ" },
  { tag: "プリン", aliases: ["pudding","焼きプリン"], group: "🍰 スイーツ" },
  // ☕ 飲む
  { tag: "カフェ・喫茶店", aliases: ["カフェ","喫茶店","コーヒー","cafe","珈琲"], group: "☕ 飲む" },
  { tag: "居酒屋", aliases: ["いざかや","大衆酒場","酒場"], group: "☕ 飲む" },
  { tag: "バー", aliases: ["bar","BAR","ワインバー","立ち飲み"], group: "☕ 飲む" },
  { tag: "ワイナリー", aliases: ["ワイン醸造所","winery"], group: "☕ 飲む" },
  { tag: "日本酒蔵", aliases: ["酒蔵","蔵元","醸造所"], group: "☕ 飲む" },
  { tag: "クラフトビール", aliases: ["ブルワリー","brewery","地ビール"], group: "☕ 飲む" },
  { tag: "ウイスキー蒸留所", aliases: ["蒸溜所","distillery"], group: "☕ 飲む" },
  { tag: "茶室", aliases: ["お茶室","茶道","抹茶"], group: "☕ 飲む" },
  // 🌅 景色
  { tag: "夕日", aliases: ["夕焼け","サンセット","sunset"], group: "🌅 景色" },
  { tag: "朝日", aliases: ["日の出","sunrise","御来光"], group: "🌅 景色" },
  { tag: "夜景", aliases: ["夜の景色","イルミネーション","ナイトビュー"], group: "🌅 景色" },
  { tag: "星空", aliases: ["星","天の川","プラネタリウム","stargazing"], group: "🌅 景色" },
  { tag: "紅葉", aliases: ["もみじ","紅葉狩り","秋の景色"], group: "🌅 景色" },
  { tag: "桜", aliases: ["さくら","花見","お花見","cherry blossom"], group: "🌅 景色" },
  { tag: "雪景色", aliases: ["雪","冬景色","雪原"], group: "🌅 景色" },
  { tag: "雲海", aliases: ["雲の海","雲上"], group: "🌅 景色" },
  { tag: "オーロラ", aliases: ["aurora","北極光","南極光"], group: "🌅 景色" },
  { tag: "花火", aliases: ["花火大会","fireworks"], group: "🌅 景色" },
  // 🌿 自然
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
  // 🎿 アクティビティ
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
  // 🎡 施設
  { tag: "テーマパーク・遊園地", aliases: ["テーマパーク","遊園地","ディズニー","USJ","アミューズメント"], group: "🎡 施設" },
  { tag: "水族館", aliases: ["aquarium"], group: "🎡 施設" },
  { tag: "動物園", aliases: ["zoo"], group: "🎡 施設" },
  { tag: "植物園", aliases: ["botanical garden"], group: "🎡 施設" },
  { tag: "博物館", aliases: ["museum","歴史博物館"], group: "🎡 施設" },
  // 🎭 文化・歴史
  { tag: "神社", aliases: ["shrine","大社","神宮","お宮"], group: "🎭 文化・歴史" },
  { tag: "寺", aliases: ["temple","お寺","仏閣","大仏"], group: "🎭 文化・歴史" },
  { tag: "城", aliases: ["お城","castle","城跡"], group: "🎭 文化・歴史" },
  { tag: "世界遺産", aliases: ["world heritage","UNESCO"], group: "🎭 文化・歴史" },
  { tag: "美術館", aliases: ["art museum","ギャラリー","gallery","アート"], group: "🎭 文化・歴史" },
  { tag: "街並み", aliases: ["古民家","町並み","レトロ","古い街","商店街"], group: "🎭 文化・歴史" },
  { tag: "市場", aliases: ["マーケット","市場","朝市","錦市場"], group: "🎭 文化・歴史" },
  // 🎪 体験
  { tag: "陶芸", aliases: ["pottery","焼き物","陶芸体験"], group: "🎪 体験" },
  { tag: "酒造見学", aliases: ["蔵見学","醸造見学"], group: "🎪 体験" },
  { tag: "農業体験", aliases: ["農園","収穫体験","果物狩り","いちご狩り"], group: "🎪 体験" },
  { tag: "料理教室", aliases: ["cooking class","クッキング"], group: "🎪 体験" },
  { tag: "茶道", aliases: ["tea ceremony","お茶","茶道体験"], group: "🎪 体験" },
  { tag: "座禅", aliases: ["禅","zen","瞑想"], group: "🎪 体験" },
  { tag: "パン作り", aliases: ["bread making","ベーキング"], group: "🎪 体験" },
  // 🏟️ スポーツ観戦
  { tag: "野球場", aliases: ["野球","baseball","球場","プロ野球"], group: "🏟️ スポーツ観戦" },
  { tag: "サッカースタジアム", aliases: ["サッカー","football","スタジアム"], group: "🏟️ スポーツ観戦" },
  { tag: "バスケ観戦", aliases: ["バスケットボール","basketball","NBA","Bリーグ"], group: "🏟️ スポーツ観戦" },
  { tag: "ラグビー観戦", aliases: ["ラグビー","rugby"], group: "🏟️ スポーツ観戦" },
  { tag: "テニス観戦", aliases: ["テニス","tennis"], group: "🏟️ スポーツ観戦" },
  { tag: "競馬場", aliases: ["競馬","horse racing"], group: "🏟️ スポーツ観戦" },
  { tag: "相撲", aliases: ["大相撲","国技館","sumo"], group: "🏟️ スポーツ観戦" },
  // ♨️ 癒し
  { tag: "温泉", aliases: ["onsen","湯","お風呂","露天風呂","湯治"], group: "♨️ 癒し" },
  { tag: "サウナ", aliases: ["sauna","ととのう","フィンランドサウナ"], group: "♨️ 癒し" },
  { tag: "銭湯", aliases: ["公衆浴場","お風呂","銭湯"], group: "♨️ 癒し" },
  { tag: "スパ", aliases: ["spa","エステ","リラクゼーション"], group: "♨️ 癒し" },
  { tag: "リトリート", aliases: ["retreat","瞑想リトリート","ヨガ"], group: "♨️ 癒し" },
  // 🏨 泊まる
  { tag: "ホテル", aliases: ["hotel","リゾートホテル","シティホテル"], group: "🏨 泊まる" },
  { tag: "旅館", aliases: ["ryokan","和風旅館","老舗旅館"], group: "🏨 泊まる" },
  { tag: "民宿", aliases: ["民泊","B&B","ペンション"], group: "🏨 泊まる" },
  { tag: "ゲストハウス", aliases: ["hostel","ホステル","ドミトリー"], group: "🏨 泊まる" },
  { tag: "グランピング", aliases: ["glamping","豪華キャンプ"], group: "🏨 泊まる" },
  { tag: "ツリーハウス", aliases: ["treehouse","木の上の宿"], group: "🏨 泊まる" },
  { tag: "ヴィラ", aliases: ["villa","コテージ","貸別荘"], group: "🏨 泊まる" },
  // 🛍️ 買う
  { tag: "マルシェ", aliases: ["marche","朝市","ファーマーズマーケット"], group: "🛍️ 買う" },
  { tag: "道の駅・産直", aliases: ["道の駅","産直","直売所","JAショップ"], group: "🛍️ 買う" },
  { tag: "アウトレット", aliases: ["outlet","アウトレットモール"], group: "🛍️ 買う" },
  // 🎵 エンタメ
  { tag: "ライブ・コンサート", aliases: ["ライブ","コンサート","live","concert","フェス","音楽フェス"], group: "🎵 エンタメ" },
  { tag: "映画館", aliases: ["シネマ","cinema","movie","映画"], group: "🎵 エンタメ" },
  { tag: "演劇・落語", aliases: ["演劇","落語","歌舞伎","宝塚","ミュージカル"], group: "🎵 エンタメ" },
  { tag: "祭り", aliases: ["お祭り","festival","縁日","夏祭り"], group: "🎵 エンタメ" },
  // 🐾 動物・生き物
  { tag: "猫カフェ", aliases: ["ねこカフェ","猫","cat cafe"], group: "🐾 動物・生き物" },
  { tag: "牧場", aliases: ["ファーム","farm","動物ふれあい"], group: "🐾 動物・生き物" },
  { tag: "イルカウォッチング", aliases: ["イルカ","dolphin","クジラ","whale"], group: "🐾 動物・生き物" },
  // 🚂 乗り物体験
  { tag: "ローカル線", aliases: ["ローカル電車","路面電車","トロッコ列車","観光列車"], group: "🚂 乗り物体験" },
  { tag: "ロープウェイ", aliases: ["ゴンドラ","リフト","cable car"], group: "🚂 乗り物体験" },
  { tag: "クルーズ船", aliases: ["クルーズ","cruise","遊覧船","屋形船"], group: "🚂 乗り物体験" },
];

const GROUP_EMOJIS = {
  "🍜 麺":"🍜","🍱 和食":"🍱","🌍 各国料理":"🌍","🍔 カジュアル":"🍔",
  "🍰 スイーツ":"🍰","☕ 飲む":"☕","🌅 景色":"🌅","🌿 自然":"🌿",
  "🎿 アクティビティ":"🎿","🎡 施設":"🎡","🎭 文化・歴史":"🎭","🎪 体験":"🎪",
  "🏟️ スポーツ観戦":"🏟️","♨️ 癒し":"♨️","🏨 泊まる":"🏨","🛍️ 買う":"🛍️",
  "🎵 エンタメ":"🎵","🐾 動物・生き物":"🐾","🚂 乗り物体験":"🚂",
};

// グループ名 → 大カテゴリ(big_cat) の対応表
const GROUP_TO_BIGCAT = {
  "🍜 麺": "eat", "🍱 和食": "eat", "🌍 各国料理": "eat", "🍔 カジュアル": "eat",
  "🍰 スイーツ": "eat", "☕ 飲む": "eat",
  "🌅 景色": "see", "🌿 自然": "see",
  "🎿 アクティビティ": "do", "🎪 体験": "do", "🏟️ スポーツ観戦": "do",
  "🐾 動物・生き物": "do", "🚂 乗り物体験": "do",
  "♨️ 癒し": "relax",
  "🎡 施設": "enjoy", "🎭 文化・歴史": "enjoy", "🛍️ 買う": "enjoy", "🎵 エンタメ": "enjoy",
  "🏨 泊まる": "stay",
};

// タグ名から大カテゴリ(big_cat)を推定（TAG_DICTIONARYに存在すれば対応表から、なければnull）
function inferBigCatFromTagName(tagName) {
  const entry = TAG_DICTIONARY.find(e => e.tag === tagName);
  if (!entry) return null;
  return GROUP_TO_BIGCAT[entry.group] || null;
}

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
// DBから取得したサジェスト（30人以上）をグローバルで保持
let _dynamicSuggestions = [];
function setDynamicSuggestions(data) { _dynamicSuggestions = data || []; }

function getSuggestions(input) {
  if (!input || input.length < 1) return [];
  const lower = input.toLowerCase();
  const results = [];
  const seen = new Set();

  // まずTAG_DICTIONARYから検索
  for (const entry of TAG_DICTIONARY) {
    const allTerms = [entry.tag, ...entry.aliases];
    if (allTerms.some(t => t.toLowerCase().includes(lower))) {
      results.push(entry);
      seen.add(entry.tag);
      if (results.length >= 8) break;
    }
  }

  // DBの動的サジェスト（30人以上・TAG_DICTIONARYにないもの）を追加
  for (const s of _dynamicSuggestions) {
    if (seen.has(s.name)) continue;
    if (s.name.toLowerCase().includes(lower)) {
      const bigCatLabel = { eat:"食べる・飲む", see:"見る・感じる", do:"体験・やる", relax:"整う・癒し", enjoy:"楽しむ", stay:"泊まる" }[s.big_cat] || "その他";
      results.push({ tag: s.name, aliases: [], group: `👥 みんなの人気（${s.count}人）`, _dynamic: true });
      seen.add(s.name);
      if (results.length >= 10) break;
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

// ===== 共通エントリーカード（デフォルト表示）=====
// isSelf=true: 自分のリスト（★表示・展開あり）
// isSelf=false: フレンドのリスト（★非表示・展開なし）
function EntryDetailModal({ entry, isSelf, onClose, onEdit, onDelete, rank, bigCat }) {
  if (!entry) return null;
  const rec = REC_LEVELS.find(r => r.value === entry.rec);
  const mapsUrl = entry.placeData?.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(entry.name + " " + (entry.prefecture || ""))}`;
  const medalStyles = {
    1: { bg: "linear-gradient(135deg,#C8A050,#E8C060)", label: "1位" },
    2: { bg: "linear-gradient(135deg,#9AA8B8,#B8C4D0)", label: "2位" },
    3: { bg: "linear-gradient(135deg,#A06030,#C08050)", label: "3位" },
  };
  const medal = rank ? medalStyles[rank] : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,12,4,0.55)", zIndex: 99999, display: "flex", alignItems: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 600, margin: "0 auto", background: "#FAF7F2",
        borderRadius: "20px 20px 0 0", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 -4px 30px rgba(20,12,4,0.3)",
      }}>
        {/* ハンドル */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 2px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(160,120,60,0.3)" }}/>
        </div>

        {/* 写真エリア */}
        <div style={{ width: "100%", height: entry.photo ? 200 : 140, background: "linear-gradient(135deg,#3A2A18,#2A1E10)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {entry.photo ? (
            <img src={entry.photo} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          ) : (
            <div style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}>{bigCat ? <BigCatIcon id={bigCat} size={64}/> : "📍"}</div>
          )}
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: 16 }}>
          {/* メダル＋カテゴリ */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            {medal && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: medal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: "0 3px 8px rgba(200,160,80,0.4)" }}>{medal.label}</div>
            )}
            <div style={{ fontSize: 11, color: C.sub }}>人生{entry.categoryName}{entry.prefecture ? ` · ${entry.prefecture}` : ""}</div>
          </div>

          {/* 名前 */}
          <div style={{ fontFamily: "Georgia,serif", fontSize: 20, color: C.ink, fontWeight: 700, marginBottom: 8 }}>{entry.name}</div>

          {/* ★・おすすめ度 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {isSelf && <span style={{ fontSize: 17, color: "#C8A050", fontWeight: 700 }}>★ {(entry.star ?? 0).toFixed(1)}</span>}
            {rec && <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: rec.bg, color: rec.color, border: `0.5px solid ${rec.color}40` }}>{rec.short}</span>}
          </div>

          {/* 訪問日 */}
          {entry.visitDate && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13, color: "#5A4E44" }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>📅</span>{entry.visitDate} 訪問
            </div>
          )}
          {/* 住所 */}
          {entry.placeData?.address && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13, color: "#5A4E44" }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>📍</span>{entry.placeData.address}
            </div>
          )}

          {/* タグ */}
          {entry.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "12px 0" }}>
              {entry.tags.map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(160,120,60,0.1)", color: "#8A7050", border: "0.5px solid rgba(160,120,60,0.2)" }}>{t}</span>
              ))}
            </div>
          )}

          {/* コメント */}
          {entry.comment && (
            <div style={{ fontSize: 13, color: "#5A4E44", lineHeight: 1.8, padding: "12px 14px", background: "#FFF", borderRadius: 10, borderLeft: "3px solid #C8A050", fontStyle: "italic", margin: "12px 0" }}>
              「{entry.comment}」
            </div>
          )}

          {/* Googleマップで開く */}
          {entry.placeData?.lat && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, background: "#EEF4FF", border: "0.5px solid rgba(106,144,200,0.3)", color: "#185FA5", fontSize: 13, fontWeight: 700, textDecoration: "none", marginTop: 4, marginBottom: 4 }}>
              🗺 Googleマップで開く
            </a>
          )}

          {/* 編集・削除（自分の記録のみ） */}
          {isSelf && (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => { onEdit(); onClose(); }} style={{ flex: 1, padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, border: "1px solid #E0D5C0", background: "#FFFFFF", color: C.ink, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                ✏️ 編集
              </button>
              <button onClick={async () => { if (confirm("削除しますか？")) { await onDelete(); onClose(); } }} style={{ flex: 1, padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, border: "1px solid #FFCDD2", background: "#FFF5F5", color: "#D85050", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🗑 削除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryCardDisplay({ entry, rank, isSelf, expanded, onToggle, onEdit, onDelete }) {
  const mapsUrl = entry.placeData?.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(entry.name + " " + (entry.prefecture || ""))}`;
  const rankBgs = [
    "linear-gradient(135deg,#D4A843,#E8C060)",
    "linear-gradient(135deg,#9AA8B8,#B8C4D0)",
    "linear-gradient(135deg,#A06030,#C08050)",
  ];
  return (
    <div onClick={onToggle || undefined} style={{ background: "#FFFFFF", borderRadius: 16, marginBottom: 8, border: `1px solid ${expanded ? C.terra : C.border}`, overflow: "hidden", boxShadow: expanded ? "0 4px 16px rgba(232,147,90,0.12)" : "0 2px 8px rgba(24,22,15,0.05)", cursor: onToggle ? "pointer" : "default" }}>
      {/* メイン表示 */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {/* ランクバッジ（rankがある場合） */}
          {rank && (
            <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: rank <= 3 ? rankBgs[rank-1] : C.border, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: rank <= 3 ? "0 2px 8px rgba(0,0,0,0.15)" : "none", alignSelf: "flex-start", marginTop: 2 }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: rank <= 3 ? "#FFF" : C.muted }}>
                {["1位","2位","3位"][rank-1] || rank}
              </span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* カテゴリ名 */}
            {entry.categoryName && (
              <div style={{ fontSize: 10, color: C.sub, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>{entry.bigCat && <BigCatIcon id={entry.bigCat} size={14}/>} 人生{entry.categoryName}</div>
            )}
            {/* 店名 */}
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{entry.name}</div>
            {/* ★・おすすめ度・都道府県 */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
              {isSelf && entry.star > 0 && <StarDisplay value={entry.star}/>}
              <RecBadge value={entry.rec}/>
              {entry.prefecture && <span style={{ fontSize: 10, color: C.sub }}>{entry.prefecture}</span>}
            </div>
            {/* 住所 */}
            {entry.placeData?.address && (
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>📍 {entry.placeData.address}</div>
            )}
          </div>
          {/* 右側：地図ボタン */}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, fontSize: 9, color: "#4A90D9", background: "#F0F6FF", border: "1px solid #C5DCF5", borderRadius: 8, padding: "6px 8px", textDecoration: "none", minWidth: 44, flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>🗺</span>
            <span>地図</span>
          </a>
        </div>
      </div>
      {/* 展開パネル（自分のみ）*/}
      {isSelf && expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", background: "#FAFAF8" }}>
          {entry.visitDate && <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>📅 {entry.visitDate}</div>}
          {entry.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {entry.tags.map(t => <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#F0EDE8", color: C.sub }}>{t}</span>)}
            </div>
          )}
          {entry.comment && (
            <div style={{ fontSize: 13, color: "#5A4E44", lineHeight: 1.7, padding: "9px 11px", background: "#FFF", borderRadius: 10, borderLeft: `3px solid ${C.terra}`, fontStyle: "italic", marginBottom: 8 }}>
              「{entry.comment}」
            </div>
          )}
          {entry.photo && (
            <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden" }}>
              <img src={entry.photo} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}/>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onEdit} style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.ink, background: "#FFF", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px", cursor: "pointer", fontFamily: "inherit" }}>✏️ 編集</button>
            <button onClick={onDelete} style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#E06060", background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 10, padding: "9px", cursor: "pointer", fontFamily: "inherit" }}>🗑 削除</button>
          </div>
        </div>
      )}
      {/* フレンドのみ：展開時にコメント表示 */}
      {!isSelf && expanded && entry.comment && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 14px 10px", background: "#FAFAF8" }}>
          <div style={{ fontSize: 12, color: "#5A4E44", fontStyle: "italic" }}>「{entry.comment}」</div>
        </div>
      )}
    </div>
  );
}

// ===== おすすめ度バッジ =====
function RecBadge({ value, large }) {
  const rec = REC_LEVELS.find(r => r.value === value);
  if (!rec) return null;
  return (
    <span style={{
      fontSize: large ? 13 : 10, fontWeight: 700,
      padding: large ? "4px 12px" : "3px 9px", borderRadius: 20,
      color: rec.color, background: rec.bg,
      whiteSpace: "nowrap", display: "inline-block", letterSpacing: 0.2,
    }}>{rec.short}</span>
  );
}

// ===== ★表示 =====
function StarDisplay({ value, size = "small" }) {
  if (!value || value === 0) return null;
  const isLarge = size === "large";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: isLarge ? 14 : 11, fontWeight: 700,
      color: "#C8941A",
    }}>
      <span>★</span>
      <span>{value.toFixed(1)}</span>
    </span>
  );
}

// ===== ランクバー =====
function RankBar({ rank, rec }) {
  const r = REC_LEVELS.find(rv => rv.value === rec) || REC_LEVELS[1];
  const ws = [100, 72, 54, 42, 34];
  const w = ws[Math.min(rank - 1, 4)];
  const labels = ["1位","2位","3位","4位","5位"];
  const rankBgs = [
    "linear-gradient(135deg,#D4A843,#E8C060)",
    "linear-gradient(135deg,#9AA8B8,#B8C4D0)",
    "linear-gradient(135deg,#A06030,#C08050)",
  ];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{
        width:28, height:28, borderRadius:8, flexShrink:0,
        background: rank <= 3 ? rankBgs[rank-1] : C.border,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: rank <= 3 ? "0 2px 8px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.3)" : "none",
      }}>
        <span style={{ fontSize:8, fontWeight:900, color: rank <= 3 ? "#FFF" : C.muted, letterSpacing:0.5 }}>
          {labels[rank-1] || `${rank}`}
        </span>
      </div>
      <div style={{ flex:1, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${w}%`, height:"100%", borderRadius:2, background:`linear-gradient(90deg,${r.bar},${r.bar}88)` }}/>
      </div>
    </div>
  );
}

// ===== ランクバッジ =====
function RankBadge({ rank }) {
  const rankBgs = [
    "linear-gradient(135deg,#D4A843,#E8C060)",
    "linear-gradient(135deg,#9AA8B8,#B8C4D0)",
    "linear-gradient(135deg,#A06030,#C08050)",
  ];
  const labels = ["1位","2位","3位"];
  if (rank <= 3) return (
    <div style={{
      width:38, height:38, borderRadius:12, flexShrink:0,
      background: rankBgs[rank-1],
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:"0 3px 10px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.3)",
    }}>
      <span style={{ fontSize:8, fontWeight:900, color:"#FFF", letterSpacing:0.5 }}>{labels[rank-1]}</span>
    </div>
  );
  return (
    <div style={{
      width:38, height:38, borderRadius:"50%",
      background: C.border, color: C.sub,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:"bold", fontSize:14, flexShrink:0,
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
    function init() {
      try {
        acRef.current = new window.google.maps.places.AutocompleteService();
        // mapDivRefがnullの場合はdocument.createElement("div")を使う
        const mapDiv = mapDivRef.current || document.createElement("div");
        psRef.current = new window.google.maps.places.PlacesService(mapDiv);
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      } catch(e) {
        console.warn("PlacesInput init error:", e);
      }
    }
    // すでにAPIが読み込まれている場合はすぐ初期化
    if (window.google?.maps?.places?.AutocompleteService) {
      init();
    } else {
      loadGoogleMaps(init);
    }
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
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
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
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initial?.name || "");
  const [prefecture, setPrefecture] = useState(initial?.prefecture || "");
  const [placeData, setPlaceData] = useState(initial?.placeData || null);
  const [rec, setRec] = useState(initial?.rec ?? 3);
  const [star, setStar] = useState(initial?.star ?? 0);
  const [tags, setTags] = useState(initial?.tags || []);
  const [tagGroup, setTagGroup] = useState("シーン");
  const [customTag, setCustomTag] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [comment, setComment] = useState(initial?.comment || "");
  const [visitDate, setVisitDate] = useState(initial?.visitDate || "");
  const [photo, setPhoto] = useState(initial?.photo || null);
  const fileInputRef = useRef(null);

  const PREFS = ["北海道","青森","岩手","宮城","秋田","山形","福島","茨城","栃木","群馬","埼玉","千葉","東京","神奈川","新潟","富山","石川","福井","山梨","長野","岐阜","静岡","愛知","三重","滋賀","京都","大阪","兵庫","奈良","和歌山","鳥取","島根","岡山","広島","山口","徳島","香川","愛媛","高知","福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄","海外"];

  function handlePlaceSelect(place) {
    if (place) { setPlaceData(place); setName(place.name); setPrefecture(place.prefecture || ""); }
    else setPlaceData(null);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setPhoto(resized);
  }

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);
  }

  function addCustomTag() {
    const t = customTag.trim().startsWith("#") ? customTag.trim() : `#${customTag.trim()}`;
    if (t.length > 1 && !tags.includes(t)) setTags(prev=>[...prev,t]);
    setCustomTag("");
  }

  const starPct = (star / 5) * 100;
  const starLabel = star === 0 ? "未評価" : star < 2 ? "もう一度考えるかも" : star < 3 ? "まあまあ良かった" : star < 4 ? "良かった！" : star < 4.5 ? "とても良かった！" : star < 5 ? "最高レベル！" : "🏆 完璧・人生最高";

  const canNext1 = MAPS_KEY ? !!(placeData?.name?.length > 0) : name.trim().length > 0;
  const canNext2 = star > 0 && rec !== null;

  function handleSave() {
    const finalName = (MAPS_KEY ? placeData?.name : name)?.trim() || name.trim();
    if (!finalName) return;
    onSave({ name: finalName, prefecture, placeData: placeData || null, rec, star, tags, comment, visitDate, photo, id: initial?.id || Date.now() });
  }

  // ステップドット
  function StepDot({ n }) {
    const done = step > n; const active = step === n;
    return (
      <div style={{ display:"flex", alignItems:"center" }}>
        <div style={{ width:24, height:24, borderRadius:"50%", background: done?C.ink:active?`linear-gradient(135deg,${C.terra},${C.gold})`:C.border, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:active?"0 3px 10px rgba(232,147,90,0.4)":"none" }}>
          {done ? <span style={{ fontSize:12, color:"#FFF" }}>✓</span>
                : <span style={{ fontSize:10, fontWeight:800, color:active?"#FFF":C.muted }}>{n}</span>}
        </div>
        {n < 3 && <div style={{ width:32, height:2, background:step>n?C.ink:C.border }}/>}
      </div>
    );
  }

  return (
    <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, width:"100%", boxSizing:"border-box", overflow:"hidden", boxShadow:"0 4px 20px rgba(24,22,15,0.08)" }}>
      {/* ステップヘッダー */}
      <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}`, background:"#FAFAF8" }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.sub, marginBottom:10 }}>
          {step===1?"場所を選ぶ":step===2?"評価する":"詳細を記録"}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:0 }}>
          <StepDot n={1}/><StepDot n={2}/><StepDot n={3}/>
        </div>
      </div>

      <div style={{ padding:"16px" }}>

        {/* STEP 1: 場所 */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>場所・店名 *</label>
              <PlacesInput onSelect={handlePlaceSelect} initialName={initial?.name || ""}/>
              {!MAPS_KEY && (
                <input value={name} onChange={e=>setName(e.target.value)}
                  placeholder={`例：おすすめの${categoryName}`}
                  style={{ ...inputStyle, marginTop:8 }}/>
              )}
            </div>
            {/* 都道府県 */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>都道府県</label>
              <div style={{ position:"relative" }}>
                <select value={prefecture} onChange={e=>setPrefecture(e.target.value)}
                  style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0, zIndex:2, cursor:"pointer" }}>
                  <option value="">選択</option>
                  {PREFS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                <div style={{ padding:"12px 14px", border:`1.5px solid ${prefecture?C.terra:C.border}`, borderRadius:10, fontSize:16, background:prefecture?"#FFF8F5":C.white, color:prefecture?C.ink:C.muted, display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:48, pointerEvents:"none" }}>
                  <span>{prefecture||"選択してください"}</span><span style={{ fontSize:12, color:C.muted }}>▼</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: 評価 */}
        {step === 2 && (
          <div>
            {/* ★スライダー */}
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>⭐ 自分の評価（自分だけに見えます）</label>
              <div style={{ background:"#F8F6F4", borderRadius:16, padding:"16px", border:`1px solid ${C.border}` }}>
                {/* 星表示 */}
                <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:12 }}>
                  {[1,2,3,4,5].map(i=>{
                    const filled = star >= i;
                    const partial = !filled && i === Math.floor(star)+1 && (star%1)>0;
                    return (
                      <div key={i} style={{ position:"relative", width:32, height:32 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ position:"absolute" }}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#EEEBE6" stroke="#E0DDD8" strokeWidth="1"/>
                        </svg>
                        {(filled||partial) && (
                          <div style={{ position:"absolute", overflow:"hidden", width:filled?"100%":`${(star%1)*100}%` }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={C.gold} stroke={C.gold} strokeWidth="1"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign:"center", marginBottom:12 }}>
                  <span style={{ fontSize:32, fontWeight:900, color:C.ink, fontFamily:"Georgia,serif" }}>{star.toFixed(1)}</span>
                  <span style={{ fontSize:12, color:C.sub, marginLeft:4 }}>/ 5.0</span>
                </div>
                <input type="range" min="0" max="5" step="0.1" value={star} onChange={e=>setStar(parseFloat(e.target.value))}
                  style={{ width:"100%", height:6, borderRadius:3, WebkitAppearance:"none", appearance:"none", background:`linear-gradient(90deg,${C.gold} ${starPct}%,#EEEBE6 ${starPct}%)`, outline:"none", cursor:"pointer" }}/>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  {[0,1,2,3,4,5].map(n=><span key={n} style={{ fontSize:9, color:C.muted, fontWeight:600 }}>{n}</span>)}
                </div>
                <div style={{ textAlign:"center", fontSize:11, color:C.sub, marginTop:8 }}>{starLabel}</div>
              </div>
            </div>

            {/* おすすめ度 */}
            <div style={{ marginBottom:4 }}>
              <label style={labelStyle}>👥 おすすめ度（フレンドにも見えます）</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {REC_LEVELS.map(r=>(
                  <button key={r.value} onClick={()=>setRec(r.value)} style={{
                    width:"100%", borderRadius:14, padding:"12px 16px",
                    fontSize:14, fontFamily:"inherit", cursor:"pointer",
                    textAlign:"left", display:"flex", alignItems:"center", gap:12,
                    fontWeight:rec===r.value?700:400,
                    border:`1.5px solid ${rec===r.value?r.color:C.border}`,
                    background:rec===r.value?r.bg:C.white,
                    color:rec===r.value?r.color:C.sub,
                    boxShadow:rec===r.value?`0 3px 12px ${r.color}20`:"none",
                  }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${rec===r.value?r.color:C.border}`, background:rec===r.value?r.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {rec===r.value && <span style={{ fontSize:10, color:"#FFF" }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:rec===r.value?700:500 }}>{r.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: 詳細 */}
        {step === 3 && (
          <div>
            {/* コメント */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>コメント（任意）</label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)}
                placeholder="どんな体験でしたか？" rows={3}
                style={{ ...inputStyle, resize:"vertical" }}/>
            </div>

            {/* 訪問日 */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>訪問日（任意）</label>
              <input type="date" value={visitDate} onChange={e=>setVisitDate(e.target.value)}
                style={{ ...inputStyle, colorScheme:"light" }}/>
              {visitDate && (
                <div style={{ fontSize:12, color:C.terra, marginTop:4 }}>
                  📅 {new Date(visitDate+"T00:00:00").toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"})}
                </div>
              )}
            </div>

            {/* タグ */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ ...labelStyle, marginBottom:0 }}>タグ（任意）</label>
                <button onClick={()=>setShowTags(!showTags)} style={{ fontSize:12, color:C.terra, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
                  {showTags?"閉じる":"タグを追加"}
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                  {tags.map(t=>(
                    <button key={t} onClick={()=>toggleTag(t)} style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, background:`linear-gradient(135deg,${C.terra}18,${C.gold}18)`, color:C.terra, border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
                      {t} <span style={{ fontSize:10 }}>✕</span>
                    </button>
                  ))}
                </div>
              )}
              {showTags && (
                <div style={{ background:"#F8F6F4", borderRadius:14, padding:"12px", border:`1px solid ${C.border}` }}>
                  {/* グループタブ */}
                  <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10 }}>
                    {Object.keys(EXPERIENCE_TAGS).map(g=>(
                      <button key={g} onClick={()=>setTagGroup(g)} style={{ flexShrink:0, padding:"5px 12px", borderRadius:20, border:"none", background:tagGroup===g?C.ink:"#EEEBE6", color:tagGroup===g?"#FFF":C.sub, fontSize:11, fontWeight:tagGroup===g?700:400, cursor:"pointer", fontFamily:"inherit" }}>{g}</button>
                    ))}
                  </div>
                  {/* タグボタン */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                    {EXPERIENCE_TAGS[tagGroup].map(t=>{
                      const on = tags.includes(t);
                      return (
                        <button key={t} onClick={()=>toggleTag(t)} style={{ padding:"6px 12px", borderRadius:20, border:`1.5px solid ${on?C.ink:C.border}`, background:on?C.ink:C.white, color:on?"#FFF":C.sub, fontSize:11, fontWeight:on?700:400, cursor:"pointer", fontFamily:"inherit" }}>{t}</button>
                      );
                    })}
                  </div>
                  {/* 自由入力 */}
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={customTag} onChange={e=>setCustomTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustomTag()}
                      placeholder="#自由入力" style={{ ...inputStyle, fontSize:13, padding:"8px 12px", flex:1 }}/>
                    <button onClick={addCustomTag} style={{ background:C.ink, color:"#FFF", border:"none", borderRadius:10, padding:"0 14px", fontSize:13, fontWeight:700, cursor:"pointer" }}>追加</button>
                  </div>
                </div>
              )}
            </div>

            {/* 写真 */}
            <div style={{ marginBottom:4 }}>
              <label style={labelStyle}>写真（任意）</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display:"none" }}/>
              {photo ? (
                <div style={{ position:"relative", borderRadius:12, overflow:"hidden", border:`1px solid ${C.border}` }}>
                  <img src={photo} alt="写真" style={{ width:"100%", height:160, objectFit:"cover", display:"block" }}/>
                  <button onClick={()=>setPhoto(null)} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.55)", border:"none", borderRadius:"50%", width:30, height:30, color:"#fff", fontSize:14, cursor:"pointer" }}>✕</button>
                </div>
              ) : (
                <button onClick={()=>fileInputRef.current?.click()} style={{ width:"100%", height:80, border:`2px dashed ${C.border}`, borderRadius:12, background:"#FAFAF9", cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, touchAction:"manipulation" }}>
                  <span style={{ fontSize:22 }}>📷</span>
                  <span style={{ fontSize:12, color:C.muted }}>タップして写真を追加</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ボタン */}
      <div style={{ padding:"12px 16px 16px", borderTop:`1px solid ${C.border}`, background:"#FAFAF8", display:"flex", gap:8 }}>
        {step > 1 && (
          <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, padding:"13px", borderRadius:14, border:`1.5px solid ${C.border}`, background:C.white, fontSize:14, fontWeight:700, color:C.ink, cursor:"pointer" }}>戻る</button>
        )}
        {step < 3 ? (
          <button onClick={()=>(step===1?canNext1:canNext2)&&setStep(s=>s+1)} style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:(step===1?canNext1:canNext2)?`linear-gradient(135deg,${C.terra},${C.gold})`:C.border, fontSize:14, fontWeight:700, color:(step===1?canNext1:canNext2)?"#FFF":C.muted, cursor:(step===1?canNext1:canNext2)?"pointer":"not-allowed", boxShadow:(step===1?canNext1:canNext2)?`0 4px 16px rgba(232,147,90,0.35)`:"none" }}>次へ →</button>
        ) : (
          <button onClick={handleSave} style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.terra},${C.gold})`, fontSize:14, fontWeight:700, color:"#FFF", cursor:"pointer", boxShadow:`0 4px 16px rgba(232,147,90,0.35)` }}>✓ 記録する</button>
        )}
        {step === 1 && (
          <button onClick={onCancel} style={{ flex:1, padding:"13px", borderRadius:14, border:`1.5px solid ${C.border}`, background:C.white, fontSize:14, color:C.sub, cursor:"pointer" }}>キャンセル</button>
        )}
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
function CategoryView({ category, data, accentColor, onUpdate, onBack, userId, readOnly = false, ownerName = null }) {
  // ⑨ おすすめ度でソートされた状態で管理
  const [entries, setEntries] = useState(() => sortEntriesByRec(data.entries || []));
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [sortMode, setSortMode] = useState("rank");
  const [saving, setSaving] = useState(false);
  const itemRefs = useRef([]);
  const { activeDrag, overIdx, onTouchStart, onTouchEnd, onTouchMove } = useTouchDnD(entries, setEntries);

  useEffect(() => { onUpdate({ ...data, entries }); }, [entries]);

  // ⑨ エントリー保存（Supabase）
  async function saveEntry(entry) {
    setSaving(true);
    // 写真はlocalStorageに保存（base64は大きいのでDB外）
    if (entry.photo) {
      try { localStorage.setItem(`photo_${entry.id}`, entry.photo); } catch {}
    }
    const dbEntry = {
      user_id: userId,
      category_id: category.id,
      name: entry.name,
      prefecture: entry.prefecture || "",
      rec: entry.rec ?? 2,
      star: entry.star ?? 0,
      tags: entry.tags || [],
      comment: entry.comment || "",
      visit_date: entry.visitDate || null,
      place_data: entry.placeData || null,
      rank_order: 0,
    };

    let savedId = entry.id;
    if (editingEntry) {
      // 既存エントリー更新
      const { error: updateError } = await supabase.from("entries").update(dbEntry).eq("id", entry.id);
      if (updateError) { console.error("Entry update error:", updateError); alert("更新エラー: " + updateError.message); setSaving(false); return; }
    } else {
      // 新規エントリー追加
      const { data: newEnt, error: insertError } = await supabase.from("entries").insert(dbEntry).select().single();
      if (insertError) { console.error("Entry insert error:", insertError); alert("保存エラー: " + insertError.message); setSaving(false); return; }
      if (newEnt) {
        savedId = newEnt.id;
        if (entry.photo) {
          try { localStorage.setItem(`photo_${savedId}`, entry.photo); } catch {}
        }
      }
    }

    const finalEntry = { ...entry, id: savedId };
    let next;
    if (editingEntry) {
      next = entries.map(e => e.id === entry.id ? finalEntry : e);
    } else {
      next = [...entries, finalEntry];
    }
    next = sortEntriesByStar(next);
    setEntries(next);
    setShowForm(false);
    setEditingEntry(null);
    setSaving(false);
  }

  async function deleteEntry(id) {
    if (!confirm("削除しますか？")) return;
    await supabase.from("entries").delete().eq("id", id);
    try { localStorage.removeItem(`photo_${id}`); } catch {}
    setEntries(entries.filter(e => e.id !== id));
    setExpandedId(null);
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
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#E8DDD0", fontSize: 15, cursor: "pointer", padding: "8px 14px", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, touchAction: "manipulation" }}><span>←</span> 戻る</button>
        {ownerName && (
          <div style={{ fontSize: 11, color: C.terra, fontWeight: "bold", marginBottom: 4, letterSpacing: 0.5 }}>
            👤 {ownerName} さんの人生ノート
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: "bold" }}>{emoji} 人生{category.name}</div>
        <div style={{ fontSize: 12, color: "#9A8A7A", marginTop: 3 }}>{entries.length}件記録済み</div>
      </div>

      <div style={{ padding: "14px 16px", maxWidth: 600, margin: "0 auto", boxSizing: "border-box", width: "100%" }}>
        {/* ⑩ ソート切替 */}
        {!readOnly && entries.length > 1 && (
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

        {!readOnly && !showForm && !editingEntry && (
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
                draggable={!readOnly}
                onDragStart={() => !readOnly && handleDragStart(idx)}
                onDragOver={e => !readOnly && handleDragOver(e, idx)}
                onDrop={() => !readOnly && handleDrop(idx)}
                onDragEnd={() => { if (!readOnly) { setDragging(null); setDragOver(null); } }}
                onTouchStart={() => !readOnly && onTouchStart(idx)}
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
                    <div style={{ fontWeight: "bold", fontSize: 17, color: C.ink, marginBottom: 6, fontFamily: "Georgia, serif" }}>{entry.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {!readOnly && entry.star > 0 && <StarDisplay value={entry.star}/>}
                      <RecBadge value={entry.rec} large />
                      {entry.prefecture && (
                        <span style={{ fontSize: 11, color: C.sub, background: C.border, padding: "3px 9px", borderRadius: 10 }}>{entry.prefecture}</span>
                      )}
                    </div>
                    {entry.tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                        {entry.tags.map(t => (
                          <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#F0EDE8", color: C.sub }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {entry.visitDate && (
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>📅 {entry.visitDate}</div>
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
                      {!readOnly && <button onClick={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                        style={{ fontSize: 13, color: C.muted, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                        {isExpanded ? "閉じる ▲" : "編集・削除 ▼"}
                      </button>}
                    </div>
                  </div>

                  {!readOnly && <div style={{ color: "#CCC", fontSize: 20, flexShrink: 0, alignSelf: "center", userSelect: "none" }}>⠿</div>}
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
    ? [
        ...TAG_DICTIONARY.filter(t => [t.tag, ...t.aliases].some(a => a.toLowerCase().includes(query.toLowerCase()))),
        ..._dynamicSuggestions
          .filter(s => s.name.toLowerCase().includes(query.toLowerCase()) && !TAG_DICTIONARY.find(t => t.tag === s.name))
          .map(s => ({ tag: s.name, aliases: [], group: `👥 みんなの人気（${s.count}人）`, _dynamic: true }))
      ]
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "28px 20px 14px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <LogoBanner darkBg={true} />
        </div>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit", touchAction: "manipulation" }}>‹ 戻る</button>
        <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>カテゴリを選ぶ</div>
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
                    style={{ background: C.white, border: `1.5px solid ${t._dynamic ? C.terra + "40" : C.border}`, borderRadius: 20, padding: "9px 16px", fontSize: 14, cursor: "pointer", color: "#333", fontFamily: "inherit", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 4 }}>
                    {t._dynamic ? "👥" : GROUP_EMOJIS[t.group]} {t.tag}
                    {t._dynamic && <span style={{ fontSize: 11, color: C.terra }}>{t.group.match(/\d+/)?.[0]}人</span>}
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

        {/* 👥 みんなの人気カテゴリ（30人以上） */}
        {!query.trim() && _dynamicSuggestions.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#888", marginBottom: 10, letterSpacing: 0.5 }}>👥 みんなの人気カテゴリ</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {_dynamicSuggestions
                .filter(s => !TAG_DICTIONARY.find(t => t.tag === s.name))
                .map(s => (
                  <button key={s.name} onClick={() => onSelect(s.name)}
                    style={{ background: C.white, border: `1.5px solid ${C.terra}40`, borderRadius: 20, padding: "9px 16px", fontSize: 14, cursor: "pointer", color: "#333", fontFamily: "inherit", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>👥</span> {s.name}
                    <span style={{ fontSize: 11, color: C.terra }}>{s.count}人</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== マップビュー =====
// ===== 地図コア（ピン表示）=====
function MapCore({ entries, onSelectPlace, selectedPlace }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  // 大カテゴリごとの簡易ピクトグラム（ピン内に収まるシンプルな白抜き図形）
  const BIGCAT_PIN_GLYPH = {
    eat:   `<path d="M-6 -4 Q-6 4 0 4 Q6 4 6 -4 L5 -7 L-5 -7 Z M-5 -9 L-5 -2 M-3 -9 L-3 -2 M-1 -9 L-1 -2" stroke="white" stroke-width="1.3" fill="white" stroke-linecap="round" stroke-linejoin="round"/>`,
    see:   `<path d="M-9 0 Q0 -8 9 0 Q0 8 -9 0 Z" stroke="white" stroke-width="1.3" fill="none"/><circle cx="0" cy="0" r="3.3" fill="white"/>`,
    do:    `<path d="M-9 3 Q-4 -2 0 3 Q4 -2 9 3" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="2" cy="-6" r="2.6" fill="white"/>`,
    relax: `<path d="M-7 -8 Q-9 -3 -6 1 M0 -9 Q-2 -3 1 2 M7 -8 Q9 -3 6 1" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.9"/><path d="M-7 2 Q0 -1 7 2 L7 7 Q0 9 -7 7 Z" fill="white"/>`,
    enjoy: `<path d="M-7 -6 Q0 -10 7 -6 L7 2 Q0 6 -7 2 Z" stroke="white" stroke-width="1.4" fill="none"/><circle cx="-3" cy="-2" r="1.4" fill="white"/><circle cx="3" cy="-2" r="1.4" fill="white"/>`,
    stay:  `<path d="M-8 4 L-8 -3 L0 -8 L8 -3 L8 4 Z" stroke="white" stroke-width="1.4" fill="none" stroke-linejoin="round"/><rect x="-3" y="-1" width="6" height="5" fill="white"/>`,
  };

  // カスタムピンSVGを生成（吹き出し型＋大カテゴリの絵柄）
  function createPinIcon(color, isSelected = false, bigCat = "eat") {
    const size = isSelected ? 44 : 36;
    const glyph = BIGCAT_PIN_GLYPH[bigCat] || BIGCAT_PIN_GLYPH.eat;
    const svg = `<svg width="${size}" height="${size + 8}" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
      </filter>
      <circle cx="22" cy="20" r="${isSelected ? 18 : 15}" fill="${color}" filter="url(#shadow)"/>
      <polygon points="16,30 28,30 22,42" fill="${color}" filter="url(#shadow)"/>
      <g transform="translate(22,20)">${glyph}</g>
    </svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(size, size + 8),
      anchor: new window.google.maps.Point(size / 2, size + 8),
    };
  }

  useEffect(() => {
    function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 5, center: { lat: 36.5, lng: 137.0 },
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }, { featureType: "poi", stylers: [{ visibility: "off" }] }],
        clickableIcons: false,
      });
      setMapReady(true);
    }
    if (window.google?.maps?.Map) {
      initMap();
    } else {
      loadGoogleMaps(initMap);
    }
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    entries.forEach(entry => {
      const color = entry.accentColor || C.terra;
      const isSelected = selectedPlace?.id === entry.id;
      const marker = new window.google.maps.Marker({
        position: { lat: entry.placeData.lat, lng: entry.placeData.lng },
        map: mapInstanceRef.current,
        title: entry.name,
        icon: createPinIcon(color, isSelected, entry.bigCat),
        zIndex: isSelected ? 100 : 1,
      });
      marker.addListener("click", () => {
        onSelectPlace(entry);
        mapInstanceRef.current.setZoom(15);
        mapInstanceRef.current.setCenter({ lat: entry.placeData.lat, lng: entry.placeData.lng });
      });
      markersRef.current.push(marker);
    });
    if (entries.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      entries.forEach(e => bounds.extend({ lat: e.placeData.lat, lng: e.placeData.lng }));
      mapInstanceRef.current.fitBounds(bounds, { padding: 60 });
    } else if (entries.length === 1) {
      mapInstanceRef.current.setCenter({ lat: entries[0].placeData.lat, lng: entries[0].placeData.lng });
      mapInstanceRef.current.setZoom(15);
    }
  }, [mapReady, entries.length, selectedPlace?.id]);

  // 選択時にズーム＋センター（iOS対応）
  useEffect(() => {
    if (!selectedPlace || !mapInstanceRef.current) return;
    const lat = selectedPlace.placeData.lat;
    const lng = selectedPlace.placeData.lng;
    // iOSはsetZoom→setCenterの順で確実に動く
    mapInstanceRef.current.setZoom(15);
    mapInstanceRef.current.setCenter({ lat, lng });
    // 念のため少し遅らせて再セット
    setTimeout(() => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.setZoom(15);
      mapInstanceRef.current.setCenter({ lat, lng });
    }, 150);
  }, [selectedPlace]);

  return <div ref={mapRef} style={{ height: 300, flexShrink: 0, background: "#E8F0E4", position: "relative", zIndex: 1 }} />;
}

function MapView({ categories, onBack, followingUsers, allFriendData, user, onOpenMenu, onEditEntry, onDeleteEntry }) {
  const [mapMode, setMapMode] = useState("self");
  const [detailModalEntry, setDetailModalEntry] = useState(null);
  const [activeBigFilter, setActiveBigFilter] = useState("all"); // 大カテゴリフィルター
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [viewingFriend, setViewingFriend] = useState(null);
  const [friendEntries, setFriendEntries] = useState([]);
  const [selectedCatName, setSelectedCatName] = useState(null);
  const [loadingFriend, setLoadingFriend] = useState(false);
  const [mapOpen, setMapOpen] = useState(true); // 地図の開閉（デフォルト開）
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [expandedMapEntryId, setExpandedMapEntryId] = useState(null);
  const [activeSmallFilter, setActiveSmallFilter] = useState(null); // 小カテゴリフィルター（自分）
  const [friendBigFilter, setFriendBigFilter] = useState("all"); // フレンド大カテゴリフィルター
  const [friendSmallFilter, setFriendSmallFilter] = useState(null); // フレンド小カテゴリフィルター

  // 自分のエントリー（座標付き・大カテゴリ・小カテゴリフィルター）
  const myEntries = categories.flatMap(cat => {
    const catBig = cat.bigCat || cat.big_cat || "eat";
    if (activeBigFilter !== "all" && catBig !== activeBigFilter) return [];
    if (activeSmallFilter && cat.name !== activeSmallFilter) return [];
    return (cat.entries || [])
      .filter(e => e.placeData?.lat && e.placeData?.lng)
      .map((e, idx) => ({ ...e, categoryName: cat.name, categoryId: cat.id, rank: idx + 1, accentColor: getAccentColor(categories.indexOf(cat)), bigCat: catBig }));
  });

  // 現在の大カテゴリに属する小カテゴリ一覧
  const smallCatsInBig = activeBigFilter === "all" ? [] :
    categories.filter(c => (c.bigCat || c.big_cat || "eat") === activeBigFilter);

  // フレンド個別エントリー（大カテゴリ・小カテゴリフィルター）
  const filteredFriendEntries = friendEntries.filter(e => {
    if (!e.placeData?.lat || !e.placeData?.lng) return false;
    if (friendBigFilter !== "all") {
      // カテゴリ名からbig_catを推定
      const catBigCat = allFriendData.flatMap(fd => fd.categories)
        .find(c => c.name === e.categoryName)?.big_cat || "eat";
      if (catBigCat !== friendBigFilter) return false;
    }
    if (friendSmallFilter && e.categoryName !== friendSmallFilter) return false;
    return true;
  });

  // フレンドの小カテゴリ一覧（大カテゴリフィルター後）
  const friendSmallCatsInBig = friendBigFilter === "all" ? [] :
    [...new Set(friendEntries
      .filter(e => {
        const catBigCat = allFriendData.flatMap(fd => fd.categories)
          .find(c => c.name === e.categoryName)?.big_cat || "eat";
        return catBigCat === friendBigFilter;
      })
      .map(e => e.categoryName))];

  // カテゴリ横断
  const crossCatEntries = selectedCatName
    ? allFriendData.flatMap((fd, fi) =>
        (fd.categories.find(c => c.name === selectedCatName)?.entries || [])
          .filter(e => e.placeData?.lat && e.placeData?.lng)
          .map((e, idx) => ({ ...e, categoryName: selectedCatName, ownerName: fd.user.name, rank: idx + 1, accentColor: getAccentColor(fi) }))
      )
    : [];

  // フレンドカテゴリ集計
  const friendCatStats = {};
  allFriendData.forEach(fd => {
    fd.categories.forEach(cat => {
      if (!cat.entries.some(e => e.placeData?.lat && e.placeData?.lng)) return;
      if (!friendCatStats[cat.name]) friendCatStats[cat.name] = 0;
      friendCatStats[cat.name]++;
    });
  });
  const friendCatList = Object.entries(friendCatStats)
    .sort((a,b) => b[1]-a[1])
    .filter(([name]) => !catSearchQuery.trim() || name.includes(catSearchQuery.trim()));

  const filteredFriendUsers = friendSearchQuery.trim()
    ? followingUsers.filter(u => u.name?.includes(friendSearchQuery.trim()) || u.user_code?.includes(friendSearchQuery.trim()))
    : followingUsers;

  async function loadFriendEntries(friend) {
    setLoadingFriend(true);
    setViewingFriend(friend);
    const { data: cats } = await supabase.from("categories").select("*").eq("user_id", friend.id);
    if (!cats || cats.length === 0) { setFriendEntries([]); setLoadingFriend(false); return; }
    const catIds = cats.map(c => c.id);
    const { data: ents } = await supabase.from("entries").select("*").in("category_id", catIds).not("place_data", "is", null);
    const result = (ents || [])
      .filter(e => e.place_data?.lat && e.place_data?.lng)
      .map((e, idx) => ({
        id: e.id, name: e.name, prefecture: e.prefecture || "",
        rec: e.rec ?? 2, comment: e.comment || "",
        categoryName: cats.find(c => c.id === e.category_id)?.name || "",
        placeData: e.place_data, rank: idx + 1,
        accentColor: getAccentColor(idx), ownerName: friend.name,
      }));
    setFriendEntries(result);
    setLoadingFriend(false);
  }

  const displayEntries = mapMode === "self" ? myEntries
    : mapMode === "friend" ? filteredFriendEntries
    : mapMode === "category" ? crossCatEntries : [];

  const isFriendSelect = mapMode === "select";

  return (
    <div style={{ height: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
      {/* ヘッダー（固定）*/}
      <div style={{ background: C.ink, color: C.white, padding: "28px 16px 8px", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <LogoBanner darkBg={true} onLogoClick={onBack}/>
          <button onClick={onOpenMenu} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#9A8A7A", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 16 }}>👤</span>
            <span>{user?.name?.split(" ")[0] || "メニュー"}</span>
            <span>▾</span>
          </button>
        </div>
        {/* 自分 / フレンド タブ */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: 2, marginBottom: 6, gap: 2 }}>
          <button onClick={() => { setMapMode("self"); setViewingFriend(null); setSelectedCatName(null); setSelectedPlace(null); }}
            style={{ flex: 1, padding: "5px", borderRadius: 8, border: "none", fontSize: 12, fontFamily: "inherit", cursor: "pointer", background: mapMode === "self" ? C.white : "transparent", color: mapMode === "self" ? C.ink : "rgba(255,255,255,0.7)", fontWeight: mapMode === "self" ? "bold" : "normal", touchAction: "manipulation" }}>
            自分
          </button>
          <button onClick={() => { setMapMode("select"); setViewingFriend(null); setSelectedCatName(null); setSelectedPlace(null); }}
            style={{ flex: 1, padding: "5px", borderRadius: 8, border: "none", fontSize: 12, fontFamily: "inherit", cursor: "pointer", background: mapMode !== "self" ? C.white : "transparent", color: mapMode !== "self" ? C.ink : "rgba(255,255,255,0.7)", fontWeight: mapMode !== "self" ? "bold" : "normal", touchAction: "manipulation", opacity: followingUsers.length === 0 ? 0.4 : 1 }}>
            フレンド({followingUsers.length})
          </button>
        </div>

        {/* 自分：大カテゴリフィルター */}
        {mapMode === "self" && (
          <div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {[{ id:"all", label:"すべて" }, ...BIG_CATS].map(bc => (
                <button key={bc.id} onClick={() => { setActiveBigFilter(bc.id); setActiveSmallFilter(null); setSelectedPlace(null); }}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, background: activeBigFilter === bc.id ? C.terra : "rgba(255,255,255,0.1)", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: C.white, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                  {bc.id === "all" ? <span>✦</span> : <BigCatIcon id={bc.id} size={16}/>}<span>{bc.label}</span>
                </button>
              ))}
            </div>
            {/* 小カテゴリフィルター */}
            {smallCatsInBig?.length > 0 && (
              <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2, marginTop: 6 }}>
                <button onClick={() => setActiveSmallFilter(null)}
                  style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 20, border: "none", background: !activeSmallFilter ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)", color: !activeSmallFilter ? C.ink : "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: !activeSmallFilter ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  すべて
                </button>
                {smallCatsInBig.map(cat => (
                  <button key={cat.id} onClick={() => { setActiveSmallFilter(cat.name); setSelectedPlace(null); }}
                    style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 20, border: "none", background: activeSmallFilter === cat.name ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)", color: activeSmallFilter === cat.name ? C.ink : "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: activeSmallFilter === cat.name ? 700 : 400, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* フレンド状態表示 + フィルター */}
        {mapMode === "friend" && viewingFriend && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#9A8A7A" }}>👤 {viewingFriend.name} さんの地図</span>
              <button onClick={() => { setMapMode("select"); setViewingFriend(null); setFriendEntries([]); setFriendBigFilter("all"); setFriendSmallFilter(null); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>‹ 変更</button>
            </div>
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
              {[{ id:"all", label:"すべて" }, ...BIG_CATS].map(bc => (
                <button key={bc.id} onClick={() => { setFriendBigFilter(bc.id); setFriendSmallFilter(null); setSelectedPlace(null); }}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3, background: friendBigFilter === bc.id ? C.terra : "rgba(255,255,255,0.1)", border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 10, color: C.white, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit" }}>
                  {bc.id === "all" ? <span>✦</span> : <BigCatIcon id={bc.id} size={14}/>}<span>{bc.label}</span>
                </button>
              ))}
            </div>
            {friendSmallCatsInBig.length > 0 && (
              <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2, marginTop: 4 }}>
                <button onClick={() => setFriendSmallFilter(null)}
                  style={{ flexShrink: 0, padding: "3px 9px", borderRadius: 20, border: "none", background: !friendSmallFilter ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)", color: !friendSmallFilter ? C.ink : "rgba(255,255,255,0.8)", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>すべて</button>
                {friendSmallCatsInBig.map(name => (
                  <button key={name} onClick={() => { setFriendSmallFilter(name); setSelectedPlace(null); }}
                    style={{ flexShrink: 0, padding: "3px 9px", borderRadius: 20, border: "none", background: friendSmallFilter === name ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)", color: friendSmallFilter === name ? C.ink : "rgba(255,255,255,0.8)", fontSize: 10, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{name}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {mapMode === "category" && selectedCatName && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#9A8A7A" }}>📂 人生{selectedCatName}</span>
            <button onClick={() => { setMapMode("select"); setSelectedCatName(null); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>‹ 変更</button>
          </div>
        )}
      </div>

      {/* フレンド選択画面 */}
      {isFriendSelect && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: 90 }}>
          {/* フレンドで探す */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>👤 フレンドで探す</div>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input value={friendSearchQuery} onChange={e=>setFriendSearchQuery(e.target.value)}
                placeholder="名前・ユーザーIDで検索"
                style={{ ...inputStyle, paddingLeft: 36 }}/>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredFriendUsers.map(fu => (
                <button key={fu.id} onClick={() => { loadFriendEntries(fu); setMapMode("friend"); setMapOpen(true); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", textAlign: "left", boxShadow: "0 2px 8px rgba(24,22,15,0.05)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${C.terra},${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.white, flexShrink: 0, fontWeight: 700 }}>
                    {fu.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{fu.name}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{fu.user_code}</div>
                  </div>
                  <span style={{ color: C.muted }}>›</span>
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリで探す */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>📂 カテゴリで探す</div>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input value={catSearchQuery} onChange={e=>setCatSearchQuery(e.target.value)}
                placeholder="カテゴリ名で検索"
                style={{ ...inputStyle, paddingLeft: 36 }}/>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {friendCatList.map(([name, count]) => (
                <button key={name} onClick={() => { setSelectedCatName(name); setMapMode("category"); setMapOpen(true); setSelectedPlace(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", boxShadow: "0 2px 8px rgba(24,22,15,0.05)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {getTagEmoji(name)}
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>人生{name}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{count}人が記録</div>
                  </div>
                  <span style={{ color: C.muted }}>›</span>
                </button>
              ))}
              {friendCatList.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>座標付きの記録がありません</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 地図 + リスト */}
      {!isFriendSelect && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {loadingFriend ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <div>読み込み中...</div>
              </div>
            </div>
          ) : (
            <>
              {/* 地図開閉ボタン */}
              <button onClick={() => setMapOpen(!mapOpen)} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 16px", background: C.white, border: "none",
                borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, fontWeight: 600, color: C.terra, width: "100%",
                flexShrink: 0,
              }}>
                <span>🗺</span>
                <span>{mapOpen ? "地図を閉じる ▲" : "地図を表示 ▼"}</span>
                {displayEntries.length > 0 && <span style={{ fontSize: 11, color: C.sub }}>({displayEntries.length}件)</span>}
              </button>

              {/* 地図（折りたたみ）*/}
              {mapOpen && (
                <div style={{ flexShrink: 0 }}>
                  <MapCore entries={displayEntries} onSelectPlace={e => { setSelectedPlace(e); }} selectedPlace={selectedPlace}/>
                </div>
              )}

              {/* ピンタップ時の小プレビュー（地図DOM外・確実にクリック可能） */}
              {selectedPlace && (
                <div style={{ flexShrink: 0, background: "#FFF", padding: "10px 12px", display: "flex", gap: 10, alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: selectedPlace.accentColor || C.terra, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, color: "#fff" }}>
                    📍
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedPlace.name}</div>
                    <div style={{ fontSize: 10, color: C.sub, display: "flex", alignItems: "center", gap: 4 }}>
                      {selectedPlace.star != null && <span style={{ color: "#C8A050", fontWeight: 700 }}>★ {selectedPlace.star.toFixed(1)}</span>}
                      {selectedPlace.prefecture && <span>· {selectedPlace.prefecture}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => setDetailModalEntry({ entry: selectedPlace, isSelf: mapMode === "self", bigCat: selectedPlace.bigCat })}
                    style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#FFF", background: C.ink, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                    詳細
                  </button>
                  <button type="button" onClick={() => setSelectedPlace(null)} style={{ flexShrink: 0, background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
                </div>
              )}

              {/* エントリーリスト */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 90px" }}>
                {displayEntries.length === 0 ? (
                  <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
                    <div>座標付きの記録がありません</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>場所検索で登録すると地図に表示されます</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(selectedPlace ? [selectedPlace, ...displayEntries.filter(e => e.id !== selectedPlace.id)] : displayEntries).map((entry, i) => (
                      <EntryCardDisplay
                        key={`${entry.id}-${i}`}
                        entry={entry}
                        isSelf={mapMode === "self"}
                        expanded={false}
                        onToggle={() => {
                          setSelectedPlace(entry);
                          if (!mapOpen) setMapOpen(true);
                        }}
                        onEdit={null}
                        onDelete={null}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {detailModalEntry && (
        <EntryDetailModal
          entry={detailModalEntry.entry}
          isSelf={detailModalEntry.isSelf}
          bigCat={detailModalEntry.bigCat}
          onClose={() => setDetailModalEntry(null)}
          onEdit={() => onEditEntry && onEditEntry(detailModalEntry.entry)}
          onDelete={async () => { if (onDeleteEntry) await onDeleteEntry(detailModalEntry.entry); setSelectedPlace(null); }}
        />
      )}
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
function LogoBanner({ darkBg = true, onLogoClick }) {
  const textColor = darkBg ? "#E8DDD0" : "#6B5344";
  const goldColor = "#C8941A";
  return (
    <div onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: 10, cursor: onLogoClick ? "pointer" : "default" }}>
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
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
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
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
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
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans','Meiryo',sans-serif", display: "flex", flexDirection: "column" }}>
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
// ===== ボトムナビSVGアイコン =====
function NavIcon({ id, active }) {
  const col = active ? C.terra : "#A0978F";
  const icons = {
    list: (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <defs>
          <linearGradient id="nav_bind" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={active ? "#F0A878" : "#C8B8B0"}/><stop offset="100%" stopColor={active ? "#C8703A" : "#907870"}/></linearGradient>
          <linearGradient id="nav_page" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#F5F0EC"/></linearGradient>
        </defs>
        <rect x="4" y="4" width="20" height="22" rx="2.5" fill={active ? "#C8703A" : "#907870"} opacity="0.25"/>
        <rect x="3" y="3" width="20" height="22" rx="2.5" fill="url(#nav_bind)"/>
        <rect x="6" y="4.5" width="15" height="19" rx="1.5" fill="url(#nav_page)" stroke={col} strokeWidth="0.8"/>
        <circle cx="6.5" cy="9" r="2" fill="url(#nav_bind)" stroke={active ? "#A85A28" : "#806860"} strokeWidth="0.8"/>
        <circle cx="6.5" cy="14" r="2" fill="url(#nav_bind)" stroke={active ? "#A85A28" : "#806860"} strokeWidth="0.8"/>
        <circle cx="6.5" cy="19" r="2" fill="url(#nav_bind)" stroke={active ? "#A85A28" : "#806860"} strokeWidth="0.8"/>
        <circle cx="6.5" cy="9" r="0.8" fill="white" opacity="0.6"/>
        <circle cx="6.5" cy="14" r="0.8" fill="white" opacity="0.6"/>
        <circle cx="6.5" cy="19" r="0.8" fill="white" opacity="0.6"/>
        <line x1="10" y1="8.5" x2="19" y2="8.5" stroke={col} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="10" y1="12" x2="19" y2="12" stroke={col} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="10" y1="15.5" x2="16" y2="15.5" stroke={col} strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M11 19 L11.5 20.5 L13 20.5 L11.9 21.4 L12.3 23 L11 22.1 L9.7 23 L10.1 21.4 L9 20.5 L10.5 20.5 Z" fill={active ? "#D4A843" : "#B0A090"}/>
        <rect x="3" y="3" width="4" height="22" rx="2.5" fill="white" opacity="0.15"/>
      </svg>
    ),
    map: (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <defs>
          <radialGradient id="nav_globe" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={active ? "#B5D4F4" : "#C8C0B8"}/>
            <stop offset="100%" stopColor={active ? "#185FA5" : "#706860"}/>
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="11" fill="url(#nav_globe)" stroke={active ? "#0C447C" : "#605850"} strokeWidth="1.2"/>
        <ellipse cx="14" cy="14" rx="11" ry="5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
        <line x1="3" y1="14" x2="25" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
        <ellipse cx="14" cy="14" rx="5" ry="11" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7"/>
        <path d="M15 7 Q18 7.5 19.5 9.5 Q20.5 11.5 19 13 Q17 14 15.5 12.5 Q14 11 15 9 Z" fill={active ? "#4A9E30" : "#909888"} opacity="0.85"/>
        <path d="M8 9.5 Q11 8.5 12.5 10.5 Q13 12 11.5 13 Q9.5 13 8.5 11.5 Z" fill={active ? "#4A9E30" : "#909888"} opacity="0.7"/>
        <path d="M7.5 14.5 Q9.5 13.5 10.5 15.5 Q10.5 17.5 8.5 17.5 Q6.5 16.5 7.5 14.5 Z" fill={active ? "#4A9E30" : "#909888"} opacity="0.6"/>
        <circle cx="18" cy="10" r="2.8" fill={active ? "#E8935A" : "#B09888"} stroke={active ? "#C87040" : "#907860"} strokeWidth="0.8"/>
        <path d="M18 12.8 L18 16" stroke={active ? "#C87040" : "#907860"} strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="18" cy="10" r="1.2" fill="white" opacity="0.7"/>
        <circle cx="10" cy="9" r="3.5" fill="white" opacity="0.12"/>
      </svg>
    ),
    friends: (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <defs>
          <radialGradient id="nav_p1" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor={active ? "#7BBCE8" : "#C0B8B0"}/><stop offset="100%" stopColor={active ? "#185FA5" : "#706860"}/></radialGradient>
          <radialGradient id="nav_p2" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor={active ? "#EFC060" : "#D0C8C0"}/><stop offset="100%" stopColor={active ? "#BA7517" : "#908070"}/></radialGradient>
        </defs>
        <circle cx="18.5" cy="9.5" r="4" fill="url(#nav_p2)" stroke={active ? "#BA7517" : "#807060"} strokeWidth="0.8"/>
        <path d="M13 25 C13 20 15.5 18 18.5 18 C21.5 18 24 20 24 25" fill="url(#nav_p2)" stroke={active ? "#BA7517" : "#807060"} strokeWidth="0.8" strokeLinecap="round"/>
        <circle cx="10.5" cy="10" r="4.8" fill="url(#nav_p1)" stroke={active ? "#185FA5" : "#606058"} strokeWidth="1"/>
        <path d="M3.5 26 C3.5 20.5 6.5 18 10.5 18 C14.5 18 17.5 20.5 17.5 26" fill="url(#nav_p1)" stroke={active ? "#185FA5" : "#606058"} strokeWidth="1" strokeLinecap="round"/>
        <circle cx="8.5" cy="8" r="2.5" fill="white" opacity="0.2"/>
        <circle cx="16.5" cy="8" r="1.8" fill="white" opacity="0.2"/>
      </svg>
    ),
    friendsmap: (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <defs>
          <linearGradient id="nav_g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={active ? "#F5D060" : "#D0C8B8"}/><stop offset="100%" stopColor={active ? "#C8941A" : "#908070"}/></linearGradient>
          <linearGradient id="nav_s1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={active ? "#E0E0E0" : "#D0C8C0"}/><stop offset="100%" stopColor={active ? "#A0A0A0" : "#908888"}/></linearGradient>
          <linearGradient id="nav_b1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={active ? "#E0A070" : "#C8B8A8"}/><stop offset="100%" stopColor={active ? "#A06030" : "#907060"}/></linearGradient>
        </defs>
        <rect x="2" y="16" width="7" height="10" rx="1" fill="url(#nav_s1)" stroke={active ? "#A0A0A0" : "#908888"} strokeWidth="0.8"/>
        <text x="5.5" y="23" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold">2</text>
        <rect x="10.5" y="10" width="7" height="16" rx="1" fill="url(#nav_g1)" stroke={active ? "#C8941A" : "#908070"} strokeWidth="0.8"/>
        <text x="14" y="21" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold">1</text>
        <rect x="19" y="19" width="7" height="7" rx="1" fill="url(#nav_b1)" stroke={active ? "#A06030" : "#907060"} strokeWidth="0.8"/>
        <text x="22.5" y="24" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold">3</text>
        <path d="M11 10 L12.5 7 L14 9.5 L15.5 6.5 L17 10" stroke={active ? "#D4A843" : "#B09878"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="11" y1="10" x2="17" y2="10" stroke={active ? "#D4A843" : "#B09878"} strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="5.5" cy="13.5" r="2" fill={active ? "#A0A0A0" : "#B0A8A0"}/>
        <circle cx="14" cy="7.5" r="2.2" fill={active ? "#C8941A" : "#A09078"}/>
        <circle cx="22.5" cy="16.5" r="2" fill={active ? "#A06030" : "#A09080"}/>
        <rect x="10.5" y="10" width="3" height="16" rx="1" fill="white" opacity="0.12"/>
      </svg>
    ),
  };
  return icons[id] || null;
}

function BottomNav({ activeTab, onTabChange }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: C.white, borderTop: `1px solid ${C.border}`,
      display: "flex", alignItems: "center",
      paddingBottom: "env(safe-area-inset-bottom, 8px)",
    }}>
      {[
        { id: "list", label: "リスト" },
        { id: "map", label: "地図" },
        { id: "add", label: "追加", primary: true },
        { id: "friends", label: "フレンド" },
        { id: "friendsmap", label: "ランキング" },
      ].map(item => (
        <button key={item.id} onClick={() => onTabChange(item.id)} style={{
          flex: 1, padding: "8px 0 6px", border: "none", background: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          touchAction: "manipulation",
        }}>
          {item.primary ? (
            <div style={{
              width: 50, height: 50, borderRadius: "50%",
              background: "linear-gradient(145deg, #F5A878, #E8935A 45%, #C87038)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: -22,
              boxShadow: "0 6px 20px rgba(232,147,90,0.55), 0 2px 6px rgba(200,112,56,0.4), inset 0 2px 0 rgba(255,255,255,0.3)",
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <line x1="11" y1="4" x2="11" y2="18" stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
                <line x1="4" y1="11" x2="18" y2="11" stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
              </svg>
            </div>
          ) : (
            <NavIcon id={item.id} active={activeTab === item.id}/>
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
// ===== QRコード生成（シンプル実装）=====
// ===== QRコード =====
function QRDisplay({ value, size = 160 }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=2C2420&bgcolor=F7F3EE`;
  return <img src={qrUrl} alt="QRコード" style={{ width: size, height: size, borderRadius: 8 }} />;
}

// ===== ユーザー検索・フォローモーダル =====
function AddFollowModal({ user, onClose, onAdded }) {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(null);
  const [done, setDone] = useState({});
  const inviteUrl = `https://jinsei-note.jp/invite?ref=${user.user_code || user.id}`;

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    const { data } = await supabase
      .from("profiles")
      .select("id, name, user_code")
      .or(`user_code.ilike.%${query.trim()}%,name.ilike.%${query.trim()}%`)
      .neq("id", user.id)
      .limit(5);
    setResults(data || []);
    setSearching(false);
  }

  async function sendFollow(targetId) {
    setSending(targetId);
    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetId,
      status: "pending",
    });
    setSending(null);
    if (!error) {
      setDone(prev => ({ ...prev, [targetId]: true }));
      onAdded?.();
    } else if (error.code === "23505") {
      // すでにフォロー済み
      setDone(prev => ({ ...prev, [targetId]: true }));
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.white, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", zIndex: 1, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: "bold", color: C.ink }}>ユーザーをフォロー</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: C.muted, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", background: "#F0EDE8", borderRadius: 10, padding: 3, marginBottom: 20, gap: 3 }}>
          {[["search","🔍 検索"],["qr","📷 QRコード"],["invite","🔗 招待"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: tab === t ? "bold" : "normal", background: tab === t ? C.white : "transparent", color: tab === t ? C.ink : C.muted }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "search" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="ユーザーID（LJ-XXXXXX）または名前"
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleSearch} disabled={searching}
                style={{ background: C.terra, color: C.white, border: "none", borderRadius: 10, padding: "0 16px", fontSize: 14, fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", touchAction: "manipulation" }}>
                {searching ? "…" : "検索"}
              </button>
            </div>
            {results.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.terra, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.white, flexShrink: 0 }}>
                  {u.name?.charAt(0) || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: "bold", color: C.ink }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{u.user_code}</div>
                </div>
                <button onClick={() => sendFollow(u.id)} disabled={!!sending || done[u.id]}
                  style={{ background: done[u.id] ? "#E8F5E9" : C.ink, color: done[u.id] ? "#388E3C" : C.white, border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                  {done[u.id] ? "✓ 申請済" : sending === u.id ? "…" : "フォロー"}
                </button>
              </div>
            ))}
            {results.length === 0 && query && !searching && (
              <div style={{ textAlign: "center", color: C.muted, padding: "30px 0", fontSize: 14 }}>ユーザーが見つかりませんでした</div>
            )}
          </div>
        )}

        {tab === "qr" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>このQRコードを相手に読み取ってもらう</div>
            <div style={{ display: "inline-block", padding: 16, background: "#F7F3EE", borderRadius: 16, marginBottom: 16 }}>
              <QRDisplay value={inviteUrl} size={180} />
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>あなたのユーザーID</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.ink, letterSpacing: 2 }}>{user.user_code || "未設定"}</div>
          </div>
        )}

        {tab === "invite" && (
          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>招待リンクをシェアしてフォローしてもらう</div>
            <div style={{ background: "#F7F3EE", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: C.ink, wordBreak: "break-all" }}>
              {inviteUrl}
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(inviteUrl); alert("コピーしました！"); }}
              style={{ width: "100%", background: C.ink, color: C.white, border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", marginBottom: 10, touchAction: "manipulation" }}>
              📋 リンクをコピー
            </button>
            {navigator.share && (
              <button onClick={() => navigator.share({ title: "人生ノート", text: "フォローしませんか？", url: inviteUrl })}
                style={{ width: "100%", background: C.white, color: C.ink, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                📤 シェアする
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== フォロービュー =====
function FriendsView({ user, onOpenMenu }) {
  const [following, setFollowing] = useState([]); // 自分がフォローしている
  const [followers, setFollowers] = useState([]); // 自分をフォローしている
  const [friends, setFriends] = useState([]); // 相互フォロー
  const [pendingIn, setPendingIn] = useState([]); // 承認待ち（受信）
  const [pendingOut, setPendingOut] = useState([]); // 承認待ち（送信）
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("friends");

  useEffect(() => { loadFollows(); }, []);

  async function loadFollows() {
    setLoading(true);
    try {
      // 自分がフォローしている（承認済み）
      const { data: followingData } = await supabase
        .from("follows").select("*").eq("follower_id", user.id).eq("status", "accepted");

      // 自分をフォローしている（承認済み）
      const { data: followersData } = await supabase
        .from("follows").select("*").eq("following_id", user.id).eq("status", "accepted");

      // 承認待ち受信
      const { data: pendingInData } = await supabase
        .from("follows").select("*").eq("following_id", user.id).eq("status", "pending");

      // 承認待ち送信
      const { data: pendingOutData } = await supabase
        .from("follows").select("*").eq("follower_id", user.id).eq("status", "pending");

      // プロフィール取得
      const allIds = [
        ...(followingData || []).map(f => f.following_id),
        ...(followersData || []).map(f => f.follower_id),
        ...(pendingInData || []).map(f => f.follower_id),
        ...(pendingOutData || []).map(f => f.following_id),
      ];
      const uniqueIds = [...new Set(allIds)];
      let profileMap = {};
      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id,name,user_code").in("id", uniqueIds);
        (profiles || []).forEach(p => { profileMap[p.id] = p; });
      }

      const followingList = (followingData || []).map(f => ({ ...f, profile: profileMap[f.following_id] }));
      const followersList = (followersData || []).map(f => ({ ...f, profile: profileMap[f.follower_id] }));
      // 相互フォロー = フォロー中かつフォロワーでもある
      const followingIds = new Set((followingData || []).map(f => f.following_id));
      const friendsList = followersList.filter(f => followingIds.has(f.follower_id));
      setFollowing(followingList);
      setFollowers(followersList);
      setFriends(friendsList);
      setPendingIn((pendingInData || []).map(f => ({ ...f, profile: profileMap[f.follower_id] })));
      setPendingOut((pendingOutData || []).map(f => ({ ...f, profile: profileMap[f.following_id] })));
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function acceptFollow(followId) {
    await supabase.from("follows").update({ status: "accepted" }).eq("id", followId);
    loadFollows();
  }

  async function rejectFollow(followId) {
    await supabase.from("follows").delete().eq("id", followId);
    loadFollows();
  }

  async function unfollow(followId) {
    if (!confirm("フォローを解除しますか？")) return;
    await supabase.from("follows").delete().eq("id", followId);
    loadFollows();
  }

  async function followUser(targetId) {
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetId,
      status: "pending",
    });
    loadFollows();
  }

  async function cancelFollow(followId) {
    await supabase.from("follows").delete().eq("id", followId);
    loadFollows();
  }

  // フォロー中（承認済み）+ 申請中を合わせたリスト
  const followingAll = [
    ...following.map(f => ({ ...f, status: "accepted" })),
    ...pendingOut.map(f => ({ ...f, status: "pending" })),
  ];
  // フォロワー（承認済み）+ 承認待ちを合わせたリスト
  const followersAll = [
    ...pendingIn.map(f => ({ ...f, isPending: true })),
    ...followers.map(f => ({ ...f, isPending: false })),
  ];

  const tabs = [
    ["friends", `フレンド ${friends.length}`],
    ["following", `フォロー中 ${following.length}${pendingOut.length > 0 ? ` (+${pendingOut.length})` : ""}`],
    ["followers", `フォロワー ${followers.length}${pendingIn.length > 0 ? ` 🔴${pendingIn.length}` : ""}`],
  ];

  function UserCard({ profile, action }) {
    if (!profile) return null;
    return (
      <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.terra, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.white, flexShrink: 0 }}>
          {profile.name?.charAt(0) || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: "bold", color: C.ink }}>{profile.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{profile.user_code}</div>
        </div>
        {action}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans','Meiryo',sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "28px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <LogoBanner darkBg={true} />
          <button onClick={onOpenMenu} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#9A8A7A", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 16 }}>👤</span>
            <span>{user.name?.split(" ")[0] || "メニュー"}</span>
            <span>▾</span>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ fontSize: 20, fontWeight: "bold" }}>👥 フォロー</div>
          <button onClick={() => setShowAdd(true)} style={{ background: C.terra, border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: "bold", color: C.white, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
            ＋ フォロー
          </button>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
          {tabs.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: 20, border: "none", fontSize: 12, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap", background: tab === t ? C.terra : "rgba(255,255,255,0.1)", color: C.white, fontWeight: tab === t ? "bold" : "normal", touchAction: "manipulation" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>読み込み中...</div>
          </div>
        ) : (
          <>
            {/* フレンドタブ：相互フォロー */}
            {tab === "friends" && (
              friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🤝</div>
                  <div style={{ fontSize: 16, fontWeight: "bold", color: "#666", marginBottom: 8 }}>フレンドはまだいません</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>相互フォローするとフレンドになります</div>
                </div>
              ) : friends.map(f => (
                <UserCard key={f.id} profile={f.profile} action={
                  <span style={{ fontSize: 12, color: C.terra, background: "#FFF3E0", borderRadius: 10, padding: "4px 10px", fontWeight: "bold" }}>🤝 フレンド</span>
                } />
              ))
            )}

            {/* フォロー中タブ：承認済み + 申請中 */}
            {tab === "following" && (
              followingAll.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
                  <div style={{ fontSize: 16, fontWeight: "bold", color: "#666", marginBottom: 8 }}>まだフォローしていません</div>
                  <button onClick={() => setShowAdd(true)} style={{ background: C.terra, color: C.white, border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                    ユーザーを探す
                  </button>
                </div>
              ) : (
                <>
                  {pendingOut.length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 8 }}>申請中</div>
                  )}
                  {pendingOut.map(f => (
                    <UserCard key={`p-${f.id}`} profile={f.profile} action={
                      <button onClick={() => cancelFollow(f.id)} style={{ background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#E57373", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                        取り消す
                      </button>
                    } />
                  ))}
                  {pendingOut.length > 0 && following.length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>フォロー中</div>
                  )}
                  {following.map(f => (
                    <UserCard key={f.id} profile={f.profile} action={
                      <button onClick={() => unfollow(f.id)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                        解除
                      </button>
                    } />
                  ))}
                </>
              )
            )}

            {/* フォロワータブ：承認待ち + 承認済み */}
            {tab === "followers" && (
              followersAll.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                  <div>フォロワーはまだいません</div>
                </div>
              ) : (
                <>
                  {pendingIn.length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 8 }}>承認待ち</div>
                  )}
                  {pendingIn.map(f => (
                    <div key={`pi-${f.id}`} style={{ background: C.white, borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: `1.5px solid ${C.terra}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.white, flexShrink: 0 }}>
                          {f.profile?.name?.charAt(0) || "?"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: "bold", color: C.ink }}>{f.profile?.name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{f.profile?.user_code}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => acceptFollow(f.id)} style={{ flex: 1, background: C.ink, color: C.white, border: "none", borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                          ✓ 承認する
                        </button>
                        <button onClick={() => rejectFollow(f.id)} style={{ flex: 1, background: "#FFF5F5", color: "#E57373", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                          断る
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingIn.length > 0 && followers.length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: "bold", color: C.muted, letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>フォロワー</div>
                  )}
                  {followers.map(f => {
                    const isFollowing = following.some(fw => fw.following_id === f.follower_id);
                    const isPending = pendingOut.some(p => p.following_id === f.follower_id);
                    return (
                      <UserCard key={f.id} profile={f.profile} action={
                        isFollowing ? (
                          <span style={{ fontSize: 12, color: C.terra, background: "#FFF3E0", borderRadius: 10, padding: "4px 10px" }}>フォロー中</span>
                        ) : isPending ? (
                          <span style={{ fontSize: 12, color: C.muted, background: "#F5F5F5", borderRadius: 10, padding: "4px 10px" }}>申請中</span>
                        ) : (
                          <button onClick={() => followUser(f.follower_id)}
                            style={{ background: C.ink, color: C.white, border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>
                            フォロー
                          </button>
                        )
                      } />
                    );
                  })}
                </>
              )
            )}
          </>
        )}
      </div>

      {showAdd && <AddFollowModal user={user} onClose={() => setShowAdd(false)} onAdded={loadFollows} />}
    </div>
  );
}

function FriendMapView({ user, onOpenMenu }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans','Meiryo',sans-serif", paddingBottom: 80 }}>
      <div style={{ background: C.ink, color: C.white, padding: "28px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <LogoBanner darkBg={true} />
          <button onClick={onOpenMenu} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#9A8A7A", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 16 }}>👤</span>
            <span>{user.name?.split(" ")[0] || "メニュー"}</span>
            <span>▾</span>
          </button>
        </div>
        <div style={{ fontSize: 20, fontWeight: "bold", marginTop: 12 }}>🏆 ランキング</div>
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
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans','Meiryo',sans-serif", paddingBottom: 40 }}>
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
  const [viewingUser, setViewingUser] = useState(null); // フレンドのリストを閲覧中
  const [friendCategories, setFriendCategories] = useState([]); // フレンドのカテゴリ
  const [followingUsers, setFollowingUsers] = useState([]); // フォロー中のフレンド一覧
  const [friendTabMode, setFriendTabMode] = useState("self"); // "self" | "select" | "friend" | "category"
  const [showFriendList, setShowFriendList] = useState(false); // フレンド選択モーダル
  const [allFriendData, setAllFriendData] = useState([]); // 全フレンドのデータ
  const [selectedCategory, setSelectedCategory] = useState(null); // カテゴリ横断選択
  const [activeBigCat, setActiveBigCat] = useState("eat"); // 大カテゴリフィルター
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [activeSmallFilter, setActiveSmallFilter] = useState(null); // 小カテゴリフィルター
  const [crossCatFilterUser, setCrossCatFilterUser] = useState(null);
  const [crossCatFilterRec, setCrossCatFilterRec] = useState(null);
  const [friendViewSortCat, setFriendViewSortCat] = useState(null);
  const [friendViewSortRec, setFriendViewSortRec] = useState(null);
  const [activeCatFilter, setActiveCatFilter] = useState(null); // 小カテゴリ絞り込み
  const [expandedEntryId, setExpandedEntryId] = useState(null); // 展開エントリー
  const [detailModalEntry, setDetailModalEntry] = useState(null); // 詳細モーダル表示中のエントリー（{entry, rank, isSelf, bigCatEmoji}）
  const [editingHomeEntry, setEditingHomeEntry] = useState(null); // ホームから直接編集
  const [expandedYears, setExpandedYears] = useState({}); // 年アコーディオン
  const [expandedMonths, setExpandedMonths] = useState({}); // 月アコーディオン
  const [addEntryForCat, setAddEntryForCat] = useState(null); // エントリー追加対象カテゴリ
  const [newCatBigCat, setNewCatBigCat] = useState("eat"); // 新規カテゴリの大カテゴリ
  const [suggestedCats, setSuggestedCats] = useState([]); // 30人以上のサジェスト

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

  const [loading, setLoading] = useState(false);

  // ===== Supabaseからデータ取得 =====
  useEffect(() => {
    if (!user) return;
    loadData();
    loadFollowingUsers();
    loadSuggestedCats();
  }, [user]);

  async function loadSuggestedCats() {
    const { data } = await supabase
      .from("suggested_categories")
      .select("name, count, big_cat")
      .gte("count", 30)
      .order("count", { ascending: false });
    setSuggestedCats(data || []);
    setDynamicSuggestions(data || []);
  }

  // フォロー中ユーザーが取得できたら全データも取得
  useEffect(() => {
    if (followingUsers.length > 0) loadAllFriendData();
  }, [followingUsers]);

  async function loadData() {
    setLoading(true);
    const { data: cats } = await supabase
      .from("categories").select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (!cats) { setLoading(false); return; }

    const catIds = cats.map(c => c.id);
    const { data: ents } = catIds.length > 0
      ? await supabase.from("entries").select("*").in("category_id", catIds)
      : { data: [] };

    function mapEntry(e) {
      return {
        id: e.id,
        name: e.name,
        prefecture: e.prefecture || "",
        rec: e.rec ?? 2,
        star: e.star ?? 0,
        tags: e.tags || [],
        comment: e.comment || "",
        visitDate: e.visit_date || "",
        placeData: e.place_data || null,
        photo: (() => { try { return localStorage.getItem(`photo_${e.id}`); } catch { return null; } })(),
      };
    }

    const merged = cats.map(cat => ({
      ...cat,
      bigCat: cat.big_cat || "eat",
      entries: sortEntriesByStar(
        (ents || []).filter(e => e.category_id === cat.id).map(mapEntry)
      ),
    }));

    setCategories(merged);
    setLoading(false);
  }

  // フレンドのデータを読み込む
  async function loadFriendData(targetUser) {
    setViewingUser(targetUser);
    setFriendCategories([]);
    const { data: cats } = await supabase
      .from("categories").select("*")
      .eq("user_id", targetUser.id)
      .order("created_at", { ascending: true });
    if (!cats) return;
    const catIds = cats.map(c => c.id);
    const { data: ents } = catIds.length > 0
      ? await supabase.from("entries").select("*").in("category_id", catIds).order("rank_order", { ascending: true })
      : { data: [] };
    const merged = cats.map(cat => ({
      ...cat,
      entries: sortEntriesByRec(
        (ents || []).filter(e => e.category_id === cat.id).map(e => ({
          id: e.id, name: e.name, prefecture: e.prefecture || "",
          rec: e.rec ?? 2, comment: e.comment || "",
          visitDate: e.visit_date || "", placeData: e.place_data || null, photo: null,
        }))
      ),
    }));
    setFriendCategories(merged);
  }

  // フォロー中フレンド一覧を取得
  async function loadFollowingUsers() {
    const { data: follows } = await supabase
      .from("follows").select("following_id").eq("follower_id", user.id).eq("status", "accepted");
    if (!follows || follows.length === 0) { setFollowingUsers([]); return; }
    const ids = follows.map(f => f.following_id);
    const { data: profiles } = await supabase.from("profiles").select("id,name,user_code").in("id", ids);
    setFollowingUsers(profiles || []);
  }

  // 全フレンドのカテゴリ・エントリーをまとめて取得
  async function loadAllFriendData() {
    if (followingUsers.length === 0) return;
    const allData = await Promise.all(
      followingUsers.map(async fu => {
        const { data: cats } = await supabase.from("categories").select("*").eq("user_id", fu.id).order("created_at", { ascending: true });
        if (!cats || cats.length === 0) return { user: fu, categories: [] };
        const catIds = cats.map(c => c.id);
        const { data: ents } = await supabase.from("entries").select("*").in("category_id", catIds).order("rank_order", { ascending: true });
        const merged = cats.map(cat => ({
          ...cat,
          entries: sortEntriesByRec((ents || []).filter(e => e.category_id === cat.id).map(e => ({
            id: e.id, name: e.name, prefecture: e.prefecture || "",
            rec: e.rec ?? 2, comment: e.comment || "",
            visitDate: e.visit_date || "", placeData: e.place_data || null, photo: null,
          }))),
        }));
        return { user: fu, categories: merged };
      })
    );
    setAllFriendData(allData);
  }

  function handleLogin(u) { setUser(u); }
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setCategories([]);
  }

  async function addCategory(name) {
    const normalized = normalizeTag(name);
    if (!normalized) return;
    if (categories.find(c => c.name === normalized)) {
      const existing = categories.find(c => c.name === normalized);
      setAddEntryForCat(existing);
      setShowAddModal(false); setShowBrowse(false); setNewCatInput("");
      return;
    }
    // タグ辞書に登録済みのカテゴリ名なら、辞書のグループから大カテゴリを自動推定（一覧から選んだ場合など）
    // 推定できなければ、ユーザーが手動で選択した newCatBigCat を使う（自由入力の場合）
    const inferredBigCat = inferBigCatFromTagName(normalized);
    const finalBigCat = inferredBigCat || newCatBigCat;
    // Supabaseに保存
    const { data: newCat, error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name: normalized, big_cat: finalBigCat })
      .select()
      .single();
    if (error || !newCat) return;

    const cat = { ...newCat, entries: [], bigCat: newCat.big_cat || "eat" };
    setCategories(prev => [...prev, cat]);
    setNewCatInput(""); setShowAddModal(false); setShowBrowse(false);
    // CategoryViewではなくEntryFormモーダルを開く
    setAddEntryForCat(cat);
  }

  async function updateCategory(updated) {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  async function deleteCategory(catId, catName, entryCount) {
    const msg = entryCount > 0
      ? `「人生${catName}」を削除しますか？\n\n⚠️ このカテゴリの記録${entryCount}件もすべて削除されます。\nこの操作は元に戻せません。`
      : `「人生${catName}」を削除しますか？\nこの操作は元に戻せません。`;
    if (!confirm(msg)) return;
    // エントリーも削除
    const cat = categories.find(c => c.id === catId);
    if (cat?.entries?.length > 0) {
      const entryIds = cat.entries.map(e => e.id);
      await supabase.from("entries").delete().in("id", entryIds);
    }
    await supabase.from("categories").delete().eq("id", catId);
    setCategories(prev => prev.filter(c => c.id !== catId));
    // 大カテゴリビューを表示中なら戻る
    setActiveBigCat("all");
    setExpandedEntryId(null);
  }

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: "#F2EDE4", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
  // 表示中のカテゴリ（自分orフレンド）- activeCategoryより前に定義必須
  const displayCategories = viewingUser ? friendCategories : categories;

  if (showBrowse) return (
    <>
      <BrowseView onSelect={name => addCategory(name)} onBack={() => setShowBrowse(false)} />
      {addEntryForCat && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setAddEntryForCat(null)}/>
          <div style={{ position: "relative", background: "#F2EDE4", borderRadius: "20px 20px 0 0", maxHeight: "92vh", overflowY: "auto", zIndex: 1 }}>
            <div style={{ padding: "16px 16px 0", background: C.ink, borderRadius: "20px 20px 0 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>＋ 人生{addEntryForCat.name}を追加</div>
            </div>
            <div style={{ padding: "16px" }}>
              <EntryForm
                categoryName={addEntryForCat.name}
                onSave={async (entry) => {
                  const dbEntry = { user_id: user.id, category_id: addEntryForCat.id, name: entry.name, prefecture: entry.prefecture || "", rec: entry.rec ?? 2, star: entry.star ?? 0, tags: entry.tags || [], comment: entry.comment || "", visit_date: entry.visitDate || null, place_data: entry.placeData || null, rank_order: 0 };
                  const { data: newEnt, error } = await supabase.from("entries").insert(dbEntry).select().single();
                  if (error) { alert("保存エラー: " + error.message); return; }
                  const savedId = newEnt?.id || entry.id;
                  if (entry.photo) { try { localStorage.setItem(`photo_${savedId}`, entry.photo); } catch {} }
                  setCategories(prev => prev.map(c => c.id === addEntryForCat.id ? { ...c, entries: sortEntriesByStar([...c.entries, { ...entry, id: savedId }]) } : c));
                  setAddEntryForCat(null);
                  setShowBrowse(false);
                }}
                onCancel={() => setAddEntryForCat(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
  if (activeCategory) {
    const isFriendView = !!viewingUser;
    const accentColor = getAccentColor(displayCategories.findIndex(c => c.id === activeCategory.id));
    return (
      <CategoryView
        category={activeCategory}
        data={displayCategories.find(c => c.id === activeCategory.id) || activeCategory}
        accentColor={accentColor}
        onUpdate={isFriendView ? () => {} : (updated => { updateCategory(updated); setActiveCategory(updated); })}
        onBack={() => setActiveCategory(null)}
        userId={isFriendView ? null : user.id}
        readOnly={isFriendView}
        ownerName={isFriendView ? viewingUser?.name : null}
      />
    );
  }

  // ユーザーメニュー（全ページ共通）
  const userMenuElement = showUserMenu && (
    <UserMenu
      user={user}
      onEdit={() => { setShowUserMenu(false); setShowProfileEdit(true); }}
      onLogout={async () => {
        setShowUserMenu(false);
        if (confirm("ログアウトしますか？")) {
          await supabase.auth.signOut();
          setUser(null); setCategories([]);
        }
      }}
      onClose={() => setShowUserMenu(false)}
    />
  );

  // タブ切替で地図・フレンド表示
  if (activeTab === "map") return (
    <>
      <MapView categories={categories} onBack={() => setActiveTab("list")} followingUsers={followingUsers} allFriendData={allFriendData} user={user} onOpenMenu={() => setShowUserMenu(true)}
        onEditEntry={(entry) => setEditingHomeEntry(entry)}
        onDeleteEntry={async (entry) => {
          await supabase.from("entries").delete().eq("id", entry.id);
          setCategories(prev => prev.map(c => c.name === entry.categoryName ? { ...c, entries: c.entries.filter(en => en.id !== entry.id) } : c));
        }}
      />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {userMenuElement}
      {editingHomeEntry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setEditingHomeEntry(null)}/>
          <div style={{ position: "relative", background: "#F2EDE4", borderRadius: "20px 20px 0 0", maxHeight: "90vh", overflowY: "auto", zIndex: 1 }}>
            <div style={{ padding: "16px 16px 0", background: C.ink, borderRadius: "20px 20px 0 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>
                ✏️ {editingHomeEntry.categoryName} を編集
              </div>
            </div>
            <div style={{ padding: "16px" }}>
              <EntryForm
                initial={editingHomeEntry}
                categoryName={editingHomeEntry.categoryName}
                onSave={async (updated) => {
                  const dbEntry = {
                    name: updated.name,
                    prefecture: updated.prefecture || "",
                    rec: updated.rec ?? 2,
                    star: updated.star ?? 0,
                    tags: updated.tags || [],
                    comment: updated.comment || "",
                    visit_date: updated.visitDate || null,
                    place_data: updated.placeData || null,
                  };
                  await supabase.from("entries").update(dbEntry).eq("id", editingHomeEntry.id);
                  if (updated.photo) { try { localStorage.setItem(`photo_${editingHomeEntry.id}`, updated.photo); } catch {} }
                  setCategories(prev => prev.map(c =>
                    c.name === editingHomeEntry.categoryName
                      ? { ...c, entries: sortEntriesByStar(c.entries.map(e => e.id === editingHomeEntry.id ? { ...e, ...updated, id: e.id } : e)) }
                      : c
                  ));
                  setEditingHomeEntry(null);
                  setExpandedEntryId(null);
                }}
                onCancel={() => setEditingHomeEntry(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
  if (activeTab === "friends") return (
    <>
      <FriendsView user={user} onOpenMenu={() => setShowUserMenu(true)} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {userMenuElement}
    </>
  );
  if (activeTab === "friendsmap") return (
    <>
      <FriendMapView user={user} onOpenMenu={() => setShowUserMenu(true)} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {userMenuElement}
    </>
  );

  const totalEntries = categories.reduce((sum, c) => sum + (c.entries?.length || 0), 0);
  const isFriendMode = friendTabMode !== "self";

  // 自分の大カテゴリ集計
  const bigCatStats = BIG_CATS.map(bc => ({
    ...bc,
    count: categories.filter(c => (c.bigCat || c.big_cat || "eat") === bc.id)
      .reduce((s, c) => s + (c.entries?.length || 0), 0),
  })).filter(bc => bc.count > 0);

  // 全エントリー（★順）
  const allEntriesByStar = categories.flatMap(cat =>
    (cat.entries || []).map(e => ({ ...e, categoryName: cat.name, bigCat: cat.bigCat || cat.big_cat }))
  ).sort((a, b) => (b.star ?? 0) - (a.star ?? 0));

  // 大カテゴリ別エントリー（★順）
  const bigCatEntries = activeBigCat && activeBigCat !== "all"
    ? allEntriesByStar.filter(e => e.bigCat === activeBigCat)
    : [];

  const filteredFriendUsers = friendSearchQuery.trim()
    ? followingUsers.filter(u => u.name?.includes(friendSearchQuery.trim()) || u.user_code?.includes(friendSearchQuery.trim()))
    : followingUsers;

  // フレンドの登録数（allFriendDataから）
  function getFriendCount(userId) {
    const fd = allFriendData.find(f => f.user.id === userId);
    return fd ? fd.categories.reduce((s, c) => s + (c.entries?.length || 0), 0) : 0;
  }

  // 全フレンドのカテゴリ集計
  const friendCatStats = {};
  allFriendData.forEach(fd => {
    fd.categories.forEach(cat => {
      if (!friendCatStats[cat.name]) friendCatStats[cat.name] = { count: 0, users: [] };
      friendCatStats[cat.name].count++;
      friendCatStats[cat.name].users.push(fd.user.name);
    });
  });
  const friendCatList = Object.entries(friendCatStats)
    .sort((a, b) => b[1].count - a[1].count)
    .filter(([name]) => !catSearchQuery.trim() || name.includes(catSearchQuery.trim()));

  // フレンド選択後の表示エントリー（訪問日新しい順）
  const friendViewEntries = viewingUser && friendCategories.length > 0
    ? friendCategories.flatMap(cat =>
        (cat.entries || []).map(e => ({ ...e, categoryName: cat.name }))
      ).sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""))
    : [];

  // カテゴリ横断エントリー（訪問日新しい順）
  const crossCatViewEntries = selectedCategory
    ? allFriendData.flatMap(fd => {
        const cat = fd.categories.find(c => c.name === selectedCategory);
        return (cat?.entries || []).map(e => ({ ...e, categoryName: selectedCategory, ownerName: fd.user.name, ownerId: fd.user.id }));
      }).sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""))
    : [];


  const crossCatFiltered = crossCatViewEntries
    .filter(e => !crossCatFilterUser || e.ownerId === crossCatFilterUser)
    .filter(e => !crossCatFilterRec || e.rec === crossCatFilterRec);


  const friendViewFiltered = friendViewEntries
    .filter(e => !friendViewSortCat || e.categoryName === friendViewSortCat)
    .filter(e => !friendViewSortRec || e.rec === friendViewSortRec);

  return (
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif", paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ background: "linear-gradient(160deg,#2C1F0E 0%,#1A1208 50%,#251A0C 100%)", color: C.white, boxShadow: "0 2px 16px rgba(24,22,15,0.25), inset 0 1px 0 rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px 0", position: "relative" }}>
          {/* レザーテクスチャ */}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,0.008) 3px,rgba(255,255,255,0.008) 4px)", pointerEvents: "none" }}/>
          {/* ゴールドライン */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#C8A050 30%,#E8C870 50%,#C8A050 70%,transparent)", zIndex: 1 }}/>

          {/* ロゴ＋ユーザー */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 2 }}>
            <LogoBanner darkBg={true} onLogoClick={() => { setActiveBigCat("all"); setViewingUser(null); setFriendCategories([]); setFriendTabMode("self"); setSelectedCategory(null); setExpandedEntryId(null); }} />
            <button onClick={() => setShowUserMenu(true)} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "#A89880", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 14 }}>👤</span>
              <span>{user.name?.split(" ")[0] || "メニュー"}</span>
              <span style={{ fontSize: 10 }}>▾</span>
            </button>
          </div>

          {/* 統計4数字 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, position: "relative", zIndex: 2 }}>
            {[
              { num: totalEntries, lbl: "総記録数", col: "#E8DDD0" },
              { num: categories.length, lbl: "カテゴリ", col: "#E8DDD0" },
              { num: categories.flatMap(c=>c.entries||[]).filter(e=>e.rec===3).length, lbl: "人生で必ず", col: "#E8C870" },
              { num: [...new Set(categories.flatMap(c=>c.entries||[]).map(e=>e.prefecture).filter(Boolean))].length, lbl: "都道府県", col: "#C89870" },
            ].map(({ num, lbl, col }) => (
              <div key={lbl} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(200,160,80,0.2)", borderRadius: 10, padding: "8px 4px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(200,168,80,0.4),transparent)" }}/>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: col, lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 8, color: "#A89880", marginTop: 3, letterSpacing: 0.5 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* 大カテゴリタブ */}
          <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", scrollbarWidth: "none", position: "relative", zIndex: 2, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
            {BIG_CATS.map((bc) => {
              const isOn = activeBigCat === bc.id;
              return (
                <button key={bc.id} onClick={() => { setActiveBigCat(bc.id); setActiveCatFilter(null); setExpandedEntryId(null); }} style={{
                  flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "10px 14px 12px", cursor: "pointer", position: "relative",
                  fontSize: 9, color: isOn ? "#E8C870" : "rgba(255,255,255,0.45)",
                  background: "none", border: "none", fontFamily: "inherit", touchAction: "manipulation",
                  opacity: isOn ? 1 : 0.55,
                }}>
                  <span style={{ filter: isOn ? "drop-shadow(0 0 4px rgba(200,160,80,0.5))" : "none" }}><BigCatIcon id={bc.id} size={22}/></span>
                  <span style={{ whiteSpace: "nowrap" }}>{bc.label.split("・")[0]}</span>
                  {isOn && <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2, background: "linear-gradient(90deg,transparent,#C8A050,transparent)", borderRadius: 2 }}/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 14px", maxWidth: 600, margin: "0 auto" }}>

        {/* ===== 自分タブ ===== */}
        {!isFriendMode && (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 14 }}>読み込み中...</div>
              </div>
            ) : categories.length === 0 && activeBigCat !== "__all_entries__" ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📖</div>
                <div style={{ fontSize: 16, fontWeight: "bold", color: "#555", marginBottom: 8 }}>人生ノートをはじめよう</div>
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>「人生うどん」「人生夕日」など<br />自分だけのランキングを作れます</div>
              </div>
            ) : (
              <>
                {/* 大カテゴリ一覧 */}
                {/* 大カテゴリ別ランキング（メダル形式） */}
                {activeBigCat !== "all" && activeBigCat !== "__all_entries__" && (() => {
                  const bc = BIG_CATS.find(b => b.id === activeBigCat);
                  const bcEmojis = { eat:"🍜", see:"🌅", do:"🏄", relax:"♨️", enjoy:"🎭", stay:"🏨" };
                  const bcColors = {
                    eat:   ["#C87040","#A05020"],
                    see:   ["#185FA5","#0C4080"],
                    do:    ["#0F6E56","#085040"],
                    relax: ["#534AB7","#3A2880"],
                    enjoy: ["#993556","#782870"],
                    stay:  ["#185FA5","#0C4878"],
                  };
                  const [c1, c2] = bcColors[activeBigCat] || ["#888","#444"];

                  // このカテゴリに属する全エントリー（★降順）
                  const catEntries = categories
                    .filter(c => (c.bigCat || c.big_cat || "eat") === activeBigCat)
                    .flatMap(cat =>
                      (cat.entries || []).map(e => ({
                        ...e,
                        categoryName: cat.name,
                        catId: cat.id,
                      }))
                    )
                    .sort((a, b) => (b.star ?? 0) - (a.star ?? 0));

                  // 小カテゴリ一覧
                  const smallCats = categories.filter(c => (c.bigCat || c.big_cat || "eat") === activeBigCat);

                  // 小カテゴリフィルター後
                  const filtered = activeCatFilter
                    ? catEntries.filter(e => e.categoryName === activeCatFilter)
                    : catEntries;

                  const top3 = filtered.slice(0, 3);
                  const rest = filtered.slice(3);

                  const medalStyles = [
                    { bg: "linear-gradient(135deg,#C8A050,#E8C060)", bar: "linear-gradient(90deg,#C8A050,#E8C870,#C8A050)", label: "1位", shadow: "0 3px 0 rgba(100,70,10,0.4),0 6px 16px rgba(200,160,80,0.4),inset 0 1px 0 rgba(255,255,255,0.4)" },
                    { bg: "linear-gradient(135deg,#9AA8B8,#B8C4D0)", bar: "linear-gradient(90deg,#9AA8B8,#C8D0D8,#9AA8B8)", label: "2位", shadow: "0 3px 0 rgba(60,80,100,0.3),0 5px 10px rgba(150,170,190,0.35),inset 0 1px 0 rgba(255,255,255,0.3)" },
                    { bg: "linear-gradient(135deg,#A06030,#C08050)", bar: "linear-gradient(90deg,#A06030,#C08050,#A06030)", label: "3位", shadow: "0 3px 0 rgba(80,40,10,0.35),0 5px 10px rgba(160,100,50,0.35),inset 0 1px 0 rgba(255,255,255,0.3)" },
                  ];

                  // 表示順: 2位・1位・3位
                  const podiumOrder = top3.length >= 2 ? [
                    { entry: top3[1], medal: medalStyles[1], rank: 2, shrink: true },
                    { entry: top3[0], medal: medalStyles[0], rank: 1, shrink: false },
                    { entry: top3[2], medal: medalStyles[2], rank: 3, shrink: true },
                  ] : top3.map((e, i) => ({ entry: e, medal: medalStyles[i], rank: i+1, shrink: false }));

                  return (
                    <div>
                      {/* ヘッダー行 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span><BigCatIcon id={activeBigCat} size={26}/></span>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: "Georgia,serif" }}>{bc?.label}</div>
                            <div style={{ fontSize: 10, color: C.sub }}>{filtered.length}件</div>
                          </div>
                        </div>
                        {/* 訪問日順で見るボタン */}
                        <button onClick={() => setActiveBigCat("__all_entries__")} style={{
                          display: "flex", alignItems: "center", gap: 4,
                          background: "rgba(160,120,60,0.1)", border: "0.5px solid rgba(160,120,60,0.25)",
                          borderRadius: 20, padding: "5px 10px", fontSize: 10, color: C.sub,
                          cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation",
                        }}>
                          <span>📅</span><span>訪問日順</span>
                        </button>
                      </div>

                      {/* 小カテゴリ横スクロール */}
                      {smallCats.length > 1 && (
                        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, scrollbarWidth: "none", paddingBottom: 2 }}>
                          <button onClick={() => setActiveCatFilter(null)} style={{
                            flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: "none",
                            background: !activeCatFilter ? C.leather : "rgba(160,120,60,0.1)",
                            color: !activeCatFilter ? C.goldLight : C.sub,
                            fontSize: 10, fontWeight: !activeCatFilter ? 700 : 400,
                            cursor: "pointer", fontFamily: "inherit",
                            boxShadow: !activeCatFilter ? "0 2px 0 rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                          }}>すべて</button>
                          {smallCats.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCatFilter(cat.name)} style={{
                              flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: "none",
                              background: activeCatFilter === cat.name ? C.leather : "rgba(160,120,60,0.1)",
                              color: activeCatFilter === cat.name ? C.goldLight : C.sub,
                              fontSize: 10, fontWeight: activeCatFilter === cat.name ? 700 : 400,
                              cursor: "pointer", fontFamily: "inherit",
                              boxShadow: activeCatFilter === cat.name ? "0 2px 0 rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                            }}>{cat.name}</button>
                          ))}
                        </div>
                      )}

                      {/* エントリーなし */}
                      {filtered.length === 0 && (
                        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
                          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><BigCatIcon id={activeBigCat} size={48}/></div>
                          <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>まだ記録がありません</div>
                          <button onClick={() => setShowAddModal(true)} style={{
                            background: `linear-gradient(135deg,${c1},${c2})`, color: C.white, border: "none",
                            borderRadius: 20, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                            boxShadow: `0 3px 0 rgba(0,0,0,0.2),0 6px 16px ${c1}40,inset 0 1px 0 rgba(255,255,255,0.2)`,
                          }}>＋ 最初の記録を追加</button>
                        </div>
                      )}

                      {/* 1〜3位メダルポジウム */}
                      {top3.length > 0 && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16 }}>
                          {podiumOrder.map(({ entry, medal, rank, shrink }) => entry ? (
                            <div key={entry.id} style={{ flex: 1, borderRadius: 14, overflow: "hidden", position: "relative", marginTop: shrink ? 24 : 0, boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset,0 3px 10px rgba(100,70,20,0.12),0 8px 24px rgba(100,70,20,0.08)", cursor: "pointer" }}
                              onClick={() => setDetailModalEntry({ entry: { ...entry, categoryId: entry.catId }, rank, isSelf: true, bigCat: activeBigCat })}>
                              {/* 上部カラーバー */}
                              <div style={{ height: 4, background: medal.bar }}/>
                              {/* カード本体 */}
                              <div style={{ background: "linear-gradient(160deg,#FDF8F0,#F5EEE2)", border: "0.5px solid rgba(160,120,60,0.22)", borderTop: "none" }}>
                                {/* メダルバッジ */}
                                <div style={{
                                  width: 44, height: 44, borderRadius: "50%",
                                  background: medal.bg, boxShadow: medal.shadow,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  margin: "10px auto 6px", position: "relative", overflow: "hidden",
                                  fontSize: 14, fontWeight: 900, color: "#fff",
                                }}>
                                  {medal.label}
                                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg,rgba(255,255,255,0.3),transparent)", borderRadius: "50%" }}/>
                                </div>
                                {/* コンテンツ */}
                                <div style={{ padding: "0 8px 12px", textAlign: "center" }}>
                                  <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><BigCatIcon id={activeBigCat} size={shrink ? 30 : 38}/></div>
                                  <div style={{ fontFamily: "Georgia,serif", fontSize: shrink ? 10 : 11, color: C.ink, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, minHeight: 28 }}>{entry.name}</div>
                                  <div style={{ fontSize: 10, color: "#C8A050", fontWeight: 700, marginBottom: 2 }}>★ {(entry.star ?? 0).toFixed(1)}</div>
                                  {entry.prefecture && <div style={{ fontSize: 8, color: C.sub, marginBottom: 4 }}>{entry.prefecture}</div>}
                                  {(() => {
                                    const rec = REC_LEVELS.find(r => r.value === entry.rec);
                                    return rec ? (
                                      <span style={{ display: "inline-flex", padding: "2px 6px", borderRadius: 10, fontSize: 7, fontWeight: 700, background: rec.bg, color: rec.color, border: `0.5px solid ${rec.color}40` }}>{rec.short}</span>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                              {/* 展開パネル：編集・削除 */}
                              {expandedEntryId === entry.id && (
                                <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 12px 12px", display: "flex", gap: 8, background: "#FAF7F2" }}>
                                  <button onClick={e => { e.stopPropagation(); setEditingHomeEntry({ ...entry, categoryName: entry.categoryName, categoryId: entry.catId }); setExpandedEntryId(null); }}
                                    style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.ink, background: "linear-gradient(180deg,#FFFFFF,#F6F3EF)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 0 rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1)", touchAction: "manipulation" }}>
                                    ✏️ 編集
                                  </button>
                                  <button onClick={async e => { e.stopPropagation(); if (confirm("削除しますか？")) { await supabase.from("entries").delete().eq("id", entry.id); setCategories(prev => prev.map(c => c.name === entry.categoryName ? { ...c, entries: c.entries.filter(en => en.id !== entry.id) } : c)); setExpandedEntryId(null); }}}
                                    style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#E06060", background: "linear-gradient(180deg,#FFF8F8,#FFEEEE)", border: "1px solid #FFCDD2", borderRadius: 10, padding: "9px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 0 rgba(200,60,60,0.12),inset 0 1px 0 rgba(255,255,255,1)", touchAction: "manipulation" }}>
                                    🗑 削除
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div key={`empty-${rank}`} style={{ flex: 1 }}/>
                          ))}
                        </div>
                      )}

                      {/* 4位以降リスト */}
                      {rest.length > 0 && (
                        <>
                          <div style={{ fontSize: 9, color: C.sub, letterSpacing: 2, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                            4位以降
                            <div style={{ flex: 1, height: "0.5px", background: "linear-gradient(90deg,rgba(160,120,60,0.3),transparent)" }}/>
                          </div>
                          {rest.map((entry, i) => {
                            const rec = REC_LEVELS.find(r => r.value === entry.rec);
                            const isOpen = expandedEntryId === entry.id;
                            return (
                              <div key={entry.id} style={{
                                background: "linear-gradient(160deg,#FDF8F0,#F5EEE2)",
                                borderRadius: 12, border: "0.5px solid rgba(160,120,60,0.22)",
                                marginBottom: 7, position: "relative", overflow: "hidden",
                                boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset,0 2px 8px rgba(100,70,20,0.08)",
                                cursor: "pointer",
                              }} onClick={() => setDetailModalEntry({ entry: { ...entry, categoryId: entry.catId }, rank: i + 4, isSelf: true, bigCat: activeBigCat })}>
                                {/* 上部ライン */}
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(200,160,80,0.3),transparent)" }}/>
                                {/* 左カラーバー */}
                                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px", background: `linear-gradient(180deg,${c1},${c2})` }}/>
                                {/* メインコンテンツ行 */}
                                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 12px 10px 14px" }}>
                                  {/* 順位 */}
                                  <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: "#C8A078", minWidth: 24, textAlign: "center", flexShrink: 0 }}>{i + 4}</div>
                                  {/* アイコン */}
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${c1},${c2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, boxShadow: `0 3px 6px ${c1}50,inset 0 1px 0 rgba(255,255,255,0.2)`, position: "relative", overflow: "hidden" }}>
                                    <BigCatIcon id={activeBigCat} size={18}/>
                                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg,rgba(255,255,255,0.2),transparent)", borderRadius: "8px 8px 0 0" }}/>
                                  </div>
                                  {/* 情報 */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 8, color: C.sub }}>人生{entry.categoryName}</div>
                                    <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: C.ink, fontWeight: 700 }}>{entry.name}</div>
                                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                                      <span style={{ fontSize: 9, color: "#C8A050", fontWeight: 700 }}>★ {(entry.star ?? 0).toFixed(1)}</span>
                                      {entry.prefecture && <span style={{ fontSize: 8, color: C.sub }}>· {entry.prefecture}</span>}
                                      {rec && <span style={{ display: "inline-flex", padding: "1px 5px", borderRadius: 10, fontSize: 7, fontWeight: 700, background: rec.bg, color: rec.color, border: `0.5px solid ${rec.color}30` }}>{rec.short}</span>}
                                    </div>
                                  </div>
                                  {/* 地図ボタン */}
                                  {entry.placeData?.lat && (
                                    <a href={entry.placeData?.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(entry.name)}`}
                                      target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, fontSize: 8, color: "#6A90C8", background: "#EEF4FF", border: "0.5px solid rgba(106,144,200,0.3)", borderRadius: 7, padding: "5px 7px", flexShrink: 0, textDecoration: "none", boxShadow: "0 2px 0 rgba(40,80,160,0.1),inset 0 1px 0 rgba(255,255,255,0.8)" }}>
                                      <span style={{ fontSize: 14 }}>🗺</span>
                                      <span>地図</span>
                                    </a>
                                  )}
                                </div>
                                {/* 展開パネル：編集・削除 */}
                                {isOpen && (
                                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", display: "flex", gap: 8, background: "#FAF7F2" }}>
                                    <button onClick={e => { e.stopPropagation(); setEditingHomeEntry({ ...entry, categoryName: entry.categoryName, categoryId: entry.catId }); setExpandedEntryId(null); }}
                                      style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.ink, background: "linear-gradient(180deg,#FFFFFF,#F6F3EF)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 0 rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1)", touchAction: "manipulation" }}>
                                      ✏️ 編集
                                    </button>
                                    <button onClick={async e => { e.stopPropagation(); if (confirm("削除しますか？")) { await supabase.from("entries").delete().eq("id", entry.id); setCategories(prev => prev.map(c => c.name === entry.categoryName ? { ...c, entries: c.entries.filter(en => en.id !== entry.id) } : c)); setExpandedEntryId(null); }}}
                                      style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#E06060", background: "linear-gradient(180deg,#FFF8F8,#FFEEEE)", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 0 rgba(200,60,60,0.12),inset 0 1px 0 rgba(255,255,255,1)", touchAction: "manipulation" }}>
                                      🗑 削除
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* カテゴリ削除ボタン（小カテゴリ選択中） */}
                      {activeCatFilter && (() => {
                        const cat = categories.find(c => c.name === activeCatFilter);
                        if (!cat) return null;
                        return (
                          <div style={{ textAlign: "center", marginTop: 16 }}>
                            <button onClick={() => deleteCategory(cat.id, cat.name, cat.entries?.length || 0)}
                              style={{ fontSize: 12, color: "#E06060", background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontFamily: "inherit" }}>
                              🗑 「{cat.name}」カテゴリを削除
                            </button>
                          </div>
                        );
                      })()}

                      {/* ＋追加ボタン */}
                      <div style={{ marginTop: 16, textAlign: "center" }}>
                        <button onClick={() => setShowAddModal(true)} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: `linear-gradient(135deg,${c1},${c2})`,
                          color: C.white, border: "none", borderRadius: 20, padding: "10px 20px",
                          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          boxShadow: `0 3px 0 rgba(0,0,0,0.2),0 6px 16px ${c1}50,inset 0 1px 0 rgba(255,255,255,0.25)`,
                        }}>＋ 新しい{bc?.label.split("・")[0]}を追加</button>
                      </div>
                    </div>
                  );
                })()}

                {/* 全記録一覧（訪問日順）*/}
                {activeBigCat === "__all_entries__" && (() => {
                  const sorted = categories.flatMap(cat =>
                    (cat.entries || []).map(e => ({ ...e, categoryName: cat.name, bigCat: cat.bigCat || cat.big_cat }))
                  ).sort((a,b) => (b.visitDate||"").localeCompare(a.visitDate||""));
                  const withDate = sorted.filter(e => e.visitDate);
                  const noDate = sorted.filter(e => !e.visitDate);
                  const byYear = {};
                  withDate.forEach(e => {
                    const [y, m] = e.visitDate.split("-");
                    if (!byYear[y]) byYear[y] = {};
                    if (!byYear[y][m]) byYear[y][m] = [];
                    byYear[y][m].push(e);
                  });
                  const years = Object.keys(byYear).sort((a,b) => b-a);
                  function EntryCard({ entry }) {
                    const catObj = categories.find(c => c.name === entry.categoryName);
                    return (
                      <EntryCardDisplay
                        entry={entry} isSelf={true}
                        expanded={expandedEntryId === entry.id}
                        onToggle={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                        onEdit={() => setEditingHomeEntry({ ...entry, categoryId: catObj?.id })}
                        onDelete={async () => { if (confirm("削除しますか？")) { await supabase.from("entries").delete().eq("id", entry.id); setCategories(prev => prev.map(c => c.name === entry.categoryName ? {...c, entries: c.entries.filter(e => e.id !== entry.id)} : c)); setExpandedEntryId(null); }}}
                      />
                    );
                  }
                  return (
                    <div>
                      <button onClick={() => { setActiveBigCat("eat"); setExpandedEntryId(null); }} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.sub, fontSize: 13, cursor: "pointer", padding: "0 0 14px", fontFamily: "inherit" }}>‹ 戻る</button>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 14 }}>すべての記録（訪問日順）</div>
                      {years.map(year => {
                        const isYearOpen = expandedYears[year] !== false;
                        const months = Object.keys(byYear[year]).sort((a,b) => b-a);
                        const yearCount = months.reduce((s, m) => s + byYear[year][m].length, 0);
                        return (
                          <div key={year} style={{ marginBottom: 12 }}>
                            <button onClick={() => setExpandedYears(prev => ({ ...prev, [year]: !isYearOpen }))}
                              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(180deg,#2C1F0E,#1A1208)", borderRadius: isYearOpen ? "14px 14px 0 0" : 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{year}年</span>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{yearCount}件</span>
                              </div>
                              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{isYearOpen ? "▲" : "▼"}</span>
                            </button>
                            {isYearOpen && (
                              <div style={{ border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
                                {months.map((month, mi) => {
                                  const monthKey = `${year}-${month}`;
                                  const isMonthOpen = expandedMonths[monthKey] !== false;
                                  const monthEntries = byYear[year][month];
                                  return (
                                    <div key={month} style={{ borderTop: mi > 0 ? `1px solid ${C.border}` : "none" }}>
                                      <button onClick={() => setExpandedMonths(prev => ({ ...prev, [monthKey]: !isMonthOpen }))}
                                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#F5F2EF", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{year}年{parseInt(month)}月</span>
                                          <span style={{ fontSize: 11, color: C.sub }}>{monthEntries.length}件</span>
                                        </div>
                                        <span style={{ color: C.muted, fontSize: 11 }}>{isMonthOpen ? "▲" : "▼"}</span>
                                      </button>
                                      {isMonthOpen && (
                                        <div style={{ padding: "8px 10px" }}>
                                          {monthEntries.map(entry => <EntryCard key={entry.id} entry={entry}/>)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {noDate.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8 }}>訪問日未設定</div>
                          {noDate.map(entry => <EntryCard key={entry.id} entry={entry}/>)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ===== フレンドタブ ===== */}
        {isFriendMode && (
          <div>
            {/* フレンド選択画面 */}
            {friendTabMode === "select" && (
              <div>
                {/* フレンドで探す */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>👤 フレンドで探す</div>
                    <button onClick={() => { setFriendSearchQuery(""); setShowAllFriends(true); }}
                      style={{ fontSize: 12, color: C.terra, background: `linear-gradient(135deg,${C.terra}15,${C.gold}15)`, border: `1px solid ${C.terra}40`, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, touchAction: "manipulation" }}>
                      フレンド一覧を見る →
                    </button>
                  </div>
                  {/* 検索窓 */}
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <input value={friendSearchQuery} onChange={e=>setFriendSearchQuery(e.target.value)}
                      placeholder="名前・ユーザーIDで絞り込む"
                      style={{ ...inputStyle, paddingLeft: 36 }}/>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
                  </div>
                  {/* 一覧（検索中 or 一覧ボタン後は全件表示） */}
                  {followingUsers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>フォロー中のユーザーがいません</div>
                  ) : filteredFriendUsers.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(friendSearchQuery.trim() || showAllFriends ? filteredFriendUsers : filteredFriendUsers.slice(0, 5)).sort((a,b) => getFriendCount(b.id)-getFriendCount(a.id)).map(fu => (
                        <button key={fu.id} onClick={async () => { await loadFriendData(fu); setFriendTabMode("friend"); setViewingUser(fu); setFriendViewSortCat(null); setFriendViewSortRec(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", textAlign: "left", boxShadow: "0 2px 8px rgba(24,22,15,0.05)" }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${C.terra},${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.white, flexShrink: 0, fontWeight: 700 }}>
                            {fu.name?.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{fu.name}</div>
                            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{fu.user_code} · {getFriendCount(fu.id)}件の記録</div>
                          </div>
                          <span style={{ color: C.muted }}>›</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px 0", color: C.muted, fontSize: 13 }}>一致するフレンドがいません</div>
                  )}
                  {!friendSearchQuery.trim() && !showAllFriends && filteredFriendUsers.length > 5 && (
                    <button onClick={() => setShowAllFriends(true)}
                      style={{ width: "100%", padding: "10px", background: "none", border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, color: C.sub, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                      残り{filteredFriendUsers.length - 5}人を表示
                    </button>
                  )}
                </div>

                {/* カテゴリで探す */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>📂 カテゴリで探す</div>
                    <button onClick={() => { setCatSearchQuery(""); setShowAllCats(true); }}
                      style={{ fontSize: 12, color: C.terra, background: `linear-gradient(135deg,${C.terra}15,${C.gold}15)`, border: `1px solid ${C.terra}40`, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, touchAction: "manipulation" }}>
                      カテゴリ一覧を見る →
                    </button>
                  </div>
                  {/* 検索窓 */}
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <input value={catSearchQuery} onChange={e=>setCatSearchQuery(e.target.value)}
                      placeholder="カテゴリ名で絞り込む"
                      style={{ ...inputStyle, paddingLeft: 36 }}/>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
                  </div>
                  {/* 一覧 */}
                  {friendCatList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                      {allFriendData.length === 0 ? "読み込み中..." : catSearchQuery ? "カテゴリが見つかりません" : "フレンドの記録がありません"}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(catSearchQuery.trim() || showAllCats ? friendCatList : friendCatList.slice(0, 5)).map(([name, stat]) => (
                        <button key={name} onClick={() => { setSelectedCategory(name); setFriendTabMode("category"); setCrossCatFilterUser(null); setCrossCatFilterRec(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation", boxShadow: "0 2px 8px rgba(24,22,15,0.05)" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                            {getTagEmoji(name)}
                          </div>
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>人生{name}</div>
                            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{stat.count}人が記録</div>
                          </div>
                          <span style={{ color: C.muted }}>›</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!catSearchQuery.trim() && !showAllCats && friendCatList.length > 5 && (
                    <button onClick={() => setShowAllCats(true)}
                      style={{ width: "100%", padding: "10px", background: "none", border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, color: C.sub, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                      残り{friendCatList.length - 5}件を表示
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* フレンド個別ビュー */}
            {friendTabMode === "friend" && viewingUser && (
              <div>
                <button onClick={() => { setFriendTabMode("select"); setViewingUser(null); setFriendCategories([]); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.sub, fontSize: 13, cursor: "pointer", padding: "0 0 14px", fontFamily: "inherit" }}>‹ 戻る</button>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>👤 {viewingUser.name} さんの記録</div>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>訪問日の新しい順</div>

                {/* ソートフィルター */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <select value={friendViewSortCat||""} onChange={e=>setFriendViewSortCat(e.target.value||null)}
                    style={{ ...inputStyle, width: "auto", fontSize: 12, padding: "6px 10px" }}>
                    <option value="">カテゴリ: すべて</option>
                    {[...new Set(friendViewEntries.map(e=>e.categoryName))].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  <select value={friendViewSortRec||""} onChange={e=>setFriendViewSortRec(e.target.value?parseInt(e.target.value):null)}
                    style={{ ...inputStyle, width: "auto", fontSize: 12, padding: "6px 10px" }}>
                    <option value="">おすすめ度: すべて</option>
                    {REC_LEVELS.map(r=><option key={r.value} value={r.value}>{r.short}</option>)}
                  </select>
                </div>

                {friendViewFiltered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>記録がありません</div>
                ) : friendViewFiltered.map((entry, i) => (
                  <EntryCardDisplay key={`${entry.id}-${i}`} entry={entry} isSelf={false}/>
                ))}
              </div>
            )}

            {/* カテゴリ横断ビュー */}
            {friendTabMode === "category" && selectedCategory && (
              <div>
                <button onClick={() => { setSelectedCategory(null); setFriendTabMode("select"); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.sub, fontSize: 13, cursor: "pointer", padding: "0 0 14px", fontFamily: "inherit" }}>‹ 戻る</button>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                  {getTagEmoji(selectedCategory)} 全フレンドの人生{selectedCategory}
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>訪問日の新しい順</div>

                {/* フィルター */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <select value={crossCatFilterUser||""} onChange={e=>setCrossCatFilterUser(e.target.value||null)}
                    style={{ ...inputStyle, width: "auto", fontSize: 12, padding: "6px 10px" }}>
                    <option value="">フレンド: すべて</option>
                    {[...new Set(crossCatViewEntries.map(e=>e.ownerId))].map(id => {
                      const name = crossCatViewEntries.find(e=>e.ownerId===id)?.ownerName;
                      return <option key={id} value={id}>{name}</option>;
                    })}
                  </select>
                  <select value={crossCatFilterRec||""} onChange={e=>setCrossCatFilterRec(e.target.value?parseInt(e.target.value):null)}
                    style={{ ...inputStyle, width: "auto", fontSize: 12, padding: "6px 10px" }}>
                    <option value="">おすすめ度: すべて</option>
                    {REC_LEVELS.map(r=><option key={r.value} value={r.value}>{r.short}</option>)}
                  </select>
                </div>

                {crossCatFiltered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div>記録がありません</div>
                  </div>
                ) : crossCatFiltered.map((entry, i) => (
                  <EntryCardDisplay key={`${entry.id}-${i}`} entry={{ ...entry, categoryName: entry.categoryName }} isSelf={false}/>
                ))}
              </div>
            )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: "#888", whiteSpace: "nowrap" }}>人生</span>
              <div style={{ flex: 1 }}>
                <CategoryInput value={newCatInput} onChange={setNewCatInput} onSelect={name => addCategory(name)} placeholder="うどん、夕日、スキー場..." />
              </div>
            </div>
            {/* 大カテゴリ選択 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 0.5, marginBottom: 8 }}>体験カテゴリ</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {BIG_CATS.map(bc => (
                  <button key={bc.id} onClick={() => setNewCatBigCat(bc.id)} style={{
                    padding: "8px 6px", borderRadius: 10, border: `1.5px solid ${newCatBigCat===bc.id ? C.ink : C.border}`,
                    background: newCatBigCat===bc.id ? C.ink : C.white,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}>
                    <BigCatIcon id={bc.id} size={24}/>
                    <span style={{ fontSize: 9, fontWeight: newCatBigCat===bc.id ? 700 : 400, color: newCatBigCat===bc.id ? C.white : C.sub, textAlign: "center", lineHeight: 1.2 }}>{bc.label}</span>
                  </button>
                ))}
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
      {/* エントリー追加モーダル */}
      {addEntryForCat && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setAddEntryForCat(null)}/>
          <div style={{ position: "relative", background: "#F2EDE4", borderRadius: "20px 20px 0 0", maxHeight: "92vh", overflowY: "auto", zIndex: 1 }}>
            <div style={{ padding: "16px 16px 0", background: C.ink, borderRadius: "20px 20px 0 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>
                ＋ 人生{addEntryForCat.name}を追加
              </div>
            </div>
            <div style={{ padding: "16px" }}>
              <EntryForm
                categoryName={addEntryForCat.name}
                onSave={async (entry) => {
                  const dbEntry = {
                    user_id: user.id,
                    category_id: addEntryForCat.id,
                    name: entry.name,
                    prefecture: entry.prefecture || "",
                    rec: entry.rec ?? 2,
                    star: entry.star ?? 0,
                    tags: entry.tags || [],
                    comment: entry.comment || "",
                    visit_date: entry.visitDate || null,
                    place_data: entry.placeData || null,
                    rank_order: 0,
                  };
                  const { data: newEnt, error } = await supabase.from("entries").insert(dbEntry).select().single();
                  if (error) { alert("保存エラー: " + error.message); return; }
                  const savedId = newEnt?.id || entry.id;
                  if (entry.photo) { try { localStorage.setItem(`photo_${savedId}`, entry.photo); } catch {} }
                  const finalEntry = { ...entry, id: savedId };
                  setCategories(prev => prev.map(c =>
                    c.id === addEntryForCat.id
                      ? { ...c, entries: sortEntriesByStar([...c.entries, finalEntry]) }
                      : c
                  ));
                  setAddEntryForCat(null);
                  // 追加した大カテゴリを表示
                  const bigCatId = addEntryForCat.bigCat || addEntryForCat.big_cat || "eat";
                  setActiveBigCat(bigCatId);
                }}
                onCancel={() => setAddEntryForCat(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ホームから直接編集モーダル */}
      {detailModalEntry && (
        <EntryDetailModal
          entry={detailModalEntry.entry}
          rank={detailModalEntry.rank}
          isSelf={detailModalEntry.isSelf}
          bigCat={detailModalEntry.bigCat}
          onClose={() => setDetailModalEntry(null)}
          onEdit={() => setEditingHomeEntry(detailModalEntry.entry)}
          onDelete={async () => {
            await supabase.from("entries").delete().eq("id", detailModalEntry.entry.id);
            setCategories(prev => prev.map(c => c.name === detailModalEntry.entry.categoryName ? { ...c, entries: c.entries.filter(en => en.id !== detailModalEntry.entry.id) } : c));
          }}
        />
      )}

      {editingHomeEntry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setEditingHomeEntry(null)}/>
          <div style={{ position: "relative", background: "#F2EDE4", borderRadius: "20px 20px 0 0", maxHeight: "90vh", overflowY: "auto", zIndex: 1 }}>
            <div style={{ padding: "16px 16px 0", background: C.ink, borderRadius: "20px 20px 0 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>
                ✏️ {editingHomeEntry.categoryName} を編集
              </div>
            </div>
            <div style={{ padding: "16px" }}>
              <EntryForm
                initial={editingHomeEntry}
                categoryName={editingHomeEntry.categoryName}
                onSave={async (updated) => {
                  const dbEntry = {
                    name: updated.name,
                    prefecture: updated.prefecture || "",
                    rec: updated.rec ?? 2,
                    star: updated.star ?? 0,
                    tags: updated.tags || [],
                    comment: updated.comment || "",
                    visit_date: updated.visitDate || null,
                    place_data: updated.placeData || null,
                  };
                  await supabase.from("entries").update(dbEntry).eq("id", editingHomeEntry.id);
                  if (updated.photo) { try { localStorage.setItem(`photo_${editingHomeEntry.id}`, updated.photo); } catch {} }
                  setCategories(prev => prev.map(c =>
                    c.name === editingHomeEntry.categoryName
                      ? { ...c, entries: sortEntriesByStar(c.entries.map(e => e.id === editingHomeEntry.id ? { ...e, ...updated, id: e.id } : e)) }
                      : c
                  ));
                  setEditingHomeEntry(null);
                  setExpandedEntryId(null);
                }}
                onCancel={() => setEditingHomeEntry(null)}
              />
            </div>
          </div>
        </div>
      )}

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