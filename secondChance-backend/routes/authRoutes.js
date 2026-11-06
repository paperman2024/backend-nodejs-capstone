const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db.js');
const pino = require('pino');
const logger = pino();

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;;

router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        const db = await connectToDatabase();
        const users = db.collection('users');

		const existingEmail = await users.findOne({email});
        if (existingEmail) {
            logger.error('Email is already registered');
            throw new Error("User already exists"); 
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

		const newUser = await users.insertOne({
            email,
            firstName,
            lastName,
            password: hash,
            createdAt: new Date()
        });

		const payload = {
            user: {
                id: newUser.insertedId,
            }
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

        logger.info("User successfully registered!");
        res.status(200).json({ authtoken, email });
    } catch (e) {
        logger.error(e);
         return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await connectToDatabase();
        const users = db.collection('users');

        const existingUser = await users.findOne({email});
        if (!existingUser) {
            logger.warning("Email is not registered!");
            return res.status(401).json({error: "Email is not registered!"})
        }    
        
        let result = await bcryptjs.compare(password, existingUser.password);
        if (!result) {
            logger.warning("Password does not match!");
            return res.status(401).json({error: "password incorrect"});
        }

        const userName = existingUser.firstName;
        const userEmail = existingUser.email;

        let payload = {
            user: {
                id: existingUser._id.toString(),
            }
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);

        return res.status(200).json({
            authtoken,
            email: userEmail,
            firstName: userName
        });
        
    } catch (e) {
        logger.error(e);
        return res.status(500).json({error: "Internal server error"});
    }
})

module.exports = router;
