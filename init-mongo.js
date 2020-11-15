db.createUser({
  user: "mtgAdmin",
  pwd: "manadork",
  roles: [
    {
      role: "readWrite",
      db: "mtg"
    }
  ]
});

db.createCollection("cards");
