const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const User = require("../models/User");
const Dish = require("../models/Dish");
const axios = require("axios");
const auth = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

// OpenWeather API
const getWeather = async (lat, lng) => {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
  );
  return res.data.weather[0].main.toLowerCase(); // sunny, rain, clouds
};

// Lấy tất cả locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find()
      .populate("reviews.user")
      .populate("menuItems");
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo Location mới (cập nhật weather tự động)
router.post("/", async (req, res) => {
  try {
    const weather = await getWeather(req.body.lat, req.body.lng);
    const location = new Location({ ...req.body, weather });
    const newLocation = await location.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Gợi ý lộ trình
router.get("/plan", async (req, res) => {
  try {
    const { category, time, lat, lng, weather } = req.query;
    let locations = await Location.find({ category });
    if (weather === "rain")
      locations = locations.filter((l) => l.category === "indoor");
    locations.sort((a, b) => a.lat - b.lat); // demo simple sort
    const maxLocations = Math.floor(time / 2);
    res.json(locations.slice(0, maxLocations));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy thời tiết theo vị trí
router.get("/weather/:lat/:lng", async (req, res) => {
  try {
    const weather = await getWeather(req.params.lat, req.params.lng);
    res.json({ weather });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm review
router.post("/review/:id", auth, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    location.reviews.push({ ...req.body, user: req.user.id });
    await location.save();
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm favorite
router.post("/favorite", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.favorites.includes(req.body.locationId)) {
      user.favorites.push(req.body.locationId);
      await user.save();
    }
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Nhận diện món ăn (HuggingFace demo)
router.post("/recognize", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
      { inputs: imageUrl },
      {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
      }
    );
    const labels = response.data.map((l) => l.label.toLowerCase());
    const dishName =
      labels.find((label) => ["pho", "banh mi", "com tam"].includes(label)) ||
      "unknown";
    const locations = await Location.find({ dish: dishName });
    res.json({ dish: dishName, locations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tham gia livestream
router.post("/join-stream", async (req, res) => {
  try {
    const { roomId } = req.body;
    const location = await Location.findOne({ streamRoom: roomId });
    if (!location)
      return res
        .status(404)
        .json({ message: "Phòng livestream không tồn tại" });
    res.json({
      message: `Đã tham gia phòng ${roomId}`,
      roomId: location.streamRoom,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy info livestream
router.get("/livestream/:roomId", async (req, res) => {
  try {
    const location = await Location.findOne({ streamRoom: req.params.roomId });
    if (!location)
      return res
        .status(404)
        .json({ message: "Phòng livestream không tồn tại" });
    res.json({ roomId: location.streamRoom, locationName: location.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload ảnh
router.post("/upload", async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.body.image, {
      folder: "culinary_hub",
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
