import { IsString } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

// Returns an error message when the password is too weak, otherwise null.
export function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include an uppercase letter, a lowercase letter, and a number.';
  }
  return null;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  password!: string;
}
