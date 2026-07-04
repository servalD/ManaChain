import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  /* config options here */
  // Sortie autonome (.next/standalone) : serveur Node minimal embarqué,
  // requis par l'image Docker de prod (client/Dockerfile).
  output: "standalone",
  reactCompiler: true,
  
  turbopack: {
    rules: {
      '*': {
        condition: {
          all: [
            { path: /\/test\// },
            { path: /node_modules/ },
          ],
        },
        loaders: [
          {
            loader: 'raw-loader',
          },
        ],
        as: '*.js',
      },
      '*.test.{js,ts,tsx,mjs}': {
        condition: {
          path: /node_modules/,
        },
        loaders: [
          {
            loader: 'raw-loader',
          },
        ],
        as: '*.js',
      },
      'bench.js': {
        condition: {
          path: /node_modules/,
        },
        loaders: [
          {
            loader: 'raw-loader',
          },
        ],
        as: '*.js',
      },
    },
    resolveAlias: {
      'pino': 'data:text/javascript,export const levels={values:{fatal:60,error:50,warn:40,info:30,debug:20,trace:10}};export default function pino(){return{info:()=>{},warn:()=>{},error:()=>{},debug:()=>{},fatal:()=>{},trace:()=>{},child:()=>pino(),bindings:()=>({})}}',
      'thread-stream': 'data:text/javascript,export default class ThreadStream{}',
      'pino-std-serializers': 'data:text/javascript,export default {}',
      
      'tap': 'data:text/javascript,export const test = () => {}; export default { test: () => {} }',
      'tape': 'data:text/javascript,export default () => {}',
      'desm': 'data:text/javascript,export const join = () => ""; export default {}',
      'fastbench': 'data:text/javascript,export default () => {}',
      'pino-elasticsearch': 'data:text/javascript,export default {}',
      'why-is-node-running': 'data:text/javascript,export default () => {}',
    },
  },
};

export default nextConfig;
