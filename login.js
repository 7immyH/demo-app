document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide previous errors
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';

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

            if (response.ok) {
                // Successful login, redirect to app
                window.location.href = '/';
            } else {
                // Show error message
                errorMessage.textContent = result.error || 'Login failed';
                errorMessage.style.display = 'block';

                // Reset button
                submitBtn.disabled = false;
                btnText.style.display = 'block';
                btnSpinner.style.display = 'none';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Network error. Please try again.';
            errorMessage.style.display = 'block';

            // Reset button
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
        }
    });
});
