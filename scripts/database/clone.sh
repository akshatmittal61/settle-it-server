echo "Cloning prod database to local"

[ ! -f .env ] && echo "
No .env file found.
Please create .env file with the DB_URI environment variable
" && exit 1

DB_NAME="settleit-prod"

# read .env file for dev configs
export $(cat .env | grep -v '#' | awk '/=/ {print $1}')

# check if db exists
if [ "$(mongosh --quiet --eval "db.getMongo().getDBNames().indexOf('$DB_NAME')")" == "1" ]; then
  mongosh --quiet --eval "db.getMongo().dropDatabase('$DB_NAME')"
fi

mongodump --uri="$DB_URI"
mongorestore --db $DB_NAME ./dump/settleit/

rm -rf dump/
