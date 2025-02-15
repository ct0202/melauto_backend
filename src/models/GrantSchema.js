const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GrantSchema = new Schema({
  grant_name: { type: String, required: true },
  grant_amount: { type: Number },
  eligibility_criteria: { type: String },
  universities: [{ type: Schema.Types.ObjectId }]
});

module.exports = mongoose.model('Grant', GrantSchema);
