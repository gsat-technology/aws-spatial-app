#!/bin/bash

FQDN=$1

apt-get install -y nginx
service nginx start
apt-get install -y letsencrypt
letsencrypt certonly -a webroot --webroot-path=/var/www/html -d $FQDN

#replace default host config with pre-configured file and dynamically configure server_name
sed -e s/{SERVER_NAME}/$FQDN/g ./spatial/ec2-conf/default > /etc/nginx/sites-enabled/default
