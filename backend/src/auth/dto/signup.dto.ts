import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class SignupDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsString()
  phone: string;

  @IsString()
  role: string;
}
