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
            const year = e.target.value // фиксируем выбранный год
            map.getSource('cities').setData(`${API_BASE_URL}/cities/${year}`) // меняем источник данных
        }
    )

    map.on('click', 'cities-layer', (e) => {
        // console.log(e.features[0].properties.id)
        fetch(`${API_BASE_URL}/city/${e.features[0].properties.id}`)
            .then(response => response.json())
            .then(cityProperties => {
                // console.log(cityProperties)
                document.getElementById("city-details-modal").innerHTML = `<h1>${cityProperties.name}</h1>
                            <img src="${cityProperties.emblem_url}" height="200">
                            <h3>Численность населения</h3><h2>${cityProperties.people_count} тыс. чел</h2>
                            <h3>Индекс качества городской среды</h3><h2>${cityProperties.total_points} / 360</h2>
                            <hr>
                            <h3>Жилье и прилегающие пространства</h3><h2>${cityProperties.house_points} / 60</h2>
                            <h3>Озелененные пространства</h3><h2>${cityProperties.park_points} / 60</h2>
                            <h3>Общественно-деловая инфраструктура</h3><h2>${cityProperties.business_points} / 60</h2>
                            <h3>Социально-досуговая инфраструктура</h3><h2>${cityProperties.social_points} / 60</h2>
                            <h3>Улично-дорожная</h3><h2>${cityProperties.street_points} / 60</h2>
                            <h3>Общегородское пространство</h3><h2>${cityProperties.common_points} / 60</h2>`
                document.getElementById("city-details-modal").showModal() // showModal() -- встроенный метод элемента <dialog>
            })
    })

    map.on('mouseenter', 'cities-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'cities-layer', () => {
        map.getCanvas().style.cursor = '';
    });
})