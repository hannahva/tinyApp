const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

//template engine
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get("/", (request, response) => {
  response.end("Hello!");
});

// has to be above other urls/... pages to not
//get treated as /:id or /:shortURL by LocalHost
app.get("/urls/new", (request, response) => {
  response.render("urls_new"); //form to submit link to shorten
})

app.get("/urls.json", (request, response) =>{
  response.json(urlDatabase);
});

//list of shortened and their corresponding long Urls
//urls_index.ejs - displays link to shorten a url (DEAD)
app.get("/urls", (request, response) => {
  let templateVars = { urls: urlDatabase};
  response.render("urls_index", templateVars);
});

//specific to unique id, displays that id's
//short and long URL
app.get("/urls/:id", (request, response) => {
  let templateVars = {
    shortUrl: request.params.id,
    urls: urlDatabase
  };
  response.render("urls_show", templateVars);
});

app.get("/hello", (request, response) => {
  response.end("<html><body>Hello <b>World</b></body></html>\n");
});

//after creation of shortURL, redirect to page
//with shortURL in address
app.post("/urls", (request, response) => {
  const longURL = request.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  response.redirect(`/urls/${shortURL}`);
});

//shortened URL will redirect to its corresponding longURL
app.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);

})

//8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

generateRandomString();