import React, { useRef, useState } from "react";
import { Upload, FileUp, FileCheck, HelpCircle, RefreshCw, Download, Database } from "lucide-react";
import { parseWeeklySalesExcel, parseStoreMasterExcel, downloadCSV } from "../utils/excelParser";
import { WeeklySalesRecord, StoreMasterRecord } from "../types";
import { DEFAULT_STORES, generateSyntheticWeeklySales, CATEGORIES } from "../utils/dataGenerator";

interface FileUploaderProps {
  salesCount: number;
  storesCount: number;
  isCustomSales: boolean;
  isCustomStores: boolean;
  onSalesUploaded: (data: WeeklySalesRecord[]) => void;
  onStoresUploaded: (data: StoreMasterRecord[]) => void;
  onResetToSample: () => void;
}

export default function FileUploader({
  salesCount,
  storesCount,
  isCustomSales,
  isCustomStores,
  onSalesUploaded,
  onStoresUploaded,
  onResetToSample
}: FileUploaderProps) {
  const salesInputRef = useRef<HTMLInputElement>(null);
  const storesInputRef = useRef<HTMLInputElement>(null);
  
  const [salesError, setSalesError] = useState<string | null>(null);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [isSalesUploading, setIsSalesUploading] = useState(false);
  const [isStoresUploading, setIsStoresUploading] = useState(false);

  const handleSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSalesError(null);
    setIsSalesUploading(true);
    
    parseWeeklySalesExcel(file, (data, err) => {
      setIsSalesUploading(false);
      if (err) {
        setSalesError(err);
      } else if (data.length === 0) {
        setSalesError("Could not find relevant retail sales columns in the file.");
      } else {
        onSalesUploaded(data);
      }
    });
  };

  const handleStoresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStoresError(null);
    setIsStoresUploading(true);
    
    parseStoreMasterExcel(file, (data, err) => {
      setIsStoresUploading(false);
      if (err) {
        setStoresError(err);
      } else if (data.length === 0) {
        setStoresError("Could not find relevant store master columns in the file.");
      } else {
        onStoresUploaded(data);
      }
    });
  };

  const handleDownloadSalesTemplate = () => {
    // Generate simple compliant CSV template using default synthetic sales
    const headers = [
      "Week", "Store ID", "Product Category", "Gross Sales", "Discount Amount", 
      "Return Amount", "Net Sales", "Transactions", "Target Sales", "Stockout Incidents",
      "Unit Sales", "Footfall", "Customer Rating", "Stock Level", "Inventory Cost", 
      "COGS", "Promotion Flag", "Online Orders", "Gross Margin"
    ];
    
    // Sample rows (take 5 typical rows)
    const mockSales = generateSyntheticWeeklySales(DEFAULT_STORES).slice(12, 17);
    const rows = mockSales.map(s => [
      s.week, s.storeId, s.category, s.grossSales, s.discountAmount,
      s.returnAmount, s.netSales, s.transactions, s.targetSales, s.stockoutIncidents,
      s.unitSales, s.footfall, s.customerRating, s.stockLevel, s.inventoryCost,
      s.cogs, s.promotionFlag, s.onlineOrders, s.grossMargin
    ]);

    downloadCSV("retail_weekly_sales_template.csv", headers, rows);
  };

  const handleDownloadStoresTemplate = () => {
    const headers = ["Store ID", "Store Name", "Region", "Store Format", "City"];
    const rows = DEFAULT_STORES.slice(0, 5).map(s => [
      s.storeId, s.storeName, s.region, s.storeFormat, s.city
    ]);
    downloadCSV("store_master_template.csv", headers, rows);
  };

  return (
    <div id="file-uploader-section" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="h-4.5 w-4.5 text-blue-600" />
            Retail Enterprise Data Sync
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect weekly retail Excel sheets or CSV spreadsheets to synchronize calculations across the dashboard instantly.
          </p>
        </div>
        
        {(isCustomSales || isCustomStores) && (
          <button
            id="btn-reset-sample"
            onClick={onResetToSample}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin-reverse" />
            Restore Sample Database
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales File Panel */}
        <div 
          id="sales-uploader-card"
          className={`rounded-xl border p-5 transition-all relative ${
            isCustomSales 
              ? "border-emerald-200 bg-emerald-50/20" 
              : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                isCustomSales ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-blue-50 border-blue-100 text-blue-600"
              }`}>
                {isCustomSales ? <FileCheck className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Weekly Retail Sales Record</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">retail_weekly_sales.xlsx</p>
              </div>
            </div>

            <button
              id="btn-download-sales-template"
              onClick={handleDownloadSalesTemplate}
              title="Download compliant template"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 border border-dashed border-slate-200 rounded-lg p-4 bg-white/70 text-center">
            <span className="text-xs font-semibold block text-slate-700">
              {isCustomSales ? "✓ Custom sheet synchronized" : "Using Preloaded Enterprise Sample"}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {salesCount ? `${salesCount.toLocaleString()} active rows available` : "No records loaded"}
            </span>
            
            <input
              type="file"
              ref={salesInputRef}
              onChange={handleSalesChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            
            <button
              id="btn-trigger-sales-upload"
              disabled={isSalesUploading}
              onClick={() => salesInputRef.current?.click()}
              className="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isSalesUploading ? "Processing sheet..." : "Upload Retail Weekly Sales"}
            </button>
          </div>

          {salesError && (
            <p className="text-xs text-rose-500 font-medium mt-3 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              {salesError}
            </p>
          )}
        </div>

        {/* Store Master File Panel */}
        <div 
          id="stores-uploader-card"
          className={`rounded-xl border p-5 transition-all relative ${
            isCustomStores 
              ? "border-emerald-200 bg-emerald-50/20" 
              : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                isCustomStores ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-blue-50 border-blue-100 text-blue-600"
              }`}>
                {isCustomStores ? <FileCheck className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Store Reference Master</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">store_master.xlsx</p>
              </div>
            </div>

            <button
              id="btn-download-stores-template"
              onClick={handleDownloadStoresTemplate}
              title="Download compliant template"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 border border-dashed border-slate-200 rounded-lg p-4 bg-white/70 text-center">
            <span className="text-xs font-semibold block text-slate-700">
              {isCustomStores ? "✓ Custom sheet synchronized" : "Using Preloaded Enterprise Sample"}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {storesCount ? `${storesCount} stores parsed dynamically` : "No records loaded"}
            </span>
            
            <input
              type="file"
              ref={storesInputRef}
              onChange={handleStoresChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            
            <button
              id="btn-trigger-stores-upload"
              disabled={isStoresUploading}
              onClick={() => storesInputRef.current?.click()}
              className="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isStoresUploading ? "Processing sheet..." : "Upload Store Reference"}
            </button>
          </div>

          {storesError && (
            <p className="text-xs text-rose-500 font-medium mt-3 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              {storesError}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 bg-slate-50/50 rounded-xl p-4 border border-slate-200/80 leading-relaxed text-[11px] text-slate-500 flex gap-2.5">
        <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 block mb-0.5">Integration Best Practices</span>
          To run clean correlations, ensure both sheets share a common <span className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-700 font-medium">Store ID</span> key (e.g. S01, S02... S20). Our fuzzy-matching parser automatically aligns dilated column names like "gross_sales", "return_amount", or "target_sales".
        </div>
      </div>
    </div>
  );
}
