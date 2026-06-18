import * as XLSX from "xlsx";
import { WeeklySalesRecord, StoreMasterRecord } from "../types";

// Fuzzy-match key mappings
const SALES_FIELD_MAPPING: Record<string, keyof WeeklySalesRecord> = {
  "week": "week",
  "weeks": "week",
  
  "storeid": "storeId",
  "store id": "storeId",
  "store_id": "storeId",
  "store": "storeId",
  
  "category": "category",
  "productcategory": "category",
  "product category": "category",
  "product_category": "category",
  
  "grosssales": "grossSales",
  "gross sales": "grossSales",
  "gross_sales": "grossSales",
  
  "discountamount": "discountAmount",
  "discount amount": "discountAmount",
  "discount_amount": "discountAmount",
  "discounts": "discountAmount",
  
  "returnamount": "returnAmount",
  "return amount": "returnAmount",
  "return_amount": "returnAmount",
  "returnsamount": "returnAmount",
  "returns_amount": "returnAmount",
  "returns": "returnAmount",
  
  "netsales": "netSales",
  "net sales": "netSales",
  "net_sales": "netSales",
  
  "transactions": "transactions",
  "transactionCount": "transactions",
  "transaction_count": "transactions",
  "transaction": "transactions",
  
  "targetsales": "targetSales",
  "target sales": "targetSales",
  "target_sales": "targetSales",
  "target": "targetSales",
  "target sales goal": "targetSales",
  
  "stockoutincidents": "stockoutIncidents",
  "stockout incidents": "stockoutIncidents",
  "stockout_incidents": "stockoutIncidents",
  "stockouts": "stockoutIncidents",
  "stockout risk": "stockoutIncidents",
  
  "unitsales": "unitSales",
  "unit sales": "unitSales",
  "unit_sales": "unitSales",
  "units": "unitSales",
  
  "footfall": "footfall",
  "foot traffic": "footfall",
  "foottraffic": "footfall",
  
  "customerrating": "customerRating",
  "customer rating": "customerRating",
  "customer_rating": "customerRating",
  "rating": "customerRating",
  
  "stocklevel": "stockLevel",
  "stock level": "stockLevel",
  "stock_level": "stockLevel",
  "inventory qty": "stockLevel",
  
  "inventorycost": "inventoryCost",
  "inventory cost": "inventoryCost",
  "inventory_cost": "inventoryCost",
  
  "cogs": "cogs",
  "cost of goods sold": "cogs",
  "cost_of_goods_sold": "cogs",
  
  "promotionflag": "promotionFlag",
  "promotion flag": "promotionFlag",
  "promotion_flag": "promotionFlag",
  "promo": "promotionFlag",
  
  "onlineorders": "onlineOrders",
  "online orders": "onlineOrders",
  "online_orders": "onlineOrders",
  
  "grossmargin": "grossMargin",
  "gross margin": "grossMargin",
  "gross_margin": "grossMargin",
  "margin": "grossMargin",
};

const STORE_FIELD_MAPPING: Record<string, keyof StoreMasterRecord> = {
  "storeid": "storeId",
  "store id": "storeId",
  "store_id": "storeId",
  "id": "storeId",
  
  "storename": "storeName",
  "store name": "storeName",
  "store_name": "storeName",
  "name": "storeName",
  
  "region": "region",
  
  "storeformat": "storeFormat",
  "store format": "storeFormat",
  "store_format": "storeFormat",
  "format": "storeFormat",
  
  "city": "city",
  "location": "city"
};

function normalizeHeaderKey(header: string): string {
  return header.toString().toLowerCase().trim().replace(/_/g, " ").replace(/\s+/g, " ");
}

export function parseExcelFile<T>(
  file: File, 
  fieldMapping: Record<string, string>,
  callback: (data: T[], errMessage?: string) => void
) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = e.target?.result;
      if (!data) {
        callback([], "Unable to read file.");
        return;
      }
      
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
      
      if (rawRows.length === 0) {
        callback([], "Excel sheet is empty.");
        return;
      }

      // Detect headers and map them fuzzy
      const headers = Object.keys(rawRows[0]);
      const activeMapping: Record<string, string> = {};
      
      for (const h of headers) {
        const norm = h.toLowerCase().replace(/_/g, "").replace(/\s+/g, "");
        // Search in mapping
        if (fieldMapping[norm]) {
          activeMapping[h] = fieldMapping[norm];
        } else {
          // Do a space-inclusive lower search
          const spaceNorm = h.toLowerCase().trim().replace(/_/g, " ");
          if (fieldMapping[spaceNorm]) {
            activeMapping[h] = fieldMapping[spaceNorm];
          }
        }
      }

      const results = rawRows.map((row) => {
        const obj: any = {};
        for (const [rawKey, val] of Object.entries(row)) {
          const targetKey = activeMapping[rawKey];
          if (targetKey) {
            // parse numbers
            if (typeof val === "string") {
              const cleanedVal = val.replace(/[$,%]/g, "").trim();
              if (cleanedVal && !isNaN(Number(cleanedVal))) {
                obj[targetKey] = Number(cleanedVal);
              } else {
                obj[targetKey] = val;
              }
            } else {
              obj[targetKey] = val;
            }
          }
        }
        return obj as T;
      });

      callback(results);
    } catch (err: any) {
      console.error(err);
      callback([], "Encountered an error parsing Excel file. Please ensure it is a valid spreadsheet file.");
    }
  };

  reader.onerror = () => {
    callback([], "Error reading spreadsheet.");
  };

  reader.readAsArrayBuffer(file);
}

export function parseWeeklySalesExcel(file: File, callback: (data: WeeklySalesRecord[], errMessage?: string) => void) {
  parseExcelFile<WeeklySalesRecord>(file, SALES_FIELD_MAPPING, callback);
}

export function parseStoreMasterExcel(file: File, callback: (data: StoreMasterRecord[], errMessage?: string) => void) {
  parseExcelFile<StoreMasterRecord>(file, STORE_FIELD_MAPPING, callback);
}

/**
 * Downloads records as a clean formatted CSV or XLS template
 */
export function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const content = [
    headers.join(","),
    ...rows.map(r => r.map(cell => {
      if (typeof cell === "string") {
        // escape double quotes
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(","))
  ].join("\n");
  
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
