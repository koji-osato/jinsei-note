// pages/auth/callback.js
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("認証中...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // URLのハッシュ/クエリからセッションを確立
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("認証エラーが発生しました");
          setTimeout(() => { window.location.href = "/"; }, 2000);
          return;
        }

        if (session?.user) {
          // プロフィール確認
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", session.user.id)
            .single();

          if (profile?.name) {
            // プロフィール設定済み → ホームへ
            setStatus("ログイン成功！");
            window.location.href = "/";
          } else {
            // プロフィール未設定 → ホームへ（Appがprofile_setupに誘導）
            setStatus("プロフィールを設定してください");
            window.location.href = "/";
          }
        } else {
          // セッションなし → ホームへ戻る
          window.location.href = "/";
        }
      } catch (e) {
        window.location.href = "/";
      }
    }

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F7F3EE",
      fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📖</div>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#2C2420", marginBottom: 8 }}>人生ノート</div>
        <div style={{ fontSize: 14, color: "#AAA" }}>{status}</div>
      </div>
    </div>
  );
}