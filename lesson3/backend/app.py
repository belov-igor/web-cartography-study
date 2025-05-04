from flask import Flask, Response
import sqlite3
import json
# import time


app = Flask(__name__)

DB_LOCATION = "cities_index.sqlite"


@app.route("/cities/<year>") # путь API, к которому обращается пользователь
def cities_by_year(year): # функция, которая будет выполняться при обращении
    # start_time = time.time()
    db = sqlite3.connect(DB_LOCATION) # подключение к базе данных
    db.row_factory = sqlite3.Row # указание, что в строках мы будем сохранять название колонки и значение
    cursor = db.execute("SELECT * FROM cities WHERE year = ?", (year,)) # выполняем запрос к базе, подставляя год, введённый пользователем
    cities = cursor.fetchall() # забираем результат запроса
    cursor.close() # закрываем запрос
    db.close() # закрываем подключение
    geojson = { # приводим к формату GeoJSON
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [row["longitude"], row["latitude"]],
                },
                "properties": dict(row),
            }
            for row in cities
        ],
    }
    r = Response( # формируем ответ
        json.dumps(geojson, ensure_ascii=False), # ensure_ascii=False, чтобы нормально отображалась кириллица
        mimetype="application/json", # указываем тип данных
        headers={"Access-Control-Allow-Origin": "*"}
    )
    # print("--- %s seconds ---" % (time.time() - start_time))
    return r

@app.route("/city/<id>")
def city_by_id(id):
    # start_time = time.time()
    db = sqlite3.connect(DB_LOCATION)
    db.row_factory = sqlite3.Row
    cursor = db.execute("SELECT * FROM cities WHERE id = ?", (id,))
    city = cursor.fetchone()
    cursor.close()
    db.close()
    r = Response(
        json.dumps(dict(city), ensure_ascii=False),
        mimetype="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )
    # print("--- %s seconds ---" % (time.time() - start_time))
    return r

@app.route("/years")
def available_years():
    db = sqlite3.connect(DB_LOCATION)
    cursor = db.execute("SELECT DISTINCT year FROM cities ORDER BY year DESC")
    years = [int(row[0]) for row in cursor.fetchall()]
    cursor.close()
    db.close()
    r = Response(
        json.dumps(list(years), ensure_ascii=False),
        mimetype="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )
    return r

if __name__ == "__main__":
    app.run(port=5050)