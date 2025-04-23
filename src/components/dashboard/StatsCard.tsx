"use client";
import { useEffect, useState } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  trend: "up" | "down" | "steady";
  trendValue: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendValue,
}: StatsCardProps) {
  const [animatedValue, setAnimatedValue] = useState("0");
  
  useEffect(() => {
    // Animate the value change
    let current = 0;
    const target = parseInt(value);
    const increment = target / 30; // Adjust for speed
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setAnimatedValue(Math.floor(current).toString());
    }, 16); // ~60fps
    
    return () => clearInterval(timer);
  }, [value]);

  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    steady: "text-yellow-500"
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    steady: "→"
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{animatedValue}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      <div className={`mt-2 text-sm ${trendColors[trend]}`}>
        <span className="mr-1">{trendIcons[trend]}</span>
        {trendValue} from last week
      </div>
    </div>
  );
}