const path = require('path');

module.exports = {
	entry: {
    worker: './src/worker.js',
    client_dedicated: './test/browser/dedicated.js',
    client_shared: './test/browser/shared.js'
  },
	output: {
		filename: '[name]_bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: { 
          presets: [ 
             [ 'es2015', { modules: false } ] 
          ],
          plugins: [require('babel-plugin-transform-object-rest-spread')] 
        }
      }
    ]
  }
};