const validateLogin = require("../validations/login");
const validateSignup = require("../validations/signup");
const User = require("../models/User");
const Image = require("../models/Image");
const Comment = require("../models/Comment");

exports.read = (req, res, next) => {
  User.find({})
    .then(user => res.send(user))
    .catch(next);
};

exports.create = (req, res, next) => {
  const user = new User();
  const { errors, isValid } = validateSignup(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  user.username = req.body.username;
  user.email = req.body.email;
  user.setPassword(req.body.password);

  user
    .save()
    .then(function(user) {
      return res.json({
        user
      });
    })
    .catch(next);
};

exports.login = (req, res, next) => {
  let dataObj = Object.assign(
    {
      password: "",
      username: ""
    },
    req.body
  );
  const { errors, isValid } = validateLogin(dataObj);

  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.username }]
  })
    .select("hash salt username email profileImage")
    .then(user => {
      if (!user) {
        return res.status(401).send({ password: "Wrong password or username" });
      }
      if (user.validPassword(req.body.password)) {
        return res.send("Bearer " + user.generateJWT());
      } else {
        return res.status(401).send("Wrong password or username");
      }
    })
    .catch(next);
};

exports.updateById = (req, res, next) => {
  User.findById(req.params.userId)
    .then(user => {
      let filename = null;
      if (req.file.filename) {
        filename = "/uploads/" + req.file.filename;
      }

      user.profileImage = filename;
      user.country = req.body.country;
      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      user.biography = req.body.biography;

      user
        .save()
        .then(user => {
          res.send(user);
        })
        .catch(e => next(e));
    })
    .catch(e => next(e));
};

exports.readStats = (req, res, next) => {
  Promise.all([
    Image.countDocuments({
      author: req.params.userId
    }),
    Comment.countDocuments({
      author: req.params.userId
    }),
    User.findById(req.params.userId)
  ])
    .then(function(values) {
      res.send({
        imageCount: values[0],
        commentCount: values[1],
        joined: values[2].createdAt,
        userId: values[2]._id
      });
    })
    .catch(e => next(e));
};

exports.deleteById = (req, res, next) => {
  User.findById(req.params.userId)
    .then(user => {
      return user.remove();
    })
    .then(res.sendStatus(200))
    .catch(e => next(e));
};
