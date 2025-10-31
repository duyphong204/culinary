const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');

// Lấy thông tin dish theo ID
router.get('/:id', async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    res.json(dish);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách dishes theo location
router.get('/location/:locationId', async (req, res) => {
  try {
    const dishes = await Dish.find({ locationId: req.params.locationId });
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
