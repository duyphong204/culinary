// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }]
// });

// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user','chef','admin'], default: 'user' }, // Thêm role
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  profilePicture: String, // avatar
  preferences: { foodTypes: [String], allergens: [String] }, // sở thích cá nhân
});

module.exports = mongoose.model('User', userSchema);
