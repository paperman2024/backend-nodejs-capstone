const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db.js');
const logger = require('../logger.js');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;;

router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();
        // Task 2: Access MongoDB `users` collection
        const users = db.collection('users');
        // Task 3: Check if user credentials already exists in the database and throw an error if they do
		const existingEmail = await users.findOne({email});
        
        if (existingEmail) {
            logger.error('Email is already registered');
            throw new Error("User already exists"); 
        }
        // Task 4: Create a hash to encrypt the password so that it is not readable in the database
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        // Task 5: Insert the user into the database
		const newUser = await users.insertOne({
            email,
            firstName,
            lastName,
            password: hash,
            createdAt: new Date()
        });

        // Task 6: Create JWT authentication if passwords match with user._id as payload
		const payload = {
            user: {
                id: newUser.insertedId,
            }
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        // Task 7: Log the successful registration using the logger
		if (authtoken) {
            logger.info("User successfully registered!");
        }


        // Task 8: Return the user email and the token as a JSON
        res.status(200).json({ authtoken, email });
    } catch (e) {
         return res.status(500).send('Internal server error');
    }
});

module.exports = router;
