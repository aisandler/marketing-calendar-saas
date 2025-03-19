#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}        Marketing Calendar Demo Setup Assistant${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Check for Docker
echo -e "\n${YELLOW}Checking for Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please install Docker first:${NC}"
    echo -e "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed and running${NC}"

# Check for Node/npm
echo -e "\n${YELLOW}Checking for Node.js and npm...${NC}"
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${RED}Node.js or npm not found. Please install Node.js first:${NC}"
    echo -e "Visit: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js and npm are installed${NC}"

# Check for Supabase CLI
echo -e "\n${YELLOW}Checking for Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. Do you want to install it? (y/n)${NC}"
    read -r install_supabase

    if [[ "$install_supabase" =~ ^[Yy]$ ]]; then
        echo -e "\n${YELLOW}Installing Supabase CLI...${NC}"
        
        # Detect OS for installation
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install supabase/tap/supabase
            else
                echo -e "${RED}Homebrew not found. Please install Homebrew first:${NC}"
                echo -e "Visit: https://brew.sh/"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -s https://raw.githubusercontent.com/supabase/supabase/master/bin/supabase-linux-amd64 | \
            sudo tar -xz -C /usr/local/bin
        else
            echo -e "${RED}Unsupported OS. Please install Supabase CLI manually:${NC}"
            echo -e "https://supabase.com/docs/reference/cli/installing-and-updating"
            exit 1
        fi
        
        # Verify the installation
        if ! command -v supabase &> /dev/null; then
            echo -e "${RED}Failed to install Supabase CLI. Please install it manually:${NC}"
            echo -e "https://supabase.com/docs/reference/cli/installing-and-updating"
            exit 1
        fi
    else
        echo -e "${RED}Supabase CLI is required for this setup. Exiting.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Supabase CLI is installed${NC}"

# Check for node-fetch
echo -e "\n${YELLOW}Checking for node-fetch...${NC}"
if ! npm list -g node-fetch &> /dev/null && ! npm list node-fetch &> /dev/null; then
    echo -e "${YELLOW}Installing node-fetch...${NC}"
    npm install --no-save node-fetch
fi
echo -e "${GREEN}✓ node-fetch is available${NC}"

# Initialize and start Supabase
echo -e "\n${YELLOW}Initializing Supabase project...${NC}"
supabase init

echo -e "\n${YELLOW}Starting Supabase services... (this may take a few minutes)${NC}"
supabase start

# Extract the key values from the output
echo -e "\n${YELLOW}Retrieving Supabase keys...${NC}"

# Try different methods to get the keys based on CLI version
anon_key=""
service_role_key=""

# First try with --output json if supported
if supabase status --help | grep -q -- "--output"; then
    echo -e "${YELLOW}Using JSON output method...${NC}"
    status_output=$(supabase status --output json 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$status_output" ]; then
        anon_key=$(echo "$status_output" | grep -o '"anon_key": "[^"]*' | cut -d'"' -f4)
        service_role_key=$(echo "$status_output" | grep -o '"service_role_key": "[^"]*' | cut -d'"' -f4)
    fi
fi

# If that didn't work, try parsing text output
if [ -z "$anon_key" ] || [ -z "$service_role_key" ]; then
    echo -e "${YELLOW}Using text parsing method...${NC}"
    status_output=$(supabase status)
    
    anon_key=$(echo "$status_output" | grep "anon key:" | awk '{print $3}')
    service_role_key=$(echo "$status_output" | grep "service_role key:" | awk '{print $3}')
fi

if [ -z "$anon_key" ] || [ -z "$service_role_key" ]; then
    echo -e "${RED}Failed to retrieve Supabase keys automatically.${NC}"
    echo -e "${YELLOW}Please check the Supabase startup output above and enter the keys manually:${NC}"
    
    echo -e "${YELLOW}Enter the anon key:${NC}"
    read -r anon_key
    
    echo -e "${YELLOW}Enter the service role key:${NC}"
    read -r service_role_key
    
    if [ -z "$anon_key" ] || [ -z "$service_role_key" ]; then
        echo -e "${RED}Keys cannot be empty. Exiting.${NC}"
        exit 1
    fi
fi

# Create or update .env.local file
echo -e "\n${YELLOW}Setting up environment variables...${NC}"
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon_key}
SUPABASE_SERVICE_ROLE_KEY=${service_role_key}
EOF
echo -e "${GREEN}✓ Environment variables set in .env.local${NC}"

# Initialize the database schema
echo -e "\n${YELLOW}Setting up database schema...${NC}"

# Check for migration script
if [ -f "package.json" ] && grep -q "migrate:local" package.json; then
    echo -e "${YELLOW}Running database migrations...${NC}"
    npm run migrate:local
elif [ -f "supabase/migrations/schema.sql" ]; then
    echo -e "${YELLOW}Running schema.sql...${NC}"
    psql -h localhost -p 54321 -U postgres -d postgres -f supabase/migrations/schema.sql
else
    echo -e "${RED}Could not find migration scripts. You'll need to set up the database schema manually.${NC}"
    echo -e "${YELLOW}Please run your schema SQL files before continuing.${NC}"
    echo -e "${YELLOW}Press Enter when you've completed this step...${NC}"
    read -r
fi

# Generate demo data
echo -e "\n${YELLOW}Generating demo data...${NC}"
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/generate_all_demo_data.sql
echo -e "${GREEN}✓ Demo data generated${NC}"

# Set up authentication users
echo -e "\n${YELLOW}Setting up authentication for demo users...${NC}"
node demo/data/user_auth_setup.js

# Start the application
echo -e "\n${GREEN}===========================================================${NC}"
echo -e "${GREEN}                    SETUP COMPLETE!${NC}"
echo -e "${GREEN}===========================================================${NC}"

echo -e "\n${BLUE}What's next:${NC}"
echo -e "1. Start the application:        ${YELLOW}npm run dev${NC}"
echo -e "2. Open in your browser:         ${YELLOW}http://localhost:3000${NC}"
echo -e "3. Log in with demo credentials: ${YELLOW}admin.demo@example.com / password123${NC}"
echo -e "\n${BLUE}When you're done:${NC}"
echo -e "1. Stop the application:         ${YELLOW}Ctrl+C${NC}"
echo -e "2. Stop Supabase:                ${YELLOW}supabase stop${NC}"

echo -e "\n${YELLOW}Do you want to start the application now? (y/n)${NC}"
read -r start_app

if [[ "$start_app" =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Starting application with npm run dev...${NC}"
    npm run dev
else
    echo -e "\n${YELLOW}You can start the application later with: npm run dev${NC}"
fi 