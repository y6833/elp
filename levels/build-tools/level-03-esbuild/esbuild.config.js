const esbuild = require('esbuild');

const config = {
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2015',
  minify: false,
  sourcemap: true,
  loader: {
    '.js': 'jsx',
    '.ts': 'tsx',
    '.png': 'file',
    '.jpg': 'file',
    '.gif': 'file',
    '.svg': 'file'
  },
  define: {
    'process.env.NODE_ENV': '"development"'
  },
  plugins: [
    {
      name: 'css-loader',
      setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
          const fs = require('fs');
          const css = await fs.promises.readFile(args.path, 'utf8');
          return {
            contents: `
              const style = document.createElement('style');
              style.textContent = ${JSON.stringify(css)};
              document.head.appendChild(style);
            `,
            loader: 'js'
          };
        });
      }
    }
  ]
};

module.exports = config;