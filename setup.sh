#!/bin/bash

echo "🚀 Setting up Stair Forecast Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️  Setting up database..."
npm run db:push

echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "✅ Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Use the sample data or upload your own CSV file"
echo ""
echo "📚 Useful commands:"
echo "- npm run dev: Start development server"
echo "- npm run db:seed: Add sample data"
echo "- npm run db:reset-seed: Reset database and reseed"
echo "- npm run lint: Check code quality"