import { createObjectCsvWriter } from 'csv-writer';
import { convertCsvToXlsx } from "@aternus/csv-to-xlsx";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportsFolder = path.join(__dirname, '../exports');
// Ensure that the exports folder exists, create it if it doesn't
if (!fs.existsSync(exportsFolder)) {
    fs.mkdirSync(exportsFolder);
}

async function placesToCsv(places) {
    try {
        const csvFilePath = path.join(exportsFolder, 'places.csv');

        if (places && places.length > 0) {
            const csvWriter = createObjectCsvWriter({
                path: csvFilePath,
                header: [
                    { id: 'index', title: 'Index' },
                    { id: 'storeName', title: 'Store Name' },
                    { id: 'address', title: 'Address' },
                    { id: 'category', title: 'Category' },
                    { id: 'phone', title: 'Phone' },
                    { id: 'googleUrl', title: 'Google URL' },
                    { id: 'bizWebsite', title: 'Business Website' },
                    { id: 'ratingText', title: 'Rating Text' },
                    { id: 'stars', title: 'Stars' },
                    { id: 'numberOfReviews', title: 'Number of Reviews' },
                ],
            });

            // Write the places data to the CSV file
            await csvWriter.writeRecords(places);

            console.log('CSV file created successfully.');

            return csvFilePath;
        } else {
            console.log('No places found or places array is empty.');
        }
    } catch (error) {
        console.log('Error in placesToCsv:', error.message);
    }
}

async function placesToExcel(places) {
    try {
        const csvFilePath = await placesToCsv(places);
        const excelFilePath = path.join(exportsFolder, 'places.xlsx');

        if (csvFilePath) {
            // Convert CSV to Excel
            convertCsvToXlsx(csvFilePath, excelFilePath, { overwrite: true });

            console.log('Excel file created successfully.');

            return excelFilePath;
        } else {
            console.log('Error converting CSV to Excel.');
        }
    } catch (error) {
        console.log('Error in placesToExcel:', error.message);
    }
}

export default {
    placesToCsv,
    placesToExcel,
};
