import runSolver, { OptimizedSequence, removeDuplicates } from '../../lib/bruter';
import { expect, test } from "@jest/globals";
import { getRootsAllValues } from "../../lib/tree";
import optimizeSequences from "../../lib/sequence-optimizer";

/**
 * This is a simple test of the removeDuplicates function.
 * It would be equally (or more) important to test the sad path.
 */
test('removeDuplicates returns de-duped OptimizedSequence', () => {
  const sequences = [[189, 28, 189, 28, 189, 28],[85, 122, 85, 122, 85, 122],[189, 28, 189, 28, 189, 28]];
  const roots = optimizeSequences(sequences);
  const values: OptimizedSequence[] = [
    ...sequences.map((sequence) => ({
      result: sequence,
      includes: [sequence],
    })),
    ...getRootsAllValues(roots),
  ];

  expect(values.length).toEqual(99);
  expect(removeDuplicates(values).length).toEqual(17);
});

/**
 * Very dumb runSolver test. This can be expanded to help improve the solver.
 */
test('runSolver returns expected solution', () => {
  const matrix = [
    [
      189,
      28,
      189,
      28,
      189,
      28
    ],
    [
      85,
      122,
      85,
      122,
      85,
      122
    ],
    [
      233,
      255,
      233,
      255,
      233,
      255
    ],
    [
      189,
      28,
      189,
      28,
      189,
      28
    ],
    [
      85,
      122,
      85,
      122,
      85,
      122
    ],
    [
      233,
      255,
      233,
      255,
      233,
      255
    ]
  ];
  // = [1C, FF], [1C, FF, E9], [7A, 1C, FF, E9]
  const sequences = [[28, 255],[28, 255, 233],[122, 28, 255, 233]];
  const bufferSize = 6;

  const solverResult = runSolver(matrix, sequences, bufferSize);

  expect(solverResult.match.result[0]).toEqual(28);
});