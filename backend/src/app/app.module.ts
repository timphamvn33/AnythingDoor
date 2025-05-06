import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from '@src/user/user.module';
import { AuthModule } from '@src/auth/auth.module';
import { RestaurantModule } from '@src/restaurant/restaurant.module';

@Module({
  imports: [UserModule, AuthModule, RestaurantModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
