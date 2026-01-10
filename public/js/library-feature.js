
/**
 * Library Feature Logic
 * Handles viewing, filtering, uploading, and deleting library documents.
 */

if (typeof window.allBooks === 'undefined') window.allBooks = [];
if (typeof window.currentFilter === 'undefined') window.currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadBooks === 'function') {
        loadBooks();
        setupLibraryUpload();
    }
});

// Seed data for demo when API is empty
if (typeof window.seedBooks === 'undefined') {
    window.seedBooks = [
        { id: 1, category: 'SGK', title: 'Toán 12', description: 'Sách giáo khoa Toán lớp 12', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 2, category: 'SGK', title: 'Ngữ Văn 12', description: 'Sách giáo khoa Ngữ Văn lớp 12', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 3, category: 'SGK', title: 'Vật Lý 12', description: 'Sách giáo khoa Vật Lý lớp 12', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 4, category: 'SGK', title: 'Hóa Học 12', description: 'Sách giáo khoa Hóa Học lớp 12', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 5, category: 'SGK', title: 'Tiếng Anh 12', description: 'Sách giáo khoa Tiếng Anh lớp 12', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 6, category: 'Truyện', title: 'Dế Mèn Phiêu Lưu Ký', description: 'Truyện dài của Tô Hoài', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 7, category: 'Truyện', title: 'Tấm Cám', description: 'Truyện cổ tích Việt Nam', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 8, category: 'Truyện', title: 'Chí Phèo', description: 'Truyện ngắn của Nam Cao', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 9, category: 'Truyện', title: 'Số Đỏ', description: 'Tiểu thuyết của Vũ Trọng Phụng', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 10, category: 'Tài liệu', title: 'Đề Thi THPT 2024', description: 'Bộ đề thi tham khảo', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 11, category: 'Tài liệu', title: 'Công Thức Toán', description: 'Tổng hợp công thức Toán', fileType: 'pdf', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
        { id: 12, category: 'Tài liệu', title: 'Bảng Tuần Hoàn', description: 'Bảng tuần hoàn nguyên tố', fileType: 'image', url: '', uploader: 'Hệ thống', uploaderRole: 'admin', schoolName: 'Hệ thống', uploadDate: new Date().toISOString() },
    ];
}

async function loadBooks() {
    try {
        const response = await fetch('/api/library');
        const data = await response.json();

        if (data.success && data.documents && data.documents.length > 0) {
            allBooks = data.documents;
        } else {
            // Use seed data when API returns empty
            allBooks = seedBooks;
        }
        renderBooks(allBooks);
    } catch (e) {
        console.error('Error loading library:', e);
        // Use seed data as fallback
        allBooks = seedBooks;
        renderBooks(allBooks);
    }
}

function renderBooks(books) {
    const list = document.getElementById('book-list');
    if (!list) return;

    list.innerHTML = '';

    if (books.length === 0) {
        list.innerHTML = `
            <div class="col-12 text-center text-white-50 py-5">
                <i class="fa-solid fa-book-open fa-3x mb-3"></i>
                <p>Chưa có tài liệu nào trong thư viện.</p>
            </div>
        `;
        return;
    }

    // Icon mapping for different categories
    const iconMap = {
        'SGK': 'fa-book',
        'Truyện': 'fa-hat-wizard',
        'Tài liệu': 'fa-file-pdf',
        'Đề thi': 'fa-clipboard-list',
        'default': 'fa-book-open'
    };

    books.forEach(book => {
        const category = book.category || 'Tài liệu';
        const icon = iconMap[category] || iconMap['default'];
        const tagClass = category === 'SGK' ? 'sgk' : (category === 'Truyện' ? 'truyen' : 'tailieu');

        const card = `
            <div class="col-6 col-md-4 col-xl-3">
                <div class="ebook-card" style="position: relative;">
                    <div class="ebook-cover">
                        <i class="fa-solid ${icon}"></i>
                        <div class="ebook-tag">${category.toUpperCase()}</div>
                    </div>
                    <div class="px-3 pb-2">
                        <div class="fw-bold mb-1" style="color: var(--primary); font-size: 0.95rem;">${book.title}</div>
                        <p class="text-white-50 mb-2" style="font-size: 0.75rem; line-height: 1.3;">${book.description || ''}</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="previewBook('${book.url || ''}', '${book.fileType || 'pdf'}'); event.stopPropagation();">
                                <i class="fa-solid fa-eye me-1"></i>Xem
                            </button>
                            <button class="btn btn-sm btn-outline-light rounded-pill px-3" onclick="downloadBook('${book.url || ''}', '${book.title}'); event.stopPropagation();">
                                <i class="fa-solid fa-download me-1"></i>Tải
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        list.innerHTML += card;
    });
}

function filterBooks(category, btn) {
    currentFilter = category;

    // Update active button
    if (btn) {
        document.querySelectorAll('.lib-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    if (category === 'all') {
        renderBooks(allBooks);
    } else {
        // Simple mapping or exact match
        const filtered = allBooks.filter(b => {
            const cat = (b.category || '').toLowerCase();
            if (category === 'sgk') return cat.includes('sgk') || cat.includes('sách');
            if (category === 'truyen') return cat.includes('truyện') || cat.includes('story');
            if (category === 'tailieu') return !cat.includes('sgk') && !cat.includes('truyện');
            return true;
        });
        renderBooks(filtered);
    }
}

async function uploadBook(file, meta) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', meta.title);
    formData.append('category', meta.category);
    formData.append('description', meta.description);
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    // Double check on client side, though server also checks
    if (userData.role === 'student') {
        toast.error('Học sinh không được phép tải lên!');
        return false;
    }

    formData.append('uploader', userData.fullname || userData.username);
    formData.append('role', userData.role);
    formData.append('school', userData.schoolName || 'Hệ thống');

    // Determine type
    let type = 'other';
    if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('image')) type = 'image';
    else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) type = 'doc';
    formData.append('type', type);

    try {
        const response = await fetch('/api/library', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            toast.success('Đã tải lên tài liệu thành công!');
            loadBooks(); // Reload list
            return true;
        } else {
            toast.error(data.message || 'Lỗi tải lên');
            return false;
        }
    } catch (e) {
        console.error(e);
        toast.error('Lỗi kết nối server');
        return false;
    }
}

async function deleteBook(id) {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;

    try {
        const response = await fetch(`/api/library/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            toast.success('Đã xóa tài liệu!');
            loadBooks();
        } else {
            toast.error(data.message);
        }
    } catch (e) {
        toast.error('Lỗi xóa tài liệu');
    }
}

function previewBook(url, type) {
    // Get book title from the card if possible
    const title = 'Xem tài liệu';

    if (!url || url === '#' || url === 'undefined' || url === '') {
        // No preview available - show nice message in modal
        if (typeof openUniversalModal === 'function') {
            openUniversalModal(title, `
                <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;">
                    <i class="fa-solid fa-book-open fa-4x mb-4" style="color:var(--primary);opacity:0.7;"></i>
                    <h4 class="text-white mb-3">Không có bản xem trước</h4>
                    <p class="text-white-50 mb-4">Tài liệu này hiện chưa có file.<br>Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
                    <button class="btn btn-outline-light" onclick="closeUniversalModal()">
                        <i class="fa-solid fa-arrow-left me-2"></i>Quay lại
                    </button>
                </div>
            `);
        } else if (typeof toast !== 'undefined') {
            toast.info('Không có bản xem trước');
        }
        return;
    }

    // Open in modal instead of new tab
    if (typeof openUniversalModal === 'function') {
        if (type === 'pdf' || type === 'image') {
            openUniversalModal(title, `
                <div style="height:100%;display:flex;flex-direction:column;">
                    <iframe src="${url}" style="flex:1;border:none;border-radius:8px;"></iframe>
                    <div class="text-center mt-2">
                        <small class="text-white-50">Nếu không xem được, <a href="${url}" target="_blank" style="color:var(--primary)">nhấn vào đây</a></small>
                    </div>
                </div>
            `);
        } else {
            // For other types, show download option
            openUniversalModal(title, `
                <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;">
                    <i class="fa-solid fa-file fa-4x mb-4" style="color:var(--primary);opacity:0.7;"></i>
                    <h4 class="text-white mb-3">Xem trước không khả dụng</h4>
                    <p class="text-white-50 mb-4">Định dạng file này không hỗ trợ xem trực tiếp.</p>
                    <a href="${url}" target="_blank" class="btn btn-primary">
                        <i class="fa-solid fa-external-link me-2"></i>Mở trong tab mới
                    </a>
                </div>
            `);
        }
    } else {
        // Fallback to old behavior if modal not available
        window.open(url, '_blank');
    }
}

function downloadBook(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function setupLibraryUpload() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    // Students cannot see the upload button
    if (userData.role === 'student') return;

    // Check if upload button exists, if not, create it
    const header = document.querySelector('#library-view .d-flex.justify-content-between');
    if (header && !document.getElementById('btn-lib-upload')) {
        const btn = document.createElement('button');
        btn.id = 'btn-lib-upload';
        btn.className = 'btn btn-primary rounded-pill px-3 ms-2';
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up me-2"></i>Tải lên';
        btn.onclick = showUploadModal;
        header.querySelector('.btn-group').before(btn);
    }
}

function showUploadModal() {
    // Create modal dynamically if not exists
    let modal = document.getElementById('lib-upload-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'lib-upload-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content glass-card border-0">
                    <div class="modal-header border-bottom border-white border-opacity-10">
                        <h5 class="modal-title text-white">Tải lên tài liệu mới</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="lib-upload-form">
                            <div class="mb-3">
                                <label class="form-label text-white-50">Tiêu đề</label>
                                <input type="text" class="form-control ai-input" id="lib-title" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white-50">Danh mục</label>
                                <select class="form-select ai-input" id="lib-cat">
                                    <option value="Sách giáo khoa">Sách giáo khoa</option>
                                    <option value="Truyện">Truyện</option>
                                    <option value="Tài liệu tham khảo">Tài liệu tham khảo</option>
                                    <option value="Đề thi">Đề thi</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white-50">Mô tả ngắn</label>
                                <textarea class="form-control ai-input" id="lib-desc" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white-50">File (PDF, Doc, Ảnh)</label>
                                <input type="file" class="form-control ai-input" id="lib-file" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-top border-white border-opacity-10">
                        <button type="button" class="btn btn-secondary rounded-pill" data-bs-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-primary rounded-pill" onclick="submitLibUpload()">Tải lên ngay</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

async function submitLibUpload() {
    const title = document.getElementById('lib-title').value;
    const category = document.getElementById('lib-cat').value;
    const desc = document.getElementById('lib-desc').value;
    const fileInput = document.getElementById('lib-file');

    if (!title || !fileInput.files[0]) {
        toast.warning('Vui lòng điền đủ thông tin!');
        return;
    }

    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
    btn.disabled = true;

    const success = await uploadBook(fileInput.files[0], {
        title, category, description: desc
    });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (success) {
        document.getElementById('lib-upload-form').reset();
        bootstrap.Modal.getInstance(document.getElementById('lib-upload-modal')).hide();
    }
}
