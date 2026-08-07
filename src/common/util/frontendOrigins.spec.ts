import { parseFrontendOrigins } from './frontendOrigins';

describe('frontend origin configuration', () => {
  it('parses a single FE_ORIGINS value', () => {
    expect(parseFrontendOrigins('http://localhost:3000')).toEqual([
      'http://localhost:3000',
    ]);
  });

  it('parses multiple comma-separated origins with domain and port', () => {
    expect(
      parseFrontendOrigins(
        'http://localhost:3000, https://app.example.com:8443',
      ),
    ).toEqual(['http://localhost:3000', 'https://app.example.com:8443']);
  });

  it('removes empty and duplicate origins', () => {
    expect(
      parseFrontendOrigins('http://localhost:3000, ,http://localhost:3000,'),
    ).toEqual(['http://localhost:3000']);
  });
});
