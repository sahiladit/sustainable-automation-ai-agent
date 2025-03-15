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

            return {
                decision: decisionData.decision,
                reason: decisionData.reason,
                dailySavedEnergy: `${dailySavedEnergy.toFixed(2)} watts`,
                yearlySavedEnergy: `${yearlySavedEnergy.toFixed(2)} watts`
            };
        } catch (error) {
            console.error("Decision error:", error);
            return { 
                decision: "no", 
                reason: "Error processing request", 
                dailySavedEnergy: "0 watts", 
                yearlySavedEnergy: "0 watts"
            };
        }
    }
}
