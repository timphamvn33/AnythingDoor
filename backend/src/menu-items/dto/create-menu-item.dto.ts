import { IsArray, IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  name: string | undefined;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number | undefined;

  @IsBoolean()
  available: boolean | undefined;

  @IsString()
  @IsOptional()
  imgUrl?: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsString()
  restaurantId: string | undefined;

  @IsArray()
  @IsString({ each: true })
  category: string[] | undefined;
}
