@echo off
echo Creating Office Supplies Management Production Package...
echo.

REM Create main production folder
if not exist "office-supplies-management-production" mkdir "office-supplies-management-production"
cd office-supplies-management-production

REM Create main directory structure
mkdir src
mkdir prisma
mkdir docs
mkdir public
mkdir scripts

echo ✅ Created main directory structure

REM Copy complete src folder (all application code)
echo Copying source code...
xcopy /E /I /Y "..\src" "src"

REM Copy prisma folder (excluding dev database)
echo Copying database schema and migrations...
xcopy /E /I /Y "..\prisma\schema.prisma" "prisma\"
xcopy /E /I /Y "..\prisma\migrations" "prisma\migrations"
xcopy /E /I /Y "..\prisma\comprehensive-seed.ts" "prisma\"

REM Copy complete docs folder
echo Copying documentation...
xcopy /E /I /Y "..\docs" "docs"

REM Copy public folder
echo Copying static assets...
xcopy /E /I /Y "..\public" "public"

REM Copy essential configuration files
echo Copying configuration files...
copy "..\package.json" .
copy "..\package-lock.json" .
copy "..\tsconfig.json" .
copy "..\next.config.ts" .
copy "..\tailwind.config.mjs" .
copy "..\postcss.config.mjs" .
copy "..\eslint.config.mjs" .
copy "..\jest.config.js" .

REM Copy essential documentation files
copy "..\README.md" .
copy "..\PRODUCTION_READINESS.md" .
copy "..\COMPREHENSIVE_TEST_REPORT.md" .
copy "..\ACCESS_CONTROL_DOCUMENTATION.md" .
copy "..\USER_CREDENTIALS_AND_TROUBLESHOOTING.md" .
copy "..\test-credentials.md" .

REM Copy essential scripts (only production-needed ones)
echo Copying essential scripts...
copy "..\scripts\seed.ts" "scripts\"
copy "..\scripts\comprehensive-seed.ts" "scripts\"
copy "..\scripts\check-database-status.ts" "scripts\"
copy "..\scripts\requirements.txt" "scripts\"

REM Create .env.example file
echo Creating environment template...
echo # Office Supplies Management System Environment Variables > .env.example
echo # Database >> .env.example
echo DATABASE_URL="file:./dev.db" >> .env.example
echo. >> .env.example
echo # NextAuth Configuration >> .env.example
echo NEXTAUTH_URL="http://localhost:3000" >> .env.example
echo NEXTAUTH_SECRET="your-secret-key-here" >> .env.example
echo. >> .env.example
echo # Production Database (PostgreSQL) >> .env.example
echo # DATABASE_URL="postgresql://username:password@localhost:5432/office_supplies" >> .env.example

echo.
echo ✅ Production package created successfully!
echo.
echo 📁 Package contents:
echo   ├── src/                    # Complete application source code
echo   ├── prisma/                 # Database schema and migrations
echo   ├── docs/                   # Complete documentation
echo   ├── public/                 # Static assets
echo   ├── scripts/                # Essential database scripts
echo   ├── package.json            # Dependencies and scripts
echo   ├── tsconfig.json           # TypeScript configuration
echo   ├── next.config.ts          # Next.js configuration
echo   ├── README.md               # Project documentation
echo   ├── .env.example            # Environment variables template
echo   └── Other config files      # ESLint, Tailwind, etc.
echo.
echo 🚀 Ready for production deployment!
echo.
pause