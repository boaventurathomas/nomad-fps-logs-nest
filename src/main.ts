import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const config = new DocumentBuilder()
    .setTitle('Nomad FPS Logs API')
    .setDescription('Parser e Rankings de FPS (NestJS + TypeORM + SQLite)')
    .setVersion('1.0.0')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  await app.listen(3000)
  // eslint-disable-next-line no-console
  console.log(`🚀 API running at http://localhost:3000 (docs at /docs)`)
}
bootstrap()
