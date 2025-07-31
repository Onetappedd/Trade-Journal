"use client";
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
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function EquityCurveChart({ dates, user, spy, qqq }: { dates: string[]; user: number[]; spy: number[]; qqq: number[] }) {
  const data = {
    labels: dates,
    datasets: [
      {
        label: "User",
        data: user,
        borderColor: "#22c55e",
        backgroundColor: "#22c55e33",
        tension: 0.2,
      },
      {
        label: "SPY",
        data: spy,
        borderColor: "#2563eb",
        backgroundColor: "#2563eb33",
        tension: 0.2,
      },
      {
        label: "QQQ",
        data: qqq,
        borderColor: "#f59e42",
        backgroundColor: "#f59e4233",
        tension: 0.2,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: false },
    },
    scales: {
      x: { display: false },
      y: { display: true },
    },
  };
  return <Line data={data} options={options} height={240} />;
}
