import { IsArray, IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsBoolean()
  @IsOptional()
  available: boolean;

  @IsString()
  @IsOptional()
  imgUrl: string;

  @IsString()
  @IsOptional()
  restaurantId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  category: string[];

  @IsString()
  @IsOptional()
  openHrs: string;

  @IsString()
  @IsOptional()
  closeHrs: string;
}
