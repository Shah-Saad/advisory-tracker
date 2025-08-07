# 🔐 User Login Troubleshooting Guide

## ✅ Backend API is Working
I've confirmed that user authentication is working on the backend.

## 👥 Available User Accounts

### Test Users (Team Members):
- **Username**: `saad`
- **Password**: `password`
- **Role**: team_member
- **Team**: Generation

- **Username**: `abc`  
- **Password**: `password`
- **Role**: team_member
- **Team**: Generation

### Admin User:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: admin
- **Team**: None (can access all teams)

## 🌐 Application URLs
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000

## 🔧 Common Login Issues & Solutions

### 1. **"Invalid credentials" error**
**Solution**: Use the correct credentials above
- Regular users: username `saad` or `abc`, password `password`
- Admin: username `admin`, password `admin123`

### 2. **Page won't load**
**Check**: 
- Frontend is running on http://localhost:3001
- Backend is running on http://localhost:3000
- Try refreshing the page

### 3. **Login button doesn't work**
**Check browser console** (F12 → Console tab) for errors

### 4. **"Connection refused" or network errors**
**Solution**: 
```bash
# Restart backend
cd backend
npm start

# Restart frontend (in new terminal)
cd frontend  
npm start
```

### 5. **Users can't see sheets after login**
**This was already fixed** - the team ID mapping issue has been resolved.

## 🧪 Manual API Test
If the web interface isn't working, you can test login directly:

```bash
# Test user login via API
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"saad","password":"password"}' \
  http://localhost:3000/api/users/login
```

Should return a JWT token if successful.

## 📋 What to Try Next

1. **Open browser to**: http://localhost:3001
2. **Use credentials**: 
   - Username: `saad`
   - Password: `password`
3. **After login**, user should see:
   - "My Sheets" page with 2 assigned sheets
   - Navigation menu with team member options
4. **Admin login**: 
   - Username: `admin`
   - Password: `admin123`
   - Should see admin dashboard and all team management features

## 🆘 If Still Having Issues

Please share:
1. The exact error message you're seeing
2. Which URL you're using to access the app
3. Whether you're using the correct credentials
4. Any browser console errors (F12 → Console)

The backend authentication is confirmed working - the issue is likely with frontend access or credential entry.
