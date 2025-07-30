const menuToggle = document.getElementById('menuToggle');
  const closeSidebar = document.getElementById('closeSidebar');
  const sidebar = document.getElementById('side-bar');

  menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  closeSidebar?.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });

  // Status simulation
  const updateButtons = document.querySelectorAll(".action-btn:not(.delete):nth-child(2)");
  updateButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("tr");
      const statusCell = row.querySelector("td:nth-child(5) .badge");
      const current = statusCell.textContent.trim();

      if (current === "Pending") {
        statusCell.textContent = "Shipped";
        statusCell.className = "badge shipped";
      } else if (current === "Shipped") {
        statusCell.textContent = "Delivered";
        statusCell.className = "badge delivered";
      }
    });
  });

  // View modal logic
  const modal = document.getElementById("orderModal");
  const closeModal = document.getElementById("closeOrderModal");
  const viewButtons = document.querySelectorAll(".action-btn:first-child");

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("tr");
      const orderId = row.querySelector("td:nth-child(1)").textContent;
      const customer = row.querySelector("td:nth-child(2)").textContent;
      const date = row.querySelector("td:nth-child(3)").textContent;
      const total = row.querySelector("td:nth-child(4)").textContent;
      const status = row.querySelector("td:nth-child(5)").textContent.trim();

      document.getElementById("modalOrderId").textContent = orderId;
      document.getElementById("modalCustomer").textContent = customer;
      document.getElementById("modalDate").textContent = date;
      document.getElementById("modalTotal").textContent = total;
      document.getElementById("modalStatus").textContent = status;

      modal.style.display = "flex";
    });
  });

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });