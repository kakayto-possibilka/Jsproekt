import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db from './db.js';
import {Users, Rooms, Tuble} from './db.js';
import session from "express-session";
import { error } from "console";

app.use(session({
  secret: `conf2027-secret`,
  resave: false,
  saveUninitiazed: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 часа
    httpOnly: true,
    sameSite: 'lax'
  }
}));

const INACTIVITY_LIMIT = 20 * 60 * 1000
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const now = Date.now();

    if (req.session && req.session.lastActivity && (now - req.session.lastActivity > INACTIVITY_LIMIT)) {
      return req.session.destroy(() => {
      res.redirect('/login');
      });
    }
  req.session.lastActivity = now;
}
  next();
});


const _dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

/*
const newRequest = Tuble.create({
  userId: 1,
  roomId: 2,
  datestart: "2027-04-10",
  payment: "При очном посищении",

});

console.log(newRequest)
*/

app.post("/login", (req, res) => {
  const user = User.findByLogin(req.body.login);

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userId = user.id;
    req.session.fio = user.fio;
    req.session.login = user.login;
    req.session.lastActivity = Date.now(); // УСТАНОВИТЬ

    return res.redirect(user.login === 'conf2027' ? '/admin' : '/dashboard')
  }

res.render('auth', {
  mode: 'login',
  error: 'НЕВЕРНА ВАЩЕТО УХАДИ',
  flash: null
});
});

const rooms = Rooms.findAll()

app.use(express.static(join(_dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", (req, res) => res.send("Конференции.РФ"));

app.get("/auth", (req, res) => {
  res.render("auth");
});

app.get("/create", (req, res) => {
  res.render("create_request", {rooms, errors: [] });
});
app.post("/create", (req, res) => {
  res.render("create_request", {rooms, errors: [] });
});

app.get("/request_detail", (req, res) => {
  res.render("request_detail");
});

app.get("/requests_list", (req, res) => {
  res.render("requests_list");
});

app.get("/rooms", (req, res) => {
  res.render("rooms");
});

app.post("/auth", (req, res) => {
  res.render("auth");
});


app.post("/request_detail", (req, res) => {
  res.render("request_detail");
});

app.post("/requests_list", (req, res) => {
  res.render("requests_list");
});

app.post("/rooms", (req, res) => {
  res.render("rooms");
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
