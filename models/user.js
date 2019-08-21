const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const enumerator = require('../middlewares/enumStructures');

const { Schema } = mongoose;

const UserSchema = new Schema({
  userName: {
    type: String,
    unique: true,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  firstName: { type: String, required: true, maxlength: 50 },
  lastName: { type: String, required: true, maxlength: 50 },
  role: { type: String, enum: enumerator.role, default: enumerator.role[1] },
  password: {
    type: String,
    select: false,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  creation: { type: Date, default: Date.now() },
  donations: {
    money: [
      {
        _id: false,
        type: Schema.Types.ObjectId,
        ref: enumerator.modelsName.donation,
      },
    ],
    books: [
      {
        _id: false,
        type: Schema.Types.ObjectId,
        ref: enumerator.modelsName.book,
      },
    ],
  },
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(this.password, salt, null, (err2, hash) => {
      if (err2) return next(err2);
      this.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

module.exports = mongoose.model(
  enumerator.modelsName.user,
  UserSchema,
);
