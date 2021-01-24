import React, { useCallback, useState } from "react";

import { useAppContext } from "../components/AppContext";
import FilteredTextArea from "../components/FilteredTextArea";
import styles from "../styles/CodeMatrixTextBox.module.scss";

const placeholder = `7A 55 E9 E9 1C 55
55 7A 1C 7A E9 55
55 1C 1C 55 E9 BD
BD 1C 7A 1C 55 BD
BD 55 BD 7A 1C 1C
1C 55 55 7A 55 7A`;

const hexMatrixRegex = /^([0-9a-f\s\n\r])+$/i;
const hexMatrixError = "Allowed digits: 1C 55 7A BD E9 FF";

const CodeMatrixTextBox = () => {
  const { matrixText, onMatrixChanged } = useAppContext();
  const [error, setError] = useState<string>("");

  const validate = useCallback((value: string) => {
    if (value.length > 0 && !hexMatrixRegex.test(value)) {
      setError(hexMatrixError);
      return hexMatrixError;
    }

    setError("");
    return "";
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onMatrixChanged(e.currentTarget.value);
    },
    [onMatrixChanged]
  );

  return (
    <>
      <FilteredTextArea
        validate={validate}
        value={matrixText}
        onChange={onChange}
        placeholder={placeholder}
        className={styles["code-matrix-textbox"]}
      />
      {error && (
        <span className={styles["code-matrix-textbox__error"]}>{error}</span>
      )}
    </>
  );
};

export default CodeMatrixTextBox;
