import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentEmail = '';
let currentPurpose = '';

const sections = [
  'loginSection',
  'signupSection',
  'otpSection',
  'forgotSection',
  'resetSection'
];

function showSection(id) {
  sections.forEach(s =>
    document.getElementById(s).classList.add('hidden')
  );
  document.getElementById(id).classList.remove('hidden');
  showStatus('');
}

function showStatus(message, error = false) {
  const el = document.getElementById('statusMessage');
  el.textContent = message;
  el.style.color = error ? '#d93652' : '#218553';
}

const { data: initial } = await supabase.auth.getSession();

if (initial.session) {
  location.replace('chat.html');
}

document.getElementById('signupLink').onclick = e => {
  e.preventDefault();
  showSection('signupSection');
};

document.getElementById('loginLink').onclick = e => {
  e.preventDefault();
  showSection('loginSection');
};

document.getElementById('backToLogin').onclick = e => {
  e.preventDefault();
  showSection('loginSection');
};

document.getElementById('forgotBack').onclick = e => {
  e.preventDefault();
  showSection('loginSection');
};

document.getElementById('forgotLink').onclick = e => {
  e.preventDefault();
  showSection('forgotSection');
};

// LOGIN
document.getElementById('loginForm').onsubmit = async e => {
  e.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  showStatus('Checking your account...');

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return showStatus(error.message, true);

  location.replace('chat.html');
};

// SIGNUP
document.getElementById('signupForm').onsubmit = async e => {
  e.preventDefault();

  const username = signupUsername.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const confirm = confirmPassword.value;

  if (password !== confirm)
    return showStatus('Passwords do not match.', true);

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
    return showStatus('Invalid username.', true);

  if (password.length < 8)
    return showStatus('Password must be at least 8 characters.', true);

  currentEmail = email;
  currentPurpose = 'signup';

  showStatus('Sending verification OTP...');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) return showStatus(error.message, true);

  if (data.session) {
    location.replace('chat.html');
    return;
  }

  showSection('otpSection');
  showStatus('OTP sent to your email.');
};

// FORGOT PASSWORD
document.getElementById('forgotForm').onsubmit = async e => {
  e.preventDefault();

  currentEmail = forgotEmail.value.trim();
  currentPurpose = 'recovery';

  showStatus('Sending recovery OTP...');

  const { error } = await supabase.auth.resetPasswordForEmail(
    currentEmail
  );

  if (error) return showStatus(error.message, true);

  showSection('otpSection');
  showStatus('Recovery OTP sent to your email.');
};

// OTP VERIFICATION
document.getElementById('otpForm').onsubmit = async e => {
  e.preventDefault();

  const token = otpCode.value.trim();

  if (!/^[0-9]{6}$/.test(token))
    return showStatus('Enter a valid six-digit OTP.', true);

  showStatus('Verifying OTP...');

  const { error } = await supabase.auth.verifyOtp({
    email: currentEmail,
    token,
    type: currentPurpose === 'signup' ? 'signup' : 'recovery'
  });

  if (error) return showStatus(error.message, true);

  if (currentPurpose === 'signup') {
    location.replace('chat.html');
  } else {
    showSection('resetSection');
    showStatus('Email verified. Create your new password.');
  }
};

// RESEND OTP
document.getElementById('resendOtp').onclick = async () => {
  if (!currentEmail || !currentPurpose)
    return showStatus('Start the process again.', true);

  showStatus('Sending a new OTP...');

  let error;

  if (currentPurpose === 'signup') {
    ({ error } = await supabase.auth.resend({
      type: 'signup',
      email: currentEmail
    }));
  } else {
    ({ error } = await supabase.auth.resetPasswordForEmail(
      currentEmail
    ));
  }

  if (error) return showStatus(error.message, true);

  otpCode.value = '';
  showStatus('New OTP sent. Check your email.');
};

// RESET PASSWORD
document.getElementById('resetForm').onsubmit = async e => {
  e.preventDefault();

  const password = newPassword.value;
  const confirm = repeatPassword.value;

  if (password.length < 8)
    return showStatus('Password must have at least 8 characters.', true);

  if (password !== confirm)
    return showStatus('Passwords do not match.', true);

  showStatus('Updating password...');

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) return showStatus(error.message, true);

  await supabase.auth.signOut();

  currentEmail = '';
  currentPurpose = '';

  showSection('loginSection');
  showStatus('Password updated successfully. Please login.');
};
