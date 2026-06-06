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
              <p>This website doesn't track you.</p>
              <p>
                Any possible changes to the site's privacy policy will be
                updated on this page.
              </p>
              <p>Last updated: 2026-06-07</p>

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
