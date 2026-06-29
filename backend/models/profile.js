const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  headline: { type: String },
  tagline: { type: String },
  topSkills: [String],
  uniqueValue: { type: String },
  lookingFor: { type: String },
  availableFrom: { type: String },
  linkedinMessage: { type: String },
  coldEmailIntro: { type: String },
  linkedin: { type: String },
  github: { type: String },
  email: { type: String },
  phone: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
