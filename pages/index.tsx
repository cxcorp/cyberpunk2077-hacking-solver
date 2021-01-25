import Head from "next/head";
import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
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
import Button from "../components/Button";

import { parseMatrix } from "../util";
import { SolverResult } from "../lib/bruter";
import styles from "../styles/Index.module.scss";

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

const HackButton: FC<{
  disabled?: boolean;
}> = ({ disabled }) => {
  return (
    <div className={styles["hack-button"]}>
      <Button
        type="submit"
        disabled={disabled}
        className={styles["hack-button__button"]}
      >
        SOLVE
      </Button>
    </div>
  );
};

const sendStats = async ({
  bufferSize,
  sequenceCount,
  sequencesMatched,
  solutionLength,
  matrixSize,
}) => {
  if (process.env.NEXT_PUBLIC_UA_ENABLED !== "true") {
    console.log("ne");
    console.log(process.env.NEXT_PUBLIC_UA_ENABLED);
    return null;
  } //ec, ea, el, ev

  const evs = [
    { ec: "Solver", ea: "Buffer size", el: `${bufferSize}`, ev: 1 },
    { ec: "Solver", ea: "Sequence count", el: `${sequenceCount}`, ev: 1 },
    {
      ec: "Solver",
      ea: "Sequences matched",
      el: `${sequencesMatched}`,
      ev: 1,
    },
    { ec: "Solver", ea: "Solution length", el: `${solutionLength}`, ev: 1 },
    { ec: "Solver", ea: "Matrix size", el: `${matrixSize}`, ev: 1 },
  ];

  try {
    return fetch(`/api/eventview`, {
      method: "POST",
      body: JSON.stringify({ dp: window.location.pathname, evs }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {}
};

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

  const onModalHide = useCallback(() => setModalVisible(false), [
    setModalVisible,
  ]);

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

  runSolver = (useSequencePriorityOrder?: boolean) => {
    const { matrixText, sequencesText, bufferSize } = this.state;
    this.setState({ solverRunning: true });

    setTimeout(async () => {
      const solve = (await import("../lib/bruter")).default;
      console.log("running");

      const matrix = parseMatrix(matrixText);
      const sequences = parseMatrix(sequencesText);
      const solution = solve(matrix, sequences, bufferSize, {
        useSequencePriorityOrder,
      });
      console.log("solution", solution);

      sendStats({
        bufferSize: bufferSize,
        matrixSize: matrix[0].length,
        sequenceCount: sequences.length,
        sequencesMatched: solution.match.includes.length,
        solutionLength: solution.match.result.length,
      });

      this.setState({
        solution,
        allSequencesLen: sequences.length,
        codeMatrix: matrix,
        modalVisible: true,
        solverRunning: false,
      });
    }, 1);
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
