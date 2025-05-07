const { app, BrowserWindow } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();  
const express = require('express');
const bodyParser = require('body-parser');

// Veritabanı dosyasının yolu
const dbPath = path.join(__dirname, 'database.db');

// Veritabanını oluştur veya aç
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('Veritabanı açılırken hata: ', err);
  } else {
    console.log('Veritabanı başarıyla açıldı');

 
    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baslik TEXT NOT NULL,
      icerik TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Tablo oluşturulurken hata:', err.message);
      } else {
        console.log('notes tablosu hazır.');
      }
    });
    
  }
});

// Express sunucusu başlatma
const expressApp = express();
expressApp.use(bodyParser.json());



// Notları al
expressApp.get('/notes', (req, res) => {
  db.all("SELECT * FROM notes", [], (err, rows) => {
    if (err) {
      console.error('Notları çekerken hata:', err); // Hata detayını göster
      res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Not ekle
expressApp.post('/add-note', (req, res) => {
  const { baslik, icerik } = req.body;
  if (!baslik || !icerik) {
    return res.status(400).json({ message: 'Başlık ve içerik alanları gereklidir' });
  }
  
  const stmt = db.prepare("INSERT INTO notes (baslik, icerik) VALUES (?, ?)");
  stmt.run(baslik, icerik, function(err) {
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
          preload: path.join(__dirname, 'src/renderer.js'),
          nodeIntegration: false, // Bu satırı false yapıyoruz
          contextIsolation: true, // Güvenlik için contextIsolation'u true yapıyoruz
        }
      })

  win.loadFile('src/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
