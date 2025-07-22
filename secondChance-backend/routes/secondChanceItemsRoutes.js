const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

// ✅ Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('oops something went wrong', e);
        next(e);
    }
});

// ✅ Add a new item (with image upload)
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        let secondChanceItem = req.body;

        // Get the last item to determine next id
        const lastItem = await collection.find().sort({ 'id': -1 }).limit(1).toArray();
        const nextId = lastItem.length > 0 ? parseInt(lastItem[0].id) + 1 : 1;
        secondChanceItem.id = nextId.toString();

        // Add timestamp
        secondChanceItem.date_added = Math.floor(new Date().getTime() / 1000);

        // Save image path if image uploaded
        if (req.file) {
            secondChanceItem.image = `/images/${req.file.filename}`;
        }

        const insertResult = await collection.insertOne(secondChanceItem);

        res.status(201).json(insertResult.ops[0]); // ops is for older MongoDB drivers; for newer use insertedId + fetch if needed
    } catch (e) {
        logger.error('Failed to add new item', e);
        next(e);
    }
});

// ✅ Get a single item by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id: id });

        if (!secondChanceItem) {
            return res.status(404).send("secondChanceItem not found");
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// ✅ Update an existing item
router.put('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const id = req.params.id;
        const existingItem = await collection.findOne({ id: id });

        if (!existingItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        const { category, condition, age_days, description } = req.body;
        const age_years = Number((age_days / 365).toFixed(1));
        const updatedAt = new Date();

        const updateFields = {
            category,
            condition,
            age_days,
            age_years,
            description,
            updatedAt
        };

        await collection.updateOne(
            { id: id },
            { $set: updateFields }
        );

        res.json({ message: `Item with id ${id} has been updated.` });
    } catch (e) {
        next(e);
    }
});

// ✅ Delete an existing item
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const id = req.params.id;
        const existingItem = await collection.findOne({ id: id });

        if (!existingItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        await collection.deleteOne({ id: id });

        res.json({ deleted: "success" });
    } catch (e) {
        next(e);
    }
});

module.exports = router;