let selectedCityId = null;
const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

const API_BASE_URL = isLocalhost
  ? 'http://127.0.0.1:5000' // Local backend
  : 'https://bisgarik.pythonanywhere.com'; // Deployed backend

const map = new maplibregl.Map({
    container: 'map',
    style: "https://raw.githubusercontent.com/gtitov/basemaps/refs/heads/master/positron-nolabels.json",
    center: [80, 60],
    zoom: 3, 
    // hash: true
});

// Генерация панели с информацией о городе
function renderCityDetails(cityProperties) {
    const modal = document.getElementById("city-details-modal");
    modal.innerHTML = `
        <h1 style="text-align: center">${cityProperties.name}</h1>
        <img src="${cityProperties.emblem_url}" height="200" style="display: block; margin: 0 auto;">
        <h3>Численность населения</h3><h2>${cityProperties.people_count} тыс. чел</h2>
        <h3>Индекс качества городской среды</h3><h2>${cityProperties.total_points} / 360</h2>
        <hr>
        <h3>Жилье и прилегающие пространства</h3><h2>${cityProperties.house_points} / 60</h2>
        <h3>Озелененные пространства</h3><h2>${cityProperties.park_points} / 60</h2>
        <h3>Общественно-деловая инфраструктура</h3><h2>${cityProperties.business_points} / 60</h2>
        <h3>Социально-досуговая инфраструктура</h3><h2>${cityProperties.social_points} / 60</h2>
        <h3>Улично-дорожная</h3><h2>${cityProperties.street_points} / 60</h2>
        <h3>Общегородское пространство</h3><h2>${cityProperties.common_points} / 60</h2>
    `;
}

map.on("load", () => {
    
    map.addSource("russia-boundary", {
        type: "geojson",
        data: "./data/russia.geojson",
      });
    
      map.addLayer({
        id: "russia-background",
        source: "russia-boundary",
        type: "fill",
        paint: {
          "fill-color": "#AFEEEE",
          "fill-opacity": 0.3,
        },
    });

    fetch(`${API_BASE_URL}/years`)
        .then(response => response.json())
        .then(years => {
            const select = document.getElementById('year-selector');
            select.innerHTML = '';

            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            });

            // Установить первый год и обновить слой
            if (years.length > 0) {
                const initialYear = years[0];
                select.value = initialYear;
                map.getSource('cities').setData(`${API_BASE_URL}/cities/${initialYear}`);
            }
        })
        .catch(error => console.error("Ошибка загрузки годов:", error));
    
    map.addSource('cities', {
        type: 'geojson',
        data: `${API_BASE_URL}/cities/2020` // бэкенд должен быть запущен
    });

    map.addLayer({
        'id': 'cities-layer',
        'source': 'cities',
        'type': 'circle',
        'paint': {
            'circle-stroke-width': 1,
            'circle-stroke-color': '#FFFFFF',
            // SELECT MIN(total_points), MAX(total_points) FROM cities
            'circle-color': [
                'interpolate', ['linear'],
                ['get', 'total_points'],
                50, '#d7191c',
                150, '#ffffbf',
                250, '#1a9641'
            ],
            'circle-opacity': 0.8,
            // SELECT DISTINCT group_name FROM cities
            'circle-radius': [
                "match",
                ['get', 'group_name'],
                'Малый город', 3,
                'Средний город', 6,
                'Большой город', 6,
                'Крупный город', 8,
                'Крупнейший город', 12,
                0 // остальные
            ]
        }
    });

    document.getElementById("year-selector").addEventListener(
        'change',
        (e) => {
            const year = e.target.value;
            map.getSource('cities').setData(`${API_BASE_URL}/cities/${year}`);
    
            // Скрываем модалку и сбрасываем выбранный город
            const modal = document.getElementById("city-details-modal");
            modal.style.display = "none";
            selectedCityId = null;
        }
    );

    map.on('click', 'cities-layer', (e) => {
        // console.log(e.features[0].properties.id)
        selectedCityId = e.features[0].properties.id;
        fetch(`${API_BASE_URL}/city/${selectedCityId}`)
            .then(response => response.json())
            .then(cityProperties => {
                // console.log(cityProperties)
                renderCityDetails(cityProperties);
                document.getElementById("city-details-modal").style.display = "block"; // замена встроенному модальному окну
                // document.getElementById("city-details-modal").showModal(); // showModal() -- встроенный метод элемента <dialog>, заменено
            })
    });

    map.on("click", "cities-layer", function (e) {
        map.flyTo({ center: e.lngLat, zoom: 6 });
    });

    // Закрытие модального окна при клике вне города
    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['cities-layer']
        });

        if (features.length === 0) {
            const modal = document.getElementById("city-details-modal");
            modal.style.display = "none";
        }
});
    
    map.on('mouseenter', 'cities-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'cities-layer', () => {
        map.getCanvas().style.cursor = '';
    });
})