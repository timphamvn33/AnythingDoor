import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from '@src/user/user.module';
import { AuthModule } from '@src/auth/auth.module';
import { RestaurantModule } from '@src/restaurant/restaurant.module';
import { PaymentModule } from '@src/payment/payment.module';
import { OrderModule } from '@src/orders/order.module';
import { OrderItemModule } from '@src/order-items/order-item.module';
import { MenuItemModule } from '@src/menu-items/menu-item.module';
import { DeliveryModule } from '@src/delivery/delivery.module';
import { PrismaModule } from '@src/prisma/prisma.module';
import { RestaurantController } from '@src/restaurant/restaurant.controller';
import { PaymentController } from '@src/payment/payment.controller';
import { OrderItemController } from '@src/order-items/order-item.controller';
import { OrderController } from '@src/orders/order.controller';
import { MenuItemController } from '@src/menu-items/menu-item.controller';
import { DeliveryController } from '@src/delivery/delivery.controller';
import { RestaurantService } from '@src/restaurant/restaurant.service';
import { PaymentService } from '@src/payment/payment.service';
import { OrderService } from '@src/orders/order.service';
import { MenuItemService } from '@src/menu-items/menu-item.service';
import { OrderItemService } from '@src/order-items/order-item.service';
import { DeliveryService } from '@src/delivery/delivery.service';

@Module({
  imports: [
    UserModule,
    AuthModule,
    RestaurantModule,
    PaymentModule,
    OrderModule,
    OrderItemModule,
    MenuItemModule,
    DeliveryModule,
    PrismaModule,
  ],
  controllers: [
    AppController,
    RestaurantController,
    PaymentController,
    OrderItemController,
    OrderController,
    MenuItemController,
    DeliveryController,
  ],
  providers: [
    RestaurantService,
    PaymentService,
    OrderService,
    MenuItemService,
    OrderItemService,
    DeliveryService,
  ],
})
export class AppModule {}
