// server.js

const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Use environment variable for the API key
const API_KEY = process.env.CLIPDROP_API_KEY;

// Use a simple memory storage for uploaded images
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

// Serve the HTML file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/remove-background', upload.single('image_file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        const form = new FormData();
        form.append('image_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Make the API request to ClipDrop
        const clipdropResponse = await fetch('https://clipdrop-api.co/remove-background/v1', {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
            },
            body: form,
        });

        // Log the credit information from the response headers
        const remainingCredits = clipdropResponse.headers.get('x-remaining-credits');
        const consumedCredits = clipdropResponse.headers.get('x-credits-consumed');
        console.log(`Credits Remaining: ${remainingCredits}`);
        console.log(`Credits Consumed by this request: ${consumedCredits}`);

        if (clipdropResponse.ok) {
            const imageBuffer = await clipdropResponse.buffer();
            res.setHeader('Content-Type', 'image/png');
            res.send(imageBuffer);
        } else {
            // Handle API errors
            const errorText = await clipdropResponse.text();
            console.error('ClipDrop API Error:', errorText);
            if (clipdropResponse.status === 402) {
                return res.status(402).json({ error: 'Credits exhausted. Please update the API key or purchase more credits.' });
            }
            res.status(clipdropResponse.status).json({ error: 'Failed to process image.' });
        }

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});