// app/dashboard/page.js
// 🔒 IMPLEMENTASI: A01:2021 (IDOR) - Verifikasi akses user
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeSection, setActiveSection] = useState('pilihkopi');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', isError: false });

  const API_URL = '/api';

  // Form state
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productId: '',
    quantity: 1,
    notes: '',
    totalPrice: 0,
  });

  // Show notification
  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification({ message: '', isError: false }), 3000);
  };

  // Check login status
  const checkLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.isLoggedIn) {
        setCurrentUser(data.user);
        setOrderForm(prev => ({
          ...prev,
          customerName: data.user.fullname || '',
        }));
        return true;
      } else {
        router.push('/login');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
      return false;
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Gagal memuat produk', true);
    }
  };

  // 🔒 Load orders dengan verifikasi (A01:2021)
  const loadOrders = async () => {
    if (!currentUser) return;
    try {
      // 🔒 Hanya bisa load orders sendiri (IDOR protection di backend)
      const response = await fetch(`${API_URL}/orders/user/${currentUser.id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else if (data.message === 'Anda tidak memiliki akses ke order ini') {
        // 🔒 Jika ada percobaan IDOR
        showNotification('⚠️ Akses ditolak!', true);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showNotification('Gagal memuat order', true);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    const selectedProduct = products.find(p => p.id === parseInt(orderForm.productId));
    const price = selectedProduct ? parseInt(selectedProduct.price) : 0;
    const total = price * (orderForm.quantity || 0);
    setOrderForm(prev => ({ ...prev, totalPrice: total }));
    return total;
  };

  // Handle product selection
  const selectProductToOrder = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setActiveSection('order');
      setOrderForm(prev => ({ ...prev, productId: String(productId) }));
      calculateTotal();
      showNotification(`${product.name} dipilih! Silakan lanjutkan pesanan.`);
    }
  };

  // 🔒 Handle order submit dengan validasi
  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    // 🔒 Validasi tambahan sebelum submit (A03:2021)
    const {
      customerName,
      customerPhone,
      customerAddress,
      productId,
      quantity,
      notes,
    } = orderForm;

    // Validasi product
    if (!productId) {
      showNotification('Silakan pilih kopi terlebih dahulu!', true);
      return;
    }

    // Validasi data diri
    if (!customerName || customerName.trim().length < 3) {
      showNotification('Nama lengkap minimal 3 karakter!', true);
      return;
    }

    if (!customerPhone || customerPhone.trim().length < 10) {
      showNotification('Nomor HP minimal 10 digit!', true);
      return;
    }

    if (!customerAddress || customerAddress.trim().length < 5) {
      showNotification('Alamat minimal 5 karakter!', true);
      return;
    }

    // 🔒 Validasi quantity
    if (!quantity || quantity < 1) {
      showNotification('Jumlah minimal 1!', true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: currentUser.id,
          product_id: parseInt(productId),
          quantity: quantity,
          notes: notes || '',
          total_price: orderForm.totalPrice,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`✅ Pesanan berhasil dibuat! Order ID: #${data.orderId}`);

        // Reset form
        setOrderForm({
          customerName: currentUser.fullname || '',
          customerPhone: '',
          customerAddress: '',
          productId: '',
          quantity: 1,
          notes: '',
          totalPrice: 0,
        });

        setTimeout(() => {
          setActiveSection('lihatorder');
          loadOrders();
          showNotification('📋 Lihat order kamu di sini!', false);
        }, 2000);
      } else {
        showNotification(data.message || 'Gagal membuat pesanan', true);
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Terjadi kesalahan sistem', true);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      
      showNotification('👋 Berhasil logout!', false);
      
      setTimeout(() => {
        router.push('/login');
      }, 1000);
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('Gagal logout, coba lagi!', true);
    }
  };

  // Initialization
  useEffect(() => {
    const init = async () => {
      const loggedIn = await checkLogin();
      if (loggedIn) {
        await loadProducts();
        await loadOrders();
        calculateTotal();
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Recalculate total when product or quantity changes
  useEffect(() => {
    calculateTotal();
  }, [orderForm.productId, orderForm.quantity]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i> Loading...
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Render coffee grid
  const renderCoffeeGrid = () => {
    if (products.length === 0) {
      return <div className={styles.emptyOrders}>Belum ada produk tersedia</div>;
    }

    return products.map((product) => (
      <div
        key={product.id}
        className={styles.coffeeCard}
        onClick={() => selectProductToOrder(product.id)}
      >
        <div className={styles.coffeeIcon}>
          <img
            src={product.image_url || 'https://via.placeholder.com/200x200?text=Coffee'}
            alt={product.name}
          />
        </div>
        <h3>{product.name}</h3>
        <p>{product.description || 'Nikmati kesegaran kopi pilihan'}</p>
        <div className={styles.price}>
          Rp {parseInt(product.price).toLocaleString()}
        </div>
        <button
          className={styles.orderBtn}
          onClick={(e) => {
            e.stopPropagation();
            selectProductToOrder(product.id);
          }}
        >
          Pesan Sekarang →
        </button>
      </div>
    ));
  };

  // Render orders list
  const renderOrders = () => {
    if (orders.length === 0) {
      return (
        <div className={styles.emptyOrders}>
          <i className="fas fa-coffee" style={{ fontSize: '50px', marginBottom: '20px' }}></i>
          <p>Belum ada order</p>
          <p style={{ marginTop: '10px' }}>Yuk pesan kopi dulu!</p>
        </div>
      );
    }

    return orders.map((order) => (
      <div key={order.id} className={styles.orderItem}>
        <div className={styles.orderHeader}>
          <span className={styles.orderId}>#{order.id}</span>
          <span className={`${styles.orderStatus} ${styles[`status${order.status}`]}`}>
            {order.status === 'pending' ? '⏳ Pending' :
              order.status === 'proses' ? '🔄 Diproses' : '✅ Selesai'}
          </span>
        </div>
        <div className={styles.orderDetails}>
          <p><strong>☕ Kopi:</strong> {order.product_name}</p>
          <p><strong>📦 Jumlah:</strong> {order.quantity} pcs</p>
          <p><strong>📍 Alamat:</strong> {order.customer_address}</p>
          <p><strong>📞 No. HP:</strong> {order.customer_phone}</p>
          {order.notes && <p><strong>📝 Catatan:</strong> {order.notes}</p>}
          <p><strong>📅 Tanggal:</strong> {new Date(order.created_at).toLocaleString('id-ID')}</p>
          <div className={styles.orderPrice}>
            💰 Total: Rp {parseInt(order.total_price).toLocaleString()}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.dashboard}>
      {/* Notification */}
      {notification.message && (
        <div
          className={styles.notification}
          style={{ background: notification.isError ? '#DC2626' : '#4CAF50' }}
        >
          {notification.message}
        </div>
      )}

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <i className="fas fa-mug-hot"></i>
          <h2>Brew & Co.</h2>
        </div>
        <div className={styles.navLinks}>
          <div
            className={`${styles.navLink} ${activeSection === 'pilihkopi' ? styles.active : ''}`}
            onClick={() => setActiveSection('pilihkopi')}
          >
            Menu
          </div>
          <div
            className={`${styles.navLink} ${activeSection === 'order' ? styles.active : ''}`}
            onClick={() => setActiveSection('order')}
          >
            Order
          </div>
          <div
            className={`${styles.navLink} ${activeSection === 'lihatorder' ? styles.active : ''}`}
            onClick={() => {
              setActiveSection('lihatorder');
              loadOrders();
            }}
          >
            Lihat Order
          </div>
        </div>
        <div className={styles.userInfo}>
          <i className="fas fa-user-circle"></i>
          <span>{currentUser.fullname}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.mainContainer}>
        {/* Welcome Section */}
        <div className={`${styles.welcomeSection} ${activeSection === 'pilihkopi' ? '' : styles.hide}`}>
          <h1>Selamat Datang di Brew & Co. ☕</h1>
          <p>Nikmati berbagai pilihan kopi terbaik kami</p>
        </div>

        {/* Menu Section */}
        <div className={`${styles.contentSection} ${activeSection === 'pilihkopi' ? styles.active : ''}`}>
          <div className={styles.coffeeGrid}>{renderCoffeeGrid()}</div>
        </div>

        {/* Order Section */}
        <div className={`${styles.contentSection} ${activeSection === 'order' ? styles.active : ''}`}>
          <div className={styles.orderFormContainer}>
            <h2><i className="fas fa-shopping-cart"></i> Buat Order Baru</h2>
            <form onSubmit={handleOrderSubmit}>
              <div className={styles.formGroup}>
                <label>Nama Lengkap <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                  required
                  minLength={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>No. HP <span className={styles.required}>*</span></label>
                <input
                  type="tel"
                  placeholder="Masukkan nomor HP aktif"
                  value={orderForm.customerPhone}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                  required
                  minLength={10}
                  pattern="[0-9]+"
                  title="Hanya angka"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Alamat <span className={styles.required}>*</span></label>
                <textarea
                  rows="2"
                  placeholder="Masukkan alamat lengkap"
                  value={orderForm.customerAddress}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                  required
                  minLength={5}
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label>Pilih Menu <span className={styles.required}>*</span></label>
                <select
                  value={orderForm.productId}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, productId: e.target.value }))}
                  required
                >
                  <option value="">Pilih menu favorit Anda</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Rp {parseInt(product.price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Jumlah <span className={styles.required}>*</span></label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Catatan (opsional)</label>
                <textarea
                  rows="3"
                  placeholder="Contoh: kurang manis, pake es batu banyak, dll"
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                  maxLength={200}
                ></textarea>
                <small className={styles.charCount}>
                  {orderForm.notes.length}/200 karakter
                </small>
              </div>
              <div className={styles.formGroup}>
                <label>Total Harga</label>
                <input
                  type="text"
                  value={`Rp ${orderForm.totalPrice.toLocaleString()}`}
                  readOnly
                  className={styles.totalPriceInput}
                />
              </div>
              <button type="submit" className={styles.submitOrderBtn}>
                Pesan Sekarang →
              </button>
            </form>
          </div>
        </div>

        {/* Orders Section */}
        <div className={`${styles.contentSection} ${activeSection === 'lihatorder' ? styles.active : ''}`}>
          <div className={styles.ordersList}>{renderOrders()}</div>
        </div>
      </div>
    </div>
  );
}