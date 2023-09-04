const Dotenv = require('dotenv-webpack');
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
                use: [
                  {
                    loader: 'file-loader',
                  },
                ],
              },
        ],
    },
  plugins: [
    // Load environment variables from the .env file
    new Dotenv(),
  ],
};
