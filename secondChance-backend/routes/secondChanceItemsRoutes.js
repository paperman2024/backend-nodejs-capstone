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
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        //Step 2: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 2: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 2: task 3 - insert code here
        const secondChanceItems = await collection.find({}).toArray();
        //Step 2: task 4 - insert code here
        res.json(secondChanceItems);       
    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async(req, res,next) => {
    try {

        //Step 3: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 3: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 3: task 3 - insert code here
        let newItem = req.body;
        //Step 3: task 4 - insert code here
        const result = await collection.findOne({}, { sort: { id: -1 } });
        newItem.id = (parseInt(result?.id ?? "0") + 1).toString();

        //Step 3: task 5 - insert code here
        newItem.date_added = Math.floor(new Date().getTime() / 1000);

        await collection.insertOne(newItem);

        router.post

        res.status(201).json(newItem);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        //Step 4: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 4: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 4: task 3 - insert code here
        const item = await collection.findOne({ id })
        //Step 4: task 4 - insert code here
        if (!item) return res.status(404).send("secondChanceItem not found");

        res.json(item);
    } catch (e) {
        next(e);
    }
});

// Update and existing item
router.put('/:id', async(req, res,next) => {
    const { id } = req.params;
    try {
        //Step 4: task 1 - insert code here
        const db = await connectToDatabase();

        //Step 4: task 2 - insert code here
        const collection = db.collection("secondChanceItems");

        //Step 5: task 3 - insert code here
        const item = await collection.findOne({ id })
        if(!item) res.status(404).send("secondChanceItem not found");

        //Step 5: task 4 - insert code here
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

        //Step 5: task 5 - insert code here
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
        //Step 6: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 6: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 6: task 3 - insert code here
        const oldItem = collection.findOne({ id })
        if(!oldItem) {
            logger.error('secondChanceItem not found');
            res.status(404).json({error: "secondChanceItem doesnt exist"});
        }
        //Step 6: task 4 - insert code here
        collection.deleteOne({id: req.params.id});
        res.json({"deleted":"success"});

    } catch (e) {
        next(e);
    }
});

module.exports = router;
