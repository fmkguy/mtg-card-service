# MTG Card Service
A simple [Node.js](https://nodejs.org/)/[Express](http://expressjs.com/) API server that provides easy-to-consume access to a local [MongoDB](https://www.mongodb.com/) database. The data is compiled using the open-source [MTGJSON](https://mtgjson.com/) project while the card image urls are sourced from [Scryfall's](https://scryfall.com/docs/api/images) image project.

## Prerequisites
It's simplest to use [Docker](https://www.docker.com/) in combination with Docker-Compose. You'll need to have both installed to take full advantage of the dev environment.

* [x] Docker
* [x] Docker-Compose

## Initialize
Start all services by moving into the project directory and running the `docker-compose up --build` command.

```
$ cd <project directory>
$ docker-compose up --build
```

### **Database**
The database should initialize automatically on the `docker-compose up` command (thanks to the `init-mongo.js` file). If there's a problem with the user or database initilization, see Troubleshooting below.

#### **Seed the Database**
You're not going to see much if we don't actually populate that database.

In the `./data` directory, you'll find a couple of scripts to help with this process.

Using our `api` service, this will be pretty painless. In a new terminal window, run the following:

```
$ docker-compose exec api bash data/seed.sh
```

It's going to automatially download the most up-to-date `AllPrintings.json` and `AllPrices.json` files from MTGJSON, unzip them, then open up a stream to parse the files and save the Card and Price documents in our database. After all of the  this process, the script is also trying to fetch the card `imageUrls` from Scryfall. When it's done running, it will remove the JSON files and we should be left with a clean, local database of all MTG cards.

> The initialization of the "Fetching card images..." stage of the seed script will take several seconds as it builds a list of every item in the database

To confirm, open your browser to `http://localhost:8081/` to use the Mongo Express frontend. Select the "mtg" database and the "cards" collection.

If all went well, you should see ~55,000 entries!

<p style="font-size: 1.6em; text-align:center;"><em>CONGRATULATIONS!</em></p>

#### **Price Updates**

Price data is initialized during the `seed.sh` script, but to update the prices collection, you can manually run the prices script.

```
$ docker-compose exec api node data/prices.js
```

##### Troubleshooting
1. Trouble creating a database, db user, or db collection:

  With the service running, in a new terminal window enter the following:

  ```
  $ docker-compose exec --rm -u root -p root mongo mongo
  ```

  That will connect to and open the mongo shell as the root user (using the credentials defined in the `docker-compose.yml` file in the mongo service environment variables).

  Proceed by creating a new user and assigning the appropriate role permissions.

  ```
  $ db.createUser({ user: "mtgAdmin", pwd: "manadork", roles: [{ role: "readWrite", db: "mtg" }] });
  ```

  > If you decide to change the username and password values, you'll need to update the `api` service environment variables in the `docker-compose.yml` file.

2. Trouble with getting card images:

  It's possible some card images will fail to load during this process. If that happens, there's another script that will find all Card entries with missing images and attempt to re-run the fetch to Scryfall's API.

  ```
  $ docker-compose exec api node data/fixMissingImages.js
  ```

### **API**
URL defaults to `http://localhost:3000/`. `PORT` can be configured, either in a `.env` file or in the `docker-compose.yml` environment variables.

When installing new npm packages, run the commands in the container directly to avoid OS/permissions conflicts and cluttering your host machine with node modules.

```
$ docker-compose run --rm api npm i --save <package name>
```

> The command above will spin up (`docker-compose run`) a new API container (the `api` service created in the `docker-compose.yml` file), but will immediately stop and remove itself (`--rm`) after finishing its task. The package install works because of the volume bind mounts also created in the `docker-compose.yml` file.

> To run a command in an already-running docker container, use `docker-compose exec <flags> <service> <command>` instead.

## Endpoints Reference
### Cards
```
GET  /api/v1/cards
POST /api/v1/cards
```

Both of the methods listed will `GET` a list of cards, but allow for different querying option. The `GET` method uses URL params to query the API, while the `POST` method makes use of the same params but in a JSON body.

These requests are equivalent:

```
/api/v1/cards?name=Zacama&colors=WRG
```

```js
// request:
{
  "query": {
    "name": "Zacama",
    "colors":"WRG"
  }
}
```
Both requests return results in the following format:
```js
// results:
{
  "data": {
    "cards": [{Card}],
    "cardsCount": Number
  }
}
```

#### **Available query params**
```
defaults:
  limit           20  Limits the returned number of cards (setting to -1 forces
                      "limitless" results--use with caution)
  skip             0  Used in combination with `limit` to implement stateless
                      pagination
  d, distinct   uuid  [uuid|name]<string>
  s, sort             <string> Accepts a field name to sort the returned distinct
                      values (Currently, "releaseDate" is the only field to sort by)
  o, order       asc  [asc|desc]<string>

params:
  COLORS
  c, colors
  id, colorIdentity   {[<=,>=,=]?}{[W|U|B|R|G|C]}
                      Find cards that are in certain colors or have a color identity.
                      Use the abbreviated color letters or "c" for "colorless".
                      Operator is optional, defaults to equality. Color values are
                      case-insensitive.
                      Examples: "<=RG", "C", "wubrg"
  
  NUMBERS
  cmc                 {[>,>=,<,<=,=]?}<number>
                      Find cards of a certain converted mana cost. Operator is 
                      optional, defaults to equality.
  power               {[>,>=,<,<=,=]?}{[number,*]}
                      Search for cards where creature's power is <number> or "*".
                      Operator is optional, defaults to equality.
  toughness           {[>,>=,<,<=,=]?}{[number,*]}
                      Search for cards where creature's power is <number> or "*".
                      Operator is optional, defaults to equality.

  WORD SEARCH
  k, keywords         <string> Comma-seprated list of keywords to search.
  l, leadership       {[brawl,commander,oathbreaker]}
                      Find cards that can be your "Commander" in the specified format.
  name                <string> Search for card with specific name
  r, rarity           {[>,>=,<,<=,=]?}{[common, uncommon, rare, mythic]}
                      Find cards based on rarity. Using operator will return cards in
                      specified range. Operator is optional, defaults to equality.
  types               <string> Comma-separated list of of types to check.
  subtypes            <string> Comma-separated list of of types to check.
  supertypes          <string> Comma-separated list of of types to check.
  t, type             <string> Useful when being more specific.
                      Example: "Legendary Creature"
  q                   <string> Searches all cards' name, text, and type fields.
```

### Single Card
```
GET /api/v1/cards/:uuid
```

Returns all data for a single card based on the MTGJSON `uuid`.

### Sets
```
GET /api/v1/sets
```

Returns complete list of MTG Sets.

```js
// response:
{
  "data": {
    sets: [{Set}]
  }
}
```

### Single Set

```
GET /api/v1/sets/:code
```

Returns all data for a single set based on the set code.

```js
// response:
{
  "data": {Set}
}
```

### Collection
```
POST /api/v1/collection
```

Accepts an array of card `uuid` strings and returns the full sorted list of cards.

> **Note:** `limit` and `offset` aren't available on this endpoint. The API simply returns the complete list of requested cards.

```js
// request:
{
  "query": {
    "cards": [String]
  }
}
```

```js
// response:
{
  "data": {
    "cards": [{Card}],
    "cardsCount": Number
  }
}
```