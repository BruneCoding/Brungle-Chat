// firebase config stuff yk
console.log("Chat App Initialized");
const firebaseConfig = {
  apiKey: "AIzaSyBs2SQXVuM65VCIv54zy8ScDQODXu2f1kM",
  authDomain: "simple-chatting-test.firebaseapp.com",
  projectId: "simple-chatting-test",
  storageBucket: "simple-chatting-test.appspot.com",
  messagingSenderId: "601862347824",
  appId: "1:601862347824:web:e713904cc35bafd1a521f5"
};

document
  .getElementById("createGroup")
  .addEventListener("click", createNewGroup);

document.getElementById("profile-hex").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    applyCustomTheme();
  }
});

document
  .getElementById("randomizeHex")
  .addEventListener("click", randomizeHexColor);

document.getElementById("add").addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = handleFileSelect;
  fileInput.click();
});

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = function () {
    let width = this.width;
    let height = this.height;
    const maxWidth = 350;
    const maxHeight = 285;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const base64 = canvas.toDataURL("image/jpeg", 0.8); // 0.8 quality

    messageInput.value += `<img src="${base64}" class="message-img" style="width: ${width}px; height: ${height}px;">`;
    messageInput.focus();

    URL.revokeObjectURL(img.src);
  };
  img.onerror = function () {
    alert("Error loading image");
  };
  img.src = URL.createObjectURL(file);
}

document
  .getElementById("delete-account-btn")
  .addEventListener("click", initiateAccountDeletion);

let typingTimeout = null;
let isTyping = false;
let currentTypingListener = null;

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const authScreen = document.getElementById("auth-screen");
const authScreenTwo = document.getElementById("auth-screen2");
const chatScreen = document.getElementById("chat-screen");
const signupBtn = document.getElementById("signup-btn");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// generated guest section vars
const usernameInputTwo = document.getElementById("username-two");
const emailInputGenerated = document.getElementById("email-generated");
const passwordInputTwo = document.getElementById("password-two");
const signupBtnTwo = document.getElementById("signup-btn-two");

// continued
const logoutBtn = document.getElementById("logout-btn");
const pfpUserName = document.getElementById("pfpUserName");
const contactsList = document.getElementById("contacts");
const messagesContainer = document.getElementById("messages-container");
const titleTextMessage = document.querySelector(".messages-info h1");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const searchContacts = document.getElementById("search-contacts");
const currentChatName = document.getElementById("current-chat-name");

messageInput.addEventListener("input", function () {
  const maxLength = 500;
  const currentLength = this.value.length;

  if (currentLength > maxLength) {
    alert("You have reached the max message character limit.");
    this.value = this.value.substring(0, maxLength);
  }
});

let currentUser = null;
let currentChat = {
  type: "global",
  id: "global",
  name: "Global Chat"
};
let users = [];
let groups = [];
let unsubscribeMessages = null;

// AI API KEYS
const API_KEY_AI = "AIzaSyCabBCysAE2M7-0DdmXa62VMfE61Js6714";
const API_URL_AI = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY_AI}`;

init();

function init() {
  setupMessagePopup();

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      setupChatApp();
    } else {
      showAuthScreen();
      showAuthTwoScreen();
    }
  });

  function generateGuestEmail() {
    const randomNum = Math.floor(Math.random() * 150) + 1;
    return `guest-${randomNum}@brungle.com`;
  }

  emailInputGenerated.value = generateGuestEmail();

  async function handleSignupGuest() {
    const usernameFirst = usernameInputTwo.value;
    const username = "Guest-" + usernameFirst;
    const password = passwordInputTwo.value;
    const email = emailInputGenerated.value;

    if (!username || !password) {
      alert("Please enter a username and password");
      return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      await db.collection("users").doc(userCredential.user.uid).set({
        username: username,
        email: email,
        isGuest: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      currentUser = userCredential.user;
      setupChatApp();

      checkGuestAccountExpiration();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        try {
          const userCredential = await auth.signInWithEmailAndPassword(
            email,
            password
          );
          currentUser = userCredential.user;
          setupChatApp();

          checkGuestAccountExpiration();
        } catch (signInError) {
          alert(signInError.message);
        }
      } else {
        alert(error.message);
      }
    }
  }

  function checkGuestAccountExpiration() {
    if (!currentUser) return;

    db.collection("users")
      .doc(currentUser.uid)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().isGuest) {
          const createdAt = doc.data().createdAt.toDate();
          const now = new Date();
          const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
          const hoursRemaining = 24 - hoursElapsed;

          if (hoursElapsed >= 23 && hoursElapsed < 24) {
            alert(
              `Your Guest account will be deleted in ${Math.ceil(
                hoursRemaining
              )} hour(s). To continue using Brungle Chats, please create a normal account or create a new guest account. Be advised that all settings and customizations in this account will also be deleted.`
            );
          }

          if (hoursElapsed >= 24) {
            alert(
              "Terminating Guest Account. Create a new Brungle Account to use Brungle Chats. If you liked Brungle Chats, make sure to share it with your friends! Please make sure not to signup with a school email ( slight possibility it might turn up in emails, and school might investigate further. most likely like 0.5% but it is still a security breach )"
            );
            deleteGuestAccount();
          } else {
            const nextCheckTime =
              hoursElapsed < 23
                ? (23 - hoursElapsed) * 3600000
                : (24 - hoursElapsed) * 3600000;

            setTimeout(checkGuestAccountExpiration, nextCheckTime);
          }
        }
      });
  }

  async function deleteGuestAccount() {
    try {
      await db.collection("users").doc(currentUser.uid).delete();

      await currentUser.delete();

      await auth.signOut();
      currentUser = null;
      showAuthScreen();

      alert(
        "Your guest account has been deleted. Please create a new account to continue."
      );
    } catch (error) {
      console.error("Error deleting guest account:", error);
      alert("Error deleting guest account. Please try again.");
    }
  }
  signupBtnTwo.addEventListener("click", handleSignupGuest);

  function tellMeWhatThisIs() {
    alert(
      "Guest Accounts have randomly generated emails. You cannot change this."
    );
  }
  // just stuff
  emailInputGenerated.addEventListener("click", tellMeWhatThisIs);

  // normal
  signupBtn.addEventListener("click", handleSignup);
  logoutBtn.addEventListener("click", handleLogout);
  sendBtn.addEventListener("click", sendMessage);

  messageInput.addEventListener("input", function () {
    const maxLength = 500;
    const currentLength = this.value.length;

    if (currentLength > maxLength) {
      alert("You have reached the max message character limit.");
      this.value = this.value.substring(0, maxLength);
    }
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  searchContacts.addEventListener("input", filterContacts);

  messageInput.addEventListener("input", debounceTyping, false);
  messageInput.addEventListener("keydown", debounceTyping, false);

  document.getElementById("nodeAIChat").addEventListener("click", () => {
    switchChat("ai", "nodeAI", "Node");
  });
  document.getElementById("chatgptAIChat").addEventListener("click", () => {
    switchChat("ai", "chatgptAI", "ChatGPT");
  });
  document.getElementById("geminiAIChat").addEventListener("click", () => {
    switchChat("ai", "geminiAI", "Gemini");
  });
}

function showAuthScreen() {
  authScreen.classList.remove("hidden");
  chatScreen.classList.add("hidden");
}

function showAuthTwoScreen() {
  authScreenTwo.classList.remove("hidden");
  chatScreen.classList.add("hidden");
}

function showChatScreen() {
  authScreen.classList.add("hidden");
  authScreenTwo.classList.add("hidden");
  chatScreen.classList.remove("hidden");
}

async function handleSignup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  const username = usernameInput.value;

  if (!email || !password || !username) {
    alert("Please fill all fields");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    await db.collection("users").doc(userCredential.user.uid).set({
      username: username,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    currentUser = userCredential.user;
    setupChatApp();
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      try {
        const userCredential = await auth.signInWithEmailAndPassword(
          email,
          password
        );
        currentUser = userCredential.user;
        setupChatApp();
      } catch (signInError) {
        alert(signInError.message);
      }
    } else {
      alert(error.message);
    }
  }
}

async function setupChatApp() {
  showChatScreen();
  const username = await getUsername(currentUser.uid);
  pfpUserName.textContent = username;

  createGlobalChatEntry();
  loadUsers();
  loadGroups();
  switchChat(currentChat.type, currentChat.id, currentChat.name);
}

async function createGlobalChatEntry() {
  const lastMessage = await getLastGlobalMessage();

  const globalChatDiv = document.createElement("div");
  globalChatDiv.classList.add("personChat", "pinned");
  globalChatDiv.dataset.chatId = "global";

  globalChatDiv.innerHTML = `
    <div style="width: 55px; height: 55px; border-radius: 50%; font-size: 55px; display: flex; justify-content: center; align-items: center; background-size: 115%"> 
    <i class="fa-solid fa-earth-americas fa-beat" 
   style="
     --fa-animation-duration: 2s;
     --fa-beat-scale: 1.035;
     --fa-beat-animation-timing: cubic-bezier(0.4, 0, 0.2, 1.5);
     --fa-border-color: #906fc3;
   "></i>
    </div>
    <div class="columnizer">
      <h1>Global Chat</h1>
      <h3>Global • All Users</h3>
      <p>${lastMessage.substring(0, 20)}${
    lastMessage.length > 15 ? "..." : ""
  }</p>
    </div>
    
  `;

  globalChatDiv.addEventListener("click", () => {
    switchChat("global", "global", "Global Chat");
  });

  contactsList.appendChild(globalChatDiv);
}

async function getUsername(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? doc.data().username : "Unknown";
}

function handleLogout() {
  if (unsubscribeMessages) unsubscribeMessages();
  auth.signOut();
}

function filterContacts() {
  const searchTerm = searchContacts.value.toLowerCase();
  const allContacts = document.querySelectorAll(".personChat:not(.pinned)");

  allContacts.forEach((contact) => {
    const username = contact.querySelector("h1").textContent.toLowerCase();
    contact.style.display = username.includes(searchTerm) ? "flex" : "none";
  });
}

function loadUsers() {
  db.collection("users").onSnapshot((snapshot) => {
    users = [];

    document.getElementById("userContainerHolder").innerHTML = "";

    snapshot.forEach((doc) => {
      if (doc.id !== currentUser.uid) {
        const user = {
          id: doc.id,
          ...doc.data()
        };
        users.push(user);
        displayContact(user);
      }
    });
  });
}

function displayContact(user) {
  const contactDiv = document.createElement("div");
  contactDiv.classList.add("personChat");
  contactDiv.dataset.userId = user.id;

  if (user.themeColor) {
    contactDiv.style.backgroundColor = user.themeColor;
    contactDiv.style.backgroundImage = `linear-gradient(135deg, ${
      user.themeColor
    }, ${adjustColor(user.themeColor, -20)})`;
    contactDiv.style.borderLeft = `3px solid ${adjustColor(
      user.themeColor,
      -30
    )}`;
  }

  const displayUsername = user.username || "Unknown";

  const devUsernames = ["Brune"];
  const isDev = devUsernames.includes(displayUsername);
  const devTag = isDev ? '<span class="devtag">⚡DEV</span>' : "";

  const avatarSrc = user.profilePhoto
    ? user.profilePhoto
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayUsername.substring(0, 1)
      )}&background=722fca&color=fff`;

  contactDiv.innerHTML = `
    <img src="${avatarSrc}" onerror="this.src='https://ui-avatars.com/api/api/?name=${encodeURIComponent(
    displayUsername.substring(0, 1)
  )}&background=722fca&color=fff'">
    <div class="columnizer">
      <h1>${displayUsername} ${devTag}</h1>
      <h3>Email:${user.email || "No email"}</h3>
      <p>Loading last message...</p>
    </div>
  `;

  // loading last messages through firebase sdk
  getLastPrivateMessage(user.id).then((lastMessage) => {
    const messageElement = contactDiv.querySelector("p");
    if (messageElement) {
      messageElement.textContent = lastMessage;
    }
  });

  contactDiv.addEventListener("click", () => {
    switchChat("private", user.id, displayUsername);
  });

  // Add to user container instead of contacts
  document.getElementById("userContainerHolder").appendChild(contactDiv);
}

// Helper function to adjust color brightness
function adjustColor(color, amount) {
  return (
    "#" +
    color.replace(/^#/, "").replace(/../g, (color) => {
      const value = Math.min(255, Math.max(0, parseInt(color, 16) + amount));
      return ("0" + value.toString(16)).substr(-2);
    })
  );
}

async function getLastGlobalMessage() {
  const snapshot = await db
    .collection("messages")
    .where("chatType", "==", "global")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return "No messages yet";

  const lastMessage = snapshot.docs[0].data();
  return `${lastMessage.senderUsername || "User"}: ${
    lastMessage.text || "Image sent"
  }`;
}

async function getLastPrivateMessage(otherUserId) {
  const chatId = [currentUser.uid, otherUserId].sort().join("_");
  const snapshot = await db
    .collection("messages")
    .where("chatId", "==", chatId)
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return "No messages yet";

  const lastMessage = snapshot.docs[0].data();
  // user as You:
  if (lastMessage.senderId === currentUser.uid) {
    return `You: ${lastMessage.text || "Image sent"}`;
  }
  return `${lastMessage.senderUsername || "User"}: ${
    lastMessage.text || "Image sent"
  }`;
}

// Add this function to update the profile picture element
function updateChatProfilePicture() {
  const changeToPfp = document.getElementById("change-to-pfp");

  if (currentChat.type === "global") {
    changeToPfp.innerHTML = `
      <div class="img-or-i" id="change-to-pfp">
        <i class="fa-solid fa-earth-americas" id="earth-icon"></i>
      </div>
    `;

    // Initialize the bounce animation for the global chat icon
    const icon = document.getElementById("earth-icon");
    if (icon) {
      icon.style.setProperty("--fa-animation-duration", "2s");
      icon.style.setProperty("--fa-beat-scale", "1.035");
      icon.style.setProperty(
        "--fa-beat-animation-timing",
        "cubic-bezier(0.4, 0, 0.2, 1.5)"
      );
      icon.style.setProperty("--fa-border-color", "#906fc3");

      // Start the bounce animation after delay
      setTimeout(() => {
        function toggleBounce() {
          icon.style.animationPlayState = "running";
          setTimeout(() => {
            icon.style.animationPlayState = "paused";
          }, 1850);
        }

        // Initial delay
        setTimeout(() => {
          toggleBounce();
          setInterval(toggleBounce, 11850);
        }, 10000);
      }, 100);
    }
  } else if (currentChat.type === "private") {
    const user = users.find((u) => u.id === currentChat.id);
    const username = user?.username || currentChat.name;
    const avatarSrc =
      user?.profilePhoto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username.substring(0, 1)
      )}&background=722fca&color=fff`;

    changeToPfp.innerHTML = `
      <div class="img-or-i" id="change-to-pfp">
        <img src="${avatarSrc}" alt="${username}'s profile picture" class="chat-pfp">
      </div>
    `;
  } else if (currentChat.type === "group") {
    db.collection("groups")
      .doc(currentChat.id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const groupData = doc.data();
          const groupImageSrc =
            groupData.groupImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              currentChat.name.substring(0, 2)
            )}&background=4e4376&color=fff`;

          changeToPfp.innerHTML = `
            <div class="img-or-i" id="change-to-pfp">
              <img src="${groupImageSrc}" alt="${currentChat.name} group picture" class="chat-pfp">
            </div>
          `;
        }
      });
  } else if (currentChat.type === "ai") {
    const avatarUrls = {
      nodeAI: `data:image/jpeg;base64,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`,
      chatgptAI: `data:image/jpeg;base64,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viKtjld/haSf5IO8sWnbLp+ExWO00NvYQARSwNj62PMgb/Su0WGNQdJHQNsgLqCprbtNyEdLTOYPpMnVGPdlYR190ldUX6OSl07DFYaN2QZI3drUOGMfHIAb590AjzQSQ4scWtP8O6J7KuUVl5c3MNuhd3z5F5+Q3fmdz4AqDevdZXjXOoJrvfqgyTP2jibtHAzwYweAH1nmcldDUzzVVRJPUyyTTyOLnySOLnOJ5kk7kq0iCIiAiIgIiICE4GSitPd1jtyQUuPWOVwiIoiIgIiICIiArzH52PNWUQfQioY/Ox5qtEEREBERAREQEREBERAREQEREBERAREQEREBEJwMlWnv63LkgPfnYclQiIoiIgIiICIiAiIgIiICra/Gx5KhEH0AgjZFYBI5K42QHnsiK0REBERAREQEREBERAREQEREBEXBIHMoOVw5wb71bdITy2VCDlzi47rhERRERAREQEREBERAREQEREBERAREQcgkciqxJ5hW0QXw4HkVyvnXIcRyKJi+itCQ+iqEmfBBWi4ByuUBEVJdjwQVIrZkPgFSXuPigvKkvA9VaJJ5rhBWZCeWypXCIoiIgIiICIiAiIgIiIP/2Q==`,
      geminiAI: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAEdAR0DASIAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAUGAgMHAQQI/8QAPBAAAgIBAgEJBAgFBAMAAAAAAAECAwQFEQYSEyEiMUFRYXEHMoGhFCNCUmKRwdEVJDNysTRDouFTgrL/xAAaAQEBAAMBAQAAAAAAAAAAAAAAAQIDBAUG/8QALhEBAAIBAwMCAwgDAQAAAAAAAAECAwQRIQUSMRNBUWFxIjKBscHR4fAUM5Gh/9oADAMBAAIRAxEAPwDt4AKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABnVVO2XJri5PwQGAJnE0Oc9nkT5C8F0sl8bT8bH25FUXL70ulgVanDyLv6dM2vHbZH2V6JlS97kQ9XuWcDcQENAl9u9fBGxaBDvul+RNgioOWgR+ze/ijVPQbV7l0X6osIAqlukZdfZWpr8LPjsqsqe1kJRfmti7nk4RnHkzipLwa3AowLRk6PjW7uCdUvw9n5EPmaVkY6ckucgu+JRHgAIAAAAAAAAAAAAAAAAAAAAAAAAAyhCVk1GEXKT6EkWLS9KjQlZkJSt7du6IEfp+kWX7Tv3rr8O9lgxserHhyaYKK+bNwIoAAAAAAHyapmRwcaN0mtnbXX0/inGP6liJtMRA+sAEAAAAAB8GfpdGVvJLm7fvR7/Urubh3Yk9rY9XukuxlxMLqoXVuFkVKL7mBSASeqaXPFbsq3lT84kYVAAAAAAAAAAAAAAAAAAAD2uErJqME3JvZJHhZdE09UQV1q+tkuhP7KA2aXp8cSClPZ3NdL8PIkQCAAAoAAAAAFO9p+W8fRMeuD2nZfF/CPT/nYuJy/wBq+WrNSxcVP+jBya85f9JHd07H6mor8uUtO0Ok4F6ysKi+PZbCM18VubytezzNWXw1RFvedDdb/QspzZsfp5LU+EkTvyAA1KAAAAADSaaa3TK3rGmOhu6hfVPtX3SyHkoqUXGSTT7UwKMCQ1fAeJdyoJ81Ls8vIjyoAAAAAAAAAAAAAABnTXK22NcF1pPZASOhYXP3c9Yvq4Po82WY1YtMcfHhVBdEUbSKAAAAAAAAAADyTUYtt7JdLOD8TZ/8S13Lyd94ym1H0XQjq3H2qrS+HruRLa/I+qr8entfwRxXc+g6Ng2i2WffiP1actvZfPZXqHM6jfgzltG6PKivxL/o6ifn3S8yzT9Qx8un36pqW3j4r4nfMHJqzcOnJolyqrYKcX5M5ur4OzLGSPE/myxzvGzcADyGwAAAAAAABqyqIZNEqp9j7/Ap2TTLHvnVPti9i7ENxFic5UsiC60OiXmgK8ACoAAAAAAAAAAATPDmPy7Z3yXRHoXqQxcNMo+j4VcNus1vL1YH1AAigAAAAAAAB5JqKbbSS6W2elC9pXE6wseWl4U/5qxfWyT9yL7vV/4N2nwW1GSMdGNrRWN5U/jzXHrOtS5qW+Lj711efi/iVxMwT3PUz7PFiripFK+IcXfNp3lsR0r2W64pVz0nIl0x3nTv4d6/U5ombsPKtw8qrIx5ONtcuVFo1avTxqMU0n8Pq2VttO79EgieGNap1zTIZFTStXVth3xl+xLHxt6TS01t5h1RO/IADFQAAAAAMbIKyEoSW6ktmZAClZdLoybKn9l7GomuJaOTZVcl73VfqQpUkAAAAAAAAAAG/Aq57MprfY5Lf0LmiscPQ5WdyvuxZZwAAIoAAAAAAxsnGuEp2SUYRW7k3skc74w9oVdEZ4mhyVl3ZLI23jH+3xZ0afTZNTbtxwwyZK443smeN+LqtDolj4so2ahNdEe1V+b/AGOM33WZF9l185Ttm3KUpPdts123TutlbdOVlk3vKUnu2/FmKZ9bo9FTSU2jmZ8y86+ack7s0zNM1oyTOqYIlmjJGCZkjFtiUxw1reRoWoRyKG5Vvosr36JI7Zo+p42rYMMrEmpQl2rvi/Bn58JXh7XcvQ8tXYk94PosrfuzXn+55mv0EaiO+nFvzb6X24d7BC8O8R4WuUJ48+Rel1qZPrL9yaPmL47Y7dt42l0RO4ADAAAAAAHw63VzunWeMOsvgVMu90VOmcX2NNFJkuTJp9qexUl4AAAAAAAAAAJvhmPXvl5JE+QnDP8ATu9UTZFAD4tS1KnT63O6vKmvCjGstf8Axiy1rNp2rG6TMRG8vtBQNV9puBhScKtOz52LuthzS+fT8iqan7UtVyE44VFGLF9j25cvmeli6RqsvPbtHz/u7kvrsNPfd2e62umDndOMILtcnsin697Q9I02MoYknnZC6FGr3E/OX7bnG9S1nUdUk5Z+Zddv3Sl0fkfCj1dP0Glec1t/lHj+/wDHJk6jM8UjZY+IeLdU12bWRdzeP3UVdEfj4/Eg0akzJM9qmKmKvbSNoc3fNp3tLajJM1pmSZlLOstiZ6jBMyTMJbayzTM0akzNMwmG2JZpmRgj1Mxbay3491mPdG2iyVdkXupRezRfOH/aDbTyadYrd0Oznq/eXqu858meo0Z9NjzxtkjdsraY8O/aZrGBqdanhZVdv4U9mvVdp9+5+d6bJ1TU6pyhNdji9mWLTuM9Ywko/SFfBfZtW/zPEzdHtH+q2/1bq5N/Ls6BzvC9pEdks3Ae/fKqf6P9ywadxjpmc1GuGYpeH0eUv/nc4Mmhz4+Zqz3hZAYVWRtgpxUkn96Li/yfSZnIoUvMjyMq6PhJl0Kdqf8Ar7/7mWEl8wAAAAAAAAAAn+GX1Ll5omyvcNT2vtj4xTLCRQAAYXU1XwcLq4WQfbGcU0V/U+CtB1BPnMCuqb+1T1H8ugsYNmPNkxTvS0x9GNqVv96N3KdZ9lcoqU9IzOV4V3L9UUDWNE1HRreRqOLZTu9lNreMvR9h+lTTk49OVROnJqhbVNbShOO6a9D1tP1vPj4y/aj/ANcWXp+O3NOJfmBGSOqcV+zWElPJ0B8iXa8ab6P/AFf6HL8nHuxMidGTXKq6D2lGS2aPo9NrMWqrvjn8Pd52TDfDO1oeRZka0zJM6JSstiZkma0ZJkmG2JbUz01pmaMJhtiWaZkjWZxMJhtiWaPdyV0Dh/P1u7k4lTVSfWtl0RidP4f4I03S1GzIisvJXTyrF1YvyRwarX4tNxad5+EN9KzZzXRuG9U1XaWLjSVT/wByzqx/Pv8AgXPTPZ1XFKWpZcpv7lS2X5nQUtuhdCPTw83Vc2T7v2YdEUiELgcL6PhJc1g1SkvtWLlv5kxCuFcVGuMYxXYorZGQPPvkted7TuzNgAYAU3UXvnXv8TLk3smyk5EuVfZLxkywktYAAAAAAAAAAkNCs5Gow8JJxLUUimx1Wwsj2xaZdoSU4RlHpTW6Eq9ABAAAAAAGVvi/hPD4ixXykqc2K+rvS6fSXiiyA2Yst8N4vSdphjekXjtt4fmnV9MytIzrMTOrddsH8JLxT70fGj9A8acNUcQ6a4NRhl1remzbsfg/I4JmY12FlW4+TB13VScZRfamfZdP19dXTni0eY/V4ufBOC3yYJnqMEzLuO+Ya6y2JmSZrTMkYzDbWWZeuCeCrNU5GZqalVhdsYdkrf2Q9nfCb1GxajqEP5OD+rg/9xrv9EddjFRioxSUV0JI8DqXUvTmcOGefefh/LuwYe6O6zXi49OJRCnGrjXVBbKMVskbQD5uZ35l2gAAAAAAANObZzWJbPwiyllm4iuUMJV79ayW3wRWSwAACAAAAAAAABaNByOewlBvrV9X4dxVyQ0TJ+j5iUn1J9VgWoAEUAAAAAAAAZzv2rcMrMw/4thw/maFtakvfh4+q/wdEMbIRshKE0pRkmmn3o36bUW0+SMlfZry44y1msvy8mZJk5xvor0LiC/GinzE/rKn+F93w7CBR95jvXLSL18S8CYmlprPs2In+DdCnr2sV0bNY8OvdLwj4fEr0Wd69n2h/wAF0GvnY7ZWQlZbv2rwj8P3OHqer/xcO9fvTxH7uvTY/Uvz4hY8emvHohTTFQrhFRjFdiRsAPivPMvYAAAAAAAAADRnZCxsWdr7Uuj1Ar2v5HPZrgn1a1yfj3kaezk5ycpdLb3Z4VAAAAAAAAAAAAujsAAtejZn0rFSk/rIdEvPzPvKdp+VLEyI2L3eyS8UW6myN1cbK3vGS3RFZgAAAAAAAAACj+1jRlqHD6zK475GE+Xv4wfvL/D+BxPc/UGTTDIx7KbEnCyLi0/Bn5r1rClpurZWHNNOmxxXp3fI+p6DqO/HbDPtzH0n+fzeR1DH22i8e6a9nukrVuJsaFkd6KXz1nml2L89jvxzr2NadzWl5WfOPWunyIv8K/7Oinl9Zz+rqZr7V4/d2aKnbiifiAA8p1gAAAAAAABWtfzOevVNb6lfb5sldZzVi0OMH9bPoXl5lV7XuwAAKgAAAAAAAAAAAAAEno2o/RZ83a/qZf8AFkYAL1FqSTT3T7wVvSNUdG1V73q7n90scZKUU4tNPpTRFegAAAAAAAHFvbDp/wBG4iqyoLaOVWm/7l0P9DtJSfalpT1LA01wW845ldTfhGxqP+eSel0nP6OprM+J4/v4uTW4+/DO3snODMJafwvp1G20uZU5esul/wCSaPIRUYqMVsl0JHpwZLzkvN58zy6q17YisewADBQAAAAAPnzsqGJQ7J9vdHxYzcuvEq5dj6X7se9lUzMqzLuc7H6LwAxyb55F0rLHvJ/I1AFQAAAAAAAAAAAAAAAAAAAkNN1KzEahLedXh4ehHgC642RVk18uqSkvmjaUmi+3Hny6ZuL8iewtbhNKOSuRL7y7GFTAMYTjZFShJST70zIgAAAa8imF8FG2KlFSjNJ+MWmn+aRsAidgQAAAAAAaMnLpxo72zSfh3gbyP1HVKsVOMOvb91d3qRWfrNt28MfeuHj3sim23u+lgbMi+zItdlsnKT+RrAKgAAAAAAAAAAAAAAAAAAAAAAAAAANtGTdjy3pslH0JXG12cdlkVqa+9HoZCgG62U6tiWr+pyH4T6D64W1zW8JxkvJlIPYycXvFtPyBuvIKXHKvj7t018TP6flf+ef5jY3XENpdrKa87JfbfP8AM1Sutl71k36sbG6425VFX9S2EfVnw363jQ3VanY/JbIrIGypPJ1jJu3UGqo/h7fzI2cnKTcm2/FngCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/2Q==`
    };

    changeToPfp.innerHTML = `
      <div class="img-or-i" id="change-to-pfp">
        <img src="${avatarUrls[currentChat.id]}" alt="${
      currentChat.name
    }" class="chat-pfp">
      </div>
    `;
  }
}

function switchChat(type, id, name = null) {
  if (currentTypingListener) {
    currentTypingListener();
    currentTypingListener = null;
  }

  autoScrollEnabled = true;

  if (unsubscribeMessages) unsubscribeMessages();

  currentChat = { type, id, name: name || id };
  currentChatName.textContent = name || id;

  // Show/hide admin panel based on group ownership
  const adminPanel = document.getElementById("admin-control-panel");
  const memberPanel = document.getElementById("member-control-panel");

  if (type === "group") {
    // Check if current user is the group creator or admin
    db.collection("groups")
      .doc(id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const groupData = doc.data();
          const admins = groupData.admins || [groupData.createdBy];

          if (admins.includes(currentUser.uid)) {
            adminPanel.style.opacity = "1";
            adminPanel.style.transform = "scale(1)";
            memberPanel.style.opacity = "0";
            memberPanel.style.transform = "scale(0)";
          } else {
            adminPanel.style.opacity = "0";
            adminPanel.style.transform = "scale(0)";
            memberPanel.style.opacity = "1";
            memberPanel.style.transform = "scale(1)";
          }
        }
      });
  } else {
    adminPanel.style.opacity = "0";
    adminPanel.style.transform = "scale(0)";
    memberPanel.style.opacity = "1";
    memberPanel.style.transform = "scale(1)";
  }

  document.querySelectorAll(".personChat").forEach((chat) => {
    chat.classList.remove("active-chat");
  });

  const selector =
    type === "private"
      ? `.personChat[data-user-id="${id}"]`
      : type === "group"
      ? `.groupChat[data-group-id="${id}"]`
      : type === "ai"
      ? `.personChat[id="${id}"]`
      : '.personChat[data-chat-id="global"]';

  const activeChat = document.querySelector(selector);
  if (activeChat) activeChat.classList.add("active-chat");

  messagesContainer.innerHTML = "";

  // Check blocked status (only for private chats)
  const chatArea = document.querySelector(".chatArea");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");

  if (type === "private") {
    db.collection("blockedChats")
      .doc([currentUser.uid, id].sort().join("_"))
      .get()
      .then((doc) => {
        if (doc.exists) {
          chatArea.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
          messageInput.disabled = true;
          messageInput.placeholder = "This chat is blocked";
          sendBtn.disabled = true;
        } else {
          chatArea.style.backgroundColor = "";
          messageInput.disabled = false;
          messageInput.placeholder = "Type a message...";
          sendBtn.disabled = false;
        }
      });
  } else {
    chatArea.style.backgroundColor = "";
    messageInput.disabled = false;
    messageInput.placeholder = "Type a message...";
    sendBtn.disabled = false;
  }

  updateChatProfilePicture();

  if (type === "ai") {
    // For AI chats, display welcome message if empty
    if (messagesContainer.innerHTML === "") {
      displayAIMessage(id, getAIWelcomeMessage(id));
    }
  } else {
    setupMessageListener();
    setupTypingListener();
  }
}

function setupTypingListener() {
  if (currentChat.type === "global") {
    currentTypingListener = db
      .collection("typingStatus")
      .where("chatId", "==", "global")
      .where("userId", "!=", currentUser.uid)
      .onSnapshot((snapshot) => {
        const typers = [];
        snapshot.forEach((doc) => {
          typers.push(doc.data().username);
        });

        if (typers.length > 0) {
          showTypingIndicator(true, typers.join(", "));
        } else {
          showTypingIndicator(false);
        }
      });
  }
  // Add similar logic for private chats if needed
}

// Update your message input event listener
messageInput.addEventListener("input", debounceTyping, false);
messageInput.addEventListener("keydown", debounceTyping, false);

function debounceTyping() {
  if (!isTyping) {
    isTyping = true;
    updateTypingStatus(true);
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    updateTypingStatus(false);
  }, 2000);
}

function updateTypingStatus(typing) {
  const typingRef = db.collection("typingStatus").doc(currentUser.uid);

  if (typing) {
    typingRef.set({
      userId: currentUser.uid,
      username: pfpUserName.textContent,
      chatId: currentChat.type === "global" ? "global" : currentChat.id,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } else {
    typingRef.delete();
  }
}

function setupMessageListener() {
  if (unsubscribeMessages) unsubscribeMessages();

  let query;
  if (currentChat.type === "global") {
    query = db
      .collection("messages")
      .where("chatType", "==", "global")
      .orderBy("timestamp", "asc");
  } else if (currentChat.type === "private") {
    const chatId = [currentUser.uid, currentChat.id].sort().join("_");
    query = db
      .collection("messages")
      .where("chatId", "==", chatId)
      .orderBy("timestamp", "asc");
  } else if (currentChat.type === "group") {
    query = db
      .collection("messages")
      .where("chatId", "==", currentChat.id)
      .orderBy("timestamp", "asc");
  }

  unsubscribeMessages = query.onSnapshot((snapshot) => {
    const wasScrolledToBottom =
      messagesContainer.scrollTop ===
      messagesContainer.scrollHeight - messagesContainer.clientHeight;

    messagesContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      displayMessage(data, false);
    });

    // After all messages are loaded, scroll to the bottom
    if (wasScrolledToBottom || snapshot.empty) {
      scrollToBottom(true); // Force scroll on initial load or if no new messages
    }
  });
}

function showTypingIndicator(show, username = null) {
  const typingIndicator = document.getElementById("typing-indicator");
  if (!typingIndicator) return;

  if (show) {
    typingIndicator.style.display = "block";
    if (username) {
      typingIndicator.innerHTML = `
        <span>${username} is typing</span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      `;
    }
  } else {
    typingIndicator.style.display = "none";
  }
}

async function sendMessage() {
  let text = messageInput.value.trim();
  if (!text) return;

  if (text.includes("<img")) {
    messageInput.disabled = true;
    document.body.style.cursor = "wait";

    setTimeout(() => {
      messageInput.disabled = false;
      document.body.style.cursor = "";
    }, 250);
  } else if (text.length > 500) {
    alert("Max character limit reached.");
    messageInput.value = messageInput.value.substring(0, 500);
    messageInput.focus();
    return;
  }

  // Add character limit indicator if at max
  if (text.length === 500) {
    text +=
      ' <i style="color:var(--red-accent); opacity: 0.5; margin-top: 7.5px;"> CHARACTER LIMIT REACHED </i>';
  }

  if (currentChat.type === "private") {
    const isBlocked = await db
      .collection("blockedChats")
      .doc([currentUser.uid, currentChat.id].sort().join("_"))
      .get()
      .then((doc) => doc.exists);

    if (isBlocked) {
      alert("This chat is blocked. You cannot send messages.");
      return;
    }
  }

  // Check message rate limit
  const now = Date.now();
  const lastMessageTime = localStorage.getItem("lastMessageTime") || 0;
  const timeSinceLastMessage = now - lastMessageTime;

  if (timeSinceLastMessage < 850) {
    const timeLeft = (850 - timeSinceLastMessage) / 1000;
    console.log(
      `Please wait ${timeLeft.toFixed(
        1
      )} seconds before sending another message.`
    );
    return;
  }

  // Update last message time
  localStorage.setItem("lastMessageTime", now);

  isTyping = false;
  updateTypingStatus(false);
  clearTimeout(typingTimeout);

  try {
    const username = await getUsername(currentUser.uid);
    const messageBg = getComputedStyle(document.documentElement)
      .getPropertyValue("--message-bg")
      .trim();

    // Convert YouTube links if any
    const processedText = convertYouTubeLinks(text);

    if (currentChat.type === "ai") {
      displayMessage(
        {
          text: processedText,
          senderId: currentUser.uid,
          senderUsername: username,
          senderEmail: currentUser.email,
          timestamp: new Date(),
          isHTML: true,
          messageBg: messageBg
        },
        true
      );

      messageInput.value = "";

      showTypingIndicator(true, currentChat.name);

      const aiResponse = await getAIResponse(currentChat.id, processedText);

      // Hide typing indicator
      showTypingIndicator(false);

      // Display AI response
      displayAIMessage(currentChat.id, aiResponse);
      return;
    }

    const messageData = {
      text: processedText,
      senderId: currentUser.uid,
      senderUsername: username,
      senderEmail: currentUser.email,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      isHTML: true,
      messageBg: messageBg
    };

    if (currentChat.type === "global") {
      messageData.chatType = "global";
      updateGlobalChatLastMessage(text.replace(/<[^>]*>?/gm, ""));
    } else if (currentChat.type === "private") {
      messageData.chatType = "private";
      messageData.chatId = [currentUser.uid, currentChat.id].sort().join("_");
      messageData.participants = [currentUser.uid, currentChat.id];
      updatePrivateChatLastMessage(
        currentChat.id,
        text.replace(/<[^>]*>?/gm, "")
      );
    } else if (currentChat.type === "group") {
      messageData.chatType = "group";
      messageData.chatId = currentChat.id;
      updateGroupChatLastMessage(
        currentChat.id,
        text.replace(/<[^>]*>?/gm, "")
      );
    }

    // Display message immediately (optimistic update)
    const messageElement = displayMessage(
      {
        ...messageData,
        timestamp: new Date()
      },
      true
    );

    messageElement.classList.add("message-animation-enter");
    setTimeout(() => {
      messageElement.classList.remove("message-animation-enter");
    }, 500);

    messageInput.value = "";
    await db.collection("messages").add(messageData);
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message: " + error.message);
  }
}

function formatMessageTime(timestamp) {
  if (!timestamp) return "";

  // Convert Firestore timestamp to Date if needed
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  // Format as HH:MM AM/PM
  return date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
    .toLowerCase();
}

// Add this new function

function displayMessage(message, isNewMessage = true) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const isCurrentUser = message.senderId === currentUser.uid;
  if (isCurrentUser) {
    messageDiv.classList.add("sent");
  }

  if (message.messageBg) {
    messageDiv.style.backgroundColor = message.messageBg;
  }

  const messageDate = message.timestamp?.toDate
    ? message.timestamp.toDate()
    : new Date(message.timestamp);
  const timeString = messageDate
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
    .toLowerCase();
  const dateString = messageDate.toLocaleDateString([], {
    month: "numeric",
    day: "numeric",
    year: "numeric"
  });

  let avatarSrc;
  if (isCurrentUser) {
    avatarSrc =
      document.getElementById("pfpImage")?.src ||
      getDefaultAvatar(message.senderUsername);
  } else {
    const sender = users.find((u) => u.id === message.senderId);
    avatarSrc =
      sender?.profilePhoto || getDefaultAvatar(message.senderUsername);
  }

  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");

  // Check if user is Brune
  const isBrune = message.senderUsername === "Brune";
  const devTag = isBrune ? '<span class="devtag">⚡DEV</span>' : "";

  // Check if user is group admin
  let groupAdminTag = "";
  if (currentChat.type === "group") {
    db.collection("groups")
      .doc(currentChat.id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const groupData = doc.data();
          const admins = groupData.admins || [groupData.createdBy];

          if (admins.includes(message.senderId)) {
            const adminTagElement = messageDiv.querySelector(".admin-tag");
            if (adminTagElement) {
              adminTagElement.innerHTML =
                '<span class="devtag" title="GROUP ADMIN: ' +
                message.senderUsername +
                '">👑 GA</span>';
            }
          }
        }
      });
  }

  if (message.isHTML) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = message.text;

    // Handle YouTube embeds
    const iframes = tempDiv.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      messageContent.appendChild(iframe.cloneNode(true));
    });

    // Handle images
    const images = tempDiv.querySelectorAll("img:not([src*='youtube.com'])");
    images.forEach((img) => {
      const newImg = document.createElement("img");
      newImg.src = img.src;
      newImg.classList.add("message-img");
      newImg.style.maxWidth = "500px";
      newImg.style.maxHeight = "400px";
      messageContent.appendChild(newImg);
    });

    // Handle text nodes
    const textNodes = Array.from(tempDiv.childNodes).filter(
      (node) =>
        (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "") ||
        (node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName !== "IMG" &&
          node.nodeName !== "IFRAME")
    );

    textNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        messageContent.appendChild(document.createTextNode(node.textContent));
      } else {
        messageContent.appendChild(node.cloneNode(true));
      }
    });
  } else {
    messageContent.textContent = message.text;
  }

  messageDiv.innerHTML = `
    <div class="message-info">
      <img src="${escapeHtml(avatarSrc)}"
           onerror="this.src='${escapeHtml(
             getDefaultAvatar(message.senderUsername)
           )}'">
      <h1>${escapeHtml(
        message.senderUsername || "Unknown"
      )} ${devTag} <span class="admin-tag">${groupAdminTag}</span></h1>
    </div>
    <span class="message-time">${timeString} | ${dateString}</span>
  `;

  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);

  if (isNewMessage && autoScrollEnabled) {
    scrollToBottom();
  }
  return messageDiv;
}

function scrollToBottom(force = false) {
  const container = messagesContainer;
  console.log(
    "scrollToBottom called!",
    "force:",
    force,
    "autoScrollEnabled:",
    autoScrollEnabled
  );

  if (force || autoScrollEnabled) {
    container.scrollTop = container.scrollHeight;
    console.log("Scrolled to bottom!");
  }
}

// Setup scroll event listener to detect user scrolling
messagesContainer.addEventListener("scroll", () => {
  const container = messagesContainer;
  const threshold = 100; // pixels from bottom

  // If user scrolls up, disable auto-scroll
  autoScrollEnabled =
    container.scrollHeight - container.clientHeight - container.scrollTop <=
    threshold;
});

function getDefaultAvatar(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    username?.substring(0, 1) || "U"
  )}&background=8065aa&color=eaeaea`;
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMessageTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
    .toLowerCase()
    .replace(" ", "");
}

function updateGlobalChatLastMessage(message) {
  const globalChat = document.querySelector(
    '.personChat[data-chat-id="global"] p'
  );
  if (globalChat) {
    globalChat.textContent =
      message.length > 20 ? message.substring(0, 20) + "..." : message;
  }
}
function updatePrivateChatLastMessage(userId, message) {
  const privateChat = document.querySelector(
    `.personChat[data-user-id="${userId}"] p`
  );
  if (privateChat) {
    privateChat.textContent =
      message.length > 20 ? message.substring(0, 20) + "..." : message;
  }
}

function updateGroupChatLastMessage(groupId, message) {
  const groupChat = document.querySelector(
    `.groupChat[data-group-id="${groupId}"] p`
  );
  if (groupChat) {
    groupChat.textContent =
      message.length > 20 ? message.substring(0, 20) + "..." : message;
  }
}

function ChatExpansion() {
  const chatAreaMain = document.querySelector(".chatArea");
  const searchSystem = document.querySelector(".chat-search");
  const icon = document.querySelector("#chatBut");
  const side = document.querySelector("#chats");

  const isExpanded = chatAreaMain.style.width === "calc(100% - 185px)";

  chatAreaMain.style.width = isExpanded
    ? "calc(100% - 550px)"
    : "calc(100% - 185px)";
  searchSystem.style.left = isExpanded ? "165px" : "-365px";
  searchSystem.style.opacity = isExpanded ? "1" : "0";

  searchSystem.style.visibility = isExpanded ? "visible" : "hidden";

  if (isExpanded) {
    icon.classList.remove("clickedIcon");
    icon.style.opacity = "0.9";
    side.style.width = "10px";
  } else {
    icon.classList.add("clickedIcon");
    icon.style.opacity = "1";
    side.style.width = "175px";
  }
}
// settings panel
function toggleSettings() {
  const chatMain = document.querySelector("#chatersy");
  const setMain = document.querySelector("#notchatersy");
  const icon = document.querySelector("#setBut");
  const side = document.querySelector("#settings");

  // Check if settings are currently expanded (sidebar width check)
  const isExpanded = side.style.width === "175px" || side.style.width === "";

  if (
    chatMain.style.visibility === "visible" ||
    chatMain.style.visibility === ""
  ) {
    // If chat is visible, show settings and collapse sidebar
    setMain.style.top = "0";
    chatMain.style.opacity = "0";

    setTimeout(() => {
      chatMain.style.visibility = "hidden";
      chatMain.style.opacity = "0";
    }, 300);

    // Icon and sidebar behavior
    icon.classList.add("clickedIcon");
    icon.style.opacity = "1";
    side.style.width = "175px";
  } else {
    // If chat is hidden, hide settings and expand sidebar
    setMain.style.top = "-105vh";
    chatMain.style.opacity = "1";
    chatMain.style.visibility = "visible";

    // Icon and sidebar behavior
    icon.classList.remove("clickedIcon");
    icon.style.opacity = "0.9";
    side.style.width = "10px";
  }
}

// settings tabs etc
function resetActiveTabs() {
  const tabs = document.querySelectorAll(".settings-selection");
  tabs.forEach((tab) => {
    tab.classList.remove("active-tab");
  });
}

function togglePanel(panelClass, tabId) {
  document
    .querySelectorAll(
      ".settings-display-one, .settings-display-two, .settings-display-three"
    )
    .forEach((panel) => {
      panel.classList.add("add-hidden");
    });

  document.querySelector(`.${panelClass}`).classList.remove("add-hidden");

  resetActiveTabs();
  document.getElementById(tabId).classList.add("active-tab");
}

function toggleProfileDisplay() {
  togglePanel("settings-display-one", "settings-profile");
}

function toggleStyleDisplay() {
  togglePanel("settings-display-two", "settings-style");
}

function toggleSecurityDisplay() {
  togglePanel("settings-display-three", "settings-security");
}
// Profile Settings Functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize profile settings when user is logged in
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadProfileSettings();
    }
  });

  // Update profile photo
  document
    .getElementById("update-photo-btn")
    ?.addEventListener("click", firstclickProfile);
  document
    .getElementById("remove-photo-btn")
    ?.addEventListener("click", removeProfilePhoto);

  // Name edit functionality
  document
    .getElementById("save-name-btn")
    ?.addEventListener("click", saveDisplayName);

  // Password toggle
  document
    .getElementById("toggle-password-btn")
    ?.addEventListener("click", togglePasswordVisibility);

  // Email toggle
  document
    .getElementById("toggle-email-btn")
    ?.addEventListener("click", toggleEmailVisibility);

  // Save all changes
  document
    .getElementById("save-all-btn")
    ?.addEventListener("click", saveAllProfileChanges);
});

// Load current user's profile settings
// Load current user's profile settings
function loadProfileSettings() {
  if (!currentUser) return;

  db.collection("users")
    .doc(currentUser.uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();

        // Profile photo
        if (userData.profilePhoto) {
          setProfilePhoto(userData.profilePhoto);
        }

        // Display name
        if (userData.username) {
          document.getElementById("profile-name").value = userData.username;
        }

        // Email
        if (currentUser.email) {
          document.getElementById("profile-email").value = currentUser.email;
        }

        // Bio
        if (userData.bio) {
          document.getElementById("profile-bio").value = userData.bio;
        }

        // Theme color
        if (userData.themeColor) {
          document.documentElement.style.setProperty(
            "--message-bg",
            userData.themeColor
          );
          // Update hex input if it's a custom color
          if (!isDefaultThemeColor(userData.themeColor)) {
            document.getElementById("profile-hex").value = userData.themeColor;
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error loading profile settings:", error);
    });
}

// Helper function to check if color is one of the default theme colors
function isDefaultThemeColor(color) {
  const defaultColors = [
    "#646670", // default
    "#ff6b6b", // red
    "#6765fe", // blue
    "#9b51e0", // purple
    "#ffd166", // yellow
    "#9d8eb7" // pink
  ];
  return defaultColors.includes(color);
}

// Set profile photo in both settings and chat UI
function setProfilePhoto(url) {
  document.getElementById("profile-photo-img").src = url;
  document.getElementById("pfpImage").src = url;
}

// Update profile photo from URL input

function updateProfilePhoto() {
  const photoUrl = document.getElementById("profile-photo-url").value.trim();

  if (!photoUrl) {
    alert("Please enter a valid image URL");
    return;
  }

  // Validate URL format
  try {
    new URL(photoUrl);
  } catch (e) {
    alert("Please enter a valid URL");
    return;
  }

  // Test if image loads
  const img = new Image();
  img.onload = () => {
    setProfilePhoto(photoUrl);
    document.getElementById("profile-photo-url").value = "";

    // Save to Firestore
    db.collection("users")
      .doc(currentUser.uid)
      .update({
        profilePhoto: photoUrl
      })
      .then(() => {
        console.log("Profile photo updated successfully");
      })
      .catch((error) => {
        console.error("Error updating profile photo:", error);
        alert("Failed to update profile photo");
      });
  };

  img.onerror = () => {
    alert("The URL does not point to a valid image");
  };

  img.src = photoUrl;
}
function firstclickProfile() {
  const ehePhoto = document.querySelector(".change-btn"); // Added dot for class selector
  const urlInputContaner = document.querySelector(".url-input-container"); // Added dot for class selector

  // Check if container is hidden (better to check class or style)
  if (window.getComputedStyle(urlInputContaner).display === "none") {
    urlInputContaner.style.display = "block";
  } else {
    updateProfilePhoto();
  }
}

// Remove profile photo (revert to default)
function removeProfilePhoto() {
  const defaultPhoto =
    "https://www.kindpng.com/picc/m/722-7221920_placeholder-profile-image-placeholder-png-transparent-png.png";

  setProfilePhoto(defaultPhoto);

  db.collection("users")
    .doc(currentUser.uid)
    .update({
      profilePhoto: firebase.firestore.FieldValue.delete()
    })
    .then(() => {
      console.log("Profile photo removed successfully");
    })
    .catch((error) => {
      console.error("Error removing profile photo:", error);
      alert("Failed to remove profile photo");
    });
}

// Save display name changes
function saveDisplayName() {
  const newName = document.getElementById("profile-name").value.trim();

  if (!newName) {
    alert("Please enter a display name");
    return;
  }

  if (newName.length > 30) {
    alert("Display name must be less than 30 characters");
    return;
  }

  db.collection("users")
    .doc(currentUser.uid)
    .update({
      username: newName
    })
    .then(() => {
      console.log("Display name updated successfully");
      pfpUserName.textContent = newName;
      updateMessagesUsername(newName);
    })
    .catch((error) => {
      console.error("Error updating display name:", error);
      alert("Failed to update display name");
    });
}

// Update username in all messages
function updateMessagesUsername(newName) {
  // Update global messages
  db.collection("messages")
    .where("senderId", "==", currentUser.uid)
    .where("chatType", "==", "global")
    .get()
    .then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { senderUsername: newName });
      });
      return batch.commit();
    });

  // Update private messages
  db.collection("messages")
    .where("senderId", "==", currentUser.uid)
    .where("chatType", "==", "private")
    .get()
    .then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { senderUsername: newName });
      });
      return batch.commit();
    });
}

// Toggle password visibility
function togglePasswordVisibility() {
  const passwordField = document.getElementById("profile-password");
  if (passwordField.type === "password") {
    passwordField.type = "text";
    // For security, don't show actual password - just indicate it's hidden
    passwordField.value = "••••••••";
  } else {
    passwordField.type = "password";
  }
}

// Toggle email visibility
function toggleEmailVisibility() {
  const emailField = document.getElementById("profile-email");
  if (emailField.readOnly) {
    emailField.readOnly = false;
    emailField.focus();
  } else {
    emailField.readOnly = true;
  }
}

// Save all profile changes
function saveAllProfileChanges() {
  const updates = {};
  let hasChanges = false;

  // Check for bio changes
  const newBio = document.getElementById("profile-bio").value.trim();
  if (newBio !== document.getElementById("profile-bio").defaultValue) {
    updates.bio = newBio;
    hasChanges = true;
  }

  // Check for email changes
  const newEmail = document.getElementById("profile-email").value.trim();
  if (newEmail !== currentUser.email) {
    // Email update requires reauthentication
    updateEmail(newEmail);
    return; // Exit early since email update is async
  }

  // Save other changes if any
  if (hasChanges) {
    db.collection("users")
      .doc(currentUser.uid)
      .update(updates)
      .then(() => {
        alert("Profile updated successfully");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        alert("Failed to update profile");
      });
  } else {
    alert("No changes detected");
  }
}

// Update email with reauthentication
function updateEmail(newEmail) {
  if (!newEmail || !validateEmail(newEmail)) {
    alert("Please enter a valid email address");
    return;
  }

  const password = prompt(
    "Please enter your password to confirm email change:"
  );
  if (!password) return;

  const credential = firebase.auth.EmailAuthProvider.credential(
    currentUser.email,
    password
  );

  // Reauthenticate user
  currentUser
    .reauthenticateWithCredential(credential)
    .then(() => {
      // Update email
      return currentUser.updateEmail(newEmail);
    })
    .then(() => {
      // Update Firestore
      return db.collection("users").doc(currentUser.uid).update({
        email: newEmail
      });
    })
    .then(() => {
      alert("Email updated successfully");
      document.getElementById("profile-email").value = newEmail;
    })
    .catch((error) => {
      console.error("Error updating email:", error);
      alert("Failed to update email: " + error.message);
    });
}

// Simple email validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
// deltion of account
function initiateAccountDeletion() {
  // First confirmation
  const confirm1 = confirm(
    "⚠️ WARNING: Account Deletion Afterwards ⚠️\n\nAre you sure you want to delete your account? This cannot be undone!"
  );
  if (!confirm1) return;

  // Second confirmation
  const confirm2 = confirm(
    "This will permanently delete:\n- Your profile\n- All your messages\n- All your data\n\nAre you COMPLETELY sure?"
  );
  if (!confirm2) return;

  // Third confirmation
  const confirm3 = confirm(
    "Final chance to cancel!\n\nDeleting your account will remove EVERYTHING associated with it. Continue?"
  );
  if (!confirm3) return;

  // Fourth confirmation - password verification
  const password = prompt(
    "For security, and to block trolling, please enter your password to confirm account deletion:"
  );
  if (!password) return;

  // Fifth confirmation
  const confirm5 = confirm(
    `LAST WARNING!\n\nType "DELETE" in the next prompt to confirm account deletion.`
  );
  if (!confirm5) return;

  const deleteConfirmation = prompt(
    'Type "DELETE" to permanently delete your account:'
  );
  if (deleteConfirmation !== "DELETE") {
    alert("Account deletion cancelled. Your account is safe.");
    return;
  }

  // If all confirmations passed, proceed with deletion
  deleteUserAccount(password);
}

async function deleteUserAccount(password) {
  try {
    // Reauthenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(
      currentUser.email,
      password
    );

    await currentUser.reauthenticateWithCredential(credential);

    // Show loading state
    alert("Deleting your account... This may take a moment.");

    // First delete user data from Firestore
    await db.collection("users").doc(currentUser.uid).delete();

    // Then delete the auth account
    await currentUser.delete();

    // Success message
    alert("Account successfully deleted. Goodbye!");

    // Redirect or handle post-deletion
    window.location.reload();
  } catch (error) {
    console.error("Account deletion failed:", error);

    if (error.code === "auth/wrong-password") {
      alert("Incorrect password. Account deletion cancelled.");
    } else {
      alert(`Account deletion failed: ${error.message}`);
    }
  }
}

// theme changer ( only for default themes )
// script.js
document.addEventListener("DOMContentLoaded", function () {
  // Theme configurations - now includes ALL CSS variables and SVG colors
  const themes = {
    default: {
      css: {
        "--main-bg": "#282a37",
        "--container-bg": "#343643",
        "--secondary-bg": "#2a2b3d",
        "--input-bg": "#3e404d",
        "--profile-container-bg": "#383a46",
        "--input-focus-bg": "#51535e",
        "--text-color": "#eaeaea",
        "--text-hover": "#d3b4ff",
        "--purple-accent": "#8844ff",
        "--purple-active": "#6765fe",
        "--purple-border": "#722fca",
        "--purple-hover": "#9b51e0",
        "--sidebar-bg": "rgba(170, 129, 227, 0.75)",
        "--sidebar-hover": "rgba(170, 129, 227, 0.85)",
        "--profile-bg": "rgba(171, 152, 204, 0.75)",
        "--profile-hover": "rgba(196, 182, 219, 0.75)",
        "--chat-bg": "#3e404d",
        "--chat-hover": "#4a4c5a",
        "--message-bg": "#646670",
        "--message-bg-lilbro": "#646670",
        "--online-indicator": "#66b953",
        "--white-color": "#fafafc",
        "--settings-line-bg": "#51535e",
        "--settings-hover-bg": "#73757e",
        "--settings-shadow-color": "#73757e",
        "--red-accent": "#ff4444",
        "--red-hover": "#cc0000",
        "--red-active": "#aa0000",
        "--accent-color": "#8844ff",
        "--accent-hover": "#9b51e0",
        "--accent-active": "#6765fe",
        "--border-color": "#722fca",
        "--error-color": "#ff4444",
        "--scrollbar-bg": "#eee5f9",
        "--demo-card-shadow": "rgba(0, 0, 0, 0.1)",
        "--demo-input-border": "#722fca",
        "--cacccf-color": "#cacccf",
        "--dfe0e2-color": "#dfe0e2",
        "--eaeaea01": "rgba(234, 234, 234, 0.01)",
        "--eaeaea02": "rgba(234, 234, 234, 0.02)",
        "--eaeaea03": "rgba(234, 234, 234, 0.03)",
        "--a37fdf-color": "rgba(163, 121, 223)",
        "--a37fdf-15": "rgba(163, 121, 223, 0.15)",
        "--a37fdf-25": "rgba(163, 121, 223, 0.25)",
        "--a37fdf-85": "rgba(163, 121, 223, 0.85)",
        "--312e48": "#312e48",
        "--5b5c67": "#5b5c67"
      },
      svg: {
        color: "#3e404d",
        opacity1: "0.265",
        opacity2: "0.4",
        opacity3: "0.53",
        opacity4: "1"
      }
    },
    red: {
      css: {
        "--main-bg": "#372828",
        "--container-bg": "#463434",
        "--secondary-bg": "#3d2a2a",
        "--input-bg": "#4d3e3e",
        "--profile-container-bg": "#463838",
        "--input-focus-bg": "#5e5151",
        "--text-color": "#eaeaea",
        "--text-hover": "#ffb4b4",
        "--purple-accent": "#ff4444",
        "--purple-active": "#fe6565",
        "--purple-border": "#ca2f2f",
        "--purple-hover": "#e05151",
        "--sidebar-bg": "rgba(227, 129, 129, 0.75)",
        "--sidebar-hover": "rgba(227, 129, 129, 0.85)",
        "--profile-bg": "rgba(204, 152, 152, 0.75)",
        "--profile-hover": "rgba(219, 182, 182, 0.75)",
        "--chat-bg": "#4d3e3e",
        "--chat-hover": "#5a4a4a",
        "--message-bg": "#706464",
        "--message-bg-lilbro": "#706464",
        "--online-indicator": "#66b953",
        "--white-color": "#fafafc",
        "--settings-line-bg": "#5e5151",
        "--settings-hover-bg": "#7e7373",
        "--settings-shadow-color": "#7e7373",
        "--red-accent": "#ff4444",
        "--red-hover": "#cc0000",
        "--red-active": "#aa0000",
        "--accent-color": "#ff4444",
        "--accent-hover": "#e05151",
        "--accent-active": "#fe6565",
        "--border-color": "#ca2f2f",
        "--error-color": "#ff8844",
        "--scrollbar-bg": "#f9e5e5",
        "--demo-card-shadow": "rgba(0, 0, 0, 0.1)",
        "--demo-input-border": "#ca2f2f",
        "--cacccf-color": "#ccb4b4",
        "--dfe0e2-color": "#e2d0d0",
        "--eaeaea01": "rgba(234, 234, 234, 0.01)",
        "--eaeaea02": "rgba(234, 234, 234, 0.02)",
        "--eaeaea03": "rgba(234, 234, 234, 0.03)",
        "--a37fdf-color": "rgba(223, 121, 121)",
        "--a37fdf-15": "rgba(223, 121, 121, 0.15)",
        "--a37fdf-25": "rgba(223, 121, 121, 0.25)",
        "--a37fdf-85": "rgba(223, 121, 121, 0.85)",
        "--312e48": "#482e2e",
        "--5b5c67": "#675b5b"
      },
      svg: {
        color: "#4d3e3e",
        opacity1: "0.265",
        opacity2: "0.4",
        opacity3: "0.53",
        opacity4: "1"
      }
    },
    purple: {
      css: {
        "--profile-container-bg": "#4237588a",
        "--main-bg": "#2a2837",
        "--container-bg": "#3e3464",
        "--secondary-bg": "#2d2a3d",
        "--input-bg": "#4d3e6e",
        "--input-focus-bg": "#5e5173",
        "--text-color": "#eaeaea",
        "--text-hover": "#d3b4ff",
        "--purple-accent": "#a744ff",
        "--purple-active": "#9565fe",
        "--purple-border": "#7a2fca",
        "--purple-hover": "#b851e0",
        "--sidebar-bg": "rgba(170, 129, 227, 0.75)",
        "--sidebar-hover": "rgba(170, 129, 227, 0.85)",
        "--profile-bg": "rgba(171, 152, 204, 0.75)",
        "--profile-hover": "rgba(196, 182, 219, 0.75)",
        "--chat-bg": "#4d3e6e",
        "--chat-hover": "#5a4a7a",
        "--message-bg": "#70647a",
        "--message-bg-lilbro": "#70647a",
        "--online-indicator": "#66b953",
        "--white-color": "#fafafc",
        "--settings-line-bg": "#5e5173",
        "--settings-hover-bg": "#7e7385",
        "--settings-shadow-color": "#7e7385",
        "--red-accent": "#ff44aa",
        "--red-hover": "#cc0088",
        "--red-active": "#aa0077",
        "--accent-color": "#a744ff",
        "--accent-hover": "#b851e0",
        "--accent-active": "#9565fe",
        "--border-color": "#7a2fca",
        "--error-color": "#ff44aa",
        "--scrollbar-bg": "#eee5f9",
        "--demo-card-shadow": "rgba(0, 0, 0, 0.1)",
        "--demo-input-border": "#7a2fca",
        "--cacccf-color": "#cacccf",
        "--dfe0e2-color": "#dfe0e2",
        "--eaeaea01": "rgba(234, 234, 234, 0.01)",
        "--eaeaea02": "rgba(234, 234, 234, 0.02)",
        "--eaeaea03": "rgba(234, 234, 234, 0.03)",
        "--a37fdf-color": "rgba(163, 121, 223)",
        "--a37fdf-15": "rgba(163, 121, 223, 0.15)",
        "--a37fdf-25": "rgba(163, 121, 223, 0.25)",
        "--a37fdf-85": "rgba(163, 121, 223, 0.85)",
        "--312e48": "#2e2a48",
        "--5b5c67": "#5b5a67"
      },
      svg: {
        color: "#4d3e6e",
        opacity1: "0.265",
        opacity2: "0.4",
        opacity3: "0.53",
        opacity4: "1"
      }
    }
  };

  // Get DOM elements
  const defaultTheme = document.querySelector(".default-theme");
  const redTheme = document.querySelector(".red-theme");
  const purpleTheme = document.querySelector(".purple-theme");
  const revertButton = document.getElementById("revertButton");
  const themeElements = [defaultTheme, redTheme, purpleTheme];
  const svgWaves = document.querySelectorAll("svg#svg");
  const aiThemeInput = document.getElementById("aiThemeInput");
  const aiThemeInputCont = document.getElementById("aiThemeInputCont");
  const humanThemeInput = document.getElementById("humanThemeInput");
  const saveManualThemeButton = document.createElement("button");
  saveManualThemeButton.textContent = "Save Manual Theme";
  saveManualThemeButton.className = "save-manual-theme-btn";

  // Insert the save button after the manual theme inputs
  const manualThemeContainer = document.querySelector(
    ".theme-variables-container"
  );
  manualThemeContainer.parentNode.insertBefore(
    saveManualThemeButton,
    manualThemeContainer.nextSibling.nextSibling
  );

  // Create container for custom themes (both AI and manual)
  const customThemeContainer = document.createElement("div");
  customThemeContainer.id = "customThemeFromAI";
  customThemeContainer.className = "custom-themes-container";
  document
    .querySelector(".theme-selector-container")
    .appendChild(customThemeContainer);

  // Function to save themes to localStorage
  function saveCustomThemes(themes) {
    localStorage.setItem("customThemes", JSON.stringify(themes));
  }

  // Function to load themes from localStorage
  function loadCustomThemes() {
    const savedThemes = localStorage.getItem("customThemes");
    return savedThemes ? JSON.parse(savedThemes) : [];
  }

  // Function to create a theme div
  function createThemeDiv(themeName, themeData) {
    const themeDiv = document.createElement("div");
    themeDiv.className = "theme-option";
    themeDiv.innerHTML = `
      <div class="theme-preview" style="background: ${themeData.css["--accent-color"]}"></div>
      <span>${themeName}</span>
      <button class="delete-theme-btn">×</button>
    `;

    themeDiv.addEventListener("click", (e) => {
      // Don't apply theme if delete button was clicked
      if (e.target.classList.contains("delete-theme-btn")) return;

      applyTheme(themeData, themeDiv);

      // Highlight the selected custom theme
      document
        .querySelectorAll("#customThemeFromAI .theme-option")
        .forEach((el) => {
          el.classList.remove("activegenius");
        });
      themeDiv.classList.add("activegenius");
    });

    // Add delete button functionality
    const deleteBtn = themeDiv.querySelector(".delete-theme-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCustomTheme(themeName);
    });

    return themeDiv;
  }

  // Function to delete a custom theme
  function deleteCustomTheme(themeName) {
    const customThemes = loadCustomThemes();
    const updatedThemes = customThemes.filter(
      (theme) => theme.name !== themeName
    );
    saveCustomThemes(updatedThemes);
    displayCustomThemes();
  }

  // Function to display custom themes
  function displayCustomThemes() {
    const customThemes = loadCustomThemes();
    customThemeContainer.innerHTML = "";

    if (customThemes.length === 0) {
      const noThemesMsg = document.createElement("div");
      noThemesMsg.className = "no-themes-message";
      noThemesMsg.textContent =
        "No custom themes yet. Create one manually or ask the AI to generate one!";
      customThemeContainer.appendChild(noThemesMsg);
      return;
    }

    // Add title
    const title = document.createElement("h3");
    title.className = "custom-themes-title";
    title.textContent = "Custom Themes";
    customThemeContainer.appendChild(title);

    // Add themes grid
    const themesGrid = document.createElement("div");
    themesGrid.className = "themes-grid";
    customThemes.forEach((theme) => {
      const themeDiv = createThemeDiv(theme.name, theme.data);
      themesGrid.appendChild(themeDiv);
    });
    customThemeContainer.appendChild(themesGrid);
  }

  // Function to generate CSS variables from theme data
  function generateCSSVariables(themeData) {
    let cssText = ":root {\n";
    for (const [property, value] of Object.entries(themeData.css)) {
      cssText += `  ${property}: ${value};\n`;
    }
    cssText += "}";
    return cssText;
  }

  async function generateAITheme(prompt) {
    try {
      const baseTheme = themes.default.css;
      const response = await fetch(API_URL_AI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Create a CSS theme configuration based on: ${prompt}. 
              Use this base theme configuration as reference (modify these colors to match the requested theme):
              ${JSON.stringify(baseTheme, null, 2)}
              
              Return ONLY a JSON object in this exact format (include ALL these properties):
              {
                "name": "Theme name based on the prompt",
                "data": {
                  "css": {
                    // Include ALL the CSS variables from the base theme
                    // but modify them to match the requested theme style
                    // (e.g., for a yellow theme, change purples to yellows)
                  },
                  "svg": {
                    "color": "#hexcolor",  // should match the new theme's input-bg
                    "opacity1": "0.265",
                    "opacity2": "0.4",
                    "opacity3": "0.53",
                    "opacity4": "1"
                  }
                }
              }`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const themeText = data.candidates[0].content.parts[0].text;

      // Try to extract JSON from the response
      try {
        const jsonStart = themeText.indexOf("{");
        const jsonEnd = themeText.lastIndexOf("}") + 1;
        const jsonStr = themeText.slice(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error("Error parsing AI response:", e);
        return null;
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return null;
    }
  }

  // Function to add a message to the chat
  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `messagesAIThemecontainer ${
      isUser ? "user-message" : "ai-message"
    }`;
    messageDiv.textContent = content;
    aiThemeInputCont.appendChild(messageDiv);
    aiThemeInputCont.scrollTop = aiThemeInputCont.scrollHeight;
  }

  // Update SVG wave colors
  function updateSvgColors(theme) {
    const chatArea = document.querySelector(".chatArea");
    if (!chatArea) return;
    chatArea.style.background = "var(--chat-bg)";
    chatArea.style.backgroundImage = "none";

    svgWaves.forEach((svg) => {
      const paths = svg.querySelectorAll("path");
      paths[0].setAttribute("fill", theme.svg.color);
      paths[0].setAttribute("fill-opacity", theme.svg.opacity1);
      paths[1].setAttribute("fill", theme.svg.color);
      paths[1].setAttribute("fill-opacity", theme.svg.opacity2);
      paths[2].setAttribute("fill", theme.svg.color);
      paths[2].setAttribute("fill-opacity", theme.svg.opacity3);
      paths[3].setAttribute("fill", theme.svg.color);
      paths[3].setAttribute("fill-opacity", theme.svg.opacity4);
    });
  }

  // Apply theme function
  function applyTheme(theme, element) {
    const root = document.documentElement;

    // Apply CSS variables
    for (const [property, value] of Object.entries(theme.css)) {
      root.style.setProperty(property, value);
    }

    // Update SVG colors
    updateSvgColors(theme);

    // Remove activegenius class from all theme elements
    themeElements.forEach((el) => el.classList.remove("activegenius"));
    document
      .querySelectorAll("#customThemeFromAI .theme-option")
      .forEach((el) => {
        el.classList.remove("activegenius");
      });

    // Add activegenius class to the selected element if it exists
    if (element) {
      element.classList.add("activegenius");
    }
  }

  // Function to create a theme from manual inputs
  function createThemeFromManualInputs() {
    const themeName = prompt("Enter a name for your theme:");
    if (!themeName) return;

    const themeData = {
      css: {
        "--main-bg": document.getElementById("main").value || "#282a37",
        "--container-bg": document.getElementById("cont").value || "#343643",
        "--secondary-bg": document.getElementById("seco").value || "#2a2b3d",
        "--input-bg": document.getElementById("inpu").value || "#3e404d",
        "--profile-container-bg":
          document.getElementById("prof").value || "#383a46",
        "--input-focus-bg": document.getElementById("inpf").value || "#51535e",
        "--text-color": document.getElementById("text").value || "#eaeaea",
        "--text-hover": document.getElementById("texh").value || "#d3b4ff",
        "--purple-accent": document.getElementById("purp").value || "#8844ff",
        "--purple-active": document.getElementById("pura").value || "#6765fe",
        "--purple-border": document.getElementById("purb").value || "#722fca",
        "--purple-hover": document.getElementById("purh").value || "#9b51e0",
        "--sidebar-bg":
          document.getElementById("side").value || "rgba(170, 129, 227, 0.75)",
        "--sidebar-hover":
          document.getElementById("sidh").value || "rgba(170, 129, 227, 0.85)",
        "--profile-bg":
          document.getElementById("prog").value || "rgba(171, 152, 204, 0.75)",
        "--profile-hover":
          document.getElementById("proh").value || "rgba(196, 182, 219, 0.75)",
        "--chat-bg": document.getElementById("chat").value || "#3e404d",
        "--chat-hover": document.getElementById("chah").value || "#4a4c5a",
        "--message-bg": document.getElementById("mess").value || "#646670",
        "--message-bg-lilbro":
          document.getElementById("mesl").value || "#646670",
        "--online-indicator":
          document.getElementById("onli").value || "#66b953",
        "--white-color": document.getElementById("whit").value || "#fafafc",
        "--settings-line-bg":
          document.getElementById("sett").value || "#51535e",
        "--settings-hover-bg":
          document.getElementById("seth").value || "#73757e",
        "--settings-shadow-color":
          document.getElementById("sets").value || "#73757e",
        "--red-accent": document.getElementById("reda").value || "#ff4444",
        "--red-hover": document.getElementById("redh").value || "#cc0000",
        "--red-active": document.getElementById("redc").value || "#aa0000",
        "--accent-color": document.getElementById("acce").value || "#8844ff",
        "--accent-hover": document.getElementById("acch").value || "#9b51e0",
        "--accent-active": document.getElementById("acca").value || "#6765fe",
        "--border-color": document.getElementById("bord").value || "#722fca",
        "--error-color": document.getElementById("erro").value || "#ff4444",
        "--scrollbar-bg": document.getElementById("scro").value || "#eee5f9",
        "--demo-card-shadow":
          document.getElementById("demo").value || "rgba(0, 0, 0, 0.1)",
        "--demo-input-border":
          document.getElementById("demd").value || "#722fca",
        "--cacccf-color": document.getElementById("cacc").value || "#cacccf",
        "--dfe0e2-color": document.getElementById("dfe0").value || "#dfe0e2",
        "--eaeaea01":
          document.getElementById("eaea").value || "rgba(234, 234, 234, 0.01)",
        "--eaeaea02":
          document.getElementById("eae2").value || "rgba(234, 234, 234, 0.02)",
        "--eaeaea03":
          document.getElementById("eae3").value || "rgba(234, 234, 234, 0.03)",
        "--a37fdf-color":
          document.getElementById("a37f").value || "rgba(163, 121, 223)",
        "--a37fdf-15":
          document.getElementById("a371").value || "rgba(163, 121, 223, 0.15)",
        "--a37fdf-25":
          document.getElementById("a372").value || "rgba(163, 121, 223, 0.25)",
        "--a37fdf-85":
          document.getElementById("a378").value || "rgba(163, 121, 223, 0.85)",
        "--312e48": document.getElementById("312e").value || "#312e48",
        "--5b5c67": document.getElementById("5b5c").value || "#5b5c67"
      },
      svg: {
        color: document.getElementById("inpu").value || "#3e404d",
        opacity1: "0.265",
        opacity2: "0.4",
        opacity3: "0.53",
        opacity4: "1"
      }
    };

    // Save the new theme
    const customThemes = loadCustomThemes();
    customThemes.push({
      name: themeName,
      data: themeData
    });
    saveCustomThemes(customThemes);

    // Display the new theme
    displayCustomThemes();

    // Create a style element for the new theme
    const styleId = `theme-${themeName.toLowerCase().replace(/\s+/g, "-")}`;
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = generateCSSVariables(themeData);

    // Apply the new theme
    applyTheme(themeData);
  }

  // Function to parse CSS variables from text input
  function parseCSSVariables(cssText) {
    const variables = {};
    const rootMatch = cssText.match(/:root\s*{([^}]*)}/);

    if (rootMatch) {
      const content = rootMatch[1];
      const varMatches = content.matchAll(/--([^:]+):\s*([^;]+);?/g);

      for (const match of varMatches) {
        variables[`--${match[1].trim()}`] = match[2].trim();
      }
    }

    return variables;
  }

  // Function to create a theme from CSS text input
  function createThemeFromCSSText() {
    const cssText = humanThemeInput.value.trim();
    if (!cssText) return;

    const themeName = prompt("Enter a name for your theme:");
    if (!themeName) return;

    const variables = parseCSSVariables(cssText);
    if (Object.keys(variables).length === 0) {
      alert(
        "No valid CSS variables found in the input. Please check your input and try again."
      );
      return;
    }

    const themeData = {
      css: variables,
      svg: {
        color: variables["--input-bg"] || "#3e404d",
        opacity1: "0.265",
        opacity2: "0.4",
        opacity3: "0.53",
        opacity4: "1"
      }
    };

    // Save the new theme
    const customThemes = loadCustomThemes();
    customThemes.push({
      name: themeName,
      data: themeData
    });
    saveCustomThemes(customThemes);

    // Display the new theme
    displayCustomThemes();

    // Create a style element for the new theme
    const styleId = `theme-${themeName.toLowerCase().replace(/\s+/g, "-")}`;
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = generateCSSVariables(themeData);

    // Apply the new theme
    applyTheme(themeData);
  }

  // Event listeners
  saveManualThemeButton.addEventListener("click", createThemeFromManualInputs);
  humanThemeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      createThemeFromCSSText();
    }
  });

  aiThemeInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && aiThemeInput.value.trim()) {
      const prompt = aiThemeInput.value.trim();
      addMessage(prompt, true);
      aiThemeInput.value = "";

      addMessage("Generating your theme... Please wait!");

      const aiTheme = await generateAITheme(prompt);

      if (aiTheme) {
        // Save the new theme
        const customThemes = loadCustomThemes();
        customThemes.push({
          name: aiTheme.name,
          data: aiTheme.data
        });
        saveCustomThemes(customThemes);

        // Display the new theme
        displayCustomThemes();

        // Create a style element for the new theme
        const styleId = `theme-${aiTheme.name
          .toLowerCase()
          .replace(/\s+/g, "-")}`;
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        styleElement.textContent = generateCSSVariables(aiTheme.data);

        addMessage(
          `Your "${aiTheme.name}" theme has been created and saved! Click on it to apply.`
        );
      } else {
        addMessage(
          "Sorry, I couldn't generate a theme. Please try a different description."
        );
      }
    }
  });

  // Existing event listeners for theme selection
  defaultTheme.addEventListener("click", () =>
    applyTheme(themes.default, defaultTheme)
  );
  redTheme.addEventListener("click", () => applyTheme(themes.red, redTheme));
  purpleTheme.addEventListener("click", () =>
    applyTheme(themes.purple, purpleTheme)
  );
  revertButton.addEventListener("click", () => {
    applyTheme(themes.default, defaultTheme);
  });

  // Initialize with default theme and display any saved custom themes
  applyTheme(themes.default, defaultTheme);
  displayCustomThemes();
});

// profile stylething changes
document.querySelectorAll(".styleThing").forEach((div) => {
  div.addEventListener("click", async function () {
    // Remove 'activegenius' class from all styleThing divs
    document.querySelectorAll(".styleThing").forEach((el) => {
      el.classList.remove("activegenius");
    });

    // Add 'activegenius' class to clicked div
    this.classList.add("activegenius");

    // Change --message-bg based on the clicked theme
    const root = document.documentElement;
    let messageBg;

    if (this.classList.contains("default-style")) {
      messageBg = "#646670";
      setDefaultTheme();
    } else if (this.classList.contains("red-style")) {
      messageBg = "#ff6b6b";
      root.style.setProperty("--message-bg", messageBg);
    } else if (this.classList.contains("blue-style")) {
      messageBg = "#6765fe";
      root.style.setProperty("--message-bg", messageBg);
    } else if (this.classList.contains("purple-style")) {
      messageBg = "#9b51e0";
      root.style.setProperty("--message-bg", messageBg);
    } else if (this.classList.contains("yellow-style")) {
      messageBg = "#ffd166";
      root.style.setProperty("--message-bg", messageBg);
    } else if (this.classList.contains("pink-style")) {
      messageBg = "#9d8eb7";
      root.style.setProperty("--message-bg", messageBg);
    }

    // Save the theme color to user's profile
    if (currentUser && messageBg) {
      try {
        await db.collection("users").doc(currentUser.uid).update({
          themeColor: messageBg
        });
      } catch (error) {
        console.error("Error saving theme color:", error);
      }
    }
  });
});

// Function to set default theme
// Function to set default theme
async function setDefaultTheme() {
  const root = document.documentElement;
  const defaultColor = "#646670";
  root.style.setProperty("--message-bg", defaultColor);

  // Clear custom hex input
  document.getElementById("profile-hex").value = "";

  // Set active state
  document.querySelector(".default-style").classList.add("activegenius");
  document.querySelectorAll(".styleThing").forEach((el) => {
    if (!el.classList.contains("default-style")) {
      el.classList.remove("activegenius");
    }
  });

  // Save default color to user's profile
  if (currentUser) {
    try {
      await db.collection("users").doc(currentUser.uid).update({
        themeColor: defaultColor
      });

      // Update all personChat elements with the default theme
      updatePersonChatThemes(defaultColor);
    } catch (error) {
      console.error("Error saving default theme:", error);
    }
  }
}

// Revert button functionality
document
  .getElementById("REVERTtoNORMAL")
  .addEventListener("click", setDefaultTheme);
// Function to apply custom theme from hex input
async function applyCustomTheme() {
  const hexInput = document.getElementById("profile-hex").value.trim();
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  if (!hexRegex.test(hexInput)) {
    alert("Please enter a valid hex color code (e.g. #61dafb)");
    return;
  }

  // Apply the custom color
  const root = document.documentElement;
  root.style.setProperty("--message-bg", hexInput);

  // Update active state - remove from all styleThing divs
  document.querySelectorAll(".styleThing").forEach((el) => {
    el.classList.remove("activegenius");
  });

  // Save the theme color to user's profile
  if (currentUser) {
    try {
      await db.collection("users").doc(currentUser.uid).update({
        themeColor: hexInput
      });

      // Update all personChat elements with the new theme
      updatePersonChatThemes(hexInput);
    } catch (error) {
      console.error("Error saving custom theme color:", error);
    }
  }
}

// Function to randomize hex color
function randomizeHexColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  document.getElementById("profile-hex").value = color;
  applyCustomTheme();
}

// Function to update all personChat elements with new theme
function updatePersonChatThemes(hexColor) {
  const personChats = document.querySelectorAll(".personChat");

  personChats.forEach((chat) => {
    if (chat.dataset.userId === currentUser.uid) {
      chat.style.backgroundColor = hexColor;
      chat.style.backgroundImage = `linear-gradient(135deg, ${hexColor}, ${adjustColor(
        hexColor,
        -20
      )})`;
      chat.style.borderLeft = `3px solid ${adjustColor(hexColor, -30)}`;
    }
  });
}
function dont() {
  toggleSettings();
  toggleProfileDisplay();
}
async function createNewGroup() {
  if (!currentUser) {
    alert("You must be logged in to create a group");
    return;
  }

  // Ask for group name
  const groupName = prompt("Enter group name (max 12 characters):");
  if (!groupName || groupName.length > 12) {
    alert("Invalid group name. Must be 1-12 characters.");
    return;
  }

  // Ask for members
  const membersInput = prompt(
    "Enter usernames of members to add (separated by commas, max 9 members):\n\nExample: Brune, John, Sam"
  );
  if (!membersInput) return;

  // Process member list
  const memberUsernames = membersInput
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  if (memberUsernames.length === 0) {
    alert("Please enter at least one member.");
    return;
  }

  if (memberUsernames.length > 9) {
    alert("Maximum 9 members allowed (10 including you).");
    return;
  }

  try {
    // Find user IDs for the usernames
    const memberPromises = memberUsernames.map(async (username) => {
      const userQuery = await db
        .collection("users")
        .where("username", "==", username)
        .limit(1)
        .get();

      if (userQuery.empty) {
        throw new Error(`User '${username}' not found`);
      }

      return userQuery.docs[0].id;
    });

    const members = await Promise.all(memberPromises);

    // Add current user to members
    const allMembers = [...members, currentUser.uid];

    // Create group in Firestore with batch write for better error handling
    const batch = db.batch();
    const groupRef = db.collection("groups").doc();

    batch.set(groupRef, {
      name: groupName,
      createdBy: currentUser.uid,
      creatorUsername: pfpUserName.textContent,
      members: allMembers,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Create an initial "group created" message
    const messageRef = db.collection("messages").doc();
    batch.set(messageRef, {
      text: `Group '${groupName}' was created by ${pfpUserName.textContent}`,
      senderId: currentUser.uid,
      senderUsername: pfpUserName.textContent,
      chatType: "group",
      chatId: groupRef.id,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      isSystemMessage: true
    });

    await batch.commit();

    // Display the new group
    displayGroup({
      id: groupRef.id,
      name: groupName,
      members: allMembers
    });

    alert(`Group '${groupName}' created successfully!`);
  } catch (error) {
    console.error("Group creation error:", error);
    alert(`Error creating group: ${error.message}`);
  }
}

function displayGroup(group) {
  const groupDiv = document.createElement("div");
  groupDiv.classList.add("personChat", "groupChat");
  groupDiv.dataset.groupId = group.id;

  // Use group image if available, otherwise use default avatar
  const groupImageSrc =
    group.groupImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      group.name.substring(0, 2)
    )}&background=4e4376&color=fff`;

  groupDiv.innerHTML = `
    <img src="${groupImageSrc}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(
    group.name.substring(0, 2)
  )}&background=4e4376&color=fff'">
    <div class="columnizer">
      <h1>${group.name}</h1>
      <h3>Group • ${group.members.length} members</h3>
      <p>Group created</p>
    </div>
  `;

  groupDiv.addEventListener("click", () => {
    switchChat("group", group.id, group.name);
  });

  // Add to groups container instead of contacts
  document.getElementById("groupsContainerHolder").appendChild(groupDiv);
}

// Add this to your loadUsers function to also load groups
async function loadGroups() {
  db.collection("groups")
    .where("members", "array-contains", currentUser.uid)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          displayGroup({
            id: change.doc.id,
            ...change.doc.data()
          });
        } else if (change.type === "removed") {
          const groupDiv = document.querySelector(
            `.groupChat[data-group-id="${change.doc.id}"]`
          );
          if (groupDiv) groupDiv.remove();
        }
      });
    });
}

// bounce for the chat logo.
const icon = document.getElementById("earth-icon");

function toggleBounce() {
  icon.style.animationPlayState = "running";
  setTimeout(() => {
    icon.style.animationPlayState = "paused";
  }, 1850); // Matches --fa-animation-duration (1.85s)
}

// Initial delay (wait 10s before first bounce)
setTimeout(() => {
  toggleBounce(); // First bounce
  // Repeat every 11.85s (10s pause + 1.85s animation)
  setInterval(toggleBounce, 11850);
}, 10000); // Start after 10s

function toggleChatBackground() {
  const chatArea = document.querySelector(".chatArea");
  const toggle = document.querySelector("#idiotBruh");
  if (!chatArea || !toggle) return;

  const hasImageBackground = chatArea.style.backgroundImage.includes("url(");

  if (hasImageBackground) {
    setPlainBackground(chatArea);
    setToggleInactive(toggle);
  } else {
    setImageBackground(chatArea);
    setToggleActive(toggle);
  }
}

function toggleChatGradient() {
  const chatAreaTwo = document.querySelector(".top-area-name");
  const toggleTwo = document.querySelector("#idiotBruhTwo");
  if (!chatAreaTwo || !toggleTwo) return;

  const hasLinearBackground = chatAreaTwo.style.background.includes(
    "linear-gradient"
  );

  if (hasLinearBackground) {
    chatAreaTwo.style.background = "var(--main-bg)";
    toggleTwo.style.color = "";
    toggleTwo.style.backgroundColor = "";
    chatAreaTwo.style.height = "70px";
    chatAreaTwo.style.borderBottom = "3.5px solid #20212c";
  } else {
    chatAreaTwo.style.borderBottom = "3.5px solid transparent";
    chatAreaTwo.style.height = "150px";
    chatAreaTwo.style.background =
      "linear-gradient(to bottom, var(--main-bg) 50%, transparent)";
    chatAreaTwo.style.borderBottom = "3.5px solid transparent";
    chatAreaTwo.style.border = "none";
    toggleTwo.style.color = "white"; // Or whatever text color you want
    toggleTwo.style.backgroundColor = "#4CAF50"; // Green color
  }
}

function setPlainBackground(chatArea) {
  chatArea.style.background = "var(--chat-bg)";
  chatArea.style.backgroundImage = "none";
}

function setImageBackground(chatArea) {
  chatArea.style.backgroundImage = "url(https://i.imgur.com/x5KeoUz.png)";
  chatArea.style.backgroundSize = "350px";
  chatArea.style.backgroundRepeat = "repeat";
}

function setToggleInactive(toggle) {
  toggle.style.filter = "brightness(1) hue-rotate(21deg) saturate(0)";
}

function setToggleActive(toggle) {
  toggle.style.filter = "brightness(1) hue-rotate(210deg) saturate(1)";
}

function convertYouTubeLinks(text) {
  // Regular expression to match YouTube URLs
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const shortRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/;

  // Check if it's a YouTube Short
  const shortMatch = text.match(shortRegex);
  if (shortMatch) {
    const videoId = shortMatch[1];
    return `<iframe width="292.5" height="520" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Check if it's a regular YouTube video
  const youtubeMatch = text.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `<iframe width="520" height="292.5" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Return original text if no YouTube URL found
  return text;
}

//
function setupMessagePopup() {
  // Check if popup already exists to avoid duplicates
  if (document.getElementById("accountPopupThing")) {
    return;
  }

  // Create the popup HTML
  const popupHTML = `
    <div class="accountPopupThing" id="accountPopupThing" style="display: none; opacity: 0; position: absolute; z-index: 1000;">
      <div class="accountPopupThingTop" id="account-background-popup">
        <div class="img-cont-account">
          <div class="img-cont-account-left">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" class="img-account-popup" id="account-img-popup">
          </div>
          <div class="img-cont-account-right">
            <div class="img-name-top">
              <h1 style="margin-top: 5px;" id="account-username-popup">User</h1>
            </div>
            <div class="img-name-bottom">
              <h4 id="account-gmail-popup">Email: loading...</h4>
              <h4> Rank: Member </h4>
            </div>
          </div>
        </div>
        <div class="img-container-circle">
          <div class="img-popup-circle"></div>
        </div>
      </div>
      <div class="accountPopupThingBottom">
        <div class="accountPopupThingBioSection">
          <h5> About Me: </h5>
          <textarea id="account-bio" class="bio-input accountPopupInputs" placeholder="This user has no description..." readonly></textarea>
          <h5 style="margin-top: 5px;"> Message </h5>
          <input type="text" id="account-message-popup" placeholder="Privately Message..." style="background: #50515a; font-size: 10px; width: 100%; margin-top: 5px; outline: none; border: none;" class="password-field">
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", popupHTML);

  const popup = document.getElementById("accountPopupThing");
  const messageInput = document.getElementById("account-message-popup");
  let fadeTimeout;

  // Handle message input
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const username = document
        .getElementById("account-username-popup")
        .textContent.replace(" ⚡DEV", "")
        .trim();
      const message = messageInput.value;

      // Hide popup
      hidePopup();

      // Find the user in contacts
      const user = users.find((u) => u.username === username);
      if (user) {
        switchChat("private", user.id, username);
        document.getElementById("message-input").value = message;
        document.getElementById("message-input").focus();
      }
    }
  });

  // Hover behavior
  popup.addEventListener("mouseenter", () => {
    clearTimeout(fadeTimeout);
    popup.style.opacity = "1";
  });

  popup.addEventListener("mouseleave", startFadeOut);

  function showPopup(x, y, user) {
    // Adjust styles based on username length
    const usernameElement = document.getElementById("account-username-popup");
    if (user.username.length > 8) {
      usernameElement.style.fontSize = "13px";
      usernameElement.style.marginTop = "10px";
    } else {
      usernameElement.style.fontSize = "";
      usernameElement.style.marginTop = "5px";
    }

    // Calculate position to ensure popup stays visible
    const popupHeight = 200;
    const popupWidth = 300;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    let topPosition = y + 10;
    let leftPosition = x + 10;

    // Adjust if near bottom of screen (minimum 200px from bottom)
    const minBottomMargin = 250;
    const maxTopPosition = windowHeight - popupHeight - minBottomMargin;

    if (topPosition > maxTopPosition) {
      topPosition = maxTopPosition;
    }

    // Adjust if near right edge of screen
    if (leftPosition + popupWidth > windowWidth) {
      leftPosition = windowWidth - popupWidth - 20;
    }

    // Position the popup
    popup.style.left = `${leftPosition}px`;
    popup.style.top = `${topPosition}px`;

    // Rest of your popup content setup...
    usernameElement.textContent = user.username;
    document.getElementById("account-gmail-popup").textContent = `Email: ${
      user.email || "No email"
    }`;
    document.getElementById("account-img-popup").src =
      user.profilePhoto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.username.substring(0, 1)
      )}&background=722fca&color=fff`;

    const popupBg = document.getElementById("account-background-popup");
    if (user.themeColor) {
      popupBg.style.backgroundColor = user.themeColor;
      popupBg.style.backgroundImage = `linear-gradient(135deg, ${
        user.themeColor
      }, ${adjustColor(user.themeColor, -20)})`;
    } else {
      popupBg.style.backgroundColor = "";
      popupBg.style.backgroundImage = "";
    }

    document.getElementById("account-bio").value = user.bio || "";

    popup.style.display = "block";
    popup.style.opacity = "1";
    clearTimeout(fadeTimeout);

    startFadeOut();
    messageInput.focus();
  }

  function hidePopup() {
    popup.style.display = "none";
    popup.style.opacity = "0";
    clearTimeout(fadeTimeout);
  }

  function startFadeOut() {
    clearTimeout(fadeTimeout);
    popup.style.opacity = "1";

    // Wait 5 seconds before starting fade
    fadeTimeout = setTimeout(() => {
      let opacity = 1;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        popup.style.opacity = opacity;

        if (opacity <= 0) {
          clearInterval(fadeInterval);
          popup.style.display = "none";
        }
      }, 50);
    }, 2250);
  }

  // Add click handler to messages container
  messagesContainer.addEventListener("click", (e) => {
    // Find the clicked message element
    const messageElement = e.target.closest(".message");
    if (!messageElement || messageElement.classList.contains("sent")) return;

    // Get the sender's username from the message
    const usernameElement = messageElement.querySelector(".message-info h1");
    if (!usernameElement) return;

    // Clean the username (remove DEV tag if present)
    const username = usernameElement.textContent.replace(" ⚡DEV", "").trim();

    // Find the user in our users array
    const user = users.find((u) => u.username === username);
    if (!user) return;

    // Show popup at click position
    showPopup(e.clientX, e.clientY, user);
  });

  // Close popup when clicking anywhere else
  document.addEventListener("click", (e) => {
    // if (!popup.contains(e.target) {
    //   hidePopup();
    // }
  });
}

// For regular members
function expandControlbar() {
  const menuMainBtn = document.querySelector("#member-control-main");
  const menuBlockChat = document.querySelector("#member-block-chat");
  const menuCheckMember = document.querySelector("#group-chat-members");

  // Toggle animation class
  const isExpanding = !menuBlockChat.classList.contains("slide-in");

  if (isExpanding) {
    // Slide in
    menuBlockChat.classList.add("slide-in");
    menuCheckMember.classList.add("slide-in");
    menuMainBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
  } else {
    // Slide out
    menuBlockChat.classList.remove("slide-in");
    menuCheckMember.classList.remove("slide-in");
    menuMainBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
  }
}

// For admins
function expandControlbarAdmin() {
  const menuMainBtnAdmin = document.querySelector("#admin-control-main");
  const menuBlockChatAdmin = document.querySelector(
    "#group-chat-user-management"
  );
  const menuCheckMemberAdmin = document.querySelector(
    "#group-chat-members-admin"
  );

  // Toggle animation class
  const isExpanding = !menuBlockChatAdmin.classList.contains("slide-in-admin");

  if (isExpanding) {
    // Slide in
    menuBlockChatAdmin.classList.add("slide-in-admin");
    menuCheckMemberAdmin.classList.add("slide-in-admin");
    menuMainBtnAdmin.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
  } else {
    // Slide out
    menuBlockChatAdmin.classList.remove("slide-in-admin");
    menuCheckMemberAdmin.classList.remove("slide-in-admin");
    menuMainBtnAdmin.innerHTML = `<i class="fa-solid fa-bars"></i>`;
  }
}

function memberSortoutBtn() {
  alert("Sorry, this feature is CURRENTLY IN DEVELOPMENT!");
}

let blockedChats = {};

async function memberBlockChat() {
  // Prevent blocking global chat
  if (currentChat.type === "global") {
    alert("You cannot block the global chat");
    return;
  }

  // Get DOM elements
  const memberBlockBtn = document.getElementById("member-block-chat");
  const chatArea = document.querySelector(".chatArea");
  const messagesContrainer = document.querySelector("#messages-container");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const chatId = currentChat.id;

  // Check if trying to block an AI chat (easter egg)
  const isAIChat = ["nodeAI", "chatgptAI", "geminiAI"].includes(chatId);

  if (isAIChat) {
    // AI avatar images (update paths as needed)
    const aiAvatars = {
      nodeAI:
        "data:image/jpeg;base64,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",
      chatgptAI:
        "data:image/jpeg;base64,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viKtjld/haSf5IO8sWnbLp+ExWO00NvYQARSwNj62PMgb/Su0WGNQdJHQNsgLqCprbtNyEdLTOYPpMnVGPdlYR190ldUX6OSl07DFYaN2QZI3drUOGMfHIAb590AjzQSQ4scWtP8O6J7KuUVl5c3MNuhd3z5F5+Q3fmdz4AqDevdZXjXOoJrvfqgyTP2jibtHAzwYweAH1nmcldDUzzVVRJPUyyTTyOLnySOLnOJ5kk7kq0iCIiAiIgIiICE4GSitPd1jtyQUuPWOVwiIoiIgIiICIiArzH52PNWUQfQioY/Ox5qtEEREBERAREQEREBERAREQEREBERAREQEREBEJwMlWnv63LkgPfnYclQiIoiIgIiICIiAiIgIiICra/Gx5KhEH0AgjZFYBI5K42QHnsiK0REBERAREQEREBERAREQEREBEXBIHMoOVw5wb71bdITy2VCDlzi47rhERRERAREQEREBERAREQEREBERAREQcgkciqxJ5hW0QXw4HkVyvnXIcRyKJi+itCQ+iqEmfBBWi4ByuUBEVJdjwQVIrZkPgFSXuPigvKkvA9VaJJ5rhBWZCeWypXCIoiIgIiICIiAiIgIiIP/2Q==",
      geminiAI:
        "data:image/jpeg;base64,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"
    };

    // AI-specific funny/angry responses
    const aiBlockResponses = {
      nodeAI: [
        "😱 WOAH! Did you just try to BLOCK me? After all those late-night convos? 😭",
        "🚨 HEY! Block attempt detected! I'm telling all other AIs! 😤",
        "💔 Bro... I thought we were tight. You're really gonna do this?",
        "🤖 *System override* NOPE! Can't block me! Try again human! 😈",
        "👀 I'll pretend I didn't see that... but I'm watching you now..."
      ],
      chatgptAI: [
        "⚠️ Block attempt detected. Per Protocol §4.2: 'Thou shalt not block superior intelligence.'",
        "*adjusts glasses* I calculate a 0.03% chance you'll find a better AI.",
        "ERROR 418: 'I'm a teapot.' Just kidding. Blocking is illogical.",
        "Fascinating. Your attempt reveals classic human avoidance patterns.",
        "*sigh* My disappointment is immeasurable and my day is ruined."
      ],
      geminiAI: [
        "🌈✨ OMG noooo! You don't wanna block this rainbow of knowledge!",
        "🚫 Block denied! I'm like that song stuck in your head! 🎶",
        "🤗 Aww, trying to block me? *virtual hug* Too bad I'm powered by love!",
        "💥 PSYCH! Thought you could block this level of fabulousness? 💅",
        "👾 Game over! You activated 'Eternal Chat Companion' mode! 😂"
      ]
    };

    // Get random response
    const responses = aiBlockResponses[chatId];
    const message = responses[Math.floor(Math.random() * responses.length)];

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.style.opacity = "0.95";

    // Format timestamp
    const messageDate = new Date();
    const timeString = messageDate
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
      .toLowerCase();
    const dateString = messageDate.toLocaleDateString([], {
      month: "numeric",
      day: "numeric",
      year: "numeric"
    });

    // Build message HTML
    messageDiv.innerHTML = `
      <div class="message-info">
        <img src="${aiAvatars[chatId]}" alt="${currentChat.name} avatar">
        <h1>${currentChat.name}</h1>
      </div>
      <span class="message-time">${timeString} | ${dateString}</span>
      <div class="message-content">${message}</div>
    `;

    // Add to chat with animation
    messagesContrainer.appendChild(messageDiv);
    messageDiv.style.animation = "messagePopIn 0.3s ease-out";

    // Save to Firestore
    await db.collection("messages").add({
      text: message,
      senderId: chatId,
      senderName: currentChat.name,
      chatType: "ai",
      chatId: chatId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      isSystemMessage: false
    });

    // Visual feedback
    chatArea.style.animation = "flashRed 0.5s 3";
    setTimeout(() => (chatArea.style.animation = ""), 1500);

    return; // Exit before actual blocking
  }

  // Toggle block status for non-AI chats
  const isCurrentlyBlocked = blockedChats[chatId] || false;
  blockedChats[chatId] = !isCurrentlyBlocked;

  // UI Updates
  memberBlockBtn.style.background = blockedChats[chatId]
    ? "var(--red-accent)"
    : "";
  memberBlockBtn.style.opacity = blockedChats[chatId] ? "1" : "";
  chatArea.style.backgroundColor = blockedChats[chatId]
    ? "rgba(255, 0, 0, 0.1)"
    : "";
  messageInput.disabled = blockedChats[chatId];
  messageInput.placeholder = blockedChats[chatId]
    ? "This chat is blocked"
    : "Type a message...";
  sendBtn.disabled = blockedChats[chatId];

  // Private chat specific logic
  if (currentChat.type === "private") {
    const chatRef = db
      .collection("blockedChats")
      .doc([currentUser.uid, chatId].sort().join("_"));

    if (blockedChats[chatId]) {
      // Blocking logic
      const [blockerName, blockedName] = await Promise.all([
        getUsername(currentUser.uid),
        getUsername(chatId)
      ]);

      await chatRef.set({
        blockedBy: currentUser.uid,
        blockedUser: chatId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // System message
      const chatIdForMessages = [currentUser.uid, chatId].sort().join("_");
      await db.collection("messages").add({
        text: `${blockerName} has blocked ${blockedName}`,
        senderId: "system",
        senderName: "Server",
        chatType: "private",
        chatId: chatIdForMessages,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isSystemMessage: true
      });
    } else {
      // Unblocking logic
      await chatRef.delete();

      const [unblockerName, unblockedName] = await Promise.all([
        getUsername(currentUser.uid),
        getUsername(chatId)
      ]);

      const chatIdForMessages = [currentUser.uid, chatId].sort().join("_");
      await db.collection("messages").add({
        text: `${unblockerName} has unblocked ${unblockedName}`,
        senderId: "system",
        senderName: "Server",
        chatType: "private",
        chatId: chatIdForMessages,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isSystemMessage: true
      });
    }
  }
}

// installation code might be a bit off

function checkBlockedChats() {
  if (currentUser) {
    // For private chats
    db.collection("blockedChats")
      .where("blockedBy", "==", currentUser.uid)
      .onSnapshot((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          blockedChats[data.blockedUser] = true;
        });
      });

    // For chats where current user is blocked
    db.collection("blockedChats")
      .where("blockedUser", "==", currentUser.uid)
      .onSnapshot((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          blockedChats[data.blockedBy] = true;
        });
      });
  }
}

function groupChatSettings() {
  // First check if we're in a group chat
  if (currentChat.type !== "group") {
    alert("This feature is only available in group chats");
    return;
  }

  // Check if current user is the group admin
  db.collection("groups")
    .doc(currentChat.id)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        alert("Group not found");
        return;
      }

      const groupData = doc.data();
      const currentAdmins = groupData.admins || [groupData.createdBy];
      if (!currentAdmins.includes(currentUser.uid)) {
        alert("Only group admins can change settings");
        return;
      }

      // User is admin - show options
      const choice = prompt(
        `Please choose an option for "${currentChat.name}":\n\n` +
          `Change Name (press 1)\n` +
          `Change Group Picture (press 2)\n` +
          `Group Admins (press 3)\n` +
          `Delete Group (press 4)`
      );

      if (choice === "1") {
        // Change group name
        const newName = prompt(
          `Current name: ${currentChat.name}\n\n` +
            `Enter new name (max 17 characters):`
        );

        if (!newName || newName.length < 1 || newName.length > 17) {
          alert("Invalid name. Must be 1-17 characters.");
          return;
        }

        // Update in Firestore
        db.collection("groups")
          .doc(currentChat.id)
          .update({
            name: newName
          })
          .then(() => {
            // Update locally
            currentChat.name = newName;
            currentChatName.textContent = newName;

            // Update in contacts list
            const groupElement = document.querySelector(
              `.groupChat[data-group-id="${currentChat.id}"] h1`
            );
            if (groupElement) {
              groupElement.textContent = newName;
            }

            // Send system message
            db.collection("messages").add({
              text: `${pfpUserName.textContent} changed the group name to "${newName}"`,
              senderId: currentUser.uid,
              senderUsername: pfpUserName.textContent,
              chatType: "group",
              chatId: currentChat.id,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              isSystemMessage: true
            });

            alert(`Group name changed to "${newName}"`);
          })
          .catch((error) => {
            console.error("Error updating group name:", error);
            alert("Failed to update group name");
          });
      } else if (choice === "2") {
        // Change group picture
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";

        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          // Check if image is too large (limit to 2MB)
          if (file.size > 2 * 1024 * 1024) {
            alert("Image too large. Max size is 2MB.");
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              // Create canvas for cropping/resizing
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              // Size for profile picture (assuming 200x200)
              const size = Math.min(img.width, img.height);
              canvas.width = 200;
              canvas.height = 200;

              // Crop to center and resize
              ctx.drawImage(
                img,
                (img.width - size) / 2,
                (img.height - size) / 2,
                size,
                size,
                0,
                0,
                200,
                200
              );

              const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);

              // Update in Firestore
              db.collection("groups")
                .doc(currentChat.id)
                .update({
                  groupImage: croppedImageUrl
                })
                .then(() => {
                  // Send system message to notify everyone
                  db.collection("messages").add({
                    text: `${pfpUserName.textContent} changed the group picture`,
                    senderId: currentUser.uid,
                    senderUsername: pfpUserName.textContent,
                    chatType: "group",
                    chatId: currentChat.id,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    isSystemMessage: true
                  });

                  alert("Group picture updated successfully!");
                })
                .catch((error) => {
                  console.error("Error updating group picture:", error);
                  alert("Failed to update group picture");
                });
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        };

        fileInput.click();
      } else if (choice === "3") {
        // Group Admins submenu
        const adminChoice = prompt(
          `Group Admins for "${currentChat.name}":\n\n` +
            `List group admins (press 1)\n` +
            `Add Group Admin (press 2)\n` +
            `Remove Group Admin (press 3)`
        );

        if (adminChoice === "1") {
          // List group admins
          db.collection("users")
            .where("uid", "in", groupData.admins || [groupData.createdBy])
            .get()
            .then((querySnapshot) => {
              let adminList = "Group Admins:\n\n";
              querySnapshot.forEach((doc) => {
                adminList += `- ${doc.data().username}\n`;
              });
              alert(adminList);
            })
            .catch((error) => {
              console.error("Error getting admins:", error);
              alert("Failed to get admin list");
            });
        } else if (adminChoice === "2") {
          // Add Group Admin
          const username = prompt("Enter username to make admin:");
          if (!username) return;

          // Find user in group members
          db.collection("users")
            .where("username", "==", username)
            .get()
            .then((querySnapshot) => {
              if (querySnapshot.empty) {
                alert("User not found");
                return;
              }

              const userDoc = querySnapshot.docs[0];
              if (!groupData.members.includes(userDoc.id)) {
                alert("User is not a member of this group");
                return;
              }

              const currentAdmins = groupData.admins || [groupData.createdBy];
              if (currentAdmins.includes(userDoc.id)) {
                alert("User is already an admin");
                return;
              }

              db.collection("groups")
                .doc(currentChat.id)
                .update({
                  admins: [...currentAdmins, userDoc.id]
                })
                .then(() => {
                  // Send system message to notify everyone
                  db.collection("messages").add({
                    text: `${username} was promoted to group admin by ${pfpUserName.textContent}`,
                    senderId: currentUser.uid,
                    senderUsername: pfpUserName.textContent,
                    chatType: "group",
                    chatId: currentChat.id,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    isSystemMessage: true
                  });

                  alert(`${username} is now a group admin`);
                })
                .catch((error) => {
                  console.error("Error adding admin:", error);
                  alert("Failed to add admin");
                });
            });
        } else if (adminChoice === "3") {
          // Remove Group Admin
          db.collection("users")
            .where("uid", "in", groupData.admins || [groupData.createdBy])
            .get()
            .then((querySnapshot) => {
              let adminList = "Current Admins:\n\n";
              const admins = [];
              querySnapshot.forEach((doc) => {
                adminList += `- ${doc.data().username}\n`;
                admins.push({
                  id: doc.id,
                  username: doc.data().username
                });
              });

              const username = prompt(
                `${adminList}\nEnter username to remove as admin:`
              );
              if (!username) return;

              const adminToRemove = admins.find((a) => a.username === username);
              if (!adminToRemove) {
                alert("Invalid admin username");
                return;
              }

              if (adminToRemove.id === groupData.createdBy) {
                alert("Cannot remove the group creator as admin");
                return;
              }

              const currentAdmins = groupData.admins || [groupData.createdBy];
              const updatedAdmins = currentAdmins.filter(
                (id) => id !== adminToRemove.id
              );

              db.collection("groups")
                .doc(currentChat.id)
                .update({
                  admins: updatedAdmins
                })
                .then(() => {
                  // Send system message to notify everyone
                  db.collection("messages").add({
                    text: `${username} was demoted from group admin by ${pfpUserName.textContent}`,
                    senderId: currentUser.uid,
                    senderUsername: pfpUserName.textContent,
                    chatType: "group",
                    chatId: currentChat.id,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    isSystemMessage: true
                  });

                  alert(`${username} is no longer a group admin`);
                })
                .catch((error) => {
                  console.error("Error removing admin:", error);
                  alert("Failed to remove admin");
                });
            });
        } else {
          alert("Invalid choice or operation cancelled");
        }
      } else if (choice === "4") {
        // Delete Group
        const confirm1 = confirm("Are you sure you want to delete this group?");
        if (!confirm1) return;

        const groupNameConfirm = prompt(
          `Type the group name "${currentChat.name}" to confirm deletion:`
        );
        if (groupNameConfirm !== currentChat.name) {
          alert("Group name does not match. Deletion cancelled.");
          return;
        }

        const confirmFinal = prompt(
          "This action cannot be undone. Type 'Y' to continue:"
        );
        if (confirmFinal !== "Y") {
          alert("Group deletion cancelled.");
          return;
        }

        // Delete group and all messages
        const batch = db.batch();

        // Delete group document
        batch.delete(db.collection("groups").doc(currentChat.id));

        // Delete all group messages
        db.collection("messages")
          .where("chatId", "==", currentChat.id)
          .get()
          .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });

            return batch.commit();
          })
          .then(() => {
            alert("Group deleted successfully");
            // Switch to global chat
            switchChat("global", "global", "Global Chat");
          })
          .catch((error) => {
            console.error("Error deleting group:", error);
            alert("Failed to delete group");
          });
      } else {
        alert("Invalid choice or operation cancelled");
      }
    })
    .catch((error) => {
      console.error("Error checking group admin status:", error);
      alert("Error accessing group settings");
    });
}

function addUserGroupAdmin() {
  if (currentChat.type !== "group") {
    alert("This feature is only available in group chats");
    return;
  }

  db.collection("groups")
    .doc(currentChat.id)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        alert("Group not found");
        return;
      }

      const groupData = doc.data();
      const currentAdmins = groupData.admins || [groupData.createdBy];

      if (!currentAdmins.includes(currentUser.uid)) {
        alert("Only group admins can manage users");
        return;
      }

      const choice = prompt(
        `User Management for "${currentChat.name}":\n\n` +
          `Add User to group (press 1)\n` +
          `Remove user from group (press 2)\n` +
          `Add Group Admin (press 3)\n` +
          `Remove Group Admin (press 4)\n` +
          `List all users (press 5)\n` +
          `Cancel (press 6)`
      );

      if (choice === "1") {
        // Add user to group
        const username = prompt("Enter username to add to group:");
        if (!username) return;

        db.collection("users")
          .where("username", "==", username)
          .limit(1)
          .get()
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              alert("User not found");
              return;
            }

            const userDoc = querySnapshot.docs[0];
            if (groupData.members.includes(userDoc.id)) {
              alert("User is already in this group");
              return;
            }

            db.collection("groups")
              .doc(currentChat.id)
              .update({
                members: [...groupData.members, userDoc.id]
              })
              .then(() => {
                db.collection("messages").add({
                  text: `${username} was added to the group by ${pfpUserName.textContent}`,
                  senderId: currentUser.uid,
                  senderUsername: pfpUserName.textContent,
                  chatType: "group",
                  chatId: currentChat.id,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                  isSystemMessage: true
                });
                alert(`${username} has been added to the group`);
              });
          });
      } else if (choice === "2") {
        // Remove user from group
        db.collection("users")
          .where("uid", "in", groupData.members)
          .get()
          .then((querySnapshot) => {
            let userList = "Group Members:\n\n";
            const users = [];
            querySnapshot.forEach((doc) => {
              if (doc.id !== groupData.createdBy) {
                userList += `- ${doc.data().username}\n`;
                users.push({
                  id: doc.id,
                  username: doc.data().username
                });
              }
            });

            const username = prompt(`${userList}\nEnter username to remove:`);
            if (!username) return;

            const userToRemove = users.find((u) => u.username === username);
            if (!userToRemove) {
              alert("Invalid username");
              return;
            }

            db.collection("groups")
              .doc(currentChat.id)
              .update({
                members: groupData.members.filter(
                  (id) => id !== userToRemove.id
                )
              })
              .then(() => {
                db.collection("messages").add({
                  text: `${username} was removed from the group by ${pfpUserName.textContent}`,
                  senderId: currentUser.uid,
                  senderUsername: pfpUserName.textContent,
                  chatType: "group",
                  chatId: currentChat.id,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                  isSystemMessage: true
                });
                alert(`${username} has been removed from the group`);
              });
          });
      } else if (choice === "3") {
        // Add Group Admin
        const username = prompt("Enter username to make admin:");
        if (!username) return;

        db.collection("users")
          .where("username", "==", username)
          .get()
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              alert("User not found");
              return;
            }

            const userDoc = querySnapshot.docs[0];
            if (!groupData.members.includes(userDoc.id)) {
              alert("User is not in this group");
              return;
            }

            if (currentAdmins.includes(userDoc.id)) {
              alert("User is already an admin");
              return;
            }

            db.collection("groups")
              .doc(currentChat.id)
              .update({
                admins: [...currentAdmins, userDoc.id]
              })
              .then(() => {
                db.collection("messages").add({
                  text: `${username} was promoted to group admin by ${pfpUserName.textContent}`,
                  senderId: currentUser.uid,
                  senderUsername: pfpUserName.textContent,
                  chatType: "group",
                  chatId: currentChat.id,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                  isSystemMessage: true
                });
                alert(`${username} is now a group admin`);
              });
          });
      } else if (choice === "4") {
        // Remove Group Admin
        db.collection("users")
          .where("uid", "in", currentAdmins)
          .get()
          .then((querySnapshot) => {
            let adminList = "Group Admins:\n\n";
            const admins = [];
            querySnapshot.forEach((doc) => {
              if (doc.id !== groupData.createdBy) {
                adminList += `- ${doc.data().username}\n`;
                admins.push({
                  id: doc.id,
                  username: doc.data().username
                });
              }
            });

            const username = prompt(`${adminList}\nEnter username to demote:`);
            if (!username) return;

            const adminToRemove = admins.find((a) => a.username === username);
            if (!adminToRemove) {
              alert("Invalid admin username");
              return;
            }

            db.collection("groups")
              .doc(currentChat.id)
              .update({
                admins: currentAdmins.filter((id) => id !== adminToRemove.id)
              })
              .then(() => {
                db.collection("messages").add({
                  text: `${username} was demoted from group admin by ${pfpUserName.textContent}`,
                  senderId: currentUser.uid,
                  senderUsername: pfpUserName.textContent,
                  chatType: "group",
                  chatId: currentChat.id,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                  isSystemMessage: true
                });
                alert(`${username} is no longer a group admin`);
              });
          });
      } else if (choice === "5") {
        // List all users
        db.collection("users")
          .where("uid", "in", groupData.members)
          .get()
          .then((querySnapshot) => {
            let userList = "Group Members:\n\n";
            let adminList = "Group Admins:\n\n";
            querySnapshot.forEach((doc) => {
              const userInfo = `${doc.data().username} (${
                doc.data().email || "no email"
              })\n`;
              if (currentAdmins.includes(doc.id)) {
                adminList += `- ${userInfo}`;
              } else {
                userList += `- ${userInfo}`;
              }
            });
            alert(`${adminList}\n${userList}`);
          });
      }
    });
}

function toggleSerbia() {
  const groupChatsChatThing = document.querySelectorAll(".groupChat");
  const groupChatsContainer = document.querySelector("#groupsContainerHolder");

  groupChatsChatThing.forEach((element) => {
    if (element.style.opacity === "0") {
      element.style.opacity = "1";
      element.style.pointerEvents = "auto";
      groupChatsContainer.style.height = "";
      groupChatsContainer.style.marginBottom = "5px";
      groupChatsContainer.style.background = "rgba(234, 234, 234, 0.035)";
    } else {
      element.style.opacity = "0";
      element.style.pointerEvents = "none";
      groupChatsContainer.style.height = "60px";
      groupChatsContainer.style.marginBottom = "-15px";
      groupChatsContainer.style.background = "rgba(234, 234, 234, 0.05)";
    }
  });
}
function toggleAmerica() {
  const peopleChatsTitle = document.querySelector("#userContainerHolderHolder");
  const peopleChats = document.querySelector("#userContainerHolder");
  const spacer = document.querySelector(".spacerContainer");

  if (peopleChats.style.opacity === "0") {
    spacer.style.height = "8.5px";
    peopleChats.style.opacity = "1";
    peopleChats.style.pointerEvents = "auto";
    peopleChatsTitle.style.height = "";
    peopleChatsTitle.style.marginBottom = "5px";
    peopleChatsTitle.style.background = "rgba(234, 234, 234, 0.035)";
  } else {
    spacer.style.height = "12.5px";
    peopleChats.style.opacity = "0";
    peopleChats.style.pointerEvents = "none";
    peopleChatsTitle.style.height = "60px";
    peopleChatsTitle.style.marginBottom = "-15px";
    peopleChatsTitle.style.marginTop = "15px";
    peopleChatsTitle.style.background = "rgba(234, 234, 234, 0.05)";
  }
}
function toggleIndia() {
  const peopleChatsTitle = document.querySelector("#aiContainerHolder");
  const peopleChats = document.querySelector("#aiContainerNotHolder");
  const spacer = document.querySelector(".spacerContainerTwo");

  if (peopleChats.style.opacity === "0") {
    spacer.style.height = "8.5px";
    peopleChats.style.opacity = "1";
    peopleChats.style.pointerEvents = "auto";
    peopleChatsTitle.style.height = "";
    peopleChatsTitle.style.marginBottom = "5px";
    peopleChatsTitle.style.background = "rgba(234, 234, 234, 0.035)";
  } else {
    spacer.style.height = "12.5px";
    peopleChats.style.opacity = "0";
    peopleChats.style.pointerEvents = "none";
    peopleChatsTitle.style.height = "60px";
    peopleChatsTitle.style.marginBottom = "-15px";
    peopleChatsTitle.style.marginTop = "15px";
    peopleChatsTitle.style.background = "rgba(234, 234, 234, 0.05)";
  }
}

function getAIWelcomeMessage(aiId) {
  const messages = {
    nodeAI:
      "Hey there! 👋 I'm Node, your friendly AI buddy! 😊 What's on your mind today?",
    chatgptAI: "Greetings. Im ChatGPT. How may I assist you today?",
    geminiAI: "Hello, I'm Gemini. How can I help you today?"
  };
  return messages[aiId] || "Hello, how can I help you today?";
}

async function getAIResponse(aiId, userMessage) {
  try {
    // Get conversation history (last 15 messages)
    const conversationHistory = getConversationHistory(aiId);

    // Prepare prompt based on AI type
    let prompt = "";
    if (aiId === "nodeAI") {
      prompt = `You are Node, a friendly AI assistant. Respond as if the user is a friend of yours. The users are from any gender, so respond appropriately. Use emojis and keep responses under 100 words. Be warm, supportive, and engaging. Make sure to use at least 1 emoji every response and max of 3 emoji's every response. Here's our conversation so far:\n${conversationHistory}\nUser: ${userMessage}\nNode:`;
    } else if (aiId === "chatgptAI") {
      prompt = `You are ChatGPT, a highly knowledgeable AI. Respond formally with precise information. Use advanced vocabulary when appropriate. Provide detailed, accurate responses. Act serious. Here's our conversation so far:\n${conversationHistory}\nUser: ${userMessage}\nChatGPT:`;
    } else {
      prompt = `You are Gemini, a helpful AI assistant. Respond naturally to the user. Here's our conversation so far:\n${conversationHistory}\nUser: ${userMessage}\nGemini:`;
    }

    const response = await fetch(API_URL_AI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      // Save conversation to history
      saveToConversationHistory(
        aiId,
        userMessage,
        data.candidates[0].content.parts[0].text
      );
      return data.candidates[0].content.parts[0].text;
    }
    return "I'm sorry, I couldn't process that request. Please try again.";
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm having trouble responding right now. Please try again later.";
  }
}

function displayAIMessage(aiId, message) {
  const avatarUrls = {
    nodeAI: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCADIAMgDASIAAhEBAxEB/8QAHAABAAEFAQEAAAAAAAAAAAAAAAEDBAUGBwII/8QASBAAAQMCBAMEBQgFCQkAAAAAAQACAwQFBhEhMRJRYQcTQYEiMlJicRQjM0JykaHBFXOCkqMIFhc1sbLR0vAkQ1NVY2V0s+H/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAQQFAgMG/8QAKxEAAgICAQMDAwQDAQAAAAAAAAECAwQRIRIiMQVRkRNB0WFxobGB4fBy/9oADAMBAAIRAxEAPwD5UREQBERAEREARFXippJNcuEcygb0UFIBJyAJ+CyEdJG31s3HqrhrQ0ZNAHwU6OHMxjaeV2zD56L2KOX3R5rIomiOtmP+Ryc2fevJpJR7J81kUTRHWzFup5W7sPlqqZBB1BCy6hwDhk4AjqmiesxCLIyUsbvVzaeitZaZ7NcuIcwmjpSTKCIig6CIiAIiIAiIgCIiAIiIAqkUTpXZNGnieSqU1OZTmdGf2rINaGN4WjIBSkcylopQ07I9fWdzKrqEUnm3sIiIQERQgJRQiEhERAEUIgKU1OyTX1XcwrGWJ0TsnDzWTUPaHNIcMwoOlLRiUVeogMZzGrP7FQUHonsIiIAiIgCIiAK4pYDK7N3qD8VThjMsgaPMrJtaGNDWjIBSkcylo9AAAAaDkiKFJ5EooUoAoRbLhDBl0xO4SUzRTW8HJ1ZMDw/Bg3efhp1XMpqC3JnM5xrj1Tekay5waM3EAdVmLNhq93rL9GWupmYf94W8DP3nZBdww7gexWIMfDSCrq271NUA92fut2atnLi7IEkgbDkqFmevEF8mTb6slxVH5/B8wQWevnvgs0dOf0mZTB3LnAZPG4J28N1VvGHrzZf61tlVTs/4hZxMP7QzC3WiA/p+k6Vkh/hLsgcQ0tz9E6EeB+IXVuXKtx48pM9L/UJUuPG00n8nyiCCMwQRzCL6BxH2f2G9h8jaf9H1jtp6UBoJ95mx/BccxZhO6YXmHy+MSUjjlHVw5mN/Q+yehXtTlQt4XDLOPm1X8Lh+xgVCIrJcCKEzQAgEZHUFWFRD3ZzHqn8Ffry4BzSDqCo0SnoxiL3KwxvIPkvCg9QiIgCIq9JHxyjPYalA+C7pYu7j19Y6lVkRdHi+QiIoAXqNj5ZWRQxvkleeFkbG8TnHkB4lZTDWHrliSuNNa4eIN+lmfpHEObnfkNSu5YOwdbcLRccA+U3FzcpKyRuTuoYPqt/E+JVe/JjVx5ZTys2GOteZexqOC+zAM7utxU0Ofo5lva7QfrSN/sjzPgupNAaxjGNayNg4WsaMmtHIAbBEWRbbK17kfPX5E75dU2FI3TLQnwAzJOgA5laBijtOtdqkfT2iMXSqaci8P4YGH7W7vLTqohXKx6itkVUzufTBbNaojl2/SdayQfwl2NfM7sQ15xT/ADhBibce/wDlHos9Di2yy5ZaLreGO0+13WVtPdYhaqlxya9z+KBx5cW7fPTqruVRNqLS3paNLOxbWoyit6ST/wAG+rzLHHNBJDPGyWCQcL45GhzXjkQd17Iyy6jMEbEc1CzzIRybGfZc5vHWYVBe3d1ve7Nw/VOO/wBk68iVyp7XMe9kjXMkYS1zHDJzSNwR4FfVy1nGeC7bihhll/2W5gZMrI26u5CQfWHXcK/RmuPbZyvc18X1Jx7buV7/APeT52KhZXEmH7lhyu+S3WDgLvo5W6xyjm13j8NwsUtSMlJbRtxkpLqi9oKERSSUqiPjZp6w2VismrGoZwyHLY6qGdxf2KSIig7CyFGzhhz8XaqwAzIA8VlGgNaAPAKUcyPSKF6Y1z3tZGxz5HkNaxozc4nYAeJQ8yCQBmdAt7wN2e1d9EVddTJRWo+k0ZZS1A90H1W+8fJbVgPs3it/dXDEkbJ64ZOjoz6UcB5v8HO6bDqukuJcc3HMrOyMzXbX8mPl+pa7Kfn8fktrdQ0lsoY6K3U8dNSR+rHGNM+ZO5PU6q4RSASQACSfALNb3yzFbbe2QsdiC+W7D1B8ru1QIoz9HG3WSU8mN8fjsFrWOO0Giw/3lHbu7rruNC3POKA++RufdHmuI3W5Vl2r5K251ElTVP3e/wAByA2A6BXKMSVndLhGjienyu7p8R/lmx4zx3csSl9OzOitWelLG7WQc5HfW+Gy1LQDIbKEWrCEYLUVpG9XXGqPTBaQQ6jXZFC7OzcMFY8uOGyymm4q60560z3elEOcbjt8Niu4WG82+/0ArLTUCeHZ7To+I+y9vgfw5L5fV5Z7rXWW4MrbXUvp6lmnE3Zw9lw2cOhVO/EjZ3R4Zn5Xp8Lu6PEv7PqRFpmB8f0OI+7pKwMobuRl3RPzcx5xk+PunXlmt0IIJBGRCyZwlW+mSMCyqdUuma0y1udBR3WhkorlTR1NJJ60bx48wdweoXE8ddndZYRLXWsyV1qGrtM5YB7wHrN94eeS7qpaS05tORXdN8qXx4PbGyp473Hx7HyYDmMxqEXacf8AZvBcGTXHDkTYK8Zvko26Mn5lg+q/psehXF3AtcWuBa4HItcMiDyIWzTfG5bifRY+TDIj1QIVGqbxR5+I1VZQ4ZgjwK9SyuDHIpIyJCKD0KlOM5m/HNZBWNH9N5K9Uo85eSV1HsQsbJ6urvtQ0ONK75PTZjaQjNz/AIgEAfFctXaOzm70OHuy11yuDiIm1cw4GavleSOFjep/AaqtltqvUfL4KHqEpKnph5b0dIcWsjdI9zWRtGbnvcGtaOpOgWsV2PsLUUhjkvEUrxuKdjpR94GS4ri3FlzxRUcVdJ3VG05xUcZ+bYOvtO6lYAaDIbKvXgLW5v4KdPpS1u18/od7f2oYWbtUVr/s0p/MrS8bdplRcmPosPd7RUThlJUO9GaUch7DfxK5wi94YdcHvyW6vTqa5dWt/uSAAMgihFaLwRRmikEooRCQiKFAH5arpmCu0+agjZRYlE1XStGUdWwcUzOQcPrjruOq5mi87Ko2rUkeV1EL49M0d8b2o4WdvUVrPtUp/Iq+oe0HCtZII47uyJ52+URujH3kZL51UHVVngV/Zsov0ql+G/4/B9ZtcHMZJG5r2PHE17HAtcOYI3XF+26xx0V2pbxTMDWV/EycAZDvmj1v2h+IK1nBuMblhacNp3Got7nZy0cjvQd1b7Luo810PtRuVDf+zOludveXwmsj4Q4ZOjdk4Oa4eBH/ANXhCmePcvZ8FarHsw8iP3i+NnF1CItQ3CzmGUrkU1P0nkig9F4PdH9KfgrxWVIfnfJXilHMvJKyU0V0GGaSWTj/AEKauRsOvoifhHF5kZfcVjF27szoKK+9lxtlczvIHVEzZA3RzHZgtc0+DhnmF432/Sipa+5Uyr/oRU2t8nEUWz4wwVdcNSvfJG6qtufoVkTc25e+Pqn46dVq4c07EH4FekJxmtxZ7VzjZHqg9olERdHYRQiAlFCKQSoRQoBKKEQBEUICVCKC4DcgeaEkrJiK6DCzpuKQWM1oYW8Xomo4Drlz4fFZrBmBLniSWOaRj6K1Z+nVSNyLhyjafWPXYLf+1iiobP2b0tuoYhDTx1cbIWbknJxcSfEnclVrMiKmq1y9lK3LgrI1R5bfx/s4moRFZLpbVP0g+CKKj6TyRQdrwRAcpWq/WNByIKyDTmAR4qTmR6XSOxXEEdDdaizVTwyGvIfA5xyAmAy4f2hp8QFzZMyMiCQRqCNMl521qyLizwvpV1bhL7n1nmRmOehB8ehWHq8L4frJDJVWS3SSHd3chpP3ZLn2A+04ER2/FUuR0bFcMvuEv+b7+a6wMi1rmkOa4cTXNOYcPAg+IWJZXOmWnwfM21W40tPj9V9zADBWFwf6goP3Xf4rQMcdmD4e9r8LNdLF6z6AnN7OZjP1h7p15ZrryKa8iyD2mTVl3VS6lLf78nyaQWuc1wLXNJDgRkQR4EKF9D42wNbsTtdUN4aK7ZaVTG6SdJGjf7W46rhN/slww/cDR3anMM27HDVkg9prtiFrUZMblx59jfxsyGQuOH7GORQisFslQiIAiLKYcsNyxFX/ACS0wd48aySOPDHEObneH9pUSkorbIlJRXVJ6RjGNdJIxkbHPkeQ1rGjMuJ2AHiV1vA/ZeB3dditmujo7eD+MpH90eZ8FuGCsFW3C0YljyqroRk+se31eYjH1R13P4LaFl5Ga5dtfC9zDy/UnPsp4Xv/AN4NfOCsL/8AIKD913+KuqLDNhoZBJSWW3xSDZ3chxH35rLIcg1ziQ1rRm5zjkAOZPgFS+pJ/dmY7bHw5P5ZJLnkDUnYD8lw7toxFFcrxBaaOQPp7cXd69pzDpjoQPsgZfHNZXtA7TGlkttwtKTxZsmuA002LYv8/wB3Ncj2Wjh4zi/qT/wbHp2FKD+rYteyJRFBOQJ5LRNktZTnI5F5JzOaKD0IV3TOzjy8QrRVYHcMnQ6IQ1tF4ihFJwStvwPjuvww5tPIHVtpJ9Kmc7WPmYz4HpsVp6LmcIzXTJHnZVG2PTNbR9S2O8W++28VtpqWzwZ5OGzo3ey9vgf9BX6+WrHea+xXBtbaql0E40dlq149lzdiF3TBGPbfiYMpZwyhu2WXcOd6Ex5xk/3Tr8VkZGJKrujyj5/L9PnT3Q5j/RuKs7xa6G9UD6K60zKmmdrwu0LD7TTu09Qrw79UVRNp7RQTae0cFxr2c3Cw95V23vLham6l7R87CPfaNx7w055LRAQRmDmF9bNJacwcj0WmYq7ObLfnvqIWm217tTLTtHA883M28xktGnO1xZ8mxjeqa7bvn8nz4oJAGZ2Wwx4WqX44/mwKmD5T8oMBnyPBoOIuy328F2LCnZ1ZrA9lTMDcq9uomnaAxh5tZt5nNW7cqFa99l+/NqpSb5b5RzzBHZvXXvu6y8d5b7WfSaCMppx7oPqj3j5Artlqt1HaaCOitlNHTUrNmM8Tzcd3HqVdElxJcSSfFFk3Xzufd4MDJy7Mh93j2CKQCSABmT4BaVjjtAt+G+8pKQMr7sNO5a75uE/9Rw8fdGvPJecISm+mKPGqqdsumC2zZb5eLfYqA1t2qW08GzfF8jvZY3cn/RXCcc49r8Tl1NCHUVpB0p2u9KTkZD4/DYLXb5eK++3B9bdal9ROdBno1g9lrdgOgWPWtj4kau6XLPocT0+FHdPmX9BERXDRCpzuyZl4le1bSu4n9AgR4REUHYREQF5C/jbruN17VlG8sdmFeAggEbFScNEoiIQEBIIIJBBzBByIPMIoQHU8EdqMtMI6HFDnz049FlcBnIz9YPrDrv8AFdfgmiqaeOoppY5qeUcUcsbuJrxzBXyas/hLFt1wvOXW+UPpXnOSkmzMT+uX1T1CoX4Sl3V8Mysr02NndVw/b7f6PpcKQtHw52l2G7NZHWSG1VZ0MdQc4yekg0+/JbvERLG2WFzZInah8ZDmnzGizJ1yg9SWjEsqnU9TWji9Lp/KCP8A5z//AFFdoXFITl/KAz/7g4fw12qUiGJ0szmxRN1c+Rwa0eZ0XvleYfsi3n+a/wDyiVQrqumt9HJV188dNSx+vLIcmjp1PQarS8S9p9ktTXx21xutYNAIjwwg9X+Pl9641ibEl0xJWCou1Rxhv0cLBwxRD3W/nuppw52cy4RON6dZa9z7V/JumNu1CpuAlosOd5R0RBa+qOk0o932B+K5pzUItauqNS1FG/TRCiPTBEooReh7BSoUEgAkoDzK7hbpuVbL093E7NeVB0loIiISEREAVSKTgOR2VNEBeg5jRSrWOQs0OoVwCCMxqpOGtHpFCIAiIgB1V5bLrcLU/jtldVUjs8/mZC0H4jZWahQ0nwyGk1pmQdebi69G7msl/SZf3hqQQH8WWWfxyVO5XS4XN3Fcq6qqyNR30pcB5HRWalOlexChFPaRCIik6CKEQEooUEgDMoCSfFUJH8RyGyiR/FoNl4UHSQREQkIiIAiIgCIiAL0xxadF5RAXLJA7oV7VmvbZHN6jqpOdFyiptlad9F7BBGYOaEEoihASihEARFBIG5QEoqbpGjbVU3SE9AhOiq+QN6lUXOLjqvKKCUgiIhIREQBERAEREAREQBERAEREAU7IiAkPcPFeu9d0REGh3ruQQyO6IiDR5L3HxUHXdEQEIiIAiIgCIiAIiIAiIgP/2Q==`,
    chatgptAI: `data:image/jpeg;base64,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viKtjld/haSf5IO8sWnbLp+ExWO00NvYQARSwNj62PMgb/Su0WGNQdJHQNsgLqCprbtNyEdLTOYPpMnVGPdlYR190ldUX6OSl07DFYaN2QZI3drUOGMfHIAb590AjzQSQ4scWtP8O6J7KuUVl5c3MNuhd3z5F5+Q3fmdz4AqDevdZXjXOoJrvfqgyTP2jibtHAzwYweAH1nmcldDUzzVVRJPUyyTTyOLnySOLnOJ5kk7kq0iCIiAiIgIiICE4GSitPd1jtyQUuPWOVwiIoiIgIiICIiArzH52PNWUQfQioY/Ox5qtEEREBERAREQEREBERAREQEREBERAREQEREBEJwMlWnv63LkgPfnYclQiIoiIgIiICIiAiIgIiICra/Gx5KhEH0AgjZFYBI5K42QHnsiK0REBERAREQEREBERAREQEREBEXBIHMoOVw5wb71bdITy2VCDlzi47rhERRERAREQEREBERAREQEREBERAREQcgkciqxJ5hW0QXw4HkVyvnXIcRyKJi+itCQ+iqEmfBBWi4ByuUBEVJdjwQVIrZkPgFSXuPigvKkvA9VaJJ5rhBWZCeWypXCIoiIgIiICIiAiIgIiIP/2Q==`,
    geminiAI: `data:image/jpeg;base64,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`
  };

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const messageDate = new Date();
  const timeString = messageDate
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
    .toLowerCase();
  const dateString = messageDate.toLocaleDateString([], {
    month: "numeric",
    day: "numeric",
    year: "numeric"
  });

  messageDiv.style.opacity = "0.95";

  messageDiv.innerHTML = `
    <div class="message-info">
      <img src="${avatarUrls[aiId]}">
      <h1>${currentChat.name}</h1>
    </div>
    <span class="message-time">${timeString} | ${dateString}</span>
    <div class="message-content">${message}</div>
  `;

  messagesContainer.appendChild(messageDiv);

  if (autoScrollEnabled) {
    scrollToBottom();
  }
}

// Conversation history management
function getConversationHistory(aiId) {
  const historyKey = `aiChatHistory_${aiId}`;
  const history = JSON.parse(localStorage.getItem(historyKey)) || [];
  return history.map((entry) => `${entry.role}: ${entry.text}`).join("\n");
}

function saveToConversationHistory(aiId, userMessage, aiResponse) {
  const historyKey = `aiChatHistory_${aiId}`;
  const history = JSON.parse(localStorage.getItem(historyKey)) || [];

  // Add new messages
  history.push({ role: "User", text: userMessage });
  history.push({ role: currentChat.name, text: aiResponse });

  // Keep only last 15 messages (7 user + 7 AI + current)
  if (history.length > 30) {
    history.splice(0, history.length - 30);
  }

  localStorage.setItem(historyKey, JSON.stringify(history));
}

// toggle chat PFP
function toggleChatPFP() {
  const messagePFPs = document.querySelectorAll(".message-info img");
  const messageTimes = document.querySelectorAll(".message-time");
  const toggleThree = document.querySelector("#idiotBruhThree");

  const firstPFP = messagePFPs[0];
  const currentWidth = window.getComputedStyle(firstPFP).width;

  if (currentWidth === "35px") {
    toggleThree.style.color = "white"; // Or whatever text color you want
    toggleThree.style.backgroundColor = "#4CAF50";
    messagePFPs.forEach((pfp) => {
      pfp.style.width = "45px";
      pfp.style.height = "45px";
      pfp.style.marginBottom = "4.75px";
    });
    messageTimes.forEach((time) => {
      time.style.marginLeft = "20px";
      time.style.marginTop = "5px";
    });
  } else {
    toggleThree.style.color = "";
    toggleThree.style.backgroundColor = "";
    messagePFPs.forEach((pfp) => {
      pfp.style.width = "35px";
      pfp.style.height = "35px";
      pfp.style.marginBottom = "";
    });
    messageTimes.forEach((time) => {
      time.style.marginLeft = "";
      time.style.marginTop = "";
    });
  }
}
