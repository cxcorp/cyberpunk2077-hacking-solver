import Head from "next/head";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import cz from "classnames";

import {
  AppContext,
  AppContextType,
  useAppContext,
} from "../components/AppContext";
import Layout from "../components/Layout";
import CodeMatrixTextBox from "../components/CodeMatrixTextBox";
import SequencesTextBox from "../components/SequencesTextBox";
import BufferSizeBox from "../components/BufferSizeBox";
import MainTitle from "../components/MainTitle";
import SolutionModal from "../components/SolutionModal";

import { parseMatrix } from "../util";
import { SolverResult } from "../lib/bruter";
import styles from "../styles/Index.module.scss";
import HackButton from "../components/HackButton";
import useCv from "../hooks/useCv";

const HackBox = () => (
  <div className={styles.hackbox}>
    <div className={styles.hackbox__header}>
      <div className={styles.hackbox__sequence}>2</div>
      <h3 className={styles.hackbox__header_text}>ENTER CODE MATRIX</h3>
    </div>
    <div className={styles.hackbox__inside}>
      <CodeMatrixTextBox />
    </div>
  </div>
);

const SequenceBox = () => (
  <div className={styles["sequence-box"]}>
    <div className={styles["sequence-box__header"]}>
      <div className={styles["sequence-box__sequence"]}>3</div>
      <h3 className={styles["sequence-box__header-text"]}>ENTER SEQUENCES</h3>
    </div>
    <div className={styles["sequence-box__inside"]}>
      <SequencesTextBox />
    </div>
  </div>
);

const Separator = ({ className }: { className?: string }) => (
  <hr className={cz(styles.separator, className)} />
);

const ReportIssue = () => {
  return (
    <p className={styles["report-issue"]}>
      Having issues? Solver not working?{" "}
      <a
        href="https://github.com/cxcorp/cyberpunk2077-hacking-solver/issues"
        rel="noopener"
        target="_blank"
      >
        Report an issue
      </a>
      .
    </p>
  );
};

interface IndexProps {
  codeMatrix: number[][];
  allSequencesLen: number;
  solution: SolverResult | null;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

const Index = ({
  codeMatrix,
  allSequencesLen,
  solution,
  modalVisible,
  setModalVisible,
}: IndexProps) => {
  const {
    matrixText,
    onMatrixChanged,
    sequencesText,
    onSequencesChanged,
    solverRunning,
    onRunSolver,
  } = useAppContext();

  const { ocrStatus, outputCanvasRef } = useCv(setModalVisible);

  const inputsEmpty = useMemo(
    () => sequencesText.trim().length === 0 || matrixText.trim().length === 0,
    [sequencesText, matrixText]
  );

  const handleHackButtonClick = useCallback(
    async (e) => {
      e.preventDefault();
      onRunSolver();
    },
    [onRunSolver]
  );

  const onModalHide = useCallback(
    () => setModalVisible(false),
    [setModalVisible]
  );

  const [hasJS, setHasJS] = useState(false);
  useEffect(() => {
    setHasJS(true);
  }, []);

  return (
    <Layout>
      <Head>
        <title>Cyberpunk 2077 Hacking Minigame Solver</title>
        <meta
          property="og:title"
          content="Cyberpunk 2077 Hacking Minigame Solver"
        />
      </Head>

      <SolutionModal
        show={modalVisible}
        onHide={onModalHide}
        result={solution}
        allSequencesLen={allSequencesLen}
        codeMatrix={codeMatrix}
      />

      <Container as="main" className={styles.main}>
        <Row>
          <Col>
            <MainTitle className={styles.title} />
            <h2 className={styles.description}>
              Instant Breach Protocol solver - start cracking, samurai.
            </h2>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <div className={styles["description-separator"]}></div>
          </Col>
        </Row>

        {!hasJS && (
          <noscript style={{ fontSize: "3rem", color: "red" }}>
            <Row>
              <Col lg={12}>
                This application currently requires JavaScript to run.
              </Col>
            </Row>
          </noscript>
        )}

        <form onSubmit={handleHackButtonClick}>
          <Row>
            <Col>
              <canvas ref={outputCanvasRef} />
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
              <HackButton disabled={solverRunning || inputsEmpty} />
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              {ocrStatus && (
                <>
                  <p>{ocrStatus.text}</p>
                  <progress max="100" value={ocrStatus.progress} />
                </>
              )}
            </Col>
          </Row>
        </form>
        <Separator className="mt-5" />

        <Row>
          <Col>
            <ReportIssue />
          </Col>
        </Row>
        <Row className="mt-5">
          <Col lg={8}>
            <p>
              THIS APP IS NOT AFFILIATED WITH CD PROJEKT RED OR CYBERPUNK 2077.
              TRADEMARK "CYBERPUNK 2077" IS OWNED BY CD PROJEKT{" "}
              <span
                onClick={() => {
                  onSequencesChanged(`BD E9 1C
BD 7A BD
BD 1C BD 55`);
                  onMatrixChanged(`7A 55 E9 E9 1C 55
55 7A 1C 7A E9 55
55 1C 1C 55 E9 BD
BD 1C 7A 1C 55 BD
BD 55 BD 7A 1C 1C
1C 55 55 7A 55 7A`);
                }}
              >
                S.A.
              </span>
            </p>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

interface IndexContainerState {
  matrixText: string;
  sequencesText: string;
  bufferSize: number;
  solverRunning: boolean;

  codeMatrix: number[][];
  allSequencesLen: number;
  solution: SolverResult | null;
  modalVisible: boolean;
  unprioritizedSequencesText: string;
}

class IndexContainer extends React.Component<{}, IndexContainerState> {
  state = {
    matrixText: "",
    sequencesText: "",
    bufferSize: 4,
    solverRunning: false,
    codeMatrix: [],
    allSequencesLen: 0,
    solution: null,
    modalVisible: false,
    unprioritizedSequencesText: "",
  };

  setMatrixText = (text: string) => this.setState({ matrixText: text });
  setSequencesText = (text: string, cb?: () => void) =>
    this.setState({ sequencesText: text }, cb);
  setBufferSize = (size: number) => this.setState({ bufferSize: size });
  setSolverRunning = (running: boolean) =>
    this.setState({ solverRunning: running });
  setCodeMatrix = (matrix: number[][]) => this.setState({ codeMatrix: matrix });
  setAllSequencesLen = (len: number) => this.setState({ allSequencesLen: len });
  setSolution = (solution: SolverResult | null) => this.setState({ solution });
  setModalVisible = (visible: boolean) =>
    this.setState({ modalVisible: visible });
  setUnprioritizedSequencesText = (text: string) =>
    this.setState({ unprioritizedSequencesText: text });

  runSolver = (
    useSequencePriorityOrder?: boolean,
    overrides?: { sequencesText?: string; matrixText?: string }
  ) => {
    const { bufferSize, unprioritizedSequencesText } = this.state;
    const sequencesText = overrides?.sequencesText || this.state.sequencesText;
    const matrixText = overrides?.matrixText || this.state.matrixText;

    const scheduleSolve = () =>
      setTimeout(async () => {
        const solve = (await import("../lib/bruter")).default;
        console.log("running");

        const matrix = parseMatrix(matrixText);
        const sequences = parseMatrix(sequencesText);
        const solution = solve(matrix, sequences, bufferSize, {
          useSequencePriorityOrder,
        });
        console.log("solution", {
          solution,
          useSequencePriorityOrder,
          sequencesText,
          unprioritizedSequencesText,
        });

        this.setState({
          solution,
          allSequencesLen: sequences.length,
          codeMatrix: matrix,
          modalVisible: true,
          solverRunning: false,
        });
      }, 1);

    if (useSequencePriorityOrder) {
      this.setState({ solverRunning: true }, scheduleSolve);
    } else {
      this.setState(
        {
          solverRunning: true,
          unprioritizedSequencesText: sequencesText,
        },
        scheduleSolve
      );
    }
  };

  render() {
    const {
      matrixText,
      sequencesText,
      bufferSize,
      solverRunning,
      codeMatrix,
      allSequencesLen,
      solution,
      modalVisible,
      unprioritizedSequencesText,
    } = this.state;

    const ctx: AppContextType = {
      matrixText,
      onMatrixChanged: this.setMatrixText,
      sequencesText,
      onSequencesChanged: this.setSequencesText,
      bufferSize,
      onBufferSizeChanged: this.setBufferSize,
      solverRunning,
      onRunSolver: this.runSolver,
      unprioritizedSequencesText,
      setUnprioritizedSequencesText: this.setUnprioritizedSequencesText,
    };

    return (
      <AppContext.Provider value={ctx}>
        <Index
          {...{
            codeMatrix,
            allSequencesLen,
            solution,
            modalVisible,
            setModalVisible: this.setModalVisible,
          }}
        />
      </AppContext.Provider>
    );
  }
}

export default IndexContainer;
