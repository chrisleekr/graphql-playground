import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GenerationsResolver } from './generations.resolver';
import { GenerationsService } from './generations.service';

@Module({
  imports: [PrismaModule],
  providers: [GenerationsResolver, GenerationsService],
  exports: [GenerationsService],
})
export class GenerationsModule {}
