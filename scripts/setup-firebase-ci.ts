import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(
  record: Record<string, unknown>,
  field: string
): string {
  const value = record[field];
  if (typeof value !== 'string') {
    throw new Error(`FIREBASE_WEB_CONFIG.${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('YOUR_')) {
    throw new Error(
      `FIREBASE_WEB_CONFIG.${field} must be a real non-placeholder value.`
    );
  }
  return trimmed;
}

function parseFirebaseWebConfig(rawJson: string): FirebaseWebConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid FIREBASE_WEB_CONFIG JSON: ${message}`);
  }

  if (!isPlainRecord(parsed)) {
    throw new Error('FIREBASE_WEB_CONFIG must be a JSON object.');
  }

  const measurementRaw = parsed['measurementId'];
  const measurementId =
    typeof measurementRaw === 'string' &&
    measurementRaw.trim().length > 0 &&
    !measurementRaw.trim().startsWith('YOUR_')
      ? measurementRaw.trim()
      : undefined;

  return {
    apiKey: readNonEmptyString(parsed, 'apiKey'),
    authDomain: readNonEmptyString(parsed, 'authDomain'),
    projectId: readNonEmptyString(parsed, 'projectId'),
    storageBucket: readNonEmptyString(parsed, 'storageBucket'),
    messagingSenderId: readNonEmptyString(parsed, 'messagingSenderId'),
    appId: readNonEmptyString(parsed, 'appId'),
    ...(measurementId ? { measurementId } : {}),
  };
}

function renderFirebaseConfigTs(config: FirebaseWebConfig): string {
  const entries: Array<[string, string]> = [
    ['apiKey', config.apiKey],
    ['authDomain', config.authDomain],
    ['projectId', config.projectId],
    ['storageBucket', config.storageBucket],
    ['messagingSenderId', config.messagingSenderId],
    ['appId', config.appId],
  ];

  if (config.measurementId) {
    entries.push(['measurementId', config.measurementId]);
  }

  const formattedEntries = entries
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`)
    .join('\n');

  return `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
${formattedEntries}
};

const app = initializeApp(firebaseConfig);

// Auto-detect long polling avoids 30s WebChannel stalls on some networks.
export const firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const auth = getAuth(app);
`;
}

function resolveRootDir(argv: ReadonlyArray<string>): string {
  const flagIndex = argv.indexOf('--root');
  if (flagIndex === -1) {
    return process.cwd();
  }
  const target = argv[flagIndex + 1];
  if (!target) {
    throw new Error('Missing path value after --root.');
  }
  return resolve(target);
}

function main(): void {
  const rawConfig = process.env['FIREBASE_WEB_CONFIG']?.trim();
  if (!rawConfig) {
    throw new Error(
      'Missing FIREBASE_WEB_CONFIG environment variable. Set the GitHub Secret FIREBASE_WEB_CONFIG with your Firebase Web App JSON config.'
    );
  }

  const rootDir = resolveRootDir(process.argv.slice(2));
  const config = parseFirebaseWebConfig(rawConfig);

  const projectId =
    process.env['FIREBASE_PROJECT_ID']?.trim() || config.projectId;
  const hostingTarget =
    process.env['FIREBASE_HOSTING_TARGET']?.trim() || 'secret-santa';
  const hostingSiteId =
    process.env['FIREBASE_HOSTING_SITE_ID']?.trim() || projectId;

  const firebaseConfigPath = join(rootDir, 'src', 'app', 'firebase-config.ts');
  mkdirSync(dirname(firebaseConfigPath), { recursive: true });
  writeFileSync(firebaseConfigPath, renderFirebaseConfigTs(config), 'utf8');

  const firebasercPath = join(rootDir, '.firebaserc');
  const firebasercPayload = {
    projects: {
      default: projectId,
    },
    targets: {
      [projectId]: {
        hosting: {
          [hostingTarget]: [hostingSiteId],
        },
      },
    },
  };
  writeFileSync(
    firebasercPath,
    `${JSON.stringify(firebasercPayload, null, 2)}\n`,
    'utf8'
  );

  console.log(
    `Generated CI Firebase config and .firebaserc (project=${projectId}, target=${hostingTarget}, site=${hostingSiteId})`
  );
}

main();
