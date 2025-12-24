import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3333;
    await app.listen(port);

    console.log(`Server is running on http://localhost:${port}/api`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('Unexpected error during bootstrap:', error);
  process.exit(1);
});
