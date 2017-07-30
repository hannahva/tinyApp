const express = require("express");
const app = express();
// default port 8080
const PORT = process.env.PORT || 8080;

//template engine
app.set("view engine", "ejs");

app.use(express.static(__dirname + '/styles'));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  user_id: "session",
  keys: ["cat", "dog"]
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require("bcrypt");

const urlDatabase = {};


const users = {};


/////////////
//FUNCTIONS//
/////////////

//checks given id against userID in urlDatabase
const urlsForUser = (id) => {
  const output = {};
  for (url in urlDatabase){
    if(urlDatabase[url].userID === id){
      output[url] = urlDatabase[url];
    }
  }
  return output;
};

const getIdByEmail = (email) => {
  let id = undefined;
  for (user in users){
    if(users[user].email === email){
      id = user;
    }
  }
  return id;
};


const getUsernameById = (userID) => {
  let user = users[userID];
  if (!user){
    return;
  }
  return user.email;
};


//check if user email already exists
const checkUserEmail = (givenEmail) => {
  for(user in users) {
    if (users[user].email === givenEmail){
      return true;
    }
  }
  return false;
};


const checkPassword = (givenEmail, givenPW) => {
  if(bcrypt.compareSync(givenPW, users[getIdByEmail(givenEmail)].password)){
    return true;
  }
  return false;
};


//checks for implicit/explicit protocols on input
//and adds if missing
const addHTTP = (givenURL) => {
  let newURL = givenURL;
  if(!/https?:\/\//.test(givenURL)) {
    if(!/www\./.test(givenURL)){
      newURL = `www.${newURL}`;
    }
    newURL = `https://${newURL}`;
  }
  return newURL;
};

//creates short id's for given urls
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

generateRandomString();


//////////
//ROUTES//
//////////

app.get("/", (request, response) => {
  if(!request.session.user_id){
    response.redirect("/login");
    return;
  }
  response.redirect("/urls");

});

app.get("/login", (request, response) => {
  let userEmail = getUsernameById(request.session.user_id);
  let templateVars = {
    userEmail: userEmail
  };
  if(!!request.session.user_id){
    response.redirect("/urls");

  } else {
    response.render("login", templateVars);
  }
});

//checks if email and password entered and correct
app.post("/login", (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  const id = getIdByEmail(email);

  if (!checkUserEmail(email)) {
    response.status(403).send("Sorry, email or password incorrect");
    return;
  } else if (!checkPassword(email, password)){
    response.status(403).send("Sorry, email or password incorrect");
    return;
  } else {
    request.session.user_id = id;
    response.redirect("/urls");
  }
});


app.post("/logout", (request, response) => {
  request.session = null;
  response.redirect("/login");
});

// has to be above other urls/... pages to not
//get treated as /:id or /:shortURL by LocalHost
app.get("/urls/new", (request, response) => {
  let userEmail = getUsernameById(request.session.user_id);
  let templateVars = {
    userEmail: userEmail
  };
  if (templateVars.userEmail === undefined){
    response.redirect("/login");
    return;
  }
  response.render("urls_new", templateVars);
});

app.get("/urls.json", (request, response) =>{
  response.json(urlDatabase);
});

//list of all shortened and their corresponding long Urls
//urls_index.ejs - displays link to shorten a url (DEAD)
app.get("/urls", (request, response) => {
  let userEmail = getUsernameById(request.session.user_id);
  let templateVars = {
    urls: urlsForUser(request.session.user_id),
    userEmail: userEmail
  };
  if(!request.session.user_id){
    response.redirect("/login");
    return;
  } else {
    response.render("urls_index", templateVars);
  }
});

//post route that removes a URL resource
//and redirects to modified /urls
app.post("/urls/:id/delete", (request, response) => {
  if (urlDatabase[request.params.id].userID === request.session.user_id){
    delete urlDatabase[request.params.id];
    response.redirect("/urls");
  } else {
    response.status(400).send("You do not have permission to delete that URL.");
  }
});

//specific to unique id, displays that id's
//short and long URL
app.get("/urls/:id", (request, response) => {
  let templateVars = {
    shortUrl: request.params.id,
    urls: urlDatabase,
    userEmail: getUsernameById(request.session.user_id),
    cookie: request.session.user_id
  };
  if(urlDatabase[request.params.id] === undefined){
    response.status(404).send("No URL exists for this ID");
    return;
  } else {
    response.render("urls_show", templateVars);
  }
});

//resets where short url points (ie corresponding long url)
app.post("/urls/:id", (request, response) => {
  let longURL = addHTTP(request.body.longURL);
  urlDatabase[request.params.id].longURL = longURL;
  if (urlDatabase[request.params.id].userID === request.session.user_id){
    response.redirect("/urls");
  } else {
    response.status(400).send("You do not have permission to edit that URL.");
  }
});

//after creation of shortURL, stores info
//and redirects to page with shortURL in address.
app.post("/urls", (request, response) => {
  let longURL = addHTTP(request.body.longURL);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: request.session.user_id
  };
  response.redirect(`/urls/${shortURL}`);
});


app.get("/u/:shortURL", (request, response) => {
  if(!urlDatabase[request.params.shortURL]){
    response.status(400).send("No URL exists for this ID");
    return;
  } else {
    let longURL = urlDatabase[request.params.shortURL].longURL;
    response.redirect(longURL);
  }
});

app.get("/register", (request, response) => {
  let userEmail = getUsernameById(request.session.user_id);
  let templateVars = {
    userEmail: userEmail
  };
  if(!!request.session.user_id){
    response.redirect("/urls");
  } else {
    response.render("register", templateVars);
  }
});

//adds new user to user object
//sets cookie with new user id
//checks if user email already exists
app.post("/register", (request, response) => {
  if (checkUserEmail(request.body.email)) {
    response.status(400).send("Email already exists");
    return;
  } else if (request.body.email && request.body.password){
    let newUser = {
      id: generateRandomString(),
      email: request.body.email,
      password: bcrypt.hashSync(request.body.password, 10)
    };
    users[newUser.id] = newUser;
    request.session.user_id = newUser.id;
    response.redirect("/urls");
  } else {
    response.status(400).send("Both Password and Email field must be filled out");
  }

});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



