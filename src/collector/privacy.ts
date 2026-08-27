/**
 * Privacy & Security Exclusion Filter
 * Ensures sensitive files, secrets, database dumps, and heavy directories
 * are strictly ignored during collection and never transmitted to AI or external systems.
 */

export const FORBIDDEN_DIRECTORIES = [
  'node_modules',
  'vendor',
  '.git',
  '.svn',
  '.hg',
  '.venv',
  'venv',
  'env',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  'target',
  'bin',
  'obj',
  'coverage',
  '.turbo',
  '.cache',
  'uploads',
  'storage',
  'backup',
  'tmp',
  'temp',
  '.agents',
  '.agent',
  '.github',
  '.vscode',
  '.idea',
  'src',
  'app',
  'public',
  'assets',
  'styles',
  'components',
  'utils',
  'hooks',
  'migrations',
  'seeds',
];

export const STANDARD_SOURCE_DIRECTORIES = [
  'src',
  'app',
  'pages',
  'components',
  'lib',
  'utils',
  'helpers',
  'hooks',
  'public',
  'assets',
  'styles',
  'css',
  'scss',
  'images',
  'img',
  'icons',
  'fonts',
  'database',
  'db',
  'migrations',
  'seeds',
  'fixtures',
  'tests',
  'test',
  'spec',
  'specs',
  '__tests__',
  '__mocks__',
  'config',
  'configs',
  'docs',
  'documentation',
  'locales',
  'lang',
  'messages',
  'types',
  'interfaces',
  'routes',
  'controllers',
  'models',
  'views',
  'services',
  'middleware',
  'plugins',
];

export const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^credentials(\..+)?$/i,
  /^secrets?(\..+)?$/i,
  /id_rsa/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
  /\.sql$/i,
  /\.dump$/i,
  /\.sqlite3?$/i,
  /\.db$/i,
  /\.bak$/i,
  /service-account.*\.json$/i,
];

export function isForbiddenDirectory(dirName: string): boolean {
  return FORBIDDEN_DIRECTORIES.includes(dirName.toLowerCase());
}

export function isSensitiveFile(fileName: string): boolean {
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

/**
 * Sanitizes a string text (like a TODO snippet or commit message) by redacting
 * probable secrets, tokens, and sensitive keys.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/(api[_-]?key|secret|token|password|passwd|auth)=['"]?[a-zA-Z0-9_\-\.]{8,}['"]?/gi, '$1=[REDACTED]')
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]{16,}/gi, 'Bearer [REDACTED]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
}
