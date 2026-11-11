import Database from "better-sqlite3";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'
import { create } from "domain";
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'conf.db'));
const hash = (pwd) => bcrypt.hashSync(pwd, 10)

db.pragma('foreign_keys = ON')
// столбы для создания юзера, комнат и заявок
//1
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fio TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
      );
    `)

    const count = db.prepare('SELECT COUNT (*) AS c FROM users').get().c;

    if (count === 0) {
      const stmt = db.prepare(`
        INSERT INTO users (login, password, fio, phone, email)
        VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run ('ivan', hash('demo'), 'Иванов Иван', '8(999)123-45-67', 'ivan@example.com');
        stmt.run ('petr', hash('demo'), 'Петров Пётр', '8(999)123-45-68', 'petr@example.com');
        stmt.run ('anna', hash('demo'), 'Анна Сидорова', '8(999)123-45-69', 'anna@example.com');
        stmt.run ('Conf2027', hash('Demo77'), 'Администратор', '8(999)123-45-67', 'admin@example.com');
        console.log('Тестовые пользователи добавлены');
    }

 db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
 );
    `)

      const Roooms = db.prepare('SELECT COUNT (*) AS c FROM rooms').get().c;

    if (Roooms === 0) {
      const rooooms = db.prepare(`
        INSERT INTO rooms (room_name, type, capacity)
        VALUES (?, ?, ?)
        `);
        rooooms.run ('Аудитория №1', 'Аудитория', '235');
        rooooms.run ('Аудитория №4', 'Коворкинг', '232');       
        rooooms.run ('Коворкинг', 'Кинозал', '213');
        rooooms.run ('Конференц-зал', 'Кинозал', '424');
        console.log('Тестовые кооомнаты добавлены');
    }

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    date_start TEXT NOT NULL,
    payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Новая',
    review TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
  );
`);

     const requeests = db.prepare('SELECT COUNT (*) AS c FROM requests').get().c;

    if (requeests === 0) {
      const reqi = db.prepare(`
        INSERT INTO requests (user_id, room_id, date_start, payment)
        VALUES (?, ?, ?, ?)
        `);
        reqi.run (1, 1, "2027-03-15", "При очном посищении");
        reqi.run (1, 3, "2027-03-20", "Перевод по СБП");
        reqi.run (2, 2, "2027-04-01", "При очном посищении");
        console.log('ЗАЯВА НАКАТАНА ГАТАВСЬЯ');
}
// столбы для создания юзера, комнат и заявок
// столбы для создания юзера, комнат и заявок
    // класы
    class User {
      constructor () {
        this.table = "users"
      }

      findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
      }

      findByLogin(login) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE login = ?`).get(login);
      }
       findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all();
      }
       count() {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${this.table}`).get();
        return result.count;
      }

          create({ login, password, fio, phone, email }) {
        const hashed = bcrypt.hashSync(password, 10)
        const r = db
            .prepare(
                `
        INSERT INTO ${this.table} (login, password, fio, phone, email)
        VALUES (?, ?, ?, ?, ?)
      `
            )
            .run(login, hashed, fio, phone, email)
        return this.findById(r.lastInsertRowid)
    }

       exists(login) {
        const result = db.prepare(`SELECT 1 FROM ${this.table} WHERE login = ?`).get(login);
        return !!result;
      }
    }

     class Room {
      constructor () {
        this.table = "rooms"
      }

      findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
      }

      findByType(type) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE type = ?`).all(type);
      }
       count() {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${this.table}`).get();
        return result.count;
      }

       findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all();
      } 
     
    }
class UserRequest {
    constructor() {
        this.table = 'requests'
    }

    findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id)
    }

    findByUser(userId) {
        return db
            .prepare(
                `
        SELECT r.*, rm.room_name AS room_name, rm.type AS room_type
        FROM ${this.table} r
        JOIN rooms rm ON rm.id = r.room_id
        WHERE r.user_id = ?
        ORDER BY r.id DESC
      `
            )
            .all(userId)
    }

    findAllDetailed() {
        return db
            .prepare(
                `
        SELECT r.*, u.fio AS user_fio, u.login AS user_login,
               rm.room_name AS room_name, rm.type AS room_type
        FROM ${this.table} r
        JOIN users u ON u.id = r.user_id
        JOIN rooms rm ON rm.id = r.room_id
        ORDER BY r.id DESC
      `
            )
            .all()
    }
    findDetailed(id) {
        return db.prepare(`
    SELECT r.*,
           u.fio AS user_fio,
           u.login AS user_login,
           u.email AS user_email,
           u.phone AS user_phone,
           rm.room_name AS room_name,
           rm.type AS room_type,
           rm.capacity AS room_capacity
    FROM ${this.table} r
    JOIN users u ON u.id = r.user_id
    JOIN rooms rm ON rm.id = r.room_id
    WHERE r.id = ?
  `).get(id);
    }

    count() {
        const result = db.prepare(`SELECT COUNT(*) AS count FROM ${this.table}`).get()
        return result ? result.count : 0
    }

    updateStatus(id, status) {
        return db.prepare(`UPDATE ${this.table} SET status = ? WHERE id = ?`).run(status, id)
    }

    addReview(id, userId, review) {
        if (!review || !review.trim()) return false;
        const r = db.prepare(`
    UPDATE ${this.table}
    SET review = ?
    WHERE id = ? AND user_id = ? AND status = 'Завершено'
  `).run(review.trim(), id, userId);
        return r.changes > 0;
    }

    create({ userId, roomId, dateStart, payment }) {
        const r = db
            .prepare(
                `
        INSERT INTO ${this.table} (user_id, room_id, date_start, payment)
        VALUES (?, ?, ?, ?)
      `
            )
            .run(userId, roomId, dateStart, payment)
        return this.findById(r.lastInsertRowid)
    }
}

// класы

console.log("заяву накатали тебя закатали");
console.log(UserRequest);
// вывод
    export const Users = new User();
    export const Rooms = new Room();
    export const Tuble = new UserRequest();    
    export default db;
