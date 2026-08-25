import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'quero-internet-api',
      timestamp: new Date().toISOString()
    };
  }

  @Get('ready')
  async ready() {
    const databaseReady = await this.prisma.isReady();

    if (!databaseReady) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks: {
          application: 'up',
          database: 'down'
        },
        timestamp: new Date().toISOString()
      });
    }

    return {
      status: 'ready',
      checks: {
        application: 'up',
        database: 'up'
      },
      timestamp: new Date().toISOString()
    };
  }
}
