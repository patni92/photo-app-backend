const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const mongoDB = 'mongodb://127.0.0.1/my_database';
var _ = require('lodash');
const Comment = require('./models/Comment');
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

app.use(require('./routes'));

app.use(function(err, req, res, next) {
	let message = _.get(err, 'errors.text.message') || err.message;
	res.status(err.status || 500);
	res.json({
		errors: {
			message
		}
	});
});

app.listen(5000, () => console.log('Example app listening on port 5000!'));
