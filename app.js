// =============================================
//  🌸 DYU 벚꽃 사진전 - Firebase App (compat)
//  firebaseConfig 를 본인 프로젝트 값으로 교체하세요
// =============================================

// ⚠️ 아래 firebaseConfig 를 Firebase 콘솔에서 복사한 값으로 교체하세요
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db      = firebase.firestore();
const storage = firebase.storage();

// =============================================
//  DOM 준비 후 실행 (버튼 이벤트 누락 방지)
// =============================================
document.addEventListener("DOMContentLoaded", () => {

  // ---- 꽃잎 애니메이션 ----
  function initPetals() {
    const container = document.getElementById("petalsContainer");
    const emojis = ["🌸", "🌺", "✿", "❀", "🌷"];
    for (let i = 0; i < 18; i++) {
      const petal = document.createElement("div");
      petal.className = "petal";
      petal.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      petal.style.cssText = `
        left: ${Math.random() * 100}%;
        font-size: ${10 + Math.random() * 14}px;
        animation-duration: ${6 + Math.random() * 10}s;
        animation-delay: ${-Math.random() * 12}s;
        opacity: ${0.4 + Math.random() * 0.5};
      `;
      container.appendChild(petal);
    }
  }

  // ---- 갤러리 로드 ----
  async function loadGallery() {
    const grid    = document.getElementById("galleryGrid");
    const countEl = document.getElementById("photoCount");
    try {
      const snapshot = await db.collection("photos").orderBy("createdAt", "desc").get();
      if (snapshot.empty) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🌸</div><p>아직 응모된 사진이 없어요.<br>첫 번째 벚꽃 사진을 공유해주세요!</p></div>`;
        countEl.textContent = "아직 응모작이 없습니다";
        return;
      }
      countEl.textContent = `총 ${snapshot.size}점의 작품`;
      grid.innerHTML = "";
      snapshot.forEach((doc, idx) => {
        const d = doc.data();
        const card = document.createElement("div");
        card.className = "gallery-card";
        card.style.animationDelay = `${idx * 0.07}s`;
        card.innerHTML = `
          <div class="card-img-wrap">
            <img src="${d.imageUrl}" alt="${esc(d.title)}" loading="lazy"/>
            <div class="card-overlay"><p class="card-overlay-text">${esc(d.description || "사진 보기 →")}</p></div>
          </div>
          <div class="card-info">
            <p class="card-title">${esc(d.title)}</p>
            <p class="card-author">📷 ${esc(d.author)}</p>
            ${d.location ? `<p class="card-location">📍 ${esc(d.location)}</p>` : ""}
          </div>`;
        card.addEventListener("click", () => openDetail(d));
        grid.appendChild(card);
      });
    } catch (err) {
      console.error("갤러리 로드 실패:", err);
      grid.innerHTML = `<div class="empty-state"><p>⚠️ 갤러리를 불러오지 못했습니다.<br><small>${err.message}</small></p></div>`;
      countEl.textContent = "";
    }
  }

  function esc(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // ---- 상세 모달 ----
  function openDetail(d) {
    document.getElementById("detailImg").src = d.imageUrl;
    document.getElementById("detailTitle").textContent    = d.title;
    document.getElementById("detailAuthor").textContent   = `📷 ${d.author}`;
    document.getElementById("detailLocation").textContent = d.location ? `📍 ${d.location}` : "";
    document.getElementById("detailDesc").textContent     = d.description || "";
    const date = d.createdAt?.toDate?.();
    document.getElementById("detailDate").textContent = date
      ? date.toLocaleDateString("ko-KR", {year:"numeric",month:"long",day:"numeric"}) : "";
    document.getElementById("detailOverlay").classList.add("active");
    document.body.style.overflow = "hidden";
  }
  document.getElementById("closeDetailBtn").addEventListener("click", () => {
    document.getElementById("detailOverlay").classList.remove("active");
    document.body.style.overflow = "";
  });
  document.getElementById("detailOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) { e.currentTarget.classList.remove("active"); document.body.style.overflow = ""; }
  });

  // ---- 업로드 모달 ----
  let selectedFile = null;

  function openUploadModal() {
    document.getElementById("modalOverlay").classList.add("active");
    document.body.style.overflow = "hidden";
  }
  function closeUploadModal() {
    document.getElementById("modalOverlay").classList.remove("active");
    document.body.style.overflow = "";
    resetForm();
  }

  document.getElementById("openModalBtn").addEventListener("click", openUploadModal);
  document.getElementById("fabBtn").addEventListener("click", openUploadModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeUploadModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeUploadModal();
  });

  function resetForm() {
    selectedFile = null;
    ["authorName","photoTitle","photoLocation","photoDesc"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("descCount").textContent         = "0 / 200";
    document.getElementById("previewWrap").style.display     = "none";
    document.getElementById("photoSourceBtns").style.display = "grid";
    document.getElementById("progressWrap").style.display    = "none";
    document.getElementById("progressFill").style.width      = "0%";
    document.getElementById("submitNotice").textContent      = "";
    document.getElementById("submitNotice").className        = "submit-notice";
    document.getElementById("submitText").textContent        = "응모 제출하기";
    document.getElementById("submitBtn").disabled            = false;
    document.getElementById("fileInputGallery").value        = "";
    document.getElementById("fileInputCamera").value         = "";
  }

  // ---- 파일 선택 ----
  const fileInputGallery = document.getElementById("fileInputGallery");
  const fileInputCamera  = document.getElementById("fileInputCamera");

  document.getElementById("btnCamera").addEventListener("click", () => { fileInputCamera.value=""; fileInputCamera.click(); });
  document.getElementById("btnGallery").addEventListener("click", () => { fileInputGallery.value=""; fileInputGallery.click(); });
  document.getElementById("previewChangeBtn").addEventListener("click", () => {
    document.getElementById("previewWrap").style.display     = "none";
    document.getElementById("photoSourceBtns").style.display = "grid";
    selectedFile = null;
  });

  fileInputGallery.addEventListener("change", () => { if (fileInputGallery.files[0]) handleFile(fileInputGallery.files[0]); });
  fileInputCamera.addEventListener("change",  () => { if (fileInputCamera.files[0])  handleFile(fileInputCamera.files[0]); });

  function handleFile(file) {
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      showNotice("이미지 파일만 업로드 가능합니다.", "error"); return;
    }
    if (file.size > 10 * 1024 * 1024) { showNotice("파일 크기는 10MB 이하여야 합니다.", "error"); return; }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("previewImg").src               = e.target.result;
      document.getElementById("previewWrap").style.display     = "block";
      document.getElementById("photoSourceBtns").style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  document.getElementById("photoDesc").addEventListener("input", (e) => {
    document.getElementById("descCount").textContent = `${e.target.value.length} / 200`;
  });

  // ---- 제출 ----
  document.getElementById("submitBtn").addEventListener("click", async () => {
    const author   = document.getElementById("authorName").value.trim();
    const title    = document.getElementById("photoTitle").value.trim();
    const location = document.getElementById("photoLocation").value.trim();
    const desc     = document.getElementById("photoDesc").value.trim();

    if (!selectedFile) { showNotice("사진을 먼저 선택해주세요. 📷", "error"); return; }
    if (!author)        { showNotice("이름을 입력해주세요.", "error"); return; }
    if (!title)         { showNotice("제목을 입력해주세요.", "error"); return; }

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    document.getElementById("submitText").textContent     = "업로드 중... 🌸";
    document.getElementById("progressWrap").style.display = "block";

    try {
      const ext        = (selectedFile.name.split(".").pop() || "jpg").toLowerCase();
      const filename   = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const storageRef = storage.ref(filename);
      const uploadTask = storageRef.put(selectedFile);

      const imageUrl = await new Promise((resolve, reject) => {
        uploadTask.on("state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            document.getElementById("progressFill").style.width  = `${pct}%`;
            document.getElementById("progressLabel").textContent = `업로드 중... ${pct}%`;
          },
          reject,
          async () => resolve(await storageRef.getDownloadURL())
        );
      });

      document.getElementById("progressLabel").textContent = "저장 중...";

      await db.collection("photos").add({
        author, title, location, description: desc, imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showNotice("🌸 응모가 완료되었습니다!", "success");
      setTimeout(() => { closeUploadModal(); loadGallery(); }, 1500);

    } catch (err) {
      console.error("업로드 실패:", err);
      showNotice(`업로드 실패: ${err.message}`, "error");
      btn.disabled = false;
      document.getElementById("submitText").textContent     = "응모 제출하기";
      document.getElementById("progressWrap").style.display = "none";
    }
  });

  function showNotice(msg, type = "") {
    const el = document.getElementById("submitNotice");
    el.textContent = msg;
    el.className   = `submit-notice ${type}`;
  }

  // ---- 초기화 ----
  initPetals();
  loadGallery();

}); // DOMContentLoaded 끝
