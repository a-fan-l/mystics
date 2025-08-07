import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import svgr from '@svgr/rollup';
import alias from '@rollup/plugin-alias';

const packageJson = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      alias({
        entries: [
          { find: '@constants', replacement: './src/constants' },
          { find: '@icons', replacement: './src/icons' },
        ],
        customResolver: resolve({
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.svg'],
        }),
      }),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.svg'],
      }),
      {
        name: 'copy-icons',
        generateBundle() {
          const fs = require('fs');
          const path = require('path');
          const srcIconsDir = path.resolve(__dirname, 'src/icons');
          const distIconsDir = path.resolve(__dirname, 'dist/icons');

          if (!fs.existsSync(distIconsDir)) {
            fs.mkdirSync(distIconsDir, { recursive: true });
          }

          function copyDir(src, dest) {
            const entries = fs.readdirSync(src, { withFileTypes: true });

            for (const entry of entries) {
              const srcPath = path.join(src, entry.name);
              const destPath = path.join(dest, entry.name);

              if (entry.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                copyDir(srcPath, destPath);
              } else if (entry.isFile()) {
                fs.copyFileSync(srcPath, destPath);
              }
            }
          }

          copyDir(srcIconsDir, distIconsDir);
        },
      },
      {
        name: 'svg-transform',
        transform(code, id) {
          if (id.endsWith('.svg')) {
            return `export default ${JSON.stringify(code)}`;
          }
          return null;
        },
      },
      commonjs(),
      svgr(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
    external: Object.keys(packageJson.peerDependencies || {}).concat(
      Object.keys(packageJson.dependencies || {})
    ),
  },
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/types',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    plugins: [
      alias({
        entries: [
          { find: '@constants', replacement: './src/constants' },
        ],
        customResolver: resolve({
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.svg'],
        }),
      }),
      dts({ tsconfig: './tsconfig.json' }),
    ],
    external: [
      /\.css$/,
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      'i18next',
      'react-i18next',
      /^@components\//,
      /^@icons\//,
    ],
  },
];