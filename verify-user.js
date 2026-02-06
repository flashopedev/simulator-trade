const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://spgalfxnmzxzzhcxdsuh.supabase.co',
  'sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verify() {
  const email = 'admin@gmail.com';
  const password = 'anal123';

  console.log(`Attempting sign-in as ${email}...`);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.log(`Sign-in failed: ${error.message}`);

    if (error.message.includes('Invalid login credentials')) {
      console.log('\nPossible causes:');
      console.log('1. User does not exist yet');
      console.log('2. Email is not confirmed');
      console.log('3. Wrong password');
      console.log('\n=== MANUAL STEPS ===');
      console.log('Go to: https://supabase.com/dashboard');
      console.log('1. Open your project -> Authentication -> Users');
      console.log('2. If admin@gmail.com exists but unconfirmed:');
      console.log('   Click three dots -> Confirm user');
      console.log('3. If admin@gmail.com does NOT exist:');
      console.log('   Click "Add user" -> Create new user');
      console.log('   Email: admin@gmail.com');
      console.log('   Password: anal123');
      console.log('   Check "Auto Confirm User"');
      console.log('====================');
    }
    return;
  }

  console.log('Sign-in successful!');
  console.log(`User ID: ${data.user.id}`);
  console.log(`Email: ${data.user.email}`);
  console.log(`Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

  // Check demo account
  const { data: demo, error: demoErr } = await supabase
    .from('demo_accounts')
    .select('*')
    .eq('user_id', data.user.id)
    .single();

  if (demo) {
    console.log(`\nDemo account exists. Balance: ${demo.balance}`);
  } else {
    console.log(`\nNo demo account found. Creating...`);
    const { error: insertErr } = await supabase
      .from('demo_accounts')
      .insert({ user_id: data.user.id, balance: 10000 });
    if (insertErr) {
      console.log(`Insert failed: ${insertErr.message}`);
      console.log('The app will create it on first login.');
    } else {
      console.log('Demo account created with balance 10000.');
    }
  }

  console.log(`\nUser admin@gmail.com is ready.`);
  console.log(`Login at: https://hl-simulator.vercel.app`);
}

verify().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
