import { resolvePort } from './port';

describe('resolvePort', () => {
  it('converts a custom port from an environment string', () => {
    expect(resolvePort('4100', 3333)).toBe(4100);
  });

  it('uses the default port when the environment value is missing', () => {
    expect(resolvePort(undefined, 3333)).toBe(3333);
  });

  it('rejects an invalid port', () => {
    expect(() => resolvePort('invalid', 3333)).toThrow(
      'PORT must be an integer between 1 and 65535',
    );
  });
});
