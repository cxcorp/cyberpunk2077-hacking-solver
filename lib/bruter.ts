import optimizeSequences from "./sequence-optimizer";
import { getRootsAllValues } from "./tree";

export interface Coord {
  x: number;
  y: number;
}

export enum Dir {
  Horizontal,
  Vertical,
}

export interface SearchPoint {
  patternPtr: number;
  used: boolean[][];
  stepsSoFar: Coord[];
  allowedDir: Dir;
  x: number;
  y: number;
}

export interface OptimizedSequence {
  result: number[];
  includes: number[][];
}

export interface SolverResult {
  routeWeight: {
    distance: number;
    intersectCoeff: number;
  };
  match: OptimizedSequence;
  solution: Coord[];
}

function removeDuplicates(arr: OptimizedSequence[]) {
  const keys = new Set<string>();
  return arr.filter((seq) => {
    const key =
      seq.result.join(",") +
      "_" +
      seq.includes
        .map((incl) => incl.join(","))
        .sort((a, b) => a.localeCompare(b))
        .join("-");
    if (keys.has(key)) {
      return false;
    }
    keys.add(key);
    return true;
  });
}

function maxBy<T>(arr: T[], fn: (t: T) => number): number | undefined {
  if (arr.length === 0) {
    return undefined;
  }

  return arr.reduce((max, curr) => {
    const val = fn(curr);
    return Math.max(val, max);
  }, fn(arr[0]));
}

export default function runSolver(
  matrix: number[][],
  sequences: number[][],
  bufferSize: number
): SolverResult | null {
  const roots = optimizeSequences(sequences, bufferSize);
  const values: OptimizedSequence[] = [
    // add original sequences individually since sequence optimizer
    // only returns combinations
    ...sequences.map((sequence) => ({
      result: sequence,
      includes: [sequence],
    })),
    ...getRootsAllValues(roots),
  ];

  const dedupedSeqs = removeDuplicates(values);

  const maxIncludes = maxBy(dedupedSeqs, (r) => r.includes.length);

  for (let includeCount = maxIncludes!; includeCount > 0; includeCount--) {
    const matches = dedupedSeqs.filter(
      (r) => r.includes.length === includeCount
    );

    const solutionsByDistance = matches
      .flatMap((match) => {
        const pattern = match.result;
        const solutions = brute(pattern, matrix, true);
        return solutions.map((solution) => ({ match, solution }));
      })
      .map((s) => ({ ...s, routeWeight: calculateRouteWeight(s.solution) }))
      .sort(({ routeWeight: a }, { routeWeight: b }) => {
        const aScore =
          a.distance + (a.intersectCoeff > 0 ? 2 + a.intersectCoeff : 0);
        const bScore =
          b.distance + (b.intersectCoeff > 0 ? 2 + b.intersectCoeff : 0);
        return aScore - bScore;
      });

    if (solutionsByDistance.length < 1) {
      continue;
    }

    const shortest = solutionsByDistance[0];
    return shortest;
  }

  return null;
}

interface LineSegment {
  X1: number;
  Y1: number;
  X2: number;
  Y2: number;
}

function lineSegment(from: Coord, to: Coord) {
  return {
    X1: from.x,
    Y1: from.y,
    X2: to.x,
    Y2: to.y,
  };
}

function calculateRouteWeight(route: Coord[]) {
  let dist: number = 0;
  for (let i = 0; i < route.length - 1; i++) {
    // d = sqrt((x2-x1)^2 + (y2-y1)^2)
    dist += Math.hypot(
      route[i + 1].x - route[i].x,
      route[i + 1].y - route[i].y
    );
  }

  const overlaps = countSegmentOverlaps(route);
  return { distance: dist, intersectCoeff: overlaps };
}

function countSegmentOverlaps(route: Coord[]) {
  const segments: LineSegment[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    segments.push(lineSegment(route[i], route[i + 1]));
  }

  const checkedCombos = new Set<string>();
  const segToKey = (seg: LineSegment) =>
    [seg.X1, seg.X2, seg.Y1, seg.Y2].join(",");
  const pairToKey = (seg1: LineSegment, seg2: LineSegment) =>
    [seg1, seg2]
      .map(segToKey)
      .sort((a, b) => a.localeCompare(b))
      .join("-");

  let overlaps = 0;
  for (let currSegI = 0; currSegI < segments.length; currSegI++) {
    const currSeg = segments[currSegI];

    for (let otherSegI = 0; otherSegI < segments.length; otherSegI++) {
      const otherSeg = segments[otherSegI];
      if (
        currSegI === otherSegI ||
        otherSegI === currSegI + 1 ||
        currSegI === otherSegI + 1
      ) {
        continue;
      }

      const combokey = pairToKey(currSeg, otherSeg);
      if (checkedCombos.has(combokey)) {
        continue;
      }
      checkedCombos.add(combokey);

      const [currY1, currY2] = [
        Math.min(currSeg.Y1, currSeg.Y2),
        Math.max(currSeg.Y1, currSeg.Y2),
      ];
      const [otherY1, otherY2] = [
        Math.min(otherSeg.Y1, otherSeg.Y2),
        Math.max(otherSeg.Y1, otherSeg.Y2),
      ];
      const [currX1, currX2] = [
        Math.min(currSeg.X1, currSeg.X2),
        Math.max(currSeg.X1, currSeg.X2),
      ];
      const [otherX1, otherX2] = [
        Math.min(otherSeg.X1, otherSeg.X2),
        Math.max(otherSeg.X1, otherSeg.X2),
      ];

      //  both segments vertical and on same Y line?
      if (
        isVertical(currSeg) &&
        isVertical(otherSeg) &&
        currSeg.X1 === otherSeg.X1
      ) {
        // is this segment inside the other segment or vice versa?
        if (
          (currY1 > otherY1 && currY2 < otherY2) ||
          (otherY1 > currY1 && otherY2 < currY2)
        ) {
          overlaps++;
          continue;
        }

        // does one of the segments have a point inside the other segment?
        if (
          (currY1 > otherY1 && currY1 < otherY2) ||
          (currY2 > otherY1 && currY2 < otherY2) ||
          (otherY1 > currY1 && otherY1 < currY2) ||
          (otherY2 > currY1 && otherY2 < currY2)
        ) {
          overlaps++;
          continue;
        }
      }
      // both segments horizontal and on same X line?
      else if (
        isHorizontal(currSeg) &&
        isHorizontal(otherSeg) &&
        currSeg.Y1 === otherSeg.Y1
      ) {
        // is this segment inside the other segment or vice versa?
        if (
          (currX1 > otherX1 && currX2 < otherX2) ||
          (otherX1 > currX1 && otherX2 < currX2)
        ) {
          overlaps++;
          continue;
        }

        // does one of the segments have a point inside the other segment?
        if (
          (currX1 > otherX1 && currX1 < otherX2) ||
          (currX2 > otherX1 && currX2 < otherX2) ||
          (otherX1 > currX1 && otherX1 < currX2) ||
          (otherX2 > currX1 && otherX2 < currX2)
        ) {
          overlaps++;
          continue;
        }
      }
      // does segment have points on the line formed by the other segment or vice versa?
      else if (isVertical(currSeg) && isHorizontal(otherSeg)) {
        if (
          otherY1 >= currY1 &&
          otherY1 <= currY2 &&
          currX1 >= otherX1 &&
          currX1 <= otherX2
        ) {
          overlaps++;
          continue;
        }
      } else if (isHorizontal(currSeg) && isVertical(otherSeg)) {
        if (
          currY1 >= otherY1 &&
          currY1 <= otherY2 &&
          otherX1 >= currX1 &&
          otherX1 <= currX2
        ) {
          overlaps++;
          continue;
        }
      }
    }
  }

  return overlaps;
}

function isVertical(ls: LineSegment) {
  return ls.X1 === ls.X2;
}

function isHorizontal(ls: LineSegment) {
  return ls.Y1 === ls.Y2;
}

function brute(
  pattern: readonly number[],
  matrix: readonly number[][],
  findAll: boolean = false
): Coord[][] {
  const yLen = matrix.length;
  const xLen = matrix[0].length;

  //const solutions: Coord[][] = [];
  const queue: SearchPoint[] = [
    {
      patternPtr: 0,
      used: make2dArray(yLen, xLen, false),
      stepsSoFar: [],
      x: 0,
      y: 0,
      allowedDir: Dir.Horizontal,
    },
  ];

  let isInitial = true;
  const solutions: Coord[][] = [];

  while (queue.length > 0) {
    const searchPoint = queue.shift()!;
    const { patternPtr, used, stepsSoFar, allowedDir } = searchPoint;

    if (patternPtr === pattern.length) {
      // found a solution!
      if (!findAll) {
        return [stepsSoFar];
      }
      // continue searching
      solutions.push(stepsSoFar);
    }

    for (const { x, y } of walkAllowedDir(searchPoint, yLen, xLen)) {
      if (matrix[y][x] === pattern[patternPtr]) {
        queue.push({
          patternPtr: patternPtr + 1,
          used: markUsed(used, x, y),
          stepsSoFar: stepsSoFar.concat({ x, y }),
          allowedDir:
            allowedDir === Dir.Vertical ? Dir.Horizontal : Dir.Vertical,
          x,
          y,
        });
      } else if (isInitial) {
        // allow one wasted step if it's the first row
        queue.push({
          patternPtr: patternPtr,
          used: markUsed(used, x, y),
          stepsSoFar: stepsSoFar.concat({ x, y }),
          allowedDir:
            allowedDir === Dir.Vertical ? Dir.Horizontal : Dir.Vertical,
          x,
          y,
        });
      }
    }

    isInitial = false;
  }

  return solutions;
}

function* walkAllowedDir(searchPoint: SearchPoint, yLen: number, xLen: number) {
  const { used, allowedDir } = searchPoint;

  if (allowedDir === Dir.Vertical) {
    const { x } = searchPoint;
    for (let y = 0; y < yLen; y++) {
      if (used[y][x]) {
        continue;
      }
      yield { x, y };
    }
  } else {
    const { y } = searchPoint;
    for (let x = 0; x < xLen; x++) {
      if (used[y][x]) {
        continue;
      }
      yield { x, y };
    }
  }
}

function markUsed(arr: boolean[][], x: number, y: number) {
  const copy = clone2d(arr);
  copy[y][x] = true;
  return copy;
}

function clone2d<T>(arr: T[][]): T[][] {
  return arr.map((subarr) => subarr.slice());
}

function make2dArray<T>(yLen: number, xLen: number, fillValue: T): T[][] {
  const arr = new Array<T[]>(yLen);
  for (let y = 0; y < yLen; y++) {
    arr[y] = new Array<T>(xLen).fill(fillValue);
  }
  return arr;
}
