#!/bin/bash

#keeps running the test

URL=$1

counter=0

while true
do
    counter=$(( $counter + 1 ))
    echo "request #$counter"
    ./termini_get.sh $URL
    echo ""
    sleep 1
done
