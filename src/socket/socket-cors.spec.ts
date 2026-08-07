import { socketCors } from './socket-cors';

describe('socketCors', () => {
  const originalFrontendHost = process.env.FE_HOST;
  const originalFrontendOrigins = process.env.FE_ORIGINS;

  afterEach(() => {
    if (originalFrontendHost === undefined) {
      delete process.env.FE_HOST;
    } else {
      process.env.FE_HOST = originalFrontendHost;
    }

    if (originalFrontendOrigins === undefined) {
      delete process.env.FE_ORIGINS;
    } else {
      process.env.FE_ORIGINS = originalFrontendOrigins;
    }
  });

  it('uses FE_ORIGINS instead of the single FE_HOST value', () => {
    process.env.FE_HOST = 'https://primary.example.com';
    process.env.FE_ORIGINS =
      'http://localhost:3001, https://app.example.com:8443';
    const callback = jest.fn();

    socketCors.origin('https://app.example.com:8443', callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
