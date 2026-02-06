const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://spgalfxnmzxzzhcxdsuh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1RXpnU7rC9nyBftOYIJFPg_YedDd0ja';

// Test user credentials
const TEST_EMAIL = 'admin@gmail.com';
const TEST_PASSWORD = 'anal123';

async function createTestUser() {
  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log(`Attempting to create user with email: ${TEST_EMAIL}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        emailRedirectTo: 'https://hl-simulator.vercel.app/auth/callback',
      }
    });

    if (error) {
      // Check if it's a "user already exists" error
      if (error.message && error.message.includes('already registered')) {
        console.log(`User already exists: ${TEST_EMAIL}`);
        console.log('Note: If you need to reset the password, use the "Forgot Password" feature on the login page.');
        return;
      }
      throw error;
    }

    console.log('User creation successful!');
    console.log(`User ID: ${data.user?.id}`);
    console.log(`Email: ${data.user?.email}`);
    console.log(`Email Confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
    
    if (data.session) {
      console.log('Session created (user is already authenticated)');
    } else {
      console.log('No session created (may need email verification)');
    }

    console.log('\n✓ Test user created successfully!');
    console.log('\nLogin Instructions:');
    console.log('1. Go to: https://hl-simulator.vercel.app');
    console.log(`2. Email: ${TEST_EMAIL}`);
    console.log(`3. Password: ${TEST_PASSWORD}`);
    console.log('4. On first login, the app will auto-create demo_account');

  } catch (error) {
    console.error('Error creating test user:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    process.exit(1);
  }
}

createTestUser();
