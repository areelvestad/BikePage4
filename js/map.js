import { listTrails } from './trails.js'; // Import trail data
import { updateChart } from './charts.js';

let selectedTrail = null; // Track the currently selected trail
let currentMarker = null; // Track the current marker

// Function to select a trail by its name
async function selectTrailByName(trailName, setBounds = false) {
    const trail = listTrails.find(t => t.name === trailName);
    if (trail) {
        await updateChart(trailName);
        await selectTrail(map, trail); // Select the trail on the map
        if (setBounds) {
            await fitMapToTrailBounds(trail); // Set the map bounds when necessary
        }
    } else {
        console.error(`Trail with name ${trailName} not found`);
    }
}

// Function to set the map bounds to fit the selected trail
async function fitMapToTrailBounds(trail) {
    const gpxUrl = `./gpx/${trail.name}.gpx`;

    try {
        const response = await fetch(gpxUrl);
        const gpxData = await response.text();

        const parser = new DOMParser();
        const gpx = parser.parseFromString(gpxData, "application/xml");

        // Get all trkpts (track points) to calculate bounds
        const trkpts = gpx.getElementsByTagName('trkpt');
        if (trkpts.length > 0) {
            let minLat = parseFloat(trkpts[0].getAttribute('lat'));
            let minLon = parseFloat(trkpts[0].getAttribute('lon'));
            let maxLat = minLat;
            let maxLon = minLon;

            // Loop through all trkpts to calculate min/max lat/lon
            for (let i = 1; i < trkpts.length; i++) {
                const lat = parseFloat(trkpts[i].getAttribute('lat'));
                const lon = parseFloat(trkpts[i].getAttribute('lon'));

                if (lat < minLat) minLat = lat;
                if (lon < minLon) minLon = lon;
                if (lat > maxLat) maxLat = lat;
                if (lon > maxLon) maxLon = lon;
            }

            // Define bounds using min/max lat/lon
            const bounds = [
                [minLon, minLat], // Southwest corner
                [maxLon, maxLat]  // Northeast corner
            ];

            const padding = 100;
            // Fit the map to the bounds
            map.fitBounds(bounds, {
                padding: { top: padding, bottom: padding, left: padding, right: padding }, // Optional: Add some padding around the trail
                maxZoom: 13, // Optional: Set a maximum zoom level
                duration: 1000  // Optional: Animation duration in milliseconds
            });
        }
    } catch (error) {
        console.error(`Error fetching GPX for trail ${trail.name}:`, error);
    }
}

// The existing selectTrail function
async function selectTrail(map, trail) {
    if (selectedTrail === trail) {
        // If the clicked trail is already selected, deselect it
        if (currentMarker) {
            currentMarker.remove();
        }
        selectedTrail = null;
    } else {
        // Select the new trail and add a marker
        selectedTrail = trail;
        await addMarkerAtStart(map, trail);
    }
}

// Function to fetch and parse GPX file and get the start point (first trkpt)
async function getStartPointFromGPX(trail) {
    const gpxUrl = `./gpx/${trail.name}.gpx`;
    try {
        const response = await fetch(gpxUrl);
        const gpxData = await response.text();

        const parser = new DOMParser();
        const gpx = parser.parseFromString(gpxData, "application/xml");

        // Get the first trkpt (track point) to find the start of the trail
        const firstTrkpt = gpx.getElementsByTagName('trkpt')[0];
        const lat = parseFloat(firstTrkpt.getAttribute('lat'));
        const lon = parseFloat(firstTrkpt.getAttribute('lon'));

        return { lat, lon };
    } catch (error) {
        console.error(`Error fetching GPX for trail ${trail.name}:`, error);
        return null;
    }
}
// Function to add a marker at the start of the trail
async function addMarkerAtStart(map, trail) {
    const startPoint = await getStartPointFromGPX(trail);
    if (startPoint && !isNaN(startPoint.lat) && !isNaN(startPoint.lon)) {
        if (currentMarker) {
            currentMarker.remove();
        }

        currentMarker = new mapboxgl.Marker({ color: 'red' })
            .setLngLat([startPoint.lon, startPoint.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(`${trail.name} Start`))
            .addTo(map);
    }
}

// Function to fetch and parse GPX file and add it to the map
async function addGPXToMap(map, trail) {
    const gpxUrl = `./gpx/${trail.name}.gpx`;

    const response = await fetch(gpxUrl);
    const gpxData = await response.text();

    const parser = new DOMParser();
    const gpx = parser.parseFromString(gpxData, "application/xml");
    const geojson = toGeoJSON.gpx(gpx); // Assuming toGeoJSON is loaded in your project

    // Add the parsed GPX (as GeoJSON) to the Mapbox map
    map.addSource(trail.name, {
        type: 'geojson',
        data: geojson
    });

    // Add a layer to style the trail
    map.addLayer({
        id: trail.name,
        type: 'line',
        source: trail.name,
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': 'red',  // Customize line color
            'line-width': 4
        }
    });

    // Add click event to select the trail
    map.on('click', trail.name, async () => {
        await selectTrail(map, trail);
    });
}

function addTrailsToMap(map) {
    listTrails.forEach(trail => {
        // Add the GPX trail to the map
        addGPXToMap(map, trail);
    });
}

mapboxgl.accessToken = 'pk.eyJ1IjoiYXJlZWx2ZXN0YWQiLCJhIjoiY20xZ3UydHVyMDc3NzJtc2V3bnR5MXF2YSJ9.1GGwHsMIhkaYlwL5vMahGg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    projection: 'globe', // Display the map as a globe
    zoom: 8,
    center: [21.0263, 69.7664]  // Centering in Northern Norway
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {
    // Add terrain exaggeration
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

    // Load and display trails
    addTrailsToMap(map);
});

export { selectTrailByName };