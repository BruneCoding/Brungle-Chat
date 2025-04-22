// firebase initizands dwihh weh i start
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

// Example usage:

// Add this to your init() function
document.getElementById("profile-hex").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    applyCustomTheme();
  }
});

document
  .getElementById("randomizeHex")
  .addEventListener("click", randomizeHexColor);

// Add this to your init() function
// Add this to your init() function
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
    // Calculate new dimensions while maintaining aspect ratio
    let width = this.width;
    let height = this.height;
    const maxWidth = 350;
    const maxHeight = 285;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    // Create canvas to resize the image
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to base64
    const base64 = canvas.toDataURL("image/jpeg", 0.8); // 0.8 quality
    // Add image to message input
    messageInput.value += `<img src="${base64}" class="message-img" style="width: ${width}px; height: ${height}px;">`;
    messageInput.focus();

    // Clean up
    URL.revokeObjectURL(img.src);
  };
  img.onerror = function () {
    alert("Error loading image");
  };
  img.src = URL.createObjectURL(file);
}

// Add this to your init() function or wherever you set up event listeners
document
  .getElementById("delete-account-btn")
  .addEventListener("click", initiateAccountDeletion);

// vars for typing
let typingTimeout = null;
let isTyping = false;
let currentTypingListener = null;

// begin firebase systems
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// elements as a front loader
const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");
const signupBtn = document.getElementById("signup-btn");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const logoutBtn = document.getElementById("logout-btn");
const pfpUserName = document.getElementById("pfpUserName");
const contactsList = document.getElementById("contacts");
const messagesContainer = document.getElementById("messages-container");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const searchContacts = document.getElementById("search-contacts");
const currentChatName = document.getElementById("current-chat-name");

// show app status
let currentUser = null;
let currentChat = {
  type: "global",
  id: "global",
  name: "Global Chat"
};
let users = [];
let groups = [];
let unsubscribeMessages = null;

// begin the app
init();

function init() {
  setupMessagePopup();
  // check log in sign up status
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      setupChatApp();
    } else {
      showAuthScreen();
    }
  });

  // vars to funcs basically

  signupBtn.addEventListener("click", handleSignup);
  logoutBtn.addEventListener("click", handleLogout);
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  searchContacts.addEventListener("input", filterContacts);
}

function showAuthScreen() {
  authScreen.classList.remove("hidden");
  chatScreen.classList.add("hidden");
}

function showChatScreen() {
  authScreen.classList.add("hidden");
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
  loadGroups(); // Add this line
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
    lastMessage.length > 20 ? "..." : ""
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
    document
      .querySelectorAll(".personChat:not(.pinned)")
      .forEach((el) => el.remove());

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

  // Apply theme color if it exists
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

  // Check if user is Brune
  const isBrune = displayUsername === "Brune";
  const devTag = isBrune ? '<span class="devtag">⚡DEV</span>' : "";

  // Determine which image source to use
  const avatarSrc = user.profilePhoto
    ? user.profilePhoto
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayUsername.substring(0, 1)
      )}&background=722fca&color=fff`;

  contactDiv.innerHTML = `
    <img src="${avatarSrc}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(
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

  contactsList.appendChild(contactDiv);
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

    changeToPfp.innerHTML = `<img src="${avatarSrc}" alt="${username}'s profile picture" class="chat-pfp">`;
  } else if (currentChat.type === "group") {
    changeToPfp.innerHTML = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
      currentChat.name.substring(0, 2)
    )}&background=4e4376&color=fff" alt="${
      currentChat.name
    } group picture" class="chat-pfp">`;
  }
}
// Modify the switchChat function to call this
function switchChat(type, id, name = null) {
  if (currentTypingListener) {
    currentTypingListener();
    currentTypingListener = null;
  }

  autoScrollEnabled = true;

  if (unsubscribeMessages) unsubscribeMessages();

  currentChat = { type, id, name: name || id };
  currentChatName.textContent = name || id;

  document.querySelectorAll(".personChat").forEach((chat) => {
    chat.classList.remove("active-chat");
  });

  const selector =
    type === "private"
      ? `.personChat[data-user-id="${id}"]`
      : type === "group"
      ? `.groupChat[data-group-id="${id}"]`
      : '.personChat[data-chat-id="global"]';

  const activeChat = document.querySelector(selector);
  if (activeChat) activeChat.classList.add("active-chat");

  messagesContainer.innerHTML = "";

  // Update the profile picture based on chat type
  updateChatProfilePicture();

  setupMessageListener();
  setupTypingListener();
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
      displayMessage(data, false); // It's not a *newly sent* message from this user
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
    ); // true means this is a new message

    // Add animation class
    messageElement.classList.add("message-animation-enter");

    // Remove animation class after animation completes
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
      <h1>${escapeHtml(message.senderUsername || "Unknown")} ${devTag}</h1>
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
        // "--message-bg": "#646670",
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
        "--a37fdf-85": "rgba(163, 121, 223, 0.85)"
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
        // "--message-bg": "#706464",
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
        "--a37fdf-85": "rgba(223, 121, 121, 0.85)"
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
        // "--message-bg": "#70647a",
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
        "--a37fdf-85": "rgba(163, 121, 223, 0.85)"
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

    // Add activegenius class to the selected element
    if (element) {
      element.classList.add("activegenius");
    }
  }

  // Event listeners for theme selection
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

  // Initialize with default theme
  applyTheme(themes.default, defaultTheme);
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

  groupDiv.innerHTML = `
    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
      group.name.substring(0, 2)
    )}&background=4e4376&color=fff">
    <div class="columnizer">
      <h1>${group.name}</h1>
      <h3>Group • ${group.members.length} members</h3>
      <p>Group created</p>
    </div>
  
  `;

  groupDiv.addEventListener("click", () => {
    switchChat("group", group.id, group.name);
  });

  // Insert after global chat but before other contacts
  const globalChat = document.querySelector(
    '.personChat[data-chat-id="global"]'
  );
  if (globalChat) {
    globalChat.insertAdjacentElement("afterend", groupDiv);
  } else {
    contactsList.insertBefore(groupDiv, contactsList.firstChild);
  }
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
    const usernameElement = document.getElementById('account-username-popup');
    if (user.username.length > 6) {
        usernameElement.style.fontSize = '10px';
        usernameElement.style.marginTop = '10px';
    } else {
        usernameElement.style.fontSize = '';
        usernameElement.style.marginTop = '5px';
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
    document.getElementById('account-gmail-popup').textContent = `Email: ${user.email || 'No email'}`;
    document.getElementById('account-img-popup').src = user.profilePhoto || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username.substring(0, 1))}&background=722fca&color=fff`;
    
    const popupBg = document.getElementById('account-background-popup');
    if (user.themeColor) {
        popupBg.style.backgroundColor = user.themeColor;
        popupBg.style.backgroundImage = `linear-gradient(135deg, ${user.themeColor}, ${adjustColor(user.themeColor, -20)})`;
    } else {
        popupBg.style.backgroundColor = '';
        popupBg.style.backgroundImage = '';
    }
    
    document.getElementById('account-bio').value = user.bio || '';
    
    popup.style.display = 'block';
    popup.style.opacity = '1';
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
    }, 5000);
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
