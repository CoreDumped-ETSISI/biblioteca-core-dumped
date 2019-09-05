'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const enumerator = require('../middlewares/enumStructures')

const BookSchema = new Schema({
  title: { type: String, required: true },
  sha1: { type: String, required: true, unique: true },
  filename: { type: String, required: true, unique: true },
  author: { type: String },
  synopsis: { type: String },
  publishDate: { type: Number },
  tags: { type: [String] },
  language: { type: String },
  publisher: { type: String },
  status: { type: String, enum: enumerator.bookStatus, required: true, default: 'pending' },
  uploader: { type: Schema.Types.ObjectId, ref: 'User' },
  format: { type: String, enum: enumerator.formats },
  imageFormat: { type: String },
  size: { type: Number } // Unit: bytes
})

module.exports = mongoose.model('Book', BookSchema)
