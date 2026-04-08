document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation & Constants ---
    const nav = document.querySelector('nav');
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const CONSTRAINTS = {
        NAME_MAX: 50,
        MESSAGE_MAX: 500,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };

    function updateNavigation() {
        if (!nav) return;
        const path = window.location.pathname;
        const links = [
            { href: '/', text: 'Home', icon: 'fa-home' },
            { href: '/about.html', text: 'About', icon: 'fa-info-circle' },
            { href: '/services.html', text: 'Services', icon: 'fa-sparkles' },
            { href: '/contact.html', text: 'Contact', icon: 'fa-paper-plane' }
        ];
        
        let html = links.map(l => `
            <a href="${l.href}" class="${path === l.href || (path === '/' && l.href === '/') ? 'active' : ''}">
                <i class="fas ${l.icon}"></i> <span>${l.text}</span>
            </a>
        `).join('');
        
        if (isLoggedIn) {
            html += `<a href="/admin.html" class="${path === '/admin.html' ? 'active' : ''}"><i class="fas fa-shield-halved"></i> <span>Admin</span></a>`;
            html += `<a href="#" id="logoutLink"><i class="fas fa-power-off"></i> <span>Logout</span></a>`;
        } else {
            html += `<a href="/login.html" class="${path === '/login.html' ? 'active' : ''}"><i class="fas fa-user-lock"></i> <span>Login</span></a>`;
        }
        nav.innerHTML = html;

        const logout = document.getElementById('logoutLink');
        if (logout) logout.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedIn');
            window.location.href = '/login.html';
        };
    }

    updateNavigation();

    // --- Services Page ---
    document.querySelectorAll('.req-info').forEach(btn => {
        btn.onclick = () => {
            sessionStorage.setItem('requestedService', btn.getAttribute('data-service'));
            window.location.href = '/contact.html';
        };
    });

    // --- Contact Form with Strict Constraints ---
    const contactForm = document.getElementById('contactForm');
    const formMsg = document.getElementById('formMessage');

    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const msgInput = document.getElementById('message');

        // Add character counters
        msgInput.insertAdjacentHTML('afterend', `<div class="char-counter"><span id="msgCount">0</span>/${CONSTRAINTS.MESSAGE_MAX}</div>`);
        
        msgInput.oninput = () => {
            const len = msgInput.value.length;
            document.getElementById('msgCount').textContent = len;
            document.getElementById('msgCount').style.color = len > CONSTRAINTS.MESSAGE_MAX ? 'var(--error)' : 'inherit';
        };

        // Pre-fill
        const service = sessionStorage.getItem('requestedService');
        if (service) {
            msgInput.value = `Hello! I'm interested in ${service}. Please provide more details.`;
            msgInput.dispatchEvent(new Event('input'));
            sessionStorage.removeItem('requestedService');
        }

        contactForm.onsubmit = async (e) => {
            e.preventDefault();
            
            // Front-end Constraints
            if (nameInput.value.length > CONSTRAINTS.NAME_MAX) return alert('Name is too long!');
            if (!CONSTRAINTS.EMAIL_REGEX.test(emailInput.value)) return alert('Invalid email format!');
            if (msgInput.value.length > CONSTRAINTS.MESSAGE_MAX) return alert('Message is too long!');

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';

            try {
                const res = await fetch('/api/submissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
                });

                const result = await res.json();
                formMsg.style.display = 'block';
                if (res.ok) {
                    formMsg.innerHTML = `<i class="fas fa-star"></i> ${result.message}`;
                    formMsg.className = 'success';
                    contactForm.reset();
                    document.getElementById('msgCount').textContent = '0';
                } else {
                    formMsg.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${result.message}`;
                    formMsg.className = 'error';
                }
            } catch (err) {
                formMsg.style.display = 'block';
                formMsg.innerHTML = `<i class="fas fa-wifi"></i> Connection failed.`;
                formMsg.className = 'error';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            }
        };
    }

    // --- Login Form ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-key fa-fade"></i> Authenticating...';

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
                });
                const result = await res.json();
                if (res.ok && result.success) {
                    localStorage.setItem('loggedIn', 'true');
                    window.location.href = '/admin.html';
                } else {
                    const lMsg = document.getElementById('loginMessage');
                    lMsg.style.display = 'block';
                    lMsg.innerHTML = `<i class="fas fa-lock"></i> ${result.message}`;
                    lMsg.className = 'error';
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            }
        };
    }

    // --- Admin Page ---
    const subTable = document.getElementById('submissionsTableContainer');
    if (subTable && window.location.pathname === '/admin.html') {
        if (!isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }
        fetchSubmissions();
    }

    async function fetchSubmissions() {
        try {
            const res = await fetch('/api/submissions');
            const data = await res.json();

            if (res.ok) {
                if (data.length === 0) {
                    subTable.innerHTML = `<div style="text-align:center; padding:50px; opacity:0.6;"><i class="fas fa-box-open fa-3x"></i><p>Clean inbox!</p></div>`;
                    return;
                }

                subTable.innerHTML = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Message</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(s => `
                                    <tr>
                                        <td>
                                            <strong>${s.name}</strong><br>
                                            <small><a href="mailto:${s.email}">${s.email}</a></small>
                                        </td>
                                        <td title="${s.message}">${s.message.substring(0, 50)}${s.message.length > 50 ? '...' : ''}</td>
                                        <td>
                                            <button class="delete-btn" onclick="deleteSub('${s.id}')">
                                                <i class="fas fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`;
            }
        } catch (e) {}
    }

    window.deleteSub = async (id) => {
        if (!confirm('Permanently delete this entry?')) return;
        await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
        fetchSubmissions();
    };
});
