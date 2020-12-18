import React, { useContext } from "react";

interface AppState {
  matrixText: string;
  sequencesText: string;
  bufferSize: number;
}

interface AppCallbacks {
  onMatrixChanged: (str: string) => void;
  onSequencesChanged: (str: string) => void;
  onBufferSizeChanged: (size: number) => void;
}

export interface AppContextType extends AppState, AppCallbacks {}

const noOp = () => {};
export const AppContext = React.createContext<AppContextType>({
  matrixText: "",
  sequencesText: "",
  bufferSize: 4,
  onMatrixChanged: noOp,
  onSequencesChanged: noOp,
  onBufferSizeChanged: noOp,
});

export const useAppContext = () => useContext(AppContext);
