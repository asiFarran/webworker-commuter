const path = require('path');

module.exports = {
	entry: './src/worker.js',
	output: {
		filename: 'worker_bundle.js',
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
  },
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist'
	},
	plugins: []
};