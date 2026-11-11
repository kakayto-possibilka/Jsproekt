import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db from './db.js';
import {Users, Rooms, Tuble} from './db.js';

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
