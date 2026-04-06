// =============================================
//  🌸 DYU 벚꽃 사진전
// =============================================

// ── Cloudinary 설정 (이미지 업로드) ──────────
var CLOUDINARY_CLOUD = "dmca6nhdz";
var CLOUDINARY_PRESET = "sakura_upload";
var CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD + "/image/upload";

// ── Firebase 설정 (데이터 저장) ───────────────
// ⚠️ 아래 값을 본인 Firebase 프로젝트 값으로 교체하세요 (Storage 제외)
var firebaseConfig = {
  apiKey: "AIzaSyAqlBklvzCChbsFykTsxPfVnpURBp5JDA8",
  authDomain: "dyucontest.firebaseapp.com",
  projectId: "dyucontest",
  appId: "1:742550983558:web:1678448ca0315ae2f21207"
};

// ── Firebase 초기화 ───────────────────────────
var db = null;
var firebaseReady = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  firebaseReady = true;
  console.log("Firebase Firestore 초기화 성공");
} catch(e) {
  console.error("Firebase 초기화 실패:", e.message);
}

// =============================================
//  iOS body 스크롤 잠금 (overflow:hidden 무시 문제 대응)
// =============================================
var scrollY = 0;

function lockBodyScroll() {
  scrollY = window.scrollY;
  document.body.style.position   = "fixed";
  document.body.style.top        = "-" + scrollY + "px";
  document.body.style.left       = "0";
  document.body.style.right      = "0";
  document.body.style.overflow   = "hidden";
}

function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top      = "";
  document.body.style.left     = "";
  document.body.style.right    = "";
  document.body.style.overflow = "";
  window.scrollTo(0, scrollY);
}

// =============================================
//  뒤로가기 → 모달 닫기
// =============================================
var modalHistoryPushed = false;

function pushModalHistory() {
  if (!modalHistoryPushed) {
    history.pushState({ modal: true }, "");
    modalHistoryPushed = true;
  }
}

window.addEventListener("popstate", function() {
  if (document.getElementById("modalOverlay").style.display === "flex") {
    closeUploadModal(false);
    return;
  }
  if (document.getElementById("detailOverlay").style.display === "flex") {
    document.getElementById("detailOverlay").style.display = "none";
    unlockBodyScroll();
  }
  modalHistoryPushed = false;
});

// =============================================
//  버튼 이벤트 연결
// =============================================
document.getElementById("openModalBtn").onclick  = openUploadModal;
document.getElementById("fabBtn").onclick        = openUploadModal;
document.getElementById("closeModalBtn").onclick = function() { closeUploadModal(true); };

document.getElementById("modalOverlay").onclick = function(e) {
  if (e.target === this) closeUploadModal(true);
};

document.getElementById("closeDetailBtn").onclick = function() {
  document.getElementById("detailOverlay").style.display = "none";
  unlockBodyScroll();
  if (modalHistoryPushed) { history.back(); modalHistoryPushed = false; }
};
document.getElementById("detailOverlay").onclick = function(e) {
  if (e.target === this) {
    this.style.display = "none";
    unlockBodyScroll();
    if (modalHistoryPushed) { history.back(); modalHistoryPushed = false; }
  }
};

document.getElementById("btnCamera").onclick = function() {
  var el = document.getElementById("fileInputCamera");
  el.value = "";
  // iOS Safari: value 초기화 후 즉시 click 시 onchange 묵살 방지
  setTimeout(function() { el.click(); }, 10);
};
document.getElementById("btnGallery").onclick = function() {
  var el = document.getElementById("fileInputGallery");
  el.value = "";
  setTimeout(function() { el.click(); }, 10);
};
document.getElementById("previewChangeBtn").onclick = function() {
  document.getElementById("previewWrap").style.display     = "none";
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
  lockBodyScroll();
  pushModalHistory();
}

function closeUploadModal(goBack) {
  document.getElementById("modalOverlay").style.display = "none";
  unlockBodyScroll();
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
    document.getElementById("previewImg").src               = e.target.result;
    document.getElementById("previewWrap").style.display     = "block";
    document.getElementById("photoSourceBtns").style.display = "none";
  };
  reader.readAsDataURL(file);
}

// =============================================
//  폼 리셋
// =============================================
function resetForm() {
  selectedFile = null;
  document.getElementById("authorName").value              = "";
  document.getElementById("photoTitle").value              = "";
  document.getElementById("photoLocation").value           = "";
  document.getElementById("photoDesc").value               = "";
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
//  제출 (Cloudinary 업로드 → Firestore 저장)
// =============================================
function submitPhoto() {
  var author   = document.getElementById("authorName").value.trim();
  var title    = document.getElementById("photoTitle").value.trim();
  var location = document.getElementById("photoLocation").value.trim();
  var desc     = document.getElementById("photoDesc").value.trim();

  if (!selectedFile) { showNotice("사진을 먼저 선택해주세요. 📷", "error"); return; }
  if (!author)        { showNotice("이름을 입력해주세요.", "error"); return; }
  if (!title)         { showNotice("제목을 입력해주세요.", "error"); return; }
  if (!firebaseReady) { showNotice("⚙️ Firebase 설정을 확인해주세요.", "error"); return; }

  var btn = document.getElementById("submitBtn");
  btn.disabled = true;
  document.getElementById("submitText").textContent     = "업로드 중... 🌸";
  document.getElementById("progressWrap").style.display = "block";
  document.getElementById("progressFill").style.width   = "0%";
  document.getElementById("submitNotice").textContent   = "";

  // ── Step 1: Cloudinary에 이미지 업로드 ────────
  var formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("upload_preset", CLOUDINARY_PRESET);

  var xhr = new XMLHttpRequest();

  // 진행률 표시
  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      var pct = Math.round((e.loaded / e.total) * 90); // 90%까지만 (저장 단계 남겨둠)
      document.getElementById("progressFill").style.width  = pct + "%";
      document.getElementById("progressLabel").textContent = "업로드 중... " + pct + "%";
    }
  };

  xhr.onload = function() {
    if (xhr.status === 200) {
      var result = JSON.parse(xhr.responseText);
      var imageUrl = result.secure_url;

      document.getElementById("progressFill").style.width  = "95%";
      document.getElementById("progressLabel").textContent = "저장 중...";

      // ── Step 2: Firestore에 데이터 저장 ─────────
      db.collection("photos").add({
        author:      author,
        title:       title,
        location:    location,
        description: desc,
        imageUrl:    imageUrl,
        createdAt:   firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        document.getElementById("progressFill").style.width  = "100%";
        document.getElementById("progressLabel").textContent = "완료!";
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

    } else {
      console.error("Cloudinary 오류:", xhr.status, xhr.responseText);
      showNotice("이미지 업로드 실패 (오류 " + xhr.status + "). 다시 시도해주세요.", "error");
      btn.disabled = false;
      document.getElementById("submitText").textContent     = "응모 제출하기";
      document.getElementById("progressWrap").style.display = "none";
    }
  };

  xhr.onerror = function() {
    console.error("네트워크 오류");
    showNotice("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.", "error");
    btn.disabled = false;
    document.getElementById("submitText").textContent     = "응모 제출하기";
    document.getElementById("progressWrap").style.display = "none";
  };

  xhr.ontimeout = function() {
    showNotice("업로드 시간이 초과됐습니다. 다시 시도해주세요.", "error");
    btn.disabled = false;
    document.getElementById("submitText").textContent     = "응모 제출하기";
    document.getElementById("progressWrap").style.display = "none";
  };

  xhr.timeout = 30000; // 30초
  xhr.open("POST", CLOUDINARY_URL, true);
  xhr.send(formData);
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
    grid.innerHTML = '<div class="empty-state"><p>⚙️ Firebase 설정이 필요합니다.</p></div>';
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
        (function(id, data) { card.onclick = function() { openDetail(id, data); }; })(doc.id, d);
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
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// =============================================
//  상세 보기
// =============================================
var currentDetailDocId = null;  // 수정 시 사용할 문서 ID

function openDetail(docId, d) {
  currentDetailDocId = docId;
  document.getElementById("detailImg").src              = d.imageUrl;
  document.getElementById("detailTitle").textContent    = d.title;
  document.getElementById("detailAuthor").textContent   = "📷 " + d.author;
  document.getElementById("detailLocation").textContent = d.location ? "📍 " + d.location : "";
  document.getElementById("detailDesc").textContent     = d.description || "";
  var date = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;
  document.getElementById("detailDate").textContent = date
    ? date.toLocaleDateString("ko-KR", {year:"numeric",month:"long",day:"numeric"}) : "";
  document.getElementById("detailOverlay").style.display = "flex";
  lockBodyScroll();
  pushModalHistory();
}

// 수정 버튼 → 수정 모달 열기
document.getElementById("editBtn").onclick = function() {
  var img      = document.getElementById("detailImg").src;
  var author   = document.getElementById("detailAuthor").textContent.replace("📷 ", "");
  var title    = document.getElementById("detailTitle").textContent;
  var location = document.getElementById("detailLocation").textContent.replace("📍 ", "");
  var desc     = document.getElementById("detailDesc").textContent;

  document.getElementById("editPreviewImg").src   = img;
  document.getElementById("editAuthor").value     = author;
  document.getElementById("editTitle").value      = title;
  document.getElementById("editLocation").value   = location;
  document.getElementById("editDesc").value       = desc;
  document.getElementById("editDescCount").textContent = desc.length + " / 200";
  document.getElementById("editNotice").textContent   = "";
  document.getElementById("editSubmitText").textContent = "수정 완료";
  document.getElementById("editSubmitBtn").disabled   = false;

  document.getElementById("detailOverlay").style.display = "none";
  document.getElementById("editOverlay").style.display   = "flex";
};

// 수정 모달 닫기
document.getElementById("closeEditBtn").onclick = function() {
  document.getElementById("editOverlay").style.display = "none";
  document.getElementById("detailOverlay").style.display = "flex";
};
document.getElementById("editOverlay").onclick = function(e) {
  if (e.target === this) {
    this.style.display = "none";
    document.getElementById("detailOverlay").style.display = "flex";
  }
};

// 글자 수 카운터
document.getElementById("editDesc").oninput = function() {
  document.getElementById("editDescCount").textContent = this.value.length + " / 200";
};

// 수정 제출
document.getElementById("editSubmitBtn").onclick = function() {
  var author   = document.getElementById("editAuthor").value.trim();
  var title    = document.getElementById("editTitle").value.trim();
  var location = document.getElementById("editLocation").value.trim();
  var desc     = document.getElementById("editDesc").value.trim();

  if (!author) { showEditNotice("이름을 입력해주세요.", "error"); return; }
  if (!title)  { showEditNotice("제목을 입력해주세요.", "error"); return; }
  if (!currentDetailDocId) { showEditNotice("문서 정보를 찾을 수 없습니다.", "error"); return; }

  var btn = document.getElementById("editSubmitBtn");
  btn.disabled = true;
  document.getElementById("editSubmitText").textContent = "저장 중...";

  db.collection("photos").doc(currentDetailDocId).update({
    author:      author,
    title:       title,
    location:    location,
    description: desc
  }).then(function() {
    showEditNotice("✅ 수정이 완료되었습니다!", "success");
    setTimeout(function() {
      document.getElementById("editOverlay").style.display = "none";
      unlockBodyScroll();
      modalHistoryPushed = false;
      loadGallery();
    }, 1200);
  }).catch(function(err) {
    console.error("수정 실패:", err);
    showEditNotice("수정 실패: " + err.message, "error");
    btn.disabled = false;
    document.getElementById("editSubmitText").textContent = "수정 완료";
  });
};

function showEditNotice(msg, type) {
  var el = document.getElementById("editNotice");
  el.textContent = msg;
  el.className = "submit-notice" + (type ? " " + type : "");
}

// =============================================
//  꽃잎 애니메이션
// =============================================
function initPetals() {
  var container = document.getElementById("petalsContainer");
  var emojis = ["🌸","🌺","✿","❀","🌷"];
  for (var i = 0; i < 18; i++) {
    var petal = document.createElement("div");
    petal.className = "petal";
    petal.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    petal.style.cssText =
      "left:"+(Math.random()*100)+"%;" +
      "font-size:"+(10+Math.random()*14)+"px;" +
      "animation-duration:"+(6+Math.random()*10)+"s;" +
      "animation-delay:-"+(Math.random()*12)+"s;" +
      "opacity:"+(0.4+Math.random()*0.5)+";";
    container.appendChild(petal);
  }
}

// ── 시작 ──────────────────────────────────────
initPetals();
loadGallery();
