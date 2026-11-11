import express, { request } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {Users, Rooms, Tuble} from './db.js';
import session from "express-session";
import bcrypt from 'bcryptjs';
// импорты

// константы
const _dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const INACTIVITY_LIMIT = 20 * 60 * 1000
const requireAuth = (req, res, next) =>
  req.session.userId ? next() : res.redirect('/login');
const requireAdmin = (req, res, next) =>
  req.session.login === 'Conf2027' ? next() : res.redirect('/login');
const RULES = [
  { field: 'login',    test: v => /^[A-Za-z0-9]{6,}$/.test(v),             msg: 'Логин: латиница+цифры, минимум 6 символов' },
  { field: 'password', test: v => v && v.length >= 8,                      msg: 'Пароль: минимум 8 символов' },
  { field: 'fio',      test: v => /^[А-Яа-яЁё\s]+$/.test(v),               msg: 'ФИО: только кириллица и пробелы' },
  { field: 'phone',    test: v => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(v), msg: 'Телефон: формат 8(ХХХ)ХХХ-ХХ-ХХ' },
  { field: 'email',    test: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),    msg: 'Email: некорректный формат' }
];

const validate = data => RULES
  .filter(({ field, test }) => !test((data[field] || '').trim()))
  .map(r => r.msg);

const rooms = Rooms.findAll()
// константы

app.use(express.static(join(_dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

// блок сессии
app.use(session({
  secret: `Conf2027-secret`,
  resave: false,
  saveUninitiazed: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 часа
    httpOnly: true,
    sameSite: 'lax'
  }
}));


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

//блок сессии

/*
const newRequest = Tuble.create({
  userId: 1,
  roomId: 2,
  datestart: "2027-04-10",
  payment: "При очном посищении",

});

console.log(newRequest)
*/
// пути
app.get("/", (req, res) => {
  res.redirect("/rooms");
});
app.get("/auth", (req, res) => {
  res.render("auth");
});
app.post("/auth", (req, res) => {
  res.render("auth");
});

app.get("/create", requireAuth, (req, res) => {
  const rooms = Rooms.findAll();
  res.render("create_request", { rooms, errors: [] });
});
app.post('/create', requireAuth, (req, res) => {
  Tuble.create({
    userId: req.session.userId,
    roomId: req.body.room_id,
    dateStart: req.body.date_start,
    payment: req.body.payment
  })
  res.redirect('/dashboard')
})

app.get("/login", (req, res) => {
  const flash = req.session.flash || null;
  delete req.session.flash;

  res.render('auth', {
    mode: 'login',
    error: null,
    flash
  });

});

app.post("/login", (req, res) => {
  const user = Users.findByLogin(req.body.login);

  console.log(user && bcrypt.compareSync(req.body.password, user.password))
  
  if (user && bcrypt.compareSync(req.body.password, user.password)) {

    req.session.userId = user.id;
    req.session.fio = user.fio;
    req.session.login = user.login
    req.session.lastActivity = Date.now();

    console.log(user)

    return res.redirect(user.login === 'Conf2027' ? '/admin' : '/dashboard');
  }

  

  res.render('auth', {
    mode: 'login',
    error: 'НЕВЕРНА',
    flash: null,
  });
});

app.all('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get("/register", (req, res) => {
  res.render('auth', {
    mode: 'register',
    form: [],
    errors: []
  });
});

app.post("/register", (req, res) => {
  const errors = validate(req.body);

  if (Users.exists(req.body.login)) {
    errors.push('ЛОГИН УЖЕ НЕ ТВОЙ СМЕРИСЬ');
  }

  if (errors.length) {
    return res.render('auth', {
      mode: 'register',
      form: req.body,
      errors
    });
  }
  
  Users.create(req.body);
  
  req.session.flash = {
    type: 'succes',
    text: 'Ну всё теперь ты у нас на сайте в расбтве на 5 через 2'
  }
  res.redirect("/login");
});

app.get("/request/:id", requireAuth, (req, res) => {
    const request = Tuble.findDetailed(req.params.id);

    if (!request) {
        return res.status(404).send("Заявка не найдена");
    }

    const isOwner = request.user_id === req.session.userId;
    const isAdmin = req.session.login === "Conf2027";

    if (!isOwner && !isAdmin) {
        return res.status(403).send("Доступ запрещён");
    }

    res.render("request_detail", {
        request,
        isOwner,
        isAdmin,
    });
});

app.post("/review/:id", requireAuth, (req, res) => {
    const request = Tuble.findDetailed(req.params.id);

    if (!request) {
        return res.status(404).send("Заявка не найдена");
    }

    if (request.user_id !== req.session.userId) {
        return res.status(403).send("Только владелец может оставить отзыв");
    }

    const review = (req.body.review || "").trim();

    Tuble.addReview(request.id, req.session.userId, review);

    res.redirect(`/request/${request.id}`);
});

app.get("/requests_list", (req, res) => {
  res.render("requests_list");
});

app.get("/dashboard", requireAuth, (req, res) => {
  const requests = Tuble.findByUser(req.session.userId);
  res.render("requests_list", {isAdmin: false, requests});
});

app.get("/admin", requireAdmin, (req, res) => {
  const requests = Tuble.findAllDetailed();
  res.render("requests_list", {isAdmin: true, requests});
});

app.post("/admin", requireAdmin, (req, res) => {
  Tuble.updateStatus(req.body.id, req.body.status);
  res.redirect('/admin');
});

app.post("/review/:id", requireAuth, (req, res) => {
  Tuble.addReview(req.params.id, req.session.userId, req.body.review);
  res.redirect('/dashboard');
});

app.post("/requests_list", (req, res) => {
  res.render("requests_list");
});

app.get("/rooms", (req, res) => {
  const rooms = Rooms.findAll();
  res.render("rooms", { rooms });
});

app.get("/rooms/type/:type", (req, res) => {
  const rooms = Rooms.findByType(req.params.type);
  res.render("rooms", { rooms });
});

app.post("/rooms", (req, res) => {
  const rooms = Rooms.findAll();
  res.render("rooms", { rooms });
});
// пути

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});