import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const browserDistDir = join(process.cwd(), 'dist', 'secret-santa', 'browser');
const enDir = join(browserDistDir, 'en-US');
const esDir = join(browserDistDir, 'es-MX');
const hostingDir = join(process.cwd(), 'dist', 'secret-santa', 'hosting');

if (!existsSync(enDir) || !existsSync(esDir)) {
  throw new Error(
    'Missing localized build outputs. Run "npm run build" before assembling hosting.'
  );
}

rmSync(hostingDir, { recursive: true, force: true });
mkdirSync(hostingDir, { recursive: true });

cpSync(enDir, join(hostingDir, 'en'), { recursive: true });
cpSync(esDir, join(hostingDir, 'es'), { recursive: true });

const sharedThemeDir = join(enDir, 'theme');
if (existsSync(sharedThemeDir)) {
  cpSync(sharedThemeDir, join(hostingDir, 'theme'), { recursive: true });
}

console.log(
  `Prepared unified hosting bundle at ${hostingDir} (en-US at /en/, es-MX at /es/)`
);
