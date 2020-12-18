import React, { useState, useCallback } from "react";
import cz from "classnames";

import { useAppContext } from "./AppContext";
import styles from "../styles/BufferSizeBox.module.scss";

interface Props {
  className?: string;
}

const range = (minInc, maxInc) => {
  const ret = [];
  while (minInc <= maxInc) {
    ret.push(minInc++);
  }
  return ret;
};

export default function BufferSizeBox({ className }: Props) {
  const { bufferSize, onBufferSizeChanged } = useAppContext();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.currentTarget.value, 10);
      if (isNaN(value)) {
        return;
      }

      onBufferSizeChanged(value);
    },
    [onBufferSizeChanged]
  );

  return (
    <div className={cz(styles.box, className)}>
      <div className={styles.box__header}>
        <div className={styles.box__sequence}>1</div>
        SPECIFY BUFFER SIZE
      </div>
      <div className={styles.box__inside}>
        <select
          className={cz(styles.box__input, "mb-4")}
          required
          value={bufferSize}
          onChange={handleChange}
        >
          {range(1, 16).map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>

        <div className={styles.buffer}>
          {range(1, bufferSize).map((val) => (
            <div key={val} className={styles.buffer__item} />
          ))}
        </div>
      </div>
    </div>
  );
}
