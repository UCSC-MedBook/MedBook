# MedBook

Parent repo for the MedBook project.

## Getting started

```sh
# clone this repo
git clone https://github.com/UCSC-MedBook/MedBook
cd MedBook

# initialize and update all submodules
./init.sh

# set up the required environmental variables
export MONGO_URL=mongodb://mongo/MedBook
export MAIL_URL="smtp://EMAIL:PASSWORD@smtp.gmail.com"
export WORLD_URL="medbook.io" # URL where this instance will be deployed

# start all the apps
docker-compose up
```

The last line (`docker-compose up`) assumes you have a seperate box for the mongo database. To run mongo as a docker image, call `./startDev.sh`. 

### Setting up cBioPortal
```sh
# move the sql db to where you can restore it from
mv dump.sql /mnt/mysql-dump

# start the mysql container (as well as the other apps)
docker-compose up

# connect to the sql database and restore from dump.sql
docker exec -it mysql /bin/bash

# restore from dump.sql from within the docker container
mysql -h localhost -u cbio -pP@ssword1;
use cbioportal; # `CREATE DATABASE CBIOPORTAL` if it doesn't exist already
source /mysql-dump/dump.sql;
```
