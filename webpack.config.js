const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    'content/content': './src/content/index.js',
    'background/service-worker': './src/background/service-worker.js',
    'popup/popup': './src/popup/popup.js',
    'options/options': './src/options/options.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/options/options.html', to: 'options/options.html' },
        { from: 'src/content/ui/styles.css', to: 'content/styles.css' },
        { from: 'assets', to: 'assets' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
  },
  optimization: {
    minimize: true,
  },
  devtool: 'cheap-module-source-map',
};
