const menuToggle = document.getElementById('menuToggle');
  const closeSidebar = document.getElementById('closeSidebar');
  const sidebar = document.getElementById('side-bar');
  const themeSelect = document.getElementById('theme');

  // Handle sidebar toggling
  menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  closeSidebar?.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });

  // Load saved theme on page load
  const savedTheme = localStorage.getItem('admin-theme') || 'light';
  document.body.classList.add(`${savedTheme}-theme`);
  if (themeSelect) themeSelect.value = savedTheme;

  // Update theme when changed
  themeSelect?.addEventListener('change', (e) => {
    const theme = e.target.value;
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('admin-theme', theme);
  });


  document.querySelector('.settings-form')?.addEventListener('submit', function (e) {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorElement = document.getElementById('passwordError');

  if (newPassword !== confirmPassword) {
    e.preventDefault();
    errorElement.textContent = "New passwords do not match.";
  } else {
    errorElement.textContent = "";
    alert("Settings saved successfully!");
    // You can add logic to save password securely or call backend API here
  }
});