import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'quero-internet-api',
      timestamp: new Date().toISOString()
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'ready',
      checks: {
        application: 'up'
      },
      timestamp: new Date().toISOString()
    };
  }
}
