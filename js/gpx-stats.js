import { listTrails } from './trails.js';

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth’s radius in meters
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180);
    const Δλ = (lon2 - lon1) * (Math.PI / 180);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

export async function statsFromGPX(trail) {
    const gpxUrl = `./gpx/${trail.name}.gpx`;

    // Arrays for chart data
    let heightData = [];
    let speedData = [];
    let distanceData = [0]; // Distance starts from 0

    try {
        const response = await fetch(gpxUrl);
        const gpxData = await response.text();
        const parser = new DOMParser();
        const gpx = parser.parseFromString(gpxData, 'application/xml');
        const trkpts = gpx.getElementsByTagName('trkpt');
        const minSpeedThreshold = 0.1;
        const timeElements = gpx.getElementsByTagName('time');

        let totalDistance = 0;
        let totalTimeMoving = 0;
        let totalTimeStopped = 0;
        let totalMovingDistance = 0;
        let topSpeed = 0;
        let totalSpeed = 0;
        let totalMovingSpeed = 0;
        let movingPoints = 0;
        let lastMovingSpeed = null;
        let totalTimeMs = 0;


        if (timeElements.length > 1) {
            const startTime = new Date(timeElements[0].textContent);
            const endTime = new Date(timeElements[timeElements.length - 1].textContent);

            totalTimeMs = endTime - startTime;

            const totalSeconds = Math.floor(totalTimeMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const totalTimeFormatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            trail.totalTime = totalTimeFormatted;
        } else {
            console.error(`No time data found for trail: ${trail.name}`);
        }

        for (let i = 1; i < trkpts.length; i++) {
            const prevPt = trkpts[i - 1];
            const currPt = trkpts[i];

            const lat1 = parseFloat(prevPt.getAttribute('lat'));
            const lon1 = parseFloat(prevPt.getAttribute('lon'));
            const lat2 = parseFloat(currPt.getAttribute('lat'));
            const lon2 = parseFloat(currPt.getAttribute('lon'));

            const time1 = new Date(prevPt.getElementsByTagName('time')[0].textContent).getTime();
            const time2 = new Date(currPt.getElementsByTagName('time')[0].textContent).getTime();
            const timeDiff = (time2 - time1) / 1000;

            const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2);
            totalDistance += segmentDistance;

            const speed = segmentDistance / timeDiff;
            totalSpeed += speed;

            // Add distance, speed, and height data for the chart
            distanceData.push((totalDistance / 1000).toFixed(2)); // Distance in km

            if (speed > minSpeedThreshold) {
                // If moving, push the actual speed and update the last known moving speed
                const speedInKmh = (speed * 3.6).toFixed(2); // Convert to km/h
                speedData.push(speedInKmh);
                lastMovingSpeed = speedInKmh; // Update the last known moving speed
            } else if (lastMovingSpeed !== null) {
                // If not moving, push the last known moving speed
                speedData.push(lastMovingSpeed);
            } else {
                // If there is no known moving speed yet, treat it as 0 (or you can choose a default value)
                speedData.push(0);
            }

            const ele = parseFloat(currPt.getElementsByTagName('ele')[0].textContent); // Elevation
            heightData.push(ele); // Store elevation data

            // Tune this to calculate moving time
            if (speed > 0.1 && timeDiff < 30) {
                totalTimeMoving += timeDiff;
                totalMovingDistance += segmentDistance;
                totalMovingSpeed += speed;
                movingPoints++;
            } else {
                totalTimeStopped += timeDiff;
            }

            if (speed > topSpeed) {
                topSpeed = speed;
            }
        }

        const averageSpeed = totalDistance / (totalTimeMs / 1000);  
        const averageMovingSpeed = totalDistance / totalTimeMoving;

        trail.distance = (totalDistance / 1000).toFixed(2);
        trail.averageSpeed = (averageSpeed * 3.6).toFixed(2);
        trail.topSpeed = (topSpeed * 3.6 * 0.9).toFixed(2); // Added * 0.9 to clamp the top speed
        trail.totalTimeMoving = `${Math.floor(totalTimeMoving / 3600)}:${Math.floor((totalTimeMoving % 3600) / 60).toString().padStart(2, '0')}:${(totalTimeMoving % 60).toString().padStart(2, '0')}`;
        trail.averageSpeedMoving = (averageMovingSpeed * 3.6).toFixed(2);

        console.log(`${trail.name}: Dist: ${trail.distance} km, Avg speed: ${trail.averageSpeed} km/h, Avg speed (moving): ${trail.averageSpeedMoving} km/h, Top speed: ${trail.topSpeed} km/h, Time: ${trail.totalTime}, Time (moving): ${trail.totalTimeMoving}.`);
        console.log('Height Data:', heightData);
        console.log('Speed Data:', speedData);
        console.log('Distance Data:', distanceData);

        interpolateSpeedData(speedData);
        return { heightData, speedData, distanceData };

    } catch (error) {
        console.error(`Error parsing GPX for trail ${trail.name}:`, error);
        return null;
    }
}

// Interpolation function to smooth speedData
function interpolateSpeedData(speedData) {
    const useThreePointAverage = speedData.length > 666; // Condition to switch averaging method

    if (useThreePointAverage) {
        // Use the average of every 3rd point if the array has more than 666 values
        for (let i = 1; i < speedData.length - 2; i++) {
            speedData[i] = (
                (parseFloat(speedData[i - 1]) + parseFloat(speedData[i]) + parseFloat(speedData[i + 1])) / 3
            ).toFixed(2);
        }
    } else {
        // Use the average of every 2 adjacent points if the array has 666 or fewer values
        for (let i = 1; i < speedData.length - 1; i++) {
            speedData[i] = ((parseFloat(speedData[i - 1]) + parseFloat(speedData[i + 1])) / 2).toFixed(2);
        }
    }
}

async function updateTrailStats() {
    for (const trail of listTrails) {
        await statsFromGPX(trail); 
    }
}

updateTrailStats();
