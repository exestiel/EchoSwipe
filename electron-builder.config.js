export default {
  appId: 'com.echocompany.echoswipe',
  productName: 'EchoSwipe',
  directories: {
    output: 'public',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'main.js',
    'preload.cjs',
    'package.json',
    'scripts/get-theme-color.js',
    // Exclude unnecessary files using negation patterns
    '!**/node_modules/**/*',
    '!**/*.map',
    '!**/*.ts',
    '!**/*.tsx',
    '!**/src/**/*',
    '!**/.git/**/*',
    '!**/README.md',
    '!**/.npmrc',
    '!**/pnpm-lock.yaml',
    '!**/vite.config.js',
    '!**/electron-builder.config.js',
    '!**/scripts/check-echo-ui-build.js',
    '!**/.gitignore',
    '!**/GiftCard Example*.txt',
  ],
  extraFiles: [],
  asarUnpack: [],
  asar: true,
  win: {
    target: 'nsis',
    // icon: 'build/icon.ico', // Optional - will use default if not provided
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
  portable: {
    artifactName: '${productName}-${version}-portable.exe',
  },
  // Performance optimizations for faster builds
  compression: process.env.FAST_BUILD === 'true' ? 'store' : 'maximum',
};
