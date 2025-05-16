import { IsString, IsNumber } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  orderId: string;

  @IsString()
  menuItemId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}
