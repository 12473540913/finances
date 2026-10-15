import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "../../components/Footer";
import { ASSETS, authClient } from "../../lib";
import { loadAppProfile, readOriginalProfilePhoto, saveAppProfile } from "../../lib/profile";
import type { AppProfile } from "../../../shared/profile";
import { getMissingPasswordRequirements } from "../../../shared/password";
import styles from "./Profile.module.css";

const APP_REPO_URL = "https://github.com/1247350913/finances";
const NCC_REPO_URL = "https://github.com/12473540913/NCC";

type ProfileSection = "identity" | "update" | "about";

export function Profile() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isPhotoReading, setIsPhotoReading] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const passwordDialogRef = useRef<HTMLDialogElement>(null);
  const [activeSection, setActiveSection] = useState<ProfileSection>("identity");
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [savedProfile, setSavedProfile] = useState<AppProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const missingPasswordRequirements = getMissingPasswordRequirements(newPassword);
  const isNewPasswordValid = missingPasswordRequirements.length === 0;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    if (!isProfileSaved) return;
    const timeout = window.setTimeout(() => setIsProfileSaved(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isProfileSaved]);

  useEffect(() => {
    if (!isPasswordFormOpen) return;
    const dialog = passwordDialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [isPasswordFormOpen]);

  useEffect(() => {
    if (!isPhotoExpanded) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPhotoExpanded(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPhotoExpanded]);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setStatusMessage(null);

      const session = await authClient.getSession();
      if (!session) throw new Error("Please sign in again.");
      const profile = await loadAppProfile();
      setSavedProfile(profile);
      setEmail(session.email ?? "");
      setUsername(profile.username ?? "");
      setDisplayName(profile.displayName ?? "");
      setBirthday(profile.birthDate ?? "");
      setPhotoUrl(profile.profilePhotoUrl ?? "");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not load profile.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProfileSave() {
    try {
      setIsProfileSaving(true);
      setErrorMessage(null);
      setStatusMessage(null);
      const profile: AppProfile = {
        username: username.trim() || null,
        displayName: displayName.trim() || null,
        birthDate: birthday.trim() || null,
        profilePhotoUrl: photoUrl.trim() || null,
      };
      await saveAppProfile(profile);
      setSavedProfile(profile);
      setIsProfileSaved(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not update profile.");
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;
    try {
      setIsPhotoReading(true);
      setErrorMessage(null);
      setStatusMessage(null);
      const dataUrl = await readOriginalProfilePhoto(file);
      setPhotoUrl(dataUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not read profile photo file.");
    } finally {
      setIsPhotoReading(false);
    }
  }

  async function handlePasswordSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!currentPassword) {
      setErrorMessage("Current password is required.");
      return;
    }

    if (!isNewPasswordValid) {
      setErrorMessage(missingPasswordRequirements.join(" "));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Password confirmation does not match.");
      return;
    }

    try {
      setIsPasswordSaving(true);
      setErrorMessage(null);
      setStatusMessage(null);

      await authClient.changePassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordFormOpen(false);
      setStatusMessage("Password updated.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not update password.");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  function closePasswordForm() {
    setIsPasswordFormOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage(null);
  }

  async function handleSignOut() {
    const shouldSignOut = window.confirm("Sign out now?");
    if (!shouldSignOut) return;

    try {
      setIsSigningOut(true);
      setErrorMessage(null);
      setStatusMessage(null);

      await authClient.signOut();
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not sign out.");
    } finally {
      setIsSigningOut(false);
    }
  }

  const profileImageSrc = savedProfile?.profilePhotoUrl || ASSETS.defaultProfileIcon;

  return (
    <div className={styles.pageShell}>
      <main className={styles.main}>
        <header className={styles.subnav}>
          <Link className={styles.backLink} to="/home" aria-label="Home">
            Home
          </Link>
          <Link className={styles.subnavLink} to="/overview">Overview</Link>
          <Link className={styles.subnavLink} to="/expenses">Expenses</Link>
          <Link className={styles.subnavLink} to="/entry">Entry</Link>
          <a
            className={styles.profileLink}
            href="https://ncc.lnks.rip"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="NCC flag"
            title="Visit NCC"
          >
            <img className={styles.profileIcon} src={ASSETS.flag} alt="" aria-hidden="true" />
          </a>
        </header>

        <section className={styles.body}>
          {isLoading && <p className={styles.loadingText}>Loading profile...</p>}

          {errorMessage && !isPasswordFormOpen && <p className={styles.error} role="alert">{errorMessage}</p>}
          {statusMessage && <p className={styles.status} role="status">{statusMessage}</p>}

          <div className={styles.layout}>
            <aside className={styles.sideNav} aria-label="Profile sections">
              <button
                type="button"
                className={`${styles.sideNavButton} ${activeSection === "identity" ? styles.sideNavButtonActive : ""}`}
                onClick={() => setActiveSection("identity")}
              >
                Identity
              </button>
              <button
                type="button"
                className={`${styles.sideNavButton} ${activeSection === "update" ? styles.sideNavButtonActive : ""}`}
                onClick={() => setActiveSection("update")}
              >
                Update Profile
              </button>
              <button
                type="button"
                className={`${styles.sideNavButton} ${activeSection === "about" ? styles.sideNavButtonActive : ""}`}
                onClick={() => setActiveSection("about")}
              >
                About
              </button>
            </aside>

            <section className={`${styles.contentCard} ${activeSection !== "identity" ? styles.contentCardUnboxed : ""}`}>
              {activeSection === "identity" && (
                <div className={styles.identityPanel}>
                  <button
                    type="button"
                    className={styles.identityPhotoWrap}
                    onClick={() => setIsPhotoExpanded(true)}
                    aria-label="Expand profile photo"
                  >
                    <img className={styles.avatarPreview} src={profileImageSrc} alt="Profile" />
                  </button>

                  <div className={styles.identityInfo}>
                    <div className={styles.infoRow}>
                      <span>Email</span>
                      <strong>{email || "-"}</strong>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Username</span>
                      <strong>{savedProfile?.username || "-"}</strong>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Display Name</span>
                      <strong>{savedProfile?.displayName || "-"}</strong>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Birthday</span>
                      <strong>{savedProfile?.birthDate || "-"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "update" && (
                <div className={styles.updatePanel}>
                  <section className={styles.updateCard} aria-labelledby="profile-details-heading">
                    <h2 id="profile-details-heading">Profile Details</h2>
                    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
                      <label>
                        <span>Email</span>
                        <input type="email" value={email} readOnly autoComplete="email" />
                      </label>
                      <label>
                        <span>Username</span>
                        <input
                          type="text"
                          value={username}
                          disabled={isLoading || isProfileSaving}
                          onChange={(event) => setUsername(event.target.value)}
                          placeholder="Optional"
                        />
                      </label>

                      <label>
                        <span>Display name</span>
                        <input
                          type="text"
                          value={displayName}
                          disabled={isLoading || isProfileSaving}
                          onChange={(event) => setDisplayName(event.target.value)}
                          placeholder="Optional"
                        />
                      </label>

                      <label>
                        <span>Birthday</span>
                        <input
                          type="date"
                          value={birthday}
                          disabled={isLoading || isProfileSaving}
                          onChange={(event) => setBirthday(event.target.value)}
                        />
                      </label>

                      <div className={styles.photoRow}>
                        <span id="profile-image-label">Profile Image</span>
                        <div className={styles.photoControl}>
                          <button
                            type="button"
                            className={styles.photoButton}
                            onClick={() => photoInputRef.current?.click()}
                            disabled={isPhotoReading || isProfileSaving || isLoading}
                            aria-describedby="profile-image-label"
                          >
                            {isPhotoReading ? "Reading image..." : photoUrl.trim() ? "Change photo" : "Choose photo"}
                          </button>
                          <input
                            ref={photoInputRef}
                            hidden
                            type="file"
                            aria-label="Profile Image"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp,image/x-icon,image/vnd.microsoft.icon"
                            disabled={isPhotoReading || isProfileSaving || isLoading}
                            onChange={(event) => {
                              void handlePhotoUpload(event.target.files?.[0] ?? null);
                              event.target.value = "";
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleProfileSave()}
                        disabled={isProfileSaving || isProfileSaved || isPhotoReading || isLoading}
                        aria-live="polite"
                      >
                        {isProfileSaving ? "Saving..." : isProfileSaved ? "Saved" : "Save Profile Updates"}
                      </button>
                    </form>
                  </section>

                  <section className={styles.updateCard} aria-labelledby="session-account-heading">
                    <h2 id="session-account-heading">Session &amp; Account</h2>
                    <div className={styles.accountActions}>
                      <button
                        type="button"
                        className={styles.secondaryAction}
                        onClick={() => void handleSignOut()}
                        disabled={isSigningOut || isPasswordSaving || isLoading}
                      >
                        {isSigningOut ? "Signing out..." : "Sign Out"}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryAction}
                        aria-haspopup="dialog"
                        onClick={() => {
                          setIsPasswordFormOpen(true);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setErrorMessage(null);
                          setStatusMessage(null);
                        }}
                        disabled={isPasswordSaving || isSigningOut || isLoading}
                      >
                        Change Password
                      </button>
                    </div>
                    {isPasswordFormOpen && (
                      <dialog
                        ref={passwordDialogRef}
                        className={styles.passwordDialog}
                        aria-labelledby="change-password-heading"
                        onCancel={(event) => {
                          event.preventDefault();
                          if (!isPasswordSaving) closePasswordForm();
                        }}
                      >
                      <form id="change-password-form" className={styles.form} onSubmit={handlePasswordSave} aria-label="Change Password">
                        <h3 id="change-password-heading">Change Password</h3>
                        {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
                        <label>
                          <span>Current Password</span>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                            autoFocus
                            disabled={isPasswordSaving}
                          />
                        </label>
                        <label>
                          <span>New Password</span>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="Enter new password"
                            aria-describedby={newPassword.length > 0 && !isNewPasswordValid ? "new-password-requirements" : undefined}
                            autoComplete="new-password"
                            required
                            disabled={isPasswordSaving}
                            minLength={8}
                          />
                        </label>
                        {newPassword.length > 0 && !isNewPasswordValid && (
                          <ul id="new-password-requirements" className={styles.passwordRequirements}>
                            {missingPasswordRequirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
                          </ul>
                        )}
                        <label>
                          <span>Confirm Password</span>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                            required
                            disabled={isPasswordSaving}
                            minLength={8}
                          />
                        </label>
                        <div className={styles.accountActions}>
                          <button type="button" onClick={closePasswordForm} disabled={isPasswordSaving}>
                            Cancel
                          </button>
                          <button type="submit" disabled={isPasswordSaving || isLoading || !isNewPasswordValid || !currentPassword || !confirmPassword}>
                            {isPasswordSaving ? "Saving..." : "Update Password"}
                          </button>
                        </div>
                      </form>
                      </dialog>
                    )}
                  </section>
                </div>
              )}

              {activeSection === "about" && (
                <div className={styles.aboutList}>
                  <div className={styles.aboutPanel}>
                    <h2>About finances</h2>
                    <p>
                      Finances brings your personal accounts and spending into one place, making it easier to keep an eye on
                      account values, review expenses, and understand how your spending changes over time. Organize expenses
                      across multiple accounts, import transactions from bank statements with custom parsers, and explore 
                      monthly breakdowns and spending summaries to make sense of the details. It is designed to help you keep 
                      your financial records clear and accessible without getting in the way of how you manage your money.
                    </p>
                    <p>
                      Repository: <a href={APP_REPO_URL} target="_blank" rel="noreferrer">{APP_REPO_URL}</a>
                    </p>
                    <p>Contact: open an issue in the repository for bugs, feedback, and feature requests.</p>
                  </div>
                  <div className={styles.aboutPanel}>
                    <h2>About NCC</h2>
                    <p>See <a href="https://ncc.lnks.rip" target="_blank" rel="noreferrer">website</a> for more details.</p>
                    <p>
                      Repository: <a href={NCC_REPO_URL} target="_blank" rel="noreferrer">{NCC_REPO_URL}</a>
                    </p>
                    <p>Contact: open an issue in the repository for bugs, feedback, and feature requests.</p>
                  </div>
                </div>

              )}
            </section>
          </div>
        </section>
      </main>

      {isPhotoExpanded && (
        <div
          className={styles.photoLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsPhotoExpanded(false);
          }}
        >
          <button
            type="button"
            className={styles.photoLightboxClose}
            onClick={() => setIsPhotoExpanded(false)}
            aria-label="Close expanded profile photo"
            autoFocus
          >
            &#215;
          </button>
          <img className={styles.expandedPhoto} src={profileImageSrc} alt="Expanded profile" />
        </div>
      )}

      <Footer />
    </div>
  );
}
