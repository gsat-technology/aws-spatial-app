import sys
import csv
import psycopg2

csv_file = 'aus_postcodes.csv'

DB_NAME = 'aus_towns'
USER = 'docker'
HOST = 'localhost'
PASSWORD = 'docker'
TABLE = 'town'

#setup connection
conn_str = "dbname='{}' user='{}' host='{}' password='{}'".format(DB_NAME, USER, HOST, PASSWORD)
conn = psycopg2.connect(conn_str)

#truncate the table
cur = conn.cursor()
cur.execute('TRUNCATE TABLE {}'.format(TABLE))
conn.commit()
cur.close()

#insert records
insert_template = """INSERT INTO town(postcode, name, state, lat, lon, geom_point) 
                     VALUES({}, '{}', '{}', {}, {}, st_GeomFromText('POINT({} {})', 4326));"""

cur = conn.cursor()

with open(csv_file,'rU') as fp:
    reader = csv.reader(fp)
    for row in reader:
        postcode = int(row[0].strip())
        name = row[1].strip()
        state = row[2].strip()
        lat = row[3].strip()
        lon = row[4].strip()
        record = insert_template.format(postcode, name, state, lat, lon, lat, lon)
        print record
        cur.execute(record)
        conn.commit()


#output record count
cur.execute('SELECT count(*) FROM {};'.format(TABLE))
rows = cur.fetchall()

for row in rows:
    print "record count:", row[0]

conn.close()

