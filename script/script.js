const auth = window.auth;
const db = window.db;
const provider = window.provider;

import {
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  ref,
  set,
  get,
  push,
  onChildAdded,
  child
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

/* ---------------- LOGIN ---------------- */

const googleLogin = document.getElementById("googleLogin");

if (googleLogin) {
  googleLogin.addEventListener("click", () => {
    signInWithPopup(auth, provider);
  });
}

/* ---------------- AUTH + ROUTING ---------------- */

onAuthStateChanged(auth, async (user) => {

  const path = window.location.pathname;

  if (!user) {
    if (path.includes("/home")) {
      window.location.href = "/account/";
    }
    return;
  }

  const snap = await get(ref(db, "users/" + user.uid));

  // no username yet
  if (!snap.exists()) {
    if (!path.includes("/username")) {
      window.location.href = "/account/username.html";
    }
    return;
  }

  // already has username → block account pages
  if (path.includes("/account")) {
    window.location.href = "/home/";
  }

  loadGroups(user.uid);
});

/* ---------------- SAVE USERNAME ---------------- */

const usernameForm = document.getElementById("usernameForm");

if (usernameForm) {
  usernameForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    const username = document.getElementById("username").value;

    if (!user) return;

    await set(ref(db, "users/" + user.uid), {
      username: username,
      email: user.email
    });

    window.location.href = "/home/";
  });
}

/* ---------------- FIND USER BY USERNAME ---------------- */

function findUserByUsername(username, callback) {

  get(ref(db, "users")).then(snapshot => {

    let result = null;

    snapshot.forEach(childSnap => {
      if (childSnap.val().username === username) {
        result = childSnap.key;
      }
    });

    callback(result);
  });
}

/* ---------------- CHAT STATE ---------------- */

let currentChatId = null;
let currentIsGroup = false;

/* ---------------- DM CHAT ID ---------------- */

function getChatId(uid1, uid2) {
  return uid1 < uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
}

/* ---------------- OPEN CHAT ---------------- */

function openChat(id, isGroup) {

  currentChatId = id;
  currentIsGroup = isGroup;

  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  chatBox.innerHTML = "";

  let path;

  if (isGroup) {
    path = "groups/" + id + "/messages";
  } else {
    path = "chats/" + getChatId(auth.currentUser.uid, id) + "/messages";
  }

  const chatRef = ref(db, path);

  onChildAdded(chatRef, (snap) => {

    const msg = snap.val();

    const div = document.createElement("div");
    div.innerText = msg.text;

    chatBox.appendChild(div);
  });
}

/* ---------------- SEND MESSAGE ---------------- */

const sendBtn = document.getElementById("sendBtn");

if (sendBtn) {
  sendBtn.addEventListener("click", async () => {

    const input = document.getElementById("messageInput");

    if (!input.value || !currentChatId) return;

    let path;

    if (currentIsGroup) {
      path = "groups/" + currentChatId + "/messages";
    } else {
      path = "chats/" + getChatId(auth.currentUser.uid, currentChatId) + "/messages";
    }

    await push(ref(db, path), {
      from: auth.currentUser.uid,
      text: input.value,
      timestamp: Date.now()
    });

    input.value = "";
  });
}

/* ---------------- START DM ---------------- */

const startDM = document.getElementById("startDM");

if (startDM) {
  startDM.addEventListener("click", () => {

    const username = document.getElementById("dmUsername").value;

    findUserByUsername(username, (uid) => {

      if (!uid) {
        alert("User not found");
        return;
      }

      openChat(uid, false);
    });
  });
}

/* ---------------- GROUPS ---------------- */

const createGroupBtn = document.getElementById("createGroup");

if (createGroupBtn) {
  createGroupBtn.addEventListener("click", async () => {

    const user = auth.currentUser;
    const name = document.getElementById("groupName").value;

    const groupId = "group_" + Date.now();

    await set(ref(db, "groups/" + groupId), {
      name: name,
      members: {
        [user.uid]: true
      },
      createdAt: Date.now()
    });

    loadGroups(user.uid);
  });
}

/* ---------------- LOAD GROUPS ---------------- */

function loadGroups(uid) {

  const groupList = document.getElementById("groupList");
  if (!groupList) return;

  get(ref(db, "groups")).then(snapshot => {

    groupList.innerHTML = "";

    snapshot.forEach(childSnap => {

      const group = childSnap.val();

      if (group.members && group.members[uid]) {

        const btn = document.createElement("button");
        btn.innerText = group.name;

        btn.addEventListener("click", () => {
          openChat(childSnap.key, true);
        });

        groupList.appendChild(btn);
      }
    });
  });
}