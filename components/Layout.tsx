import { FC } from "react";
import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";
import styles from "../styles/Layout.module.scss";

function PrivacyLink() {
  return (
    <Link href="/privacy">
      <a className={styles["privacy-link"]}>Privacy</a>
    </Link>
  );
}

function Copyright({ className }: { className?: string }) {
  return <p className={className}>cxcorp | 2020</p>;
}

const Layout: FC = ({ children }) => {
  return (
    <>
      <div className={styles.backdrop} />
      <div className={styles.container}>
        {children}
        <footer className={styles.footer}>
          <Container>
            <Row>
              <Col>
                <PrivacyLink />
              </Col>
              <Col>
                <Copyright className={styles.copyright} />
              </Col>
            </Row>
          </Container>
        </footer>
      </div>
    </>
  );
};

export default Layout;
