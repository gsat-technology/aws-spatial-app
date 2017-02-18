import sys
import csv
import psycopg2

csv_file = 'airports-extended.dat'

DB_NAME = 'spatial'
USER = 'docker'
HOST = 'localhost'
PASSWORD = 'docker'
TABLE = 'termini'

#setup connection
conn_str = "dbname='{}' user='{}' host='{}' password='{}'".format(DB_NAME, USER, HOST, PASSWORD)
conn = psycopg2.connect(conn_str)

#truncate the table
cur = conn.cursor()
cur.execute('TRUNCATE TABLE {}'.format(TABLE))
conn.commit()
cur.close()

#insert records
insert_template = """INSERT INTO termini(id, name, city, country, iata, icao, latitude, longitude, altitude, timezone, type, geom_point)
                     VALUES({}, '{}', '{}', '{}', '{}', '{}', {}, {}, {}, {}, '{}', st_GeomFromText('POINT({} {})', 3857));"""

cur = conn.cursor()

with open(csv_file,'rU') as fp:
    reader = csv.reader(fp)
    for row in reader:

        print row

        id = int(row[0])
        name = row[1]
        city = row[2]
        country = row[3]
        iata = row[4]
        icao = row[5]
        latitude = float(row[6])
        longitude = float(row[7])
        altitude = float(row[8])
        tz_olson = row[11]
        type = row[12]

        if iata == '\N':
            iata = None

        if icao == '\N':
            icao = None

        if tz_olson == '\N':
            tz_olson = None

        cur.execute("INSERT INTO termini\
                   (id, name, city, country, iata, icao, latitude, \
                   longitude, altitude, tz_olson, type, geom_point) \
                   VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, st_GeomFromText('POINT(%s %s)', 3857));",
                   (id, name, city, country, iata, icao, latitude, longitude, altitude, tz_olson, type, latitude, longitude))
        conn.commit()


#output record count
cur.execute('SELECT count(*) FROM {};'.format(TABLE))
rows = cur.fetchall()

for row in rows:
    print "record count:", row[0]

conn.close()
