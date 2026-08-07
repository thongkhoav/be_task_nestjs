import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService local sign-in', () => {
  const userRepository = {
    findOne: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('rejects password sign-in for a Google-only user', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'google-user-1',
      email: 'google-user@example.com',
      fullName: 'Google User',
      password: null,
      role: { title: 'USER' },
      googleLogin: true,
    });

    await expect(
      service.login({
        email: 'google-user@example.com',
        password: 'not-a-google-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
