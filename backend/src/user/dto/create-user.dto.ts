import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '@db/generated/prisma/client';

export class CreateUserDto {
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

  @IsEnum(Role, {
    message: 'Role must be one of buyer, admin, driver, restaurant_owner',
  })
  role: Role[];
}
