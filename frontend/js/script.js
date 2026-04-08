document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const nav = document.querySelector('nav');
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

    function updateNavigation() {
        if (!nav) return;
        
        // Clear current nav but keep constant links
        const constantLinks = `
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="/services.html">Services</a>
            <a href="/contact.html">Contact</a>
        `;
        
        let dynamicLinks = '';
        if (isLoggedIn) {
            dynamicLinks += '<a href="/admin.html">Admin</a>';
            dynamicLinks += '<a href="#" id="logoutLink">Logout</a>';
        } else {
            dynamicLinks += '<a href="/login.html">Login</a>';
        }
        
        nav.innerHTML = constantLinks + dynamicLinks;

        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('loggedIn');
                window.location.href = '/login.html';
            });
        }
    }

    updateNavigation();

    // --- Services Page - Request Info ---
    document.querySelectorAll('.req-info').forEach(btn => {
        btn.addEventListener('click', () => {
            const service = btn.getAttribute('data-service');
            sessionStorage.setItem('requestedService', service);
            window.location.href = '/contact.html';
        });
    });

    // --- Contact Form Submission ---
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
        // Pre-fill message if redirected from services
        const requestedService = sessionStorage.getItem('requestedService');
        if (requestedService) {
            const messageField = document.getElementById('message');
            if (messageField) {
                messageField.value = `I am interested in ${requestedService}. Please provide more information.`;
            }
            sessionStorage.removeItem('requestedService');
        }

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/submissions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    formMessage.textContent = result.message;
                    formMessage.className = 'success';
                    contactForm.reset();
                } else {
                    formMessage.textContent = result.message || 'Error submitting form.';
                    formMessage.className = 'error';
                }
            } catch (error) {
                console.error('Network error:', error);
                formMessage.textContent = 'Network error. Please try again.';
                formMessage.className = 'error';
            }
        });
    }

    // --- Login Form Submission ---
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    loginMessage.textContent = result.message;
                    loginMessage.className = 'success';
                    localStorage.setItem('loggedIn', 'true');
                    window.location.href = '/admin.html';
                } else {
                    loginMessage.textContent = result.message || 'Login failed.';
                    loginMessage.className = 'error';
                }
            } catch (error) {
                console.error('Network error:', error);
                loginMessage.textContent = 'Network error. Please try again.';
                loginMessage.className = 'error';
            }
        });
    }

    // --- Admin Page - Fetch Submissions ---
    const submissionsTableContainer = document.getElementById('submissionsTableContainer');
    const adminMessage = document.getElementById('adminMessage');

    if (submissionsTableContainer && window.location.pathname === '/admin.html') {
        if (!isLoggedIn) {
            adminMessage.textContent = 'Access Denied. Please log in first.';
            adminMessage.className = 'error';
            submissionsTableContainer.innerHTML = '';
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        fetchSubmissions();
    }

    async function fetchSubmissions() {
        try {
            const response = await fetch('/api/submissions');
            const submissions = await response.json();

            if (response.ok) {
                if (submissions.length === 0) {
                    submissionsTableContainer.innerHTML = '<p>No submissions yet.</p>';
                    return;
                }

                let tableHTML = '<table>';
                tableHTML += '<thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Message</th><th>Actions</th></tr></thead>';
                tableHTML += '<tbody>';
                submissions.forEach(sub => {
                    tableHTML += `
                        <tr>
                            <td>${sub.id}</td>
                            <td>${sub.name}</td>
                            <td>${sub.email}</td>
                            <td>${sub.message}</td>
                            <td><button class="delete-btn" data-id="${sub.id}">Delete</button></td>
                        </tr>
                    `;
                });
                tableHTML += '</tbody></table>';
                submissionsTableContainer.innerHTML = tableHTML;

                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const id = btn.getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this submission?')) {
                            await deleteSubmission(id);
                        }
                    });
                });
            } else {
                adminMessage.textContent = 'Error fetching submissions.';
                adminMessage.className = 'error';
                submissionsTableContainer.innerHTML = '';
            }
        } catch (error) {
            console.error('Network error:', error);
            adminMessage.textContent = 'Network error. Please try again.';
            adminMessage.className = 'error';
            submissionsTableContainer.innerHTML = '';
        }
    }

    async function deleteSubmission(id) {
        try {
            const response = await fetch(`/api/submissions/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchSubmissions(); // Refresh the table
            } else {
                const result = await response.json();
                alert(result.message || 'Error deleting submission.');
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network error. Please try again.');
        }
    }
});
