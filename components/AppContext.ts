import React, { useContext } from "react";

interface AppState {
  matrixText: string;
  sequencesText: string;
  bufferSize: number;
  solverRunning: boolean;
  unprioritizedSequencesText: string;
}

interface AppCallbacks {
  onMatrixChanged: (str: string) => void;
  // need cb for SolutionModal
  onSequencesChanged: (str: string, cb?: () => void) => void;
  onBufferSizeChanged: (size: number) => void;
  onRunSolver: (
    useSequencePriorityOrder?: boolean,
    overrides?: { sequencesText?: string; matrixText?: string }
  ) => void;
  setUnprioritizedSequencesText: (text: string) => void;
}

export interface AppContextType extends AppState, AppCallbacks {}

// tslint:disable-next-line:no-empty
const noOp = () => {};

export const AppContext = React.createContext<AppContextType>({
  matrixText: "",
  sequencesText: "",
  bufferSize: 4,
  onMatrixChanged: noOp,
  onSequencesChanged: noOp,
  onBufferSizeChanged: noOp,
  solverRunning: false,
  onRunSolver: noOp,
  unprioritizedSequencesText: "",
  setUnprioritizedSequencesText: noOp,
});

export const useAppContext = () => useContext(AppContext);
