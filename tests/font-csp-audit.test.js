'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const FONTS_DIR = path.join(ROOT, 'assets', 'fonts');

const indexContent = fs.readFileSync(INDEX, 'utf8');

describe('Local font files', () => {
  const expectedFonts = [
    'tajawal-300-arabic.woff2', 'tajawal-300-latin.woff2',
    'tajawal-400-arabic.woff2', 'tajawal-400-latin.woff2',
    'tajawal-500-arabic.woff2', 'tajawal-500-latin.woff2',
    'tajawal-700-arabic.woff2', 'tajawal-700-latin.woff2',
    'tajawal-800-arabic.woff2', 'tajawal-800-latin.woff2',
    'tajawal-900-arabic.woff2', 'tajawal-900-latin.woff2',
    'cairo-variable-arabic.woff2', 'cairo-variable-latin-ext.woff2', 'cairo-variable-latin.woff2',
    'inter-variable-latin-ext.woff2', 'inter-variable-latin.woff2',
  ];

  test.each(expectedFonts)('%s exists and is valid woff2', (filename) => {
    const fp = path.join(FONTS_DIR, filename);
    expect(fs.existsSync(fp)).toBe(true);
    const buf = fs.readFileSync(fp);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.slice(0, 4).toString('hex')).toBe('774f4632');
  });

  test('font licenses documented', () => {
    const lic = path.join(FONTS_DIR, 'LICENSES.md');
    expect(fs.existsSync(lic)).toBe(true);
    const content = fs.readFileSync(lic, 'utf8');
    expect(content).toContain('Tajawal');
    expect(content).toContain('Cairo');
    expect(content).toContain('Inter');
    expect(content).toContain('SIL Open Font License');
  });
});

describe('Google Fonts references removed', () => {
  test('no fonts.googleapis.com in index.html', () => {
    expect(indexContent).not.toContain('fonts.googleapis.com');
  });

  test('no fonts.gstatic.com in index.html', () => {
    expect(indexContent).not.toContain('fonts.gstatic.com');
  });

  test('no external font link tags', () => {
    const fontLinks = indexContent.match(/<link[^>]+fonts\.(googleapis|gstatic)/g);
    expect(fontLinks).toBeNull();
  });
});

describe('CSP remains restrictive', () => {
  const cspFile = fs.readFileSync(path.join(ROOT, 'electron', 'security', 'window-policy.js'), 'utf8');

  test('font-src allows only self and data', () => {
    expect(cspFile).toMatch(/font-src\s+'self'\s+data:/);
    expect(cspFile).not.toContain('fonts.gstatic.com');
    expect(cspFile).not.toContain('fonts.googleapis.com');
  });

  test('style-src allows only self and unsafe-inline', () => {
    expect(cspFile).toMatch(/style-src\s+'self'\s+'unsafe-inline'/);
    expect(cspFile).not.toContain('fonts.googleapis.com');
  });

  test('default-src is self only', () => {
    expect(cspFile).toMatch(/default-src\s+'self'/);
  });

  test('no wildcard origins', () => {
    expect(cspFile).not.toMatch(/font-src[^;]*\*/);
    expect(cspFile).not.toMatch(/style-src[^;]*\*/);
    expect(cspFile).not.toMatch(/script-src[^;]*\*/);
  });

  test('sandbox remains enabled', () => {
    expect(cspFile).toContain('sandbox: sandbox !== false');
  });

  test('context isolation remains enabled', () => {
    expect(cspFile).toContain('contextIsolation: true');
  });

  test('node integration remains disabled', () => {
    expect(cspFile).toContain('nodeIntegration: false');
  });
});

describe('Receipt English name fallback restored', () => {
  test('defaultSettings.centerNameEn is empty string', () => {
    expect(indexContent).toMatch(/centerNameEn:\s*''/);
    expect(indexContent).not.toMatch(/centerNameEn:\s*APP_META/);
  });

  test('buildReceiptHTML uses Cupping Center fallback', () => {
    expect(indexContent).toContain("|| 'Cupping Center'");
    const receiptFallback = indexContent.match(/cnEn\s*=\s*settings\.centerNameEn\s*\|\|\s*'([^']+)'/);
    expect(receiptFallback).not.toBeNull();
    expect(receiptFallback[1]).toBe('Cupping Center');
  });
});

describe('@font-face declarations present', () => {
  test('Tajawal @font-face defined', () => {
    expect(indexContent).toMatch(/@font-face\s*\{[^}]*font-family:\s*'Tajawal'/);
  });

  test('Cairo @font-face defined', () => {
    expect(indexContent).toMatch(/@font-face\s*\{[^}]*font-family:\s*'Cairo'/);
  });

  test('Inter @font-face defined', () => {
    expect(indexContent).toMatch(/@font-face\s*\{[^}]*font-family:\s*'Inter'/);
  });

  test('font paths point to local assets', () => {
    const fontFaces = indexContent.match(/@font-face\s*\{[^}]+\}/g) || [];
    expect(fontFaces.length).toBeGreaterThanOrEqual(17);
    fontFaces.forEach((ff) => {
      if (ff.includes("url(")) {
        expect(ff).toMatch(/url\(['"]?\.\/assets\/fonts\//);
        expect(ff).not.toContain('https://');
      }
    });
  });
});

describe('Build includes font files', () => {
  test('package.json extraResources or files config', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const build = pkg.build || {};
    const extraResources = build.extraResources || [];
    const files = build.files || [];
    const allPaths = [...extraResources, ...files].map(p => typeof p === 'string' ? p : p.from || '').join(' ');
    const hasAssets = allPaths.includes('assets') || files.some(f => f === '**/*' || f === 'assets/**');
    if (!hasAssets) {
      const hasWildcard = files.length === 0 || files.includes('**/*');
      expect(hasWildcard || allPaths.includes('assets')).toBe(true);
    }
  });
});
