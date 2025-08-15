const socket = io();

const usernameInput = document.getElementById('username');
const connectBtn = document.getElementById('connectBtn');
const status = document.getElementById('status');
const chatUI = document.getElementById('chatUI');
const chatBox = document.getElementById('chatBox');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');

let connected = false;
let username = '';
let typing = false;
let typingTimeout;

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function displayMessage(from, text) {
  const msg = document.createElement('div');
  msg.classList.add('message');

  const isSelf = from === username || from === 'You';
  msg.classList.add(isSelf ? 'self' : 'other');

  const time = getCurrentTime();

  if (from === 'System') {
    msg.innerHTML = `<em style="color: #555;">${text} <span class="timestamp">${time}</span></em>`;
  } else {
    const senderName = isSelf ? '' : `<strong>${from}</strong><br>`;
    msg.innerHTML = `${senderName}${text}<span class="timestamp">${time}</span>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

connectBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (!username) {
    alert('Please enter your name first.');
    return;
  }

  if (!connected) {
    socket.emit('join', username);
    connectBtn.textContent = 'Connecting...';
    connectBtn.disabled = true;
    status.textContent = 'Looking for a stranger...';
    connected = true;
  }
});

socket.on('waiting', () => {
  status.textContent = 'Waiting for another user to connect...';
});

socket.on('matched', (partnerName) => {
  status.textContent = `You are now chatting with ${partnerName}.`;
  chatUI.classList.remove('hidden');
  connectBtn.textContent = 'Connected';
});

socket.on('message', (data) => {
  displayMessage(data.from, data.text);
});

socket.on('partnerDisconnected', () => {
  displayMessage('System', 'Your chat partner has disconnected.');
  chatUI.classList.add('hidden');
  connectBtn.textContent = 'Connect';
  connectBtn.disabled = false;
  status.textContent = 'Click connect to start chatting.';
  connected = false;
});

// Typing indicator logic
messageInput.addEventListener('input', () => {
  if (!typing) {
    typing = true;
    socket.emit('typing', true);
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typing = false;
    socket.emit('typing', false);
  }, 1000);
});

socket.on('typing', (isTyping) => {
  typingIndicator.style.display = isTyping ? 'block' : 'none';
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (msg) {
    socket.emit('message', msg);
    displayMessage('You', msg);
    messageInput.value = '';
    socket.emit('typing', false); // stop typing immediately
    typing = false;
    clearTimeout(typingTimeout);
  }
});
