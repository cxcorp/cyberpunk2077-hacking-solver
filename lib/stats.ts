import { fmtArr } from "./util";
import { parseMatrix } from "../util";

const statsDisabled = process.env.NEXT_PUBLIC_UA_ENABLED !== "true";

export const sendSolverStats = async (
  collector: () => {
    bufferSize: number;
    sequenceCount: number;
    sequencesMatched: number;
    solutionLength: number;
    matrixSize: number;
  }
) => {
  try {
    if (statsDisabled) {
      return null;
    }

    const {
      bufferSize,
      sequenceCount,
      sequencesMatched,
      solutionLength,
      matrixSize,
    } = collector();

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

    return fetch(`/api/eventview`, {
      method: "POST",
      body: JSON.stringify({ dp: window.location.pathname, evs }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {}
};

const uniq = (arr: string[]) => [...new Set(arr)];

export const sendPrioritizationStats = async (
  collector: () => {
    originalSequenceText: string;
    prioritizedSequenceText: string;
  }
) => {
  try {
    if (statsDisabled) {
      return null;
    }

    const { originalSequenceText, prioritizedSequenceText } = collector();
    const originalSequences = parseMatrix(originalSequenceText).map(fmtArr);
    const prioritizedSequences = parseMatrix(prioritizedSequenceText).map(
      fmtArr
    );

    const originalSequencesDuplicates =
      originalSequences.length - uniq(originalSequences).length;

    const priorityOrder = prioritizedSequences.map((prioritySeq, index) => {
      const indexInOriginalOrder = originalSequences.findIndex(
        (seq) => seq === prioritySeq
      );
      // mark as used in case there are duplicate sequences
      if (indexInOriginalOrder > -1) {
        originalSequences[indexInOriginalOrder] = null;
      }
      return {
        indexInPrioritized: index,
        indexInOriginal: indexInOriginalOrder,
      };
    });

    const evs = priorityOrder.map(
      ({ indexInOriginal, indexInPrioritized }) => ({
        ec: "Sequence Priority",
        ea: `Original sequence index ${indexInOriginal}`,
        el: `${indexInPrioritized}`,
        ev: 1,
      })
    );
    evs.unshift({
      ec: "Sequence Priority",
      ea: "Duplicate sequences",
      el: `${originalSequencesDuplicates}`,
      ev: originalSequencesDuplicates,
    });

    return fetch(`/api/eventview`, {
      method: "POST",
      body: JSON.stringify({ dp: window.location.pathname, evs }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {}
};
