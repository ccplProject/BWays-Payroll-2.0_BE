import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly env = process.env;

  get<T = any>(key: string, defaultValue?: T): T | undefined {
    const val = this.env[key];
    if (val === undefined) return defaultValue;
    return (val as unknown) as T;
  }

  getNumber(key: string, defaultValue?: number): number | undefined {
    const v = this.get<string>(key);
    if (v === undefined) return defaultValue;
    const n = Number(v);
    return Number.isNaN(n) ? defaultValue : n;
  }
}
