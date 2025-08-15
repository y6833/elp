const ModuleFederationPlugin = require('@module-federation/webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  
  devServer: {
    port: 3000,
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        // TODO: 配置远程模块
        // 格式: 'remoteName': 'remoteName@http://localhost:port/remoteEntry.js'
        // 例如: 'mfHeader': 'header@http://localhost:3001/remoteEntry.js'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
    
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],

  resolve: {
    extensions: ['.js', '.jsx'],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};