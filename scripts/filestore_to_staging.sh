# create folder and go to it
dump_dir="/home/ubuntu/dump-for-staging"
if [ ! -d "$dump_dir" ]; then
    mkdir $dump_dir
fi;
cd $dump_dir

# zip the filestore
tar zcvf filestore.zip /filestore > /dev/null

# send it to staging

staging="staging.medbook.io"
scp filestore.zip ubuntu@$staging:/home/ubuntu/

# unzip on staging
ssh ubuntu@$staging <<-'ENDSSH'
    cd /home/ubuntu/

    # unzip on staging
    tar xf filestore.zip

    # TODO: move to permenant location and rename with date

    # remove current filestore
    sudo rm -rf /filestore/*

    # filestore on staging
    sudo mv filestore/* /filestore
ENDSSH

echo "done!"
