const addNoteBtn = document.getElementById('addNoteBtn');
const notesList = document.getElementById('notesList');


addNoteBtn.addEventListener('click', addNote);

// Notları listelemek
function loadNotes() {
  fetch('http://localhost:3000/notes')
    .then(response => response.json())
    .then(data => {
      notesList.innerHTML = `
        <table class="table table-hover table-striped">
          <thead class="table-primary">
            <tr>
              <th>#</th>
              <th>Başlık</th>
              <th>İçerik</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody id="notesTableBody"></tbody>
        </table>
      `;

      const notesTableBody = document.getElementById('notesTableBody');

      data.forEach((note, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${note.baslik}</td>
          <td>${note.icerik}</td>
          <td>${note.tarih}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id})">
              🗑️ Sil
            </button>
          </td>
        `;

        notesTableBody.appendChild(tr);
      });

    })
    .catch(error => console.error('Hata:', error));
}

// Not eklemek
function addNote() {
  console.log("calıs")
  const baslik = document.getElementById('baslik').value;
  const icerik = document.getElementById('icerik').value;
  const tarih = new Date().toISOString(); // Tarihi doğru şekilde alıyoruz
  
  if (baslik && icerik && tarih) {
    fetch('http://localhost:3000/add-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baslik, icerik, tarih }) // Doğru tarih formatında gönderiyoruz
    })
      .then(response => response.json())
      .then(() => {
        loadNotes();
        document.getElementById('baslik').value = '';
        document.getElementById('icerik').value = '';
      })
      .catch(error => console.error('Hata:', error));
  } else {
    alert('Başlık ve içerik boş olamaz!');
  }
}

// Not silmek
function deleteNote(id) {
  fetch(`http://localhost:3000/delete-note/${id}`, { method: 'DELETE' })
    .then(() => loadNotes())
    .catch(error => console.error('Hata:', error));
}

document.getElementById('openModelBtn').addEventListener('click', function (e) {
  e.preventDefault();
  window.api.openModelWindow();  // api üzerinden openModelWindow fonksiyonunu çağırıyoruz
})

// Sayfa yüklendiğinde notları getir
window.onload = loadNotes;
