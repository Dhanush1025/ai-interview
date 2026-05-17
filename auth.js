// Initialize Supabase Client
const SUPABASE_URL = 'https://kecbjrzpezxxqycjazxh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_D8BnCw2g7W-KOcQ-wE_zvQ_VmWNwNQj';

document.addEventListener('DOMContentLoaded', () => {
    
    if(typeof supabase === 'undefined') {
        console.error("Supabase script didn't load properly!");
        return;
    }

    // We make supabaseClient globally available
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ==========================================
    // 1. Google OAuth Logic
    // ==========================================
    async function signInWithGoogle(e) {
        e.preventDefault(); 
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/home.html'
                }
            });
            if (error) throw error;
        } catch (error) {
            alert("Failed to login with Google: " + error.message);
        }
    }

    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleRegisterBtn = document.getElementById('google-register-btn');
    if(googleLoginBtn) googleLoginBtn.addEventListener('click', signInWithGoogle);
    if(googleRegisterBtn) googleRegisterBtn.addEventListener('click', signInWithGoogle);


    // ==========================================
    // 2. Email / Password Login Logic
    // ==========================================
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const btn = loginForm.querySelector('button[type="submit"]');
            
            btn.textContent = 'Signing in...';
            btn.disabled = true;

            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                
                // Login successful, go to dashboard
                window.location.href = 'home.html';
                
            } catch (error) {
                alert("Login failed: " + error.message);
                btn.textContent = 'Sign In';
                btn.disabled = false;
            }
        });
    }

    // ==========================================
    // 3. Email / Password Sign Up Logic
    // ==========================================
    const registerForm = document.getElementById('register-form');
    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const btn = registerForm.querySelector('button[type="submit"]');
            
            btn.textContent = 'Creating account...';
            btn.disabled = true;

            try {
                // 1. Sign up the user in Supabase Auth
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                // 2. Optionally insert their name into the profiles table immediately
                if (data?.user) {
                    await window.supabaseClient.from('profiles').upsert({
                        id: data.user.id,
                        full_name: fullName
                    });
                }
                
                alert("Account created successfully! You can now access the dashboard.");
                window.location.href = 'home.html';
                
            } catch (error) {
                alert("Registration failed: " + error.message);
                btn.textContent = 'Sign Up';
                btn.disabled = false;
            }
        });
    }


    // ==========================================
    // 4. Session Check (Redirect if already logged in)
    // ==========================================
    async function checkSession() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'home.html';
        }
    }
    
    if(window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        checkSession();
    }
    // ==========================================
    // 5. Logout Logic
    // ==========================================
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const { error } = await window.supabaseClient.auth.signOut();
            if(error) {
                alert("Error logging out: " + error.message);
            } else {
                window.location.href = 'index.html';
            }
        });
    }

});
