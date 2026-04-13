const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'iife',
  globalName: 'MyExtension',
}).catch(() => process.exit(1));
