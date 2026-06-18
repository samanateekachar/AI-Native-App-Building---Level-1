export interface WeeklySalesRecord {
  week: string;             // e.g. "Week 1"
  storeId: string;          // e.g. "S01"
  category: string;         // e.g. "Apparel"
  grossSales: number;       // $ Gross Sales
  discountAmount: number;   // $ Total Discounts
  returnAmount: number;     // $ Returns
  netSales: number;         // $ Net Sales
  transactions: number;     // Number of transactions
  targetSales: number;      // Target sales goal
  stockoutIncidents: number; // Number of stockouts
  unitSales: number;        // Units sold
  footfall: number;         // Customer foot traffic
  customerRating: number;   // Average customer rating (1-5)
  stockLevel: number;       // Current inventory level (units)
  inventoryCost: number;    // Value of inventory
  cogs: number;             // Cost of goods sold
  promotionFlag: string;    // "Yes" / "No"
  onlineOrders: number;     // Number of orders fulfilled online
  grossMargin: number;      // Net Sales - COGS
}

export interface StoreMasterRecord {
  storeId: string;
  storeName: string;
  region: string;           // East, West, Midwest, South, Southwest
  storeFormat: string;      // Flagship, Express, Standard, Hypermarket
  city: string;
}

export interface MergedSalesRecord extends WeeklySalesRecord {
  storeName: string;
  region: string;
  storeFormat: string;
  city: string;
}

export interface KPIStats {
  netSales: number;
  grossSales: number;
  target: number;
  targetAchievement: number; // %
  atv: number;               // Average Transaction Value (Net Sales / Transactions)
  transactions: number;
  returns: number;
  returnRate: number;        // return_amount / net_sales * 100
  discounts: number;
  discountRate: number;      // discount_amount / gross_sales * 100
  stockoutIncidents: number;
  grossMargin: number;       // Margin as dollar value
  marginRate: number;        // grossMargin / netSales * 100
}
