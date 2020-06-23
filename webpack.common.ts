import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const commonConfig: webpack.Configuration = {
  entry: './src/index.ts',

  resolve: {
    extensions: ['.ts', '.tsx', '.jsx', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: ['ts-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
};

export { commonConfig };
