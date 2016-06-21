# Use this script before stopping and restarting the app in order to pre-download the new images

# go to the MedBook parent repo
cd ~/MedBook

# save the last hash of the parent repo
export LAST_HASH=$(git rev-parse HEAD)

# load latest code in parent repo
git pull

# for good measure
./init.sh

# figure out which images are going to be updated
changed_images=$(git diff $LAST_HASH $(git rev-parse HEAD) docker-compose.yml | grep image | grep +)

# check if there are cached images to be downloaded
if [[ ! -z $changed_images ]]; then
    # make sure the images don't start in the next step
    unset MONGO_URL;

    # pull all of those new images
    echo $changed_images | cut -d " " -f 3 | xargs docker run;

    echo "Images downloaded successfully."
else
    echo "All images found locally."
fi

echo "You're all prepped to restart the apps!"
