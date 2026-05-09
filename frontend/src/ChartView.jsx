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
  "#1f5d4d",
  "#c99b35",
  "#5b7f95",
  "#8a6f3d",
  "#427a63",
  "#9b5750",
];

export default function ChartView({ data }) {
  if (!data || !data.result.length) return null;

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
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#13231f",
        titleColor: "#ffffff",
        bodyColor: "#d8efe6",
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#60706b",
          font: { size: 11, weight: 600 },
        },
      },
      y: {
        border: { display: false },
        grid: { color: "rgba(31, 61, 52, 0.1)" },
        ticks: {
          color: "#60706b",
          font: { size: 11, weight: 600 },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
