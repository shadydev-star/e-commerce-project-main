


  const imageInput = document.getElementById("image");
  const previewBox = document.getElementById("previewBox");

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewBox.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover" />`;
      };
      reader.readAsDataURL(file);
    }
  });

