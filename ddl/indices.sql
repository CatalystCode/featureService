CREATE INDEX features_hull_index ON features USING gist (hull);
CREATE INDEX features_name_lower_index ON features(lower(name));
CREATE INDEX features_namespace_index ON features(lower(split_part(id, '-', 1)));
CREATE INDEX features_layer_lower_index ON features(lower(layer));

CREATE INDEX visits_start_index ON visits (start);
CREATE INDEX visits_userid_index ON visits (user_id);
