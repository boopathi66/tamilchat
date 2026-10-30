// TAMIL SUPERIOR CHAT - JAVASCRIPT

const roles = ['member', 'leader', 'moderator', 'admin'];

let members = JSON.parse(localStorage.getItem('ts_members')) || [
  {id: 1, name: 'Boopathi', role: 'owner', badges: []},
  {id: 2, name: 'TamilKing', role: 'moderator', badges: []},
  {id: 3, name: 'CricketFan', role: 'leader', badges: []},
  {id: 4, name: 'Friend123', role: 'member', badges: []}
];

let badges = JSON.parse(localStorage.getItem('ts_badges')) || [];

let messages = JSON.parse(localStorage.getItem('ts_messages')) || [
  {user: 'TamilKing', text: 'Welcome to Tamil Superior Chat! 😊', time: 'Welcome'},
  {user: 'CricketFan', text: 'Hello everyone! ❤️', time: 'Welcome'}
];

let invisible = localStorage.getItem('ts_invisible') === 'true';
let chatEnabled = true;

// SAVE DATA

function save() {
  localStorage.setItem('ts_members', JSON.stringify(members));
  localStorage.setItem('ts_badges', JSON.stringify(badges));
  localStorage.setItem('ts_messages', JSON.stringify(messages));
  localStorage.setItem('ts_invisible', String(invisible));
}

// ROLE DISPLAY

function roleName(role) {
  return {
    owner: '👑 OWNER',
    admin: '🛡️ ADMIN',
    moderator: '🔰 MODERATOR',
    leader: '⭐ LEADER',
    member: 'MEMBER'
  }[role] || 'MEMBER';
}

// DISPLAY MESSAGES

function renderMessages() {
  const box = document.getElementById('messages');
  box.replaceChildren();

  messages.forEach(m => {
    const member = members.find(x => x.name === m.user);
    const article = document.createElement('article');
    article.className = 'message';

    const heading = document.createElement('div');

    const username = document.createElement('strong');
    username.className = 'username';
    username.textContent = m.user;

    const role = document.createElement('span');
    role.className = 'role';
    role.textContent = roleName(member?.role || 'member');

    heading.append(username, role);

    (member?.badges || []).forEach(id => {
      const badge = badges.find(b => b.id === id);

      if (badge) {
        const img = document.createElement('img');
        img.className = 'badge-img';
        img.src = badge.image;
        img.alt = badge.name;
        img.title = badge.name;
        heading.append(img);
      }
    });

    const text = document.createElement('p');
    text.className = 'message-text';
    text.textContent = m.text;

    const time = document.createElement('small');
    time.className = 'message-time';
    time.textContent = m.time;

    article.append(heading, text, time);
    box.append(article);
  });

  box.scrollTop = box.scrollHeight;
}

// ONLINE MEMBERS

function renderMembers() {
  const box = document.getElementById('onlineMembers');
  box.replaceChildren();

  members
    .filter(m => m.id !== 1 || !invisible)
    .forEach(m => {
      const div = document.createElement('div');
      div.className = 'online-user';
      div.textContent = '🟢 ' + m.name;

      const small = document.createElement('small');
      small.textContent = roleName(m.role);

      div.append(small);
      box.append(div);
    });

  document.getElementById('onlineCount').textContent =
    members.filter(m => m.id !== 1 || !invisible).length;
}

// SEND MESSAGE

function sendMessage() {
  if (!chatEnabled) {
    alert('Chat is currently disabled by Owner.');
    return;
  }

  const input = document.getElementById('messageInput');
  const text = input.value.trim();

  if (!text) return;

  messages.push({
    user: 'Boopathi',
    text: text,
    time: new Date().toLocaleTimeString()
  });

  input.value = '';
  save();
  renderMessages();
}

// EMOJIS

function addEmoji(emoji) {
  const input = document.getElementById('messageInput');
  input.value += emoji;
  input.focus();
}

// OWNER PORTAL

function openOwner() {
  document.getElementById('ownerPanel').style.display = 'block';
  renderOwner();
}

function closeOwner() {
  document.getElementById('ownerPanel').style.display = 'none';
}

// INVISIBLE MODE

function toggleInvisible() {
  invisible = document.getElementById('invisibleToggle').checked;

  save();
  renderMembers();
}

// UPLOAD PNG BADGE

function uploadBadge() {
  const name = document.getElementById('badgeName').value.trim();
  const category = document.getElementById('badgeCategory').value;
  const file = document.getElementById('badgeFile').files[0];

  if (!name || !file) {
    alert('Enter a badge name and select a PNG file.');
    return;
  }

  if (
    file.type !== 'image/png' ||
    !file.name.toLowerCase().endsWith('.png')
  ) {
    alert('Only PNG images are allowed.');
    return;
  }

  if (file.size > 262144) {
    alert('Maximum image size is 256 KB.');
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    badges.push({
      id: Date.now().toString(),
      name: name,
      category: category,
      image: reader.result
    });

    save();
    renderOwner();

    document.getElementById('badgeName').value = '';
    document.getElementById('badgeFile').value = '';

    alert('Badge uploaded successfully!');
  };

  reader.readAsDataURL(file);
}

// ASSIGN BADGE

function assignBadge() {
  const memberId = Number(
    document.getElementById('badgeMember').value
  );

  const badgeId =
    document.getElementById('badgeSelect').value;

  const member = members.find(m => m.id === memberId);

  if (!member || !badgeId) {
    alert('Select a member and badge.');
    return;
  }

  if (member.badges.includes(badgeId)) {
    alert('Badge already assigned.');
    return;
  }

  member.badges.push(badgeId);

  save();
  renderOwner();
  renderMessages();

  alert('Badge assigned successfully!');
}

// PROMOTE MEMBER

function promote(id) {
  const member = members.find(m => m.id === id);

  if (!member || member.role === 'owner' ||
      member.role === 'admin') return;

  const index = roles.indexOf(member.role);

  if (index < 0 || index >= roles.length - 1) return;

  member.role = roles[index + 1];

  save();
  renderOwner();
  renderMembers();
  renderMessages();
}

// DEMOTE MEMBER

function demote(id) {
  const member = members.find(m => m.id === id);

  if (!member || member.role === 'owner') return;

  if (member.role === 'admin') {
    member.role = 'moderator';
  } else if (member.role === 'moderator') {
    member.role = 'leader';
  } else if (member.role === 'leader') {
    member.role = 'member';
  }

  save();
  renderOwner();
  renderMembers();
  renderMessages();
}

// REMOVE BADGE

function removeBadge(id) {
  badges = badges.filter(b => b.id !== id);

  members.forEach(m => {
    m.badges = m.badges.filter(x => x !== id);
  });

  save();
  renderOwner();
  renderMessages();
}

// OWNER DASHBOARD DISPLAY

function renderOwner() {
  document.getElementById('invisibleToggle').checked = invisible;

  const collection = document.getElementById('badgeCollection');
  collection.replaceChildren();

  badges.forEach(b => {
    const card = document.createElement('div');
    card.className = 'badge-card';

    const img = document.createElement('img');
    img.src = b.image;
    img.alt = b.name;

    const label = document.createElement('strong');
    label.textContent = b.name;

    const del = document.createElement('button');
    del.textContent = 'Remove';
    del.onclick = () => removeBadge(b.id);

    card.append(img, label, del);
    collection.append(card);
  });

  const memberSelect = document.getElementById('badgeMember');
  memberSelect.replaceChildren();

  members
    .filter(m => m.role !== 'owner')
    .forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.name;
      memberSelect.append(option);
    });

  const badgeSelect = document.getElementById('badgeSelect');
  badgeSelect.replaceChildren();

  badges.forEach(b => {
    const option = document.createElement('option');
    option.value = b.id;
    option.textContent = b.name + ' (' + b.category + ')';
    badgeSelect.append(option);
  });

  const management = document.getElementById('memberManagement');
  management.replaceChildren();

  members.forEach(m => {
    const card = document.createElement('div');
    card.className = 'member-card';

    const title = document.createElement('strong');
    title.textContent = m.name + ' – ' + roleName(m.role);

    card.append(title);

    if (m.role !== 'owner') {
      const up = document.createElement('button');
      up.textContent = 'Promote ↑';
      up.onclick = () => promote(m.id);

      const down = document.createElement('button');
      down.textContent = 'Demote ↓';
      down.style.marginLeft = '6px';
      down.onclick = () => demote(m.id);

      card.append(up, down);
    }

    management.append(card);
  });
}

// CHAT APPEARANCE

function changeBackground() {
  document.querySelector('.messages').style.background =
    document.getElementById('chatColor').value;
}

// ENABLE / DISABLE CHAT

function toggleChat() {
  chatEnabled =
    document.getElementById('chatEnabled').checked;
}

// INITIALIZE WEBSITE

renderMessages();
renderMembers();
