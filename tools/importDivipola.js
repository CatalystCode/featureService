/*
To generate the data files that get imported into the featureService by this script,
please execute the following helper script:

```
#!/usr/bin/env bash
set -e

mkdir divipola && cd divipola

geojson_dir='geojson'
shapefile_dir='shp'

# The list of URLs below was generated via the following steps:
# 1) Go to https://geoportal.dane.gov.co/v2/?page=elementoDescargaMGN and switch to the 'Vigencia 2012' tab
# 2) Open the Javascript console and execute:
#
# var zips = new Set();
# var links = document.getElementsByTagName('a');
# for (var i = 0; i < links.length; i++) {
#  var link = links[i];
#  if (link.href.indexOf('.zip') !== -1 &&
#      link.href.indexOf('MGN2012_') !== -1) {
#   zips.add(link.href);
#  }
# }
# console.log(JSON.stringify(Array.from(zips)))
#
# 3) Copy-paste console output into the variable
#
shapefile_urls='http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_91_AMAZONAS.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_05_ANTIOQUIA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_81_ARAUCA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_88_SAN_ANDRES.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_08_ATLANTICO.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_11_BOGOTA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_13_BOLIVAR.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_15_BOYACA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_17_CALDAS.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_18_CAQUETA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_85_CASANARE.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_19_CAUCA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_20_CESAR.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_27_CHOCO.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_23_CORDOBA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_25_CUNDINAMARCA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_94_GUAINIA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_95_GUAVIARE.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_41_HUILA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_44_LA_GUAJIRA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_47_MAGDALENA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_50_META.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_52_NARI%c3%91O.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_54_NORTE_SANTANDER.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_86_PUTUMAYO.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_63_QUINDIO.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_66_RISARALDA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_68_SANTANDER.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_70_SUCRE.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_73_TOLIMA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_76_VALLE_CAUCA.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_97_VAUPES.zip','http://www.dane.gov.co/DescargaMGN/Departamento/MGN2012_99_VICHADA.zip'

echo 'Now downloading shapefiles...'
if ! (command -v curl >/dev/null); then sudo apt-get install -y curl > /dev/null; fi
if ! (command -v unzip >/dev/null); then sudo apt-get install -y unzip > /dev/null; fi
mkdir -p '$shapefile_dir' > /dev/null
cd '$shapefile_dir'
echo '$shapefile_urls' | tr ',' '\n' | while read shapefile_url; do
  curl -sLO '$shapefile_url'
done
for shapefile in *.zip; do
  unzip '$shapefile'
done
cd -

echo 'Now converting to geojson...'
if ! (command -v ogr2ogr >/dev/null); then (sudo add-apt-repository -y ppa:ubuntugis/ppa && sudo apt-get update && sudo apt-get install -y gdal-bin) > /dev/null; fi
mkdir -p '$geojson_dir' > /dev/null
find '$shapefile_dir' -type d -name '[0-9]*' | while read region_path; do
  region_name='$(basename $region_path)'
  find '$region_path/ADMINISTRATIVO' -type f -name '*.shp' | while read shp_path; do
    shp_type='$(basename $shp_path .shp)'
    ogr2ogr -f 'GeoJSON' -t_srs 'crs:84' '$geojson_dir/$region_name-$shp_type.geojson' '$shp_path'
  done
done
```

Note that this is a quite slow process and may take several hours to complete since the script downloads
and munges over 100 GB of data.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const services = require('../services');

const DATA_LANGUAGE = 'es';

function processFeature(placeType, geojson, i) {
    const type = geojson.type;
    if (type !== 'Feature') {
        return Promise.reject(`feature ${i} has bad feature type: ${type}`);
    }

    const geometry = geojson.geometry;
    if (!geometry) {
        return Promise.reject(`feature ${i} has no geometry`);
    }

    let id;
    if (placeType === 'locality') {
        id = geojson.properties.CPOB_CCNCT;
    } else if (placeType === 'county') {
        id = `${geojson.properties.DPTO_CCDGO}${geojson.properties.MPIO_CCDGO}`;
    } else if (placeType === 'region') {
        id = geojson.properties.DPTO_CCDGO;
    }
    if (!id) {
        return Promise.reject(`feature ${i} has no id`);
    }

    const name = geojson.properties.CPOB_CNMBR || geojson.properties.MPIO_CNMBR || geojson.properties.DPTO_CNMBR;
    if (!name) {
        return Promise.reject(`feature ${i} has no name`);
    }

    const feature = {
        id: `divipola-${id}`,
        name: name,
        layer: placeType,
        hull: geometry,
        properties: {
            names: {
                DATA_LANGUAGE: name,
            },
            tags: [
                'boundary:administrative',
                `placetype:${placeType}`
            ]
        }
    };

    return new Promise((resolve, reject) => {
        services.features.upsert(feature, (err) => {
            if (err) return reject(err);

            console.log(`done with feature ${i}: ${feature.id},${feature.name}`);
            resolve();
        });
    });
}

function processFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if (err) return reject(`error reading file: ${err}`);

            let featureCollection;
            try {
                featureCollection = JSON.parse(data);
            } catch(e) {
                return reject(`failed to parse: ${file}`);
            }

            const type = featureCollection.type;
            if (type !== 'FeatureCollection') {
                return reject(`not a feature collection: ${file}`);
            }

            const features = featureCollection.features;
            if (!features || !features.length) {
                return reject(`no features in collection: ${file}`);
            }

            let placeType;
            if (file.indexOf('MGN_RUR_CENTRO_POBLADO') !== -1) {
                placeType = 'locality';
            } else if (file.indexOf('MGN_ADM_MPIO_GRAFICO') !== -1) {
                placeType = 'county';
            } else if (file.indexOf('MGN_ADM_DPTO_POLITICO') !== -1) {
                placeType = 'region';
            } else {
                return reject(`unable to determine placeType for ${file}`);
            }

            Promise.all(features.map((feature, i) => processFeature(placeType, feature, i)))
            .then(resolve)
            .catch(console.log);
        });
    });
}

function processDirectory(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) return reject(err);

            Promise.all(files.map(file => processFile(path.resolve(dir, file))))
            .then(resolve)
            .catch(console.log);
        });
    });
};

services.init(err => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    processDirectory('./divipola/geojson')
    .then(() => {
        console.log('all done');
        process.exit(0);
    })
    .catch((err) => {
        console.log(`finished with error: ${err}`);
        process.exit(1);
    });
});
