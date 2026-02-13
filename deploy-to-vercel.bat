@echo off
echo Deploying to Vercel...
echo.
echo Make sure you have:
echo   1. Run "npx vercel login" once
echo   2. Set DATABASE_TYPE, MONGODB_URI, MONGODB_DATABASE in Vercel Dashboard after first deploy
echo.
npx vercel --prod
pause
