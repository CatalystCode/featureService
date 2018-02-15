FROM node:6.9

RUN apt-get update && apt-get -qq install -y postgresql-client curl gzip

WORKDIR /app
ADD package.json /app/package.json
RUN npm install

ADD server.js /app/server.js
ADD config.js /app/config.js
ADD controllers /app/controllers
ADD services /app/services
ADD ddl /app/ddl
ADD docker-entrypoint.sh /app/docker-entrypoint.sh

CMD /app/docker-entrypoint.sh

ENV PORT=80
EXPOSE 80

ENV FEATURES_DB_USER=""
ENV FEATURES_DB_PASSWORD=""
ENV FEATURES_DB_HOST=""
ENV FEATURES_DB_PORT="5432"
ENV FEATURES_DB_NAME="features"
ENV FEATURES_DB_DUMP_URL="https://fortiscentral.blob.core.windows.net/locations/dump.fc.gz"
