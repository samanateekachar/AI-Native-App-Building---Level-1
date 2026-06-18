import React from "react";
import { motion } from "motion/react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
  icon?: React.ReactNode;
  progress?: number; // 0 to 100 for progress bars
  description?: string;
}

export default function MetricCard({
  id,
  title,
  value,
  subValue,
  colorClass = "border-slate-200 bg-white shadow-xs",
  icon,
  progress,
  description
}: MetricCardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-md ${colorClass}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
          {icon}
        </div>
      </div>
      
      <div className="mt-3.5 flex flex-col justify-end">
        <h3 className="font-sans text-2xl font-black tracking-tight text-slate-900">
          {value}
        </h3>
        {subValue && (
          <span className="mt-1 text-xs font-semibold text-slate-500 flex items-center gap-1">
            {subValue}
          </span>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            <span>Target Achievement</span>
            <span className="font-mono text-xs">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-150 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                progress >= 100 
                  ? "bg-emerald-500" 
                  : progress >= 85 
                    ? "bg-blue-500" 
                    : "bg-amber-500"
              }`}
            />
          </div>
        </div>
      )}

      {description && (
        <p className="mt-2 text-[10px] text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-2">
          {description}
        </p>
      )}
    </motion.div>
  );
}
