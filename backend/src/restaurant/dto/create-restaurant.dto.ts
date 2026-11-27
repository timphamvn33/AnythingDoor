import { Weekday } from '@db/generated/prisma';
import { IsArray, IsOptional, IsString } from 'class-validator';

export type RestaurantSchedule = { day: Weekday; opensAt: string; closesAt: string };
export type RestaurantAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  logoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsString()
  openHrs: string;

  @IsString()
  closeHrs: string;

  phoneNumber?: string;
  address?: RestaurantAddress;
  hours?: RestaurantSchedule[];
}
