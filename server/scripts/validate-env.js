#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set before deployment
 */

const requiredVars = [
  'NOGAL_SUPABASE_URL',
  'NOGAL_SUPABASE_SERVICE_KEY',
  'SEGURNEO_VOICE_API_KEY',
  'GEMINI_API_KEY'
];

const optionalVars = [
  'PORT',
  'NODE_ENV',
  'SEGURNEO_VOICE_API_BASE_URL',
  'NOGAL_API_BASE_URL',
  'NOGAL_API_TIMEOUT',
  'NOGAL_API_KEY'
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  let hasErrors = false;

  // Check required variables
  console.log('📋 Required Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: Missing (REQUIRED)`);
      hasErrors = true;
    } else {
      // Show first 10 characters for security
      const maskedValue = value.substring(0, 10) + '...';
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  });

  console.log('\n📋 Optional Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Show first 10 characters for security
      const maskedValue = value.substring(0, 10) + (value.length > 10 ? '...' : '');
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`⚠️  ${varName}: Not set (using default)`);
    }
  });

  console.log('\n🔍 Environment Summary:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- PORT: ${process.env.PORT || '3000'}`);

  if (hasErrors) {
    console.log('\n❌ Validation failed! Missing required environment variables.');
    console.log('Please check DEPLOYMENT_VARS.md for setup instructions.');
    process.exit(1);
  } else {
    console.log('\n✅ All required environment variables are set!');
    console.log('🚀 Ready for deployment.');
  }
}

// Run validation
validateEnvironment(); 