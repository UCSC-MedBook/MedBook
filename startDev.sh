export MONGO_URL="mongodb://mongo:27017/MedBook"
docker-compose -f docker-compose.yml -f docker-compose-dev.yml up
