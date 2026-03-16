/**
 * Password hashing and verification using Argon2id.
 * Per SECURITY-RULEBOOK A.2
 *
 * Parameters: m=65536 (64MB), t=3 iterations, p=4 parallelism
 */

// Argon2 is a native module — lazy import to avoid build issues
let argon2Module: typeof import('argon2') | null = null;

async function getArgon2(): Promise<typeof import('argon2')> {
  if (!argon2Module) {
    argon2Module = await import('argon2');
  }
  return argon2Module;
}

const ARGON2_OPTIONS = {
  type: 2 as const, // argon2id
  memoryCost: 65536, // 64MB (A.2.1)
  timeCost: 3, // 3 iterations (A.2.1)
  parallelism: 4, // 4 threads (A.2.1)
};

/**
 * Hash a password using Argon2id. Per A.2
 */
export async function hashPassword(password: string): Promise<string> {
  const argon2 = await getArgon2();
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a hash. Per A.2
 * Includes transparent re-hash on parameter upgrade (A.2.3)
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const argon2 = await getArgon2();
  const valid = await argon2.verify(hash, password);
  const needsRehash = valid && argon2.needsRehash(hash, ARGON2_OPTIONS);
  return { valid, needsRehash };
}

/**
 * Check password against policy rules. Per A.3
 * Returns array of violation messages (empty = valid).
 */
export function checkPasswordPolicy(password: string): string[] {
  const violations: string[] = [];

  if (password.length < 12) {
    violations.push('Password must be at least 12 characters');
  }
  if (password.length > 128) {
    violations.push('Password must not exceed 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    violations.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    violations.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    violations.push('Password must contain at least one digit');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    violations.push('Password must contain at least one special character');
  }

  return violations;
}
