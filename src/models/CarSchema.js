const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CarSchema = new Schema({
    brand: { type: String, required: true }, // Марка и модель
    model: { type: String, required: true },
    year: { type: String, required: true }, // Год выпуска
    mileage: { type: String, required: true }, // Пробег в км
    price: { type: String, required: true }, // Цена в валюте
    fuelType: { type: String, required: true }, // Тип топлива
    condition: { type: String, enum: ['new', 'used'], required: true },
    images: [{ type: String, required: true }],
}, { timestamps: true });

module.exports = mongoose.model('Car', CarSchema);