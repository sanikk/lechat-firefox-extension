const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['content/main.js'],
  bundle: true,
  outfile: 'content/bundle.js',
  format: 'iife',
  globalName: 'MyExtension',
}).catch(() => process.exit(1));
