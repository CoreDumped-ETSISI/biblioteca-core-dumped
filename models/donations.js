const mongoose = require('mongoose');
const enumerator = require('../middlewares/enumStructures');

const { Schema } = mongoose;

const DonationSchema = new Schema({
  quantity: { type: Number, required: true },
  donationDate: { type: Date, default: Date.now() },
});

module.exports = mongoose.model(
  enumerator.modelsName.donation,
  DonationSchema,
);
