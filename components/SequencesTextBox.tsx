import React, { useCallback } from "react";

import { useAppContext } from "../components/AppContext";
import FilteredTextArea from "../components/FilteredTextArea";
import styles from "../styles/SequencesTextBox.module.scss";

const sequencesPlaceholder = `BD E9 1C
BD 7A BD
BD 1C BD 55`;

const hexMatrixRegex = /^[0-9a-f\s\n\r]+$/gi;

const SequencesTextBox = () => {
  const { sequencesText, onSequencesChanged } = useAppContext();

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onSequencesChanged(e.currentTarget.value);
    },
    [onSequencesChanged]
  );

  return (
    <FilteredTextArea
      regex={hexMatrixRegex}
      value={sequencesText}
      onChange={onChange}
      placeholder={sequencesPlaceholder}
      className={styles["sequences-selector"]}
    />
  );
};
export default SequencesTextBox;
