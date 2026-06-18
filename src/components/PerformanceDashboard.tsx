import React, { useMemo, useState } from "react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  Filter, RotateCcw, Download, Sparkles, AlertTriangle, ArrowUpRight, 
  Building2, Percent, TrendingUp, RefreshCw, ShoppingCart, Search, FileText, ChevronDown, CheckCircle2
} from "lucide-react";
import { MergedSalesRecord, KPIStats } from "../types";
import MetricCard from "./MetricCard";
import { CATEGORIES } from "../utils/dataGenerator";
import { downloadCSV } from "../utils/excelParser";

interface PerformanceDashboardProps {
  data: MergedSalesRecord[];
  onRefresh: () => void;
}

// Visual Theme Palette
const PALETTE = {
  indigo: "#2563eb",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#dc2626",
  violet: "#4f46e5",
  slate: "#475569"
};

const CHART_COLORS = [PALETTE.indigo, PALETTE.violet, PALETTE.emerald, PALETTE.amber, PALETTE.rose, PALETTE.slate];

export default function PerformanceDashboard({ data, onRefresh }: PerformanceDashboardProps) {
  // Filters State
  const [selectedWeek, setSelectedWeek] = useState<string>("All");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [selectedStore, setSelectedStore] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Search state for raw tabular records
  const [searchQuery, setSearchQuery] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const itemsPerPage = 8;

  // AI-Powered Insights State
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Derive filter option sets list from current dataset
  const filterOptions = useMemo(() => {
    const weeks = Array.from(new Set(data.map(r => r.week))).sort((a,b) => {
      const numA = parseInt(a.replace(/^\D+/g, "")) || 0;
      const numB = parseInt(b.replace(/^\D+/g, "")) || 0;
      return numA - numB;
    });
    const regions = Array.from(new Set(data.map(r => r.region))).sort();
    const stores = Array.from(new Set(data.map(r => `${r.storeId} - ${r.storeName}`))).sort();
    const cities = Array.from(new Set(data.map(r => r.city))).sort();
    const formats = Array.from(new Set(data.map(r => r.storeFormat))).sort();
    const categories = Array.from(new Set(data.map(r => r.category))).sort();

    return { weeks, regions, stores, cities, formats, categories };
  }, [data]);

  // Reset Filters trigger
  const handleResetFilters = () => {
    setSelectedWeek("All");
    setSelectedRegion("All");
    setSelectedStore("All");
    setSelectedCity("All");
    setSelectedFormat("All");
    setSelectedCategory("All");
    setSearchQuery("");
    setTablePage(1);
  };

  // Filter Implementation
  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (selectedWeek !== "All" && r.week !== selectedWeek) return false;
      if (selectedRegion !== "All" && r.region !== selectedRegion) return false;
      if (selectedStore !== "All") {
        const storeId = selectedStore.split(" - ")[0];
        if (r.storeId !== storeId) return false;
      }
      if (selectedCity !== "All" && r.city !== selectedCity) return false;
      if (selectedFormat !== "All" && r.storeFormat !== selectedFormat) return false;
      if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
      return true;
    });
  }, [data, selectedWeek, selectedRegion, selectedStore, selectedCity, selectedFormat, selectedCategory]);

  // Compute overall KPI metrics
  const kpis = useMemo<KPIStats>(() => {
    let grossSales = 0;
    let discounts = 0;
    let returns = 0;
    let netSales = 0;
    let transactions = 0;
    let target = 0;
    let stockoutIncidents = 0;
    let cogs = 0;

    for (const r of filteredData) {
      grossSales += r.grossSales;
      discounts += r.discountAmount;
      returns += r.returnAmount;
      netSales += r.netSales;
      transactions += r.transactions;
      target += r.targetSales;
      stockoutIncidents += r.stockoutIncidents;
      cogs += (r.cogs || 0);
    }

    const targetAchievement = target > 0 ? (netSales / target) * 100 : 0;
    const atv = transactions > 0 ? netSales / transactions : 0;
    const returnRate = netSales > 0 ? (returns / netSales) * 100 : 0;
    const discountRate = grossSales > 0 ? (discounts / grossSales) * 100 : 0;
    const grossMargin = netSales - cogs;
    const marginRate = netSales > 0 ? (grossMargin / netSales) * 100 : 0;

    return {
      netSales,
      grossSales,
      target,
      targetAchievement,
      atv,
      transactions,
      returns,
      returnRate,
      discounts,
      discountRate,
      stockoutIncidents,
      grossMargin,
      marginRate
    };
  }, [filteredData]);

  // Weekly Trend Chart compiler
  const weeklyTrendData = useMemo(() => {
    const map: Record<string, { week: string; netSales: number; targetSales: number; transactions: number }> = {};
    for (const r of filteredData) {
      if (!map[r.week]) {
        map[r.week] = { week: r.week, netSales: 0, targetSales: 0, transactions: 0 };
      }
      map[r.week].netSales += r.netSales;
      map[r.week].targetSales += r.targetSales;
      map[r.week].transactions += r.transactions;
    }
    return Object.values(map).sort((a,b) => {
      const numA = parseInt(a.week.replace(/^\D+/g, "")) || 0;
      const numB = parseInt(b.week.replace(/^\D+/g, "")) || 0;
      return numA - numB;
    });
  }, [filteredData]);

  // Regional Performance compiler
  const regionalPerformanceData = useMemo(() => {
    const map: Record<string, { region: string; netSales: number; targetSales: number; returnAmount: number }> = {};
    for (const r of filteredData) {
      if (!map[r.region]) {
        map[r.region] = { region: r.region, netSales: 0, targetSales: 0, returnAmount: 0 };
      }
      map[r.region].netSales += r.netSales;
      map[r.region].targetSales += r.targetSales;
      map[r.region].returnAmount += r.returnAmount;
    }
    return Object.values(map).map(item => ({
      ...item,
      achievementRate: item.targetSales > 0 ? (item.netSales / item.targetSales) * 100 : 0,
      returnRate: item.netSales > 0 ? (item.returnAmount / item.netSales) * 100 : 0
    })).sort((a,b) => b.netSales - a.netSales);
  }, [filteredData]);

  // Category Performance compiler
  const categoryPerformanceData = useMemo(() => {
    const map: Record<string, { category: string; netSales: number; targetSales: number; returnAmount: number; stockouts: number; grossSales: number }> = {};
    for (const r of filteredData) {
      if (!map[r.category]) {
        map[r.category] = { category: r.category, netSales: 0, targetSales: 0, returnAmount: 0, stockouts: 0, grossSales: 0 };
      }
      map[r.category].netSales += r.netSales;
      map[r.category].grossSales += r.grossSales;
      map[r.category].targetSales += r.targetSales;
      map[r.category].returnAmount += r.returnAmount;
      map[r.category].stockouts += r.stockoutIncidents;
    }
    return Object.values(map).map(item => ({
      ...item,
      returnRate: item.netSales > 0 ? (item.returnAmount / item.netSales) * 100 : 0,
      achievementRate: item.targetSales > 0 ? (item.netSales / item.targetSales) * 100 : 0,
    })).sort((a,b) => b.netSales - a.netSales);
  }, [filteredData]);

  // Store Leaderboard & Target Miss calculations
  const storeLeaderboard = useMemo(() => {
    const map: Record<string, { storeId: string; storeName: string; region: string; city: string; netSales: number; targetSales: number }> = {};
    for (const r of filteredData) {
      const key = r.storeId;
      if (!map[key]) {
        map[key] = { storeId: r.storeId, storeName: r.storeName, region: r.region, city: r.city, netSales: 0, targetSales: 0 };
      }
      map[key].netSales += r.netSales;
      map[key].targetSales += r.targetSales;
    }
    return Object.values(map).map(item => ({
      ...item,
      achievementRate: item.targetSales > 0 ? (item.netSales / item.targetSales) * 100 : 0,
      shortfall: Math.max(0, item.targetSales - item.netSales)
    })).sort((a,b) => b.netSales - a.netSales);
  }, [filteredData]);

  // Stores currently missing targets
  const missingTargetStores = useMemo(() => {
    return storeLeaderboard
      .filter(s => s.achievementRate < 100)
      .sort((a,b) => b.shortfall - a.shortfall);
  }, [storeLeaderboard]);

  // Tabular Filtered details search matching
  const searchMatchedData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return filteredData;
    return filteredData.filter(r => 
      r.storeName.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.week.toLowerCase().includes(q) ||
      r.storeId.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q)
    );
  }, [filteredData, searchQuery]);

  // Paginated Rows
  const paginatedData = useMemo(() => {
    const start = (tablePage - 1) * itemsPerPage;
    return searchMatchedData.slice(start, start + itemsPerPage);
  }, [searchMatchedData, tablePage]);

  const maxPages = Math.ceil(searchMatchedData.length / itemsPerPage) || 1;

  // Active Filters list for export reference
  const activeFilters = useMemo(() => {
    return {
      Week: selectedWeek,
      Region: selectedRegion,
      Store: selectedStore,
      City: selectedCity,
      Format: selectedFormat,
      Category: selectedCategory
    };
  }, [selectedWeek, selectedRegion, selectedStore, selectedCity, selectedFormat, selectedCategory]);

  // Download filtered data as CSV
  const handleExportFilteredData = () => {
    const headers = [
      "Week", "Store ID", "Store Name", "Region", "City", "Store Format", 
      "Product Category", "Gross Sales", "Discount Amount", "Return Amount", 
      "Net Sales", "Transactions", "Target Sales", "Stockout Incidents"
    ];
    
    const rows = filteredData.map(r => [
      r.week, r.storeId, r.storeName, r.region, r.city, r.storeFormat,
      r.category, r.grossSales, r.discountAmount, r.returnAmount,
      r.netSales, r.transactions, r.targetSales, r.stockoutIncidents
    ]);

    downloadCSV(`dynamic_filtered_retail_sales.csv`, headers, rows);
  };

  // Generate Executive AI Intelligence Report from Server-side Gemini API
  const handleGenerateAIInsights = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiInsights(null);

    // Prepare highly aggregated summaries to transmit to server
    const payload = {
      kpis,
      regionalBreakdown: regionalPerformanceData,
      categoryBreakdown: categoryPerformanceData.map(c => ({
        category: c.category,
        netSales: c.netSales,
        returnRate: c.returnRate,
        stockouts: c.stockouts
      })),
      storeBreakdown: storeLeaderboard.map(s => ({
        storeName: s.storeName,
        netSales: s.netSales,
        targetSales: s.targetSales,
        achievementRate: s.achievementRate,
        city: s.city,
        region: s.region
      })),
      activeFilters
    };

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || "Failed to analyze dashboard stats.");
      }

      const resData = await response.json();
      setAiInsights(resData.insights);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Could not generate AI insights. Please ensure the Gemini server is fully available.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Download AI Insights as markdown (.md) report
  const handleDownloadAIInsights = () => {
    if (!aiInsights) return;
    const blob = new Blob([aiInsights], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Intelligence_Executive_Report.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple clean regex-based markdown formatter for HTML display
  const formattedInsightsHTML = useMemo(() => {
    if (!aiInsights) return [];
    
    // Split into lines and parse paragraphs, bold highlights, lists, headers
    return aiInsights.split("\n").map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("### ")) {
        return <h5 key={idx} className="text-sm font-semibold text-zinc-900 mt-4 mb-2 tracking-tight flex items-center gap-1">{trimmed.replace("### ", "")}</h5>;
      }
      if (trimmed.startsWith("## ")) {
        return <h4 key={idx} className="text-base font-bold text-zinc-950 mt-5 border-l-2 border-indigo-500 pl-2 mb-2.5 tracking-tight">{trimmed.replace("## ", "")}</h4>;
      }
      if (trimmed.startsWith("# ")) {
        return <h3 key={idx} className="text-lg font-bold text-zinc-950 mt-6 border-b border-zinc-100 pb-2 mb-3.5 tracking-tight">{trimmed.replace("# ", "")}</h3>;
      }
      
      // Bold replacements
      let content = trimmed;
      const bolds: string[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        bolds.push(match[1]);
      }
      
      let parsedNode: React.ReactNode = trimmed;
      if (bolds.length > 0) {
        const parts = trimmed.split(/\*\*.*?\*\*/);
        parsedNode = (
          <span>
            {parts.map((p, pIdx) => (
              <React.Fragment key={pIdx}>
                {p}
                {bolds[pIdx] && <strong className="font-semibold text-zinc-950">{bolds[pIdx]}</strong>}
              </React.Fragment>
            ))}
          </span>
        );
      }

      // Check bullet list item
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="text-xs text-zinc-600 ml-4 pl-1 list-disc mb-1.5 leading-relaxed">
            {bolds.length > 0 ? parsedNode : trimmed.substring(2)}
          </li>
        );
      }

      // Check numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const listText = trimmed.replace(/^\d+\.\s/, "");
        return (
          <div key={idx} className="flex gap-2 text-xs text-zinc-600 mb-2 pl-1 leading-relaxed">
            <span className="font-bold text-indigo-600 min-w-4 flex-shrink-0">{trimmed.match(/^\d+/)?.toString()}.</span>
            <div className="flex-1">{bolds.length > 0 ? parsedNode : listText}</div>
          </div>
        );
      }

      if (trimmed === "") return <div key={idx} className="h-2" />;

      return <p key={idx} className="text-xs text-zinc-600 mb-2 leading-relaxed">{bolds.length > 0 ? parsedNode : trimmed}</p>;
    });
  }, [aiInsights]);

  return (
    <div id="performance-dashboard-container" className="space-y-8">
      
      {/* SECTION 1: DOCKABLE ADVANCED FILTERS */}
      <div id="dashboard-filters-card" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 tracking-tight uppercase">Interactive Business Filters</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Filter across semanas, regions, individual coordinates, formats, or categories.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-trigger-refresh"
              onClick={onRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 px-3 py-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              Re-Sync Core Data
            </button>
            
            <button
              id="btn-reset-filters"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100/75 text-xs font-bold text-slate-600 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              Reset All
            </button>

            <button
              id="btn-export-filtered"
              onClick={handleExportFilteredData}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export Active Rows (CSV)
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Week Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Week / Period</label>
            <div className="relative">
              <select
                id="filter-week"
                value={selectedWeek}
                onChange={(e) => { setSelectedWeek(e.target.value); setTablePage(1); }}
                className="w-full text-xs bg-white border border-slate-200 focus:border-blue-400 rounded-lg py-2 pl-3 pr-8 appearance-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Weeks (1-12)</option>
                {filterOptions.weeks.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Region</label>
            <div className="relative">
              <select
                id="filter-region"
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setTablePage(1); }}
                className="w-full text-xs bg-white border border-slate-200 focus:border-blue-400 rounded-lg py-2 pl-3 pr-8 appearance-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Regions</option>
                {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* District Store Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Individual Store</label>
            <div className="relative">
              <select
                id="filter-store"
                value={selectedStore}
                onChange={(e) => { setSelectedStore(e.target.value); setTablePage(1); }}
                className="w-full text-xs bg-white border border-slate-200 focus:border-blue-400 rounded-lg py-2 pl-3 pr-8 appearance-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Stores</option>
                {filterOptions.stores.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
            <div className="relative">
              <select
                id="filter-city"
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setTablePage(1); }}
                className="w-full text-xs bg-white border border-slate-200 focus:border-blue-400 rounded-lg py-2 pl-3 pr-8 appearance-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Cities</option>
                {filterOptions.cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Store Format Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Store Format</label>
            <div className="relative">
              <select
                id="filter-format"
                value={selectedFormat}
                onChange={(e) => { setSelectedFormat(e.target.value); setTablePage(1); }}
                className="w-full text-xs bg-white border border-slate-200 focus:border-blue-400 rounded-lg py-2 pl-3 pr-8 appearance-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Formats</option>
                {filterOptions.formats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Product Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
            <div className="relative">
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setTablePage(1); }}
                className="w-full text-xs bg-white border border-slate-200 focus:border-blue-400 rounded-lg py-2 pl-3 pr-8 appearance-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXECUTIVE METRIC KPI CARDS */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Metric 1: Net Sales */}
        <MetricCard
          id="kpi-net-sales"
          title="Consolidated Net Sales"
          value={`$${Math.round(kpis.netSales).toLocaleString()}`}
          subValue={`Gross of $${Math.round(kpis.grossSales).toLocaleString()}`}
          colorClass="border-indigo-100 bg-linear-to-b from-indigo-50/20 to-white"
          description="Net revenue generated subtraction of discounts and merchandise returns."
          icon={<ShoppingCart className="h-5 w-5 text-indigo-600" />}
        />

        {/* Metric 2: Target Achievement */}
        <MetricCard
          id="kpi-target-achievement"
          title="Target Sales Achievement"
          value={`${kpis.targetAchievement.toFixed(1)}%`}
          subValue={`Target of $${Math.round(kpis.target).toLocaleString()}`}
          progress={kpis.targetAchievement}
          description="Consolidated sales performance vs set target targets."
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />

        {/* Metric 3: ATV */}
        <MetricCard
          id="kpi-atv"
          title="Average Transaction Value (ATV)"
          value={`$${kpis.atv.toFixed(2)}`}
          subValue={`${kpis.transactions.toLocaleString()} total transactions`}
          colorClass="border-zinc-200 bg-white"
          description="Average customer checkout basket size of net sales revenue."
          icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
        />

        {/* Metric 4: Return Rate */}
        <MetricCard
          id="kpi-return-rate"
          title="Rev Return Rate"
          value={`${kpis.returnRate.toFixed(2)}%`}
          subValue={`$${Math.round(kpis.returns).toLocaleString()} in returns`}
          colorClass={kpis.returnRate > 5 ? "border-rose-100 bg-rose-50/10" : "border-zinc-200 bg-white"}
          description="Total return amount as a percentage scale of consolidated net sales."
          icon={<AlertTriangle className={`h-5 w-5 ${kpis.returnRate > 5 ? "text-rose-500" : "text-zinc-500"}`} />}
        />

        {/* Metric 5: Discount Rate */}
        <MetricCard
          id="kpi-discount-rate"
          title="Average Discount Rate"
          value={`${kpis.discountRate.toFixed(2)}%`}
          subValue={`$${Math.round(kpis.discounts).toLocaleString()} markdown`}
          colorClass="border-zinc-200 bg-white"
          description="Total discount markdown amount over total raw gross sales receipts."
          icon={<Percent className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* ADDITIONAL OPERATIONAL STATE BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">Operational Alerts</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-semibold">Stockout Fragility: {kpis.stockoutIncidents} incidents registered</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">High stockouts limit grocery checkout velocity. Balance local storage reserves proactively.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Margin</span>
            <span className="text-sm font-bold text-indigo-400">${Math.round(kpis.grossMargin).toLocaleString()}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Margin %</span>
            <span className="text-sm font-bold text-emerald-400">{kpis.marginRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: VISUAL INTELLIGENCE GRAPHICS (RECHARTS) */}
      <div id="analytics-charts-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Sales and Target Weekly Trend */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Sales & Target Trend (Weekly performance)
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Chronological comparison of Net Sales vs Target sales goals across weeks.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.indigo} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={PALETTE.indigo} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tickLine={false} style={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tickLine={false} style={{ fontSize: 10 }} stroke="#64748b" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Amount"]}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, fontSize: 12, border: "none" }}
                />
                <Legend style={{ fontSize: 12 }} />
                <Area type="monotone" name="Net Sales" dataKey="netSales" stroke={PALETTE.indigo} strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                <Line type="monotone" name="Target Sales" dataKey="targetSales" stroke={PALETTE.rose} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Regional Performance & Target Achievements */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Regional Sales Share & Return Rates
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Dispersal of sales volumes across geographical regions alongside average merchandise return index.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="region" tickLine={false} style={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis yAxisId="left" tickLine={false} style={{ fontSize: 10 }} stroke="#64748b" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} style={{ fontSize: 10 }} stroke="#f43f5e" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === "Return Rate") return [`${Number(value).toFixed(2)}%`, "Return Rate"];
                    return [`$${Number(value).toLocaleString()}`, name];
                  }}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, fontSize: 12, border: "none" }}
                />
                <Legend style={{ fontSize: 12 }} />
                <Bar yAxisId="left" name="Net Sales" dataKey="netSales" fill={PALETTE.indigo} radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Line yAxisId="right" type="monotone" name="Return Rate" dataKey="returnRate" stroke={PALETTE.rose} strokeWidth={2.5} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Category Performance Analysis */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              Category Contributions (Net Revenue contribution)
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Financial contribution of categories against target achievement rate percentages.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} style={{ fontSize: 10 }} stroke="#64748b" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tickLine={false} style={{ fontSize: 10 }} stroke="#64748b" width={110} />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Net Sales"]}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, fontSize: 12, border: "none" }}
                />
                <Bar name="Net Sales" dataKey="netSales" radius={[0, 4, 4, 0]} maxBarSize={25}>
                  {categoryPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Stockout Incidents & Sales Risk Matrix */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Product Stockout incidents & Profit Leak Risk
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Total registered inventory stockouts by category. High bar registers immediate stock replenishment alert.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tickLine={false} style={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tickLine={false} style={{ fontSize: 10 }} stroke="#64748b" />
                <Tooltip 
                  formatter={(value: any) => [Number(value), "Stockout Incidents"]}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, fontSize: 12, border: "none" }}
                />
                <Bar name="Stockout Incidents" dataKey="stockouts" fill={PALETTE.rose} radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4: AI REVENUE INTEL ENGINE (GEMINI-3.5-FLASH ON SERVER SPECIALIST) */}
      <div id="ai-sales-intelligence-box" className="bg-[#f8fafc] rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-blue-500/5 pointer-events-none blur-3xl" />
        <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-blue-500/5 pointer-events-none blur-3xl" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                  Gemini Sales Executive Assistant
                  <span className="bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">Server-Side API</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Synthesize the current query, compute targets, return leakages, and output a consulting action plan.
                </p>
              </div>
            </div>

            <button
              id="btn-generate-ai-insights"
              disabled={isAiLoading}
              onClick={handleGenerateAIInsights}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating Executive Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze Active Filters
                </>
              )}
            </button>
          </div>

          {/* AI Output Display Panel */}
          {isAiLoading && (
            <div className="space-y-4 py-8 px-4 bg-white/60 border border-slate-200 rounded-lg animate-pulse">
              <div className="h-4 bg-slate-200 rounded-sm w-3/4" />
              <div className="h-3 bg-slate-200 rounded-sm w-5/6" />
              <div className="h-3 bg-slate-200 rounded-sm w-2/3" />
              <div className="h-3 bg-slate-200 rounded-sm w-full" />
              <div className="h-4 bg-slate-200 rounded-sm w-1/2 mt-6" />
              <div className="h-3 bg-slate-200 rounded-sm w-5/6" />
              <div className="h-3 bg-slate-200 rounded-sm w-4/5" />
            </div>
          )}

          {aiError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <div>
                <span className="font-semibold block mb-1">Execution Interrupted</span>
                {aiError}
              </div>
            </div>
          )}

          {!isAiLoading && !aiError && aiInsights && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm relativeScale">
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  id="btn-download-ai-insights"
                  onClick={handleDownloadAIInsights}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Report (.md)
                </button>
              </div>

              <div id="ai-insight-text-output" className="markdown-body p-1 text-slate-800 space-y-2 prose max-w-none">
                {formattedInsightsHTML}
              </div>
            </div>
          )}

          {!isAiLoading && !aiError && !aiInsights && (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-white/50">
              <Sparkles className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Executive Analysis Standby</h5>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Select your filters and click "Analyze Active Filters" to run a complete retail sales audit via the server-side Gemini API.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: PERFORMANCE LEADERBOARDS & GAP TARGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-leaderboard-section">
        
        {/* Underperforming Stores Missing Target */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Stores Missing Target
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Priority review list of units currently lagging behind target goals, sorted by dollar shortfall.</p>
          </div>

          <div className="mt-4 space-y-3.5">
            {missingTargetStores.length > 0 ? (
              missingTargetStores.slice(0, 5).map((store) => (
                <div key={store.storeId} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{store.storeName}</h5>
                      <span className="text-[10px] text-slate-400">{store.region} Region • {store.city}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 block">Shortfall: -${Math.round(store.shortfall).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">Achieved: {store.achievementRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${store.achievementRate}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                ✓ All stores have successfully checked or surpassed 100% of their target coordinates!
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Stores Leaders */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              Store Leaderboard
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Dynamic store performance rank determined by overall net revenue levels.</p>
          </div>

          <div className="mt-4 space-y-3.5">
            {storeLeaderboard.slice(0, 5).map((store, idx) => (
              <div key={store.storeId} className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 h-7 w-7 rounded-lg flex items-center justify-center border border-blue-100">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 truncate">{store.storeName}</h5>
                    <span className="text-xs font-bold text-emerald-600">${Math.round(store.netSales).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{store.city} • {store.region} Region</span>
                    <span>Achievement Goal: {store.achievementRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6: DETAILED TABULAR VIEW OF RAW TRANSACTION LOGS */}
      <div id="dashboard-raw-table" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Active Weekly Sales Database</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Scoping {searchMatchedData.length.toLocaleString()} matching records from selected filters.</p>
          </div>

          {/* Table Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              id="table-search-input"
              placeholder="Search store, city, category..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setTablePage(1); }}
              className="w-full text-xs font-sans bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-lg py-2 pl-9 pr-4 text-slate-700 font-semibold focus:outline-none"
            />
          </div>
        </div>

        {/* Dense Table Layout */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full table-auto text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Week</th>
                <th className="py-3 px-4">Store Code</th>
                <th className="py-3 px-4">Store Name & Region</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Product Category</th>
                <th className="py-3 px-4 text-right">Gross Sales</th>
                <th className="py-3 px-4 text-right">Net Sales</th>
                <th className="py-3 px-4 text-right">Target Achievement</th>
                <th className="py-3 px-4 text-right">Stockouts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => {
                  const achievement = row.targetSales > 0 ? (row.netSales / row.targetSales) * 100 : 0;
                  return (
                    <tr key={`${row.week}-${row.storeId}-${row.category}-${index}`} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-900 font-bold">{row.week}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-blue-600">{row.storeId}</td>
                      <td className="py-3 px-4">
                        <span className="block text-slate-800 font-sans">{row.storeName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{row.region} Region • {row.storeFormat}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{row.city}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-semibold border border-slate-200/55">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">${row.grossSales.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-950 font-bold">${row.netSales.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono text-xs ${achievement >= 100 ? "text-emerald-600 font-bold" : achievement >= 85 ? "text-amber-500 font-bold" : "text-rose-500 font-bold"}`}>
                          {achievement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.stockoutIncidents > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                             {row.stockoutIncidents}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                    No matching records discovered. Broaden your search query or reset active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {maxPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
            <span className="text-xs text-slate-400">
              Page <strong className="text-slate-700">{tablePage}</strong> of <strong className="text-slate-700">{maxPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-prev-page"
                disabled={tablePage === 1}
                onClick={() => setTablePage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 disabled:opacity-40 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                id="btn-next-page"
                disabled={tablePage === maxPages}
                onClick={() => setTablePage(prev => Math.min(maxPages, prev + 1))}
                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 disabled:opacity-40 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
