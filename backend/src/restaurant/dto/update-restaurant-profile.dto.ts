import { IsArray, IsOptional, IsString } from 'class-validator';
import type { RestaurantAddress, RestaurantSchedule } from './create-restaurant.dto';

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
  category?: string[];

  @IsOptional()
  @IsString()
  openHrs?: string;

  @IsOptional()
  @IsString()
  closeHrs?: string;

  phoneNumber?: string;
  address?: RestaurantAddress;
  hours?: RestaurantSchedule[];
}
