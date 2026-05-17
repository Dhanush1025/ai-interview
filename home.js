document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const navSubItems = document.querySelectorAll('.nav-sub-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const nextButtons = document.querySelectorAll('.next-tab');
    const pageTitle = document.getElementById('page-title');
    
    // Dropdown Handling
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileSubmenu = document.getElementById('profile-submenu');
    
    profileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        profileMenuBtn.classList.toggle('expanded');
        profileSubmenu.classList.toggle('expanded');
    });

    // Tab Switching Function
    function switchTab(tabId, isSubItem = false) {
        // Deactivate all
        navItems.forEach(item => item.classList.remove('active'));
        navSubItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Activate Content
        const targetContent = document.getElementById(tabId);
        if(targetContent) targetContent.classList.add('active');

        // Activate Nav Item
        if (isSubItem) {
            // Activate the parent "Profile Management" visually
            profileMenuBtn.classList.add('active');
            // Ensure submenu is expanded
            if(!profileSubmenu.classList.contains('expanded')) {
                profileMenuBtn.classList.add('expanded');
                profileSubmenu.classList.add('expanded');
            }
            // Activate the specific sub item
            const activeSubItem = document.querySelector(`.nav-sub-item[data-tab="${tabId}"]`);
            if (activeSubItem) {
                activeSubItem.classList.add('active');
                pageTitle.textContent = "Profile Setup > " + activeSubItem.textContent;
            }
        } else {
            // Activate top-level item
            const activeItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
                pageTitle.textContent = activeItem.textContent.trim();
            }
        }
    }

    // Event Listeners for Nav
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab, false);
        });
    });

    navSubItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab, true);
        });
    });

    // "Manage Profile" card click from Home dashboard
    const openProfileCard = document.getElementById('open-profile-card');
    if(openProfileCard) {
        openProfileCard.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('personal', true);
        });
    }

    // Next Buttons
    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextTab = btn.dataset.next;
            if (nextTab) switchTab(nextTab, true);
        });
    });


    /* ----- PROFILE FORMS FUNCTIONALITY ----- */

    // Education Dynamic List
    const btnAddEdu = document.getElementById('add-education');
    const eduList = document.getElementById('education-list');
    
    if(btnAddEdu) {
        btnAddEdu.addEventListener('click', () => {
            const school = document.getElementById('edu-school').value;
            const degree = document.getElementById('edu-degree').value;
            const field = document.getElementById('edu-field').value;
            const start = document.getElementById('edu-start').value;
            const end = document.getElementById('edu-end').value;

            if(!school || !degree) {
                alert('Please fill out Institution and Degree');
                return;
            }

            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <h4>${degree} in ${field}</h4>
                <p>${school}</p>
                <span class="date">${start} - ${end || 'Present'}</span>
                <button type="button" class="delete-item"><i class="fa-solid fa-trash"></i></button>
            `;
            
            item.querySelector('.delete-item').addEventListener('click', () => item.remove());
            eduList.appendChild(item);
            document.getElementById('education-form').reset();
        });
    }

    // Experience Dynamic List
    const btnAddExp = document.getElementById('add-experience');
    const expList = document.getElementById('experience-list');
    
    if(btnAddExp) {
        btnAddExp.addEventListener('click', () => {
            const company = document.getElementById('exp-company').value;
            const title = document.getElementById('exp-title').value;
            const start = document.getElementById('exp-start').value;
            const end = document.getElementById('exp-end').value;

            if(!company || !title) {
                alert('Please fill out Company and Job Title');
                return;
            }

            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <h4>${title}</h4>
                <p>${company}</p>
                <span class="date">${start} - ${end || 'Present'}</span>
                <button type="button" class="delete-item"><i class="fa-solid fa-trash"></i></button>
            `;
            
            item.querySelector('.delete-item').addEventListener('click', () => item.remove());
            expList.appendChild(item);
            document.getElementById('experience-form').reset();
        });
    }

    // Skills Dynamic Tags
    const btnAddSkill = document.getElementById('add-skill');
    const skillInput = document.getElementById('skill-input');
    const skillsContainer = document.getElementById('skills-container');

    function addSkill() {
        const skill = skillInput.value.trim();
        if(!skill) return;

        const tag = document.createElement('div');
        tag.className = 'skill-tag';
        tag.innerHTML = `
            ${skill}
            <i class="fa-solid fa-xmark"></i>
        `;

        tag.querySelector('i').addEventListener('click', () => tag.remove());
        skillsContainer.appendChild(tag);
        skillInput.value = '';
    }

    if(btnAddSkill) {
        btnAddSkill.addEventListener('click', addSkill);
        skillInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    }

    // File Upload Handling
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-upload');
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const btnRemoveFile = document.getElementById('remove-file');

    if(uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if(e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if(fileInput.files.length) {
                handleFile(fileInput.files[0]);
            }
        });

        function handleFile(file) {
            fileName.textContent = file.name;
            uploadArea.style.display = 'none';
            filePreview.classList.remove('hidden');
        }

        btnRemoveFile.addEventListener('click', () => {
            fileInput.value = '';
            uploadArea.style.display = 'block';
            filePreview.classList.add('hidden');
        });
    }
    
    // Complete Setup
    const submitBtn = document.querySelector('.submit-profile');
    if(submitBtn) {
        submitBtn.addEventListener('click', () => {
            alert('Profile setup complete! Proceeding to AI Interview preparation...');
            switchTab('home-dashboard', false);
        });
    }
});
