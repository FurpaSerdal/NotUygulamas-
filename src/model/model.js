const tbody = document.querySelector('#notesTable tbody');

// Notları yükle
function loadNotes() {
  fetch('http://localhost:3000/notes')
    .then(response => response.json())
    .then(data => {
      tbody.innerHTML = ''; // Tablodaki eski notları temizle
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Hiç not yok.</td></tr>';
      } else {
        data.forEach((note, index) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${note.baslik}</strong></td>
            <td>${note.icerik}</td>
            <td>${note.tarih}</td>

            
            <td>
              <button class="btn btn-sm btn-primary me-2" onclick="editNote(${note.id})">✏️ Düzenle</button>
              <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id})">🗑️ Sil</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    })
    .catch(error => {
      console.error('Hata:', error);
      alert('Notlar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    });
}

// Not silme
function deleteNote(id) {
  if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
    fetch(`http://localhost:3000/delete-note/${id}`, { method: 'DELETE' })
      .then(() => loadNotes())
      .catch(error => {
        console.error('Hata:', error);
        alert('Not silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      });
  }
}

// Modal'ı açma
function openModal(note) {
  document.getElementById('editModal').style.display = 'block';
  document.getElementById('newTitle').value = note.baslik;
  document.getElementById('newContent').value = note.icerik;
  window.currentNoteId = note.id;
}

// Modal'ı kapatma
function closeModal() {
  document.getElementById('editModal').style.display = 'none';
  // Modal'ı kapattıktan sonra içerikleri temizle
  document.getElementById('newTitle').value = '';
  document.getElementById('newContent').value = '';
}

// Notu güncelleme
function updateNote() {
  const newTitle = document.getElementById('newTitle').value;
  const newContent = document.getElementById('newContent').value;
  const tarih = formatDate(new Date());

  if (newTitle && newContent) {
    fetch(`http://localhost:3000/update-note/${window.currentNoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baslik: newTitle, icerik: newContent ,tarih:tarih})
    })
    .then(() => {
      loadNotes();
      closeModal();
    })
    .catch(error => {
      console.error('Hata:', error);
      alert('Not güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    });
  } else {
    alert("Başlık ve içerik boş olamaz.");
  }
}

// Notu düzenleme
function editNote(id) {
  fetch(`http://localhost:3000/notes/${id}`)
    .then(response => response.json())
    .then(note => {
      openModal(note);
    })
    .catch(error => {
      console.error('Not bulunamadı:', error);
      alert('Not bulunamadı veya veritabanında hata oluştu.');
    });
}
// Tarihi DD/MM/YYYY formatında oluşturmak için fonksiyon
function formatDate(date) {
  const gun = date.getDate().toString().padStart(2, '0');
  const ay = (date.getMonth() + 1).toString().padStart(2, '0');
  const yil = date.getFullYear();
  return `${gun}/${ay}/${yil}`;
}

// Ana sayfaya dönüş (Electron yönlendirmesi)
document.getElementById('Model').addEventListener('click', () => {
  window.api.openModelAnasayfa(); // Electron kullanarak model penceresini açmak
});

// Sayfa yüklendiğinde notları yükle
loadNotes();
