// app/admin/dashboard/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', isError: false });

    // State data
    const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0 });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);

    // Modal states
    const [showProductModal, setShowProductModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' atau 'edit'

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, productId: null, productName: '' });

    // Form state
    const [productForm, setProductForm] = useState({
        id: '',
        name: '',
        price: '',
        description: '',
        imageUrl: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [orderStatus, setOrderStatus] = useState('');

    // Filter state
    const [searchProduct, setSearchProduct] = useState('');
    const [searchOrder, setSearchOrder] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const API_URL = '/api';

    // Show notification
    const showNotification = (message, isError = false) => {
        setNotification({ message, isError });
        setTimeout(() => setNotification({ message: '', isError: false }), 3000);
    };

    // Check admin login
    const checkAdminLogin = async () => {
        try {
            const response = await fetch(`${API_URL}/me`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.isLoggedIn && data.user?.role === 'admin') {
                setCurrentAdmin(data.user);
                return true;
            } else {
                router.push('/admin/login');
                return false;
            }
        } catch (error) {
            console.error('Error checking admin:', error);
            router.push('/admin/login');
            return false;
        }
    };

    // Load stats
    const loadStats = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            showNotification('Gagal memuat statistik', true);
        }
    };

    // Load products
    const loadProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/products`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            showNotification('Gagal memuat produk', true);
        }
    };

    // Load orders
    const loadOrders = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/orders`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            showNotification('Gagal memuat order', true);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/admin/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            
            localStorage.removeItem('admin');
            localStorage.removeItem('isAdminLoggedIn');
            
            showNotification('👋 Berhasil logout dari Admin Panel!', false);
            
            setTimeout(() => {
                router.push('/admin/login');
            }, 1500);
            
        } catch (error) {
            console.error('Error:', error);
            showNotification('❌ Gagal logout, coba lagi!', true);
        }
    };

    // Handle product submit
const handleProductSubmit = async (e) => {
    e.preventDefault();

    const { id, name, price, description, imageUrl } = productForm;

    if (!name || !price) {
        showNotification('Nama dan harga produk wajib diisi!', true);
        return;
    }

    try {
        let response;
        const body = {
            name,
            price: parseInt(price),
            description: description || '',
            image_url: imageUrl || 'https://placehold.co/150x150?text=Coffee'
        };

        const endpoint = id 
            ? `${API_URL}/admin/products/${id}`
            : `${API_URL}/admin/products`;
        const method = id ? 'PUT' : 'POST';

        response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        // Cek response
        if (!response.ok) {
            const text = await response.text();
            console.error('Error response:', text);
            try {
                const errorData = JSON.parse(text);
                showNotification(`❌ ${errorData.message || 'Gagal menyimpan produk'}`, true);
            } catch {
                showNotification(`❌ Server error: ${response.status}`, true);
            }
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            showNotification(id ? '✅ Produk berhasil diupdate!' : '✅ Produk berhasil ditambahkan!', false);
            closeModal();
            await loadProducts();
            await loadStats();
            setProductForm({ id: '', name: '', price: '', description: '', imageUrl: '' });
            setSelectedImage(null);
        } else {
            showNotification(`❌ ${data.message || 'Gagal menyimpan produk'}`, true);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Terjadi kesalahan: ' + error.message, true);
    }
};

    // Handle delete product - Buka modal konfirmasi
    const handleDeleteProduct = (id) => {
        const product = products.find(p => p.id === id);
        if (product) {
            setDeleteConfirm({
                show: true,
                productId: id,
                productName: product.name
            });
        }
    };

    // Confirm delete
    const confirmDelete = async () => {
        const { productId } = deleteConfirm;
        try {
            const response = await fetch(`${API_URL}/admin/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                showNotification('✅ Produk berhasil dihapus!', false);
                await loadProducts();
                await loadStats();
                setDeleteConfirm({ show: false, productId: null, productName: '' });
            } else {
                showNotification('❌ Gagal menghapus produk', true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('❌ Terjadi kesalahan', true);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setDeleteConfirm({ show: false, productId: null, productName: '' });
    };

    // Handle update order status
    const handleUpdateOrderStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/orders/${currentOrderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: orderStatus }),
            });
            const data = await response.json();
            if (data.success) {
                showNotification(`✅ Status order #${currentOrderId} diupdate!`, false);
                closeStatusModal();
                await loadOrders();
                await loadStats();
            } else {
                showNotification('❌ Gagal update status', true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('❌ Terjadi kesalahan', true);
        }
    };

    // Modal functions - PAKAI STATE
    const openAddModal = () => {
        setModalMode('add');
        setProductForm({ id: '', name: '', price: '', description: '', imageUrl: '' });
        setSelectedImage(null);
        setShowProductModal(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setProductForm({
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description || '',
            imageUrl: product.image_url || ''
        });
        setSelectedImage(null);
        setShowProductModal(true);
    };

    const closeModal = () => {
        setShowProductModal(false);
    };

    const openStatusModal = (orderId, status) => {
        setCurrentOrderId(orderId);
        setOrderStatus(status);
        setShowStatusModal(true);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
    };

    // Image preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target.result);
                setProductForm(prev => ({ ...prev, imageUrl: event.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Initialization
    useEffect(() => {
        const init = async () => {
            const isAdmin = await checkAdminLogin();
            if (isAdmin) {
                await Promise.all([loadStats(), loadProducts(), loadOrders()]);
                setIsLoading(false);
            }
        };
        init();
    }, []);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <i className="fas fa-spinner fa-spin"></i> Loading...
            </div>
        );
    }

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase())
    );

    // Filter orders
    const filteredOrders = orders.filter(o => {
        const matchSearch = o.id.toString().includes(searchOrder) ||
            o.customer_name?.toLowerCase().includes(searchOrder.toLowerCase()) ||
            o.product_name?.toLowerCase().includes(searchOrder.toLowerCase());
        const matchStatus = filterStatus === 'all' || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    // Get status text
    const getStatusText = (status) => {
        switch(status) {
            case 'pending': return '⏳ Pending';
            case 'proses': return '🔄 Diproses';
            case 'selesai': return '✅ Selesai';
            default: return status;
        }
    };

    return (
        <div className={styles.dashboard}>
            {/* Notification */}
            {notification.message && (
                <div
                    className={`${styles.notification} ${notification.isError ? styles.notificationError : styles.notificationSuccess}`}
                >
                    {notification.message}
                </div>
            )}

            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.logo}>
                    <i className="fas fa-mug-hot"></i>
                    <h2>Admin CoffeeShop</h2>
                </div>
                <div className={styles.navLinks}>
                    <div
                        className={`${styles.navLink} ${activeSection === 'dashboard' ? styles.active : ''}`}
                        onClick={() => { setActiveSection('dashboard'); loadStats(); }}
                    >
                        Dashboard
                    </div>
                    <div
                        className={`${styles.navLink} ${activeSection === 'produk' ? styles.active : ''}`}
                        onClick={() => { setActiveSection('produk'); loadProducts(); }}
                    >
                        Kelola Produk
                    </div>
                    <div
                        className={`${styles.navLink} ${activeSection === 'order' ? styles.active : ''}`}
                        onClick={() => { setActiveSection('order'); loadOrders(); }}
                    >
                        Lihat Order
                    </div>
                </div>
                <div className={styles.userInfo}>
                    <i className="fas fa-user-shield"></i>
                    <span>{currentAdmin?.fullname || 'Admin'}</span>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className={styles.mainContainer}>
                {/* Dashboard Section */}
                <div className={`${styles.contentSection} ${activeSection === 'dashboard' ? styles.active : ''}`}>
                    <div className={styles.statsContainer}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><i className="fas fa-box"></i></div>
                            <div className={styles.statNumber}>{stats.totalProducts}</div>
                            <div className={styles.statLabel}>Total Produk</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><i className="fas fa-shopping-cart"></i></div>
                            <div className={styles.statNumber}>{stats.totalOrders}</div>
                            <div className={styles.statLabel}>Total Order</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><i className="fas fa-clock"></i></div>
                            <div className={styles.statNumber}>{stats.pendingOrders}</div>
                            <div className={styles.statLabel}>Order Pending</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><i className="fas fa-money-bill"></i></div>
                            <div className={styles.statNumber}>Rp {stats.totalRevenue.toLocaleString()}</div>
                            <div className={styles.statLabel}>Total Pendapatan</div>
                        </div>
                    </div>
                </div>

                {/* Produk Section */}
                <div className={`${styles.contentSection} ${activeSection === 'produk' ? styles.active : ''}`}>
                    <div className={styles.sectionHeader}>
                        <h2><i className="fas fa-box"></i> Kelola Produk Kopi</h2>
                        <button className={styles.btnAdd} onClick={openAddModal}>
                            <i className="fas fa-plus"></i> Tambah Produk
                        </button>
                    </div>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                        />
                    </div>
                    <div className={styles.tableContainer}>
                        <table>
                            <thead>
                                <tr><th>ID</th><th>Gambar</th><th>Nama</th><th>Harga</th><th>Deskripsi</th><th>Aksi</th></tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.id}</td>
                                        <td>
                                            <img
                                                src={product.image_url || 'https://placehold.co/150x150?text=Coffee'}
                                                alt={product.name}
                                                className={styles.productImage}
                                                onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Image'; }}
                                            />
                                        </td>
                                        <td>{product.name}</td>
                                        <td>Rp {parseInt(product.price).toLocaleString()}</td>
                                        <td>{product.description ? product.description.substring(0, 50) : '-'}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button className={styles.btnEdit} onClick={() => openEditModal(product)}>
                                                    <i className="fas fa-edit"></i> Edit
                                                </button>
                                                <button className={styles.btnDelete} onClick={() => handleDeleteProduct(product.id)}>
                                                    <i className="fas fa-trash"></i> Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Order Section */}
                <div className={`${styles.contentSection} ${activeSection === 'order' ? styles.active : ''}`}>
                    <div className={styles.sectionHeader}>
                        <h2><i className="fas fa-shopping-cart"></i> Semua Order</h2>
                    </div>
                    <div className={styles.filterWrapper}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Cari order (ID/Nama)..."
                                value={searchOrder}
                                onChange={(e) => setSearchOrder(e.target.value)}
                            />
                        </div>
                        <select
                            className={styles.filterSelect}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="proses">Diproses</option>
                            <option value="selesai">Selesai</option>
                        </select>
                    </div>
                    <div className={styles.tableContainer}>
                        <table>
                            <thead>
                                <tr><th>ID Order</th><th>Pelanggan</th><th>Produk</th><th>Jumlah</th><th>Total</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>{order.customer_name || order.username}</td>
                                        <td>{order.product_name}</td>
                                        <td>{order.quantity}</td>
                                        <td>Rp {parseInt(order.total_price).toLocaleString()}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`]}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td>{new Date(order.created_at).toLocaleString('id-ID')}</td>
                                        <td>
                                            <button
                                                className={styles.btnView}
                                                onClick={() => openStatusModal(order.id, order.status)}
                                            >
                                                <i className="fas fa-sync-alt"></i> Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ===== PRODUCT MODAL (dengan state) ===== */}
            {showProductModal && (
                <div className={`${styles.modal} ${styles.active}`}>
                    <div className={styles.modalContent}>
                        <h3>{modalMode === 'add' ? 'Tambah Produk' : 'Edit Produk'}</h3>
                        <form onSubmit={handleProductSubmit}>
                            <div className={styles.formGroup}>
                                <label>Nama Produk</label>
                                <input
                                    type="text"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                    placeholder="Masukkan nama produk"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Harga (Rp)</label>
                                <input
                                    type="number"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                                    required
                                    placeholder="Masukkan harga"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Deskripsi</label>
                                <textarea
                                    rows="3"
                                    value={productForm.description}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Deskripsi produk (opsional)"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Gambar Produk</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                {productForm.imageUrl && (
                                    <div className={styles.imagePreview}>
                                        <img src={productForm.imageUrl} alt="Preview" />
                                    </div>
                                )}
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="submit" className={styles.btnSave}>
                                    <i className="fas fa-save"></i> Simpan
                                </button>
                                <button type="button" className={styles.btnCancel} onClick={closeModal}>
                                    <i className="fas fa-times"></i> Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== STATUS MODAL (dengan state) ===== */}
            {showStatusModal && (
                <div className={`${styles.modal} ${styles.active}`}>
                    <div className={styles.modalContent}>
                        <h3><i className="fas fa-sync-alt"></i> Update Status Order</h3>
                        <div className={styles.formGroup}>
                            <label>Status</label>
                            <select
                                value={orderStatus}
                                onChange={(e) => setOrderStatus(e.target.value)}
                            >
                                <option value="pending">⏳ Pending</option>
                                <option value="proses">🔄 Diproses</option>
                                <option value="selesai">✅ Selesai</option>
                            </select>
                        </div>
                        <div className={styles.modalButtons}>
                            <button className={styles.btnSave} onClick={handleUpdateOrderStatus}>
                                <i className="fas fa-check"></i> Update
                            </button>
                            <button className={styles.btnCancel} onClick={closeStatusModal}>
                                <i className="fas fa-times"></i> Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {deleteConfirm.show && (
                <div className={`${styles.modal} ${styles.active}`}>
                    <div className={styles.modalContent}>
                        <h3 style={{ color: '#DC2626' }}>
                            <i className="fas fa-exclamation-triangle"></i> Konfirmasi Hapus
                        </h3>
                        <p style={{ color: 'white', marginBottom: '20px', fontSize: '16px' }}>
                            Apakah Anda yakin ingin menghapus produk <strong style={{ color: '#FED8B1' }}>"{deleteConfirm.productName}"</strong>?
                            <br />
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                                Tindakan ini tidak dapat dibatalkan!
                            </span>
                        </p>
                        <div className={styles.modalButtons}>
                            <button 
                                className={styles.btnSave} 
                                onClick={confirmDelete}
                                style={{ background: '#DC2626', color: 'white' }}
                            >
                                <i className="fas fa-trash"></i> Ya, Hapus
                            </button>
                            <button 
                                className={styles.btnCancel} 
                                onClick={cancelDelete}
                            >
                                <i className="fas fa-times"></i> Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}