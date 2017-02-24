#!/bin/bash

#does spatial query using a 20 point polygon which roughly outlines australia
#outputs (1) how long it takes to execute the curl and (2) the http response status e.g
#0.13    200

#usage: ./termini_get.sh <endpoint>
#where endpoint is something like https://spatialbackend.your.domain/termini

#to continually run use:
# while true ; do ./termini_get.sh <endpoint> ; done

#if pointed at API Gateway, then authentication with IAM needs to be disabled
#if pointed at EC2, Nginx client SSL authentication needs to be disabled

ENDPOINT=$1

#uses a random /tmp/$RAND dir so that it can write time/status. This way this script
# can be run in parallel (multiple bashes) without sharing the same write-space
RAND=$RANDOM

#rough outline of Australia
QUERY="?polygon=-44.33956524809714%20146.07421875%2C\
-41.11246878918085%20141.85546875%2C\
-36.7388841243943%20135.17578125%2C\
-33.87041555094182%20129.90234375%2C\
-35.17380831799957%20121.11328125%2C\
-36.597889133070204%20115.13671875%2C\
-31.80289258670675%20113.02734375%2C\
-24.04646399966657%20110.21484375%2C\
-15.792253570362446%20116.015625%2C\
-12.039320557540572%20125.15625%2C\
-9.44906182688142%20131.66015625%2C\
-9.795677582829732%20140.44921875%2C\
-12.897489183755892%20149.0625%2C\
-21.28937435586042%20153.6328125%2C\
-28.76765910569124%20156.09375%2C\
-33.28461996888768%20156.26953125%2C\
-37.300275281344305%20153.80859375%2C\
-41.37680856570234%20151.5234375%2C\
-43.707593504052944%20149.0625%2C\
-44.33956524809714%20146.07421875"

URL=$ENDPOINT$QUERY
#echo "$URL"

{ time -p curl  -s -o /dev/null -w "%{http_code}" $URL 2>&1 > /tmp/$RAND.status ; } 2> /tmp/$RAND.time

REAL_TIME=$(cat /tmp/$RAND.time | head -n 1 | awk '{print $2}')
STATUS=$(cat /tmp/$RAND.status)
echo -e "$REAL_TIME\t$STATUS"
