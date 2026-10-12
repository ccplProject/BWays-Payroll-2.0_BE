import { ValidationPipe, ArgumentMetadata } from '@nestjs/common';

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
  }

  // Optionally override methods if you need custom behavior
  transform(value: any, metadata: ArgumentMetadata) {
    return super.transform(value, metadata);
  }
}

// [commit 88]: refactor(pipes): add custom payload sanitization in validation pipe
