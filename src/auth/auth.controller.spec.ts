import { AuthController } from './auth.controller';

describe('AuthController cookie-only token handling', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Test User',
    role: 'USER',
  };
  const tokens = {
    access_token: 'access-secret-value',
    refresh_token: 'refresh-secret-value',
  };
  const authService = {
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    validateGoogleUser: jest.fn(),
  };
  const jwtService = {
    decode: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string, fallback?: any) => {
      const values = {
        COOKIE_AUTH: 'TaskApp_Tokens',
        FE_HOST: 'https://frontend.example.com',
        NODE_ENV: 'development',
      };
      return values[key] ?? fallback;
    }),
  };
  const response = {
    cookie: jest.fn(),
    redirect: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(
      authService as any,
      jwtService as any,
      config as any,
    );
  });

  it('sets safe cookie defaults and returns only the user profile on sign-in', async () => {
    authService.login.mockResolvedValue({ tokens, user });

    const result = await controller.signinLocal(response as any, {
      email: 'user@example.com',
      password: 'plaintext-password',
    });

    expect(response.cookie).toHaveBeenCalledWith(
      'TaskApp_Tokens',
      JSON.stringify(tokens),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    );
    expect(result).toEqual(user);
    expect(JSON.stringify(result)).not.toContain('access-secret-value');
    expect(JSON.stringify(result)).not.toContain('refresh-secret-value');
  });

  it('rotates cookie tokens without returning them in the refresh body', async () => {
    jwtService.decode.mockReturnValue({
      sub: 'user-1',
      exp: Math.floor(Date.now() / 1000) + 300,
    });
    authService.refreshAccessToken.mockResolvedValue(tokens);

    const result = await controller.refreshTokens(
      response as any,
      { fcmToken: undefined },
      'user-1',
      'valid-refresh-token',
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'TaskApp_Tokens',
      JSON.stringify(tokens),
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(result).toEqual({ message: 'Tokens refreshed' });
    expect(JSON.stringify(result)).not.toContain('access-secret-value');
  });

  it('uses the safe cookie policy for Google sign-in and redirects to FE_HOST', async () => {
    authService.validateGoogleUser.mockResolvedValue(tokens);

    await controller.googleRedirect({ user } as any, response as any);

    expect(authService.validateGoogleUser).toHaveBeenCalledWith(user);
    expect(response.cookie).toHaveBeenCalledWith(
      'TaskApp_Tokens',
      JSON.stringify(tokens),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    );
    expect(response.redirect).toHaveBeenCalledWith(
      'https://frontend.example.com',
    );
  });

  it('defaults cookies to Secure in production', async () => {
    config.get.mockImplementation((key: string, fallback?: any) => {
      const values = {
        COOKIE_AUTH: 'TaskApp_Tokens',
        NODE_ENV: 'production',
      };
      return values[key] ?? fallback;
    });
    authService.login.mockResolvedValue({ tokens, user });

    await controller.signinLocal(response as any, {
      email: 'user@example.com',
      password: 'plaintext-password',
    });

    expect(response.cookie).toHaveBeenCalledWith(
      'TaskApp_Tokens',
      JSON.stringify(tokens),
      expect.objectContaining({ httpOnly: true, secure: true }),
    );
  });

  it('keeps production cookies Secure when a stale override is false', async () => {
    config.get.mockImplementation((key: string, fallback?: any) => {
      const values = {
        COOKIE_AUTH: 'TaskApp_Tokens',
        COOKIE_SECURE: 'false',
        NODE_ENV: 'production',
      };
      return values[key] ?? fallback;
    });
    authService.login.mockResolvedValue({ tokens, user });

    await controller.signinLocal(response as any, {
      email: 'user@example.com',
      password: 'plaintext-password',
    });

    expect(response.cookie).toHaveBeenCalledWith(
      'TaskApp_Tokens',
      JSON.stringify(tokens),
      expect.objectContaining({ secure: true }),
    );
  });
});
