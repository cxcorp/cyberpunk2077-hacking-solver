import React, {
  FC,
  useCallback,
  useContext,
  useRef,
  useEffect,
  useMemo,
} from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import debounce from "lodash/debounce";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import cz from "classnames";

import { useAppContext } from "../components/AppContext";
import { GridVerticalIcon } from "../components/Icons";
import { parseMatrix, arrayMove } from "../util";
import { Coord, SolverResult } from "../lib/bruter";
import styles from "../styles/SolutionModal.module.scss";

interface SolutionContextType {
  result: SolverResult | null;
}
const SolutionContext = React.createContext<SolutionContextType>({
  result: null,
});

const Sb: FC<{ className?: string }> = ({ children, className }) => {
  return <span className={cz(styles.semibold, className)}>{children}</span>;
};

const Code: FC = ({ children }) => (
  <span className={styles.code}>{children}</span>
);

interface SolutionRendererProps {
  codeMatrix: number[][];
  solution: Coord[];
}

const renderSolution = (
  parent: HTMLElement,
  canvas: HTMLCanvasElement,
  codeMatrix: number[][],
  solution: Coord[]
) => {
  const paddingX = 10;
  const paddingY = 25;
  const parentWidth = parent.clientWidth;
  canvas.width = parentWidth;
  canvas.height = parentWidth;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#d0ed57";
  ctx.textBaseline = "top";

  let squareInternalPad = 3;
  let fontSize = 1.4;
  if (window.innerWidth >= 1200) {
    fontSize = 1.8;
    squareInternalPad = 6;
  } else if (window.innerWidth >= 992) {
    fontSize = 1.7;
    squareInternalPad = 5;
  } else if (window.innerWidth >= 768) {
    fontSize = 1.6;
    squareInternalPad = 4;
  } else if (window.innerWidth > 576) {
    fontSize = 1.5;
  }

  const testText = codeMatrix[0][0].toString(16).toUpperCase();
  let byteSize;
  for (fontSize = fontSize; fontSize >= 0.1; fontSize -= 0.1) {
    ctx.font = `500 ${fontSize}rem "Rajdhani Mod", Meno, Consolas, monospace`;
    byteSize = ctx.measureText(testText);

    const lineWidth =
      byteSize.width * codeMatrix[0].length +
      byteSize.width * (codeMatrix[0].length - 1) +
      paddingX;
    if (lineWidth > parentWidth) {
      // too big
      continue;
    }

    // reached width that fits parent!
    break;
  }
  const square = byteSize.width;

  for (let y = 0; y < codeMatrix.length; y++) {
    for (let x = 0; x < codeMatrix[0].length; x++) {
      ctx.fillText(
        codeMatrix[y][x].toString(16).toUpperCase(),
        x * square * 2 + paddingX,
        y * square * 2 + paddingY
      );
    }
  }

  ctx.strokeStyle = "#5ee9f2";
  ctx.lineWidth = 3;

  //const squareInternalPad = 6;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.font =
    "500 1rem -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif";
  ctx.fillText("▼", solution[0].x * square * 2 + paddingX + square / 2, 0);

  for (const { x, y } of solution) {
    ctx.strokeRect(
      x * square * 2 + paddingX - squareInternalPad,
      y * square * 2 + paddingY - squareInternalPad / 2 - squareInternalPad,
      square + squareInternalPad * 2,
      square + squareInternalPad * 2
    );
  }

  ctx.lineWidth = 5;

  for (let i = 0; i < solution.length - 1; i++) {
    const curr = solution[i];
    const next = solution[i + 1];

    let offsetX = 0;
    if (next.x > curr.x) {
      offsetX = (square + squareInternalPad * 2) / 2;
    } else if (next.x < curr.x) {
      offsetX = -(square + squareInternalPad * 2) / 2;
    }
    let offsetY = 0;
    if (next.y > curr.y) {
      offsetY = (square + squareInternalPad * 2) / 2;
    } else if (next.y < curr.y) {
      offsetY = -(square + squareInternalPad * 2) / 2;
    }

    ctx.beginPath();
    const x1 = curr.x * square * 2 + square / 2 + offsetX + paddingX;
    const y1 =
      curr.y * square * 2 +
      square / 2 +
      offsetY +
      paddingY -
      squareInternalPad / 2;
    const x2 = next.x * square * 2 + square / 2 - offsetX + paddingX;
    const y2 =
      next.y * square * 2 +
      square / 2 -
      offsetY +
      paddingY -
      squareInternalPad / 2;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  }
};

const SolutionRenderer = ({ codeMatrix, solution }: SolutionRendererProps) => {
  const parentRef = useRef<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>();

  useEffect(() => {
    console.log("rendering solution");
    renderSolution(parentRef.current, canvasRef.current, codeMatrix, solution);

    const debounced = debounce(() => {
      renderSolution(
        parentRef.current,
        canvasRef.current,
        codeMatrix,
        solution
      );
    }, 200);

    window.addEventListener("resize", debounced, { passive: true });

    return () => {
      window.removeEventListener("resize", debounced);
    };
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

const DragHandle = () => (
  <GridVerticalIcon className={styles["sortable-item__draghandle"]} />
);

const SortableSequenceItem = SortableElement(({ displayIndex, value }) => {
  const { result } = useContext(SolutionContext);
  const isMatched =
    result &&
    result.match.includes.some(
      (arr) => arr.map((n) => n.toString(16).toUpperCase()).join(" ") === value
    );

  return (
    <li className={styles["sortable-item"]}>
      <DragHandle />
      <Sb className="mr-2">{displayIndex + 1}.</Sb> {value}
      {isMatched && (
        <span className={styles["sortable-item__success-indicator"]}>
          MATCHED
        </span>
      )}
    </li>
  );
});

const SortableSequenceList = SortableContainer(({ items }) => {
  return (
    <ul className={styles["sortable-list"]}>
      {items.map((value, index) => (
        <SortableSequenceItem
          key={`${value}-${index}`}
          index={index}
          displayIndex={index}
          value={value}
        />
      ))}
    </ul>
  );
});

const Body = ({ result, allSequencesLen, codeMatrix }: BodyProps) => {
  const { sequencesText, onSequencesChanged, onRunSolver } = useAppContext();

  const sequenceItems = useMemo(
    () =>
      parseMatrix(sequencesText).map((nr) =>
        nr.map((n) => n.toString(16).toUpperCase()).join(" ")
      ),
    [sequencesText]
  );

  const handleSortEnd = useCallback(
    ({ oldIndex, newIndex }) => {
      const newText = arrayMove(sequenceItems, oldIndex, newIndex).join("\n");
      onSequencesChanged(newText, () => {
        onRunSolver(true);
      });
    },
    [sequenceItems]
  );

  if (result === null) {
    return (
      <div className={styles.body}>
        <p className={styles.note}>
          <Sb>No solutions were discovered.</Sb>
        </p>
        <p className={styles.note}>
          Buffer size may be too small. Note that the solver currently allows
          only one wasted digit; at the first digit.
        </p>
      </div>
    );
  }

  const { match, solution } = result;
  const { includes, result: optimalSequence } = match;
  return (
    <div className={styles.body}>
      {allSequencesLen !== includes.length && (
        <>
          <p className={styles.note}>
            <Sb>
              Not all sequences could be included - either buffer is too small
              or no solution exists which includes all sequences.
            </Sb>{" "}
            Note that the solver currently allows only one wasted digit; at the
            first digit.
          </p>
          <div>
            <p>
              <Sb>Change sequence priority by dragging</Sb>
            </p>
            <SortableSequenceList
              axis="y"
              lockAxis="y"
              helperClass={cz(
                styles["sortable-item"],
                styles["sortable-item__dragged"]
              )}
              items={sequenceItems}
              onSortEnd={handleSortEnd}
            />
          </div>
        </>
      )}
      <p>
        <Sb className="mr-2">Optimal sequence: </Sb>
        <Code>
          {optimalSequence.map((n) => n.toString(16).toUpperCase()).join(" ")}
        </Code>
      </p>
      <div>
        <SolutionRenderer codeMatrix={codeMatrix} solution={solution} />
      </div>
    </div>
  );
};

interface SolutionModalProps {
  className?: string;
  onHide: () => void;
  show: boolean;
  result: SolverResult | null;
  allSequencesLen: number;
  codeMatrix: number[][];
}

export default function SolutionModal({
  className,
  result,
  show,
  onHide,
  allSequencesLen,
  codeMatrix,
}: SolutionModalProps) {
  const ctx = useMemo(() => ({ result }), [result]);

  return (
    <SolutionContext.Provider value={ctx}>
      <Modal show={show} onHide={onHide} size="lg">
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
    </SolutionContext.Provider>
  );
}
