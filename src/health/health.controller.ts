import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { Public } from 'src/common/decorators';

@Controller('health')
export class HealthController {
  // Public endpoint to check health status
  @Public()
  @Get('/')
  findAll() {
    return { status: 'ok' };
  }
}
