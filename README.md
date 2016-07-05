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
