const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    module: {
        rules: [
            {
                test: /\.css$/, // Use regex to match .css files
                use: ['style-loader', 'css-loader'], // Loaders to process CSS
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: "asset/resource"

              },
        ],
    },
  plugins: [
    // Load environment variables from the .env file
    new Dotenv(),
    new HtmlWebpackPlugin({
      inject: false,
      template: './index.html',

      // Pass the full url with the key!
      publicUrl: process.env.PUBLIC_URL,
    })
  ],
};
