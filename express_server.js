const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

//template engine
app.set("view engine", "ejs");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


app.get("/", (request, response) => {
  response.end("Hello!");
});

//
app.get("/login", (request, response) => {
  let userEmail = getUsernameById(request.cookies["user_id"]);
  let templateVars = {
    userEmail: userEmail
  }
  response.render("login", templateVars);
});

//post request for LOGIN process
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
    response.cookie("user_id", id);
    response.redirect("/");
  }


  response.redirect("/");
});

//post request for LOGOUT process
app.post("/logout", (request, response) => {
  response.clearCookie("user_id");
  response.redirect("/urls");
})

// has to be above other urls/... pages to not
//get treated as /:id or /:shortURL by LocalHost
app.get("/urls/new", (request, response) => {
  let userEmail = getUsernameById(request.cookies["user_id"]);
  let templateVars = {
    userEmail: userEmail
  };
  if (templateVars.userEmail === undefined){
    response.redirect("/login");
    return;
  };
  response.render("urls_new", templateVars); //form to submit link to shorten
})

app.get("/urls.json", (request, response) =>{
  response.json(urlDatabase);
});

//list of all shortened and their corresponding long Urls
//urls_index.ejs - displays link to shorten a url (DEAD)
app.get("/urls", (request, response) => {
  let userEmail = getUsernameById(request.cookies["user_id"]);
  let templateVars = {
    urls: urlDatabase,
    userEmail: userEmail
  };
  response.render("urls_index", templateVars);
});

//post route that removes a URL resource
//and redirects to modified /urls
app.post("/urls/:id/delete", (request, response) => {
  delete urlDatabase[request.params.id];
  response.redirect("/urls");
})

//specific to unique id, displays that id's
//short and long URL
app.get("/urls/:id", (request, response) => {
  let userEmail = getUsernameById(request.cookies["user_id"]);
  let templateVars = {
    shortUrl: request.params.id,
    urls: urlDatabase,
    userEmail: userEmail
  };
  response.render("urls_show", templateVars);
});

//resets where short url points (ie corresponding long url)
app.post("/urls/:id", (request, response) => {
    let longURL = addHTTP(request.body.longURL);
    urlDatabase[request.params.id] = longURL;
    response.redirect("/urls");
});

app.get("/hello", (request, response) => {
  response.end("<html><body>Hello <b>World</b></body></html>\n");
});

//after creation of shortURL, stores info
//and redirects to page with shortURL in address.
app.post("/urls", (request, response) => {
  let longURL = addHTTP(request.body.longURL);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  response.redirect(`/urls/${shortURL}`);
});

//shortened URL will redirect to its corresponding longURL
app.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);

})

//registration page with email and password fields
app.get("/register", (request, response) => {
  let userEmail = getUsernameById(request.cookies["user_id"]);
  let templateVars = {
    userEmail: userEmail
  }
  response.render("register", templateVars);
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
    password: request.body.password,
  };
  users[newUser.id] = newUser;
  response.cookie("user_id", newUser.id);
  response.redirect("/urls");
  } else {
     response.status(400).send("Both Password and Email field must be filled out");
  };
});

//8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


const getIdByEmail = (email) => {
  let id = undefined;
  for (user in users){
    if(users[user].email === email){
      id = user;
    }
  }
  return id;
}

//
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
    };
  };
  return false;
};

//check if password matches password linked to that email
const checkPassword = (givenEmail, givenPW) => {
  for(user in users){
    if(users[getIdByEmail(givenEmail)].password === givenPW){
      return true;
    }
  }
  return false;
}


//checks for implicit/explicit protocols on input
//and adds if missing
const addHTTP = (givenURL) => {
  if(givenURL !== /^https?: \/\//) {givenURL = `https://${givenURL}`};
  return givenURL;
};

//creates short id's for given urls
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

generateRandomString();

