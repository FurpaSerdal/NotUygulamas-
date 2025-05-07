const addNoteBtn = document.getElementById('addNoteBtn');
const notesList = document.getElementById('notesList');

addNoteBtn.addEventListener('click', addNote);

// Notları listelemek
function loadNotes() {
  fetch('http://localhost:3000/notes')
    .then(response => response.json())
    .then(data => {
      notesList.innerHTML = '';
      data.forEach(note => {
        const li = document.createElement('li');
        li.textContent = `${note.baslik}: ${note.icerik}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Sil';
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'ms-2');
        deleteBtn.onclick = () => deleteNote(note.id);

        li.appendChild(deleteBtn);
        notesList.appendChild(li);
      });
    })
    .catch(error => console.error('Hata:', error));
}

// Not eklemek
function addNote() {
  const baslik = document.getElementById('baslik').value;
  const icerik = document.getElementById('icerik').value;
  
  if (baslik && icerik) {
    fetch('http://localhost:3000/add-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baslik, icerik }) // not değil, icerik
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

// Sayfa yüklendiğinde notları getir
window.onload = loadNotes;
