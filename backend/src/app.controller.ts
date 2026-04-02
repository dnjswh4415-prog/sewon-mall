import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {

  @Get('api/test')
  getTest() {
    return { message: '백엔드 연결 성공 🚀' };
  }

}
