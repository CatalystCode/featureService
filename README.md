# featureService #

[![Travis CI status](https://api.travis-ci.org/CatalystCode/featureService.svg?branch=master)](https://travis-ci.org/CatalystCode/featureService)
[![Docker Pulls](https://img.shields.io/docker/pulls/cwolff/featureservice.svg)](https://hub.docker.com/r/cwolff/featureservice/)

## What's this? ##

The featureService is a simple JSON REST API that enables you to work with the
[OpenStreetMap](https://www.openstreetmap.org/) data-set.

Using the featureService you can, for example, discover all the locations or
points of interest in a particular area or look up properties of locations such
as their bounding box, centroid or name.

## Setup ##

### System dependencies ###

In order to run this project on your machine, you will need to install the
following system-level dependencies:

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
- [Docker](https://docs.docker.com/docker-for-windows/)

### Azure resources ###

You will need to set up an instance of [Azure Databases for PostgreSQL](https://azure.microsoft.com/en-us/services/postgresql/) for the featureService.

You can run the following snippet in a Bash shell (such as the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10))
to set up a new instance of Azure Databases for PostgreSQL using the Azure CLI:

```sh
dbname="----CHANGEME----"             # e.g. myfeaturesservicedb
dbuser="----CHANGEME----"             # e.g. admin
dbpassword="----CHANGEME----"         # e.g. featureService1!Rocks
resource_group="----CHANGEME----"     # e.g. myfeaturesserviceresourcegroup
resource_location="----CHANGEME----"  # e.g. eastus

az group create \
  --name="$resource_group" \
  --location="$resource_location"

az postgres server create \
  --name="$dbname" \
  --admin-user="$dbuser" \
  --admin-password="$dbpassword" \
  --resource-group="$resource_group" \
  --location="$resource_location" \
  --performance-tier="Standard"
```

Next, find the database in the [Azure Portal](https://portal.azure.com) and
enable clients to connect to the database. You can either white-list particular
IPs or a range of IPs as shown in the screenshot below:

![Screenshot showing Azure Databases for PostgreSQL firewall configuration](https://user-images.githubusercontent.com/1086421/36278106-c1fd7fe6-1260-11e8-8a22-8311b19f83c7.png)

### Running the application ###

Once the system dependencies are installed and your Postgres database has been
created, you can run the project via Docker:

```sh
docker build -t featureservice .

docker run \
  -p 3035:80 \
  -e FEATURES_DB_USER="$dbuser@$dbname" \
  -e FEATURES_DB_PASSWORD="$dbpassword" \
  -e FEATURES_DB_HOST="$dbname.postgres.database.azure.com" \
  -t featureservice
```

The first time that you run this command, it will take about 90 minutes while
your Postgres on Azure instance is getting populated with over 2GB of global
geo-spatial features and appropriate indices are being built. On subsequent
runs, the start should be instantaneous.

### Using the application ##

After starting the service, you will be able to call the featureService, for
example via the following requests:

- http://localhost:3035/features/name/bogota
- http://localhost:3035/features/point/18.678/15.123
- http://localhost:3035/features/bbox/12.3/22.3/12.4/22.4
- http://localhost:3035/features/id/wof-85975935,wof-404477281?include=bbox,centroid
