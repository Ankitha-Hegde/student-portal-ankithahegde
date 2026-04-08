document.addEventListener('DOMContentLoaded', () => {
    // --- Contact Form Submission ---
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
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
                    // For a real app, store a token or session. For this prototype, a simple redirect.
                    localStorage.setItem('loggedIn', 'true'); // Simple flag
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
        // Check if logged in (very basic check for prototype)
        if (localStorage.getItem('loggedIn') !== 'true') {
            adminMessage.textContent = 'Access Denied. Please log in first.';
            adminMessage.className = 'error';
            submissionsTableContainer.innerHTML = ''; // Clear loading message
            // Optionally redirect to login page
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
                tableHTML += '<thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Message</th></tr></thead>';
                tableHTML += '<tbody>';
                submissions.forEach(sub => {
                    tableHTML += `
                        <tr>
                            <td>${sub.id}</td>
                            <td>${sub.name}</td>
                            <td>${sub.email}</td>
                            <td>${sub.message}</td>
                        </tr>
                    `;
                });
                tableHTML += '</tbody></table>';
                submissionsTableContainer.innerHTML = tableHTML;
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
});