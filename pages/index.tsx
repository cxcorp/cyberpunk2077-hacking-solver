import Head from "next/head";
import React, { useState, useMemo, useCallback, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";

import {
  AppContext,
  AppContextType,
  useAppContext,
} from "../components/AppContext";
import Layout from "../components/Layout";
import FilteredTextArea from "../components/FilteredTextArea";
import BufferSizeBox from "../components/BufferSizeBox";
import MainTitle from "../components/MainTitle";
import styles from "../styles/Home.module.scss";

const placeholder = `7A 55 E9 E9 1C 55
55 7A 1C 7A E9 55
55 1C 1C 55 E9 BD
BD 1C 7A 1C 55 BD
BD 55 BD 7A 1C 1C
1C 55 55 7A 55 7A`;

const hexMatrixRegex = /[0-9a-f\s\n\r]/i;

function HackBoxTextBox() {
  const { matrixText, onMatrixChanged } = useAppContext();

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onMatrixChanged(e.currentTarget.value);
    },
    [onMatrixChanged]
  );

  return (
    <FilteredTextArea
      regex={hexMatrixRegex}
      value={matrixText}
      onChange={onChange}
      placeholder={placeholder}
      className={styles["hackbox-textbox"]}
    />
  );
}

function HackBox() {
  return (
    <div className={styles.hackbox}>
      <div className={styles.hackbox__header}>
        <div className={styles.hackbox__sequence}>2</div>
        <p>ENTER CODE MATRIX</p>
      </div>
      <div className={styles.hackbox__inside}>
        <HackBoxTextBox />
      </div>
    </div>
  );
}

const sequencesPlaceholder = `BD E9 1C
BD 7A BD
BD 1C BD 55`;
function SequencesSelector() {
  const { sequencesText, onSequencesChanged } = useAppContext();

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onSequencesChanged(e.currentTarget.value);
    },
    [onSequencesChanged]
  );

  return (
    <FilteredTextArea
      regex={hexMatrixRegex}
      value={sequencesText}
      onChange={onChange}
      placeholder={sequencesPlaceholder}
      className={styles["sequences-selector"]}
    />
  );
}

function SequenceBox() {
  return (
    <div className={styles["sequence-box"]}>
      <div className={styles["sequence-box__header"]}>
        <div className={styles["sequence-box__sequence"]}>3</div>
        <p>ENTER SEQUENCES</p>
      </div>
      <div className={styles["sequence-box__inside"]}>
        <SequencesSelector />
      </div>
    </div>
  );
}

const parseMatrix = (str: string): number[][] =>
  str
    .trim()
    .split(/[(\n|\r\n)]/)
    .map((row) =>
      row
        .trim()
        .split(/\s+/)
        .map((n) => parseInt(n, 16))
    );

function HackButton({ onClick }: { onClick: () => void }) {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);
  return (
    <div className={styles["hack-button"]}>
      <button onClick={handleClick} className={styles["hack-button__button"]}>
        SOLVE
      </button>
    </div>
  );
}

export default function Home() {
  const [matrixText, onMatrixChanged] = useState<string>("");
  const [sequencesText, onSequencesChanged] = useState<string>("");
  const [bufferSize, onBufferSizeChanged] = useState<number>(4);

  const state = useMemo<AppContextType>(
    () => ({
      matrixText,
      onMatrixChanged,
      sequencesText,
      onSequencesChanged,
      bufferSize,
      onBufferSizeChanged,
    }),
    [
      matrixText,
      onMatrixChanged,
      sequencesText,
      onSequencesChanged,
      bufferSize,
      onBufferSizeChanged,
    ]
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleHackButtonClick = useCallback(async () => {
    const { matrixText, sequencesText, bufferSize } = stateRef.current;
    console.log("start");

    const runSolver = (await import("../lib/bruter")).default;
    console.log("running");
    const matrix = parseMatrix(matrixText);
    const sequences = parseMatrix(sequencesText);
    console.log(matrix, sequences);
    const solutions = runSolver(matrix, sequences, bufferSize);
    console.log(solutions);
  }, [stateRef]);

  return (
    <AppContext.Provider value={state}>
      <Layout>
        <Head>
          <title>Optimal Cyberpunk 2077 Hacker Tool</title>
        </Head>

        <Container as="main" className={styles.main}>
          <Row>
            <Col>
              <MainTitle className={styles.title} />
              <p className={styles.description}>
                INSTANT BREACH PROTOCOL SOLVER - START CRACKING, SAMURAI
              </p>
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              <div className={styles["description-separator"]}></div>
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              <BufferSizeBox />
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              <HackBox />
            </Col>
            <Col lg={4}>
              <SequenceBox />
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              <HackButton onClick={handleHackButtonClick} />
            </Col>
          </Row>
        </Container>
      </Layout>
    </AppContext.Provider>
  );
}
