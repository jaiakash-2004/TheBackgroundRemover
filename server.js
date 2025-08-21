import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... other imports and code ...

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ... your existing app.post route ...



// IMPORTANT: Replace with your actual ClipDrop API key
const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;

// Use CORS to allow requests from your frontend
app.use(cors());

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.post('/api/remove-background', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No image file provided.');
        }

        const form = new FormData();
        // Append the image file from the request buffer
        form.append('image_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const clipdropResponse = await fetch("https://clipdrop-api.co/remove-background/v1", {
            method: 'POST',
            headers: {
                'x-api-key': CLIPDROP_API_KEY,
            },
            body: form,
        });

        if (!clipdropResponse.ok) {
            const errorText = await clipdropResponse.text();
            console.error('ClipDrop API error:', errorText);
            return res.status(clipdropResponse.status).send(`ClipDrop API error: ${errorText}`);
        }

        // Send the processed image back to the client
        res.setHeader('Content-Type', clipdropResponse.headers.get('content-type'));
        clipdropResponse.body.pipe(res);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('An internal server error occurred.');
    }
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});