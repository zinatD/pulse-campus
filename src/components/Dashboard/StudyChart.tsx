import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const StudyChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Use an intersection observer to only render the chart when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only create chart if element is visible
    if (!chartRef.current || !isVisible) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Study Hours',
              data: [3, 4, 2, 5, 3, 1, 2],
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    return () => {
      // Clean up chart instance when component unmounts
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [isVisible]);

  return (
    <div className="card-base h-[300px]">
      <h2 className="text-lg font-semibold mb-4">Study Progress</h2>
      <div className="h-[250px]">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default StudyChart;