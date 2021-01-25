import Head from "next/head";
import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";
import Layout from "../components/Layout";
import MainTitle from "../components/MainTitle";
import styles from "../styles/PrivacyPage.module.scss";

const PrivacyPage = () => (
  <>
    <Head>
      <title>Privacy Policy | Cyberpunk 2077 Hacking Minigame Solver</title>
      <meta
        property="og:title"
        content="Privacy Policy | Cyberpunk 2077 Hacking Minigame Solver"
      />
    </Head>
    <Layout>
      <Container as="main" className={styles.main}>
        <Row>
          <Col>
            <MainTitle className={styles.title} />
            <h2 className={styles.header}>Privacy Policy</h2>
            <div className={styles.content}>
              <p>
                This website is hosted on Vercel, and as such{" "}
                <a href="https://vercel.com/legal/privacy-policy">
                  Vercel's Privacy Policy
                </a>{" "}
                applies.
              </p>
              <p>
                This app gathers the following anonymous analytics to determine
                areas which need improvement:
                <ul>
                  <li>
                    <a href="https://web.dev/vitals/" rel="noopener">
                      Web Vitals
                    </a>{" "}
                    such as Largest Contentful Paint, First Input Delay and
                    Cumulative Layout Shift
                  </li>
                  <li>
                    Page loads: user agent and page path (to see if there are
                    browsers that the app needs to optimize for)
                  </li>
                </ul>
              </p>
              <p>
                Additionally, anonymous statistics are gathered about the
                solver's performance, such as:
                <ul>
                  <li>Buffer size</li>
                  <li>Matrix size (n*n)</li>
                  <li>
                    Solution success (how many sequences were entered and how
                    many could be solved for)
                  </li>
                  <li>Sequence prioritization order</li>
                </ul>
              </p>
              <p>
                Any possible changes to the site's privacy policy will be
                updated on this page.
              </p>
              <p>Last updated: 2021-01-06</p>

              <hr />
              <p>
                <Link href="/">
                  <a className={styles.backlink}>{"< "}Back to the tool</a>
                </Link>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </Layout>
  </>
);

export default PrivacyPage;
