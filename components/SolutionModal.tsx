import { FC, useCallback, useEffect, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Coord, SolverResult } from "../lib/bruter";
import styles from "../styles/SolutionModal.module.scss";
import React from "react";

interface Props {
  className?: string;
  onHide: () => void;
  show: boolean;
  result: SolverResult | null;
  allSequencesLen: number;
  codeMatrix: number[][];
}

const Sb: FC = ({ children }) => {
  return <span className={styles.semibold}>{children}</span>;
};

interface SolutionRendererProps {
  codeMatrix: number[][];
  solution: Coord[];
}

const fmtRow = (row: number[]) =>
  row.map((n) => n.toString(16).toUpperCase()).join("  ");

const renderSolution = (
  parent: HTMLElement,
  canvas: HTMLCanvasElement,
  codeMatrix: number[][],
  solution: Coord[]
) => {
  const parentWidth = parent.clientWidth;
  canvas.height = parentWidth;
  canvas.height = parentWidth;
  const ctx = canvas.getContext("2d");
  ctx.font = '500 16px "Rajdhani Mod", Meno, Consolas, monospace';
  ctx.fillStyle = "#d0ed57";

  const byteSize = ctx.measureText(codeMatrix[0][0].toString(16).toUpperCase());
  const square = byteSize.width;

  for (let y = 0; y < codeMatrix.length; y++) {
    for (let x = 0; x < codeMatrix[0].length; x++) {
      ctx.fillText(
        codeMatrix[y][x].toString(16).toUpperCase(),
        x * square * 2,
        y * square * 2
      );
    }
  }

  

  console.log();
};

const SolutionRenderer = ({ codeMatrix, solution }: SolutionRendererProps) => {
  const parentRef = React.createRef<HTMLDivElement>();
  const canvasRef = React.createRef<HTMLCanvasElement>();

  useEffect(() => {
    renderSolution(parentRef.current, canvasRef.current, codeMatrix, solution);
  }, [codeMatrix, solution]);

  return (
    <div className={styles.renderer} ref={parentRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

interface BodyProps {
  result: SolverResult;
  allSequencesLen: number;
  codeMatrix: number[][];
}

const Body = ({ result, allSequencesLen, codeMatrix }: BodyProps) => {
  if (result === null) {
    return <p>No solutions were discovered.</p>;
  }

  const { match, solution } = result;
  const { includes, result: optimalSequence } = match;
  return (
    <>
      {allSequencesLen !== includes.length && (
        <>
          <p className={styles.note}>
            <Sb>
              Not all sequences could be included - either buffer is too small
              or no solution exists.
            </Sb>
          </p>
          <div>
            <p className="mb-0">
              <Sb>
                Matched {includes.length}/{allSequencesLen} sequences:
              </Sb>
            </p>
            <ul>
              {includes.map((inc) => {
                const str = inc
                  .map((n) => n.toString(16).toUpperCase())
                  .join(" ");
                return <li key={str}>{str}</li>;
              })}
            </ul>
          </div>
        </>
      )}
      <p>
        <Sb>Optimal sequence: </Sb>
        {optimalSequence.map((n) => n.toString(16).toUpperCase()).join(" ")}
      </p>
      <div>
        <p>
          <Sb>Solution:</Sb>
        </p>
        <SolutionRenderer codeMatrix={codeMatrix} solution={solution} />
      </div>
    </>
  );
};

export default function SolutionModal({
  className,
  result,
  show,
  onHide,
  allSequencesLen,
  codeMatrix,
}: Props) {
  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>SOLUTION</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Body
          result={result}
          allSequencesLen={allSequencesLen}
          codeMatrix={codeMatrix}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          CLOSE
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
