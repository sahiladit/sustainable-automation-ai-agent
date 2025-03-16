import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

export default class EnergyModel {
    constructor() {
        this.genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genai.getGenerativeModel({ model: "gemini-2.0-flash" });
        this.thresholdPrompt = `Analyze this hourly energy consumption data (in watts) and decide if the appliance should be turned off. 
            Consider these factors:
            1. Current usage compared to daily average
            2. Peak hour patterns
            3. Energy saving potential
            4. User convenience factors
            
            Return ONLY JSON format: { "decision": "yes|no", "reason": "string" }`;
    }

    async shouldTurnOff(usageData) {
        try {
            const prompt = `${this.thresholdPrompt}\n\nUsage Data: ${JSON.stringify(usageData)}`;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const decisionData = JSON.parse(text);

            // Calculate daily energy savings if reduced by 15 minutes
            const avgHourlyUsage = usageData.reduce((sum, val) => sum + val, 0) / usageData.length; // Average hourly usage
            const dailySavedEnergy = avgHourlyUsage / 4; // Energy saved in 15 minutes
            const yearlySavedEnergy = dailySavedEnergy * 365; // Total yearly savings

            // Define max values for normalization
            const maxHistorical = 100; // Example max efficiency score
            const maxUsage = 50; // Example max usage frequency
            const maxPower = Math.max(...usageData, 1); // Max power from usage data, avoiding division by zero

            // Calculate EES for each power consumption value
            const eesScores = usageData.map(powerConsumption => {
                return this.calculateEES(75, 20, powerConsumption, maxHistorical, maxUsage, maxPower);
            });

            // Calculate the average EES score, ensuring it is not NaN
            const avgEES = eesScores.length > 0 ? 
                (eesScores.reduce((sum, val) => sum + val, 0) / eesScores.length).toFixed(2) : "0";

            return {
                decision: decisionData.decision,
                reason: decisionData.reason,
                dailySavedEnergy: `${dailySavedEnergy.toFixed(2)} watts`,
                yearlySavedEnergy: `${yearlySavedEnergy.toFixed(2)} watts`,
                energyEfficiencyScores: eesScores,
                averageEES: avgEES
            };
        } catch (error) {
            console.error("Decision error:", error);
            return { 
                decision: "no", 
                reason: "Error processing request", 
                dailySavedEnergy: "0 watts", 
                yearlySavedEnergy: "0 watts",
                energyEfficiencyScores: [],
                averageEES: "0"
            };
        }
    }

    calculateEES(historicalEfficiency, usageFrequency, powerConsumption, maxHistorical, maxUsage, maxPower, w1 = 0.4, w2 = 0.3, w3 = 0.3) {
        /**
         * Calculate the Energy Efficiency Score (EES) for an IoT device.
         */
        let normH = maxHistorical ? historicalEfficiency / maxHistorical : 0;
        let normU = maxUsage ? usageFrequency / maxUsage : 0;
        let normP = maxPower ? powerConsumption / maxPower : 0;

        let ees = (w1 * normH) + (w2 * normU) - (w3 * normP);
        return Math.max(0, Math.min(1, ees)); // Ensure it's between 0 and 1
    }
}
