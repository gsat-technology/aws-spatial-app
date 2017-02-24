#!/bin/bash

BUCKET=
AWS_REGION=
COGNITO_IDENTITY_POOL_ID=
GOOGLE_CLIENT_ID=
GOOGLE_MAPS_API_KEY=

#requires JQ
echo {} | jq

if [ $? -ne 0 ]
then
  echo "please install JQ (https://stedolan.github.io/jq/)"
  exit
fi

echo "getting output values from cloudformation stack"
#get some values from cloudformation outputs
OUTPUTS=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name termini | jq .Stacks[].Outputs)
API_GATEWAY_ENDPOINT=$(echo $OUTPUTS | jq .[] | jq 'select(.OutputKey == "APIGEndpoint").OutputValue' --raw-output)
APIG_ID=$(echo $OUTPUTS | jq .[] | jq 'select(.OutputKey == "APIGID").OutputValue' --raw-output)

echo  "  api gateway stage (LATEST) endpoint: $API_GATEWAY_ENDPOINT"
echo  "  api gateway id: $APIG_ID"

#download the customised API Gateway SDK to include in website resources
echo "downloading api gateway sdk"
aws apigateway get-sdk --region $AWS_REGION --rest-api-id $APIG_ID --stage-name LATEST --sdk-type javascript /tmp/apig.sdk.zip > /dev/null


RAND=$RANDOM
mkdir /tmp/$RAND
echo "copying website resources to /tmp/$RAND"
cp -R www/* /tmp/$RAND

echo "replacing variables"
# #replace variables
sed -i.bak s/{COGNITO_IDENTITY_POOL_ID}/$COGNITO_IDENTITY_POOL_ID/g /tmp/$RAND/js/termini.js
sed -i.bak s/{AWS_REGION}/$AWS_REGION/g /tmp/$RAND/js/termini.js
sed -i.bak s/{API_GATEWAY_ENDPOINT}/$(echo $API_GATEWAY_ENDPOINT | sed -e 's/\\/\\\\/g; s/\//\\\//g; s/&/\\\&/g')/g /tmp/$RAND/js/termini.js
sed -i.bak s/{GOOGLE_CLIENT_ID}/$GOOGLE_CLIENT_ID/g /tmp/$RAND/index.html
sed -i.bak s/{GOOGLE_MAPS_API_KEY}/$GOOGLE_MAPS_API_KEY/g /tmp/$RAND/index.html

echo "adding api gateway sdk to website resources"
#add in the API Gateway SDK
unzip /tmp/apig.sdk.zip -d /tmp/$RAND/js/aws/ > /dev/null

which minify > /dev/null
if [ $? -eq 0 ]
then
  echo "doing minify"
  minify /tmp/$RAND/js/termini.js > /tmp/$RAND/js/termini.js.min
  mv /tmp/$RAND/js/termini.js.min /tmp/$RAND/js/termini.js
else
  echo "'minify' not available"
fi

echo "emptying bucket"
aws s3 rm --recursive s3://$BUCKET --region $AWS_REGION

echo "uploading website resources to S3 bucket"
aws s3 cp --recursive /tmp/$RAND/ s3://$BUCKET --region $AWS_REGION

echo "cleaning up"
rm -r /tmp/$RAND

echo "done"
