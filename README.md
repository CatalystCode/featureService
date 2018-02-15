# featureService #

## Setup ##

In order to run this project on your machine, you will need to set up:

- [Postgres on Azure](https://azure.microsoft.com/en-us/services/postgresql/)
- [Docker](https://docs.docker.com/docker-for-windows/)

Once the system dependencies are installed, you can run the project via Docker:

```sh
docker build -t featureservice .

docker run \
  -p 8080:80 \
  -e FEATURES_DB_USER="----CHANGEME----" \
  -e FEATURES_DB_PASSWORD="----CHANGEME----" \
  -e FEATURES_DB_HOST="----CHANGEME----" \
  -t featureservice
```

The first time that you run this command, it will take a while as your Postgres
on Azure instance is getting populated with over 2GB of global geo-spatial
features.

After starting the service, you will be able to call the featureService, for
example via the following requests:

- http://localhost:8080/features/name/bogota
- http://localhost:8080/features/point/18.678/15.123
- http://localhost:8080/features/bbox/12.3/22.3/12.4/22.4
