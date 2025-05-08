// const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

// const API_BASE_URL = isLocalhost
//   ? 'http://127.0.0.1:5000' // Local backend
//   : 'https://bisgarik.pythonanywhere.com'; // Deployed backend

const map = new maplibregl.Map({
    container: "map",
    style: "https://raw.githubusercontent.com/gtitov/basemaps/refs/heads/master/voyager-nolabels.json",
    center: [37, 55],
    zoom: 6,
    maxZoom: 11,
    maxBounds: [[25, 50], [50, 60]],
    hash: true,
});

map.on("load", () => {

    let hoveredOikonymId = null;
    let hoveredFeatureId = null;
    
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

        map.addSource("grid", {
            type: "vector",
            url: "http://localhost:3000/grid",
            promoteId: "id"
        })
        map.addLayer({
            id: "grid-layer",
            source: "grid",
            "source-layer": "grid",
            type: "fill",
            paint: {
                "fill-color": [
                    "interpolate", ["linear"],
                    ['to-number', ["get", "sum_pop"]],
                    0, "#440154",
                    100, "#39568c",
                    1000, '#1f968b',
                    10000, '#fde725'
                ],
                'fill-outline-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    "cyan",
                    "transparent"
                ]
            }
        })
        map.addLayer({
            id: "grid-outline",
            source: "grid",
            "source-layer": "grid",
            type: "line",
            paint: {
                "line-color": "#BD33A4",
                'line-width': 3
            },
            filter: ["==", "id", ""]
        })

        map.addSource("oikonyms", {
            type: "vector",
            tiles: ["http://localhost:3000/oikonyms/{z}/{x}/{y}"],
            promoteId: "id"
        })
        map.addLayer({
            id: "oikonyms-layer",
            source: "oikonyms",
            "source-layer": "oikonyms",
            type: "circle",
            paint: {
                "circle-color": "#1a9641",
                "circle-radius": [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    10,  // при наведении
                    6    // по умолчанию
                ],
                "circle-stroke-width": 1,
                "circle-stroke-color": "#FFF",
                "circle-opacity": 0.8
            },
            minzoom: 9
        })
        
        map.on("mousemove", "grid-layer", (e) => {
            if (hoveredFeatureId !== null) {
                // последнему назначенному объекту
                // присваиваем состояние `false`
                map.setFeatureState(
                    {
                        source: "grid",
                        sourceLayer: "grid",
                        id: hoveredFeatureId
                    },
                    { hover: false }
                )
            }
            // назначаем текущий объект
            hoveredFeatureId = e.features[0].id
            // текущему объекту присваиваем состояние `true`
            map.setFeatureState(
                {
                    source: "grid",
                    sourceLayer: "grid",
                    id: hoveredFeatureId
                },
                { hover: true }
            )
        })

        // когда курсор покидает слой
        map.on("mouseleave", "grid-layer", () => {
            // последнему назначенному объекту
            // присваиваем состояние `false`
            map.setFeatureState(
                {
                    source: "grid",
                    sourceLayer: "grid",
                    id: hoveredFeatureId
                },
                { hover: false }
            )
        })

        map.on("click", "grid-layer", (e) => {
            map.flyTo({
                center: e.lngLat,
                zoom: 10
            })
        })
        
        map.on('mouseenter', 'grid-layer', () => {
            map.getCanvas().style.cursor = 'pointer'
        })
        
        map.on('mouseleave', 'grid-layer', () => {
            map.getCanvas().style.cursor = ''
        })

        // Действия для ойконимов
        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false
        });
        
        map.on('mouseenter', 'oikonyms-layer', (e) => {
            const feature = e.features[0];
            // console.log("Hovered feature ID:", feature.id);

            popup
                .setLngLat(e.features[0].geometry.coordinates)
                .setHTML(e.features[0].properties.name)
                .addTo(map);

            if (hoveredOikonymId !== null) {
                map.setFeatureState(
                    { source: "oikonyms", sourceLayer: "oikonyms", id: hoveredOikonymId },
                    { hover: false }
                );
            }
        
            hoveredOikonymId = feature.id;
        
            map.setFeatureState(
                { source: "oikonyms", sourceLayer: "oikonyms", id: hoveredOikonymId },
                { hover: true }
            );
        });
        
        map.on('mouseleave', 'oikonyms-layer', () => {
            popup.remove();

            if (hoveredOikonymId !== null) {
                map.setFeatureState(
                    { source: "oikonyms", sourceLayer: "oikonyms", id: hoveredOikonymId },
                    { hover: false }
                );
                hoveredOikonymId = null;
            }
        });

        document.getElementById("filter").addEventListener("input", (e) => {
            filterValue = parseInt(e.target.value)
            map.setFilter("grid-layer", ["<", ["to-number", ["get", "sum_pop"]], filterValue])
        });

        // Обводка при клике
        let clickedFeatureId = null;
        map.on("click", "grid-layer", (e) => {
            clickedFeatureId = e.features[0].id;
            map.setFilter("grid-outline", ["==", "id", clickedFeatureId]);
            map.flyTo({ center: e.lngLat, zoom: 10 });
        });
        // При изменении масштаба — скрываем обводку, если меньше 9
        map.on("zoom", () => {
            const zoom = map.getZoom();
            if (zoom < 9) {
                map.setFilter("grid-outline", ["==", "id", ""]);
            } else if (clickedFeatureId !== null) {
                map.setFilter("grid-outline", ["==", "id", clickedFeatureId]);
            }
        });

        // Фильтрация по первой букве
        document.getElementById("letter-filter").addEventListener("input", (e) => {
            const letter = e.target.value.toLowerCase();
            if (letter.length === 0) {
                map.setFilter("oikonyms-layer", null); // сброс фильтра
            } else {
                map.setFilter("oikonyms-layer", [
                    "==",
                    ["slice", ["get", "name"], 0, 1],
                    letter
                ]);
            }
        });
})