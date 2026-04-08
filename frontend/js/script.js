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
            { href: '/', text: 'Home', icon: 'fa-terminal' },
            { href: '/about.html', text: 'About', icon: 'fa-microchip' },
            { href: '/services.html', text: 'Services', icon: 'fa-layer-group' },
            { href: '/contact.html', text: 'Contact', icon: 'fa-code-branch' }
        ];
        
        let html = links.map(l => `
            <a href="${l.href}" class="${path === l.href || (path === '/' && l.href === '/') ? 'active' : ''}">
                <i class="fas ${l.icon}"></i> ${l.text}
            </a>
        `).join('');
        
        if (isLoggedIn) {
            html += `<a href="/admin.html" class="${path === '/admin.html' ? 'active' : ''}"><i class="fas fa-user-secret"></i> Admin</a>`;
            html += `<a href="#" id="logoutLink"><i class="fas fa-power-off"></i> Logout</a>`;
        } else {
            html += `<a href="/login.html" class="${path === '/login.html' ? 'active' : ''}"><i class="fas fa-fingerprint"></i> Login</a>`;
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

    // --- Contact Form ---
    const contactForm = document.getElementById('contactForm');
    const formMsg = document.getElementById('formMessage');

    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const msgInput = document.getElementById('message');

        // Add character counters
        msgInput.insertAdjacentHTML('afterend', `<div class="char-counter">>_ BUFFER: <span id="msgCount">0</span>/${CONSTRAINTS.MESSAGE_MAX}</div>`);
        
        msgInput.oninput = () => {
            const len = msgInput.value.length;
            document.getElementById('msgCount').textContent = len;
            document.getElementById('msgCount').style.color = len > CONSTRAINTS.MESSAGE_MAX ? 'var(--secondary)' : 'var(--primary)';
        };

        // Pre-fill
        const service = sessionStorage.getItem('requestedService');
        if (service) {
            msgInput.value = `// REQUEST_SERVICE: ${service}\n// INQUIRY: `;
            msgInput.dispatchEvent(new Event('input'));
            sessionStorage.removeItem('requestedService');
        }

        contactForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'UPLOADING_DATA...';

            try {
                const res = await fetch('/api/submissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
                });

                const result = await res.json();
                formMsg.style.display = 'block';
                if (res.ok) {
                    formMsg.innerHTML = `[SUCCESS]: ${result.message}`;
                    formMsg.className = 'success';
                    contactForm.reset();
                    document.getElementById('msgCount').textContent = '0';
                } else {
                    formMsg.innerHTML = `[ERROR]: ${result.message}`;
                    formMsg.className = 'error';
                }
            } catch (err) {
                formMsg.style.display = 'block';
                formMsg.innerHTML = `[CRITICAL_FAILURE]: NETWORK_LOST`;
                formMsg.className = 'error';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Message';
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
            btn.innerHTML = 'BYPASSING_FIREWALL...';

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
                    lMsg.innerHTML = `[DENIED]: ACCESS_RESTRICTED`;
                    lMsg.className = 'error';
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Login';
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
                    subTable.innerHTML = `<div style="text-align:center; padding:50px; opacity:0.6;"><i class="fas fa-ghost fa-3x"></i><p>DATABASE_EMPTY</p></div>`;
                    return;
                }

                subTable.innerHTML = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>OBJECT_ID</th>
                                    <th>CONTENT_PREVIEW</th>
                                    <th>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(s => `
                                    <tr>
                                        <td>
                                            <span style="color:var(--primary)">#${s.name}</span><br>
                                            <small>${s.email}</small>
                                        </td>
                                        <td title="${s.message}">${s.message.substring(0, 40)}...</td>
                                        <td>
                                            <button class="delete-btn" onclick="deleteSub('${s.id}')">
                                                DEL
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
        if (!confirm('EXECUTE_DELETE?')) return;
        await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
        fetchSubmissions();
    };
});
