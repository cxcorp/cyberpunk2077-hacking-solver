import { maxBy } from "lodash-es";
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

export default function runSolver(
  matrix: number[][],
  sequences: number[][],
  bufferSize: number
) {
  const roots = optimizeSequences(sequences);
  const values = getRootsAllValues(roots);

  const doableValues = values.filter((r) => r.result.length <= bufferSize);

  const maxIncludes = maxBy(doableValues, (r) => r.includes.length)?.includes
    .length;

  for (let includeCount = maxIncludes!; includeCount > 0; includeCount--) {
    const matches = doableValues
      .filter((r) => r.includes.length === includeCount)
      .sort((a, b) => a.result.length - b.result.length);

    const solutionsByDistance = matches
      .flatMap((match) => {
        const pattern = match.result;
        const solutions = brute(pattern, matrix);
        return solutions.map((solution) => ({ match, solution }));
      })
      .map((s) => ({ ...s, routeLength: solutionRouteLength(s.solution) }))
      .sort((a, b) => a.routeLength - b.routeLength);

    if (solutionsByDistance.length < 1) {
      continue;
    }

    const shortest = solutionsByDistance[0];
    return shortest;
  }

  return null;
}

function solutionRouteLength(route: Coord[]) {
  let dist: number = 0;
  for (let i = 0; i < route.length - 1; i++) {
    // d = sqrt((x2-x1)^2 + (y2-y1)^2)
    dist += Math.hypot(
      route[i + 1].x - route[i].x,
      route[i + 1].y - route[i].y
    );
  }
  return dist;
}

function brute(
  pattern: readonly number[],
  matrix: readonly number[][],
  findAll: boolean = false
) {
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
      }
    }
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
