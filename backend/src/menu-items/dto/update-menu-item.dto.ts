import { IsArray, IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsBoolean()
  available: boolean;

  @IsOptional()
  @IsString()
  imgUrl: string;

  @IsOptional()
  @IsString()
  restaurantId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsOptional()
  @IsString()
  openHrs: string;

  @IsOptional()
  @IsString()
  closeHrs: string;
}
