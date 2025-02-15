const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScholarshipSchema = new Schema({
  scholarship_name: { type: String, required: true },
  scholarship_amount: { type: Number },
  eligibility_criteria: { type: String },
  universities: [{ type: Schema.Types.ObjectId }]
});

module.exports = mongoose.model('Scholarship', ScholarshipSchema);
