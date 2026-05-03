import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as path from 'path';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
    app.useLogger(app.get(Logger));
    app.useWebSocketAdapter(new IoAdapter(app));

    // Serve uploaded files (avatars, etc.)
    const uploadsPath = path.join(process.cwd(), 'uploads');
    app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

    // Koyeb usa proxy reverso; sem isso todos os IPs são do proxy
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    app.setGlobalPrefix('api');

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:8080',
      credentials: true,
    });

    const port = process.env.PORT || 3333;
    await app.listen(port);

    app.get(Logger).log(`Server is running on http://localhost:${port}/api`);
  } catch (error) {
    process.stderr.write(`Error starting server: ${String(error)}\n`);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  process.stderr.write(`Unexpected error during bootstrap: ${String(error)}\n`);
  process.exit(1);
});
