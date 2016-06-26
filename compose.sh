export COMPOSE_HTTP_TIMEOUT=360
docker-compose -f docker-compose.yml -f docker-compose-dev.yml $*
