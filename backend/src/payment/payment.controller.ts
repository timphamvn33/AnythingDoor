import { Body, Controller, Get, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '@src/auth/use-cases/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('Payments')
export class PaymentController {
  constructor(private readonly PaymentService: PaymentService) {}

  @Post()
  createPayment(@Body() body: CreatePaymentDto) {
    return this.PaymentService.createPayment(body);
  }

  @Get(':id')
  getPaymentById(@Param('id') id: string) {
    return this.PaymentService.findPaymentById(id);
  }

  @Post(':id')
  updatePayment(@Param('id') id: string, @Body() body: UpdatePaymentDto) {
    return this.PaymentService.updatePayment(id, body);
  }

  @Delete(':id')
  deletePayment(@Param('id') id: string) {
    return this.PaymentService.deletePaymentById(id);
  }
}
