import { Node } from "./tree";

export enum ShiftDir {
  Left,
  Right,
}

export interface MatchResult {
  /**
   * The array that is being shifted
   */
  shiftee: number[];
  /**
   * The array that the shiftee must match
   */
  target: number[];
  shift: number;
  dir: ShiftDir;
  /**
   * The resulting array
   */
  result: number[];
  /**
   * All of the arrays so far that have been mixed together into this match
   */
  includes: number[][];
}

export default function optimizeSequence(candidates: number[][], bufferSize: number) {
  let rootNodes: Node<MatchResult>[] = [];

  for (let c = 0; c < candidates.length; c++) {
    const candidate = candidates[c];
    const targets = candidates.filter((_, index) => index !== c);

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const remain = targets.filter((_, index) => index !== i);
      const initialSplits = match2(candidate, target, [candidate, target]);
      rootNodes = rootNodes.concat(
        initialSplits.map((split) => minimatch(split, remain))
      );
    }
  }

  return rootNodes.filter(function(rootNode) {
    return rootNode.value.result.length <= bufferSize;
  });
}

function minimatch(split: MatchResult, remain: number[][]): Node<MatchResult> {
  const children = remain.flatMap((remainder, remainIndex) => {
    const childSplits = match2(remainder, split.result, [
      remainder,
      ...split.includes,
    ]);
    const childRemains = remain.filter((_, i) => i !== remainIndex);
    return childSplits.map((childSplit) => minimatch(childSplit, childRemains));
  });

  return {
    children,
    value: split,
  };
}

function match2(
  candidate: number[],
  target: number[],
  includes: number[][]
): MatchResult[] {
  let output: { shift: number; dir: ShiftDir }[] = [];

  for (let shiftRight = 0; shiftRight < target.length; shiftRight++) {
    if (doesMatchRight(shiftRight, candidate, target)) {
      output.push({ shift: shiftRight, dir: ShiftDir.Right });
    }
  }
  for (let shiftLeft = 0; shiftLeft < candidate.length; shiftLeft++) {
    if (doesMatchLeft(shiftLeft, candidate, target)) {
      output.push({ shift: shiftLeft, dir: ShiftDir.Left });
    }
  }

  // push variants for candidate just straight up being before or after target
  output.push({ shift: target.length, dir: ShiftDir.Right });
  output.push({ shift: candidate.length, dir: ShiftDir.Left });

  return output.map((s) => applyShift(candidate, target, s, includes));
}

function applyShift(
  shiftee: number[],
  target: number[],
  shift: { shift: number; dir: ShiftDir },
  includes: number[][]
): MatchResult {
  let result: number[] = [];

  if (shift.dir === ShiftDir.Right) {
    const output = [...target];
    output.length = Math.max(shiftee.length + shift.shift, target.length);
    for (let i = 0; i < shiftee.length; i++) {
      output[i + shift.shift] = shiftee[i];
    }
    result = output;
  } else {
    const output = [...shiftee];
    output.length = Math.max(target.length + shift.shift, shiftee.length);
    for (let i = 0; i < target.length; i++) {
      output[i + shift.shift] = target[i];
    }
    result = output;
  }

  return {
    ...shift,
    result,
    shiftee,
    target,
    includes,
  };
}

function doesMatchRight(
  offset: number,
  a: readonly number[],
  b: readonly number[]
) {
  for (let i = offset; i < b.length; i++) {
    if (a[i - offset] !== b[i]) {
      return false;
    }
  }
  return true;
}

function doesMatchLeft(
  offset: number,
  a: readonly number[],
  b: readonly number[]
) {
  for (let i = offset; i < a.length; i++) {
    if (a[i] !== b[i - offset]) {
      return false;
    }
  }
  return true;
}
