// Инициализируем карту
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {},
        layers: []
    },
    center: [51, 0],
    zoom: 2
  });

  map.on('load', () => {
    
    // Выполняется после загрузки карты
    map.addLayer({
        id: 'background',
        type: 'background',
        paint: {
        'background-color': 'lightblue'
        }
    })

    // Добавление источника данных
     map.addSource('countries', {
        type: 'geojson',
        data: './data/countries.geojson',
        attribution: 'Natural Earth'
    })

    // Добавление слоя
    map.addLayer({
        id: 'countries-layer',
        type: 'fill',
        source: 'countries',
        paint: {
            'fill-color': [
                'match', 
                ['get', 'MAPCOLOR7'], 
                1, 'rgb(203, 221, 48)',
                2, 'rgb(41, 152, 43)',
                3, 'rgb(76, 49, 11)',
                4, 'rgb(26, 87, 94)',
                5, 'rgb(199, 151, 83)',
                6, 'rgb(78, 76, 114)',
                'lightgray']
        }
    })

    map.addSource('rivers', {
        type: 'geojson',
        data: './data/rivers.geojson'
    })

    map.addLayer({
        id: 'rivers-layer',
        type: 'line',
        source: 'rivers',
        paint: {
            'line-color': '#00BFFF'
        }
    })

    map.addSource('lakes', {
        type: 'geojson',
        data: './data/lakes.geojson'
    })

    map.addLayer({
        id: 'lakes-layer',
        type: 'fill',
        source: 'lakes',
        paint: {
            'fill-color': 'lightblue',
            'fill-outline-color': '#00BFFF'
        }
    })

    map.addLayer({
        id: 'lakes-outline',
        type: 'line',
        source: 'lakes',
        paint: {
            'line-color': 'black',
            'line-width': 2
        }
    })

    map.addSource('cities', {
        type: 'geojson',
        data: './data/cities.geojson'
    })

    map.addLayer({
        id: 'cities-layer',
        type: 'circle',
        source: 'cities',
        paint: {
            'circle-color': [
                'match',
                ['get', 'NAME'], 'Moscow',
                'red', // Цвет для Москвы
                'rgb(12, 67, 234)'], // Цвет по умолчанию
            'circle-radius': 3
        },
        filter: ['>', ['get', 'POP_MAX'], 1000000]
    })

    map.on('click', ['cities-layer'], (e) => {
        // console.log(e)
        // console.log(e.features)

        const countryFeature = map.queryRenderedFeatures(e.point, {
            layers: ['countries-layer']
        })[0];

        new maplibregl.Popup() // создадим попап
            .setLngLat(e.features[0].geometry.coordinates) // установим на координатах объекта
            // заполним текстом из атрибута с именем объекта
            .setHTML(
                '<h3 style="text-align: center;">' + e.features[0].properties.NAME + '</h3>' +
                '<p><strong>Country: </strong>' + countryFeature.properties.NAME + '</p>' +
                '<p> <strong>Name RU: </strong>' + e.features[0].properties.NAME_RU + '</p>'
            )
            .addTo(map); // добавим на карту
    })

    map.on('mouseenter', 'countries-layer', () => {
        map.getCanvas().style.cursor = 'crosshair'
    })

    map.on('mouseleave', 'countries-layer', () => {
        map.getCanvas().style.cursor = ''
    })

    map.on('mouseenter', 'cities-layer', () => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'cities-layer', () => {
        map.getCanvas().style.cursor = ''
    })
})