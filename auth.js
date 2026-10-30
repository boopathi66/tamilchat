import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// SUPABASE SETTINGS
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';

const $ = id => document.getElementById(id);

let supabase = null;
let currentEmail = '';
let currentPurpose = '';

const sections = [
  'loginSection',
  'signupSection',
  'otpSection',
  'forgotSection',
  'resetSection'
];

// PAGE NAVIGATION
function showSection(id) {
  sections.forEach(section => {
    $(section).classList.add('hidden');
  });

  $(id).classList.remove('hidden');
  showStatus('');
}

// STATUS MESSAGE
function showStatus(message, error = false) {
  $('statusMessage').textContent = message;
  $('statusMessage').style.color =
    error ? '#d93652' : '#218553';
}

// SUPABASE CHECK
function connectSupabase() {
  if (
    SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL' ||
    SUPABASE_KEY === 'YOUR_SUPABASE_PUBLISHABLE_KEY'
  ) {
    showStatus(
      'Please configure your Supabase URL and Publishable Key.',
      true
    );
    return false;
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
  } catch (error) {
    showStatus('Supabase connection settings are invalid.', true);
    return false;
  }
}

// NAVIGATION BUTTONS
$('signupLink').addEventListener('click', e => {
  e.preventDefault();
  showSection('signupSection');
});

$('loginLink').addEventListener('click', e => {
  e.preventDefault();
  showSection('loginSection');
});

$('backToLogin').addEventListener('click', e => {
  e.preventDefault();
  showSection('loginSection');
});

$('forgotBack').addEventListener('click', e => {
  e.preventDefault();
  showSection('loginSection');
});

$('forgotLink').addEventListener('click', e => {
  e.preventDefault();
  showSection('forgotSection');
});

// LOGIN
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();

  if (!connectSupabase()) return;

  showStatus('Checking login...');

  const { error } = await supabase.auth.signInWithPassword({
    email: $('loginEmail').value.trim(),
    password: $('loginPassword').value
  });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  location.href = 'chat.html';
});

// SIGN UP
$('signupForm').addEventListener('submit', async e => {
  e.preventDefault();

  if (!connectSupabase()) return;

  const username = $('signupUsername').value.trim();
  const email = $('signupEmail').value.trim();
  const password = $('signupPassword').value;
  const confirm = $('confirmPassword').value;

  if (password !== confirm) {
    showStatus('Passwords do not match.', true);
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    showStatus('Enter a valid username.', true);
    return;
  }

  if (password.length < 8) {
    showStatus('Password must contain 8 characters.', true);
    return;
  }

  showStatus('Creating account...');

  currentEmail = email;
  currentPurpose = 'signup';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  if (data.session) {
    location.href = 'chat.html';
    return;
  }

  showSection('otpSection');
  showStatus('Verification OTP sent to your email.');
});

// FORGOT PASSWORD
$('forgotForm').addEventListener('submit', async e => {
  e.preventDefault();

  if (!connectSupabase()) return;

  currentEmail = $('forgotEmail').value.trim();
  currentPurpose = 'recovery';

  showStatus('Sending recovery OTP...');

  const { error } = await supabase.auth.resetPasswordForEmail(
    currentEmail
  );

  if (error) {
    showStatus(error.message, true);
    return;
  }

  showSection('otpSection');
  showStatus('Recovery OTP sent. Check your email.');
});

// VERIFY OTP
$('otpForm').addEventListener('submit', async e => {
  e.preventDefault();

  if (!supabase && !connectSupabase()) return;

  const token = $('otpCode').value.trim();

  if (!/^[0-9]{6}$/.test(token)) {
    showStatus('Enter a six-digit OTP.', true);
    return;
  }

  showStatus('Verifying OTP...');

  const { error } = await supabase.auth.verifyOtp({
    email: currentEmail,
    token,
    type: currentPurpose
  });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  if (currentPurpose === 'signup') {
    location.href = 'chat.html';
  } else {
    showSection('resetSection');
    showStatus('Email verified. Create a new password.');
  }
});

// RESEND OTP
$('resendOtp').addEventListener('click', async () => {
  if (!supabase && !connectSupabase()) return;

  if (!currentEmail || !currentPurpose) {
    showStatus('Please start again.', true);
    return;
  }

  showStatus('Sending new OTP...');

  let result;

  if (currentPurpose === 'signup') {
    result = await supabase.auth.resend({
      type: 'signup',
      email: currentEmail
    });
  } else {
    result = await supabase.auth.resetPasswordForEmail(
      currentEmail
    );
  }

  if (result.error) {
    showStatus(result.error.message, true);
    return;
  }

  $('otpCode').value = '';
  showStatus('New OTP sent successfully.');
});

// RESET PASSWORD
$('resetForm').addEventListener('submit', async e => {
  e.preventDefault();

  if (!supabase && !connectSupabase()) return;

  const password = $('newPassword').value;
  const confirm = $('repeatPassword').value;

  if (password.length < 8) {
    showStatus('Password must contain 8 characters.', true);
    return;
  }

  if (password !== confirm) {
    showStatus('Passwords do not match.', true);
    return;
  }

  showStatus('Updating password...');

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  await supabase.auth.signOut();

  currentEmail = '';
  currentPurpose = '';

  showSection('loginSection');
  showStatus('Password updated! Please login.');
});

// CHECK EXISTING SESSION
if (connectSupabase()) {
  const { data, error } = await supabase.auth.getSession();

  if (!error && data.session) {
    location.replace('chat.html');
  }
}
