export default {
  appId: 'com.echocompany.giftcardswipetool',
  productName: 'Gift Card Swipe Tool',
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
