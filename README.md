# 🚀 VS Code Setup Commands for AgriTrade

## Quick Setup (Run these commands in VS Code Terminal)

### Step 1: Kill Process on Port 3000 (if needed)

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the number from above command)
taskkill /PID 25908 /F
```

Or use this one-liner:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Step 2: Navigate to Project Directory

```powershell
cd agri-product
```

### Step 3: Install Dependencies

```powershell
npm install
```

### Step 4: Set Up Environment Variables

Create `.env.local` file in the `agri-product` folder:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### Step 5: Build the Project

```powershell
npm run build
```

### Step 6: Start the Development Server

```powershell
npm run dev
```

Or for production:

```powershell
npm start
```

---

## Complete Setup Script (Copy & Paste All at Once)

```powershell
# Navigate to project
cd agri-product

# Kill any process on port 3000
$port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port) {
    $pid = $port.OwningProcess
    Stop-Process -Id $pid -Force
    Write-Host "Killed process $pid on port 3000" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

# Start server
Write-Host "Starting server..." -ForegroundColor Green
npm run dev
```

---

## Alternative: Use Different Port

If you want to use a different port (e.g., 3001):

### Option 1: Modify package.json
Add to scripts:
```json
"dev": "next dev -p 3001"
```

### Option 2: Use Environment Variable
Create `.env.local`:
```env
PORT=3001
```

### Option 3: Run with Port Flag
```powershell
npm run dev -- -p 3001
```

---

## Troubleshooting Commands

### Check if Node.js is installed
```powershell
node --version
npm --version
```

### Clear npm cache
```powershell
npm cache clean --force
```

### Remove node_modules and reinstall
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Check what's using port 3000
```powershell
netstat -ano | findstr :3000
```

### Kill all Node processes (use with caution)
```powershell
Get-Process node | Stop-Process -Force
```

---

## VS Code Terminal Shortcuts

- **Open Terminal**: `` Ctrl + ` `` (backtick)
- **New Terminal**: `` Ctrl + Shift + ` ``
- **Split Terminal**: `` Ctrl + Shift + 5 ``
- **Kill Terminal**: `` Ctrl + Shift + Backspace ``

---

## Recommended VS Code Extensions

1. **ES7+ React/Redux/React-Native snippets**
2. **Prettier - Code formatter**
3. **ESLint**
4. **GitLens**
5. **Thunder Client** (for API testing)

---

## Quick Start Checklist

- [ ] Kill process on port 3000
- [ ] Navigate to `agri-product` folder
- [ ] Run `npm install`
- [ ] Create `.env.local` with MongoDB URI
- [ ] Run `npm run build`
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000` in browser

---

## Common Issues & Solutions

### Issue: "Port 3000 already in use"
**Solution:**
```powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Issue: "Module not found"
**Solution:**
```powershell
npm install
```

### Issue: "Build failed"
**Solution:**
```powershell
# Clear cache and rebuild
npm cache clean --force
Remove-Item -Recurse -Force .next
npm run build
```

### Issue: "MongoDB connection error"
**Solution:**
- Check `.env.local` file exists
- Verify `MONGODB_URI` is correct
- Ensure MongoDB is running (if local) or accessible (if cloud)

---

## Production Build Commands

```powershell
# Build for production
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "agritrade" -- start
```

---

**Note:** Make sure you're in the `agri-product` directory before running these commands!

