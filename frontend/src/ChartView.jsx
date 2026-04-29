import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);

const colors = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // purple
];

export default function ChartView({ data }) {
  if (!data || !data.result.length) return null;

  const keys = Object.keys(data.result[0]);

  const chartData = {
  labels: data.result.map((row) => row[Object.keys(row)[0]]),
  datasets: [
    {
      label: "Values",
      data: data.result.map((row) => row[Object.keys(row)[1]]),
      backgroundColor: data.result.map(
        (_, i) => colors[i % colors.length]
      ),
      hoverBackgroundColor: data.result.map((_, i) => colors[i % colors.length]),
      borderRadius: 6,
    },
  ],
};
const options = {
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
    },
    y: {
      grid: { color: "#e5e7eb" },
    },
  },
};
  return <Bar data={chartData} options={options} />;
}