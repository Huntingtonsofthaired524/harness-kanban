import { DatabaseModule } from '@/database/database.module'
import { Module } from '@nestjs/common'
import { PgmqService } from './pgmq.service'

@Module({
  imports: [DatabaseModule],
  providers: [PgmqService],
  exports: [PgmqService],
})
export class PgmqModule {}
