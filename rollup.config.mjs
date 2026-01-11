import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import { dts } from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';
import { defineConfig } from 'rollup';

const rollupConfig = defineConfig([
  // JS文件打包配置
  {
    input: './src/index.js',
    output: [
      {
        file: './lib/index.cjs.js',
        format: 'cjs',
      },
      {
        file: './lib/index.esm.js',
        format: 'esm',
      },
    ],
    plugins: [
      del({ targets: 'lib' }),
      typescript(),
      resolve(),
      commonjs(),
      getBabelOutputPlugin({
        presets: ['@babel/preset-env'],
      }),
      terser(),
    ],
  },
  // ts 打包配置
  {
    input: './index.d.ts',
    output: {
      file: './lib/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
    external: [/\.css$/], // 排除 CSS 文件的导入
  },
]);

export default rollupConfig;
