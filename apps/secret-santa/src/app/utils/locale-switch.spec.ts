import { SeoLocale } from '../core/config/seo.config';
import { resolveTargetLocaleUrl } from './locale-switch';

describe('resolveTargetLocaleUrl', () => {
  it('should switch between /en/ and /es/ on the same origin while preserving query and hash', () => {
    const target = resolveTargetLocaleUrl(
      {
        origin: 'https://secretsanta.app',
        pathname: '/en/event/abc',
        search: '?ref=invite',
        hash: '#register-form',
      },
      SeoLocale.ES_MX
    );

    expect(target).toBe(
      'https://secretsanta.app/es/event/abc?ref=invite#register-form'
    );
  });

  it('should map the root path to the target locale root with a trailing slash', () => {
    const target = resolveTargetLocaleUrl(
      {
        origin: 'https://secretsanta.app',
        pathname: '/es/',
        search: '',
        hash: '',
      },
      SeoLocale.EN_US
    );

    expect(target).toBe('https://secretsanta.app/en/');
  });
});
