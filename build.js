const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/mistral_entry.js', 'src/chatgpt_handler.js'],
  bundle: true,
  outdir: './dist',
  format: 'esm',
  target: 'es2018',
  sourcemap: true,
  globalName: 'LLMNotes',
}).catch(() => process.exit(1));
