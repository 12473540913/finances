import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ScreenShell } from "../../components/ScreenShell";
import { AuthCard } from "../../components/AuthCard";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import { authClient } from "../../lib";
import styles from "./Auth.module.css";

export function ForgotCredentials() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailTrimmed = email.trim();
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed), [emailTrimmed]);
  const formValid = emailValid && !loading;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formValid) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await authClient.requestPasswordReset(emailTrimmed);

      if (result?.resetCode) {
        setSuccessMessage(`Dev reset code: ${result.resetCode}`);
      } else {
        setSuccessMessage("If that email exists, a reset link has been sent.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell>
      <div className={styles.centerPage}>
        <AuthCard>
          <h1 className={styles.brandTitle}>finances</h1>
          <h2 className={styles.smallHeading}>Forgot password</h2>
          <form className={styles.forgotForm} onSubmit={handleSubmit}>
            <p className={styles.label}>email</p>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className={styles.forgotButtonRow}>
              <Button type="submit" text={loading ? "Sending..." : "Send Reset Code"} disabled={!formValid} />
            </div>
          </form>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
          <div className={styles.textLinks}>
            <Link to="/">Back to sign in</Link>
          </div>
        </AuthCard>
      </div>
    </ScreenShell>
  );
}
