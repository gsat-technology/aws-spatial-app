import psycopg2

DB_NAME = 'spatial'
USER = 'george'
HOST = 'localhost'
PASSWORD = ''
TABLE = 'termini'

#setup db connection
conn_str = "dbname='{}' user='{}' host='{}' password='{}'".format(DB_NAME, USER, HOST, PASSWORD)
conn = psycopg2.connect(conn_str)


def handler(event, context):
    print(conn)
    return {}
