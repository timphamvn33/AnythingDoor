import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, {
    message: 'Password is too short. Minimum length is 6 characters.',
  })
  @MaxLength(20, {
    message: 'Password is too long. Maximum length is 20 characters.',
  })
  password: string;
}
