import { listTrails } from './trails.js';
import { statsFromGPX } from './gpx-stats.js';

let chart;

async function updateChart(trailName) {
    const trail = listTrails.find(t => t.name === trailName);
    if (trail) {

        const { heightData, speedData, distanceData } = await statsFromGPX(trail);

        const ctx = document.getElementById('chart').getContext('2d');

        if (chart) {
            chart.destroy();
        }

        const chartElement = document.getElementById('chart');
        chartElement.style.height = '400px';

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: distanceData,
                datasets: [
                    {
                        label: 'Speed (km/h)',
                        data: speedData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        yAxisID: 'y1',
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        cubicInterpolationMode: 'monotone',
                        tension: .5,
                        borderWidth: .7,
                    },
                    {
                        label: 'Height (m)',
                        data: heightData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        yAxisID: 'y',
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        cubicInterpolationMode: 'monotone',
                        tension: 0.1,
                    }                    
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        animation: false,
                        callbacks: {
                            label: function(tooltipItem) {
                                const dataIndex = tooltipItem.dataIndex;
                                const speedValue = speedData[dataIndex];
                                const elevation = heightData[dataIndex];
                                const distanceValue = distanceData[dataIndex];

                                if (tooltipItem.datasetIndex === 1) {
                                    return `Speed: ${speedValue} km/h`;
                                } else {
                                    return `Elevation: ${elevation} m`;
                                }
                            },
                            afterBody: function(tooltipItems) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                const distanceValue = distanceData[dataIndex];
                                return `Distance: ${distanceValue} km`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Distance (km)'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Height (m)'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Speed (km/h)'
                        },
                        grid: {
                            display: false,
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });
    }
}

export { updateChart };
