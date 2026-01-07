// frontend/app.js
const API_URL = 'http://localhost:3000';
let token = localStorage.getItem('jwtToken') || null;

// Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authMsg = document.getElementById('auth-msg');
const userNameEl = document.getElementById('user-name');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCurrencySelect = document.getElementById('toCurrency');
const recipientInput = document.getElementById('recipient');
const createOrderBtn = document.getElementById('createOrderBtn');
const ordersList = document.getElementById('ordersList');

function showAuth() {
  authSection.style.display = 'block';
  appSection.style.display = 'none';
}
function showApp(userName) {
  authSection.style.display = 'none';
  appSection.style.display = 'block';
  userNameEl.textContent = userName;
  loadOrders();
}

// ---- AUTH ----
async function register() {
  authMsg.textContent = '';
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!name || !email || !password) {
    authMsg.textContent = 'All fields required';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      authMsg.textContent = data.error || 'Register failed';
      return;
    }
    token = data.token;
    localStorage.setItem('jwtToken', token);
    showApp(data.name || name);
  } catch (e) {
    console.error('Register error', e);
    authMsg.textContent = 'Server error';
  }
}

async function login() {
  authMsg.textContent = '';
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    authMsg.textContent = 'Email & password required';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      authMsg.textContent = data.error || 'Login failed';
      return;
    }
    token = data.token;
    localStorage.setItem('jwtToken', token);
    showApp(data.name || email);
  } catch (e) {
    console.error('Login error', e);
    authMsg.textContent = 'Server error';
  }
}

function logout() {
  token = null;
  localStorage.removeItem('jwtToken');
  showAuth();
}

// ---- ORDERS ----
async function loadOrders() {
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) {
      // token invalid or expired
      logout();
      return;
    }
    const orders = await res.json();
    renderOrders(Array.isArray(orders) ? orders : []);
  } catch (e) {
    console.error('Fetch orders error', e);
    ordersList.innerHTML = '<li class="muted">Failed to load orders</li>';
  }
}

function renderOrders(orders) {
  ordersList.innerHTML = '';
  if (!orders.length) {
    ordersList.innerHTML = '<li class="muted">No orders yet</li>';
    return;
  }
  orders.forEach(order => {
    const li = document.createElement('li');
    li.textContent = `${order.amount} ${order.fromCurrency} → ${order.toCurrency} | ${order.recipient} | Status: ${order.status}`;
    ordersList.appendChild(li);
  });
}

// ---- CREATE ORDER + PAY ----
async function createOrderAndPay() {
  if (!token) { alert('Please login first'); return; }
  const amount = Number(amountInput.value);
  const fromCurrency = fromCurrencySelect.value;
  const toCurrency = toCurrencySelect.value;
  const recipient = recipientInput.value.trim();

  if (!amount || !recipient) { alert('Enter amount and recipient'); return; }

  try {
    // create order (endpoint expected: POST /orders/create)
    const resOrder = await fetch(`${API_URL}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount, fromCurrency, toCurrency, recipient })
    });
    const orderData = await resOrder.json();
    if (!resOrder.ok) { alert(orderData.error || 'Failed to create order'); return; }

    // create stripe session
    const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: orderData.id })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Payment error'); return; }

    window.location.href = data.url;

  } catch (e) {
    console.error('Create/pay error', e);
    alert('Error creating order or redirecting to Stripe');
  }
}

// ---- Events ----
registerBtn.onclick = register;
loginBtn.onclick = login;
createOrderBtn.onclick = createOrderAndPay;

// show initial view based on token
if (token) {
  // optionally verify token by fetching orders
  loadOrders().then(() => {
    // we need user's name — call /auth/me if you have it; otherwise show simple
    userNameEl.textContent = 'You';
    authSection.style.display = 'none';
    appSection.style.display = 'block';
  });
} else {
  showAuth();
}
