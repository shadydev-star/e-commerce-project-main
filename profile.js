const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('side-bar');

    menuToggle?.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    closeSidebar?.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });