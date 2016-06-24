export COMPOSE_HTTP_TIMEOUT=360

set_up_env="/home/ubuntu/set_up_environment.sh"
if test -f $set_up_env; then
    source $set_up_env
else
    export MONGO_URL="mongodb://mongo:27017/MedBook"
fi

docker-compose -f docker-compose.yml -f docker-compose-dev.yml up
