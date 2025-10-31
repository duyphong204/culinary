const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ingredients: [String],
  price: Number,
  category: String,
  image: String, // cloudinary
  nutritionInfo: { calories: Number, protein: Number, fat: Number, carbs: Number },
  allergens: [String],
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
});

module.exports = mongoose.model('Dish', dishSchema);
