const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  _id: { type: String },
  sequence_value: { type: Number, default: 0 },
});

export const Counter = mongoose.model('Counter', counterSchema);
