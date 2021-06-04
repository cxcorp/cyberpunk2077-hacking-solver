import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />

          {/* SimpleAnalytics */}
          <script
            async
            defer
            data-collect-dnt="true"
            src="https://sa.cyberpunk-hacker.com/latest.js"
          ></script>
          <noscript>
            <img
              src="https://sa.cyberpunk-hacker.com/noscript.gif?collect-dnt=true"
              alt=""
              referrerPolicy="no-referrer-when-downgrade"
            />
          </noscript>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
