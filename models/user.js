'use strict'

const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const Schema = mongoose.Schema
const enumerator = require('../middlewares/enumStructures')

const UserSchema = new Schema({
  userName: {
    type: String,
    unique: true,
    required: true,
    minlength: 5,
    maxlength: 50
  },
  firstName: { type: String, required: true, maxlength: 50 },
  lastName: { type: String, required: true, maxlength: 50 },
  role: { type: String, enum: enumerator.role, default: enumerator.role[1] },
  password: {
    type: String,
    select: false,
    required: true,
    minlength: 5,
    maxlength: 50
  },
  creation: { type: Date, default: Date.now() },
  donations: { type: Number, default: 0 },
  status: { type: String, default: enumerator.userStatus[1] }
})

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err)

    bcrypt.hash(this.password, salt, null, (err, hash) => {
      if (err) return next(err)
      this.password = hash
      next()
    })
  })
})

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch)
  })
}

module.exports = mongoose.model('User', UserSchema)
