const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const Image = require('../models/Image');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/uploads');
	},
	filename: function(req, file, cb) {
		const extension = file.mimetype.split('/')[1];
		cb(null, Date.now() + '.' + extension);
	}
});

const upload = multer({ storage: storage });

router.get('/', (req, res) => {
	Image.find({})
		.populate('author', 'username')
		.sort({ createdAt: -1 })
		.then(data => {
			res.send(data);
		})
		.catch(function(err) {
			res.status(500).send(err);
		});
});

router.post('/', auth.required, upload.any(), (req, res) => {
	let path = req.files[0].path.replace(/\\/g, '/');
	path = path.split('/');
	path.shift();
	path = path.join('/');

	Image.create({
		description: req.body.description,
		path: path,
		tags: req.body.tags.split(','),
		author: req.user.id
	})
		.then(data => res.send(data))
		.catch(function(err) {
			res.status(422).send(err.message);
		});
});

router.get('/:id', (req, res) => {
	console.log(req.params.id);
	Image.findById(req.params.id).populate('comments').then(data => {
		console.log(data);
		res.send(data);
	});
});

router.delete('/:id', auth.required, (req, res) => {
	Image.findByIdAndRemove(req.params.id).then(data => res.send(data));
});

router.patch('/:id', auth.required, upload.any(), (req, res, next) => {
	Image.findById(req.body.id)
		.then(image => {
			if (req.body.description) {
				image.description = req.body.description;
			}

			if (req.body.tags) {
				image.tags = req.body.tags;
			}

			if (req.files.length > 0) {
				let path = req.files[0].path;
				path = path.split('/');
				path.shift();
				path = path.join('/');
				image.path = path;
			}

			return image.save();
		})
		.then(image => {
			res.send(image);
		})
		.catch(e => next(e));
});

router.post('/:id/comments/', auth.required, (req, res, next) => {
	let image;
	Image.findById(req.params.id)
		.then(data => {
			image = data;
			return Comment.create({
				text: req.body.text,
				Image: data
			});
		})
		.then(data => {
			image.comments.unshift(data);
			image.save();
			res.send(data);
		})
		.catch(e => next(e));
	//	Image.findById(req.params.id).then((data) => res.send(data));
});

module.exports = router;
