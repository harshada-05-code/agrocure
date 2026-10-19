const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[AgroCure Build] Starting frontend build for deployment...');

try {
  const frontendDir = path.resolve(__dirname, 'frontend');
  const srcDist = path.resolve(frontendDir, 'dist');
  const rootDist = path.resolve(__dirname, 'dist');

  // 1. Install frontend dependencies
  console.log('[AgroCure Build] Installing frontend dependencies...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

  // 2. Build Vite production bundle
  console.log('[AgroCure Build] Compiling Vite bundle...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

  // 3. Mirror dist to root dist for static host compatibility (Vercel, Netlify, Render)
  if (fs.existsSync(srcDist)) {
    console.log('[AgroCure Build] Mirroring frontend/dist to root dist/ for hosting compatibility...');
    fs.cpSync(srcDist, rootDist, { recursive: true, force: true });
  }

  console.log('[AgroCure Build] Build completed successfully! Output ready in frontend/dist and dist/');
} catch (error) {
  console.error('[AgroCure Build] Build failed:', error);
  process.exit(1);
}
