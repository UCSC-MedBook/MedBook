# create folder and go to it
dump_dir="/home/ubuntu/dump-for-staging"
if [ ! -d "$dump_dir" ]; then
    mkdir $dump_dir
fi;
cd $dump_dir

# dump the database
mongodump -host mongo

# zip the output to send to the staging server
tar zcvf dump.zip dump

# delete the unzipped dump
rm -rf dump

# send it to staging
staging_ip="13.91.92.109"
scp dump.zip ubuntu@$staging_ip:/home/ubuntu/

# unzip on staging
ssh ubuntu@$staging_ip <<-'ENDSSH'
    cd /home/ubuntu/

    # unzip on staging
    tar xf dump.zip

    # TODO: move to permenant location and rename with date

    # restore on staging
    mongorestore -host mongo-staging
ENDSSH

echo "done!"
