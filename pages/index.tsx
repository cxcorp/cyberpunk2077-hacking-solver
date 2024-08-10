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
import { createWorker, PSM } from "tesseract.js";

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
import * as CvService from "../services/cv";
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

const areWorkersLoaded = (
  workersLoadingPromiseRef: React.MutableRefObject<Promise<void>>,
  cvWorkerRef: React.MutableRefObject<CvService.CvWorker>,
  ocrWorkerRef: React.MutableRefObject<Tesseract.Worker>
) => {
  return (
    cvWorkerRef.current &&
    ocrWorkerRef.current &&
    !workersLoadingPromiseRef.current
  );
};

const loadWorkers = async (
  cvWorkerRef: React.MutableRefObject<CvService.CvWorker>,
  ocrWorkerRef: React.MutableRefObject<Tesseract.Worker>,
  setOcrStatus: React.Dispatch<
    React.SetStateAction<{
      progress: number;
      text: string;
    }>
  >
) => {
  const uniqChars = (arr) => [...new Set(arr.join("").split(""))];
  const getOcrWhitelist = () =>
    [" ", ...uniqChars(["1C", "55", "7A", "BD", "E9", "FF"])].join("");

  const cv = await CvService.createWorker();
  cv.worker.addEventListener("message", (e) => console.log("onmessage", e));
  cv.worker.addEventListener("error", (e) => console.error("onerror", e));
  await cv.load();
  console.log("CV worker loaded ");
  cvWorkerRef.current = cv;

  const ocrWorker = createWorker({
    langPath: "/ocr",
    gzip: true,
    logger: (msg) => {
      console.log("[tesseract] ", msg);
      if (msg?.userJobId?.startsWith("code_matrix-")) {
        const matrixProgress = msg.progress;
        // 50->80
        const progress = 50 + (80 - 50) * matrixProgress;
        console.log("codematrix", progress);
        setOcrStatus({
          progress,
          text: "Reading code matrix...",
        });
      } else if (msg?.userJobId?.startsWith("sequences-")) {
        const sequenceProgress = msg.progress;
        // 80->99
        const progress = 80 + (99 - 80) * sequenceProgress;
        console.log("sequence", progress);
        setOcrStatus({
          progress,
          text: "Reading sequences...",
        });
      }
    },
    errorHandler: (err) => {
      console.error("[tesseract] ", err);
    },
  });

  console.log("loading worker");
  await ocrWorker.load();
  console.log("loading OCR language data");
  await ocrWorker.loadLanguage("eng");
  console.log("initializing OCR language data");
  await ocrWorker.initialize("eng");
  await ocrWorker.setParameters({
    tessedit_char_whitelist: getOcrWhitelist(),
    // @ts-ignore
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // if block doesn't work well enough, slice grids into columns
  });
  ocrWorkerRef.current = ocrWorker;
  console.log("OCR worker loaded");
};

const useCv = (setModalVisible: (visible: boolean) => void) => {
  const { onMatrixChanged, onSequencesChanged, onRunSolver } = useAppContext();

  const workersLoadingPromise = useRef<Promise<void>>(null);
  const cvWorkerRef = useRef<CvService.CvWorker>(null);
  const ocrWorkerRef = useRef<Tesseract.Worker>(null);

  const [ocrStatus, setOcrStatus] = useState<{
    progress: number;
    text: string;
  }>();

  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const getFileImageData = (file: File) => {
      return new Promise<ImageData>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const img = document.createElement("img");
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        };
        img.onerror = () => {
          reject(new Error("Failed to load clipboard image!"));
        };

        const fr = new FileReader();
        fr.onload = () => {
          const dataUrl = fr.result as string;
          img.src = dataUrl;
        };
        fr.onerror = () => {
          reject(new Error("Failed to read file!"));
        };
        fr.readAsDataURL(file);
      });
    };

    async function processImage(imageData: ImageData) {
      console.log("processing screenshot");
      setOcrStatus({
        text: "Processing screenshot...",
        progress: 20,
      });
      const output = await cvWorkerRef.current.processScreenshot(imageData);

      const ctx = outputCanvasRef.current.getContext("2d");
      const putImage = (img: ImageData) => {
        outputCanvasRef.current.width = img.width;
        outputCanvasRef.current.height = img.height;
        ctx.putImageData(img, 0, 0);
      };

      setOcrStatus({
        text: "Running OCR...",
        progress: 60,
      });
      console.log("running OCR");
      console.log("OCRing code matrix");
      putImage(output.codeMatrix);
      const codeMatrix = await ocrWorkerRef.current.recognize(
        outputCanvasRef.current,
        undefined,
        "code_matrix-" + Math.random().toString(36).substr(2, 5)
      );
      console.log("%cCODE MATRIX OCR RESULT:", "color:#00ff00");
      console.log(codeMatrix.data);

      console.log("OCRing sequences");
      putImage(output.sequences);
      const sequences = await ocrWorkerRef.current.recognize(
        outputCanvasRef.current,
        undefined,
        "sequences-" + Math.random().toString(36).substr(2, 5)
      );
      console.log("%cSEQUENCES OCR RESULT:", "color:#00ff00");
      console.log(sequences.data);

      setOcrStatus({
        progress: 100,
        text: "Flushing...",
      });
      putImage(output.comboImage);

      onMatrixChanged(codeMatrix.data.text);
      onSequencesChanged(sequences.data.text);
      setOcrStatus(() => undefined);
      onRunSolver(undefined, {
        sequencesText: sequences.data.text,
        matrixText: codeMatrix.data.text,
      });
    }

    async function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind !== "file" || !item.type.startsWith("image")) {
          continue;
        }

        console.log({
          i,
          kind: item.kind,
          type: item.type,
        });

        console.log("reading clipboard file");
        setOcrStatus({
          text: "Reading image...",
          progress: 0,
        });
        const file = item.getAsFile();
        console.log("getting file image data");
        const imageData = await getFileImageData(file);

        if (
          !areWorkersLoaded(workersLoadingPromise, cvWorkerRef, ocrWorkerRef)
        ) {
          const promise = loadWorkers(cvWorkerRef, ocrWorkerRef, setOcrStatus);
          workersLoadingPromise.current = promise;
          await promise;
        }

        setTimeout(() => processImage(imageData), 0);
        onMatrixChanged("");
        onSequencesChanged("");
        setModalVisible(false);

        e.preventDefault();
        return;
      }
    }

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return {
    ocrStatus,
    outputCanvasRef,
  };
};

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
