import { Link } from "react-router-dom";
import { ASSETS } from "../../lib";
import styles from "./Header.module.css";

type Props = {
  homeLink?: string;
  iconVariant?: "flag" | "profile";
};

export function Header({ homeLink = "/", iconVariant = "flag" }: Props) {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} to={homeLink}>finances</Link>
      {iconVariant === "profile" ? (
        <Link className={styles.profileTextLink} to="/profile">Profile</Link>
      ) : (
        <a
          className={styles.flagLink}
          href="https://ncc.lnks.rip"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="NCC flag"
          title="Visit NCC"
        >
          <img className={styles.flagIcon} src={ASSETS.flag} alt="" aria-hidden="true" />
        </a>
      )}
    </header>
  );
}
