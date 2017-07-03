featureService
==============

Development Setup
=====
In order to install on your local machine, you will need to install:

1. Postgres + postgis
2. Node

Once those are installed, go open a bash shell on the project directory and type:

```
psql postgres
```

You will be welcomed with the postgres prompt. Now, create the geofeatures database and switch to it:

```
CREATE DATABASE geofeatures;
\c geofeatures;
```

There enter the SQL statements at the top of these two files (in that order):

```
services/features.js
services/visits.js
```

Make sure the frontend user has access to the geofeatures database:

```
GRANT ALL PRIVILEGES ON DATABASE geofeatures TO frontend;
```

Then, make sure the environment variable for the newly-created user is set:

```
export FEATURES_CONNECTION_STRING='postgres://frontend:[euro4sure]@127.0.0.1/geofeatures'
export PORT=3035
```

Now, make sure the nodejs dependencies are installed:

```
npm install
```

Running
=======
All you need to do is run:

```
node server.js
```
