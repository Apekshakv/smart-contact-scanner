import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface Vulnerability {
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  title: string;
  description: string;
  recommendation: string;
  lineRange?: string;
  vulnerabilityType: string;
}

export interface ScanResult {
  summary: string;
  vulnerabilities: Vulnerability[];
  overallScore: number; // 0-100, where 100 is secure
}

export async function scanSmartContract(code: string): Promise<ScanResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `You are an expert Smart Contract Security Auditor. Analyze the following Solidity code for vulnerabilities. 
        Focus on:
        - Reentrancy
        - Integer Overflow/Underflow (if <0.8.0)
        - Access Control (Missing onlyOwner, etc.)
        - Front-running
        - Denial of Service
        - Logic Errors
        - Gas Optimization
        - Unchecked Return Values
        - Delegatecall to Untrusted Contracts
        
        Code to analyze:
        \`\`\`solidity
        ${code}
        \`\`\`
        `,
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A brief overview of the security posture of the contract.",
          },
          overallScore: {
            type: Type.NUMBER,
            description: "A security score from 0 to 100.",
          },
          vulnerabilities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: {
                  type: Type.STRING,
                  enum: ["Critical", "High", "Medium", "Low", "Info"],
                },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                lineRange: { type: Type.STRING, description: "e.g., '12-15'" },
                vulnerabilityType: { type: Type.STRING },
              },
              required: ["severity", "title", "description", "recommendation", "vulnerabilityType"],
            },
          },
        },
        required: ["summary", "overallScore", "vulnerabilities"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as ScanResult;
}