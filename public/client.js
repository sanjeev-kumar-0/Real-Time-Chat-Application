const socket = io();

// Elements
const usernameEl = document.getElementById('username');
const joinBtn = document.getElementById('joinBtn');
const userBox = document.getElementById('userBox');
const chatArea = document.getElementById('chatArea');
const messagesEl = document.getElementById('messages');
const sendForm = document.getElementById('sendForm');
const messageInput = document.getElementById('messageInput');
const typingEl = document.getElementById('typing');

let username = '';
let typingTimeout = null;

function appendMessage(item, options = {}) {
  const li = document.createElement('li');
  li.className = options.className || '';

  if (item.system) {
    li.textContent = `* ${item.text}`;
    li.classList.add('system');
  } else {
    // Mark messages sent by the current user so we can style/align them differently
    if (username && item.user === username) {
      li.classList.add('me');
    }

    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = item.user + ': ';

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = item.text;

    li.appendChild(who);
    li.appendChild(text);
    const time = document.createElement('span');
    time.className = 'time muted';
    time.textContent = new Date(item.time).toLocaleTimeString();
    li.appendChild(time);
  }

  messagesEl.appendChild(li);
  // ensure newest message is visible
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Receive history
socket.on('history', (msgs) => {
  msgs.forEach(m => appendMessage(m));
});

socket.on('message', (m) => appendMessage(m));

socket.on('system', (text) => {
  appendMessage({ system: true, text });
});

socket.on('typing', ({ user, isTyping }) => {
  if (isTyping) {
    typingEl.textContent = `${user} is typing...`;
  } else {
    typingEl.textContent = '';
  }
});

joinBtn.addEventListener('click', () => {
  const name = usernameEl.value.trim() || 'Anonymous';
  username = name;
  socket.emit('join', username);
  userBox.style.display = 'none';
  chatArea.classList.remove('hidden');
  messageInput.focus();
});

sendForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = messageInput.value.trim();
  if (!val) return;
  socket.emit('message', val);
  messageInput.value = '';
  socket.emit('typing', false);
});

messageInput.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit('typing', false), 700);
});

// Simple UX: press Enter to join if not joined
usernameEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    joinBtn.click();
  }
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendForm.dispatchEvent(new Event('submit'));
  }
});
