import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AddressModule } from './address/address.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductImageModule } from './product/product-image/product-image.module';
import { ReviewModule } from './review/review.module';
import { StockModule } from './stock/stock.module';
import { AdminModule } from './admin/admin.module';
import { TranslateModule } from './translate/translate.module';


@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OrderModule,
    CartModule,
    WishlistModule,
    CategoryModule,
    ProductModule,
    PaymentsModule,
    AddressModule,
    ProductImageModule,
    ReviewModule,
    StockModule,
    ScheduleModule.forRoot(),
    AdminModule,
    TranslateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}