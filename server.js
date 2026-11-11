import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const _dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.static(join(_dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", (req, res) => res.send("Конференции.РФ"));
app.get("/about", (_, res) => {
  const data = {
    title: "Конференции.РФ — О портале",
    description: "Портал для организации конференций.",
  };
  return res.render("about", data);
});
app.get("/contact", (req, res) => res.send("Контакты"));

app.get("/about", (req, res) => {
  const data = {
    title: "Конференции.РФ — О портале",
    description:
      "Портал предназначен для организации конференций и мероприятий.",
  };
  res.render("about", data);
});

app.get("/auth", (req, res) => {
  const data = {
    title: "Конференции.РФ — О портале",
  };
  res.render("auth", data);
});

app.get("/index", (req, res) => {
  const data = {
    title: "Конференции.РФ — О портале",
  };
  res.render("index", data);
});

app.get("/register", (req, res) => {
  return res.render("register", {
    title: "Регистрация пользователя",
    errors: [],
    userData: null,
  });
});

app.post("/register", (req, res) => {
  const { login, password, fullName, phone, email } = req.body;

  const userData = {
    login,
    fullName,
    phone,
    email,
  };

  return res.render("register", {
    title: "Данные получены!",
    errors: [],
    userData,
  });
});

app.get("/register", (req, res) => {
  res.send(`
    <form method="POST" action="/register">
      <input name="login" placeholder="Логин">
      <input name="password" type="password" placeholder="Пароль">
      <button>Создать пользователя</button>
    </form>
  `);
});

app.post("/register", (req, res) => {
  res.send(`Пользователь ${req.body.login} зарегистрирован`);
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Авторизация" });
});

app.post("/login", (req, res) => {
  return res.redirect("/dashboard");
});

const dashboardData = {
  title: "Мои заявки",
  user: { fio: "Иванов Иван Иванович" },
  requests: [
    { room_name: "Аудитория №1", status: "Новая" },
    { room_name: "Коворкинг", status: "Завершено" },
    { room_name: "Конференц-зал", status: "Ожидает подтверждения" },
  ],
};

app.get("/dashboard", (_, res) => {
  return res.render("dashboard", dashboardData);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
