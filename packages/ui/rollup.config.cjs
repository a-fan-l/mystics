const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const dts = require('rollup-plugin-dts').default;
const { terser } = require('rollup-plugin-terser');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const svgr = require('@svgr/rollup');
const url = require('@rollup/plugin-url');
const fs = require('fs');
const path = require('path');

const packageJson = require('./package.json');

// 复制静态资源到dist目录
const copyFiles = () => ({
  name: 'copy-files',
  buildEnd() {
    // 复制styles目录
    const stylesDir = path.resolve(__dirname, 'src/styles');
    const stylesDistDir = path.resolve(__dirname, 'dist/styles');
    if (!fs.existsSync(stylesDistDir)) {
      fs.mkdirSync(stylesDistDir, { recursive: true });
    }
    fs.readdirSync(stylesDir).forEach(file => {
      fs.copyFileSync(path.resolve(stylesDir, file), path.resolve(stylesDistDir, file));
    });

    // 复制icons目录（如果存在的话，当前已删除）
    // TODO: 如果需要重新添加icons功能，取消注释并修复以下代码
  },
});

const onwarn = (warning, warn) => {
  // 忽略 'use client' 指令的警告
  if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
    return;
  }
  warn(warning);
};

// 定义共用的别名配置
const aliasOptions = {
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@icons': path.resolve(__dirname, 'src/icons'),
};

const createConfig = (input, output) => ({
  input,
  output,
  plugins: [
    peerDepsExternal(),
    // SVG files are handled by svgr plugin
    copyFiles({
      exclude: ['**/*.svg'],
    }),
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.svg'],
      alias: aliasOptions,
    }),
    commonjs(),
    url({
      include: ['**/*.png', '**/*.jpg', '**/*.gif'],
      limit: 0,
      fileName: '[dir][name][extname]',
      sourceDir: path.resolve(__dirname, 'src'),
      destDir: path.resolve(__dirname, 'dist'),
      publicPath: '',
      emitFiles: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    svgr({
      svgo: true,
      typescript: true,
      memo: true,
      ref: false,
      dimensions: false,
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
        ],
      },
    }),
    {
      name: 'resolve-icons',
      resolveId(source) {
        if (source.startsWith('@icons/')) {
          return path.resolve(__dirname, 'src', source.replace('@icons', 'icons'));
        }
        return null;
      },
    },
    terser(),
  ],
  onwarn,
  external: [
    ...Object.keys(packageJson.peerDependencies || {}),
    ...Object.keys(packageJson.dependencies || {}),
    'react/jsx-runtime',
    'zustand',
    'immer',
    'dayjs',
    'i18next',
    'react-i18next',
    'js-cookie',
    '@reduxjs/toolkit',
    'react-redux',
    'redux-persist',
    'redux-persist-cookie-storage',
    'lucide-react',
  ],
});

module.exports = [
  // Main bundle
  createConfig('src/index.ts', [
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
  ]),

  // Main types bundle
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/types',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    plugins: [dts()],
    external: [
      /\.css$/,
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      /^@components\//,
      /^@utils\//,
      /^@hooks\//,
      /^@store\//,
      /^@icons\//,
    ],
  },

  // Constants types bundle
  // {
  //   input: 'src/constants/index.ts',
  //   output: {
  //     dir: 'dist/types/constants',
  //     format: 'esm',
  //     preserveModules: true,
  //     preserveModulesRoot: 'src/constants',
  //   },
  //   plugins: [dts()],
  //   // 在 external 配置中移除 Redux 相关依赖
  //   external: [
  //     'react',
  //     'react-dom',
  //     '@mui/material',
  //     '@mui/icons-material',
  //     '@emotion/react',
  //     '@emotion/styled',
  //     'zustand',
  //     'immer',
  //     'dayjs',
  //     'i18next',
  //     'react-i18next',
  //     'js-cookie',
  //     'lucide-react',
  //     /^@components\//,
  //     /^@constants\//,
  //     /^@icons\//,
  //   ],
  // },
];
