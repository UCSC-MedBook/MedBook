# Use this script before stopping and restarting the app in order to pre-download the new images

# make sure the images don't start in the next step
unset MONGO_URL;

# try to start all images in the docker-compose.yml file, thus forcing them to be pulled if they're not found locally
grep image docker-compose.yml | grep -v "#" | tr "\t" " " | cut -d " " -f 6 | while read -r line; do
    docker pull $line
done

echo "You're all prepped to restart the apps!"
