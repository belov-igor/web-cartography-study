const map = new maplibregl.Map({
    container: 'map',
    style: "https://raw.githubusercontent.com/gtitov/basemaps/refs/heads/master/positron-nolabels.json",
    center: [80, 47],
    zoom: 3
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
        beforeId: "clusters",
    });

    fetch("https://docs.google.com/spreadsheets/d/1f0waZduz5CXdNig_WWcJDWWntF-p5gN2-P-CNTLxEa0/export?format=csv")
    .then((response) => response.text())
    .then((csv) => {
        const rows = Papa.parse(csv, { header: true }) // читаем CSV
        // console.log(rows) // любуемся
        // Формируем объекты GeoJSON
        const geojsonFeatures = rows.data.map((row) => {
          return {
            type: "Feature",
            properties: row,
            geometry: {
              type: "Point",
              coordinates: [row.lon, row.lat],
            }
          }
        })
        const geojson = {
          type: "FeatureCollection",
          features: geojsonFeatures
        };

        map.addSource("vacancies", {
            type: "geojson",
            data: geojson,
            cluster: true, // точки будем объединять в кластеры
            clusterRadius: 20, // радиус поиска 20 пикселей
          });
        
          map.addLayer({
            id: "clusters",
            source: "vacancies",
            type: "circle",
            paint: {
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
              "circle-radius": [
                "step", ["get", "point_count"],
                12, // до 3 точек в кластере
                3,  // --- первое граничное значение
                20, // от 3 точек до 6
                6,  // --- второе граничное значение
                30  // больше 6 точек в кластере
              ],
              "circle-color": [
                "step", ["get", "point_count"],
                "#00FA9A", // до 3 точек в кластере
                3,  // --- первое граничное значение
                "#4682B4", // от 3 точек до 6
                6,  // --- второе граничное значение
                "#7B68EE",  // больше 6 точек в кластере
              ], 
            },
          });

          map.addLayer({
            id: "unclustered-points",
            type: "circle",
            source: "vacancies",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": 5,
              "circle-color": "#8B4513",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#ffffff"
            }
          });
        
          map.addLayer({
            id: "clusters-labels",
            type: "symbol",
            source: "vacancies",
            layout: {
              "text-field": ["get", "point_count"],
              "text-size": 10,
            },
          });

          geojson.features.map((f) => {
            document.getElementById(
              "list-all"
            ).innerHTML += `<div class="list-item">
            <h4>${f.properties["Вакансия"]}</h4>
            <a href='#' onclick="map.flyTo({center: [${f.geometry.coordinates}], zoom: 10})">Найти на карте</a>
            </div><hr>`;
          });

          map.on('idle', () => {
            const features = map.queryRenderedFeatures({
              layers: ["clusters"]
            });
        
            document.getElementById("list-selected").innerHTML = "<h2>Сейчас на карте</h2>"
        
        
            features.map(f => {
              if (f.properties.cluster) {
                const clusterId = f.properties.cluster_id;
                const pointCount = f.properties.point_count;
                map.getSource("vacancies").getClusterLeaves(clusterId, pointCount, 0)
                  .then((clusterFeatures) => {
                    clusterFeatures.map((feature) => document.getElementById("list-selected")
                      .innerHTML += `<div class="list-item">
                      <h4>${feature.properties["Вакансия"]}</h4>
                      <a target="blank_" href='${feature.properties["Ссылка на сайте Картетики"]}'>Подробнее</a>
                      </div><hr>`)
                  });
              } else {
                document.getElementById("list-selected")
                  .innerHTML += `<div class="list-item">
                  <h4>${f.properties["Вакансия"]}</h4>
                  <a target="blank_" href='${f.properties["Ссылка на сайте Картетики"]}'>Подробнее</a>
                  </div><hr>`
              }
            })
          })
        })
        
        map.on("click", "clusters", function (e) {
            map.flyTo({ center: e.lngLat, zoom: 8 });
        });
        
        map.on("mouseenter", "clusters", function () {
            map.getCanvas().style.cursor = "pointer";
        });
        
        map.on("mouseleave", "clusters", function () {
            map.getCanvas().style.cursor = "";
        });
})