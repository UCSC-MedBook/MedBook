#! /bin/bash

# This script creates a backup in the form of a .zip file containing a
# mongodump and a copy of the filestore folder. The script then sends the
# backup script to the backup box (backup.medbook.io) for safekeeping and
# easy retrieval.
#
# When running this on an Azure box, it's usually helpful to go to /mnt
# becasue there's lots of free space there.
#
# Usage: ./create_backup.sh

# create folder and go to it
date=`date +%Y-%m-%d_%H-%M-%S`
backup_name="./backup.$HOSTNAME.$date"
echo "creating backup" $backup_name

mkdir $backup_name
cd $backup_name

# dump the database
mongodump -d MedBook

# create a copy of the filestore
cp -r /filestore .

# get out ofo the folder
cd ..

# zip the backup to send it to the backup box
tar zcvf $backup_name.zip $backup_name

# send the backup to the backup box
scp $backup_name.zip ubuntu@backup.medbook.io:/backups

# delete the local backup
rm -rf $backup_name
rm -rf $backup_name.zip

echo "done!"
