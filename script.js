const container = document.getElementById('container');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});
