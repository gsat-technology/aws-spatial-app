import sys
import logging
import json
import psycopg2

from flask import Flask
from flask import request

app = Flask(__name__)

#DB connection
DB_NAME = 'aus_towns'
USER = 'docker'
HOST = 'postgis'  #docker-compose name of container
PASSWORD = 'docker'
TABLE = 'town'

conn_str = "dbname='{}' user='{}' host='{}' password='{}'".format(DB_NAME, USER, HOST, PASSWORD)
conn = psycopg2.connect(conn_str)

@app.route("/town")
def town():

    bbox = request.args.get('boundingBox')

    cur = conn.cursor()
    
    if bbox:
        print str(bbox)
        coord = bbox.split(',')

        #note just using straight up SQL statements (it's just a prototype)
        cur.execute('SELECT * \
                    FROM {} WHERE {}.geom_point && ST_MakeEnvelope({}, {} , {}, {}, 4326);'.format(TABLE, TABLE, coord[0], coord[1], coord[2], coord[3]))
        rows = cur.fetchall()

        d = {
            'count': len(rows),
            'towns': []
        }
    
        for row in rows:
            d['towns'].append({
                               'id': row[0],
                               'postcode': row[1],
                               'state': row[2],
                               'lat': row[3],
                               'lon': row[4] })
        return json.dumps(d)
    else:
        return "please supply filter"
    
       
    

if __name__ == "__main__":
    app.run(host='0.0.0.0')

