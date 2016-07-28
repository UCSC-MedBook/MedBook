#! /bin/bash

# WARNING: this will DELETE EVERYTHING, including mongo and the filestore.
#
# This script restores from a specific backup. First, it pulls the backup
# from our backup box (backup.medbook.io). Then it restores both mongo
# and the filestore from that backup.
#
# When running this on an Azure box, it's usually helpful to go to /mnt
# becasue there's lots of free space there.
#
# Usage: ./restore_from_backup.sh backup.medbook-prod.2016-07-28_13-12-28

backup_name=$1

# make sure they provide a backup to grab
if [ -z "$backup_name" ] ; then
  echo "Please specify a specific backup from which to restore."
  echo ""
  echo "Usage: ./restore_from_backup.sh backup.medbook-prod.2016-07-28_13-12-28";
  exit 1;
fi

# download the backup from the backup box
rsync "ubuntu@backup.medbook.io:/backups/$backup_name.tgz" .

# if the download failed, tell the user
if [ $? -ne 0 ] ; then
  echo "No backup found: $backup_name"
  exit 1;
fi

# uncompress the backup, delete compressed backup
tar zxf "$backup_name.tgz"
rm -rf "$backup_name.tgz"

# go to the backup folder
cd "$backup_name"

# restore mongo
mongo_host="localhost"
if [ $HOSTNAME = "medbook-prod" ] ; then
  mongo_host="mongo"
elif [ $HOSTNAME = "medbook-staging-2" ] ; then
  mongo_host="mongo-staging"
fi
mongo MedBook -h $mongo_host --eval "db.dropDatabase()"
mongorestore -h $mongo_host

# restore the filestore
rsync -r filestore/ /filestore

# delete the uncompressed local backup
cd ..
rm -rf "$backup_name"
