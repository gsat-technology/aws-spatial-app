import sys
import csv
import psycopg2

DB_NAME = 'fortune500'
USER = 'docker'
HOST = 'localhost'
PASSWORD = 'docker'
TABLE = 'company'

#setup connection
conn_str = "dbname='{}' user='{}' host='{}' password='{}'".format(DB_NAME, USER, HOST, PASSWORD)
conn = psycopg2.connect(conn_str)

#truncate the table
cur = conn.cursor()
cur.execute('TRUNCATE TABLE {}'.format(TABLE))
conn.commit()
cur.close()

#insert records
insert_template = """INSERT INTO company(name, category, location, lat, lon, geom_point) 
                     VALUES('{}', '{}', '{}', {}, {}, st_GeomFromText('POINT({} {})', 4326));"""

cur = conn.cursor()

with open('data.csv','rU') as fp:
    reader = csv.reader(fp)
    for row in reader:
        name = row[0].replace("'", "''")
        category = row[1]
        location = row[3]
        lat = row[6]
        lon = row[7]
        record = insert_template.format(name, category, location, lat, lon, lat, lon)
        cur.execute(record)
        conn.commit()


#output record count
cur.execute('SELECT count(*) FROM {};'.format(TABLE))
rows = cur.fetchall()

for row in rows:
    print "record count:", row[0]

conn.close()

