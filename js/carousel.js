import { listTrails } from './trails.js';
import { selectTrailByName } from './map.js';
import { updateChart } from './charts.js';

function createCarousel() {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = ''; // Clear the placeholder content

    listTrails.forEach(trail => {
        const trailDiv = document.createElement('div');
        trailDiv.classList.add('carousel-item'); // Add styling class

        const img = document.createElement('img');
        img.src = `./img/${trail.name}/01/${trail.name}_350.jpg`;
        img.alt = trail.name;

        const nameDiv = document.createElement('div');
        nameDiv.textContent = trail.name;

        trailDiv.appendChild(img);
        trailDiv.appendChild(nameDiv);

        // Add event listener to select trail and fit bounds when clicked from carousel
        trailDiv.addEventListener('click', () => {
            selectTrailByName(trail.name, true); // Select the trail and update chart
        });
        

        carousel.appendChild(trailDiv);
    });
}

window.onload = createCarousel;
