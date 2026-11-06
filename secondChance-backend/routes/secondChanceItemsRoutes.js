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


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);       
    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        let newItem = req.body;

        const result = await collection.findOne({}, { sort: { id: -1 } });

        newItem.id = (parseInt(result?.id ?? "0") + 1).toString();
        newItem.date_added = Math.floor(new Date().getTime() / 1000);

        await collection.insertOne(newItem);
        router.post
        logger.info("Item Uploaded.")
        res.status(201).json(newItem);
    } catch (e) {
        logger.error("Item Upload failed.")
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const item = await collection.findOne({ id })
        if (!item) {
            logger.error("item not found")
            return res.status(404).send("secondChanceItem not found");
        }

        res.json(item);
    } catch (e) {
        next(e);
    }
});

// Update and existing item
router.put('/:id', async(req, res,next) => {
    const { id } = req.params;
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const item = await collection.findOne({ id })
        if(!item) res.status(404).send("secondChanceItem not found");
        const updatedItem = {
            ...item,
            ...req.body,
            age_years: Number((req.body.age_days / 365).toFixed(1)),
            updatedAt: new Date()
        };

        const updatepreloveItem = await collection.updateOne(
            { id },
            { $set: updatedItem },
            { returnDocument: 'after' }
        );

        if(updatepreloveItem) {
            res.json({"uploaded":"success"});
        } else {
            res.json({"uploaded":"failed"})
        }

    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    const { id } = req.params;
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const oldItem = collection.findOne({ id })
        if(!oldItem) {
            logger.error('secondChanceItem not found');
            res.status(404).json({error: "secondChanceItem doesnt exist"});
        }
        collection.deleteOne({id: req.params.id});
        res.json({"deleted":"success"});

    } catch (e) {
        next(e);
    }
});

module.exports = router;
