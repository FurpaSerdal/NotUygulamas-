const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();  
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

// Uygulama dizini
const userDataPath = app.getPath('userData');

// Geliştirme ve üretim yollarını ayarla
const isDevelopment = !app.isPackaged;
const dbSourcePath = isDevelopment 
  ? path.join(__dirname, 'database.db')
  : path.join(process.resourcesPath, 'database.db');

// Kullanıcı verisi dizinindeki hedef yol
const dbPath = path.join(userDataPath, 'database.db');

// Veritabanını oluştur veya kopyala
function initializeDatabase() {
  if (!fs.existsSync(dbPath)) {
    console.log('Veritabanı bulunamadı. Kaynaktan kopyalanıyor...');

    if (fs.existsSync(dbSourcePath)) {
      fs.copyFileSync(dbSourcePath, dbPath);
      console.log(`Veritabanı kopyalandı: ${dbPath}`);
    } else {
      console.log('Kaynak veritabanı bulunamadı. Yeni bir veritabanı oluşturulacak.');
    }
  }

  let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Veritabanına bağlanırken hata:', err.message);
    } else {
      console.log('Veritabanına başarıyla bağlandı:', dbPath);

      db.run(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          baslik TEXT NOT NULL,
          icerik TEXT NOT NULL,
          tarih TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Tablo oluşturulurken hata:', err.message);
        } else {
          console.log('notes tablosu başarıyla oluşturuldu.');
        }
      });
    }
  });

  return db;
}

const db = initializeDatabase();

// Express sunucusu başlatma
const expressApp = express();
expressApp.use(bodyParser.json());

// Notları al
expressApp.get('/notes', (req, res) => {
  db.all("SELECT * FROM notes", [], (err, rows) => {
    if (err) {
      console.error('Notları çekerken hata:', err);
      res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
      return;
    }
    res.json(rows);
  });
});

expressApp.get('/notes/:id', (req, res) => {
  const id = req.params.id;
  db.all("SELECT * FROM notes WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.error('Notları çekerken hata:', err);
      res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
      return;
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    res.json(rows[0]);
  });
});

// Tarihi DD/MM/YYYY formatında oluşturmak için fonksiyon
function formatDate(date) {
  const gun = date.getDate().toString().padStart(2, '0');
  const ay = (date.getMonth() + 1).toString().padStart(2, '0');
  const yil = date.getFullYear();
  return `${gun}/${ay}/${yil}`;
}

// Not ekle
expressApp.post('/add-note', (req, res) => {
  const { baslik, icerik } = req.body;
  const tarih = formatDate(new Date());

  if (!baslik || !icerik) {
    return res.status(400).json({ message: 'Başlık ve içerik alanları gereklidir' });
  }

  const stmt = db.prepare("INSERT INTO notes (baslik, icerik, tarih) VALUES (?, ?, ?)");
  stmt.run(baslik, icerik, tarih, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Veri eklenirken hata oluştu', error: err.message });
    }
    res.status(201).json({ message: 'Veri başarıyla eklendi', id: this.lastID });
  });
  stmt.finalize();
});

// Not sil
expressApp.delete('/delete-note/:id', (req, res) => {
  const id = req.params.id;
  const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
  stmt.run(id, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Veri silinirken hata oluştu' });
    }
    res.status(200).json({ message: 'Veri başarıyla silindi' });
  });
  stmt.finalize();
});

// Not güncelleme
expressApp.put('/update-note/:id', (req, res) => {
  const { baslik, icerik, tarih } = req.body;
  const id = req.params.id;

  if (!baslik || !icerik) {
    return res.status(400).json({ message: 'Başlık ve içerik alanları gereklidir' });
  }

  const stmt = db.prepare("UPDATE notes SET baslik = ?, icerik = ?, tarih = ? WHERE id = ?");
  stmt.run(baslik, icerik, tarih, id, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Not güncellenirken hata oluştu', error: err.message });
    }

    res.status(200).json({ message: 'Not başarıyla güncellendi' });
  });
  stmt.finalize();
});

// Express sunucusunu başlat
expressApp.listen(3000, () => {
  console.log('Express sunucusu 3000 portunda çalışıyor');
});

// Electron penceresini oluştur
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

// IPC ile mevcut pencereyi güncelle
ipcMain.on('open-model-window', () => {
  const mainWindow = BrowserWindow.getFocusedWindow(); // Mevcut pencereyi alıyoruz
  const modelFilePath = path.join(__dirname, 'src', 'model', 'model.html');
  console.log('Model HTML Dosya Yolu:', modelFilePath);


  mainWindow.loadFile(modelFilePath); // Mevcut pencereyi yeni sayfaya yönlendiriyoruz
});

// Ana süreçte
ipcMain.on('open-model-Anasayfa', () => {
  const mainWindow = BrowserWindow.getFocusedWindow();  // Mevcut pencereyi alıyoruz
  const homeFilePath = path.join(__dirname, 'src', 'index.html');  // Yönlendireceğimiz ana sayfa

  mainWindow.loadFile(homeFilePath);  // Mevcut pencereyi yeni ana sayfaya yönlendiriyoruz
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
