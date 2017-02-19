import sys
import logging
import json
import psycopg2

from flask import Flask
from flask import request
from flask import Response

app = Flask(__name__)

#DB connection
DB_NAME = 'spatial'
USER = 'docker'
HOST = 'postgis'  #docker-compose name of container
PASSWORD = 'docker'
TABLE = 'termini'

conn_str = "dbname='{}' user='{}' host='{}' password='{}'".format(DB_NAME, USER, HOST, PASSWORD)
conn = psycopg2.connect(conn_str)

def process_result(rows):
    data = {
        'count': len(rows),
        'termini': []
    }

    for row in rows:
        #print >> sys.stdout, row
        data['termini'].append({
                           'id': row[0],
                           'name': row[1],
                           'city': row[2],
                           'country': row[3],
                           'iata': row[4],
                           'icao': row[5],
                           'latitude': row[6],
                           'longitude': row[7],
                           'altitude': row[8],
                           'tz_olson': row[9],
                           'type': row[10] })

    return data


def do_query(query_string):
    print >> sys.stderr, query_string
    cur = conn.cursor()
    cur.execute(query_string)
    rows = cur.fetchall()
    cur.close()
    return rows


@app.route("/termini")
def termini():

    bbox = request.args.get('boundingBox')
    polygon = request.args.get('polygon')
    circle = request.args.get('circle')

    print >> sys.stderr, bbox
    print >> sys.stderr, polygon

    query = ''

    if bbox:
        print str(bbox)
        coord = bbox.split(',')

        #note just using straight up SQL statements (it's just a prototype)
        query = 'SELECT * \
                    FROM {} WHERE {}.geom_point && ST_MakeEnvelope({}, {}, {}, {}, 3857);'.format(TABLE, TABLE, coord[0], coord[1], coord[2], coord[3])


    elif polygon:
        query = "SELECT * FROM termini WHERE ST_CONTAINS(ST_GeomFromText('POLYGON(({}))', 3857), geom_point);".format(polygon)

    elif circle:
        query = "select * FROM termini WHERE ST_Point_Inside_Circle(termini.geom_point, {});".format(circle)
    else:
        return {"error": "query needed"}


    result = process_result(do_query(query))

    response = Response(json.dumps(result))
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response




if __name__ == "__main__":
    app.run(host='0.0.0.0')
