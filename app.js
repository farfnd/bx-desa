import express from 'express';
import bodyParser from 'body-parser';
import scraper from './modules/scraper.js';
import exports from './modules/exports.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Define the directory containing static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for the root path to serve an HTML file
app.get('/', (req, res) => {
    // Send the HTML file
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/search', async (req, res) => {
    const { query } = req.body;

    try {
        const places = await scraper.searchGoogleMaps(query);

        res.attachment('places.xlsx');
        res.sendFile(await exports.placesToExcel(places));
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/template', (req, res) => {
    res.sendFile('./exports/template.xlsm', { root: __dirname });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
