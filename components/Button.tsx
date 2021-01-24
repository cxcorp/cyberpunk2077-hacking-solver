import React from "react";
import cz from "classnames";

import styles from "../styles/Button.module.scss";

interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

const Button = (props: ButtonProps) => {
  const { className, ...restProps } = props;

  return (
    <button
      type="button"
      {...restProps}
      className={cz(styles.button, className)}
    />
  );
};

export default Button;
