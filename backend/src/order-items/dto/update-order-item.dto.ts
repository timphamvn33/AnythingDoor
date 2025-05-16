import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateOrderItemDto {
  @IsOptional()
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  menuItemId: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  price: number;
}
