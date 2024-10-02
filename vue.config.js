const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  outputDir: path.resolve(__dirname, './docs'), // Set output directory for the build
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/parler-tts-dataset/' // Base path for GitHub Pages
    : '/', // Base path for local development
  transpileDependencies: true
});
