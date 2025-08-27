const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        "assert": require.resolve("assert"),
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser"),
        "path": require.resolve("path-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "util": require.resolve("util"),
        "url": require.resolve("url"),
        "querystring": require.resolve("querystring-es3"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        // Desactivar todos los módulos de Node.js que no funcionan en el navegador
        "module": false,
        "worker_threads": false,
        "child_process": false,
        "cluster": false,
        "dgram": false,
        "dns": false,
        "fs": false,
        "net": false,
        "readline": false,
        "repl": false,
        "tls": false,
        "tty": false,
        "v8": false,
        "vm": false,
        "zlib": false
      }
    },
    plugins: [
      new (require('webpack')).ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      })
    ]
  }
})