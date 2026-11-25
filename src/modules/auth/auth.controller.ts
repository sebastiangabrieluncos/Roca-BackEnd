import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

// Solo el login: las cuentas se crean con POST /usuarios,
// porque en la escuela las da de alta la vicedirección
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 200 y no 201: iniciar sesión no crea nada
  @Post('login')
  @HttpCode(200)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
