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

            for (let i = 1; i < trkpts.length; i++) {
                const lat = parseFloat(trkpts[i].getAttribute('lat'));
                const lon = parseFloat(trkpts[i].getAttribute('lon'));

                if (lat < minLat) minLat = lat;
                if (lon < minLon) minLon = lon;
                if (lat > maxLat) maxLat = lat;
                if (lon > maxLon) maxLon = lon;
            }

            const bounds = [
                [minLon, minLat], 
                [maxLon, maxLat] 
            ];

            const padding = 100;
        
            map.fitBounds(bounds, {
                padding: { top: padding, bottom: padding, left: padding, right: padding },
                maxZoom: 13, 
                duration: 1000  
            });
        }
    } catch (error) {
        console.error(`Error fetching GPX for trail ${trail.name}:`, error);
    }
}

async function selectTrail(map, trail) {
    if (selectedTrail === trail) {
        if (currentMarker) {
            currentMarker.remove();
        }
        selectedTrail = null;
    } else {
        selectedTrail = trail;
        await addMarkerAtStart(map, trail);
    }
}

async function getStartPointFromGPX(trail) {
    const gpxUrl = `./gpx/${trail.name}.gpx`;
    try {
        const response = await fetch(gpxUrl);
        const gpxData = await response.text();

        const parser = new DOMParser();
        const gpx = parser.parseFromString(gpxData, "application/xml");

        const firstTrkpt = gpx.getElementsByTagName('trkpt')[0];
        const lat = parseFloat(firstTrkpt.getAttribute('lat'));
        const lon = parseFloat(firstTrkpt.getAttribute('lon'));

        return { lat, lon };
    } catch (error) {
        console.error(`Error fetching GPX for trail ${trail.name}:`, error);
        return null;
    }
}

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

async function addGPXToMap(map, trail) {
    const gpxUrl = `./gpx/${trail.name}.gpx`;

    const response = await fetch(gpxUrl);
    const gpxData = await response.text();

    const parser = new DOMParser();
    const gpx = parser.parseFromString(gpxData, "application/xml");
    const geojson = toGeoJSON.gpx(gpx); 

    map.addSource(trail.name, {
        type: 'geojson',
        data: geojson
    });

    map.addLayer({
        id: trail.name,
        type: 'line',
        source: trail.name,
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': 'red',
            'line-opacity': 0.8, 
            'line-width': 2
        }
    });

    map.on('click', trail.name, async () => {
        await selectTrail(map, trail);
        await updateChart(trail.name);
    });
}

function addTrailsToMap(map) {
    listTrails.forEach(trail => {
        addGPXToMap(map, trail);
    });
}

mapboxgl.accessToken = 'pk.eyJ1IjoiYXJlZWx2ZXN0YWQiLCJhIjoiY20xZ3UydHVyMDc3NzJtc2V3bnR5MXF2YSJ9.1GGwHsMIhkaYlwL5vMahGg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    projection: 'globe',
    zoom: 8,
    center: [21.0263, 69.7664]
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

    addTrailsToMap(map);
});

export { selectTrailByName };