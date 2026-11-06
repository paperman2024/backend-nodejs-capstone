const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const pino = require('pino');
const logger = pino();

// Search for gifts
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        let query = {};

        if (req.query.name && req.query.name.trim() !== '') {
            query.name = { $regex: req.query.name, $options: "i" };
        }
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.condition) {
            query.condition = req.query.condition;
        }
        if (req.query.age_years) {
            const age = parseInt(req.query.age_years, 10);

            if (!isNaN(age)) {
            query.age_years = { $lte: age };
            }
        }
        const gifts = await collection.find(query).toArray();

        logger.info("Fetch successfull!")
        res.json(gifts);
    } catch (e) {
        logger.error(e);
        next(e);
    }
});

module.exports = router;
