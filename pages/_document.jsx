import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* 基本メタ */}
        <meta charSet="utf-8" />
        <meta name="application-name" content="人生ノート" />
        <meta name="description" content="人生で最高だった場所・体験・食を記録する、あなただけのランキングノート。うどん、夕日、サウナ…「また絶対行く」を永遠に残そう。" />
        <meta name="keywords" content="人生ノート,旅行,グルメ,体験,ランキング,記録,Life Journal" />
        <meta name="author" content="人生ノート" />
        <meta name="theme-color" content="#1A1208" />

        {/* OGP */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="人生ノート" />
        <meta property="og:title" content="人生ノート — Life Journal" />
        <meta property="og:description" content="人生最高を、記録しよう。うどん、夕日、サウナ…あなただけのランキングノート。" />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:locale" content="ja_JP" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="人生ノート — Life Journal" />
        <meta name="twitter:description" content="人生最高を、記録しよう。" />
        <meta name="twitter:image" content="/icon-512.png" />

        {/* PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="人生ノート" />
        <link rel="manifest" href="/manifest.json" />

        {/* アイコン */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
