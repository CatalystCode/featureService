# featureService #

## Development setup ##

### System dependencies ###

In order to install on your local machine, you will need to install:

- Postgres + postgis ([instructions for Ubuntu 16.04](http://www.gis-blog.com/how-to-install-postgis-2-3-on-ubuntu-16-04-lts/))
- Node ([instructions for Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04))

### Database setup ###

Once the system dependencies are installed, go open a bash shell on the project directory and set up the database:

```sh
cat << EOF | sudo -u postgres psql
CREATE DATABASE features;
CREATE USER frontend WITH login password 'your_password_here';
CREATE USER ops WITH login password 'your_other_password_here';
GRANT ops TO postgres;
GRANT frontend TO postgres;
EOF
sudo -u postgres psql -d features < schema.sql
```

### Application setup ###

First, make sure the environment variables for the service are set:

```sh
export FEATURES_CONNECTION_STRING='postgres://frontend:your_password_here@127.0.0.1/features'
export PORT=3035
```

Now you're ready to install and start the service:

```sh
npm install
node server.js
```

## Production setup ##

You can run the script `scripts/install.sh` to set up a production machine with the featureService and all its dependencies. The script will:

- Install postgres and postgis
- Populate the postgres features database
- Install the featureService
- Autostart the featureService on port 80
