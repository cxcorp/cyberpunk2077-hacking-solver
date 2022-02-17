import React, { useCallback, useState } from "react";

import { useAppContext } from "../components/AppContext";
import FilteredTextArea from "../components/FilteredTextArea";
import styles from "../styles/SequencesTextBox.module.scss";

const sequencesPlaceholder = `BD E9 1C
BD 7A BD
BD 1C BD 55`;

const hexMatrixRegex = /^([0-9a-f\s\n\r])+$/i;
const hexMatrixError = "Allowed digits: 1C 55 7A BD E9 FF";

const SequencesTextBox = () => {
  const { sequencesText, onSequencesChanged } = useAppContext();
  const [error, setError] = useState<string>("");

  const validate = useCallback(
    (value: string) => {
      if (value.length > 0 && !hexMatrixRegex.test(value)) {
        setError(hexMatrixError);
        return hexMatrixError;
      }

      setError("");
      return "";
    },
    [setError]
  );

  const onChange = useCallback(
    (value: string) => {
      onSequencesChanged(value);
    },
    [onSequencesChanged]
  );

  return (
    <>
      <FilteredTextArea
        validate={validate}
        value={sequencesText}
        onChange={onChange}
        placeholder={sequencesPlaceholder}
        className={styles["sequences-selector"]}
      />
      {error && (
        <span className={styles["sequences-selector__error"]}>{error}</span>
      )}
    </>
  );
};
export default SequencesTextBox;
