import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

import { Config } from './config/config.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService<Config> = app.get(ConfigService);

  app.enableCors({
    origin: true,
  });

  const port = config.get('port');
  await app.listen(port);
  console.log(`Application start on port: ${port}`);
}
bootstrap();
