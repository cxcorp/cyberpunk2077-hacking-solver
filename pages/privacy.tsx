import Head from "next/head";
import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";
import Layout from "../components/Layout";
import MainTitle from "../components/MainTitle";
import styles from "../styles/PrivacyPage.module.scss";

const PrivacyPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | Cyberpunk 2077 Hacking Minigame Solver</title>
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
                  applies. This website does not gather information about its
                  visitors, other than the information gathered by Vercel.
                </p>
                <p>
                  Any possible changes to the site's privacy policy will be
                  updated on this page.
                </p>

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
};

export default PrivacyPage;
