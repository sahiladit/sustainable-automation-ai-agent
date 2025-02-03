import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

export default class EnergyModel {
    constructor() {
        this.genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genai.getGenerativeModel({ model: "gemini-pro" });
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
            return JSON.parse(text);
        } catch (error) {
            console.error("Decision error:", error);
            return { decision: "no", reason: "Error processing request" };
        }
    }
}