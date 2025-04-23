"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentForms from "@/components/dashboard/RecentForms";
import RecentTemplates from "@/components/dashboard/RecentTemplates";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<{
    formsCount: number;
    responsesCount: number;
    templatesCount: number;
    responsesTrend: { _id: string; count: number }[];
  }>({
    formsCount: 0,
    responsesCount: 0,
    templatesCount: 0,
    responsesTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStats();
      // Set up polling for real-time updates
      const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  // Prepare chart data
  const chartData = {
    labels: stats.responsesTrend.map(item => item._id),
    datasets: [
      {
        label: 'Responses',
        data: stats.responsesTrend.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome back, {session?.user?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="Total Forms" 
          value={stats.formsCount.toString()} 
          icon="📝" 
          trend="up" 
          trendValue="12%"
        />
        <StatsCard 
          title="Total Responses" 
          value={stats.responsesCount.toString()} 
          icon="📊" 
          trend="up" 
          trendValue="23%"
        />
        <StatsCard 
          title="Templates" 
          value={stats.templatesCount.toString()} 
          icon="📋" 
          trend="steady" 
          trendValue="0%"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Response Trends</h2>
        <div className="h-64">
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
              },
            }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentForms />
        <RecentTemplates />
      </div>
    </div>
  );
}