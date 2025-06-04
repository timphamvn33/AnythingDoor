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
  available: boolean;

  @IsString()
  imgUrl: string;

  @IsString()
  restaurantId: string;

  @IsArray()
  @IsString({ each: true })
  category: string[];
}
