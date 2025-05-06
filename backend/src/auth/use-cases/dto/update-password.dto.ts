import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  id?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password?: string;
}
