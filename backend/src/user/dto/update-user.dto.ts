import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@db/generated/prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role, {
    message: 'Role must be one of buyer, admin, driver, restaurant_owner',
  })
  role?: Role[];
}
