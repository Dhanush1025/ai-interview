// auth-guard.js
window.currentUser = null;

async function checkAuthAndLoadProfile() {
    // Make sure supabaseClient is ready
    if (!window.supabaseClient) {
        console.error("Supabase client not initialized.");
        return;
    }

    // 1. Get session
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    
    if (sessionError || !session) {
        // Not logged in -> redirect to login page
        window.location.href = 'index.html';
        return;
    }

    // 2. Fetch Profile from DB
    const { data: profileData, error: profileError } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profileError) {
        console.error("Error fetching profile data:", profileError.message);
    }

    // Store in global object for other scripts to use
    window.currentUser = {
        ...session.user,
        profile: profileData || {}
    };

    // 3. Update the UI if on Home Page
    if (window.location.pathname.endsWith('home.html') || window.location.pathname === '/') {
        updateHomeUI(window.currentUser);
    }
}

function updateHomeUI(user) {
    const headerTitle = document.querySelector('.home-header h1');
    if (headerTitle) {
        const firstName = user.profile?.full_name ? user.profile.full_name.split(' ')[0] : 'there';
        headerTitle.innerHTML = `Welcome back, <span style="color: #00cec9;">${firstName}</span>!`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // We need to wait slightly for auth.js to initialize window.supabaseClient
    setTimeout(checkAuthAndLoadProfile, 200);
});
