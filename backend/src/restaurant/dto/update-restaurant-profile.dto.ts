import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorry?: string[];

  @IsOptional()
  @IsString()
  openHrs?: string;

  @IsOptional()
  @IsString()
  closeHrs?: string;
}
