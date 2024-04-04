import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { tokenDistribute } from './util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
  tokenDistribute();
}
bootstrap();
