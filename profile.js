document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // TAB SWITCHING
    // =============================================
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const nextButtons = document.querySelectorAll('.next-tab');

    function switchTab(tabId) {
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabId) item.classList.add('active');
        });
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) content.classList.add('active');
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab);
        });
    });

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextTab = btn.dataset.next;
            if (nextTab) switchTab(nextTab);
        });
    });

    // =============================================
    // EDUCATION DYNAMIC LIST
    // =============================================
    const btnAddEdu = document.getElementById('add-education');
    const eduList = document.getElementById('education-list');

    if (btnAddEdu && eduList) {
        btnAddEdu.addEventListener('click', () => {
            const school = document.getElementById('edu-school').value.trim();
            const degree = document.getElementById('edu-degree').value.trim();
            const field = document.getElementById('edu-field').value.trim();
            const start = document.getElementById('edu-start').value;
            const end = document.getElementById('edu-end').value;

            if (!school || !degree) {
                alert('Please fill out Institution and Degree');
                return;
            }

            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <h4>${degree} in ${field || 'N/A'}</h4>
                <p>${school}</p>
                <span class="date">${start || '?'} - ${end || 'Present'}</span>
                <button type="button" class="delete-item"><i class="fa-solid fa-trash"></i></button>
            `;
            item.querySelector('.delete-item').addEventListener('click', () => item.remove());
            eduList.appendChild(item);
            document.getElementById('education-form').reset();
        });
    }

    // =============================================
    // EXPERIENCE DYNAMIC LIST
    // =============================================
    const btnAddExp = document.getElementById('add-experience');
    const expList = document.getElementById('experience-list');

    if (btnAddExp && expList) {
        btnAddExp.addEventListener('click', () => {
            const company = document.getElementById('exp-company').value.trim();
            const title = document.getElementById('exp-title').value.trim();
            const start = document.getElementById('exp-start').value;
            const end = document.getElementById('exp-end').value;
            const desc = document.getElementById('exp-desc').value.trim();

            if (!company || !title) {
                alert('Please fill out Company and Job Title');
                return;
            }

            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <h4>${title}</h4>
                <p>${company}</p>
                <span class="date">${start || '?'} - ${end || 'Present'}</span>
                ${desc ? `<p style="margin-top:5px;font-size:13px;opacity:0.7;">${desc}</p>` : ''}
                <button type="button" class="delete-item"><i class="fa-solid fa-trash"></i></button>
            `;
            item.querySelector('.delete-item').addEventListener('click', () => item.remove());
            expList.appendChild(item);
            document.getElementById('experience-form').reset();
        });
    }

    // =============================================
    // SKILLS DYNAMIC TAGS
    // =============================================
    const btnAddSkill = document.getElementById('add-skill');
    const skillInput = document.getElementById('skill-input');
    const skillsContainer = document.getElementById('skills-container');

    function addSkill() {
        if (!skillInput) return;
        const skill = skillInput.value.trim();
        if (!skill) return;

        const tag = document.createElement('div');
        tag.className = 'skill-tag';
        tag.innerHTML = `${skill} <i class="fa-solid fa-xmark"></i>`;
        tag.querySelector('i').addEventListener('click', () => tag.remove());
        skillsContainer.appendChild(tag);
        skillInput.value = '';
    }

    if (btnAddSkill) btnAddSkill.addEventListener('click', addSkill);
    if (skillInput) {
        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
        });
    }

    // =============================================
    // FILE UPLOAD
    // =============================================
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-upload');
    const filePreview = document.getElementById('file-preview');
    const fileNameEl = document.getElementById('file-name');
    const btnRemoveFile = document.getElementById('remove-file');

    function handleFile(file) {
        if (!file) return;
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (uploadArea) uploadArea.style.display = 'none';
        if (filePreview) filePreview.classList.remove('hidden');
    }

    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });
    }

    if (fileInput) fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });
    if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', () => {
            if (fileInput) fileInput.value = '';
            if (uploadArea) uploadArea.style.display = 'block';
            if (filePreview) filePreview.classList.add('hidden');
        });
    }

    // =============================================
    // COMPLETE SETUP & SAVE TO SUPABASE
    // =============================================
    const submitBtn = document.querySelector('.submit-profile');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {

            if (!window.supabaseClient) {
                alert("Auth system not loaded. Please refresh the page.");
                return;
            }

            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            try {
                const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

                if (!session || sessionError) {
                    alert('You must be logged in to save your profile!');
                    window.location.href = 'index.html';
                    return;
                }

                const userId = session.user.id;
                const userEmail = session.user.email;

                // Gather Personal Details
                const firstName = document.getElementById('first-name')?.value || '';
                const lastName = document.getElementById('last-name')?.value || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const phone = document.getElementById('phone')?.value || '';
                const location = document.getElementById('location')?.value || '';
                const github = document.getElementById('github')?.value || '';
                const summary = document.getElementById('summary')?.value || '';

                // Gather Education list items
                let educationData = [];
                document.querySelectorAll('#education-list .list-item').forEach(item => {
                    educationData.push(item.querySelector('h4')?.innerText + ' @ ' + item.querySelector('p')?.innerText);
                });

                // Gather Experience list items
                let experienceData = [];
                document.querySelectorAll('#experience-list .list-item').forEach(item => {
                    experienceData.push(item.querySelector('h4')?.innerText + ' @ ' + item.querySelector('p')?.innerText);
                });

                // Gather Skills
                let skillsData = [];
                document.querySelectorAll('#skills-container .skill-tag').forEach(tag => {
                    skillsData.push(tag.childNodes[0].textContent.trim());
                });

                const { error } = await window.supabaseClient
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email: userEmail,
                        full_name: fullName,
                        phone: phone,
                        location: location,
                        github_url: github,
                        summary: summary,
                        education: educationData.join('; '),
                        experience: experienceData.join('; '),
                        skills: skillsData.join(', ')
                    });

                if (error) throw error;

                submitBtn.textContent = '✓ Profile Saved!';
                submitBtn.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';
                setTimeout(() => {
                    submitBtn.textContent = 'Complete Profile Setup';
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                    window.location.href = 'home.html';
                }, 1500);

            } catch (err) {
                console.error("Error saving profile:", err);
                alert("Failed to save: " + err.message);
                submitBtn.textContent = 'Complete Profile Setup';
                submitBtn.disabled = false;
            }
        });
    }

    // =============================================
    // LOAD PROFILE DATA FROM SUPABASE ON PAGE OPEN
    // =============================================
    async function loadProfileData() {
        if (!window.supabaseClient) return;

        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return;

            // Auto-fill email field from session
            const emailField = document.getElementById('profile-email');
            if (emailField) emailField.value = session.user.email;

            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error || !data) return;

            // Populate fields
            const nameParts = (data.full_name || '').split(' ');
            if (document.getElementById('first-name')) document.getElementById('first-name').value = nameParts[0] || '';
            if (document.getElementById('last-name')) document.getElementById('last-name').value = nameParts.slice(1).join(' ') || '';
            if (document.getElementById('phone')) document.getElementById('phone').value = data.phone || '';
            if (document.getElementById('location')) document.getElementById('location').value = data.location || '';
            if (document.getElementById('github')) document.getElementById('github').value = data.github_url || '';
            if (document.getElementById('summary')) document.getElementById('summary').value = data.summary || '';

            // Populate Skills
            if (data.skills && skillsContainer) {
                data.skills.split(',').map(s => s.trim()).filter(s => s).forEach(skill => {
                    const tag = document.createElement('div');
                    tag.className = 'skill-tag';
                    tag.innerHTML = `${skill} <i class="fa-solid fa-xmark"></i>`;
                    tag.querySelector('i').addEventListener('click', () => tag.remove());
                    skillsContainer.appendChild(tag);
                });
            }

            // Populate Education
            if (data.education && eduList) {
                data.education.split(';').map(e => e.trim()).filter(e => e).forEach(edu => {
                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.innerHTML = `<h4>${edu}</h4><button type="button" class="delete-item"><i class="fa-solid fa-trash"></i></button>`;
                    item.querySelector('.delete-item').addEventListener('click', () => item.remove());
                    eduList.appendChild(item);
                });
            }

            // Populate Experience
            if (data.experience && expList) {
                data.experience.split(';').map(e => e.trim()).filter(e => e).forEach(exp => {
                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.innerHTML = `<h4>${exp}</h4><button type="button" class="delete-item"><i class="fa-solid fa-trash"></i></button>`;
                    item.querySelector('.delete-item').addEventListener('click', () => item.remove());
                    expList.appendChild(item);
                });
            }

        } catch (err) {
            console.error("Could not load profile:", err);
        }
    }

    // Wait for auth.js to initialize supabaseClient
    setTimeout(loadProfileData, 600);

});
