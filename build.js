const esbuild = require('esbuild');

Promise.all([
  esbuild.build({
    entryPoints: ['src/background_script.js'],
    bundle: true,
    minify: true,
    outfile: 'dist/background_script.js',
    format: 'iife',
    globalName: 'LLMNotesBackground',
  }),
  esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'iife',
    globalName: 'LLMNotes',
  }),
  esbuild.build({
    entryPoints: ['src/storage_tab.js'],
    bundle: true,
    outfile: 'dist/storage_tab.js',
    format: 'iife',
    globalName: 'LLMNotesStorage',
  })
]).catch(() => process.exit(1));
