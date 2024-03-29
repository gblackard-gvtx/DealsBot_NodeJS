# DealsBot_NodeJS

DealsBot is a tool for people to programatically find deals via retailer/affiliate APIs and publish them to an aggregated database. From there a Frontend of your can be added to promote your own site.
DealsBot is written in Typescript and tested in nodejs version 14.

## Getting Started with Walmart Affiliate API

First you will need to create a WalmartIO account. 

- Go to [WalmartIO](https://www.walmart.io)
- Click Get Started
- Click "Begin creating your account" at the bottom of the page. 

Once your account is created we need to get 2 key pieces of data.

- ConsumerID - This is a UUID generated by Walmart and is used in every API call and as part of your signature. 
- Key Version - This is the version of the public key you will provide to WalmartIO for verification
- Optional but recommended is the ImpactID.
 The ImpactId is your affiliate id and will allow you to receive credit on sales via the affiliate program.
 You can sign up [here](https://affiliates.walmart.com/) 
 
From the WalmartIO Dashboard click "Create Application". Fill in the data and press "Submit Form".
Your application will now display on the WalmartIO Dashboard. You will notice that ConsumerID and Key Version are blank. We must upload an RSA Public Key for these to Generate.
**Note:** This part of the setup was the most frustrating, you must have a perfectly formatted RSA key pair and Private Key.pem.

**Tools needed to create a properly formatted RSA keypair.**

- [PuTTYgen](https://www.puttygen.com/)
- OpenSSL - I used the versions installed with Git.

WalmartIO does give instructions on how to generate [keypair](https://www.walmart.io/key-tutorial), but they are a little lacking.

- Open CMD and Path to where you have Git installed we are looking for the folder where openssl.exe lives. In my case it was "D:\Program Files\Git\usr\bin".
- Paste the following in CMD: openssl genrsa -des3 -out my_rsa_key_pair 2048
- -des3 will require you to create a password.  Make sure you put this somewhere safe like your .env file(and gitignore it. ).
-  Next open Puttygen and load your key pair. Once loaded copy the public key and paste it into the public key upload on WalmartIO dashboard. 
- Click Conversion on Puttygen  then export OpenSSHKey. This file will be in a .pem file and will be used to sign the api headers. 

[### Walmart Affiliate API](src/walmartAffiliate/walmartAffiliate.md)
-----
This is the implmentation of the walmart affiliate api.
