const mongoose = require('mongoose');
const enumerator = require('../middlewares/enumStructures');

const { Schema } = mongoose;

const BookSchema = new Schema({
  title: { type: String, required: true },
  sha1: { type: String, required: true, unique: true },
  filename: { type: String, required: true, unique: true },
  author: { type: String },
  category: { type: String }, // , required: true },
  synopsis: { type: String },
  publishDate: { type: Date },
  tags: { type: Array },
  language: { type: String },
  publisher: { type: String },
  pageNumber: { type: Number },
  index: { type: String },
  status: { type: String, enum: enumerator.bookStatus, required: true },
  uploader: { type: Schema.Types.ObjectId, ref: enumerator.modelsName.user },
  format: { type: String, enum: enumerator.formats },
  size: { type: Number }, // Unit: bytes
});

module.exports = mongoose.model(
  enumerator.modelsName.book,
  BookSchema,
);
