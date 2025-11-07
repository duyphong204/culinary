import mongoose from 'mongoose';

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

export default mongoose.model('Dish', dishSchema);
