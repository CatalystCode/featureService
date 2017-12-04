#!/usr/bin/env bash

# configuration
SCHEMA_VERSION='327df67'
DUMP_VERSION='v2'

# setup
build_dependencies='curl git build-essential'
sudo apt-get update > /dev/null
sudo apt-get upgrade > /dev/null
sudo apt-get install -y ${build_dependencies} > /dev/null

# install postgres
ops_password="$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c32)"
frontend_password="$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c32)"
sudo apt-get install -y postgresql postgis > /dev/null
sudo systemctl enable postgresql
sudo service postgresql start
echo "CREATE DATABASE features;" | sudo -u postgres psql
echo "CREATE USER ops WITH login password 'changeme';" | sudo -u postgres psql
echo "CREATE USER frontend WITH login password 'changeme';" | sudo -u postgres psql
echo "ALTER USER ops WITH password '${ops_password}';" | sudo -u postgres psql
echo "ALTER USER frontend WITH password '${frontend_password}';" | sudo -u postgres psql
echo "GRANT ops TO postgres;" | sudo -u postgres psql
echo "GRANT frontend TO postgres;" | sudo -u postgres psql
curl -sL "https://raw.githubusercontent.com/CatalystCode/featureService/${SCHEMA_VERSION}/schema.sql" | sudo -u postgres psql -qd features

# populate postgres
dbdump="$(mktemp)"
time_download_start="$(date +%s)"; echo "Starting to populate features database, this may take a while"
curl -Lo "${dbdump}.gz" "https://fortiscentral.blob.core.windows.net/locations/feature-service.${DUMP_VERSION}.sql.gz"; gunzip -f "${dbdump}.gz"
time_download_end="$(date +%s)"; echo "Seconds to download dump: $((time_download_end-time_download_start))"
sudo -u postgres psql -qd features < "${dbdump}"
time_insert_end="$(date +%s)"; echo "Seconds to populate database: $((time_insert_end-time_download_end))"
rm "${dbdump}"

# install node
curl -sL 'https://deb.nodesource.com/setup_6.x' | sudo -E bash -
sudo apt-get install -y nodejs > /dev/null

# enable binding to port 80
sudo apt-get install -y authbind > /dev/null
sudo touch '/etc/authbind/byport/80'
sudo chown "${USER}:${USER}" '/etc/authbind/byport/80'
sudo chmod 755 '/etc/authbind/byport/80'

# install app
if [ ! -d featureService ]; then
  git clone --depth 1 'https://github.com/CatalystCode/featureService.git'
  (cd featureService; npm install)
fi

# autostart app
sudo apt-get install -y supervisor > /dev/null
sudo systemctl enable supervisor
sudo service supervisor start
sudo tee '/etc/supervisor/conf.d/featureService.conf' > /dev/null << EOF
[program:featureService]
command=/usr/bin/authbind "$(which node)" "$(readlink -f featureService/server.js)"
autostart=true
autorestart=true
startretries=3
stderr_logfile=/tmp/featureService.err.log
stdout_logfile=/tmp/featureService.out.log
user=${USER}
environment=PORT=80,FEATURES_CONNECTION_STRING="postgres://frontend:${frontend_password}@127.0.0.1/features"
EOF
sudo supervisorctl reread
sudo supervisorctl update

# harden ssh
sudo tee '/etc/ssh/sshd_config' > /dev/null << EOF
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
UsePrivilegeSeparation yes
KeyRegenerationInterval 3600
ServerKeyBits 1024
SyslogFacility AUTH
LogLevel INFO
LoginGraceTime 120
PermitRootLogin no
StrictModes yes
RSAAuthentication yes
PubkeyAuthentication yes
IgnoreRhosts yes
RhostsRSAAuthentication no
HostbasedAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
PasswordAuthentication no
X11Forwarding yes
X11DisplayOffset 10
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
UsePAM no
EOF
sudo systemctl reload ssh

# cleanup
sudo apt-get remove -y ${build_dependencies} > /dev/null
sudo apt-get autoremove -y > /dev/null
sudo apt-get upgrade -y
