// =============================================
//  🌸 DYU 벚꽃 사진전
//  ⚠️ firebaseConfig 값을 본인 것으로 교체하세요
// =============================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 초기화 - 실패해도 UI는 동작하게
let db = null;
let storage = null;
let firebaseReady = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  firebaseReady = true;
} catch(e) {
  console.error("Firebase 초기화 실패:", e.message);
}

// =============================================
//  버튼 이벤트는 Firebase와 무관하게 즉시 연결
// =============================================

// 열기 버튼들
document.getElementById("openModalBtn").onclick = openUploadModal;
document.getElementById("fabBtn").onclick = openUploadModal;

// 닫기
document.getElementById("closeModalBtn").onclick = closeUploadModal;

// 모달 바깥 클릭
document.getElementById("modalOverlay").onclick = function(e) {
  if (e.target === this) closeUploadModal();
};

// 상세 닫기
document.getElementById("closeDetailBtn").onclick = function() {
  document.getElementById("detailOverlay").style.display = "none";
  document.body.style.overflow = "";
};
document.getElementById("detailOverlay").onclick = function(e) {
  if (e.target === this) {
    this.style.display = "none";
    document.body.style.overflow = "";
  }
};

// 카메라 / 갤러리 버튼
document.getElementById("btnCamera").onclick = function() {
  var el = document.getElementById("fileInputCamera");
  el.value = "";
  el.click();
};
document.getElementById("btnGallery").onclick = function() {
  var el = document.getElementById("fileInputGallery");
  el.value = "";
  el.click();
};

// 다시 선택
document.getElementById("previewChangeBtn").onclick = function() {
  document.getElementById("previewWrap").style.display = "none";
  document.getElementById("photoSourceBtns").style.display = "grid";
  selectedFile = null;
};

// 파일 선택 완료
document.getElementById("fileInputGallery").onchange = function() {
  if (this.files[0]) handleFile(this.files[0]);
};
document.getElementById("fileInputCamera").onchange = function() {
  if (this.files[0]) handleFile(this.files[0]);
};

// 글자 수
document.getElementById("photoDesc").oninput = function() {
  document.getElementById("descCount").textContent = this.value.length + " / 200";
};

// 제출
document.getElementById("submitBtn").onclick = submitPhoto;

// =============================================
//  모달 열기 / 닫기
// =============================================
function openUploadModal() {
  var overlay = document.getElementById("modalOverlay");
  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeUploadModal() {
  document.getElementById("modalOverlay").style.display = "none";
  document.body.style.overflow = "";
  resetForm();
}

// =============================================
//  파일 처리
// =============================================
var selectedFile = null;

function handleFile(file) {
  var isImage = file.type.indexOf("image/") === 0 || /\.(heic|heif)$/i.test(file.name);
  if (!isImage) { showNotice("이미지 파일만 업로드 가능합니다.", "error"); return; }
  if (file.size > 15 * 1024 * 1024) { showNotice("파일 크기는 15MB 이하여야 합니다.", "error"); return; }

  selectedFile = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("previewImg").src = e.target.result;
    document.getElementById("previewWrap").style.display = "block";
    document.getElementById("photoSourceBtns").style.display = "none";
  };
  reader.readAsDataURL(file);
}

// =============================================
//  폼 리셋
// =============================================
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
  document.getElementById("fileInputGallery").value = "";
  document.getElementById("fileInputCamera").value = "";
}

// =============================================
//  제출
// =============================================
async function submitPhoto() {
  var author   = document.getElementById("authorName").value.trim();
  var title    = document.getElementById("photoTitle").value.trim();
  var location = document.getElementById("photoLocation").value.trim();
  var desc     = document.getElementById("photoDesc").value.trim();

  if (!selectedFile) { showNotice("사진을 먼저 선택해주세요. 📷", "error"); return; }
  if (!author)        { showNotice("이름을 입력해주세요.", "error"); return; }
  if (!title)         { showNotice("제목을 입력해주세요.", "error"); return; }

  if (!firebaseReady) {
    showNotice("Firebase 설정을 확인해주세요. app.js의 firebaseConfig를 입력해야 합니다.", "error");
    return;
  }

  var btn = document.getElementById("submitBtn");
  btn.disabled = true;
  document.getElementById("submitText").textContent = "업로드 중... 🌸";
  document.getElementById("progressWrap").style.display = "block";

  try {
    var ext = (selectedFile.name.split(".").pop() || "jpg").toLowerCase();
    var filename = "photos/" + Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;
    var storageRef = storage.ref(filename);
    var uploadTask = storageRef.put(selectedFile);

    var imageUrl = await new Promise(function(resolve, reject) {
      uploadTask.on("state_changed",
        function(snap) {
          var pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          document.getElementById("progressFill").style.width = pct + "%";
          document.getElementById("progressLabel").textContent = "업로드 중... " + pct + "%";
        },
        reject,
        function() {
          storageRef.getDownloadURL().then(resolve).catch(reject);
        }
      );
    });

    document.getElementById("progressLabel").textContent = "저장 중...";

    await db.collection("photos").add({
      author: author,
      title: title,
      location: location,
      description: desc,
      imageUrl: imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showNotice("🌸 응모가 완료되었습니다!", "success");
    setTimeout(function() {
      closeUploadModal();
      loadGallery();
    }, 1500);

  } catch(err) {
    console.error("업로드 실패:", err);
    showNotice("업로드 실패: " + err.message, "error");
    btn.disabled = false;
    document.getElementById("submitText").textContent = "응모 제출하기";
    document.getElementById("progressWrap").style.display = "none";
  }
}

function showNotice(msg, type) {
  var el = document.getElementById("submitNotice");
  el.textContent = msg;
  el.className = "submit-notice" + (type ? " " + type : "");
}

// =============================================
//  갤러리 로드
// =============================================
async function loadGallery() {
  var grid    = document.getElementById("galleryGrid");
  var countEl = document.getElementById("photoCount");

  if (!firebaseReady) {
    grid.innerHTML = '<div class="empty-state"><p>⚙️ Firebase 설정이 필요합니다.<br>app.js의 firebaseConfig를 입력해주세요.</p></div>';
    countEl.textContent = "";
    return;
  }

  try {
    var snapshot = await db.collection("photos").orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🌸</div><p>아직 응모된 사진이 없어요.<br>첫 번째 벚꽃 사진을 공유해주세요!</p></div>';
      countEl.textContent = "아직 응모작이 없습니다";
      return;
    }

    countEl.textContent = "총 " + snapshot.size + "점의 작품";
    grid.innerHTML = "";

    snapshot.forEach(function(doc, idx) {
      var d = doc.data();
      var card = document.createElement("div");
      card.className = "gallery-card";
      card.style.animationDelay = (idx * 0.07) + "s";
      card.innerHTML =
        '<div class="card-img-wrap">' +
          '<img src="' + d.imageUrl + '" alt="' + esc(d.title) + '" loading="lazy"/>' +
          '<div class="card-overlay"><p class="card-overlay-text">' + esc(d.description || "사진 보기 →") + '</p></div>' +
        '</div>' +
        '<div class="card-info">' +
          '<p class="card-title">' + esc(d.title) + '</p>' +
          '<p class="card-author">📷 ' + esc(d.author) + '</p>' +
          (d.location ? '<p class="card-location">📍 ' + esc(d.location) + '</p>' : '') +
        '</div>';
      card.onclick = function() { openDetail(d); };
      grid.appendChild(card);
    });

  } catch(err) {
    console.error("갤러리 로드 실패:", err);
    grid.innerHTML = '<div class="empty-state"><p>⚠️ 갤러리를 불러오지 못했습니다.<br>' + err.message + '</p></div>';
    countEl.textContent = "";
  }
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =============================================
//  상세 보기
// =============================================
function openDetail(d) {
  document.getElementById("detailImg").src = d.imageUrl;
  document.getElementById("detailTitle").textContent    = d.title;
  document.getElementById("detailAuthor").textContent   = "📷 " + d.author;
  document.getElementById("detailLocation").textContent = d.location ? "📍 " + d.location : "";
  document.getElementById("detailDesc").textContent     = d.description || "";
  var date = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;
  document.getElementById("detailDate").textContent = date
    ? date.toLocaleDateString("ko-KR", {year:"numeric", month:"long", day:"numeric"}) : "";
  document.getElementById("detailOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
}

// =============================================
//  꽃잎 애니메이션
// =============================================
function initPetals() {
  var container = document.getElementById("petalsContainer");
  var emojis = ["🌸", "🌺", "✿", "❀", "🌷"];
  for (var i = 0; i < 18; i++) {
    var petal = document.createElement("div");
    petal.className = "petal";
    petal.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    petal.style.cssText =
      "left:" + (Math.random() * 100) + "%;" +
      "font-size:" + (10 + Math.random() * 14) + "px;" +
      "animation-duration:" + (6 + Math.random() * 10) + "s;" +
      "animation-delay:-" + (Math.random() * 12) + "s;" +
      "opacity:" + (0.4 + Math.random() * 0.5) + ";";
    container.appendChild(petal);
  }
}

// =============================================
//  시작
// =============================================
initPetals();
loadGallery();
