import { statsFromGPX } from './gpx-stats.js';

let chart; // Declare the chart variable globally

export async function updateChart(trailName) {
    const trail = listTrails.find(t => t.name === trailName);
    if (trail) {
        // Fetch the height, speed, and distance data from GPX
        const { heightData, speedData, distanceData } = await statsFromGPX(trail);

        const ctx = document.getElementById('chart').getContext('2d');

        if (chart) {
            chart.destroy();
        }

        // Create or update the chart with the selected trail data
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: distanceData, // X-axis (distance)
                datasets: [
                    {
                        label: 'Height (m)',
                        data: heightData, // Height data
                        borderColor: 'rgba(54, 162, 235, 1)', // Blue line for height
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        yAxisID: 'y', // Left y-axis
                        fill: true,
                    },
                    {
                        label: 'Speed (km/h)',
                        data: speedData, // Speed data
                        borderColor: 'rgba(255, 99, 132, 1)', // Red line for speed
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        yAxisID: 'y1', // Right y-axis
                        fill: false,
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
                                const elevation = heightData[dataIndex]; // Elevation data
                                const speedValue = speedData[dataIndex]; // Speed data
                                const distanceValue = distanceData[dataIndex]; // Distance data

                                // Show speed and elevation with colored boxes
                                if (tooltipItem.datasetIndex === 1) {
                                    return `Speed: ${speedValue} km/h`;
                                } else {
                                    return `Elevation: ${elevation} m`;
                                }
                            },
                            afterBody: function(tooltipItems) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                const distanceValue = distanceData[dataIndex];
                                return `Distance: ${distanceValue} km`; // Show distance once
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
