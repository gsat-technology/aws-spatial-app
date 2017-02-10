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

#####Populate database
```
psql -U docker -h localhost -p 5432 postgres -c "CREATE DATABASE aus_towns;"
psql -U docker -h localhost -p 5432 aus_towns -f aus_towns.dump.sql
```

#####Quick test
psql into docker container and perform a bounding box query of a box spanning the US. This should retrieve all 500 companies.
```
psql -h localhost -U docker -p 5432 aus_towns

#bounding box query like this should get all towns in Tasmania
SELECT * FROM town WHERE town.geom_point && ST_MakeEnvelope(-43.722542, 144.121569, -39.418224, 148.933580, 4326);
```


