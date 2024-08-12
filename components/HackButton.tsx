import Button from "../components/Button";
import styles from "../styles/HackButton.module.scss";

const HackButton = ({ disabled }: { disabled?: boolean }) => {
  return (
    <div className={styles["hack-button"]}>
      <Button
        type="submit"
        disabled={disabled}
        className={styles["hack-button__button"]}
      >
        SOLVE
      </Button>
    </div>
  );
};

export default HackButton;
