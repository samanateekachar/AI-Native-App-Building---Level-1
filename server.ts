import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Lazy-initialize Gemini API client to prevent startup crashes when GEMINI_API_KEY is not defined
let aiClient: GoogleGenAI | null = null;

function getGeminiHelper() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Secrets / environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser with increased limit to handle larger spreadsheets
  app.use(express.json({ limit: "15mb" }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Endpoint to generate insights using server-side Gemini 3.5 Flash
  app.post("/api/insights", async (req, res) => {
    try {
      const { kpis, regionalBreakdown, storeBreakdown, categoryBreakdown, activeFilters } = req.body;

      if (!kpis || !regionalBreakdown) {
        res.status(400).json({ error: "Missing required dashboard data to analyze." });
        return;
      }

      const ai = getGeminiHelper();

      const prompt = `
You are a Senior Retail Management Consultant analyzing weekly retail sales performance.
Below is the aggregated business intelligence data for a retail chain operating stores across multiple regions.

### CURRENT ACTIVE FILTERS
${JSON.stringify(activeFilters, null, 2)}

### OVERALL KEY PERFORMANCE INDICATORS (KPIs)
- Total Net Sales: $${Number(kpis.netSales || 0).toLocaleString()}
- Total Gross Sales: $${Number(kpis.grossSales || 0).toLocaleString()}
- Sales Target Achievement: ${Number(kpis.targetAchievement || 0).toFixed(1)}% (Target: $${Number(kpis.target || 0).toLocaleString()})
- Average Transaction Value (ATV): $${Number(kpis.atv || 0).toFixed(2)} (${Number(kpis.transactions || 0).toLocaleString()} Transactions total)
- Revenue Return Rate: ${Number(kpis.returnRate || 0).toFixed(2)}% (Total Returns: $${Number(kpis.returns || 0).toLocaleString()})
- Average Discount Rate: ${Number(kpis.discountRate || 0).toFixed(2)}% (Total Discounts: $${Number(kpis.discounts || 0).toLocaleString()})
- Total Stockout Incidents: ${Number(kpis.stockoutIncidents || 0)} incidents

### REGIONAL PERFORMANCE BREAKDOWN
${JSON.stringify(regionalBreakdown, null, 2)}

### PRODUCT CATEGORY ANALYSIS
${JSON.stringify(categoryBreakdown, null, 2)}

### UNDERPERFORMING STORES (MISSING TARGET)
${JSON.stringify(storeBreakdown?.filter((s: any) => s.achievementRate < 100).slice(0, 10), null, 2)}

### TOP PERFORMING STORES
${JSON.stringify(storeBreakdown?.filter((s: any) => s.achievementRate >= 100).slice(0, 5), null, 2)}

Based on this empirical sales data, write a comprehensive executive report containing:
1. **Executive Narrative**: A succinct 2-sentence performance summary (incorporating overall net sales and target achievements).
2. **Geographical Strengths & Weaknesses**: Highlight the best-performing and worst-performing regions or cities.
3. **Category Breakdown & Profit Leakage**: Identify categories with disproportionately high return rates or severe stockout incidents, explaining how they drain net revenue.
4. **Store-Level Target Gap**: Contrast top-performing stores with key underperformers missing target, quantifying are-level target gaps.
5. **Strategic Action Plan**: 4 concrete, data-grounded, actionable recommendations (e.g., inventory redistribution, discount controls, or promotion strategy) to capture lost margins.

Format your output in clean Markdown with professional, high-contrast structural headings, bold key figures, and clear lists. Keep the tone authoritative, executive, objective, and constructive. Do not make up any other store names or numbers outside of the ones provided.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ insights: response.text });
    } catch (error: any) {
      console.error("Gemini Insights API Error:", error);
      res.status(500).json({ 
        error: error.message || "An unexpected error occurred during AI analysis.",
        details: error.stack || ""
      });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Retail dashboard full-stack server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal Server Startup Error:", error);
});
