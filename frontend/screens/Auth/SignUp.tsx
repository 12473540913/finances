import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authClient } from "../../lib";
import { ScreenShell } from "../../components/ScreenShell";
import { AuthCard } from "../../components/AuthCard";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import { getMissingPasswordRequirements } from "../../../shared/password";
import styles from "./Auth.module.css";

type Step = "signup" | "verify" | "success";

export function SignUp() {
  const [step, setStep] = useState<Step>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailTrimmed = email.trim();
  const verificationCodeTrimmed = verificationCode.trim();

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed), [emailTrimmed]);

  const missingPasswordRequirements = getMissingPasswordRequirements(password);
  const passwordValid = missingPasswordRequirements.length === 0;

  const verificationCodeValid = /^[a-zA-Z0-9]{6,8}$/.test(verificationCodeTrimmed);

  const formValid = emailValid && passwordValid && !loading;
  const verifyValid = verificationCodeValid && !loading;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formValid) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await authClient.signUp(emailTrimmed, password);

      setStep("verify");
      if (result?.verificationCode) {
        setVerificationCode(result.verificationCode);
        setSuccessMessage(`Dev verification code: ${result.verificationCode}`);
      } else {
        setSuccessMessage("If this email can be used, a verification code was sent.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!verifyValid) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await authClient.verifySignUp(emailTrimmed, verificationCodeTrimmed);

      setStep("success");
      setSuccessMessage("Account created. You can now log in.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await authClient.resendSignUpCode(emailTrimmed);
      if (result?.verificationCode) {
        setVerificationCode(result.verificationCode);
        setSuccessMessage(`Dev verification code resent: ${result.verificationCode}`);
      } else {
        setSuccessMessage("Verification code resent.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not resend code.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToSignUp() {
    setStep("signup");
    setVerificationCode("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  return (
    <ScreenShell>
      <div className={styles.centerPage}>
        <AuthCard>
          <h1 className={styles.brandTitle}>finances</h1>
          <h2 className={styles.smallHeading}>Sign Up</h2>

          {step === "signup" && (
            <form className={styles.signUpStack} onSubmit={handleSubmit}>
              <p className={styles.label}>email <span className={styles.required}>*</span></p>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
              {email.length > 0 && !emailValid && <p className={styles.requirements}>Enter a valid email address.</p>}

              <p className={styles.requirements}>You can set your username and other profile details after signing in.</p>
              <p className={styles.label}>password <span className={styles.required}>*</span></p>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {password.length > 0 && !passwordValid && (
                <ul className={styles.requirements}>
                  {missingPasswordRequirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
                </ul>
              )}

              <div className={styles.buttonRow}>
                <Button type="submit" text={loading ? "Creating..." : "Create Account"} disabled={!formValid}/>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form className={styles.signUpStack} onSubmit={handleVerify}>
              <p className={styles.label}>code <span className={styles.required}>*</span></p>
              <input
                className={styles.codeInput}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.trim())}
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={8}
              />

              {verificationCode.length > 0 && !verificationCodeValid && <p className={styles.requirements}>Enter the 6-8 character verification code.</p>}

              <div className={styles.buttonRow}>
                <Button type="submit" text={loading ? "Verifying..." : "Verify Email"} disabled={!verifyValid}/>
              </div>

              <div className={styles.buttonRow}>
                <button className={styles.textButton} type="button" onClick={handleResendCode} disabled={loading}>Resend code</button>
              </div>

              <div className={styles.buttonRow}>
                <button className={styles.textButton} type="button" onClick={handleBackToSignUp} disabled={loading}>Back to Sign Up</button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className={styles.formStack}>
              <p className={styles.successMessage}>Account created. You can now log in.</p>
              <Link className={styles.textButton} to="/">Go to Sign In</Link>
            </div>
          )}

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          {successMessage && step !== "success" && <p className={styles.successMessage}>{successMessage}</p>}

          {step !== "success" && (
            <div className={styles.textLinks}>
              <p>Already have an account? <Link to="/">Sign in.</Link></p>
            </div>
          )}
        </AuthCard>
      </div>
    </ScreenShell>
  );
}
