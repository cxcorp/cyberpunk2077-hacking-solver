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
                This website gathers anonymous metrics to understand where our
                traffic comes from, which pages are visited, and what kind of
                devices visit the site (e.g. screen size, whether the device is
                a mobile or desktop device). These metrics are used to create a
                better experience for visitors.
              </p>
              <p>
                This website does not track you, serve personalized advertising,
                or sell the data to anyone. The metrics on this website are
                powered by{" "}
                <a href="https://www.simpleanalytics.com/">Simple Analytics</a>,
                a privacy-friendly web analytics provider. You can learn more
                about the types of metrics collected{" "}
                <a href="https://docs.simpleanalytics.com/data-collection">
                  here
                </a>
                .
              </p>
              <p>
                Any possible changes to the site's privacy policy will be
                updated on this page.
              </p>
              <p>Last updated: 2024-08-12</p>

              <hr />
              <p>
                <Link href="/">
                  <a className={styles.backlink}>{"< "}Back</a>
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
