import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const SubjectsChart = () => {
  const data = {
    labels: ['Math', 'Science', 'History', 'Programming'],
    datasets: [
      {
        data: [75, 60, 90, 85],
        backgroundColor: ['#a8e6cf', '#dcedc1', '#ffaaa5', '#ffd3b6'],
        borderWidth: 0,
      }
    ]
  };

  const options = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  return (
    <div className="card-base">
      <h6 className="mb-4 font-semibold flex items-center gap-2">
        <span className="text-lg">⏱️</span> Subjects
      </h6>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default SubjectsChart;