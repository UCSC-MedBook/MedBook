#! /bin/bash

# This script creates a backup in the form of a .tgz file containing a
# mongodump and a copy of the filestore folder. The script then sends the
# backup script to the backup box (backup.medbook.io) for safekeeping and
# easy retrieval.
#
# When running this on an Azure box, it's usually helpful to go to /mnt
# becasue there's lots of free space there.
#
# Usage: ./create_backup.sh
#
# Cron command:
# At 3:30 am create a backup and send the logs to /var/log/cron
# 30 3 * * * /home/ubuntu/MedBook/scripts/create_backup.sh > /home/ubuntu/backup_logs.txt 2>&1

# create folder and go to it
date=`date +%Y-%m-%d_%H-%M-%S`
backup_name="./backup.$HOSTNAME.$date"
echo "creating backup" $backup_name

mkdir $backup_name
cd $backup_name

# dump the database
mongo_host="localhost"
if [ $HOSTNAME = "medbook-prod" ] ; then
  mongo_host="mongo"
elif [ $HOSTNAME = "medbook-staging-2" ] ; then
  mongo_host="mongo-staging"
fi
mongodump -d MedBook --host $mongo_host

# create a copy of the filestore
cp -r /filestore .

# get out ofo the folder
cd ..

# tgz the backup to send it to the backup box
tar zcvf $backup_name.tgz $backup_name

# send the backup to the backup box
rsync $backup_name.tgz ubuntu@backup.medbook.io:/backups

# delete the local backup
rm -rf $backup_name
rm -rf $backup_name.tgz

# if backing up from production, restore to staging
if [ $HOSTNAME = "medbook-prod" ] ; then
  echo "restoring on staging..."

  # call the restore script remotely from production
  # NOTE: this will fail if /mnt/ubunt hasn't been set up on staging:
  # sudo mkdir /mnt/ubuntu && sudo chown ubuntu /mnt/ubuntu
  ssh ubuntu@staging.medbook.io "cd /mnt/ubuntu && /home/ubuntu/MedBook/scripts/restore_from_backup.sh $backup_name"

  # check if there were errors restoring
  if [ $? -ne 0 ] ; then
    echo "FAILED TO RESTORE ON STAGING"
    exit 1
  fi
fi

echo "done!"
