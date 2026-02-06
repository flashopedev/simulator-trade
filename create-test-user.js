const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://spgalfxnmzxzzhcxdsuh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja';

const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestUser() {
  const email = 'admin@gmail.com';
  const password = 'anal123';

  console.log(`Creating user: ${email}`);
  console.log(`Using key type: ${isServiceRole ? 'service_role' : 'anon'}\n`);

  let userId;

  if (isServiceRole) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log('User already exists, fetching...');
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email === email);
        if (existing) {
          userId = existing.id;
          console.log(`Found existing user: ${userId}`);
        } else {
          throw new Error('User exists but could not be found');
        }
      } else {
        throw error;
      }
    } else {
      userId = data.user.id;
      console.log(`User created (auto-confirmed): ${userId}`);
    }
  } else {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already registered')) {
        console.log('User already registered. Trying to sign in...');
        const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        userId = signIn.user.id;
        console.log(`Signed in as existing user: ${userId}`);
      } else {
        throw error;
      }
    } else {
      userId = data.user?.id;
      if (data.user?.identities?.length === 0) {
        console.log('User already exists (empty identities). Trying sign in...');
        const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        userId = signIn.user.id;
      } else {
        console.log(`User created: ${userId}`);
        if (data.session) {
          console.log('Session obtained — user is auto-confirmed.');
        } else {
          console.log('No session — email confirmation may be required.');
          console.log('  Go to Supabase Dashboard -> Authentication -> Settings');
          console.log('  and disable "Enable email confirmations" to auto-confirm,');
          console.log('  or confirm the user manually in Authentication -> Users.');
        }
      }
    }
  }

  if (!userId) {
    console.error('Failed to obtain user ID.');
    process.exit(1);
  }

  // Create demo_account
  console.log('\nCreating demo account with balance 10000...');
  const { data: existing } = await supabase
    .from('demo_accounts')
    .select('id, balance')
    .eq('user_id', userId)
    .single();

  if (existing) {
    console.log(`Demo account already exists. Balance: ${existing.balance}`);
  } else {
    const { error: insertErr } = await supabase
      .from('demo_accounts')
      .insert({ user_id: userId, balance: 10000 });
    if (insertErr) {
      console.log(`Could not create demo account: ${insertErr.message}`);
      console.log('(RLS may block this. The app creates it automatically on first login.)');
    } else {
      console.log('Demo account created with balance 10000.');
    }
  }

  // Verify sign-in
  console.log('\nVerifying sign-in...');
  const { data: verify, error: verifyErr } = await supabase.auth.signInWithPassword({ email, password });
  if (verifyErr) {
    console.log(`Sign-in verification failed: ${verifyErr.message}`);
    if (verifyErr.message.includes('Email not confirmed')) {
      console.log('\n=== ACTION REQUIRED ===');
      console.log('User created but email not confirmed.');
      console.log('Go to: https://supabase.com/dashboard');
      console.log('1. Open project -> Authentication -> Users');
      console.log('2. Find admin@gmail.com');
      console.log('3. Click three dots -> Confirm user');
      console.log('========================\n');
    }
  } else {
    console.log('Sign-in successful!');
    console.log(`User ID: ${verify.user.id}`);
    console.log(`Email: ${verify.user.email}`);
    console.log(`\nUser admin@gmail.com is ready.`);
    console.log(`Login at: https://hl-simulator.vercel.app`);
  }
}

createTestUser().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
