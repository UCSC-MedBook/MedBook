cd $1 && ROOT_URL="http://localhost:8080" docker-compose -p medbook --x-networking -f ../compose-dev.yml build
