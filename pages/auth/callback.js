// pages/auth/callback.js
// Googleログイン後のコールバックページ
// ポップアップ内で実行され、親ウィンドウにセッション情報を送る

import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    async function handleCallback() {
      // URLのハッシュからセッションを取得
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        // 親ウィンドウにセッション情報を送信
        if (window.opener) {
          window.opener.postMessage(
            { type: "SUPABASE_AUTH_SUCCESS", session },
            window.location.origin
          );
          window.close();
        } else {
          // ポップアップでない場合は通常リダイレクト
          window.location.href = "/";
        }
      } else {
        if (window.opener) {
          window.opener.postMessage(
            { type: "SUPABASE_AUTH_ERROR", error: error?.message },
            window.location.origin
          );
          window.close();
        } else {
          window.location.href = "/";
        }
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
      fontFamily: "sans-serif",
      background: "#F7F3EE",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <div style={{ fontSize: 14, color: "#AAA" }}>認証中...</div>
      </div>
    </div>
  );
}
