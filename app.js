// =============================================
//  🌸 벚꽃 사진전 - Firebase App
//  firebaseConfig 를 본인 프로젝트 값으로 교체하세요
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL, uploadBytesResumable }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ⚠️ 아래 firebaseConfig 를 Firebase 콘솔에서 복사한 값으로 교체하세요
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAqlBklvzCChbsFykTsxPfVnpURBp5JDA8",
    authDomain: "dyucontest.firebaseapp.com",
    projectId: "dyucontest",
    storageBucket: "dyucontest.firebasestorage.app",
    messagingSenderId: "742550983558",
    appId: "1:742550983558:web:1678448ca0315ae2f21207"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const storage = getStorage(app);

// =============================================
//  꽃잎 애니메이션
// =============================================
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

// =============================================
//  갤러리 로드
// =============================================
async function loadGallery() {
  const grid = document.getElementById("galleryGrid");
  const countEl = document.getElementById("photoCount");

  try {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌸</div>
          <p>아직 응모된 사진이 없어요.<br>첫 번째 벚꽃 사진을 공유해주세요!</p>
        </div>`;
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
          <img src="${d.imageUrl}" alt="${d.title}" loading="lazy"/>
          <div class="card-overlay">
            <p class="card-overlay-text">${d.description || "사진 보기 →"}</p>
          </div>
        </div>
        <div class="card-info">
          <p class="card-title">${d.title}</p>
          <p class="card-author">📷 ${d.author}</p>
          ${d.location ? `<p class="card-location">📍 ${d.location}</p>` : ""}
        </div>`;
      card.addEventListener("click", () => openDetail(d));
      grid.appendChild(card);
    });

  } catch (err) {
    console.error("갤러리 로드 실패:", err);
    grid.innerHTML = `<div class="empty-state"><p>⚠️ 갤러리를 불러오지 못했습니다.<br>Firebase 설정을 확인해주세요.</p></div>`;
  }
}

// =============================================
//  상세 모달
// =============================================
function openDetail(d) {
  document.getElementById("detailImg").src = d.imageUrl;
  document.getElementById("detailTitle").textContent = d.title;
  document.getElementById("detailAuthor").textContent = `📷 ${d.author}`;
  document.getElementById("detailLocation").textContent = d.location ? `📍 ${d.location}` : "";
  document.getElementById("detailDesc").textContent = d.description || "";
  const date = d.createdAt?.toDate?.();
  document.getElementById("detailDate").textContent = date
    ? date.toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" })
    : "";
  document.getElementById("detailOverlay").classList.add("active");
}

document.getElementById("closeDetailBtn").addEventListener("click", () => {
  document.getElementById("detailOverlay").classList.remove("active");
});
document.getElementById("detailOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("active");
});

// =============================================
//  업로드 모달
// =============================================
let selectedFile = null;

function openUploadModal() {
  document.getElementById("modalOverlay").classList.add("active");
  // iOS에서 body 스크롤 막기
  document.body.style.overflow = "hidden";
}

function closeUploadModal() {
  document.getElementById("modalOverlay").classList.remove("active");
  document.body.style.overflow = "";
  resetForm();
}

document.getElementById("openModalBtn").addEventListener("click", openUploadModal);
document.getElementById("closeModalBtn").addEventListener("click", closeUploadModal);
document.getElementById("fabBtn")?.addEventListener("click", openUploadModal);
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeUploadModal();
});

function resetForm() {
  selectedFile = null;
  document.getElementById("authorName").value = "";
  document.getElementById("photoTitle").value = "";
  document.getElementById("photoLocation").value = "";
  document.getElementById("photoDesc").value = "";
  document.getElementById("descCount").textContent = "0 / 200";
  document.getElementById("previewWrap").style.display = "none";
  document.getElementById("photoSourceBtns").style.display = "grid";
  document.getElementById("progressWrap").style.display = "none";
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("submitNotice").textContent = "";
  document.getElementById("submitNotice").className = "submit-notice";
  document.getElementById("submitText").textContent = "응모 제출하기";
  document.getElementById("submitBtn").disabled = false;
  // 파일 input 초기화 (같은 파일 재선택 대비)
  document.getElementById("fileInputGallery").value = "";
  document.getElementById("fileInputCamera").value = "";
}

// =============================================
//  파일 소스 선택 (카메라 / 갤러리)
// =============================================
const fileInputGallery = document.getElementById("fileInputGallery");
const fileInputCamera  = document.getElementById("fileInputCamera");

document.getElementById("btnCamera").addEventListener("click", () => {
  fileInputCamera.value = "";
  fileInputCamera.click();
});

document.getElementById("btnGallery").addEventListener("click", () => {
  fileInputGallery.value = "";
  fileInputGallery.click();
});

// 다시 선택 버튼
document.getElementById("previewChangeBtn").addEventListener("click", () => {
  document.getElementById("previewWrap").style.display = "none";
  document.getElementById("photoSourceBtns").style.display = "grid";
  selectedFile = null;
});

fileInputGallery.addEventListener("change", () => {
  if (fileInputGallery.files[0]) handleFile(fileInputGallery.files[0]);
});
fileInputCamera.addEventListener("change", () => {
  if (fileInputCamera.files[0]) handleFile(fileInputCamera.files[0]);
});

// iOS Safari: HEIC 포함 image/* 처리
function handleFile(file) {
  const isImage = file.type.startsWith("image/") || file.name.match(/\.(heic|heif)$/i);
  if (!isImage) {
    showNotice("이미지 파일만 업로드 가능합니다.", "error"); return;
  }
  if (file.size > 10 * 1024 * 1024) {  // 모바일 고해상도 고려해 10MB로 완화
    showNotice("파일 크기는 10MB 이하여야 합니다.", "error"); return;
  }
  selectedFile = file;

  // 미리보기
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("previewImg").src = e.target.result;
    document.getElementById("previewWrap").style.display = "block";
    document.getElementById("photoSourceBtns").style.display = "none";
  };
  reader.readAsDataURL(file);
}

// 글자 수 카운터
document.getElementById("photoDesc").addEventListener("input", (e) => {
  document.getElementById("descCount").textContent = `${e.target.value.length} / 200`;
});

// =============================================
//  제출 (진행률 표시 포함)
// =============================================

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
  document.getElementById("submitText").textContent = "업로드 중... 🌸";
  document.getElementById("progressWrap").style.display = "block";

  try {
    // 1) Storage 업로드 (진행률 추적)
    const ext = selectedFile.name.split(".").pop() || "jpg";
    const filename = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, filename);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    const imageUrl = await new Promise((resolve, reject) => {
      uploadTask.on("state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          document.getElementById("progressFill").style.width = `${pct}%`;
          document.getElementById("progressLabel").textContent = `업로드 중... ${pct}%`;
        },
        reject,
        async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
      );
    });

    document.getElementById("progressLabel").textContent = "저장 중...";

    // 2) Firestore 저장
    await addDoc(collection(db, "photos"), {
      author, title, location, description: desc, imageUrl,
      createdAt: serverTimestamp()
    });

    showNotice("🌸 응모가 완료되었습니다!", "success");
    setTimeout(() => {
      closeUploadModal();
      loadGallery();
    }, 1500);

  } catch (err) {
    console.error("업로드 실패:", err);
    showNotice(`업로드 실패: ${err.message}`, "error");
    btn.disabled = false;
    document.getElementById("submitText").textContent = "응모 제출하기";
    document.getElementById("progressWrap").style.display = "none";
  }
});

function showNotice(msg, type = "") {
  const el = document.getElementById("submitNotice");
  el.textContent = msg;
  el.className = `submit-notice ${type}`;
}

// =============================================
//  초기화
// =============================================
initPetals();
loadGallery();
