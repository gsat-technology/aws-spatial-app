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

    try:
        cur.execute(query_string)
        rows = cur.fetchall()
        return rows
    except Exception, e:
        pass

    cur.close()
    return False


def validate_input(geo_data, type):
    #tests that inputs are at least numerical

    values_lst = []

    try:
        if type == 'bbox':
            for c in geo_data.split(','):
                values_lst.append(c)

        elif type == 'polygon':

            latlng = geo_data.split(',')

            for ll in latlng:
                for c in ll.split(' '):
                    values_lst.append(c)

        elif type == 'circle':
            v = geo_data.split(',')

            for ll in v:
                print >> sys.stderr, ll
                values_lst.append(ll)

        for v in values_lst:
            float(v) + 1
    except:
        return False

    return True


@app.route("/termini")
def termini():

    bbox = request.args.get('boundingBox')
    polygon = request.args.get('polygon')
    circle = request.args.get('circle')

    query = ''

    if bbox:
        print >> sys.stderr, bbox
        coord = bbox.split(',')

        if validate_input(bbox, 'bbox'):
            #query = "SELECT * FROM %s WHERE %s.geom_point && ST_MakeEnvelope(%s, %s, %s, %s, 3857);" % \
            #        (TABLE, TABLE, coord[0], coord[1], coord[2], coord[3])

            query = "SELECT * FROM %s WHERE %s.geom_point && \
                     ST_SetSRID(ST_MakeBox2D(ST_Point(%s, %s), ST_Point(%s , %s)),3857)" % (TABLE, TABLE, coord[0], coord[1], coord[2], coord[3])


    elif polygon:
        print >> sys.stderr, 'polygon: ' + polygon
        if validate_input(polygon, 'polygon'):

            query = "SELECT * FROM termini WHERE ST_CONTAINS(ST_GeomFromText('POLYGON((%s))', 3857), geom_point);" % (polygon)

    elif circle:
        print >> sys.stderr, circle
        if validate_input(circle, 'circle'):
            query = "select * FROM termini WHERE ST_Point_Inside_Circle(termini.geom_point, %s);" % (circle)

    msg_jsn = None

    status = 200

    if query:
        r = do_query(query)

        if r:
            result = process_result(r)
            msg_jsn = result
        else:
            msg_jsn = {"error": "could not execute query"}
            status = 500

    else:
        msg_jsn = {"usage": "query params: ['boundingBox=', 'polygon=', 'circle=']"}
        status = 400

    response = Response(json.dumps(msg_jsn), status=status)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


if __name__ == "__main__":
    app.run(host='0.0.0.0')
