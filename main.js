import EnergyModel from './EnergyModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const usageData = process.argv.slice(2).map(Number);

    if (!usageData.length) {
        console.log("Please provide usage data as space-separated values");
        return;
    }

    const model = new EnergyModel();
    const decision = await model.shouldTurnOff(usageData);

    console.log("🔋 Energy Decision System 🔋");
    console.log("📊 Current Usage Pattern:", usageData);
    console.log("✅ Decision:", decision.decision.toUpperCase());
    console.log("⚡ Daily Energy Saved:", decision.dailySavedEnergy);
    console.log("🌍 Yearly Energy Saved:", decision.yearlySavedEnergy);
}

main().catch(console.error);
