import Head from "next/head";
import "../styles/globals.scss";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />

        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500&family=Roboto&display=swap"
          rel="stylesheet"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cyberpunk-hacker.com" />
        <meta
          property="og:description"
          content="Cyberpunk 2077 Breach Protocol hacking minigame solver."
        />
        <meta
          name="description"
          content="Cyberpunk 2077 Breach Protocol hacking minigame solver."
        />
        <meta
          property="article:published_time"
          content="2020-12-20T11:37:00+00:00"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
