export function getMissingPasswordRequirements(password: string): string[] {
  const requirements = [
    { valid: password.length >= 8, message: "Password must be at least 8 characters." },
    { valid: /[a-z]/.test(password), message: "Password must include a lowercase letter." },
    { valid: /[A-Z]/.test(password), message: "Password must include an uppercase letter." },
    { valid: /[0-9]/.test(password), message: "Password must include a number." },
    { valid: /[^a-zA-Z0-9]/.test(password), message: "Password must include a special character." },
  ];
  return requirements.filter(({ valid }) => !valid).map(({ message }) => message);
}
