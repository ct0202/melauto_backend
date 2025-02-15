const multer = require('multer');

const express = require('express');
const router = express.Router();
const universityController = require('../controllers/carController');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Create a new university
router.post('/', upload.array('files', 10), universityController.createUniversity);

// Get all universities
router.get('/', universityController.getAllUniversities);

// Get a university by ID
router.get('/:id', universityController.getUniversityById);

// Update a university by ID
router.put('/:id', upload.array('files', 10), universityController.updateUniversity);

// Delete a university by ID
router.delete('/:id', universityController.deleteUniversity);

module.exports = router;
