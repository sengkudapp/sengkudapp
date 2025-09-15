import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LoginScreen } from './LoginScreen';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut, User } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// --- TIPE DATA ---
export interface LinkItem {
  id: number;
  title: string;
  description: string;
  photoUrl: string;
  url: string;
  isVisible: boolean;
}
export interface AlbumItem {
  id: number;
  photoUrl: string;
  description: string;
}
export interface SectionVisibility {
    showAnnouncement: boolean;
    showLinks: boolean;
    showAlbum: boolean;
    showAboutUs: boolean;
}
export interface LogEntry {
    id: number;
    timestamp: string;
    adminEmail: string;
    action: string;
}

// Nilai awal untuk form dan state
const initialLinkState = { title: '', description: '', photoUrl: '', url: '' };
const initialAlbumState = { photoUrl: '', description: '' };
const initialVisibilityState: SectionVisibility = {
    showAnnouncement: true,
    showLinks: true,
    showAlbum: true,
    showAboutUs: true,
};
const sectionLabels: { [key in keyof SectionVisibility]: string } = {
    showAnnouncement: 'Pengumuman',
    showLinks: 'Tautan',
    showAlbum: 'Album Foto',
    showAboutUs: 'Tentang Kami',
};

// --- Firestore Document Reference ---
const dataDocRef = doc(db, 'appData', 'mainContent');


const App = () => {
  // --- State untuk Otentikasi & Tampilan ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [activeAdminTab, setActiveAdminTab] = useState('tampilan');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('app-theme-v1') as 'light' | 'dark') || 'light');

  // --- State untuk Data Aplikasi ---
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [albumPhotos, setAlbumPhotos] = useState<AlbumItem[]>([]);
  const [aboutUsText, setAboutUsText] = useState<string>('Konten "Tentang Kami" bisa diubah di panel admin.');
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(initialVisibilityState);
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);

  // --- State untuk Form, Search, & Error ---
  const [linkFormData, setLinkFormData] = useState(initialLinkState);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [albumFormData, setAlbumFormData] = useState(initialAlbumState);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumItem | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State sementara untuk admin textareas
  const [tempAnnouncementText, setTempAnnouncementText] = useState(announcementText);
  const [tempAboutUsText, setTempAboutUsText] = useState(aboutUsText);
  const [saveConfirmation, setSaveConfirmation] = useState('');
  
  // --- useEffect untuk mengambil data dari Firestore ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(dataDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLinks(data.links || []);
          setAlbumPhotos(data.albumPhotos || []);
          setAboutUsText(data.aboutUsText || 'Konten "Tentang Kami" bisa diubah di panel admin.');
          setAnnouncementText(data.announcementText || '');
          setSectionVisibility(data.sectionVisibility || initialVisibilityState);
          setActivityLog(data.activityLog || []);
        } else {
          // Jika dokumen belum ada, inisialisasi di Firestore
          await setDoc(dataDocRef, {
            links: [],
            albumPhotos: [],
            aboutUsText: 'Konten "Tentang Kami" bisa diubah di panel admin.',
            announcementText: '',
            sectionVisibility: initialVisibilityState,
            activityLog: []
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data dari server. Periksa koneksi internet dan konfigurasi Firebase Anda.");
      }
    };
    fetchData();
  }, []);
  
  // --- useEffect untuk memantau status otentikasi ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Simpan tema ke local storage
  useEffect(() => { localStorage.setItem('app-theme-v1', theme); }, [theme]);

  // Reset state sementara saat tab admin berubah atau data utama diperbarui
  useEffect(() => {
    setTempAnnouncementText(announcementText);
    setTempAboutUsText(aboutUsText);
    setError('');
    setSaveConfirmation('');
  }, [activeAdminTab, announcementText, aboutUsText]);

  // --- Fungsi untuk menyimpan data & log ke Firestore ---
  const updateDataAndLog = async (updates: { [key: string]: any }, action: string) => {
      if (!currentUser || !currentUser.email) {
          console.error("Tidak bisa mencatat aksi: pengguna tidak login.");
          setError("Sesi Anda mungkin telah berakhir. Silakan login kembali.");
          return;
      }
      const newLogEntry: LogEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          adminEmail: currentUser.email,
          action: action,
      };
      const updatedLogs = [newLogEntry, ...activityLog];
      setActivityLog(updatedLogs); // Optimistic UI update for log

      try {
          await updateDoc(dataDocRef, { ...updates, activityLog: updatedLogs });
      } catch (error) {
          console.error("Error updating document:", error);
          setError("Gagal menyimpan perubahan ke server.");
          // Kembalikan state log jika gagal
          setActivityLog(activityLog);
      }
  };
  
  // Fungsi untuk hanya mencatat log (untuk aksi yg tidak mengubah data utama)
  const logAction = async (action: string) => {
      await updateDataAndLog({}, action);
  };
  
  const handleClearHistory = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat aktivitas? Tindakan ini tidak dapat diurungkan.')) {
        const oldLogs = [...activityLog];
        setActivityLog([]); // Optimistic UI update
        try {
            await updateDoc(dataDocRef, { activityLog: [] });
            await logAction('Menghapus seluruh riwayat aktivitas.');
        } catch (error) {
            console.error("Error clearing history:", error);
            setError("Gagal menghapus riwayat.");
            setActivityLog(oldLogs); // Revert on failure
        }
    }
  };
  
  // --- Handler Otentikasi ---
  const handleLogout = async () => { 
    await logAction('Logout dari panel admin.'); 
    await signOut(auth);
    setView('user'); 
  };

  // --- Handler untuk Form Input ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, form: 'link' | 'album') => {
    const { name, value } = e.target;
    if (form === 'link') setLinkFormData(p => ({ ...p, [name]: value }));
    else setAlbumFormData(p => ({ ...p, [name]: value }));
  };
  const handleVisibilityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const key = name as keyof SectionVisibility;
    const newVisibility = { ...sectionVisibility, [key]: checked };
    setSectionVisibility(newVisibility);
    await updateDataAndLog({ sectionVisibility: newVisibility }, `Mengubah visibilitas seksi "${sectionLabels[key]}" menjadi ${checked ? 'terlihat' : 'tersembunyi'}.`);
  };

  // --- Logika Manajemen Link ---
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkFormData.title.trim() || !linkFormData.url.trim() || !linkFormData.description.trim()) {
      setError('Judul, Deskripsi, dan URL Tujuan wajib diisi.');
      return;
    }
    let newLinks;
    let action;
    if (editingLinkId !== null) {
      newLinks = links.map(l => l.id === editingLinkId ? { ...l, ...linkFormData } : l);
      action = `Memperbarui link: "${linkFormData.title}".`;
    } else {
      newLinks = [...links, { id: Date.now(), ...linkFormData, isVisible: true }];
      action = `Menambahkan link baru: "${linkFormData.title}".`;
    }
    setLinks(newLinks);
    await updateDataAndLog({ links: newLinks }, action);
    setEditingLinkId(null);
    setLinkFormData(initialLinkState);
    setError('');
  };
  const handleEditLink = (id: number) => {
    const link = links.find(l => l.id === id);
    if (link) {
      setLinkFormData({ title: link.title, description: link.description, photoUrl: link.photoUrl, url: link.url });
      setEditingLinkId(id);
      setActiveAdminTab('link');
    }
  };
  const handleCancelEditLink = () => { setEditingLinkId(null); setLinkFormData(initialLinkState); setError(''); };
  const handleDeleteLink = async (id: number) => {
    const linkToDelete = links.find(l => l.id === id);
    if (linkToDelete && window.confirm('Hapus link ini?')) {
        const newLinks = links.filter(l => l.id !== id);
        setLinks(newLinks);
        await updateDataAndLog({ links: newLinks }, `Menghapus link: "${linkToDelete.title}".`);
    }
  };
  const handleToggleVisibility = async (id: number) => { 
    let linkTitle = '';
    const newLinks = links.map(l => {
      if (l.id === id) {
        linkTitle = l.title;
        return { ...l, isVisible: !l.isVisible };
      }
      return l;
    });
    setLinks(newLinks);
    await updateDataAndLog({ links: newLinks }, `Mengubah visibilitas link "${linkTitle}" menjadi ${!newLinks.find(l=>l.id===id)?.isVisible ? 'tersembunyi' : 'terlihat'}.`);
  };
  const moveLink = async (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newLinks.length) {
      const action = `Memindahkan posisi link "${newLinks[index].title}".`;
      [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
      setLinks(newLinks);
      await updateDataAndLog({ links: newLinks }, action);
    }
  };

  // --- Logika Manajemen Album ---
  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumFormData.photoUrl.trim()) {
      setError('URL Foto wajib diisi.');
      return;
    }
    let newAlbumPhotos;
    let action;
    if (editingAlbumId !== null) {
      newAlbumPhotos = albumPhotos.map(p => p.id === editingAlbumId ? { ...p, ...albumFormData } : p);
      action = `Memperbarui foto di album: "${albumFormData.description || 'Tanpa deskripsi'}".`;
    } else {
      newAlbumPhotos = [...albumPhotos, { id: Date.now(), ...albumFormData }];
      action = `Menambahkan foto baru ke album: "${albumFormData.description || 'Tanpa deskripsi'}".`;
    }
    setAlbumPhotos(newAlbumPhotos);
    await updateDataAndLog({ albumPhotos: newAlbumPhotos }, action);
    setEditingAlbumId(null);
    setAlbumFormData(initialAlbumState);
    setError('');
  };
  const handleEditAlbum = (id: number) => {
    const photo = albumPhotos.find(p => p.id === id);
    if (photo) {
      setAlbumFormData({ photoUrl: photo.photoUrl, description: photo.description });
      setEditingAlbumId(id);
      setActiveAdminTab('album');
    }
  };
  const handleCancelEditAlbum = () => { setEditingAlbumId(null); setAlbumFormData(initialAlbumState); setError(''); };
  const handleDeleteAlbum = async (id: number) => {
    const photoToDelete = albumPhotos.find(p => p.id === id);
    if (photoToDelete && window.confirm('Hapus foto ini?')) {
      const newAlbumPhotos = albumPhotos.filter(p => p.id !== id);
      setAlbumPhotos(newAlbumPhotos);
      await updateDataAndLog({ albumPhotos: newAlbumPhotos }, `Menghapus foto dari album: "${photoToDelete.description || 'Tanpa deskripsi'}".`);
    }
  };
  
  // --- Handlers untuk Modal Foto, Tema, dan Simpan Manual ---
  const handlePhotoClick = (photo: AlbumItem) => setSelectedPhoto(photo);
  const handleCloseModal = () => setSelectedPhoto(null);
  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await logAction(`Mengubah tema ke mode ${newTheme}.`);
  };

  const showSaveConfirmation = (message: string) => {
    setSaveConfirmation(message);
    setTimeout(() => setSaveConfirmation(''), 2500);
  };
  const handleSaveAnnouncement = async () => {
    setAnnouncementText(tempAnnouncementText);
    await updateDataAndLog({ announcementText: tempAnnouncementText }, 'Memperbarui teks pengumuman.');
    showSaveConfirmation('Pengumuman berhasil disimpan!');
  };
  const handleSaveAboutUs = async () => {
    setAboutUsText(tempAboutUsText);
    await updateDataAndLog({ aboutUsText: tempAboutUsText }, 'Memperbarui konten "Tentang Kami".');
    showSaveConfirmation('Konten "Tentang Kami" berhasil disimpan!');
  };

  // --- Logika Filter untuk Pencarian ---
  const filteredLinks = links.filter(link => 
    link.isVisible && (
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const filteredAlbumPhotos = albumPhotos.filter(photo => 
    photo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><p>Memuat aplikasi...</p></div>;
  }

  if (view === 'admin' && !currentUser) {
    return <LoginScreen onBack={() => setView('user')} />;
  }

  return (
    <div className="app-container" data-theme={theme}>
      <div className="content-wrapper">
        <header className="header">
          <h1>Majelis Sengkud</h1>
          <div className="header-controls">
             <button onClick={handleThemeToggle} className="theme-toggle" title={`Ganti ke mode ${theme === 'light' ? 'gelap' : 'terang'}`} aria-label="Ganti tema">
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              )}
            </button>
            <div className="view-toggle" role="group">
              <button onClick={() => setView('user')} className={view === 'user' ? 'active' : ''} title="Tampilan User">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span className="button-text">User</span>
              </button>
              <button onClick={() => setView('admin')} className={view === 'admin' ? 'active' : ''} title="Panel Admin">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                <span className="button-text">Admin</span>
              </button>
            </div>
          </div>
        </header>

        <main>
          {view === 'user' ? (
            <div id="user-view">
              <div className="search-container">
                <input type="search" placeholder="Cari tautan atau foto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" aria-label="Cari konten" />
              </div>

              {sectionVisibility.showAnnouncement && announcementText.trim() && <section id="announcement-section"><p>{announcementText}</p></section>}
              
              {sectionVisibility.showLinks && <section id="links-section"><h2>Tautan Tersedia</h2>
                {links.length > 0 ? (
                  filteredLinks.length > 0 ? (
                    <div className="user-cards-grid">{filteredLinks.map(link => (<div key={link.id} className="user-card">{link.photoUrl && <img src={link.photoUrl} alt={link.title} className="card-img" /> }<div className="card-content"><h3>{link.title}</h3><p>{link.description}</p>{link.url && <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn-open">BUKA</a>}</div></div>))}</div>
                  ) : (<p className="no-results-message">Tidak ada tautan yang cocok dengan pencarian Anda.</p>)
                ) : (<p>Belum ada tautan yang ditambahkan.</p>)}
              </section>}
              
              {sectionVisibility.showAlbum && <section id="album-section"><h2>Album Foto</h2>
                {albumPhotos.length > 0 ? (
                  filteredAlbumPhotos.length > 0 ? (
                    <div className="album-grid">{filteredAlbumPhotos.map(photo => (<div key={photo.id} className="album-photo-item" onClick={() => handlePhotoClick(photo)} tabIndex={0} role="button" aria-label={`Lihat foto: ${photo.description}`}><img src={photo.photoUrl} alt={photo.description} className="album-img" /><p className="album-caption">{photo.description}</p></div>))}</div>
                  ) : (<p className="no-results-message">Tidak ada foto yang cocok dengan pencarian Anda.</p>)
                ) : (<p>Belum ada foto yang ditambahkan.</p>)}
              </section>}

              {sectionVisibility.showAboutUs && <section id="about-us-section"><h2>Tentang Kami</h2><div className="about-us-content"><p>{aboutUsText}</p></div></section>}
            </div>
          ) : (
            <div id="admin-panel">
              <nav className="admin-tabs">
                <button onClick={() => setActiveAdminTab('tampilan')} className={activeAdminTab === 'tampilan' ? 'active' : ''}>Tampilan</button>
                <button onClick={() => setActiveAdminTab('pengumuman')} className={activeAdminTab === 'pengumuman' ? 'active' : ''}>Pengumuman</button>
                <button onClick={() => setActiveAdminTab('link')} className={activeAdminTab === 'link' ? 'active' : ''}>Link</button>
                <button onClick={() => setActiveAdminTab('album')} className={activeAdminTab === 'album' ? 'active' : ''}>Album</button>
                <button onClick={() => setActiveAdminTab('tentang')} className={activeAdminTab === 'tentang' ? 'active' : ''}>Tentang Kami</button>
                <button onClick={() => setActiveAdminTab('riwayat')} className={activeAdminTab === 'riwayat' ? 'active' : ''}>Riwayat</button>
                <div className="admin-session-info">
                  <span className="logged-in-user">Login sebagai: <strong>{currentUser?.email}</strong></span>
                  <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
              </nav>

              <div className="admin-tab-content">
                {error && <p role="alert" className="error-message sticky-error">{error}</p>}
                
                {activeAdminTab === 'tampilan' && (
                  <section>
                    <h2>Pengaturan Tampilan Halaman</h2>
                    <div className="visibility-controls">
                      {Object.keys(sectionVisibility).map(key => (
                        <div key={key} className="visibility-control-item">
                           <span>Tampilkan Seksi "{sectionLabels[key as keyof SectionVisibility]}"</span>
                           <label className="toggle-switch">
                            <input type="checkbox" name={key} checked={sectionVisibility[key as keyof SectionVisibility]} onChange={handleVisibilityChange} aria-label={`Aktifkan seksi ${sectionLabels[key as keyof SectionVisibility]}`} />
                            <span className="slider"></span>
                           </label>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {activeAdminTab === 'pengumuman' && <section><h2>Pengaturan Pengumuman</h2><div className="admin-form"><textarea value={tempAnnouncementText} onChange={(e) => setTempAnnouncementText(e.target.value)} rows={4} /><div className="form-actions"><button onClick={handleSaveAnnouncement}>Simpan Pengumuman</button>{saveConfirmation && <span className="save-confirmation">{saveConfirmation}</span>}</div></div></section>}
                
                {activeAdminTab === 'link' && (
                  <section>
                    <h2>Pengaturan Link</h2>
                    <form onSubmit={handleLinkSubmit} className="admin-form">
                      <h3>{editingLinkId ? 'Edit Link' : 'Tambah Link Baru'}</h3>
                      <input name="title" value={linkFormData.title} onChange={(e) => handleInputChange(e, 'link')} placeholder="Judul" />
                      <textarea name="description" value={linkFormData.description} onChange={(e) => handleInputChange(e, 'link')} placeholder="Deskripsi"></textarea>
                      <input name="photoUrl" value={linkFormData.photoUrl} onChange={(e) => handleInputChange(e, 'link')} placeholder="URL Foto (Opsional)" />
                      <input name="url" value={linkFormData.url} onChange={(e) => handleInputChange(e, 'link')} placeholder="URL Tujuan" />
                      <div className="form-actions"><button type="submit">{editingLinkId ? 'Simpan' : 'Tambah'}</button>{editingLinkId && <button type="button" onClick={handleCancelEditLink}>Batal</button>}</div>
                    </form>
                    <div className="admin-list-container">
                      {links.map((link, index) => (
                        <div key={link.id} className={`admin-item ${!link.isVisible ? 'hidden' : ''}`}>
                          {link.photoUrl ? <img src={link.photoUrl} alt="" className="admin-item-photo" /> : <div className="admin-item-photo placeholder" />}
                          <div className="admin-item-info"><strong>{link.title}</strong><span>{link.url}</span></div>
                          <div className="admin-item-actions">
                            <button onClick={() => moveLink(index, 'up')} disabled={index === 0}>↑</button>
                            <button onClick={() => moveLink(index, 'down')} disabled={index === links.length - 1}>↓</button>
                            <button onClick={() => handleToggleVisibility(link.id)}>{link.isVisible ? 'Hide' : 'Show'}</button>
                            <button onClick={() => handleEditLink(link.id)}>Edit</button>
                            <button onClick={() => handleDeleteLink(link.id)} className="btn-delete">Hapus</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {activeAdminTab === 'album' && (
                  <section>
                    <h2>Pengaturan Album</h2>
                    <form onSubmit={handleAlbumSubmit} className="admin-form">
                      <h3>{editingAlbumId ? 'Edit Foto' : 'Tambah Foto Baru'}</h3>
                      <input name="photoUrl" value={albumFormData.photoUrl} onChange={(e) => handleInputChange(e, 'album')} placeholder="URL Foto" />
                      <textarea name="description" value={albumFormData.description} onChange={(e) => handleInputChange(e, 'album')} placeholder="Deskripsi Foto (Opsional)"></textarea>
                      <div className="form-actions">
                        <button type="submit">{editingAlbumId ? 'Simpan' : 'Tambah'}</button>
                        {editingAlbumId && <button type="button" onClick={handleCancelEditAlbum}>Batal</button>}
                      </div>
                    </form>
                    <div className="admin-list-container">
                      {albumPhotos.map((photo) => (
                        <div key={photo.id} className="admin-item">
                          {photo.photoUrl ? <img src={photo.photoUrl} alt="" className="admin-item-photo" /> : <div className="admin-item-photo placeholder" />}
                          <div className="admin-item-info"><strong>{photo.description || 'Tanpa deskripsi'}</strong></div>
                          <div className="admin-item-actions">
                            <button onClick={() => handleEditAlbum(photo.id)}>Edit</button>
                            <button onClick={() => handleDeleteAlbum(photo.id)} className="btn-delete">Hapus</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                
                {activeAdminTab === 'tentang' && <section><h2>Pengaturan Tentang Kami</h2><div className="admin-form"><textarea value={tempAboutUsText} onChange={(e) => setTempAboutUsText(e.target.value)} rows={8}/><div className="form-actions"><button onClick={handleSaveAboutUs}>Simpan Tentang Kami</button>{saveConfirmation && <span className="save-confirmation">{saveConfirmation}</span>}</div></div></section>}
              
                {activeAdminTab === 'riwayat' && (
                  <section>
                    <div className="history-header">
                        <h2>Riwayat Aktivitas Admin</h2>
                        <button onClick={handleClearHistory} className="btn-delete">Hapus Riwayat</button>
                    </div>
                    <div className="history-log-container">
                        {activityLog.length > 0 ? (
                            activityLog.map(log => (
                                <div key={log.id} className="history-log-item">
                                    <div className="log-meta">
                                        <span className="log-admin">{log.adminEmail}</span>
                                        <span className="log-timestamp">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                                    </div>
                                    <p className="log-action">{log.action}</p>
                                </div>
                            ))
                        ) : (
                            <p>Belum ada aktivitas yang tercatat.</p>
                        )}
                    </div>
                  </section>
                )}

              </div>
            </div>
          )}
        </main>
        <footer className="app-footer">
          <p>Aplikasi ini di buat oleh Sengkud App</p>
        </footer>
      </div>
      
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={handleCloseModal} role="dialog" aria-modal="true" aria-label="Tampilan foto">
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={handleCloseModal} aria-label="Tutup">&times;</button>
            <img src={selectedPhoto.photoUrl} alt={selectedPhoto.description} className="modal-img" />
            {selectedPhoto.description && <p className="modal-caption">{selectedPhoto.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}