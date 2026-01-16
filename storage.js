// server/storage.js
import fs from 'fs';
import path from 'path';

// Path to store the vouches data
const filePath = path.resolve('./vouches.json');

// Load existing data if it exists
let data = {};
if (fs.existsSync(filePath)) {
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error('Error reading vouches.json:', err);
    data = {};
  }
}

// Create a Map from the stored data
export const vouchData = new Map(Object.entries(data));

// Function to save the Map back to JSON
export function saveVouches() {
  try {
    const obj = Object.fromEntries(vouchData);
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error('Error writing vouches.json:', err);
  }
}
