// const mongoose = require('mongoose');

// const locationSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   lat: Number,
//   lng: Number,
//   category: String, // 'savory', 'sweet', 'vegan', 'indoor'
//   dish: String,
//   image: String, // Cloudinary URL
//   qrCode: String, // URL dẫn đến mô hình 3D
//   streamRoom: String, // Phòng livestream cho quán
//   reviews: [{ user: String, comment: String, rating: Number }],
//   weather: String
// });

// module.exports = mongoose.model('Location', locationSchema);

import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  lat: Number,
  lng: Number,
  category: String, // 'savory', 'sweet', 'vegan', 'indoor'
  images: [String], // Mảng URL hình
  menuItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }], // liên kết món
  qrCode: String,
  streamRoom: String,
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: String,
      rating: Number,
    },
  ],
  openingHours: { open: String, close: String },
  contactInfo: String,
  weather: String,
});

export default mongoose.model("Location", locationSchema);
