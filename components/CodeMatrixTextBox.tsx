import React, { useCallback } from "react";

import { useAppContext } from "../components/AppContext";
import FilteredTextArea from "../components/FilteredTextArea";
import styles from "../styles/CodeMatrixTextBox.module.scss";

const placeholder = `7A 55 E9 E9 1C 55
55 7A 1C 7A E9 55
55 1C 1C 55 E9 BD
BD 1C 7A 1C 55 BD
BD 55 BD 7A 1C 1C
1C 55 55 7A 55 7A`;

const hexMatrixRegex = /[0-9a-f\s\n\r]/i;

const CodeMatrixTextBox = () => {
  const { matrixText, onMatrixChanged } = useAppContext();

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onMatrixChanged(e.currentTarget.value);
    },
    [onMatrixChanged]
  );

  return (
    <FilteredTextArea
      regex={hexMatrixRegex}
      value={matrixText}
      onChange={onChange}
      placeholder={placeholder}
      className={styles["code-matrix-textbox"]}
    />
  );
};

export default CodeMatrixTextBox;
