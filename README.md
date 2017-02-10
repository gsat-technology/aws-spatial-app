Quickly run a postgis database with Flask API (work in progress)

The setup uses Docker Compose with two containers

- The flask app which is an API/Logic layer
- The postgres/postGIS database

The database port is exposed to the host so that you can point `psql` (or a desktop client) at it for debugging purposes. 

This is the [postgres/gis container](https://github.com/kartoza/docker-postgis). There are different versions around but this one does what I want it to do.

#####Run
```
https://github.com/gsat-technology/spatial
cd spatial
mkdir postgres_data
#postgres_data folder will persist the database when docker isn't running
```

#####Install Docker engine and Docker Compose

- [Docker engine installation](https://docs.docker.com/engine/installation/)
- [Docker compose installation](https://docs.docker.com/compose/install/)

#####Run docker compose
```
docker-compose -f docker-compose.yml up --build
```
#####(optional) Run only postgis in docker container

To run _only_ the postgis container (without the flask app)...

Run using a volume so that if the container crashes you can just run the same docker run command again (with no loss of db data).

Note that postgresql is exposed to the host on port 5432.
```
mkdir -p ~/postgres_data
docker run -v $HOME/postgres_data:/var/lib/postgresql --name "postgis" -p 5432:5432 -d -t kartoza/postgis
```

#####Create database / table

In psql shell, run:

```
DROP DATABASE IF EXISTS fortune500;
CREATE DATABASE fortune500;
\c fortune500;
CREATE EXTENSION postgis;

CREATE TABLE company ( id serial primary key, name  VARCHAR not null, category VARCHAR not null, location VARCHAR not null, lat real not null, lon real not null);
SELECT AddGeometryColumn('company','geom_point','4326','POINT',2);
```
#####Populate the database
Install `psycopg2` python package
```
yum install gcc
pip install psycopg2
```
It's possible that more OS packages are required to install psycopg2 (depending on your OS). This works for CentOS/Amazon Linux.
```
yum install postgresql-libs
yum install postgresql-devel
yum install python-devel
```
Populate
```
python populate.py
```

#####Quick test
psql into docker container and perform a bounding box query of a box spanning the US. This should retrieve all 500 companies.
```
psql -h localhost -U docker -p 5432 fortune500

#bounding box query like this is approximately all of mainland US
SELECT count(*) FROM company WHERE company.geom_point && ST_MakeEnvelope(24.31, -124.43, 49.23, -66.56, 4326);
```

