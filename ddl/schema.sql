CREATE EXTENSION postgis;

------------------------------------------------------------------------------
-- for services/features.js
------------------------------------------------------------------------------

CREATE TABLE features
(
  id                character varying(64)        NOT NULL,

  name              character varying(128)       NOT NULL,
  layer             character varying(32)        NOT NULL,

  properties        jsonb                        NOT NULL,

  hull              geometry                     NOT NULL,

  created_at        timestamp                    NOT NULL,
  updated_at        timestamp                    NOT NULL,

  CONSTRAINT nodes_pkey PRIMARY KEY (id),

  CONSTRAINT enforce_srid_hull CHECK (st_srid(hull) = 4326)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON features TO frontend;

------------------------------------------------------------------------------
-- for services/visits.js
------------------------------------------------------------------------------

CREATE TABLE visits
(
  id                    uuid                         NOT NULL,
  user_id               character varying(128)       NOT NULL,
  feature_id            character varying(64)        NOT NULL,

  start                 bigint                       NOT NULL,
  finish                bigint                       NOT NULL,

  created_at            timestamp                    NOT NULL,
  updated_at            timestamp                    NOT NULL,

  CONSTRAINT visits_pkey PRIMARY KEY (id)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON visits TO frontend;
