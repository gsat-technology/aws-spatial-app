(Work in Progress)

Example of a simple spatial app for searching for termini (airports, train stations etc.) across the world.

![alt tag](https://raw.githubusercontent.com/gsat-technology/termini/master/resources/web_screenshot.png)

###Acknowledgement

Spatial data in this application was obtained as [csv data](https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat) from Open Flights ([openflights.org/data.html](http://openflights.org/data.html)) which is licensed under the [Database Contents License](http://opendatacommons.org/licenses/dbcl/1.0/).

###High Level Overview

_Architecture diagram (work in progress)_

- Static html/javascript WUI frontend
- AWS API Gateway with EC2 backend to perform spatial queries
- EC2 backend secured with API Gateway client SSL certificate
- Entire setup automated to deploy easily with cloudformation
- Docker-compose runs on EC2 with 2 containers
- Flask app (container 1) logic layer
- Postgis (container 2) performs spatial queries on data


####Backend EC2 instance details

#####Docker

- The flask app which is an API/Logic layer
- The postgres/postGIS database

The database port is exposed to the host so that you can point `psql` (or a desktop client) at it for debugging purposes.

This is the [postgres/gis container](https://github.com/kartoza/docker-postgis). There are different versions around but this one does what I want it to do.

###Deploy on AWS

####Prerequisites

#####Route53 domain

_TODO_

####Configure Google APIs

1. goto: https://console.developers.google.com/apis/library
2. Create a new project (optionally; you could re-use an existing project) by clicking 'Create Project' in the menu bar dropdown.

#####Obtain Google Client ID

3. Left hand menu, select 'Credentials'
4. Click 'Create Credentails'
5. Choose 'OAuth Client ID'
6. If prompted, configure consent screen (at least need to complete Product Name)
7. Choose 'Application Type'='Web application'
8. 'Authorized Javascript Origins'=<name of frontend website>
9. Save

#####Obtain Google Maps API Key

1. Goto 'Library' area and choose 'Google Maps javascript API'
2. Click 'Enable'
3. Goto 'Credentials' area, click 'Create Credentials', choose 'API Key'
4. Make a note of the API Key
5. Click 'Restrict Key'
6. (Optionally) give it a name
7. Under 'key restriction' choose 'HTTP referrers' and enter the fully qualified domain name of the website that this app will be deployed at.



###Run Locally

#####Clone
```
https://github.com/gsat-technology/termini
cd termini
mkdir postgres_data
#postgres_data folder will persist the database when docker isn't running
```

#####Install Docker engine and Docker Compose

- [Docker engine installation](https://docs.docker.com/engine/installation/)
- [Docker compose installation](https://docs.docker.com/compose/install/)

#####Run docker compose
```
docker-compose -f docker-compose.yml -f docker-compose-dev.yml up --build
```

#####Populate database
```
psql -U docker -h localhost -p 5432 postgres -c "CREATE DATABASE spatial;"
psql -U docker -h localhost -p 5432 spatial -f files/spatial.dump.sql
```

#####Quick test
psql into docker container and perform a bounding box query of a box spanning the US. This should retrieve all 500 companies.
```
psql -h localhost -U docker -p 5432 spatial

#bounding box query like this should get all airports/stations in Tasmania
SELECT * FROM termini WHERE termini.geom_point && ST_MakeEnvelope(-43.722542, 144.121569, -39.418224, 148.933580, 4326);
```

##### Run static website frontend

You will need a Google Maps API key. [Here's how to get one](https://developers.google.com/maps/documentation/javascript/get-api-key).
```
cd www
python -m SimpleHTTPServer
```
Open your browser at `localhost:8000`
