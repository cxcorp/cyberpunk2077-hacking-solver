import { FC, useCallback } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Coord, SolverResult } from "../lib/bruter";
import styles from "../styles/SolutionModal.module.scss";

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
  solution: Coord[][];
}

const SolutionRenderer = ({ codeMatrix, solution }: SolutionRendererProps) => {
  return <div className={styles.renderer}>solution</div>;
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
  console.log(match);
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
