import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";

import {
    ref,
    set,
    push,
    get,
    onChildAdded
} from "firebase/database";

const provider = new GoogleAuthProvider();

/* ---------------- AUTH ---------------- */

if (document.getElementById("googleLogin")) {
    document.getElementById("googleLogin").addEventListener("click", async () => {
        await signInWithPopup(auth, provider);
    });
}

/* ---------------- ROUTING ---------------- */

onAuthStateChanged(auth, async (user) => {

    const path = window.location.pathname;

    if (!user) {
        if (path.includes("/home")) {
            window.location.href = "/account/";
        }
        return;
    }

    const userSnap = await get(ref(db, "users/" + user.uid));

    if (!userSnap.exists()) {
        if (!path.includes("/username")) {
            window.location.href = "/account/username.html";
        }
        return;
    }

    if (path.includes("/account")) {
        window.location.href = "/home/";
    }

    loadGroups(user.uid);
});

/* ---------------- USERNAME LOOKUP ---------------- */

async function findUserByUsername(username) {
    const snap = await get(ref(db, "users"));

    let result = null;

    snap.forEach(child => {
        if (child.val().username === username) {
            result = child.key;
        }
    });

    return result;
}

/* ---------------- DM SYSTEM ---------------- */

function getChatId(uid1, uid2) {
    return uid1 < uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
}

/* START DM */

if (document.getElementById("startDM")) {
    document.getElementById("startDM").addEventListener("click", async () => {

        const username = document.getElementById("dmUsername").value;
        const targetUid = await findUserByUsername(username);

        if (!targetUid) {
            alert("User not found");
            return;
        }

        openChat(targetUid, false);
    });
}

/* ---------------- GROUP SYSTEM ---------------- */

if (document.getElementById("createGroup")) {
    document.getElementById("createGroup").addEventListener("click", async () => {

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

/* LOAD GROUPS */

function loadGroups(uid) {

    const groupList = document.getElementById("groupList");
    if (!groupList) return;

    get(ref(db, "groups")).then(snapshot => {

        groupList.innerHTML = "";

        snapshot.forEach(child => {
            const group = child.val();

            if (group.members && group.members[uid]) {

                const btn = document.createElement("button");
                btn.innerText = group.name;

                btn.onclick = () => openChat(child.key, true);

                groupList.appendChild(btn);
            }
        });
    });
}

/* ---------------- CHAT CORE ---------------- */

let currentChatId = null;
let currentIsGroup = false;

/* OPEN CHAT */

function openChat(id, isGroup) {

    currentChatId = id;
    currentIsGroup = isGroup;

    const chatBox = document.getElementById("chatBox");
    const header = document.getElementById("chatHeader");

    chatBox.innerHTML = "";

    const path = isGroup
        ? "groups/" + id + "/messages"
        : "chats/" + getChatId(auth.currentUser.uid, id) + "/messages";

    header.innerText = isGroup ? "Group Chat" : "DM";

    onChildAdded(ref(db, path), (snap) => {
        const msg = snap.val();

        const div = document.createElement("div");
        div.innerText = msg.text;

        chatBox.appendChild(div);
    });
}

/* SEND MESSAGE */

if (document.getElementById("sendBtn")) {

    document.getElementById("sendBtn").addEventListener("click", async () => {

        const input = document.getElementById("messageInput");
        const text = input.value;

        if (!text || !currentChatId) return;

        const user = auth.currentUser;

        let path = "";

        if (currentIsGroup) {
            path = "groups/" + currentChatId + "/messages";
        } else {
            path = "chats/" + getChatId(user.uid, currentChatId) + "/messages";
        }

        await push(ref(db, path), {
            from: user.uid,
            text: text,
            timestamp: Date.now()
        });

        input.value = "";
    });
}