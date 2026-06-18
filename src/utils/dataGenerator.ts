import { StoreMasterRecord, WeeklySalesRecord, MergedSalesRecord } from "../types";

export const DEFAULT_STORES: StoreMasterRecord[] = [
  { storeId: "S01", storeName: "Boston Eastgate", region: "East", storeFormat: "Flagship", city: "Boston" },
  { storeId: "S02", storeName: "Chelsea Market Central", region: "East", storeFormat: "Express", city: "New York" },
  { storeId: "S03", storeName: "Philly Plaza", region: "East", storeFormat: "Standard", city: "Philadelphia" },
  { storeId: "S04", storeName: "Bayside Hub", region: "East", storeFormat: "Standard", city: "Portland" },
  
  { storeId: "S05", storeName: "Sunset Boulevard Standard", region: "West", storeFormat: "Standard", city: "Los Angeles" },
  { storeId: "S06", storeName: "Silicon District Flagship", region: "West", storeFormat: "Flagship", city: "San Jose" },
  { storeId: "S07", storeName: "Golden Gate Express", region: "West", storeFormat: "Express", city: "San Francisco" },
  { storeId: "S08", storeName: "Puget Sound Standard", region: "West", storeFormat: "Standard", city: "Seattle" },
  
  { storeId: "S09", storeName: "Loop Hypermarket", region: "Midwest", storeFormat: "Hypermarket", city: "Chicago" },
  { storeId: "S10", storeName: "Motor City Express", region: "Midwest", storeFormat: "Express", city: "Detroit" },
  { storeId: "S11", storeName: "Twin Cities Hub", region: "Midwest", storeFormat: "Standard", city: "Minneapolis" },
  { storeId: "S12", storeName: "Archway Plaza", region: "Midwest", storeFormat: "Standard", city: "St. Louis" },
  
  { storeId: "S13", storeName: "Bayou City Standard", region: "South", storeFormat: "Standard", city: "Houston" },
  { storeId: "S14", storeName: "Atlanta Metro Hub", region: "South", storeFormat: "Standard", city: "Atlanta" },
  { storeId: "S15", storeName: "Queen City Express", region: "South", storeFormat: "Express", city: "Charlotte" },
  { storeId: "S16", storeName: "Crescent City Hypermarket", region: "South", storeFormat: "Hypermarket", city: "New Orleans" },
  
  { storeId: "S17", storeName: "Valley Sun Flagship", region: "Southwest", storeFormat: "Flagship", city: "Phoenix" },
  { storeId: "S18", storeName: "Riverwalk Market", region: "Southwest", storeFormat: "Standard", city: "San Antonio" },
  { storeId: "S19", storeName: "Alamo Plaza Standard", region: "Southwest", storeFormat: "Standard", city: "Dallas" },
  { storeId: "S20", storeName: "Capital Heights Express", region: "Southwest", storeFormat: "Express", city: "Austin" }
];

export const CATEGORIES = [
  "Apparel",
  "Electronics",
  "Home & Kitchen",
  "Beauty & Personal Care",
  "Grocery",
  "Toys & Games",
  "Automotive",
  "Sports & Outdoors"
];

export function generateSyntheticWeeklySales(stores: StoreMasterRecord[]): WeeklySalesRecord[] {
  const sales: WeeklySalesRecord[] = [];
  
  const baseSalesByCategory: Record<string, { avgPrice: number; baseSales: number; baseTransactions: number }> = {
    "Grocery": { avgPrice: 8, baseSales: 8000, baseTransactions: 1000 },
    "Electronics": { avgPrice: 150, baseSales: 16000, baseTransactions: 110 },
    "Apparel": { avgPrice: 45, baseSales: 9500, baseTransactions: 210 },
    "Home & Kitchen": { avgPrice: 55, baseSales: 11000, baseTransactions: 200 },
    "Beauty & Personal Care": { avgPrice: 24, baseSales: 4500, baseTransactions: 190 },
    "Toys & Games": { avgPrice: 20, baseSales: 3500, baseTransactions: 175 },
    "Automotive": { avgPrice: 85, baseSales: 4000, baseTransactions: 50 },
    "Sports & Outdoors": { avgPrice: 65, baseSales: 6000, baseTransactions: 90 }
  };

  const storeMultiplier: Record<string, number> = {
    // Flagships
    "S01": 1.4, "S06": 1.5, "S17": 1.3,
    // Hypermarkets
    "S09": 1.7, "S16": 1.6,
    // Express Stores
    "S02": 0.5, "S07": 0.6, "S10": 0.4, "S15": 0.5, "S20": 0.45,
    // Standards are around 0.9 - 1.1
    "S03": 0.95, "S04": 0.85, "S05": 1.05, "S08": 1.0, "S11": 0.9, "S12": 0.88, "S13": 1.1, "S14": 1.0, "S18": 0.92, "S19": 1.08
  };

  for (let w = 1; w <= 12; w++) {
    const weekStr = `Week ${w}`;
    // Introduce seasonality multiplier over the weeks
    // Week 1-3 start normal, Week 4-6 dipped, Week 7-9 high, Week 10-12 highest (holiday peak)
    let weekSeasonalFactor = 1.0;
    if (w >= 4 && w <= 6) weekSeasonalFactor = 0.92;
    if (w >= 7 && w <= 9) weekSeasonalFactor = 1.08;
    if (w >= 10 && w <= 12) weekSeasonalFactor = 1.18;

    for (const store of stores) {
      const sMult = storeMultiplier[store.storeId] || 1.0;
      
      for (const cat of CATEGORIES) {
        const catConfig = baseSalesByCategory[cat];
        
        // Random variance per record
        const randVariance = 0.85 + Math.random() * 0.3; // ±15%
        
        const targetSalesVal = Math.round(catConfig.baseSales * sMult * weekSeasonalFactor);
        const grossSalesVal = Math.round(targetSalesVal * randVariance);
        
        // Discount rate varies between 3% and 15% depending on category (Electronics & Apparel higher)
        let discountBase = 0.05;
        if (cat === "Apparel") discountBase = 0.12;
        if (cat === "Electronics") discountBase = 0.08;
        const discountAmountVal = Math.round(grossSalesVal * (discountBase + Math.random() * 0.05));
        
        // Return rate varies between 1% and 10% depending on category (Apparel & Electronics are highly returned, Grocery almost zero)
        let returnBase = 0.02;
        if (cat === "Apparel") returnBase = 0.08;
        if (cat === "Electronics") returnBase = 0.05;
        if (cat === "Grocery") returnBase = 0.002;
        const returnAmountVal = Math.round(grossSalesVal * (returnBase + Math.random() * 0.04));
        
        // Net Sales
        const netSalesVal = Math.max(0, grossSalesVal - discountAmountVal - returnAmountVal);
        
        // Transactions count
        const transactionsVal = Math.max(1, Math.round(catConfig.baseTransactions * sMult * weekSeasonalFactor * (0.9 + Math.random() * 0.2)));
        
        // Stockout incidents: Higher when sales heavily outperform the target (e.g. stock level dropped below margin)
        // If randVariance is high, stockout is likely.
        let stockouts = 0;
        if (randVariance > 1.12) {
          stockouts = Math.floor(Math.random() * 3) + 1;
        } else if (Math.random() < 0.1) {
          stockouts = 1;
        }
        
        // Foot traffic
        const footfallVal = Math.round(transactionsVal * (1.8 + Math.random() * 2.5));
        
        // Customer ratings centered around 4.2
        const ratingVal = Math.round((3.6 + Math.random() * 1.4) * 10) / 10;
        
        // Inventory variables
        const unitSalesVal = Math.round(netSalesVal / catConfig.avgPrice);
        const stockLevelVal = Math.round(unitSalesVal * (1.2 + Math.random() * 3.0));
        const inventoryCostVal = Math.round(stockLevelVal * catConfig.avgPrice * 0.6);
        
        // Cost of Goods Sold (typically 55-68% of sales value)
        const cogsPercent = 0.55 + Math.random() * 0.12;
        const cogsVal = Math.round(netSalesVal * cogsPercent);
        const marginVal = netSalesVal - cogsVal;
        
        const promotion = (Math.random() < 0.25 || (w === 11 || w === 12)) ? "Yes" : "No";
        const onlinePercent = (cat === "Electronics" || cat === "Apparel") ? 0.35 + Math.random() * 0.2 : 0.05 + Math.random() * 0.15;
        const onlineOrdersVal = Math.round(transactionsVal * onlinePercent);

        sales.push({
          week: weekStr,
          storeId: store.storeId,
          category: cat,
          grossSales: grossSalesVal,
          discountAmount: discountAmountVal,
          returnAmount: returnAmountVal,
          netSales: netSalesVal,
          transactions: transactionsVal,
          targetSales: targetSalesVal,
          stockoutIncidents: stockouts,
          unitSales: unitSalesVal,
          footfall: footfallVal,
          customerRating: ratingVal,
          stockLevel: stockLevelVal,
          inventoryCost: inventoryCostVal,
          cogs: cogsVal,
          promotionFlag: promotion,
          onlineOrders: onlineOrdersVal,
          grossMargin: marginVal
        });
      }
    }
  }

  return sales;
}

export function getMergedSalesRecords(sales: WeeklySalesRecord[], stores: StoreMasterRecord[]): MergedSalesRecord[] {
  const storeMap = new Map<string, StoreMasterRecord>();
  for (const s of stores) {
    storeMap.set(s.storeId, s);
  }
  
  return sales.map(record => {
    const s = storeMap.get(record.storeId);
    return {
      ...record,
      storeName: s ? s.storeName : `Store ${record.storeId}`,
      region: s ? s.region : "Unknown",
      storeFormat: s ? s.storeFormat : "Standard",
      city: s ? s.city : "Unknown"
    };
  });
}
