import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  logoUrl: string;

  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsString()
  openHrs: string;

  @IsString()
  closeHrs: string;
}
