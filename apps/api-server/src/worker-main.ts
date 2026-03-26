import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { WorkerAppModule } from './worker-app.module.js'

async function bootstrap() {
  const logger = new Logger('HarnessWorkerBootstrap')
  const app = await NestFactory.createApplicationContext(WorkerAppModule)

  app.enableShutdownHooks()

  logger.log('Harness worker application context initialized')
}

void bootstrap()
