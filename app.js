// =============================================
//  🌸 DYU 벚꽃 사진전
//  ⚠️ firebaseConfig 값을 본인 것으로 교체하세요
// =============================================

var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ⚠️ storageBucket: Firebase 콘솔에서 복사한 값 그대로 넣으세요
  //    예시1 (구버전): "your-project.appspot.com"
  //    예시2 (신버전): "your-project.firebasestorage.app"
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// =============================================
//  Firebase 초기화
// =============================================
var db = null;
var storage = null;
var firebaseReady = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  firebaseReady = true;
  console.log("Firebase 초기화 성공");
} catch(e) {
  console.error("Firebase 초기화 실패:", e.message);
}

// =============================================
//  뒤로가기 가로채기 (모달 닫기용)
// =============================================
var modalHistoryPushed = false;

function pushModalHistory() {
  if (!modalHistoryPushed) {
    history.pushState({ modal: true }, "");
    modalHistoryPushed = true;
  }
}

window.addEventListener("popstate", function(e) {
  // 뒤로가기 눌렸을 때 모달이 열려 있으면 닫기
  if (document.getElementById("modalOverlay").style.display === "flex") {
    closeUploadModal(false); // false = history 다시 push 안함
    return;
  }
  if (document.getElementById("detailOverlay").style.display === "flex") {
    document.getElementById("detailOverlay").style.display = "none";
    document.body.style.overflow = "";
    return;
  }
  modalHistoryPushed = false;
});

// =============================================
//  버튼 이벤트 연결
// =============================================
document.getElementById("openModalBtn").onclick = openUploadModal;
document.getElementById("fabBtn").onclick = openUploadModal;
document.getElementById("closeModalBtn").onclick = function() { closeUploadModal(true); };

document.getElementById("modalOverlay").onclick = function(e) {
  if (e.target === this) closeUploadModal(true);
};

document.getElementById("closeDetailBtn").onclick = function() {
  document.getElementById("detailOverlay").style.display = "none";
  document.body.style.overflow = "";
  if (modalHistoryPushed) { history.back(); modalHistoryPushed = false; }
};
document.getElementById("detailOverlay").onclick = function(e) {
  if (e.target === this) {
    this.style.display = "none";
    document.body.style.overflow = "";
    if (modalHistoryPushed) { history.back(); modalHistoryPushed = false; }
  }
};

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
document.getElementById("previewChangeBtn").onclick = function() {
  document.getElementById("previewWrap").style.display = "none";
  document.getElementById("photoSourceBtns").style.display = "grid";
  selectedFile = null;
};

document.getElementById("fileInputGallery").onchange = function() {
  if (this.files && this.files[0]) handleFile(this.files[0]);
};
document.getElementById("fileInputCamera").onchange = function() {
  if (this.files && this.files[0]) handleFile(this.files[0]);
};

document.getElementById("photoDesc").oninput = function() {
  document.getElementById("descCount").textContent = this.value.length + " / 200";
};

document.getElementById("submitBtn").onclick = submitPhoto;

// =============================================
//  모달 열기 / 닫기
// =============================================
function openUploadModal() {
  document.getElementById("modalOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
  pushModalHistory(); // 뒤로가기 가로채기용 히스토리 추가
}

function closeUploadModal(goBack) {
  document.getElementById("modalOverlay").style.display = "none";
  document.body.style.overflow = "";
  resetForm();
  if (goBack && modalHistoryPushed) {
    history.back();
    modalHistoryPushed = false;
  }
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
  document.getElementById("authorName").value    = "";
  document.getElementById("photoTitle").value    = "";
  document.getElementById("photoLocation").value = "";
  document.getElementById("photoDesc").value     = "";
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

// =============================================
//  제출
// =============================================
function submitPhoto() {
  var author   = document.getElementById("authorName").value.trim();
  var title    = document.getElementById("photoTitle").value.trim();
  var location = document.getElementById("photoLocation").value.trim();
  var desc     = document.getElementById("photoDesc").value.trim();

  if (!selectedFile) { showNotice("사진을 먼저 선택해주세요. 📷", "error"); return; }
  if (!author)        { showNotice("이름을 입력해주세요.", "error"); return; }
  if (!title)         { showNotice("제목을 입력해주세요.", "error"); return; }

  if (!firebaseReady) {
    showNotice("⚙️ Firebase 설정이 필요합니다. app.js의 firebaseConfig를 확인해주세요.", "error");
    return;
  }

  var btn = document.getElementById("submitBtn");
  btn.disabled = true;
  document.getElementById("submitText").textContent     = "업로드 중... 🌸";
  document.getElementById("progressWrap").style.display = "block";
  document.getElementById("submitNotice").textContent   = "";

  // 타임아웃 보호 (30초 내 응답 없으면 에러 표시)
  var uploadTimeout = setTimeout(function() {
    showNotice("⏱ 업로드 시간이 초과됐습니다. 네트워크를 확인하고 다시 시도해주세요.", "error");
    btn.disabled = false;
    document.getElementById("submitText").textContent     = "응모 제출하기";
    document.getElementById("progressWrap").style.display = "none";
  }, 30000);

  var ext      = "jpg";
  var nameParts = selectedFile.name.split(".");
  if (nameParts.length > 1) ext = nameParts.pop().toLowerCase();
  var filename = "photos/" + Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;

  var storageRef = storage.ref(filename);
  var uploadTask = storageRef.put(selectedFile);

  uploadTask.on("state_changed",
    // 진행중
    function(snap) {
      var pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      document.getElementById("progressFill").style.width  = pct + "%";
      document.getElementById("progressLabel").textContent = "업로드 중... " + pct + "%";
    },
    // 에러
    function(err) {
      clearTimeout(uploadTimeout);
      console.error("Storage 업로드 실패:", err.code, err.message);
      var msg = "업로드 실패: ";
      if (err.code === "storage/unauthorized")     msg += "Storage 권한이 없습니다. Firebase 규칙을 확인하세요.";
      else if (err.code === "storage/canceled")    msg += "업로드가 취소됐습니다.";
      else if (err.code === "storage/invalid-url") msg += "storageBucket 주소가 잘못됐습니다.";
      else                                         msg += err.message;
      showNotice(msg, "error");
      btn.disabled = false;
      document.getElementById("submitText").textContent     = "응모 제출하기";
      document.getElementById("progressWrap").style.display = "none";
    },
    // 완료
    function() {
      clearTimeout(uploadTimeout);
      document.getElementById("progressLabel").textContent = "저장 중...";

      storageRef.getDownloadURL().then(function(imageUrl) {
        return db.collection("photos").add({
          author:      author,
          title:       title,
          location:    location,
          description: desc,
          imageUrl:    imageUrl,
          createdAt:   firebase.firestore.FieldValue.serverTimestamp()
        });
      }).then(function() {
        showNotice("🌸 응모가 완료되었습니다!", "success");
        setTimeout(function() {
          closeUploadModal(true);
          loadGallery();
        }, 1500);
      }).catch(function(err) {
        console.error("Firestore 저장 실패:", err);
        showNotice("저장 실패: " + err.message, "error");
        btn.disabled = false;
        document.getElementById("submitText").textContent     = "응모 제출하기";
        document.getElementById("progressWrap").style.display = "none";
      });
    }
  );
}

function showNotice(msg, type) {
  var el = document.getElementById("submitNotice");
  el.textContent = msg;
  el.className = "submit-notice" + (type ? " " + type : "");
}

// =============================================
//  갤러리 로드
// =============================================
function loadGallery() {
  var grid    = document.getElementById("galleryGrid");
  var countEl = document.getElementById("photoCount");

  if (!firebaseReady) {
    grid.innerHTML = '<div class="empty-state"><p>⚙️ Firebase 설정이 필요합니다.<br>app.js의 firebaseConfig를 입력해주세요.</p></div>';
    countEl.textContent = "";
    return;
  }

  db.collection("photos").orderBy("createdAt", "desc").get()
    .then(function(snapshot) {
      if (snapshot.empty) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🌸</div><p>아직 응모된 사진이 없어요.<br>첫 번째 벚꽃 사진을 공유해주세요!</p></div>';
        countEl.textContent = "아직 응모작이 없습니다";
        return;
      }
      countEl.textContent = "총 " + snapshot.size + "점의 작품";
      grid.innerHTML = "";
      var idx = 0;
      snapshot.forEach(function(doc) {
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
        (function(data) {
          card.onclick = function() { openDetail(data); };
        })(d);
        grid.appendChild(card);
        idx++;
      });
    })
    .catch(function(err) {
      console.error("갤러리 로드 실패:", err);
      grid.innerHTML = '<div class="empty-state"><p>⚠️ 갤러리를 불러오지 못했습니다.<br><small>' + err.message + '</small></p></div>';
      countEl.textContent = "";
    });
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
  document.getElementById("detailImg").src              = d.imageUrl;
  document.getElementById("detailTitle").textContent    = d.title;
  document.getElementById("detailAuthor").textContent   = "📷 " + d.author;
  document.getElementById("detailLocation").textContent = d.location ? "📍 " + d.location : "";
  document.getElementById("detailDesc").textContent     = d.description || "";
  var date = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;
  document.getElementById("detailDate").textContent = date
    ? date.toLocaleDateString("ko-KR", {year:"numeric", month:"long", day:"numeric"}) : "";
  document.getElementById("detailOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
  pushModalHistory();
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
