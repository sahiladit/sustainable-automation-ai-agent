import EnergyModel from './EnergyModel.js';
import dotenv from 'dotenv';
import Papa from 'papaparse';
import fs from 'fs';

dotenv.config();

async function processEnergyData() {
    return new Promise((resolve, reject) => {
        const usageData = [];

        // Read the CSV file using fs
        fs.readFile('./usage_data.csv', 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading CSV file:", err.message);
                reject(new Error("Error reading CSV file: " + err.message));
                return;
            }

            // Parse the CSV data
            Papa.parse(data, {
                header: true,
                complete: (results) => {
                    console.log('Parsed CSV Results:', results.data);
                    results.data.forEach(row => {
                        const energy = Number(row.Energy_Usage); // Ensure this key matches your CSV header
                        if (!isNaN(energy) && energy > 0) {
                            usageData.push(energy);
                        }
                    });

                    console.log('Usage Data:', usageData);

                    if (!usageData.length) {
                        reject(new Error("No valid usage data found in the CSV file"));
                        return;
                    }

                    const model = new EnergyModel();
                    model.shouldTurnOff(usageData).then(decision => {
                        const energyData = {
                            usagePattern: usageData.join(", "),
                            decision: decision.decision.toUpperCase(),
                            dailyEnergySaved: decision.dailySavedEnergy,
                            yearlyEnergySaved: decision.yearlySavedEnergy
                        };
                        console.log('Energy Data:', energyData);
                        resolve(energyData);
                    }).catch(error => {
                        console.error("Error in model decision:", error);
                        reject(error);
                    });
                },
                error: (error) => {
                    console.error('CSV Parsing Error:', error);
                    reject(error);
                }
            });
        });
    });
}

// Export the function for use in lr.html
export { processEnergyData };
