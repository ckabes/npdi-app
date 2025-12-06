# NPDI Portal Maintenance Guide

**Version:** 1.2
**Last Updated:** December 5, 2025
**Author:** Connor Kabes

---

## Table of Contents

### Part 1: Getting Started (For Non-Developers)

**1. Introduction**
- 1.1 What is the NPDI Portal?
- 1.2 Purpose of This Guide
- 1.3 Who Should Use This Guide
- 1.4 Prerequisites

**2. Setting Up Your Development Environment**
- 2.1 Installing Windows Subsystem for Linux (WSL)
- 2.2 Installing Visual Studio Code (VSCode)
- 2.3 Connecting VSCode to WSL
- 2.4 Installing Node.js and npm
- 2.5 Installing MongoDB
- 2.6 Installing Git

**3. Installing and Using Claude Code**
- 3.1 What is Claude Code?
- 3.2 Installing Claude Code CLI
- 3.3 Launching Claude Code
- 3.4 Opening the NPDI Project Folder
- 3.5 Basic Claude Code Commands
- 3.6 Working with Claude Code for Maintenance Tasks

**4. Getting the Project Running**
- 4.1 Cloning the Repository
- 4.2 Installing Dependencies
- 4.3 Setting Up Environment Variables
- 4.4 Starting the Database
- 4.5 Running the Server
- 4.6 Running the Client
- 4.7 Accessing the Application

### Part 2: System Architecture & Design

**5. Application Overview**
- 5.1 Technology Stack Summary
- 5.2 MERN Stack Architecture
- 5.3 Project Structure Overview
- 5.4 Client-Server Relationship
- 5.5 Data Flow Diagram

**6. Backend Architecture**
- 6.1 Server Structure
- 6.2 Express.js Configuration
- 6.3 Middleware Stack
- 6.4 Database Connection
- 6.5 Environment Configuration

**7. Frontend Architecture**
- 7.1 React Application Structure
- 7.2 Component Hierarchy
- 7.3 Routing with React Router
- 7.4 State Management Approach
- 7.5 API Client Configuration

### Part 3: Core Functionality

**8. Authentication & Authorization**
- 8.1 Profile-Based Authentication System
- 8.2 User Roles
- 8.3 AuthContext and User State Management
- 8.4 Profile Selection Process
- 8.5 Session Management
- 8.6 Protected Routes

**9. Database Schema & Models**
- 9.1 MongoDB Collection Overview
- 9.2 ProductTicket Model
- 9.3 User Model
- 9.4 FormConfiguration Model
- 9.5 SystemSettings Model
- 9.6 UserPreferences Model
- 9.7 Permission Model
- 9.8 ApiKey Model
- 9.9 ParserConfiguration Model
- 9.10 WeightMatrix Model
- 9.11 PlantCode, BusinessLine, ProductHierarchy Models
- 9.12 Model Relationships

**10. API Endpoints**
- 10.1 Product/Ticket Endpoints
- 10.2 User Management Endpoints
- 10.3 Form Configuration Endpoints
- 10.4 System Settings Endpoints
- 10.5 Admin Endpoints
- 10.6 Public API Endpoints
- 10.7 Authentication Endpoints
- 10.8 API Request/Response Examples

**11. Form System**
- 11.1 Dynamic Form Configuration
- 11.2 Form Field Types
- 11.3 Form Sections
- 11.4 Field Validation Rules
- 11.5 Conditional Field Display
- 11.6 Form Configuration Editor

**12. Ticket Workflow**
- 12.1 Ticket Lifecycle & Status Transitions
- 12.2 Creating a New Ticket
- 12.3 Saving Drafts
- 12.4 Submitting Tickets
- 12.5 Ticket Assignment
- 12.6 Status Updates
- 12.7 Comments and Activity Tracking
- 12.8 NPDI Initiation Process

### Part 4: Key Features

**13. Dashboard System**
- 13.1 Product Manager Dashboard
- 13.2 PMOps Performance Dashboard
- 13.3 Admin Dashboard
- 13.4 Dashboard Statistics and Metrics
- 13.5 Recent Activity Feed

**14. Data Export Features**
- 14.1 PDP Checklist Export
- 14.2 PIF Export
- 14.3 Data Excel Export
- 14.4 Export Field Mapping
- 14.5 ExcelJS Integration

**15. External Integrations**
- 15.1 PubChem Chemical Data Integration
- 15.2 SAP/Palantir MARA Search
- 15.3 Similar Products Search
- 15.4 AI-Powered Content Generation

**16. User Interface Components**
- 16.1 Layout Component and Navigation
- 16.2 Badge Components
- 16.3 Form Components
- 16.4 Modal Components
- 16.5 Reusable Utilities (v1.2.0)
- 16.6 Loading States
- 16.7 Toast Notifications
- 16.8 Background Design and Animations

**17. SKU and Pricing Management**
- 17.1 SKU Variant Generation
- 17.2 Package Size Configuration
- 17.3 Pricing Calculations
- 17.4 Part Number Assignment
- 17.5 Forecasted Sales Volumes

### Part 5: Common Maintenance Tasks

**18. Adding New Features**
- 18.1 Adding a New Form Field
- 18.2 Adding a New API Endpoint
- 18.3 Creating a New Page/Route
- 18.4 Adding a New Dashboard Widget
- 18.5 Modifying the Database Schema

**19. User Management**
- 19.1 Adding Development Profiles
- 19.2 Managing User Roles
- 19.3 Configuring Permissions
- 19.4 API Key Management

**20. System Configuration**
- 20.1 Form Configuration Management
- 20.2 System Settings
- 20.3 Environment Variables Reference
- 20.4 Default Configuration Setup

**21. Data Management**
- 21.1 Database Backup Procedures
- 21.2 Running Seed Scripts
- 21.3 Data Migration Scripts
- 21.4 Fixing Data Issues

**22. Testing & Quality Assurance**
- 22.1 Manual Testing Checklist
- 22.2 Testing Ticket Creation Flow
- 22.3 Testing Exports
- 22.4 Testing Integrations
- 22.5 Browser Compatibility

### Part 6: Troubleshooting & Maintenance

**23. Common Issues & Solutions**
- 23.1 Server Won't Start
- 23.2 Database Connection Errors
- 23.3 Frontend Build Issues
- 23.4 API Request Failures
- 23.5 Authentication Issues
- 23.6 Export Generation Errors

**24. Debugging Techniques**
- 24.1 Using Browser DevTools
- 24.2 Server Logs and Error Messages
- 24.3 MongoDB Query Debugging
- 24.4 Network Request Inspection
- 24.5 Using Claude Code for Debugging

**25. Performance Optimization**
- 25.1 Database Indexing
- 25.2 Query Optimization
- 25.3 Frontend Performance
- 25.4 Caching Strategies
- 25.5 Rate Limiting Configuration

**26. Security Considerations**
- 26.1 Environment Variable Security
- 26.2 API Key Management
- 26.3 Input Validation
- 26.4 CORS Configuration
- 26.5 Rate Limiting
- 26.6 Secure Development Practices

### Part 7: Deployment & DevOps

**27. Git Workflow**
- 27.1 Branch Strategy
- 27.2 Committing Changes
- 27.3 Creating Pull Requests
- 27.4 Merging Branches
- 27.5 Git Best Practices

**28. Deployment Process**
- 28.1 Pre-Deployment Checklist
- 28.2 Building for Production
- 28.3 Environment Configuration for Production
- 28.4 Database Migration in Production
- 28.5 Deployment Steps
- 28.6 Post-Deployment Verification

**29. Monitoring & Maintenance**
- 29.1 Health Check Endpoint
- 29.2 Log Monitoring
- 29.3 Database Maintenance
- 29.4 Regular Backup Schedule
- 29.5 Update Dependencies

### Part 8: Reference Materials

**30. File Structure Reference**
- 30.1 Complete Server Directory Structure
- 30.2 Complete Client Directory Structure
- 30.3 Configuration Files Overview
- 30.4 Key Files and Their Purposes

**31. Code Conventions & Style Guide**
- 31.1 JavaScript/React Coding Standards
- 31.2 Naming Conventions
- 31.3 Component Structure
- 31.4 API Route Conventions
- 31.5 Comment Standards

**32. API Reference**
- 32.1 Complete Endpoint List
- 32.2 Request/Response Schemas
- 32.3 Error Codes
- 32.4 Rate Limits

**33. Database Reference**
- 33.1 Complete Field Reference by Model
- 33.2 Enum Values Reference
- 33.3 Index Definitions
- 33.4 Relationship Diagrams

**34. External Resources**
- 34.1 Technology Documentation Links
- 34.2 Helpful Tutorials
- 34.3 Community Resources
- 34.4 Support Contacts

### Appendices

**Appendix A: Glossary of Terms**

**Appendix B: Acronyms and Abbreviations**

**Appendix C: Quick Reference Commands**

**Appendix D: Sample Data and Test Scenarios**

**Appendix E: Change Log Template**

**Appendix F: Emergency Contacts and Escalation Procedures**

---

# Part 1: Getting Started (For Non-Developers)

## 1. Introduction

### 1.1 What is the NPDI Portal?

The NPDI Portal (New Product Development & Introduction Portal) is a web-based application designed to streamline the product development and introduction process at MilliporeSigma. It serves as a centralized platform for:

- **Creating and managing product tickets** throughout the development lifecycle
- **Tracking product information** including chemical properties, regulatory data, and quality specifications
- **Managing SKU variants and pricing** for new products
- **Generating standardized exports** (PDP Checklists, PIFs, data exports)
- **Monitoring progress** through dashboards and analytics
- **Facilitating collaboration** between Product Managers and PM Operations teams

The portal helps ensure that all necessary product information is collected, validated, and made available to the appropriate teams at each stage of the product development process.

### 1.2 Purpose of This Guide

This maintenance guide serves multiple purposes:

1. **Onboarding**: Help new maintainers get the application running on their local machine
2. **Understanding**: Explain how the system works at both high-level and technical levels
3. **Maintenance**: Provide instructions for common maintenance tasks
4. **Troubleshooting**: Offer solutions to common problems
5. **Reference**: Serve as a comprehensive technical reference for the codebase

Whether you're a non-technical user learning to maintain the system or an experienced developer taking over the project, this guide will help you understand and work with the NPDI Portal.

### 1.3 Who Should Use This Guide

This guide is written for:

- **New maintainers** who need to take over the project
- **Product Managers** who want to understand how the system works
- **IT administrators** responsible for deployment and infrastructure
- **Developers** adding new features or fixing bugs
- **Business analysts** documenting system capabilities

**No prior programming experience is required** for Part 1 (Getting Started). More technical sections are clearly marked and build upon the foundational knowledge.

### 1.4 Prerequisites

Before you begin, you should have:

**Hardware Requirements:**
- A computer running Windows 10/11 (version 2004 or higher for WSL2)
- At least 8GB of RAM (16GB recommended)
- At least 20GB of free disk space
- A stable internet connection

**Software to Install (covered in detail in Section 2):**
- Windows Subsystem for Linux (WSL2)
- Visual Studio Code
- Node.js and npm
- MongoDB
- Git

**Access Requirements:**
- Access to the NPDI Portal code repository
- PubChem API key (for chemical data integration)
- SAP/Palantir credentials (for MARA search, if applicable)

**Recommended Knowledge:**
- Basic familiarity with using a computer
- Ability to follow step-by-step instructions
- Willingness to learn new tools

---

## 2. Setting Up Your Development Environment

### 2.1 Installing Windows Subsystem for Linux (WSL)

WSL allows you to run a Linux environment directly on Windows, which is necessary for running the NPDI Portal development environment.

**Step-by-Step Instructions:**

1. **Open PowerShell as Administrator**
   - Click the Start button
   - Type "PowerShell"
   - Right-click "Windows PowerShell"
   - Select "Run as administrator"

2. **Install WSL**
   - In the PowerShell window, type:
   ```powershell
   wsl --install
   ```
   - Press Enter and wait for the installation to complete

3. **Restart Your Computer**
   - When prompted, restart your computer

4. **Set Up Ubuntu**
   - After restarting, Ubuntu will automatically open
   - Create a username (can be anything, lowercase recommended)
   - Create a password (you won't see characters as you type - this is normal)
   - Confirm your password

5. **Verify Installation**
   - In the Ubuntu terminal, type:
   ```bash
   lsb_release -a
   ```
   - You should see Ubuntu version information

**Troubleshooting:**
- If you get an error about virtualization, you may need to enable it in your BIOS
- If Ubuntu doesn't open automatically, search for "Ubuntu" in the Start menu

### 2.2 Installing Visual Studio Code (VSCode)

VSCode is the code editor we'll use to view and modify the NPDI Portal code.

**Step-by-Step Instructions:**

1. **Download VSCode**
   - Go to: https://code.visualstudio.com/
   - Click "Download for Windows"
   - Save the installer file

2. **Run the Installer**
   - Double-click the downloaded file
   - Accept the license agreement
   - Choose installation location (default is fine)
   - **Important**: Check the box "Add to PATH"
   - Click "Install"

3. **Launch VSCode**
   - Click "Finish" in the installer
   - VSCode should open automatically

4. **Install WSL Extension**
   - In VSCode, click the Extensions icon (four squares on the left sidebar)
   - Search for "WSL"
   - Find "WSL" by Microsoft
   - Click "Install"

### 2.3 Connecting VSCode to WSL

**Step-by-Step Instructions:**

1. **Open WSL in VSCode**
   - In VSCode, press `Ctrl + Shift + P` (this opens the command palette)
   - Type "WSL: Connect to WSL"
   - Press Enter

2. **Verify Connection**
   - Look at the bottom-left corner of VSCode
   - You should see a green indicator showing "WSL: Ubuntu"
   - If you see this, you're successfully connected!

3. **Open a Terminal in VSCode**
   - Press `` Ctrl + ` `` (the backtick key, usually above Tab)
   - You should see a terminal at the bottom showing Ubuntu

### 2.4 Installing Node.js and npm

Node.js is the JavaScript runtime that powers the NPDI Portal backend. npm is the package manager used to install dependencies.

**Step-by-Step Instructions:**

1. **Install Node Version Manager (nvm)**
   - In the VSCode terminal (connected to WSL), run:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Restart the Terminal**
   - Close the terminal in VSCode
   - Open a new terminal (`` Ctrl + ` ``)

3. **Install Node.js**
   - In the terminal, run:
   ```bash
   nvm install 18
   nvm use 18
   ```

4. **Verify Installation**
   - Check Node.js version:
   ```bash
   node --version
   ```
   - Should show: `v18.x.x`

   - Check npm version:
   ```bash
   npm --version
   ```
   - Should show: `9.x.x` or higher

### 2.5 Installing MongoDB

MongoDB is the database that stores all NPDI Portal data.

**Step-by-Step Instructions:**

1. **Import MongoDB GPG Key**
   ```bash
   curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
   ```

2. **Add MongoDB Repository**
   ```bash
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   ```

3. **Update Package List**
   ```bash
   sudo apt-get update
   ```

4. **Install MongoDB**
   ```bash
   sudo apt-get install -y mongodb-org
   ```

5. **Start MongoDB**
   ```bash
   sudo service mongodb start
   ```

6. **Verify MongoDB is Running**
   ```bash
   sudo service mongodb status
   ```
   - Should show "MongoDB is running"

7. **Set MongoDB to Start Automatically**
   ```bash
   echo "sudo service mongodb start" >> ~/.bashrc
   ```

### 2.6 Installing Git

Git is the version control system used to manage the NPDI Portal code.

**Step-by-Step Instructions:**

1. **Install Git**
   ```bash
   sudo apt-get install git -y
   ```

2. **Configure Git with Your Name**
   ```bash
   git config --global user.name "Your Name"
   ```

3. **Configure Git with Your Email**
   ```bash
   git config --global user.email "your.email@milliporesigma.com"
   ```

4. **Verify Installation**
   ```bash
   git --version
   ```
   - Should show: `git version 2.x.x`

---

## 3. Installing and Using Claude Code

### 3.1 What is Claude Code?

Claude Code is an AI-powered coding assistant developed by Anthropic. It's like having an expert developer sitting next to you who can:

- **Answer questions** about the codebase
- **Make code changes** based on your instructions
- **Debug problems** and suggest solutions
- **Explain how things work** in plain English
- **Generate new code** following existing patterns
- **Search and navigate** the codebase efficiently

Claude Code was used extensively in building the NPDI Portal, so it has deep knowledge of how the system works.

**Key Benefits:**
- No need to remember every technical detail
- Can work even if you're not a programmer
- Provides explanations in non-technical language when needed
- Helps maintain consistency with existing code patterns

### 3.2 Installing Claude Code CLI

**Step-by-Step Instructions:**

1. **Install Claude Code**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Verify Installation**
   ```bash
   claude --version
   ```

3. **Set Up Authentication**
   - You'll need an Anthropic API key
   - Contact your IT administrator or Anthropic for access
   - Once you have the key, run:
   ```bash
   claude auth login
   ```
   - Follow the prompts to enter your API key

### 3.3 Launching Claude Code

**Step-by-Step Instructions:**

1. **Open VSCode Connected to WSL** (as described in section 2.3)

2. **Open the Terminal** (`` Ctrl + ` ``)

3. **Navigate to the Project Folder** (covered in section 4.1)

4. **Launch Claude Code**
   ```bash
   claude
   ```

5. **You Should See:**
   - A welcome message from Claude
   - A prompt where you can type questions or instructions
   - Claude is now ready to help!

### 3.4 Opening the NPDI Project Folder

**Step-by-Step Instructions:**

1. **In VSCode, Click File → Open Folder**

2. **Navigate to the Project**
   - In WSL, projects are typically in `/home/yourusername/`
   - Navigate to where you cloned the NPDI project (section 4.1)
   - Select the `npdi-app` folder

3. **Click "OK"**

4. **Trust the Workspace**
   - VSCode will ask if you trust the authors
   - Click "Yes, I trust the authors"

### 3.5 Basic Claude Code Commands

Here are some useful commands when working with Claude Code:

**Asking Questions:**
```
You: How does the ticket creation process work?
You: Where is the database connection configured?
You: What does this error message mean?
```

**Making Changes:**
```
You: Add a new field called "productCategory" to the ticket form
You: Fix the bug causing tickets to not save properly
You: Update the dashboard to show tickets created this week
```

**Getting Help:**
```
You: /help - Shows available commands
You: /clear - Clears the conversation history
You: /exit - Exits Claude Code
```

**Best Practices:**
- Be specific in your requests
- Ask follow-up questions if you don't understand
- Request explanations in "non-technical terms" if needed
- Ask Claude to show you code locations (file paths and line numbers)

### 3.6 Working with Claude Code for Maintenance Tasks

**Example Maintenance Workflows:**

**1. Understanding Existing Code:**
```
You: I need to understand how the PubChem integration works.
     Can you explain it in simple terms and show me where the code is?
```

**2. Making a Simple Change:**
```
You: I need to add a new status option called "ON_HOLD" to the ticket
     status dropdown. Can you help me do that?
```

**3. Fixing a Bug:**
```
You: Users are reporting that exports aren't including the new vendor
     information fields we added. Can you investigate and fix this?
```

**4. Adding a Feature:**
```
You: I want to add a button on the dashboard that downloads a summary
     report of all tickets created this month as a CSV file.
     Can you implement this?
```

**Tips for Success:**
- Start with understanding before making changes
- Ask Claude to explain what it's doing
- Test changes after Claude makes them
- Ask for step-by-step instructions when needed
- Don't hesitate to ask "why" questions

---

## 4. Getting the Project Running

### 4.1 Cloning the Repository

"Cloning" means downloading a copy of the code from the repository to your computer.

**Step-by-Step Instructions:**

1. **Get the Repository URL**
   - Contact your administrator for the Git repository URL
   - It will look something like: `https://github.com/company/npdi-app.git`

2. **Navigate to Your Home Directory**
   ```bash
   cd ~
   ```

3. **Clone the Repository**
   ```bash
   git clone [REPOSITORY-URL]
   ```
   Replace `[REPOSITORY-URL]` with the actual URL

4. **Navigate into the Project**
   ```bash
   cd npdi-app
   ```

5. **Verify the Files**
   ```bash
   ls
   ```
   - You should see folders like `client`, `server`, etc.

### 4.2 Installing Dependencies

Dependencies are external libraries and tools that the NPDI Portal needs to run.

**Step-by-Step Instructions:**

1. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```
   - This will take a few minutes
   - You'll see lots of text scrolling - this is normal

2. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```
   - This will also take a few minutes

3. **Return to Project Root**
   ```bash
   cd ..
   ```

**What's Happening:**
- npm is downloading all the code libraries the project needs
- These are defined in `package.json` files
- Everything is stored in `node_modules` folders

### 4.3 Setting Up Environment Variables

Environment variables contain configuration settings like database URLs and API keys.

**Step-by-Step Instructions:**

1. **Create Server Environment File**
   ```bash
   cd server
   cp .env.example .env
   ```
   - This creates a copy of the example file

2. **Edit the Environment File**
   ```bash
   code .env
   ```
   - This opens the file in VSCode

3. **Configure the Settings**

   Update these values in the `.env` file:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/npdi-portal

   # Frontend URL
   CLIENT_URL=http://localhost:5173

   # PubChem API (get from administrator)
   PUBCHEM_API_KEY=your_api_key_here

   # Palantir/SAP (get from administrator)
   PALANTIR_API_KEY=your_api_key_here
   PALANTIR_API_URL=your_api_url_here
   ```

4. **Save the File**
   - Press `Ctrl + S` to save
   - Close the file

**Important Notes:**
- Never commit the `.env` file to Git (it contains secrets)
- The `.env.example` file shows what variables are needed
- Contact your administrator for API keys

### 4.4 Starting the Database

**Step-by-Step Instructions:**

1. **Check if MongoDB is Running**
   ```bash
   sudo service mongodb status
   ```

2. **If Not Running, Start It**
   ```bash
   sudo service mongodb start
   ```

3. **Verify It Started**
   ```bash
   sudo service mongodb status
   ```
   - Should say "MongoDB is running"

4. **Seed the Database (First Time Only)**
   ```bash
   cd ~/npdi-app/server
   node seedFormConfig.js
   ```
   - This creates the initial form configuration

### 4.5 Running the Server

The server is the backend that handles data and business logic.

**Step-by-Step Instructions:**

1. **Open a New Terminal in VSCode**
   - Click Terminal → New Terminal
   - Or press `` Ctrl + Shift + ` ``

2. **Navigate to Server Folder**
   ```bash
   cd ~/npdi-app/server
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **You Should See:**
   ```
   Server running on port 5000
   Environment: development
   MongoDB connected successfully
   ```

**Keep This Terminal Open** - The server needs to stay running

### 4.6 Running the Client

The client is the frontend (user interface) that runs in the web browser.

**Step-by-Step Instructions:**

1. **Open Another New Terminal**
   - Click the + button in the terminal panel
   - Or click Terminal → New Terminal

2. **Navigate to Client Folder**
   ```bash
   cd ~/npdi-app/client
   ```

3. **Start the Client**
   ```bash
   npm run dev
   ```

4. **You Should See:**
   ```
   VITE v4.x.x  ready in XXX ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

**Keep This Terminal Open Too** - The client needs to stay running

### 4.7 Accessing the Application

**Step-by-Step Instructions:**

1. **Open Your Web Browser**
   - Use Chrome, Edge, or Firefox

2. **Go to the Application**
   - Type in the address bar: `http://localhost:5173`
   - Press Enter

3. **You Should See:**
   - The NPDI Portal profile selection screen
   - A molecular background
   - Profile selection cards

4. **Select a Profile**
   - Click on one of the profiles (John Smith, Sarah Johnson, or Mike Wilson)
   - You should be taken to the dashboard

**Congratulations!** You now have the NPDI Portal running on your local machine.

**Stopping the Application:**
- To stop the server: Go to the server terminal and press `Ctrl + C`
- To stop the client: Go to the client terminal and press `Ctrl + C`
- To stop MongoDB: `sudo service mongodb stop`

**Starting Again Later:**
1. Start MongoDB: `sudo service mongodb start`
2. Start server: `cd ~/npdi-app/server && npm start`
3. Start client: (in new terminal) `cd ~/npdi-app/client && npm run dev`
4. Open browser to `http://localhost:5173`

---

# Part 2: System Architecture & Design

## 5. Application Overview

### 5.1 Technology Stack Summary

The NPDI Portal is built using modern web technologies:

**Frontend (Client):**
- **React** - JavaScript library for building user interfaces
- **React Router** - Navigation and routing
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Vite** - Build tool and development server
- **Heroicons** - Icon library
- **React Hot Toast** - Notification system
- **ExcelJS** - Excel file generation
- **RDKit-JS** - Professional molecular structure rendering with client-side 2D visualization

**Backend (Server):**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Axios** - HTTP client for API calls
- **ExcelJS** - Excel file generation

**Development Tools:**
- **Git** - Version control
- **npm** - Package manager
- **WSL2** - Linux environment on Windows
- **Claude Code** - AI coding assistant

### 5.2 MERN Stack Architecture

The NPDI Portal follows the MERN stack pattern:

```
┌─────────────────────────────────────────────────────────┐
│                      Web Browser                         │
│                   (User Interface)                       │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP Requests
                  │ (REST API)
┌─────────────────▼───────────────────────────────────────┐
│                   React Frontend                         │
│              (Client Application)                        │
│  ┌────────┬────────┬────────┬────────┬────────┐        │
│  │ Pages  │Components│Services│Context│ Utils  │        │
│  └────────┴────────┴────────┴────────┴────────┘        │
│              Running on Port 5173 (Dev)                  │
└─────────────────┬───────────────────────────────────────┘
                  │ API Calls
                  │ (axios)
┌─────────────────▼───────────────────────────────────────┐
│                 Express.js Backend                       │
│                (Server Application)                      │
│  ┌────────┬────────┬────────┬────────┬────────┐        │
│  │Routes  │Controllers│Models│Services│Middleware│      │
│  └────────┴────────┴────────┴────────┴────────┘        │
│              Running on Port 5000                        │
└─────────────────┬───────────────────────────────────────┘
                  │ Database Queries
                  │ (Mongoose)
┌─────────────────▼───────────────────────────────────────┐
│                    MongoDB Database                      │
│           (Data Storage and Retrieval)                   │
│  ┌───────────┬───────────┬───────────┬────────┐        │
│  │  Tickets  │   Users   │  Config   │Settings│        │
│  └───────────┴───────────┴───────────┴────────┘        │
│              Running on Port 27017                       │
└─────────────────────────────────────────────────────────┘
```

**How It Works:**
1. User interacts with the React frontend in their browser
2. Frontend sends API requests to the Express backend
3. Backend processes requests, validates data, and queries MongoDB
4. MongoDB returns data to the backend
5. Backend formats the response and sends it to the frontend
6. Frontend updates the user interface with the data

### 5.3 Project Structure Overview

```
npdi-app/
├── client/                 # Frontend React application
│   ├── public/            # Static assets (images, etc.)
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Full page components
│   │   ├── services/      # API communication layer
│   │   ├── utils/         # Helper functions and contexts
│   │   └── App.jsx        # Main application component
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Build configuration
│
├── server/                # Backend Express application
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers (business logic)
│   ├── models/           # Database schemas (Mongoose models)
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── scripts/          # Utility scripts (seed, migrate, etc.)
│   ├── data/             # Static data files
│   ├── index.js          # Server entry point
│   ├── package.json      # Backend dependencies
│   └── .env              # Environment variables (not in Git)
│
├── Background2.png        # Profile selection background image
├── .gitignore            # Files to exclude from Git
└── MAINTENANCE_GUIDE.md  # This guide

```

### 5.4 Client-Server Relationship

**Request Flow Example - Creating a Ticket:**

```
User Action: Clicks "Create Ticket" button
     │
     ▼
React Component (CreateTicket.jsx)
     │ Collects form data
     │ Validates input
     ▼
API Service (productAPI.js)
     │ Makes POST request to /api/products
     │ Includes ticket data in request body
     ▼
Express Server (products.js route)
     │ Receives request
     │ Validates authentication
     │ Validates request data
     ▼
Controller (productController.js)
     │ Business logic
     │ Looks up current user
     │ Creates ticket data object
     ▼
Model (ProductTicket.js)
     │ Mongoose schema validation
     │ Saves to MongoDB
     ▼
MongoDB Database
     │ Stores ticket document
     │ Returns saved document
     ▼
Controller
     │ Formats response
     │ Sends success response
     ▼
API Service
     │ Receives response
     │ Returns data to component
     ▼
React Component
     │ Updates UI
     │ Shows success message
     │ Navigates to ticket details
     ▼
User sees: "Ticket created successfully!"
```

### 5.5 Data Flow Diagram

**Authentication Flow:**
```
Profile Selection → AuthContext → Local Storage → All Components
                                  ↓
                         Sets user state globally
                                  ↓
                    Protected routes check user role
                                  ↓
                  Renders appropriate dashboard/pages
```

**Data Fetching Flow:**
```
Component Mounts
    │
    ├─→ useEffect hook triggers
    │       │
    │       ├─→ Calls API service function
    │       │       │
    │       │       ├─→ axios makes HTTP request
    │       │       │       │
    │       │       │       ├─→ Server receives request
    │       │       │       │       │
    │       │       │       │       ├─→ Controller queries database
    │       │       │       │       │       │
    │       │       │       │       │       ├─→ MongoDB returns data
    │       │       │       │       │       │
    │       │       │       │       ├─── Controller formats response
    │       │       │       │
    │       │       │       ├─── Server sends JSON response
    │       │       │
    │       │       ├─── axios returns response data
    │       │
    │       ├─── Component updates state with data
    │
    ├─→ Component re-renders with data
    │
    └─→ User sees updated interface
```

---

## 6. Backend Architecture

### 6.1 Server Structure

**File Organization:**
```
server/
├── config/
│   └── database.js          # MongoDB connection setup
│
├── controllers/
│   ├── productController.js # Ticket CRUD operations
│   ├── userPreferencesController.js
│   ├── systemSettingsController.js
│   ├── permissionController.js
│   └── adminController.js
│
├── models/
│   ├── ProductTicket.js     # Main ticket schema
│   ├── User.js              # User profiles schema
│   ├── FormConfiguration.js # Form config schema
│   ├── SystemSettings.js    # System settings schema
│   ├── UserPreferences.js   # User preferences schema
│   ├── Permission.js        # Permissions schema
│   └── ApiKey.js            # API keys schema
│
├── routes/
│   ├── products.js          # Ticket API routes
│   ├── users.js             # User routes
│   ├── formConfig.js        # Form configuration routes
│   ├── permissions.js       # Permission routes
│   ├── systemSettings.js    # Settings routes
│   ├── userPreferences.js   # User preferences routes
│   ├── admin.js             # Admin routes
│   ├── ticketApi.js         # Public API routes
│   └── weightMatrix.js      # Weight matrix routes
│
├── services/
│   ├── dataExportService.js # Excel export generation
│   └── (other services)
│
├── scripts/
│   ├── seedFormConfig.js    # Initialize form configuration
│   ├── assignTicketsToUser.js
│   └── fixCreatedByField.js
│
├── data/
│   └── devProfiles.json     # Development user profiles
│
├── index.js                 # Server entry point
├── package.json             # Dependencies
└── .env                     # Environment configuration
```

### 6.2 Express.js Configuration

**Server Entry Point (`server/index.js`):**

```javascript
// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Apply middleware
app.use(helmet());           // Security headers
app.use(compression());      // Response compression
app.use(cors({...}));        // Cross-origin requests
app.use(express.json());     // Parse JSON bodies
app.use(rateLimit({...}));   // Rate limiting

// Register routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
// ... other routes

// Error handling
app.use((error, req, res, next) => {
  // Handle errors
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Key Components:**
1. **Environment Loading** - Reads `.env` file
2. **Database Connection** - Connects to MongoDB
3. **Middleware Stack** - Security, parsing, compression
4. **Route Registration** - Maps URLs to handlers
5. **Error Handling** - Catches and responds to errors
6. **Server Startup** - Listens on configured port

### 6.3 Middleware Stack

Middleware functions execute in order for each request:

**1. Security (Helmet)**
- Sets HTTP security headers
- Protects against common vulnerabilities
- Configured in `index.js`

**2. Compression**
- Compresses response bodies
- Reduces bandwidth usage
- Improves performance

**3. CORS (Cross-Origin Resource Sharing)**
```javascript
cors({
  origin: [
    'http://localhost:5173',  // Dev client
    'http://localhost:5174',  // Alternate ports
    process.env.CLIENT_URL    // Production URL
  ],
  credentials: true
})
```
- Allows frontend to make requests
- Configured for multiple environments

**4. Rate Limiting**
```javascript
rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  message: 'Too many requests'
})
```
- Prevents abuse
- Different limits for dev/production

**5. Body Parsing**
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```
- Parses JSON request bodies
- Handles form data
- 10MB size limit

### 6.4 Database Connection

**Configuration (`server/config/database.js`):**

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);  // Exit if connection fails
  }
};

module.exports = connectDB;
```

**MongoDB URI Format:**
```
mongodb://localhost:27017/npdi-portal
```

**Connection Options:**
- `useNewUrlParser`: Uses new URL parser
- `useUnifiedTopology`: Uses new topology engine

**Error Handling:**
- Logs connection errors
- Exits process if connection fails
- Ensures database is available before serving requests

### 6.5 Environment Configuration

**Environment Variables (`.env` file):**

```env
# Server Configuration
PORT=5000                    # Server port number
NODE_ENV=development         # Environment (development/production)

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/npdi-portal

# Frontend Configuration
CLIENT_URL=http://localhost:5173

# External API Configuration
PUBCHEM_API_KEY=your_key_here
PALANTIR_API_URL=your_url_here
PALANTIR_API_KEY=your_key_here

# Email Configuration (NOT IMPLEMENTED)
# SMTP email functionality is not currently implemented in the application
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your_email@example.com
# SMTP_PASS=your_password
```

**Usage in Code:**
```javascript
const port = process.env.PORT || 5000;
const dbUri = process.env.MONGODB_URI;
const apiKey = process.env.PUBCHEM_API_KEY;
```

**Security Notes:**
- `.env` is in `.gitignore` - never committed
- Use `.env.example` as template
- Keep sensitive values secure
- Different `.env` for each environment

---

## 7. Frontend Architecture

### 7.1 React Application Structure

**File Organization:**
```
client/src/
├── components/           # Reusable UI components
│   ├── Layout.jsx       # Main app layout with navigation
│   ├── Loading.jsx      # Loading spinner component
│   ├── badges.jsx       # Status and priority badges
│   └── forms/           # Form components
│       ├── ChemicalPropertiesForm.jsx
│       ├── DynamicFormSection.jsx
│       ├── QualitySpecificationsForm.jsx
│       └── ... other form components
│
├── pages/               # Full page components (routes)
│   ├── ProfileSelection.jsx    # Login/profile selection
│   ├── Dashboard.jsx            # Main dashboard
│   ├── CreateTicket.jsx         # New ticket form
│   ├── TicketDetails.jsx        # Ticket detail view
│   ├── TicketList.jsx           # Ticket listing
│   ├── DraftsView.jsx           # Draft tickets
│   ├── AdminDashboard.jsx       # Admin interface
│   └── PMOPSDashboard.jsx       # PMOps dashboard
│
├── services/            # API communication layer
│   └── api.js          # API client configuration and methods
│
├── utils/              # Helper functions and contexts
│   └── AuthContext.jsx # Authentication context provider
│
├── App.jsx             # Main application component
└── main.jsx            # Application entry point
```

### 7.2 Component Hierarchy

```
main.jsx (Entry Point)
    │
    └── App.jsx (Root Component)
            │
            ├── AuthProvider (Context)
            │       │
            │       └── Routes
            │               │
            │               ├── ProfileSelection (Public)
            │               │
            │               └── Layout (Protected)
            │                       │
            │                       ├── Sidebar Navigation
            │                       ├── Header
            │                       │
            │                       └── Outlet (Route Content)
            │                               │
            │                               ├── Dashboard
            │                               ├── TicketList
            │                               ├── CreateTicket
            │                               ├── TicketDetails
            │                               ├── DraftsView
            │                               ├── PMOPSDashboard
            │                               └── AdminDashboard
```

**Component Types:**

1. **Pages** - Full page views rendered by routes
2. **Layout Components** - Structure and navigation
3. **Form Components** - Input and data entry
4. **Display Components** - Show data (badges, cards, etc.)
5. **Context Providers** - Manage global state

### 7.3 Routing with React Router

**Route Configuration (`App.jsx`):**

```javascript
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/select-profile" element={<ProfileSelection />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/new" element={<CreateTicket />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="drafts" element={<DraftsView />} />
        <Route path="pm-ops" element={<PMOPSDashboard />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
```

**Route Protection:**
```javascript
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/select-profile" />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};
```

**URL Structure:**
- `/select-profile` - Profile selection (public)
- `/dashboard` - Main dashboard (all users)
- `/tickets` - Ticket list (all users)
- `/tickets/new` - Create ticket (managers and PMOps)
- `/tickets/:id` - Ticket details (all users)
- `/drafts` - Draft tickets (PMOps and admin)
- `/pm-ops` - PMOps dashboard (PMOps and admin)
- `/admin` - Admin dashboard (admin only)

### 7.4 State Management Approach

The NPDI Portal uses **React Context** for global state and **component state** for local state.

**Global State (AuthContext):**
```javascript
// utils/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectProfile = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    setUser(profile);
    localStorage.setItem('selectedProfile', profileId);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('selectedProfile');
  };

  return (
    <AuthContext.Provider value={{
      user,
      profiles,
      loading,
      selectProfile,
      logout,
      isPMOPS: user?.role === 'PM_OPS',
      isAdmin: user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in components:
const { user, selectProfile, logout, isPMOPS } = useAuth();
```

**Component State:**
```javascript
// Local state for component-specific data
const [tickets, setTickets] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
```

**State Management Pattern:**
- **Global state**: User authentication, profiles, permissions
- **Component state**: Form data, loading states, UI state
- **Server state**: Data fetched from API (tickets, stats, etc.)

### 7.5 API Client Configuration

**API Service (`services/api.js`):**

```javascript
import axios from 'axios';

// Base API client
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Product/Ticket API methods
export const productAPI = {
  // Get all tickets
  getTickets: (params) => apiClient.get('/products', { params }),

  // Get single ticket
  getTicketById: (id) => apiClient.get(`/products/${id}`),

  // Create ticket
  createTicket: (data) => apiClient.post('/products', data),

  // Update ticket
  updateTicket: (id, data) => apiClient.put(`/products/${id}`, data),

  // Update ticket status
  updateTicketStatus: (id, data) => 
    apiClient.patch(`/products/${id}/status`, data),

  // Add comment
  addComment: (id, content) => 
    apiClient.post(`/products/${id}/comments`, { content }),

  // Get dashboard stats
  getDashboardStats: () => apiClient.get('/products/dashboard/stats'),

  // Export endpoints
  exportPDP: (id) => apiClient.get(`/products/${id}/export-pdp`, {
    responseType: 'blob'
  }),

  exportPIF: (id) => apiClient.get(`/products/${id}/export-pif`, {
    responseType: 'blob'
  }),

  exportData: (id) => apiClient.get(`/products/${id}/export-data`, {
    responseType: 'blob'
  }),

  // External integrations
  lookupCAS: (casNumber) => apiClient.get(`/products/cas-lookup/${casNumber}`),

  searchMARA: (partNumber) => apiClient.get(`/products/sap-search/${partNumber}`),

  searchSimilarProducts: (casNumber) => 
    apiClient.get(`/products/similar-products/${casNumber}`)
};

// Usage in components:
import { productAPI } from '../services/api';

const fetchTickets = async () => {
  try {
    const response = await productAPI.getTickets({ status: 'SUBMITTED' });
    setTickets(response.data.tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
  }
};
```

**Environment Variables:**
```javascript
// vite.config.js
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
});

// .env
VITE_API_URL=http://localhost:5000/api
```

---


---

## PART 3: CORE FUNCTIONALITY

This part explains the core features and systems that power the NPDI Portal application, including authentication, data models, and API endpoints.

---

### **8. Authentication & Authorization**

The NPDI Portal uses a **profile-based authentication system** designed for development and internal use. There are no traditional usernames or passwords - instead, users select from predefined profiles with different roles and permissions.

#### **8.1 Profile-Based Authentication**

**How It Works:**
1. When the application loads, it fetches available profiles from the backend
2. Users see a profile selection screen showing all active profiles
3. After selecting a profile, the user is "logged in" with that profile's role and permissions
4. Profile selection is stored in localStorage for session persistence

**Development Profiles** (stored in `server/data/devProfiles.json`):
- **John Smith** - Product Manager (PRODUCT_MANAGER role)
- **Sarah Johnson** - PM Ops (PM_OPS role)
- **Mike Wilson** - Admin (ADMIN role)

**Profile Structure:**
```javascript
{
  id: 'product-manager',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@milliporesigma.com',
  role: 'PRODUCT_MANAGER',
  sbu: 'Life Science',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z'
}
```

#### **8.2 User Roles**

The application supports three distinct roles, each with different permissions:

| Role | Description | Access Level |
|------|-------------|--------------|
| **PRODUCT_MANAGER** | Creates and manages product tickets | Can create/edit tickets, view most data, limited pricing access |
| **PM_OPS** | Operations team, handles SKU assignment and pricing | Can manage SKUs, assign pricing, view drafts, edit status history |
| **ADMIN** | Full system access | Complete access to all features including admin panel |

**Role-Based Permissions** (from `Permission` model):

**PRODUCT_MANAGER:**
- ✅ View/Edit: Tickets, drafts, SKU variants, chemical properties, hazard classification, corpbase data, comments
- ❌ No Access: SKU assignment, pricing data, admin panel
- 👁️ View Only: Status history

**PM_OPS:**
- ✅ View/Edit: Tickets, SKU variants, SKU assignment, pricing data, comments, status history
- 👁️ View Only: Drafts, chemical properties, hazard classification, corpbase data
- ❌ No Access: Admin panel

**ADMIN:**
- ✅ Full Access: All features including admin panel

#### **8.3 AuthContext Implementation**

The authentication system is managed by React Context API in `client/src/utils/AuthContext.jsx`:

**Key Components:**
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // Current user profile
  const [loading, setLoading] = useState(true);    // Loading state
  const [token, setToken] = useState(null);        // Auth token
  const [profiles, setProfiles] = useState([]);    // Available profiles

  // Fetch profiles from API
  const fetchProfiles = async () => {
    const response = await apiClient.get('/profiles');
    setProfiles(response.data || []);
  };

  // Select a profile (login)
  const selectProfile = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    setUser(profile);
    localStorage.setItem('selectedProfile', profileId);
    localStorage.setItem('currentProfileData', JSON.stringify(profile));
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedProfile');
    localStorage.removeItem('currentProfileData');
    setToken(null);
    setUser(null);
  };

  // Exposed values and helpers
  const value = {
    user,
    token,
    profiles,
    loading,
    selectProfile,
    logout,
    refreshProfiles: fetchProfiles,
    isAuthenticated: !!user && !!token,
    isProductManager: user?.role === 'PRODUCT_MANAGER',
    isPMOPS: user?.role === 'PM_OPS',
    isAdmin: user?.role === 'ADMIN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Using AuthContext in Components:**
```javascript
import { useAuth } from '../utils/AuthContext';

function MyComponent() {
  const { user, isAdmin, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      {isAdmin && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### **8.4 Protected Routes**

Routes are protected using the `ProtectedRoute` component defined in `client/src/App.jsx`:

```javascript
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) return <Loading />;
  
  // Redirect to profile selection if not authenticated
  if (!user) return <Navigate to="/select-profile" replace />;
  
  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};
```

**Route Protection Examples:**
```javascript
// All authenticated users can access
<Route path="tickets" element={<TicketList />} />

// Only PM_OPS and ADMIN can access
<Route path="pm-ops" element={
  <ProtectedRoute allowedRoles={['PM_OPS', 'ADMIN']}>
    <PMOPSDashboard />
  </ProtectedRoute>
} />

// Only ADMIN can access
<Route path="admin" element={
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

#### **8.5 Profile Selection Flow**

**Location:** `client/src/pages/ProfileSelection.jsx`

**Visual Flow:**
1. Application loads → Fetches profiles from `/api/profiles`
2. Displays profile selection screen with molecular background
3. Shows each profile with:
   - Profile avatar (initials with color-coded background)
   - Full name
   - Role (formatted: "PRODUCT_MANAGER" → "Product Manager")
4. User clicks a profile → Triggers smooth transition animation
5. Profile is stored in localStorage
6. User is redirected to `/dashboard`

**Profile Colors:**
- Product Manager: Green (bg-green-500)
- PM Ops: Blue (bg-blue-500)
- Admin: Purple (bg-purple-500)

#### **8.6 Backend Profile Endpoint**

**Location:** `server/index.js:57-127`

The `/api/profiles` endpoint serves development profiles:

```javascript
app.get('/api/profiles', async (req, res) => {
  try {
    const profilesFile = path.join(__dirname, 'data/devProfiles.json');
    
    // Create data directory if it doesn't exist
    await fs.mkdir(path.dirname(profilesFile), { recursive: true });
    
    // Create default profiles file if missing
    if (!fs.existsSync(profilesFile)) {
      const defaultProfiles = [/* default profile objects */];
      await fs.writeFile(profilesFile, JSON.stringify(defaultProfiles, null, 2));
    }
    
    // Read and return active profiles
    const data = await fs.readFile(profilesFile, 'utf8');
    const profiles = JSON.parse(data);
    const activeProfiles = profiles.filter(p => p.isActive);
    
    res.json(activeProfiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.json([]); // Return empty array on error
  }
});
```

#### **8.7 Session Management**

**Storage Locations:**
- `localStorage.selectedProfile` - Profile ID (e.g., "product-manager")
- `localStorage.currentProfileData` - Full profile object (JSON string)
- `localStorage.authToken` - Authentication token (currently not used)
- `localStorage.user` - User object (currently not used)

**Session Persistence:**
- When the app loads, AuthContext checks localStorage for stored profile
- If found and valid, user is automatically "logged in"
- If not found, user is redirected to profile selection

**Logout Process:**
1. User clicks logout button
2. `logout()` function clears all localStorage items
3. State is reset (`user` and `token` set to `null`)
4. User is redirected to `/select-profile`

#### **8.8 Security Considerations**

⚠️ **Important Notes:**

1. **Development-Only:** This profile-based system is designed for development environments only. Production systems should implement:
   - True authentication with passwords or SSO (SAML, OAuth)
   - Token-based authentication (JWT)
   - Secure session management
   - Password hashing (bcrypt)
   - HTTPS enforcement

2. **No Password Protection:** Anyone with access to the application can select any profile. This is acceptable for internal development but NOT for production.

3. **For Production Deployment (Not Currently Implemented):**

   If this application needs to be deployed to production, the following security enhancements would be required:
   - Replace profile selection with traditional login form
   - Implement password hashing in User model
   - Add JWT token generation and verification
   - Add middleware to verify tokens on protected routes
   - Replace localStorage with secure HTTP-only cookies
   - Implement SSO (Single Sign-On) integration with corporate identity provider

---

### **9. Database Schema & Models**

The NPDI Portal uses MongoDB with Mongoose for object modeling. This section details all data models and their relationships.

#### **9.1 Database Overview**

**Database Name:** `npdi-portal` (or as configured in `.env`)

**Connection Configuration** (`server/config/database.js`):
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

**Collections:**
1. `productticketes` - Product development tickets (main collection)
2. `users` - User profiles and authentication
3. `permissions` - Role-based permissions
4. `formconfigurations` - Dynamic form configuration
5. `systemsettings` - Application settings
6. `userpreferences` - User preferences
7. `tickettemplates` - Ticket templates
8. `weightmatrices` - SKU weight calculations

#### **9.2 User Model**

**Location:** `server/models/User.js`

**Schema Structure:**
```javascript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: /^\S+@\S+\.\S+$/  // Email format validation
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {
    type: String,
    enum: ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'],
    required: true
  },
  sbu: {
    type: String,
    enum: ['Life Science', 'Process Solutions', 'Electronics', 'Healthcare'],
    required: function() { return this.role === 'PRODUCT_MANAGER'; }
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Field Descriptions:**
- `email` - Unique email address, auto-converted to lowercase
- `firstName`, `lastName` - User's name
- `role` - One of three roles: PRODUCT_MANAGER, PM_OPS, or ADMIN
- `sbu` - Strategic Business Unit (required only for Product Managers)
- `isActive` - Whether user can log in (soft delete flag)
- `lastLogin` - Timestamp of last login
- `createdAt`, `updatedAt` - Automatic timestamps

**Middleware:**
```javascript
userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  next();
});
```

#### **9.3 Permission Model**

**Location:** `server/models/Permission.js`

Defines what each role can view and edit throughout the application.

**Schema Structure:**
```javascript
{
  role: {
    type: String,
    enum: ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'],
    required: true,
    unique: true
  },
  privileges: {
    tickets: { view: Boolean, edit: Boolean },
    drafts: { view: Boolean, edit: Boolean },
    skuVariants: { view: Boolean, edit: Boolean },
    skuAssignment: { view: Boolean, edit: Boolean },
    chemicalProperties: { view: Boolean, edit: Boolean },
    hazardClassification: { view: Boolean, edit: Boolean },
    corpbaseData: { view: Boolean, edit: Boolean },
    pricingData: { view: Boolean, edit: Boolean },
    comments: { view: Boolean, edit: Boolean },
    statusHistory: { view: Boolean, edit: Boolean },
    adminPanel: { view: Boolean, edit: Boolean }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Static Methods:**

1. **Get Privileges for a Role:**
```javascript
const privileges = await Permission.getPrivilegesForRole('PRODUCT_MANAGER');
// Returns: { tickets: { view: true, edit: true }, ... }
```

2. **Initialize Default Permissions:**
```javascript
await Permission.initializeDefaultPermissions();
// Sets up default permissions for all three roles
```

**Default Permission Matrix:**

| Feature | PM View | PM Edit | PM_OPS View | PM_OPS Edit | Admin View | Admin Edit |
|---------|---------|---------|-------------|-------------|------------|------------|
| Tickets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Drafts | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| SKU Variants | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SKU Assignment | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Chemical Properties | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Hazard Classification | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Corpbase Data | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Pricing Data | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Comments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Status History | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

#### **9.4 ProductTicket Model**

**Location:** `server/models/ProductTicket.js`

The core model representing a new product development request. This is the largest and most complex model.

**Top-Level Schema Fields:**
```javascript
{
  // Basic Information
  ticketNumber: String (unique, auto-generated),
  title: String (required),
  description: String,
  status: String (enum: ['Draft', 'Submitted', 'In Review', 'Approved', 'Rejected', 'On Hold']),
  
  // Relationships
  createdBy: { id: String, name: String, email: String, role: String },
  assignedTo: { id: String, name: String, email: String },
  sbu: String (enum: SBU options),
  
  // Product Details
  productType: String (enum: ['Chemical', 'Kit', 'Reagent', 'Instrument', 'Service', 'Other']),
  productionType: String (enum: ['In-House', 'Third Party']),
  
  // Nested Schemas (detailed below)
  skuVariants: [SKUVariantSchema],
  chemicalProperties: ChemicalPropertiesSchema,
  hazardClassification: HazardClassificationSchema,
  qualitySpecifications: QualitySpecificationsSchema,
  corpbaseData: CorpbaseDataSchema,
  
  // Activity Tracking
  comments: [CommentSchema],
  statusHistory: [StatusHistorySchema],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  submittedAt: Date
}
```

**9.4.1 SKU Variant Schema**

Represents different packaging sizes and configurations of a product:

```javascript
{
  type: {
    type: String,
    enum: ['BULK', 'CONF', 'SPEC', 'VAR', 'PREPACK'],
    required: true
  },
  sku: String,  // Assigned SKU number
  description: String,
  
  // Packaging
  packageSize: {
    value: Number (required),
    unit: String (enum: ['mg', 'g', 'kg', 'mL', 'L', 'EA', 'units', 'vials', 'plates', 'bulk'])
  },
  grossWeight: { value: Number, unit: String },
  netWeight: { value: Number, unit: String },
  volume: { value: Number, unit: String },
  
  // Pricing
  pricing: {
    standardCost: Number,
    calculatedCost: Number,
    calculatedMarginPercent: Number,
    margin: Number (default: 50),
    limitPrice: Number,
    listPrice: Number,
    currency: String (default: 'USD')
  },
  
  // Inventory
  inventory: {
    minimumStock: Number,
    leadTime: Number,
    supplier: String
  },
  
  // Sales Forecast
  forecastedSalesVolume: {
    year1: Number,
    year2: Number,
    year3: Number
  }
}
```

**SKU Type Definitions:**
- **BULK** - Large quantity, basic packaging
- **CONF** - Configured/custom packaging
- **SPEC** - Special specification variant
- **VAR** - Standard variant
- **PREPACK** - Pre-packaged ready-to-ship

**9.4.2 Chemical Properties Schema**

Stores scientific data about the chemical compound:

```javascript
{
  casNumber: String,              // CAS Registry Number
  chemicalName: String,           // IUPAC or common name
  molecularFormula: String,       // e.g., "C6H12O6"
  molecularWeight: Number,        // g/mol
  purity: Number,                 // Percentage (0-100)
  
  appearance: String,             // Physical appearance
  solubility: String,             // Solubility information
  storageConditions: String,      // Storage requirements
  shelfLife: String,              // Product shelf life
  
  // PubChem Integration Data
  pubchemData: {
    cid: String,                  // PubChem Compound ID
    iupacName: String,
    canonicalSmiles: String,
    inchi: String,
    inchiKey: String,
    synonyms: [String],
    description: String,
    lastFetched: Date
  }
}
```

**9.4.3 Hazard Classification Schema**

Safety and regulatory information:

```javascript
{
  ghs: {
    pictograms: [String],         // GHS pictogram codes
    signalWord: String,           // "Danger" or "Warning"
    hazardStatements: [String],   // H-codes (e.g., "H302")
    precautionaryStatements: [String]  // P-codes (e.g., "P264")
  },
  
  transportClassification: {
    unNumber: String,             // UN shipping number
    properShippingName: String,
    hazardClass: String,
    packingGroup: String
  },
  
  requiresSDS: Boolean,           // Safety Data Sheet required
  sdsVersion: String,
  sdsLastUpdated: Date
}
```

**9.4.4 Comment Schema**

Activity feed comments and discussions:

```javascript
{
  id: String (auto-generated UUID),
  user: {
    id: String,
    name: String,
    email: String,
    role: String
  },
  text: String (required),
  timestamp: Date (default: now),
  edited: Boolean (default: false),
  editedAt: Date
}
```

**9.4.5 Status History Schema**

Tracks all status changes for audit trail:

```javascript
{
  status: String (required),
  changedBy: {
    id: String,
    name: String,
    email: String
  },
  changedAt: Date (default: now),
  notes: String                   // Optional reason for change
}
```

#### **9.5 Other Models**

**9.5.1 FormConfiguration Model**

**Location:** `server/models/FormConfiguration.js`

Stores the dynamic form configuration that determines what fields are shown, required, and editable:

```javascript
{
  version: String (default: '1.0'),
  sections: [{
    id: String,
    title: String,
    description: String,
    order: Number,
    isActive: Boolean,
    fields: [{
      name: String,
      label: String,
      type: String,  // text, number, select, date, etc.
      required: Boolean,
      editable: Boolean,
      visible: Boolean,
      defaultValue: Any,
      options: [String],  // For dropdowns/radio buttons
      validation: {
        min: Number,
        max: Number,
        pattern: String
      }
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**9.5.2 SystemSettings Model**

**Location:** `server/models/SystemSettings.js`

Application-wide configuration:

```javascript
{
  smtp: {
    host: String,
    port: Number,
    secure: Boolean,
    username: String,
    password: String  // Encrypted
  },
  pubchem: {
    apiKey: String,
    rateLimit: Number,
    enabled: Boolean
  },
  application: {
    maintenanceMode: Boolean,
    allowRegistration: Boolean,
    sessionTimeout: Number
  },
  updatedAt: Date,
  updatedBy: String
}
```

**9.5.3 UserPreferences Model**

**Location:** `server/models/UserPreferences.js`

User-specific settings and preferences:

```javascript
{
  userId: String (unique, required),
  theme: String (enum: ['light', 'dark', 'auto']),
  emailNotifications: Boolean,
  defaultSBU: String,
  dashboardLayout: Object,
  createdAt: Date,
  updatedAt: Date
}
```

**9.5.4 TicketTemplate Model**

**Location:** `server/models/TicketTemplate.js`

Pre-defined templates for common ticket types:

```javascript
{
  name: String (required),
  description: String,
  category: String,
  isActive: Boolean,
  templateData: {
    // Partial ProductTicket object with default values
  },
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **9.9 ParserConfiguration Model**

**Location:** `server/models/ParserConfiguration.js`

**Purpose:** Stores knowledge tables for the Quality Specification Natural Language Parser, enabling admins to manage test attributes, methods, and default mappings through the UI.

**Schema:**
```javascript
{
  configType: {
    type: String,
    required: true,
    unique: true,
    enum: ['testAttribute', 'testMethod', 'defaultMethod']
    // testAttribute: Normalizes test/attribute names (e.g., 'purity' -> 'Purity')
    // testMethod: Normalizes test method names (e.g., 'hplc' -> 'HPLC')
    // defaultMethod: Maps test attributes to default methods (e.g., 'purity' -> 'HPLC')
  },
  entries: [{
    key: {
      type: String,
      required: true,
      lowercase: true  // Always stored lowercase for case-insensitive matching
    },
    value: {
      type: String,
      required: true  // Properly formatted/capitalized version
    },
    category: String,  // e.g., 'chemical', 'biological', 'physical', 'thermal'
    description: String,  // Optional context for admin users
    isCustom: Boolean,  // Tracks user-added vs seeded defaults
    createdAt: Date,
    updatedAt: Date
  }],

  // Version for cache invalidation
  version: {
    type: Number,
    default: 1
  },

  // Metadata
  totalEntries: Number,
  customEntriesCount: Number,
  lastModifiedBy: String,  // Email from profile

  createdAt: Date,
  updatedAt: Date
}
```

**Key Features:**
- **Three Configuration Types:**
  - `testAttribute`: 87 default entries (chemical, biological, physical, thermal, microbiological)
  - `testMethod`: 126 default entries (chromatography, spectroscopy, mass spec, microbiological, biological)
  - `defaultMethod`: 90 default mappings (test → method assignments)

- **Version Tracking:** Automatic cache invalidation when admins update entries
- **Custom Tracking:** Separates user-added entries from seeded defaults
- **Category Organization:** Groups entries by type for easier management

**Indexes:**
- `configType`: Fast lookup by configuration type
- `entries.key`: Fast entry searches
- `entries.category`: Category-based filtering

**Static Methods:**
- `getConfigByType(configType)`: Get configuration by type
- `getAllConfigs()`: Get all three configuration types

**Instance Methods:**
- `upsertEntry(key, value, category, description, isCustom)`: Add or update entry
- `removeEntry(key)`: Delete entry by key
- `bulkImport(entries, replaceAll)`: Bulk import entries

**Usage:**
```javascript
// Get test attribute configuration
const config = await ParserConfiguration.getConfigByType('testAttribute');

// Add custom entry
config.upsertEntry('viscosity', 'Viscosity', 'physical', 'Kinematic viscosity', true);
await config.save();

// Search for entries
const entries = config.entries.filter(e => e.category === 'biological');
```

**Seeded Data (303 total entries):**
- Test Attributes: purity, assay, pH, viscosity, density, sterility, endotoxin, potency, etc.
- Test Methods: HPLC, GC, NMR, FTIR, LAL, PCR, ELISA, Flow Cytometry, etc.
- Default Mappings: purity→HPLC, endotoxin→LAL, cell viability→Flow Cytometry, etc.

**Admin UI Access:** Admin Dashboard → System Settings → Quality Tests

#### **9.10 WeightMatrix Model**

**Location:** `server/models/WeightMatrix.js`

Stores gross weight mappings for package sizes (SAP MARA fields: BRGEW, GEWEI).

```javascript
{
  size: String (unique, e.g., "100G", "1L", "500MG"),
  grossWeight: Number,
  weightUnit: String (enum: ['MG', 'G', 'KG', 'UG']),
  normalizedSize: {
    value: Number,
    unit: String
  },
  normalizedGrossWeight: {
    value: Number,  // Converted to grams
    unit: String (default: 'G')
  },
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **9.11 PlantCode, BusinessLine, ProductHierarchy Models**

**PlantCode Model** (`server/models/PlantCode.js`):
```javascript
{
  code: String (unique, 4-digit),
  name: String,
  location: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**BusinessLine Model** (`server/models/BusinessLine.js`):
```javascript
{
  code: String (unique),
  name: String,
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**ProductHierarchy Model** (`server/models/ProductHierarchy.js`):
```javascript
{
  sbu: String,
  gph: String,
  productLine: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **9.12 Model Relationships**

**Entity Relationship Diagram:**

```
┌─────────────────┐
│     User        │
└────────┬────────┘
         │
         │ created by
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│ ProductTicket   │◄──────│  Permission     │
└────────┬────────┘   has └─────────────────┘
         │
         │ configured by
         │
         ▼
┌─────────────────┐
│FormConfiguration│
└─────────────────┘

┌─────────────────┐
│UserPreferences  │
└─────────────────┘
         │
         │ belongs to
         │
         ▼
┌─────────────────┐
│     User        │
└─────────────────┘
```

**Key Relationships:**
1. **User → ProductTicket** (One-to-Many): A user can create many tickets
2. **Permission → Role** (One-to-One): Each role has one permission document
3. **User → UserPreferences** (One-to-One): Each user has preferences
4. **FormConfiguration** (Singleton): One active configuration for all forms

#### **9.7 Database Seeding**

**Location:** `server/scripts/seedFormConfig.js`

Initial database setup script that creates:
- Default form configuration
- Default permissions for all roles
- Sample product tickets (optional)

**Running the Seed Script:**
```bash
cd ~/npdi-app/server
node scripts/seedFormConfig.js
```

**What It Does:**
1. Connects to MongoDB
2. Creates/updates FormConfiguration with default field definitions
3. Initializes Permission documents for all three roles
4. Optionally creates sample data for testing

---

### **10. API Endpoints**

The NPDI Portal backend exposes a RESTful API for all client-server communication. All endpoints are prefixed with `/api`.

#### **10.1 API Overview**

**Base URL:** `http://localhost:5000/api` (development)

**Request Format:** JSON
**Response Format:** JSON
**Authentication:** Profile-based (see Section 8)

**Common Response Structure:**
```javascript
// Success
{
  "success": true,
  "data": { /* response data */ }
}

// Error
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

**Rate Limiting:**
- Development: 500 requests per 15 minutes per IP
- Production: 100 requests per 15 minutes per IP

#### **10.2 Profile Endpoints**

**GET /api/profiles**

Retrieve all available user profiles for login.

```http
GET /api/profiles
```

**Response:**
```json
[
  {
    "id": "product-manager",
    "name": "John Smith",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@milliporesigma.com",
    "role": "PRODUCT_MANAGER",
    "sbu": "Life Science",
    "userId": "product-manager"
  }
]
```

**Location:** `server/index.js:57`

#### **10.3 Product/Ticket Endpoints**

**Location:** `server/routes/products.js`

**GET /api/products**

Retrieve all product tickets (with optional filtering).

```http
GET /api/products?status=Submitted&sbu=Life%20Science
```

**Query Parameters:**
- `status` - Filter by ticket status
- `sbu` - Filter by Strategic Business Unit
- `createdBy` - Filter by creator ID
- `assignedTo` - Filter by assignee ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ticketNumber": "NPDI-2024-001",
      "title": "New Chemical Reagent XYZ",
      "status": "Submitted",
      "createdBy": {
        "name": "John Smith",
        "email": "john.smith@milliporesigma.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**GET /api/products/:id**

Retrieve a single product ticket by ID.

```http
GET /api/products/507f1f77bcf86cd799439011
```

**Response:** Full ProductTicket object with all nested data.

**POST /api/products**

Create a new product ticket.

```http
POST /api/products
Content-Type: application/json

{
  "title": "New Product Request",
  "description": "Description of new product",
  "sbu": "Life Science",
  "productType": "Chemical",
  "createdBy": {
    "id": "product-manager",
    "name": "John Smith",
    "email": "john.smith@milliporesigma.com",
    "role": "PRODUCT_MANAGER"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "ticketNumber": "NPDI-2024-001",
    /* ... full ticket object ... */
  }
}
```

**PUT /api/products/:id**

Update an existing product ticket.

```http
PUT /api/products/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "status": "In Review",
  "chemicalProperties": {
    "casNumber": "50-81-7",
    "chemicalName": "Ascorbic Acid"
  }
}
```

**DELETE /api/products/:id**

Delete a product ticket (soft delete - marks as inactive).

```http
DELETE /api/products/507f1f77bcf86cd799439011
```

**POST /api/products/:id/comments**

Add a comment to a ticket.

```http
POST /api/products/507f1f77bcf86cd799439011/comments
Content-Type: application/json

{
  "text": "Please review the chemical properties section",
  "user": {
    "id": "pm-ops",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@milliporesigma.com",
    "role": "PM_OPS"
  }
}
```

**POST /api/products/:id/status**

Update ticket status (with audit trail).

```http
POST /api/products/507f1f77bcf86cd799439011/status
Content-Type: application/json

{
  "status": "Approved",
  "notes": "All requirements met",
  "changedBy": {
    "id": "admin",
    "name": "Mike Wilson",
    "email": "mike.wilson@milliporesigma.com"
  }
}
```

#### **10.4 Form Configuration Endpoints**

**Location:** `server/routes/formConfig.js`

**GET /api/form-config**

Retrieve the current form configuration.

```http
GET /api/form-config
```

**Response:** Complete FormConfiguration object defining all form sections and fields.

**PUT /api/form-config**

Update form configuration (ADMIN only).

```http
PUT /api/form-config
Content-Type: application/json

{
  "sections": [
    {
      "id": "basic-info",
      "title": "Basic Information",
      "fields": [/* field definitions */]
    }
  ]
}
```

**POST /api/form-config/restore-default**

Restore form configuration to default settings (ADMIN only).

```http
POST /api/form-config/restore-default
```

#### **10.5 User Management Endpoints**

**Location:** `server/routes/users.js`

**GET /api/users**

Get all users (ADMIN only).

**POST /api/users**

Create a new user (ADMIN only).

**PUT /api/users/:id**

Update user details (ADMIN only).

**DELETE /api/users/:id**

Deactivate a user (soft delete, ADMIN only).

#### **10.6 Permission Endpoints**

**Location:** `server/routes/permissions.js`

**GET /api/permissions**

Get all role permissions.

**GET /api/permissions/:role**

Get permissions for a specific role.

```http
GET /api/permissions/PRODUCT_MANAGER
```

**PUT /api/permissions/:role**

Update permissions for a role (ADMIN only).

#### **10.7 System Settings Endpoints**

**Location:** `server/routes/systemSettings.js`

**GET /api/system-settings**

Retrieve system settings (ADMIN only).

**PUT /api/system-settings**

Update system settings (ADMIN only).

#### **10.8 User Preferences Endpoints**

**Location:** `server/routes/userPreferences.js`

**GET /api/user-preferences/:userId**

Get preferences for a user.

**PUT /api/user-preferences/:userId**

Update user preferences.

#### **10.9 Template Endpoints**

**Location:** `server/routes/templates.js`

**GET /api/templates**

Get all ticket templates.

**POST /api/templates**

Create a new template.

**PUT /api/templates/:id**

Update a template.

**DELETE /api/templates/:id**

Delete a template.

#### **10.10 Admin Endpoints**

**Location:** `server/routes/admin.js`

**GET /api/admin/stats**

Get system statistics (ticket counts, user counts, etc.).

**POST /api/admin/maintenance**

Toggle maintenance mode.

#### **10.11 Public API Endpoints**

**Location:** `server/routes/ticketApi.js`

External API for third-party integrations.

**GET /api/v1/tickets**

Public API to retrieve tickets (requires API key).

```http
GET /api/v1/tickets
X-API-Key: your-api-key-here
```

#### **10.12 Weight Matrix Endpoints**

**Location:** `server/routes/weightMatrix.js`

**GET /api/weight-matrix**

Retrieve weight calculation matrices for SKU packaging.

**PUT /api/weight-matrix**

Update weight matrices (PM_OPS/ADMIN only).

#### **10.13 Error Handling**

All endpoints follow consistent error handling:

**404 Not Found:**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "casNumber",
    "message": "Invalid CAS number format"
  }
}
```

**500 Server Error:**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message (development only)"
}
```

---


### **11. Form System**

The NPDI Portal features a sophisticated dynamic form system where form configurations are stored in MongoDB and rendered dynamically.

#### **11.1 Form System Overview**

The form system consists of two main components:
1. **Form Configuration** - Database-stored definition of all form sections and fields (managed via seed scripts)
2. **DynamicFormSection Component** - React component that renders forms based on configuration

**Key Features:**
- ✅ Conditional field visibility based on other field values
- ✅ Support for multiple field types (text, number, select, date, radio, checkbox, etc.)
- ✅ Field validation rules (min, max, pattern, required)
- ✅ Default values and dropdown options
- ✅ Centralized form configuration stored in MongoDB

**Note:** Form configurations are managed via seed scripts (`server/scripts/seedFormConfig.js`) rather than through a UI editor. This ensures configurations are version-controlled and deployed consistently across environments.

#### **11.2 Form Configuration Structure**

**Storage:** MongoDB `formconfigurations` collection
**Model:** `server/models/FormConfiguration.js`

**Configuration Schema:**
```javascript
{
  version: '1.0',
  sections: [
    {
      id: 'basic-info',              // Unique section identifier
      title: 'Basic Information',     // Display title
      description: 'Product overview', // Optional description
      order: 1,                       // Display order
      visible: true,                  // Section visibility
      fields: [
        {
          name: 'productName',          // Field identifier
          label: 'Product Name',        // Display label
          type: 'text',                 // Field type
          required: true,               // Is field required?
          editable: true,               // Can users edit?
          visible: true,                // Is field visible?
          defaultValue: '',             // Default value
          placeholder: 'Enter product name',
          
          // For select/radio fields
          options: ['Option 1', 'Option 2'],
          
          // Conditional visibility
          visibleWhen: {
            fieldKey: 'productType',
            value: 'Chemical'
          },
          
          // Validation rules
          validation: {
            min: 0,
            max: 100,
            pattern: '^[A-Z0-9]+$',
            message: 'Custom error message'
          }
        }
      ]
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### **11.3 Supported Field Types**

| Type | Description | Example Usage |
|------|-------------|---------------|
| `text` | Single-line text input | Product name, CAS number |
| `textarea` | Multi-line text input | Description, notes |
| `number` | Numeric input | Molecular weight, purity |
| `email` | Email address | Contact email |
| `date` | Date picker | Expected launch date |
| `select` | Dropdown menu | Product type, SBU |
| `radio` | Radio button group | Production type (In-House/Third Party) |
| `checkbox` | Single checkbox | Requires SDS, Is active |
| `file` | File upload | Attachment, SDS document |
| `color` | Color picker | Status colors |
| `url` | URL input | Website link |
| `tel` | Phone number | Contact phone |

#### **11.4 Conditional Field Visibility**

Fields can be shown or hidden based on the values of other fields using the `visibleWhen` property.

**Example 1: Show field when another field has specific value**
```javascript
{
  name: 'thirdPartySupplier',
  label: 'Third Party Supplier Name',
  type: 'text',
  visibleWhen: {
    fieldKey: 'productionType',    // Dependent field
    value: 'Third Party'           // Required value
  }
}
```
→ Shows "Third Party Supplier Name" only when "Production Type" is "Third Party"

**Example 2: Show field when another field matches one of several values**
```javascript
{
  name: 'chemicalFormula',
  label: 'Molecular Formula',
  type: 'text',
  visibleWhen: {
    fieldKey: 'productType',
    values: ['Chemical', 'Reagent', 'Buffer']  // Multiple values (OR condition)
  }
}
```
→ Shows "Molecular Formula" when product type is Chemical, Reagent, OR Buffer

**Example 3: Show field when checkbox is checked**
```javascript
{
  name: 'sdsVersion',
  label: 'SDS Version',
  type: 'text',
  visibleWhen: {
    fieldKey: 'requiresSDS',
    value: true  // Boolean value
  }
}
```

#### **11.5 DynamicFormSection Component**

**Location:** `client/src/components/forms/DynamicFormSection.jsx`

This component renders form sections dynamically based on configuration.

**Usage:**
```javascript
import DynamicFormSection from './components/forms/DynamicFormSection';

function CreateTicket() {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {formConfig.sections.map(section => (
        <DynamicFormSection
          key={section.id}
          section={section}
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          readOnly={false}
          data={formData}
        />
      ))}
    </form>
  );
}
```

**Props:**
- `section` - Section configuration object
- `register` - React Hook Form register function
- `errors` - Form validation errors
- `watch` - Watch function to monitor field values
- `setValue` - Function to programmatically set field values
- `readOnly` - Whether form is in read-only mode
- `data` - Current form data
- `previewMode` - Show all fields regardless of visibility conditions (for preview)
- `sapImportedFields` - Set of fields imported from SAP (for highlighting)
- `getSAPImportedClass` - Function to get CSS class for SAP-imported fields
- `sapMetadata` - Metadata from SAP import
- `onOpenSimilarProducts` - Handler for similar products search
- `onFieldEdit` - Handler when SAP-imported field is edited

**Field Rendering Logic:**
1. Check if field is visible (based on `visible` property and `visibleWhen` conditions)
2. Check if field is editable (based on `editable` property and `readOnly` prop)
3. Render appropriate input component based on field `type`
4. Apply validation rules from field configuration
5. Show error messages from form validation
6. Apply SAP import highlighting if applicable

#### **11.6 Modifying Form Configuration**

**Note:** Form configurations are managed through seed scripts for version control and consistency across environments.

**To modify form configuration:**

**1. Edit the Seed Script:**
```bash
cd server/scripts
nano seedFormConfig.js
```

**2. Modify the Configuration:**
The seed script contains the form configuration as a JavaScript object. Make your changes:
- Add/remove/modify sections
- Add/remove/modify fields
- Update field properties (required, visible, editable, etc.)
- Set validation rules
- Configure conditional visibility

**3. Run the Seed Script:**
```bash
# From the server/scripts directory
node seedFormConfig.js
```

**4. Verify Changes:**
- Restart the application
- Navigate to create/edit ticket
- Verify your form changes appear correctly

**Advantages of Script-Based Configuration:**
- ✅ Version controlled in Git
- ✅ Consistent across development, staging, and production
- ✅ Easy to review changes in pull requests
- ✅ Can be deployed automatically with code
- ✅ No risk of accidental UI-based changes in production

**Example - Adding a New Field:**
```javascript
{
  fieldKey: 'expirationDate',
  label: 'Expiration Date',
  type: 'date',
  required: false,
  visible: true,
  editable: true,
  helpText: 'Product expiration date'
}
```

**For future discriminator pattern:** When implementing multiple ticket types (chemical, instrument, etc.), each type will have its own form configuration managed via seed scripts.

#### **11.7 Field Validation**

Validation is handled at three levels:

**1. Client-Side Validation (React Hook Form):**
```javascript
register('productName', {
  required: field.required ? 'This field is required' : false,
  minLength: field.validation?.min ? {
    value: field.validation.min,
    message: `Minimum ${field.validation.min} characters`
  } : undefined,
  pattern: field.validation?.pattern ? {
    value: new RegExp(field.validation.pattern),
    message: field.validation.message || 'Invalid format'
  } : undefined
})
```

**2. Schema Validation (Mongoose):**
Defined in model schemas (e.g., `ProductTicket.js`)

**3. Backend Validation (Express Routes):**
Custom validation in route handlers

**Common Validation Rules:**
- `required` - Field must have a value
- `min` / `max` - Min/max length for strings, min/max value for numbers
- `pattern` - Regular expression pattern matching
- `email` - Valid email format
- `url` - Valid URL format
- Custom validators - Business logic validation

#### **11.8 Pre-filled Forms from SAP Integration**

The form system integrates with SAP/Palantir to auto-populate fields:

**SAP-Imported Field Features:**
- Green background highlight to indicate SAP data
- Metadata tooltip showing source and description
- Auto-remove highlight when user edits the field
- "Similar Products" button to search by CAS number

**SAP Import Flow:**
1. User enters CAS number or SKU
2. Click "Import from SAP" button
3. System queries Palantir MARA API
4. Returned data populates form fields
5. Imported fields show green highlight
6. User can accept SAP data or edit as needed
7. Highlight removes when field is edited

**Imported Fields (typical):**
- Product name / description
- Manufacturer
- Package size and unit
- Material group
- Storage conditions
- Hazard classification
- And more...

#### **11.9 Form Integration with PubChem**

Chemical property fields integrate with PubChem for auto-population:

**PubChem Integration Flow:**
1. User enters CAS number in Chemical Properties section
2. Click "Auto-fill from PubChem" button
3. System queries PubChem REST API
4. Chemical data is retrieved:
   - IUPAC name
   - Molecular formula
   - Molecular weight
   - Canonical SMILES
   - InChI / InChIKey
   - Synonyms
5. Fields are auto-populated
6. User can review and modify as needed

**Location:** `client/src/pages/CreateTicket.jsx` contains PubChem fetch logic

#### **11.10 Form State Management**

**Draft Auto-Save:**
Forms automatically save to draft status periodically to prevent data loss.

**localStorage Caching:**
Form data is cached in browser localStorage for recovery if browser crashes.

**Controlled vs Uncontrolled:**
The form system uses controlled components (React Hook Form) for:
- Better validation
- Easier state management
- Programmatic field updates
- Conditional logic

**Form Submission Flow:**
1. User fills out form
2. Client-side validation runs
3. If valid, data is sent to `/api/products` (POST)
4. Server validates data
5. Mongoose schema validation runs
6. Document is saved to MongoDB
7. Response returns created ticket
8. User is redirected to ticket detail page

---

### **12. Ticket Workflow**

This section describes the lifecycle of a product ticket from creation to completion.

#### **12.1 Ticket Statuses**

Tickets progress through six distinct statuses:

| Status | Description | Who Can Set | Next Steps |
|--------|-------------|-------------|------------|
| **DRAFT** | Initial creation, incomplete | System (auto) | User submits when ready |
| **SUBMITTED** | Submitted for review | Product Manager | PM Ops reviews and processes |
| **IN_PROCESS** | Being worked on by PM Ops | PM Ops, Admin | Continue processing, gather info |
| **NPDI_INITIATED** | Formal NPDI process started | PM Ops, Admin | Complete NPDI requirements |
| **COMPLETED** | Fully processed and finished | PM Ops, Admin | Archive, no further action |
| **CANCELED** | Canceled/abandoned | Any role | Archive, document reason |

**Status Flow Diagram:**
```
DRAFT
  │
  │ (Submit button clicked)
  ▼
SUBMITTED
  │
  │ (PM Ops begins processing)
  ▼
IN_PROCESS
  │
  │ (Formal NPDI kickoff)
  ▼
NPDI_INITIATED
  │
  │ (All requirements met)
  ▼
COMPLETED

(Any status can transition to CANCELED)
```

#### **12.2 Priority Levels**

Each ticket has a priority that affects its processing order:

| Priority | Description | SLA Target | Use Case |
|----------|-------------|------------|----------|
| **LOW** | No rush, background work | 30+ days | Low priority products, research |
| **MEDIUM** | Normal priority | 14-30 days | Standard new products |
| **HIGH** | Important, expedited | 7-14 days | Important launches |
| **URGENT** | Critical, immediate attention | 1-7 days | Customer commitments, urgent needs |

**Priority Settings:**
- Product Managers can set priority when creating ticket
- PM Ops and Admins can change priority later
- Priority is visible on dashboard and ticket list
- Urgent tickets show red indicator

#### **12.3 Ticket Creation Flow**

**Step-by-Step Process:**

1. **Navigate to Create Ticket**
   - User clicks "New Ticket" button in dashboard
   - Redirected to `/tickets/new`

2. **Fill Out Form**
   - Form sections render based on FormConfiguration
   - Required fields marked with red asterisk
   - Conditional fields show/hide based on selections
   - User can import data from SAP or PubChem

3. **Save as Draft (Optional)**
   - Click "Save as Draft" button
   - Ticket saved with status: DRAFT
   - User can return later to complete
   - Draft tickets show in "My Drafts" section

4. **Submit for Review**
   - Click "Submit Ticket" button
   - Client-side validation runs
   - If validation fails, errors shown inline
   - If validation passes, ticket submitted to backend
   - Status changes to SUBMITTED
   - Timestamp recorded in `submittedAt` field
   - Creator receives confirmation message
   - PM Ops team notified (if notifications enabled)

5. **Redirect to Ticket Details**
   - User redirected to ticket detail page (`/tickets/:id`)
   - Can view submitted ticket
   - Can add comments

#### **12.4 PM Ops Processing Workflow**

Once a ticket is submitted, PM Ops team processes it:

**1. Review Submitted Tickets**
- Navigate to PM Ops Dashboard (`/pm-ops`)
- View list of tickets in SUBMITTED status
- Sort by priority, date, or SBU
- Click ticket to open details

**2. Initial Review**
- Verify all required information provided
- Check chemical properties for accuracy
- Validate hazard classification
- Review SKU variant requests

**3. Assign SKUs**
- Access SKU Assignment section (PM Ops only)
- Generate SKU numbers for each variant
- Enter SKU details:
  - SKU number
  - Description
  - Package size
- Save SKU assignments

**4. Set Pricing**
- Access Pricing Data section (PM Ops only)
- Enter or calculate:
  - Standard cost
  - Calculated cost
  - Margin percentage
  - Limit price
  - List price
- Pricing calculations may use weight matrix data
- Save pricing information

**5. Change Status to IN_PROCESS**
- Click "Change Status" button
- Select "IN_PROCESS" from dropdown
- Optionally add notes (e.g., "Working on SKU assignment")
- Status changes recorded in status history
- Product Manager can see progress

**6. Complete Processing**
- Ensure all sections complete:
  - SKU variants assigned
  - Pricing finalized
  - Hazard classification verified
  - Quality specifications set
- Add any final comments
- Change status to NPDI_INITIATED or COMPLETED

#### **12.5 Status History & Audit Trail**

Every status change is recorded in the ticket's `statusHistory` array:

**Status History Entry:**
```javascript
{
  status: 'IN_PROCESS',
  changedBy: {
    id: 'pm-ops',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@milliporesigma.com'
  },
  changedAt: '2024-01-15T14:30:00.000Z',
  notes: 'Beginning SKU assignment process'
}
```

**View Status History:**
- Open ticket detail page
- Scroll to "Status History" section
- See complete timeline of all status changes
- Each entry shows:
  - Status name
  - Who changed it
  - When it was changed
  - Optional notes explaining why

**Permissions:**
- All roles can VIEW status history
- Only PM Ops and Admin can EDIT (change status)
- Product Managers have read-only access

#### **12.6 Comments & Activity Feed**

Tickets have a comments/activity feed for collaboration:

**Comment Features:**
- Add text comments
- Edit own comments (marked as edited)
- Delete own comments (Admin can delete any)
- Timestamp all comments
- Show user avatar and name

**Adding a Comment:**
1. Scroll to "Comments" section on ticket detail page
2. Type comment in text box
3. Click "Add Comment" button
4. Comment appears immediately
5. Other users see comment when they view ticket

**Activity Types:**
- Comment added
- Status changed
- SKU assigned
- Ticket edited
- User assigned

**Comment Schema:**
```javascript
{
  id: 'uuid-v4',
  user: {
    id: 'product-manager',
    name: 'John Smith',
    email: 'john.smith@milliporesigma.com',
    role: 'PRODUCT_MANAGER'
  },
  text: 'Please expedite this ticket - customer is waiting',
  timestamp: '2024-01-15T10:45:00.000Z',
  edited: false,
  editedAt: null
}
```

#### **12.7 Ticket Assignment**

Tickets can be assigned to specific users:

**Assignment Features:**
- Assign to PM Ops team member
- Assign to specific Product Manager
- Reassign to different user
- Unassign (back to team queue)

**How to Assign:**
1. Open ticket detail page
2. Click "Assign" button (or "Reassign" if already assigned)
3. Select user from dropdown
4. Click "Assign"
5. Assignee field updates
6. Assignment recorded in activity feed

**Dashboard Filtering:**
- "Assigned to Me" - Tickets assigned to current user
- "My Tickets" - Tickets created by current user
- "Unassigned" - Tickets not assigned to anyone

#### **12.8 Ticket Search & Filtering**

**Ticket List Page** (`/tickets`):

**Search Options:**
- Text search (searches title, description, ticket number, CAS number)
- Status filter (DRAFT, SUBMITTED, etc.)
- SBU filter (Life Science, Process Solutions, etc.)
- Priority filter (LOW, MEDIUM, HIGH, URGENT)
- Date range filter
- Created by (filter by creator)
- Assigned to (filter by assignee)

**Sorting Options:**
- Date created (newest/oldest)
- Date updated (most/least recent)
- Priority (highest/lowest)
- Ticket number (ascending/descending)
- Status (alphabetical)

**Saved Views:**
- All Tickets
- My Tickets
- Assigned to Me
- Drafts
- Submitted (awaiting review)
- In Process
- Completed

#### **12.9 Ticket Exports**

Tickets can be exported to various formats:

**Export Formats:**
- **Excel (.xlsx)** - Full ticket data in spreadsheet
- **CSV** - Comma-separated values
- **JSON** - Raw data export for integrations

**How to Export:**
1. Navigate to Ticket List page
2. Apply desired filters
3. Click "Export" button
4. Select format (Excel/CSV)
5. File downloads automatically
6. Contains all filtered tickets

**Export Fields:**
- Ticket number
- Title
- Status
- Priority
- Created by
- Created date
- SBU
- Product type
- CAS number
- SKU numbers
- And more...

---


## PART 4: KEY FEATURES

This part explores the major features and capabilities of the NPDI Portal that make it a powerful tool for product development tracking.

---

### **13. Dashboard System**

The NPDI Portal provides role-specific dashboards that give users quick access to relevant information and actions.

#### **13.1 Dashboard Overview**

**Three Dashboard Types:**
1. **Product Manager Dashboard** - For users with PRODUCT_MANAGER role
2. **PM Ops Dashboard** - For users with PM_OPS role
3. **Admin Dashboard** - For users with ADMIN role

All dashboards feature:
- Real-time statistics and metrics
- Quick action buttons
- Recent tickets display
- Status filtering
- Search functionality
- Responsive design for desktop and mobile

#### **13.2 Product Manager Dashboard**

**Location:** `client/src/pages/Dashboard.jsx`
**Route:** `/dashboard`
**Access:** All authenticated users (default dashboard)

**Key Components:**

**1. Statistics Cards:**
- **Total Tickets** - Count of all tickets created
- **Submitted Tickets** - Tickets awaiting review
- **In Process** - Tickets currently being worked on
- **Completed** - Successfully finished tickets

Each card displays:
- Large number (count)
- Descriptive label
- Icon representing the metric
- Trend indicator (optional)
- Click to filter tickets by that status

**2. Quick Actions:**
- **New Ticket** button - Opens ticket creation form
- **View All Tickets** link - Navigates to full ticket list
- **View Drafts** link - Shows only draft tickets

**3. Recent Tickets Section:**
- Displays 5 most recently updated tickets
- Shows: Ticket number, title, status, priority, last updated
- Status and priority badges color-coded
- Click ticket to view details

**4. Draft Tickets Section** (if user has drafts):
- Lists all draft tickets created by current user
- Quick action to continue editing or delete
- Shows creation date

**5. This Week Activity** (optional):
- Tickets created this week
- Tickets submitted this week
- Tickets completed this week

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Dashboard                          [New Ticket]    │
├─────────────────────────────────────────────────────┤
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐        │
│  │ Total │  │ Sub-  │  │ In    │  │ Comp- │        │
│  │  42   │  │ mitted│  │ Proc  │  │ leted │        │
│  │       │  │  12   │  │  18   │  │  10   │        │
│  └───────┘  └───────┘  └───────┘  └───────┘        │
│                                                      │
│  Recent Tickets                     [View All]      │
│  ┌─────────────────────────────────────────────┐   │
│  │ NPDI-2024-001 │ New Chemical │ SUBMITTED │  │   │
│  │ NPDI-2024-002 │ Test Kit     │ IN_PROCESS│  │   │
│  │ ...                                        │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  My Drafts                          [View All]      │
│  ┌─────────────────────────────────────────────┐   │
│  │ DRAFT-001 │ Untitled Product │ Created 2h  │    │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────── ┘
```

**Key Code Snippets:**

Fetching dashboard stats:
```javascript
const fetchStats = async () => {
  try {
    const response = await productAPI.getDashboardStats();
    setStats(response.data);
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    toast.error('Failed to load dashboard statistics');
  }
};
```

Rendering stat cards:
```javascript
<div className="stats-card">
  <div className="stat-number">{stats.totalTickets}</div>
  <div className="stat-label">Total Tickets</div>
  <ClockIcon className="stat-icon" />
</div>
```

#### **13.3 PM Ops Dashboard**

**Location:** `client/src/pages/PMOPSDashboard.jsx`
**Route:** `/pm-ops`
**Access:** PM_OPS and ADMIN roles only

**Key Features:**

**1. Enhanced Statistics:**
- All statistics from Product Manager dashboard
- **Awaiting Review** - Count of submitted tickets
- **This Week** - Tickets created this week
- **Monthly Rate** - Average tickets per month
- **Urgent Priority** - Count of urgent tickets

**2. Recently Submitted Section:**
- Shows 5 most recently submitted tickets
- Highlighted for immediate attention
- One-click status change buttons
- Quick assignment dropdown

**3. Bulk Actions:**
- Select multiple tickets
- Change status in bulk
- Assign to user in bulk
- Export selected tickets

**4. Advanced Filters:**
- Filter by status, SBU, priority
- Date range filtering
- Assigned to / created by filters
- Search across all fields

**5. Inline Status Management:**
- Change ticket status without opening details
- Add notes when changing status
- Status change recorded in history

**PM Ops Dashboard Layout:**
```
┌─────────────────────────────────────────────────────┐
│  PM Ops Dashboard                                    │
├─────────────────────────────────────────────────────┤
│  ┌───────┐  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │Awaiting│ │ This   │  │Monthly │  │ Urgent │     │
│  │ Review │  │ Week   │  │  Rate  │  │   5    │     │
│  │   8    │  │   15   │  │  32/mo │  │        │     │
│  └───────┘  └────────┘  └────────┘  └────────┘     │
│                                                      │
│  Recently Submitted (Needs Action)                  │
│  ┌─────────────────────────────────────────────┐   │
│  │☐ NPDI-2024-015 │ Life Sci │ [Review][Assign]│   │
│  │☐ NPDI-2024-014 │ Process  │ [Review][Assign]│   │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  [Filters: Status ▼ | SBU ▼ | Priority ▼ ]         │
│  All Tickets                    [Export Selected]   │
│  ┌─────────────────────────────────────────────┐   │
│  │☐ NPDI-2024-013 │ IN_PROCESS │ [Change Status]│  │
│  │☐ NPDI-2024-012 │ SUBMITTED  │ [Change Status]│  │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────── ┘
```

**Inline Status Change:**
```javascript
const handleStatusChange = async (ticketId, newStatus, reason = '') => {
  try {
    await productAPI.updateStatus(ticketId, { status: newStatus, reason });
    toast.success('Status updated successfully');
    fetchData();  // Refresh dashboard
  } catch (error) {
    toast.error('Failed to update status');
  }
};
```

#### **13.4 Admin Dashboard**

**Location:** `client/src/pages/AdminDashboard.jsx`
**Route:** `/admin`
**Access:** ADMIN role only

**Key Sections:**

**1. System Overview:**
- Total users count
- Total tickets count
- Active users count
- Database size (optional)
- System uptime (optional)

**2. User Management:**
- List all users with roles
- Create new users
- Edit user details
- Deactivate users
- View user activity

**3. Form Configuration:**
- Access to Form Configuration Editor
- Restore default configuration
- View configuration history

**4. Permissions Management:**
- View current role permissions
- Edit permissions for each role
- Restore default permissions

**5. System Settings:**
- SMTP configuration for email
- PubChem API settings
- Maintenance mode toggle
- Application settings

**6. Template Management:**
- Create ticket templates
- Edit existing templates
- Delete templates
- Preview templates

**7. Recent Activity Log:**
- User login events
- Ticket creations
- Status changes
- Permission changes
- Configuration updates

Admin Dashboard Features:
```javascript
// Admin panel sections
const adminSections = [
  { name: 'User Management', icon: UsersIcon, path: '/admin/users' },
  { name: 'Form Configuration', icon: DocumentIcon, path: '/admin/form-config' },
  { name: 'Permissions', icon: ShieldIcon, path: '/admin/permissions' },
  { name: 'System Settings', icon: CogIcon, path: '/admin/settings' },
  { name: 'Templates', icon: TemplateIcon, path: '/admin/templates' }
];
```

#### **13.5 Dashboard Animations**

All dashboards feature smooth animations for better UX:

**1. Fade-in on Load:**
Statistics cards fade in sequentially with a stagger effect.

**2. Number Count-up:**
Statistics numbers animate from 0 to their actual value.

**3. Slide-in Effects:**
Recent tickets slide in from the right.

**4. Loading Skeletons:**
Placeholder skeletons shown while data loads.

**Animation Example:**
```javascript
const [isAnimating, setIsAnimating] = useState(true);
const [enableTransition, setEnableTransition] = useState(false);

useEffect(() => {
  // Enable transition after data loads
  setTimeout(() => {
    setEnableTransition(true);
    setTimeout(() => setIsAnimating(false), 50);
  }, 100);
}, [stats]);

// CSS classes
className={`stat-card transition-all duration-500 ${
  isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
}`}
```

#### **13.6 Dashboard Refresh**

Dashboards support manual and automatic refresh:

**Manual Refresh:**
- Refresh icon button in top-right corner
- Click to reload all data
- Shows loading spinner during refresh

**Auto-Refresh (Optional):**
Can be implemented with:
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchStats();
    fetchMyTickets();
  }, 60000); // Refresh every 60 seconds

  return () => clearInterval(interval);
}, []);
```

---

### **14. Data Export Features**

The NPDI Portal provides powerful export capabilities to get ticket data into external systems.

#### **14.1 Export Overview**

**Available Export Formats:**
1. **Excel (.xlsx)** - Comprehensive data export (recommended)
2. **CSV** - Comma-separated values for import into other systems
3. **PDP Checklist** - SAP Product Development Process checklist format
4. **PIF** - Product Information Form

**Export Locations:**
- Ticket List page - Export multiple tickets
- Ticket Detail page - Export single ticket
- Dashboard - Quick export of filtered tickets

#### **14.2 Excel Data Export**

**Service:** `server/services/dataExportService.js`
**Library:** ExcelJS

**Features:**
- ✅ All ticket fields exported
- ✅ Organized into sections with headers
- ✅ Color-coded section headers (blue background)
- ✅ Field names in bold with gray background
- ✅ Values formatted and readable
- ✅ Arrays converted to comma-separated lists
- ✅ Objects formatted as JSON
- ✅ Proper column widths
- ✅ Text wrapping for long values

**Export Structure:**
```
┌─────────────────────────────────────────────┐
│ BASIC INFORMATION (blue header, white text)│
├─────────────────────────────────────────────┤
│ Ticket Number    │ NPDI-2024-001            │
│ Product Name     │ Ascorbic Acid 99%        │
│ Status           │ SUBMITTED                │
│ Priority         │ HIGH                     │
│ ...              │ ...                      │
├─────────────────────────────────────────────┤
│ CHEMICAL PROPERTIES (blue header)           │
├─────────────────────────────────────────────┤
│ CAS Number       │ 50-81-7                  │
│ Molecular Formula│ C6H8O6                   │
│ Molecular Weight │ 176.12 g/mol             │
│ ...              │ ...                      │
├─────────────────────────────────────────────┤
│ SKU VARIANTS (blue header)                  │
├─────────────────────────────────────────────┤
│ SKU 1            │ 100mg - $45.00           │
│ SKU 2            │ 1g - $120.00             │
│ ...              │ ...                      │
└─────────────────────────────────────────────┘
```

**Sections Included:**
1. Basic Information
2. Product Scope & Distribution
3. Chemical Properties
4. Additional Chemical Properties
5. Hazard Classification
6. Quality Specifications
7. Composition
8. SKU Variants (one per variant)
9. Regulatory Information
10. Comments
11. Status History

**Export Code:**
```javascript
const generateDataExport = async (ticket) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ticket Data Export');

  // Set column widths
  worksheet.columns = [
    { key: 'field', width: 40 },
    { key: 'value', width: 60 }
  ];

  // Add section headers and fields
  addSectionHeader('BASIC INFORMATION');
  addField('Ticket Number', ticket.ticketNumber);
  addField('Product Name', ticket.productName);
  // ... more fields

  // Generate buffer and return
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
```

**API Endpoint:**
```http
GET /api/products/:id/export/data
Response: Excel file download
```

**Client Usage:**
```javascript
const handleExport = async (ticketId) => {
  try {
    const response = await productAPI.exportTicketData(ticketId);
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ticket-${ticketId}-data.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    toast.error('Export failed');
  }
};
```

#### **14.3 CSV Export**

**Features:**
- Simple tabular format
- One row per ticket
- All major fields as columns
- Easy import into Excel, Google Sheets, or databases
- UTF-8 encoding for international characters

**CSV Format:**
```csv
Ticket Number,Product Name,Status,Priority,CAS Number,Created By,Created At,SBU
NPDI-2024-001,Ascorbic Acid,SUBMITTED,HIGH,50-81-7,john.smith@milliporesigma.com,2024-01-15,Life Science
NPDI-2024-002,Test Kit A,IN_PROCESS,MEDIUM,,sarah.johnson@milliporesigma.com,2024-01-14,Process Solutions
```

**API Endpoint:**
```http
GET /api/products/export/csv
Query Parameters:
  - status: Filter by status
  - sbu: Filter by SBU
  - startDate, endDate: Date range
Response: CSV file download
```

#### **14.4 PDP Checklist Export**

**Service:** `server/services/pdpChecklistExportService.js`
**Purpose:** Generate SAP Product Development Process checklist

**Features:**
- Formatted for SAP import
- All required fields for PDP process
- Checklist items with completion status
- Compliance tracking
- Phase gates and milestones

**PDP Checklist Sections:**
1. Product Definition
2. Market Research
3. Technical Feasibility
4. Regulatory Assessment
5. Manufacturing Capability
6. Quality Specifications
7. Launch Readiness

**Export Format:** Excel workbook with multiple sheets

#### **14.5 PIF (Product Information Form) Export**

**Service:** `server/services/pifExportService.js`
**Purpose:** Generate standardized product information form

**Features:**
- Product specifications
- Chemical properties
- Hazard information
- Regulatory compliance data
- Quality control specifications
- Storage and handling

**PIF Structure:**
- Cover page with product overview
- Detailed chemical data
- Safety information
- Quality specifications
- Regulatory approvals
- References and notes

#### **14.6 Bulk Export**

**Feature:** Export multiple tickets at once

**From Ticket List:**
1. Select checkboxes next to desired tickets
2. Click "Export Selected" button
3. Choose export format
4. All selected tickets exported to single file

**Multi-Ticket Excel Export:**
- One sheet per ticket
- Sheet named with ticket number
- Same format as single ticket export
- Summary sheet with all ticket metadata

**Bulk Export Options:**
```javascript
// Export all filtered tickets
await productAPI.exportTickets({
  status: 'SUBMITTED',
  sbu: 'Life Science',
  format: 'excel'  // or 'csv'
});
```

#### **14.7 Export Permissions**

| Role | Can Export Own Tickets | Can Export All Tickets |
|------|----------------------|----------------------|
| PRODUCT_MANAGER | ✅ Yes | ❌ No |
| PM_OPS | ✅ Yes | ✅ Yes |
| ADMIN | ✅ Yes | ✅ Yes |

#### **14.8 Export Performance**

**Optimizations:**
- Streaming for large exports
- Compression for faster downloads
- Caching for repeated exports

**Export Limits:**
- Single ticket: No limit
- Bulk export: Max 1000 tickets per request
- For larger exports, use API with pagination

---

### **15. External Integrations**

The NPDI Portal integrates with external systems to auto-populate data and enhance functionality.

#### **15.1 Integration Overview**

**Integrated Systems:**
1. **PubChem** - Chemical compound database
2. **SAP / Palantir MARA** - Product master data
3. **Similar Products Search** - CAS-based product lookup

**Integration Architecture:**
```
NPDI Portal
     │
     ├── PubChem REST API (chemicals)
     │   └── https://pubchem.ncbi.nlm.nih.gov/rest/pug
     │
     └── Palantir MARA API (SAP data)
         └── https://[palantir-url]/api/mara
```

#### **15.2 PubChem Integration**

**Purpose:** Auto-populate chemical properties from PubChem database

**PubChem Resources:**
- Compound database with 100M+ chemicals
- Free REST API
- Data includes: names, formulas, properties, synonyms, structure data

**How It Works:**

1. **User enters CAS number** in Chemical Properties section
2. **User clicks "Auto-fill from PubChem"** button
3. **System queries PubChem API** with CAS number
4. **PubChem returns compound data**
5. **Form fields auto-populate** with retrieved data
6. **Green highlight** indicates auto-filled fields
7. **User can edit** any auto-filled field (highlight removes)

**PubChem API Endpoints Used:**

**1. Get Compound by CAS:**
```http
GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{casNumber}/JSON

Example: GET .../compound/name/50-81-7/JSON
Returns: Compound data for Ascorbic Acid
```

**2. Get Compound Properties:**
```http
GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON
```

**Data Fetched from PubChem:**
- **CID** (PubChem Compound ID)
- **IUPAC Name** (systematic chemical name)
- **Molecular Formula** (e.g., C6H8O6)
- **Molecular Weight** (g/mol)
- **Canonical SMILES** (structure representation) - *Used for molecular structure visualization*
- **InChI** (International Chemical Identifier)
- **InChIKey** (hashed InChI for searching)
- **Synonyms** (alternative names)
- **Compound Description**
- **Additional Properties:**
  - Melting point
  - Boiling point
  - Flash point
  - Density
  - LogP (partition coefficient)
  - Polar surface area
  - H-bond donors/acceptors
  - Rotatable bonds
  - Exact mass
  - Complexity

#### **15.3 Molecular Structure Viewer**

**Purpose:** Professional 2D molecular structure visualization using RDKit-JS

**Key Features:**
- **Client-side rendering** - All processing happens in the browser for privacy
- **ACS 1996 skeletal formula standards** - Professional chemical drawing conventions
- **Proper zigzag patterns** - Correct sp3 carbon chain geometry (e.g., butanol, pseudoephedrine)
- **Interactive rotation controls** - Adjust molecule orientation with ±5° buttons or direct input
- **Monochrome output** - Clean black-on-white structures for clarity

**How It Works:**

1. **User enters SMILES** string in Chemical Properties form (manually or via PubChem auto-population)
2. **Structure appears automatically** in the right column of the form
3. **RDKit-JS generates 2D coordinates** using coordgen algorithm for optimal geometry
4. **Rendering pipeline:**
   - Cyclic molecules: Uses `straighten_depiction()` + `normalize_depiction()` for clean ring alignment
   - Linear molecules: Uses `normalize_depiction()` for horizontal main axis
   - Applies rotation transformation if specified
5. **User can rotate** the structure using controls in the viewer header
   - Click **−** button to rotate counter-clockwise by 5°
   - Click **+** button to rotate clockwise by 5°
   - Enter exact degree value in the input field
   - Rotation resets to 0° when SMILES changes

**Technical Implementation:**

**Component:** `client/src/components/MoleculeViewerRDKit.jsx`

```javascript
// RDKit-JS loads from CDN (unpkg.com/@rdkit/rdkit)
// Initializes WebAssembly module on component mount
const RDKit = await window.initRDKitModule();

// For each SMILES string:
const mol = rdkit.get_mol(smiles);

// Generate optimal 2D coordinates (cyclic molecules only)
if (numRings > 0) {
  mol.set_new_coords(true); // Use coordgen
}

// Apply alignment
mol.straighten_depiction();  // Bonds at 30° multiples
mol.normalize_depiction(1);  // Horizontal main axis

// Generate SVG with rotation
let svg = mol.get_svg_with_highlights(JSON.stringify({
  width: 300,
  height: 250,
  rotate: rotationAngle,  // User-controlled
  fixedBondLength: 30,    // ACS standard
  backgroundColour: [1, 1, 1],  // White
  symbolColour: [0, 0, 0]        // Black
}));
```

**Form Integration:** `client/src/components/forms/ChemicalPropertiesForm.jsx`

The molecular structure viewer appears in the Chemical Properties section when a valid SMILES string is present. Layout:
- **Left column:** SMILES, InChI, InChI Key, Physical State, Shipping Conditions
- **Right column:** Molecular Structure viewer with rotation controls

**Rotation Controls:**
```jsx
<div className="flex items-center gap-2">
  <button onClick={() => setRotation(prev => prev - 5)}>−</button>
  <input
    type="number"
    value={rotation}
    onChange={(e) => setRotation(parseInt(e.target.value))}
  />
  <span>°</span>
  <button onClick={() => setRotation(prev => prev + 5)}>+</button>
</div>
```

**Privacy & Security:**
- No external API calls for structure rendering
- All processing in browser via WebAssembly
- SMILES data never leaves the client
- CDN-loaded library (cached after first load)

**Supported SMILES Features:**
- Linear and cyclic molecules
- Aromatic rings (benzene, etc.)
- Heteroatoms (N, O, S, P, etc.)
- Stereochemistry (wedge/dash bonds)
- Complex polycyclic structures

**Example Molecules:**
- Ethanol: `CCO`
- Butanol: `CCCCO`
- Benzene: `c1ccccc1`
- Diphenhydramine: `CN(C)CCOC(c1ccccc1)c2ccccc2`
- Pseudoephedrine: `CC(C(c1ccccc1)O)NC`

**Implementation:**

**Frontend (`ChemicalPropertiesForm.jsx`):**
```javascript
const handlePubChemLookup = async () => {
  if (!casNumber) {
    toast.error('Please enter a CAS number');
    return;
  }

  setCasLookupLoading(true);
  try {
    // Call PubChem API via backend proxy
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${casNumber}/JSON`
    );
    const data = await response.json();

    // Extract compound data
    const compound = data.PC_Compounds[0];
    const properties = compound.props;

    // Auto-fill form fields
    setValue('chemicalProperties.molecularFormula', 
      properties.find(p => p.urn.label === 'Molecular Formula')?.value.sval
    );
    setValue('chemicalProperties.molecularWeight',
      properties.find(p => p.urn.label === 'Molecular Weight')?.value.fval
    );
    setValue('chemicalProperties.iupacName',
      properties.find(p => p.urn.label === 'IUPAC Name')?.value.sval
    );

    setAutoPopulated(true);  // Show green highlights
    toast.success('Chemical properties loaded from PubChem');
  } catch (error) {
    console.error('PubChem lookup failed:', error);
    toast.error('Could not fetch data from PubChem');
  } finally {
    setCasLookupLoading(false);
  }
};
```

**PubChem Configuration (System Settings):**
```javascript
{
  pubchem: {
    enabled: true,
    apiKey: null,  // Not currently required
    rateLimit: 5,  // Max 5 requests per second
    cacheResults: true,
    cacheDuration: 86400  // 24 hours
  }
}
```

**Error Handling:**
- **CAS not found:** Show friendly message, allow manual entry
- **API timeout:** Retry with exponential backoff
- **Rate limit exceeded:** Queue requests
- **Network error:** Fallback to manual entry

#### **15.3 SAP / Palantir MARA Integration**

**Purpose:** Import existing product data from SAP system via Palantir MARA API

**MARA:** Material Master data in SAP

**How It Works:**

1. **User clicks "Import from SAP"** button
2. **MARASearchPopup opens** with search interface
3. **User searches by:** SKU, CAS number, or product name
4. **System queries Palantir MARA API**
5. **Results displayed** in searchable table
6. **User selects a product**
7. **SAP data auto-fills** form fields (green highlight)
8. **User can edit** any imported field

**MARA Search Popup Component:**

**Location:** `client/src/components/admin/MARASearchPopup.jsx`

**Features:**
- Search by SKU, CAS, or name
- Paginated results table
- Column sorting
- Quick preview of product details
- Select button to import data

**API Endpoint:**
```http
POST https://[palantir-url]/api/mara/search
Content-Type: application/json

{
  "query": "50-81-7",
  "searchType": "cas",
  "limit": 50
}

Response:
{
  "results": [
    {
      "materialNumber": "A1234567",
      "description": "Ascorbic Acid 99% USP",
      "casNumber": "50-81-7",
      "manufacturer": "Sigma-Aldrich",
      "packageSize": "100g",
      "materialGroup": "CHEM-001",
      "storageConditions": "Room temperature",
      // ... more fields
    }
  ],
  "totalCount": 1
}
```

**Imported Fields:**
- Product name / description
- CAS number
- Manufacturer
- Package size and unit
- Material group
- Storage conditions
- Shelf life
- Hazard classification
- UN number (if applicable)
- Catalog number
- Vendor part number

**SAP Import Flow:**
```javascript
const handleSAPImport = async (selectedProduct) => {
  // Mark which fields were imported
  const importedFields = new Set();

  // Auto-fill form fields from SAP data
  if (selectedProduct.description) {
    setValue('productName', selectedProduct.description);
    importedFields.add('productName');
  }

  if (selectedProduct.casNumber) {
    setValue('chemicalProperties.casNumber', selectedProduct.casNumber);
    importedFields.add('chemicalProperties.casNumber');
  }

  // ... import more fields

  // Track SAP-imported fields for green highlighting
  setSAPImportedFields(importedFields);

  // Store SAP metadata for reference
  setSAPMetadata({
    source: 'SAP MARA',
    importedAt: new Date(),
    materialNumber: selectedProduct.materialNumber
  });

  toast.success(`Imported data from SAP (Material ${selectedProduct.materialNumber})`);
  setShowSAPPopup(false);
};
```

**Green Highlight for SAP Data:**
```javascript
// CSS class for SAP-imported fields
const getSAPImportedClass = (fieldPath) => {
  if (sapImportedFields.has(fieldPath)) {
    return 'bg-green-100 border-green-300';  // Green background
  }
  return '';
};

// Apply to input field
<input
  className={`form-input ${getSAPImportedClass('productName')}`}
  {...register('productName')}
  onChange={(e) => {
    // Remove green highlight when user edits
    handleFieldEdit('productName');
  }}
/>
```

**SAP Configuration (System Settings):**
```javascript
{
  sap: {
    palantirUrl: 'https://palantir.example.com',
    apiKey: 'encrypted-api-key',
    enabled: true,
    timeout: 30000  // 30 seconds
  }
}
```

#### **15.4 Similar Products Search**

**Purpose:** Find similar products based on CAS number

**Component:** `client/src/components/admin/SimilarProductsPopup.jsx`

**How It Works:**

1. **User enters CAS number**
2. **Clicks "Find Similar Products"** button
3. **System searches** internal database and external sources
4. **Results display** similar products with same/related CAS
5. **User can view** existing product details
6. **Use as reference** for creating new product

**Search Sources:**
- Internal NPDI database (existing tickets)
- SAP MARA (via Palantir)

**Similar Products Display:**
```
┌──────────────────────────────────────────────────┐
│ Similar Products for CAS 50-81-7                │
├──────────────────────────────────────────────────┤
│ Found 3 matching products:                       │
│                                                  │
│ 1. NPDI-2023-045 - Ascorbic Acid 98%           │
│    Status: COMPLETED | SBU: Life Science        │
│    [View Details]                               │
│                                                  │
│ 2. SAP A1234567 - L-Ascorbic Acid USP          │
│    Package: 100g, 500g, 1kg                     │
│    [Import Data]                                │
│                                                  │
│ 3. NPDI-2024-003 - Vitamin C (Ascorbic Acid)   │
│    Status: IN_PROCESS | SBU: Healthcare         │
│    [View Details]                               │
└──────────────────────────────────────────────────┘
```

**Benefits:**
- Avoid duplicate products
- Reference existing data
- Ensure consistency
- Speed up data entry

---

### **16. User Interface Components**

The NPDI Portal uses a consistent set of UI components built with React and Tailwind CSS.

#### **16.1 UI Component Library**

**Design System:**
- **Framework:** React 18
- **Styling:** Tailwind CSS 3
- **Icons:** Heroicons (by Tailwind Labs)
- **Notifications:** react-hot-toast
- **Forms:** React Hook Form
- **Modals:** Custom modal components

**Color Palette:**
```css
Primary Blue: #4472C4
Success Green: #10B981
Warning Yellow: #F59E0B
Danger Red: #EF4444
Gray Scale: #F3F4F6, #E5E7EB, #D1D5DB, #9CA3AF, #6B7280, #4B5563, #374151
```

#### **16.2 Core Components**

**1. Badges**

**Legacy Badge Components**

**Location:** `client/src/components/badges.jsx`

**StatusBadge:**
```javascript
<StatusBadge status="SUBMITTED" />
<StatusBadge status="IN_PROCESS" />
<StatusBadge status="COMPLETED" />
```

Status Colors:
- DRAFT: Gray
- SUBMITTED: Blue
- IN_PROCESS: Yellow
- NPDI_INITIATED: Purple
- COMPLETED: Green
- CANCELED: Red

**PriorityBadge:**
```javascript
<PriorityBadge priority="HIGH" />
```

Priority Colors:
- LOW: Green
- MEDIUM: Blue
- HIGH: Orange
- URGENT: Red (pulsing animation)

**New Reusable Badge Components (v1.2.0)**

**Location:** `client/src/components/common/Badge.jsx`

These components provide consistent badge styling across the application:

**RoleBadge** - Display user roles with color coding:
```javascript
import { RoleBadge } from '../components/common/Badge';

<RoleBadge role="PRODUCT_MANAGER" />
<RoleBadge role="PM_OPS" />
<RoleBadge role="ADMIN" />
```

Role Colors:
- PRODUCT_MANAGER: Blue
- PM_OPS: Purple
- ADMIN: Red

**ActiveStatusBadge** - Display active/inactive status:
```javascript
import { ActiveStatusBadge } from '../components/common/Badge';

<ActiveStatusBadge active={true} />   // Green "Active"
<ActiveStatusBadge active={false} />  // Gray "Inactive"
```

**GenericBadge** - Custom color-coded badges:
```javascript
import { GenericBadge } from '../components/common/Badge';

<GenericBadge text="Custom" color="blue" />
<GenericBadge text="Warning" color="yellow" />
<GenericBadge text="Error" color="red" />
```

Available colors: gray, blue, green, yellow, red, purple, orange

**2. Buttons**

**Button Variants:**
```javascript
// Primary button (blue background)
<button className="btn-primary">Save</button>

// Secondary button (white background, blue border)
<button className="btn-secondary">Cancel</button>

// Danger button (red background)
<button className="btn-danger">Delete</button>

// Ghost button (transparent)
<button className="btn-ghost">View Details</button>

// Icon button
<button className="btn-icon">
  <PlusIcon className="w-5 h-5" />
</button>
```

**Button States:**
- Default
- Hover (darker shade)
- Active (even darker)
- Disabled (gray, cursor-not-allowed)
- Loading (spinner icon)

**3. Form Inputs**

**Text Input:**
```javascript
<input 
  type="text"
  className="form-input"
  placeholder="Enter product name"
  {...register('productName', { required: true })}
/>
```

**Select Dropdown:**
```javascript
<select className="form-select" {...register('sbu')}>
  <option value="">Select SBU</option>
  <option value="Life Science">Life Science</option>
  <option value="Process Solutions">Process Solutions</option>
</select>
```

**Textarea:**
```javascript
<textarea 
  className="form-textarea"
  rows="4"
  {...register('description')}
/>
```

**Checkbox:**
```javascript
<input 
  type="checkbox"
  className="form-checkbox"
  {...register('requiresSDS')}
/>
<label>Requires SDS</label>
```

**Radio Buttons:**
```javascript
<input type="radio" value="In-House" {...register('productionType')} />
<label>In-House</label>
<input type="radio" value="Third Party" {...register('productionType')} />
<label>Third Party</label>
```

**4. Cards**

**Card Component:**
```javascript
<div className="card">
  <div className="card-header">
    <h3>Ticket Information</h3>
  </div>
  <div className="card-body">
    <p>Card content goes here</p>
  </div>
  <div className="card-footer">
    <button className="btn-primary">Action</button>
  </div>
</div>
```

**Stat Card:**
```javascript
<div className="stat-card">
  <div className="stat-icon">
    <DocumentIcon />
  </div>
  <div className="stat-number">42</div>
  <div className="stat-label">Total Tickets</div>
</div>
```

**5. Modals**

**Modal Structure:**
```javascript
{showModal && (
  <div className="modal-backdrop">
    <div className="modal">
      <div className="modal-header">
        <h2>Modal Title</h2>
        <button onClick={() => setShowModal(false)}>
          <XMarkIcon />
        </button>
      </div>
      <div className="modal-body">
        Modal content
      </div>
      <div className="modal-footer">
        <button className="btn-secondary" onClick={() => setShowModal(false)}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleConfirm}>
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

**Modal Features:**
- Click outside to close (optional)
- ESC key to close
- Smooth fade-in/fade-out animations
- Centered positioning
- Focus trap (accessibility)
- Backdrop blur effect

**6. Loading States**

**LoadingSpinner Component (v1.2.0 - Recommended)**

**Location:** `client/src/components/common/LoadingSpinner.jsx`

The new reusable loading spinner with customizable sizes and messages:

```javascript
import LoadingSpinner from '../components/common/LoadingSpinner';

// Default medium size
<LoadingSpinner />

// With custom message
<LoadingSpinner message="Loading ticket data..." />

// Small size
<LoadingSpinner size="sm" />

// Large size with message
<LoadingSpinner size="lg" message="Processing..." />
```

Available sizes: `sm`, `md` (default), `lg`

**Empty State Component (v1.2.0)**

**Location:** `client/src/components/common/EmptyState.jsx`

Consistent empty data state display:

```javascript
import EmptyState from '../components/common/EmptyState';

// Basic empty state
<EmptyState message="No tickets found" />

// With custom icon and action
<EmptyState
  icon={DocumentIcon}
  title="No Tickets"
  message="Create your first ticket to get started"
  actionLabel="Create Ticket"
  onAction={() => navigate('/tickets/new')}
/>
```

**Legacy Loading Patterns:**

**Skeleton Loaders:**
```javascript
<div className="skeleton-card">
  <div className="skeleton-line w-1/2"></div>
  <div className="skeleton-line w-3/4"></div>
  <div className="skeleton-line w-full"></div>
</div>
```

**Button Loading:**
```javascript
<button className="btn-primary" disabled={loading}>
  {loading ? (
    <>
      <ArrowPathIcon className="w-5 h-5 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</button>
```

**7. Tables**

**Data Table:**
```javascript
<table className="data-table">
  <thead>
    <tr>
      <th>Ticket Number</th>
      <th>Product Name</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {tickets.map(ticket => (
      <tr key={ticket._id}>
        <td>{ticket.ticketNumber}</td>
        <td>{ticket.productName}</td>
        <td><StatusBadge status={ticket.status} /></td>
        <td>
          <button className="btn-icon">
            <EyeIcon className="w-5 h-5" />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Table Features:**
- Striped rows (alternating colors)
- Hover effect on rows
- Sortable columns (optional)
- Sticky header (optional)
- Responsive (scrollable on mobile)

**8. Toasts/Notifications**

**react-hot-toast Usage:**
```javascript
import toast from 'react-hot-toast';

// Success
toast.success('Ticket created successfully!');

// Error
toast.error('Failed to save ticket');

// Warning
toast('Please review the form', { icon: '⚠️' });

// Loading
const toastId = toast.loading('Saving...');
// Later:
toast.success('Saved!', { id: toastId });

// Custom
toast.custom((t) => (
  <div className="custom-toast">
    <span>Custom notification</span>
    <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
  </div>
));
```

**Toast Configuration:**
```javascript
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
    },
    success: {
      duration: 3000,
      iconTheme: {
        primary: '#10B981',
        secondary: '#fff',
      },
    },
    error: {
      duration: 5000,
      iconTheme: {
        primary: '#EF4444',
        secondary: '#fff',
      },
    },
  }}
/>
```

#### **16.3 Layout Components**

**1. Layout / App Shell**

**Location:** `client/src/components/Layout.jsx`

**Structure:**
```
┌────────────────────────────────────────────────┐
│ Header (Logo, Nav, User Menu)                 │
├────────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                    │
│ Nav     │                                      │
│         │ ┌──────────────────────────────────┐│
│         │ │ Page Content (Outlet)            ││
│         │ │                                  ││
│         │ │                                  ││
│         │ └──────────────────────────────────┘│
└────────────────────────────────────────────────┘
```

**Navigation Links:**
- Dashboard
- Tickets (with badge showing count)
- Create Ticket
- Drafts
- PM Ops Dashboard (PM_OPS/ADMIN only)
- Admin Panel (ADMIN only)

**User Menu (top-right):**
- User name and role display
- User avatar with initials
- Dropdown menu:
  - My Profile
  - User Preferences
  - Logout

**2. Sidebar Navigation**

**Features:**
- Collapsible (hamburger icon)
- Active link highlighting
- Icon + text labels
- Badge notifications
- Smooth transitions

**3. Breadcrumbs**

```javascript
<nav className="breadcrumbs">
  <Link to="/">Home</Link>
  <span>/</span>
  <Link to="/tickets">Tickets</Link>
  <span>/</span>
  <span>NPDI-2024-001</span>
</nav>
```

#### **16.4 Responsive Design**

**Breakpoints (Tailwind):**
- `sm`: 640px (small devices)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large screens)

**Mobile Optimizations:**
- Hamburger menu for navigation
- Stacked cards instead of grids
- Horizontal scrolling tables
- Larger touch targets (min 44x44px)
- Simplified forms (one column)

**Example Responsive Classes:**
```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>
```

#### **16.5 Reusable Utilities (v1.2.0)**

The following utility modules provide consistent helper functions across the application.

**Backend Utilities**

**errorHandler.js** - Error handling utilities

**Location:** `server/utils/errorHandler.js`

```javascript
const { asyncHandler, sendErrorResponse, sendSuccessResponse } = require('../utils/errorHandler');

// Wrap async route handlers to catch errors
router.get('/tickets', asyncHandler(async (req, res) => {
  const tickets = await ProductTicket.find();
  sendSuccessResponse(res, tickets, 'Tickets retrieved successfully');
}));

// Send standardized error responses
router.get('/ticket/:id', asyncHandler(async (req, res) => {
  const ticket = await ProductTicket.findById(req.params.id);
  if (!ticket) {
    return sendErrorResponse(res, 'Ticket not found', 404);
  }
  sendSuccessResponse(res, ticket);
}));
```

Available functions:
- `asyncHandler(fn)` - Wraps async functions to catch errors
- `sendErrorResponse(res, message, statusCode)` - Standardized error response
- `sendSuccessResponse(res, data, message)` - Standardized success response
- `sendValidationError(res, errors)` - Validation error response
- `handleNotFound(res, resource)` - 404 response helper

**Frontend Utilities**

**dateFormatters.js** - Date formatting utilities

**Location:** `client/src/utils/dateFormatters.js`

```javascript
import { formatDate, formatDateOnly, formatTimeAgo } from '../utils/dateFormatters';

// Full date and time: "Jan 15, 2025, 3:30 PM"
const formatted = formatDate(ticket.createdAt);

// Date only: "Jan 15, 2025"
const dateOnly = formatDateOnly(ticket.createdAt);

// Relative time: "2 hours ago", "3 days ago"
const relative = formatTimeAgo(ticket.updatedAt);
```

Available functions:
- `formatDate(date)` - Full date and time
- `formatDateOnly(date)` - Date without time
- `formatDateTime(date, options)` - Customizable formatting
- `formatTimeAgo(date)` - Relative time (e.g., "2 hours ago")
- `formatTimeOnly(date)` - Time only (e.g., "3:30 PM")
- `formatDateISO(date)` - ISO 8601 format
- `formatDuration(seconds)` - Duration display (e.g., "2h 30m")

**currencyUtils.js** - Currency formatting utilities

**Location:** `client/src/utils/currencyUtils.js`

```javascript
import { getCurrencySymbol, formatPrice } from '../utils/currencyUtils';

// Get currency symbol
const symbol = getCurrencySymbol('EUR');  // Returns '€'

// Format price with currency
const price = formatPrice(1234.56, 'USD');  // Returns '$1,234.56'
```

Supported currencies: USD, EUR, GBP, JPY, CNY, CHF, INR, AUD, CAD, KRW, SGD, HKD, MXN, BRL

**GenericCRUDManager Component**

**Location:** `client/src/components/admin/GenericCRUDManager.jsx`

Reusable CRUD manager for admin entities with Palantir rebuild support:

```javascript
import GenericCRUDManager from '../components/admin/GenericCRUDManager';

<GenericCRUDManager
  title="Plant Codes"
  entityName="plant code"
  apiEndpoint="/api/plant-codes"
  rebuildEndpoint="/api/plant-codes/rebuild"
  columns={[
    { key: 'plantCode', label: 'Plant Code', editable: false },
    { key: 'name', label: 'Plant Name', editable: true },
    { key: 'location', label: 'Location', editable: true }
  ]}
  fields={[
    { key: 'plantCode', label: 'Plant Code', required: true },
    { key: 'name', label: 'Plant Name', required: true },
    { key: 'location', label: 'Location', required: false }
  ]}
/>
```

Features:
- CRUD operations (Create, Read, Update, Delete)
- Inline editing with save/cancel
- Palantir rebuild with progress tracking
- Active/inactive status toggles
- Metadata display (last extracted, source)
- Form validation
- Error handling and toast notifications

---

### **17. SKU and Pricing Management**

SKU (Stock Keeping Unit) management and pricing calculation are critical features for product development.

#### **17.1 SKU Management Overview**

**What is a SKU?**
- Unique identifier for a specific product configuration
- Includes package size, unit, and variant type
- Examples: "A1234-100G", "S5678-5ML", "L9012-1KG"

**SKU Variants:**
Each product ticket can have multiple SKU variants representing different package sizes or configurations.

**Variant Types:**
- **BULK** - Large quantity, basic packaging (e.g., 25kg drum)
- **CONF** - Configured/custom packaging
- **SPEC** - Special specification variant
- **VAR** - Standard variant (most common)
- **PREPACK** - Pre-packaged ready-to-ship

#### **17.2 SKU Variant Schema**

**Fields:**
```javascript
{
  type: 'VAR',  // BULK, CONF, SPEC, VAR, PREPACK
  sku: 'A1234-100G',  // Assigned SKU number
  description: 'Ascorbic Acid 99% - 100g bottle',
  
  packageSize: {
    value: 100,
    unit: 'g'
  },
  
  grossWeight: { value: 120, unit: 'g' },
  netWeight: { value: 100, unit: 'g' },
  volume: { value: 150, unit: 'mL' },
  
  pricing: {
    standardCost: 15.00,
    calculatedCost: 15.50,
    margin: 50,  // 50%
    calculatedMarginPercent: 48.5,
    limitPrice: 30.00,
    listPrice: 35.00,
    currency: 'USD'
  },
  
  inventory: {
    minimumStock: 100,
    leadTime: 14,  // days
    supplier: 'Internal'
  },
  
  forecastedSalesVolume: {
    year1: 500,
    year2: 750,
    year3: 1000
  }
}
```

#### **17.3 Creating SKU Variants**

**In Create Ticket Form:**

1. Navigate to "SKU Variants" section
2. Click "Add SKU Variant" button
3. Fill in variant details:
   - Select variant type
   - Enter package size and unit
   - Optionally enter SKU number (or leave for PM Ops to assign)
   - Enter description
4. Click "Add" to save variant
5. Repeat for additional variants

**Variant Form:**
```javascript
<div className="sku-variant-form">
  <select {...register(`skuVariants.${index}.type`)}>
    <option value="BULK">BULK</option>
    <option value="VAR">VAR</option>
    <option value="SPEC">SPEC</option>
    <option value="CONF">CONF</option>
    <option value="PREPACK">PREPACK</option>
  </select>

  <input 
    type="number" 
    placeholder="Package Size"
    {...register(`skuVariants.${index}.packageSize.value`)}
  />
  
  <select {...register(`skuVariants.${index}.packageSize.unit`)}>
    <option value="mg">mg</option>
    <option value="g">g</option>
    <option value="kg">kg</option>
    <option value="mL">mL</option>
    <option value="L">L</option>
  </select>
</div>
```

#### **17.4 SKU Assignment (PM Ops)**

**PM Ops Workflow:**

Once a ticket is submitted, PM Ops team assigns actual SKU numbers:

1. Open ticket in PM Ops dashboard
2. Navigate to "SKU Assignment" section (PM_OPS/ADMIN only)
3. Review requested variants
4. Assign SKU numbers:
   - Auto-generate from SKU number sequence
   - Or manually enter SKU from existing system
5. Verify variant details
6. Save assignments

**SKU Number Generation:**
```javascript
const generateSKUNumber = (variant, productInfo) => {
  // Format: [PREFIX]-[PRODUCT_CODE]-[SIZE][UNIT]
  // Example: MS-CHEM-100G, MS-KIT-5ML, MS-INST-EA

  const prefix = 'MS';  // MilliporeSigma
  const productCode = generateProductCode(productInfo);
  const size = variant.packageSize.value;
  const unit = variant.packageSize.unit.toUpperCase();

  return `${prefix}-${productCode}-${size}${unit}`;
};
```

**SKU Validation:**
- Check for duplicates in system
- Verify SKU format follows company standards
- Ensure SKU not already assigned to different product

#### **17.5 Pricing Calculations**

**Pricing Fields:**
- **Standard Cost** - Base cost to manufacture/acquire product
- **Calculated Cost** - Standard cost + overhead, packaging, etc.
- **Margin** - Target profit margin percentage (default: 50%)
- **Calculated Margin Percent** - Actual margin based on list price
- **Limit Price** - Minimum price (floor price)
- **List Price** - Suggested retail/catalog price

**Pricing Formulas:**

**Calculate Cost:**
```javascript
calculatedCost = standardCost + (standardCost * overheadRate) + packagingCost
```

**Calculate List Price from Margin:**
```javascript
listPrice = calculatedCost / (1 - (margin / 100))

// Example: Cost = $15, Margin = 50%
// listPrice = 15 / (1 - 0.5) = 15 / 0.5 = $30
```

**Calculate Actual Margin:**
```javascript
calculatedMarginPercent = ((listPrice - calculatedCost) / listPrice) * 100

// Example: List = $35, Cost = $15
// margin = ((35 - 15) / 35) * 100 = 57.14%
```

**Pricing Component:**
```javascript
const calculatePricing = (standardCost, margin) => {
  const overheadRate = 0.15;  // 15% overhead
  const packagingCost = 2.00;  // $2 packaging
  
  const calculatedCost = standardCost + (standardCost * overheadRate) + packagingCost;
  const listPrice = calculatedCost / (1 - (margin / 100));
  const limitPrice = calculatedCost * 1.10;  // 10% above cost
  
  return {
    calculatedCost: calculatedCost.toFixed(2),
    listPrice: listPrice.toFixed(2),
    limitPrice: limitPrice.toFixed(2)
  };
};

// Usage
const { calculatedCost, listPrice, limitPrice } = calculatePricing(15.00, 50);
setValue('skuVariants.0.pricing.calculatedCost', calculatedCost);
setValue('skuVariants.0.pricing.listPrice', listPrice);
setValue('skuVariants.0.pricing.limitPrice', limitPrice);
```

**Auto-Calculate on Change:**
```javascript
// Watch standard cost and margin fields
const standardCost = watch('skuVariants.0.pricing.standardCost');
const margin = watch('skuVariants.0.pricing.margin');

useEffect(() => {
  if (standardCost && margin) {
    const prices = calculatePricing(standardCost, margin);
    setValue('skuVariants.0.pricing.calculatedCost', prices.calculatedCost);
    setValue('skuVariants.0.pricing.listPrice', prices.listPrice);
    setValue('skuVariants.0.pricing.limitPrice', prices.limitPrice);
  }
}, [standardCost, margin]);
```

#### **17.6 Weight Matrix**

**Purpose:** Calculate package weights based on fill amount and container type

**Weight Matrix Model:**
```javascript
{
  packageType: 'Bottle',  // Bottle, Vial, Drum, Bag, etc.
  material: 'Glass',      // Glass, Plastic, Metal
  sizes: [
    {
      capacity: { value: 100, unit: 'mL' },
      tareWeight: { value: 50, unit: 'g' },  // Empty container weight
      maxFillWeight: { value: 120, unit: 'g' }
    },
    {
      capacity: { value: 500, unit: 'mL' },
      tareWeight: { value: 150, unit: 'g' },
      maxFillWeight: { value: 600, unit: 'g' }
    }
  ]
}
```

**Calculating Package Weights:**
```javascript
const calculatePackageWeight = (fillAmount, fillUnit, containerType, containerSize) => {
  // Find matching container in weight matrix
  const container = weightMatrix
    .find(wm => wm.packageType === containerType)
    ?.sizes.find(s => s.capacity.value === containerSize);

  if (!container) {
    return null;  // No match found
  }

  // Gross weight = fill amount + tare weight
  const grossWeight = fillAmount + container.tareWeight.value;

  return {
    netWeight: { value: fillAmount, unit: fillUnit },
    grossWeight: { value: grossWeight, unit: 'g' },
    tareWeight: container.tareWeight
  };
};

// Usage
const weights = calculatePackageWeight(100, 'g', 'Bottle', 100);
// Returns: { netWeight: 100g, grossWeight: 150g, tareWeight: 50g }
```

**Weight Matrix Management:**

**Location:** Admin Dashboard → Weight Matrix Management

**Features:**
- Add new container types
- Define tare weights for each size
- Update existing weights
- Import from Excel
- Export to Excel

#### **17.7 Sales Forecasting**

**Forecasted Sales Volume** helps with inventory planning and production scheduling.

**Fields:**
- Year 1 forecast (units)
- Year 2 forecast (units)
- Year 3 forecast (units)

**Forecasting Methods:**
1. **Historical Data** - Based on similar products
2. **Market Analysis** - Industry trends and market size
3. **Customer Commitments** - Pre-orders and agreements
4. **Expert Estimates** - PM judgment

**Forecast Display:**
```javascript
<div className="forecast-section">
  <h3>Sales Forecast</h3>
  <div className="forecast-inputs">
    <div>
      <label>Year 1</label>
      <input type="number" {...register('forecastedSalesVolume.year1')} />
      <span>units</span>
    </div>
    <div>
      <label>Year 2</label>
      <input type="number" {...register('forecastedSalesVolume.year2')} />
      <span>units</span>
    </div>
    <div>
      <label>Year 3</label>
      <input type="number" {...register('forecastedSalesVolume.year3')} />
      <span>units</span>
    </div>
  </div>
</div>
```

**Forecast Validation:**
- Year 2 forecast should generally be ≥ Year 1 (growth assumption)
- Year 3 forecast should generally be ≥ Year 2
- Warn if forecasts decrease significantly (may indicate data entry error)
- Flag unrealistic forecasts (e.g., 1 million units for specialty chemical)

#### **17.8 Permissions for SKU/Pricing**

| Role | View SKUs | Edit SKUs | Assign SKUs | View Pricing | Edit Pricing |
|------|-----------|-----------|-------------|--------------|--------------|
| PRODUCT_MANAGER | ✅ | ✅ Request only | ❌ | ❌ | ❌ |
| PM_OPS | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |

**Permission Enforcement:**
```javascript
const canEditPricing = user.role === 'PM_OPS' || user.role === 'ADMIN';

{canEditPricing ? (
  <input type="number" {...register('pricing.listPrice')} />
) : (
  <span className="read-only">${variant.pricing.listPrice}</span>
)}
```

---


## PART 5: COMMON MAINTENANCE TASKS

This part provides step-by-step instructions for routine maintenance tasks that maintainers will perform regularly.

---

### **18. Adding New Users**

**Task:** Create a new user profile in the system

**Who Can Do This:** ADMIN only

**Steps:**

1. **Navigate to Admin Dashboard**
   ```bash
   # In browser, go to:
   http://localhost:5173/admin
   ```

2. **Open User Management**
   - Click "User Management" in admin menu
   - View list of existing users

3. **Click "Add New User" Button**
   - Modal/form opens with user fields

4. **Fill in User Details:**
   - **Email:** User's email address (unique)
   - **First Name:** User's first name
   - **Last Name:** User's last name
   - **Role:** Select from dropdown:
     - PRODUCT_MANAGER
     - PM_OPS
     - ADMIN
   - **SBU:** (Required for PRODUCT_MANAGER role)
     - Life Science
     - Process Solutions
     - Electronics
     - Healthcare
   - **Is Active:** Check to allow login (default: checked)

5. **Click "Create User"**
   - Validation runs
   - User created in database
   - Success message appears
   - User appears in user list

6. **Add User to Dev Profiles (Development Only)**
   
   If you're in development mode using profile-based auth:
   
   ```bash
   # Edit the dev profiles file
   cd ~/npdi-app/server
   nano data/devProfiles.json
   ```
   
   Add new profile:
   ```json
   {
     "id": "new-user-id",
     "firstName": "Jane",
     "lastName": "Doe",
     "email": "jane.doe@milliporesigma.com",
     "role": "PRODUCT_MANAGER",
     "sbu": "Life Science",
     "isActive": true,
     "createdAt": "2024-01-15T00:00:00.000Z"
   }
   ```
   
   Save and restart server:
   ```bash
   # Server will automatically reload profiles
   # Or restart manually:
   pkill -f "node.*server"
   cd ~/npdi-app/server && npm start
   ```

7. **Verify User Can Log In**
   - Log out of current session
   - Go to profile selection screen
   - Verify new user appears
   - Select new user profile
   - Confirm access to appropriate pages based on role

**Troubleshooting:**
- **Error: "Email already exists"** → Email must be unique. Choose different email or update existing user.
- **User doesn't appear in profile list** → Check `isActive` is true, verify devProfiles.json saved correctly, restart server.
- **User can't access expected pages** → Verify role is set correctly, check permissions for that role.

---

### **19. Modifying Form Configuration**

**Task:** Modify form fields and sections

**Who Can Do This:** Developers with repository access

**When to Use:** Adding/removing form fields, changing validation rules, updating field labels

#### **19.1 Locate the Seed Script**

```bash
cd /home/ckabes/npdi-app/server/scripts
ls -la seedFormConfig.js
```

#### **19.2 Edit the Configuration**

```bash
# Use your preferred editor
nano seedFormConfig.js
# or
code seedFormConfig.js
```

The configuration structure:
```javascript
const formConfig = {
  name: 'Product Ticket Form - Default',
  sections: [
    {
      sectionKey: 'basic',
      name: 'Basic Information',
      visible: true,
      fields: [
        {
          fieldKey: 'productName',
          label: 'Product Name',
          type: 'text',
          required: true,
          visible: true,
          editable: true
        }
        // More fields...
      ]
    }
    // More sections...
  ]
};
```

#### **19.3 Common Modifications**

**Add a new field:**
```javascript
{
  fieldKey: 'expirationDate',
  label: 'Expiration Date',
  type: 'date',
  required: false,
  visible: true,
  editable: true,
  helpText: 'Product expiration date'
}
```

**Make a field required:**
```javascript
required: true  // Change from false to true
```

**Add conditional visibility:**
```javascript
visibleWhen: {
  fieldKey: 'productionType',
  value: 'Procured'
}
```

**Add validation:**
```javascript
validation: {
  min: 0,
  max: 100,
  pattern: '^[A-Z0-9]+$',
  message: 'Custom error message'
}
```

#### **19.4 Run the Seed Script**

```bash
cd /home/ckabes/npdi-app/server/scripts
node seedFormConfig.js
```

Expected output:
```
Connected to MongoDB
Form configuration seeded/updated successfully
Connection closed
```

#### **19.5 Verify Changes**

1. Restart the application (if running):
```bash
# Stop existing process
pkill -f "npm.*dev"

# Start again
cd /home/ckabes/npdi-app
npm run dev
```

2. Navigate to ticket creation page
3. Verify your changes appear correctly

#### **19.6 Commit Changes to Git**

```bash
git add server/scripts/seedFormConfig.js
git commit -m "Update form configuration: [describe change]"
git push
```

**Troubleshooting:**
- **Changes don't appear:** Restart the application, clear browser cache
- **Seed script fails:** Check JavaScript syntax, verify MongoDB connection
- **Fields not validating:** Check validation rules match field type

---

### **20. Updating Permissions**

**Task:** Change what each role can view and edit

**Who Can Do This:** ADMIN only

**Steps:**

1. **Navigate to Permissions Management**
   ```
   Admin Dashboard → Permissions
   ```

2. **Select Role to Modify**
   - Three tabs: PRODUCT_MANAGER, PM_OPS, ADMIN
   - Click the role you want to modify

3. **View Current Permissions**
   - Table showing all features and current view/edit permissions
   - Example:
     ```
     Feature               | View | Edit
     ----------------------|------|------
     Tickets               |  ✓   |  ✓
     SKU Assignment        |  ✗   |  ✗
     Pricing Data          |  ✗   |  ✗
     Admin Panel           |  ✗   |  ✗
     ```

4. **Modify Permissions**
   - Check/uncheck boxes for view and edit
   - Changes are color-coded to show modifications

5. **Click "Save Permissions"**
   - Changes saved to Permission model in database
   - Takes effect immediately for all users with that role

6. **Test the Changes**
   - Log in as user with modified role (or switch profile)
   - Verify new permissions work as expected
   - Confirm restricted features are hidden/disabled

**Permission Features:**

| Feature | Description |
|---------|-------------|
| Tickets | View and edit product tickets |
| Drafts | View and edit draft tickets |
| SKU Variants | View and edit SKU variant information |
| SKU Assignment | Assign SKU numbers to variants |
| Chemical Properties | View and edit chemical data |
| Hazard Classification | View and edit hazard/safety info |
| Corpbase Data | View and edit corporate database fields |
| Pricing Data | View and edit pricing information |
| Comments | View and add comments |
| Status History | View and modify ticket status |
| Admin Panel | Access admin features |

**Default Permissions:**

Refer to Section 8.2 for default permission matrix.

**Restoring Default Permissions:**

If permissions become misconfigured:

```bash
# In MongoDB
mongosh npdi-portal

# Delete all permissions (they'll be recreated)
db.permissions.deleteMany({})

# Restart server to trigger default permission initialization
# Or run seed script:
cd ~/npdi-app/server
node scripts/seedFormConfig.js
```

---

### **21. Database Maintenance**

**Task:** Routine database maintenance tasks

#### **21.1 Backing Up the Database**

**Method 1: mongodump (Recommended)**

```bash
# Create backup directory
mkdir -p ~/npdi-backups

# Dump entire database
mongodump --db npdi-portal --out ~/npdi-backups/backup-$(date +%Y%m%d-%H%M%S)

# Output:
# ~/npdi-backups/backup-20240115-143000/
#   └── npdi-portal/
#       ├── productticketes.bson
#       ├── productticketes.metadata.json
#       ├── users.bson
#       ├── users.metadata.json
#       └── ...
```

**Method 2: Export to JSON**

```bash
# Export specific collection
mongoexport --db npdi-portal --collection productticketes --out ~/npdi-backups/tickets-$(date +%Y%m%d).json

# Export with query (e.g., only completed tickets)
mongoexport --db npdi-portal --collection productticketes \
  --query '{"status": "COMPLETED"}' \
  --out ~/npdi-backups/completed-tickets.json
```

**Automated Backup Script:**

Create `~/npdi-backups/backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR=~/npdi-backups
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup
mongodump --db npdi-portal --out "$BACKUP_DIR/backup-$DATE"

# Compress
tar -czf "$BACKUP_DIR/backup-$DATE.tar.gz" "$BACKUP_DIR/backup-$DATE"
rm -rf "$BACKUP_DIR/backup-$DATE"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup-$DATE.tar.gz"
```

Make executable and run:
```bash
chmod +x ~/npdi-backups/backup.sh
~/npdi-backups/backup.sh
```

**Schedule Daily Backups (cron):**

```bash
# Edit crontab
crontab -e

# Add line (runs daily at 2 AM):
0 2 * * * /home/ckabes/npdi-backups/backup.sh >> /home/ckabes/npdi-backups/backup.log 2>&1
```

#### **21.2 Restoring from Backup**

**Restore Entire Database:**

```bash
# Stop the server first
pkill -f "node.*server"

# Restore from mongodump
mongorestore --db npdi-portal ~/npdi-backups/backup-20240115-143000/npdi-portal

# Start server
cd ~/npdi-app/server && npm start
```

**Restore Specific Collection:**

```bash
# Restore just tickets collection
mongorestore --db npdi-portal --collection productticketes \
  ~/npdi-backups/backup-20240115-143000/npdi-portal/productticketes.bson
```

**Restore from JSON Export:**

```bash
mongoimport --db npdi-portal --collection productticketes \
  --file ~/npdi-backups/tickets-20240115.json
```

#### **21.3 Database Cleanup**

**Remove Old Drafts:**

```bash
# Connect to MongoDB
mongosh npdi-portal

# Find drafts older than 90 days
db.productticketes.find({
  status: 'DRAFT',
  createdAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
}).count()

# Delete old drafts (BE CAREFUL!)
db.productticketes.deleteMany({
  status: 'DRAFT',
  createdAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

**Remove Canceled Tickets:**

```bash
mongosh npdi-portal

# Archive canceled tickets (export first!)
mongoexport --db npdi-portal --collection productticketes \
  --query '{"status": "CANCELED"}' \
  --out ~/npdi-backups/canceled-tickets-archive.json

# Then delete
db.productticketes.deleteMany({ status: 'CANCELED' })
```

#### **21.4 Database Performance**

**Create Indexes:**

Indexes speed up queries. Check current indexes:

```bash
mongosh npdi-portal

db.productticketes.getIndexes()
```

Create useful indexes:

```javascript
// Index on ticket number (for quick lookups)
db.productticketes.createIndex({ ticketNumber: 1 })

// Index on status (for filtered queries)
db.productticketes.createIndex({ status: 1 })

// Index on createdBy (for "my tickets" queries)
db.productticketes.createIndex({ createdBy: 1 })

// Compound index on status + createdAt (for recent tickets by status)
db.productticketes.createIndex({ status: 1, createdAt: -1 })

// Index on CAS number (for chemical lookups)
db.productticketes.createIndex({ "chemicalProperties.casNumber": 1 })
```

**Check Database Size:**

```bash
mongosh npdi-portal --eval "db.stats(1024*1024)"

# Output shows size in MB
```

**Compact Database** (reclaim space):

```bash
mongosh npdi-portal

db.runCommand({ compact: 'productticketes' })
```

⚠️ **Warning:** Compact requires downtime. Run during maintenance window.

#### **21.5 Database Monitoring**

**Check Database Status:**

```bash
# Is MongoDB running?
sudo service mongodb status

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongodb.log

# Check connections
mongosh npdi-portal --eval "db.serverStatus().connections"
```

**Monitor Slow Queries:**

Enable profiling:
```javascript
mongosh npdi-portal

// Profile slow queries (>100ms)
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().limit(10).sort({ ts: -1 }).pretty()

// Disable profiling
db.setProfilingLevel(0)
```

---

### **22. Code Updates and Deployment**

**Task:** Update application code and deploy changes

#### **22.1 Pulling Latest Code**

**Steps:**

1. **Check Current Branch**
   ```bash
   cd ~/npdi-app
   git branch
   # Should show: * dev or * main
   ```

2. **Check for Uncommitted Changes**
   ```bash
   git status
   # If changes exist, commit or stash them
   ```

3. **Stash Local Changes** (if any)
   ```bash
   git stash save "Local changes before pull"
   ```

4. **Pull Latest Code**
   ```bash
   # Pull from remote
   git pull origin dev
   
   # Or if on main:
   git pull origin main
   ```

5. **Restore Stashed Changes** (if needed)
   ```bash
   git stash pop
   # Resolve any conflicts
   ```

6. **Install New Dependencies**
   ```bash
   # Backend dependencies
   cd ~/npdi-app/server
   npm install
   
   # Frontend dependencies
   cd ~/npdi-app/client
   npm install
   ```

7. **Restart Application**
   ```bash
   # Stop server
   pkill -f "node.*server"
   
   # Start server
   cd ~/npdi-app/server && npm start
   
   # In another terminal, restart client
   pkill -f "vite"
   cd ~/npdi-app/client && npm run dev
   ```

8. **Verify Application Works**
   - Open http://localhost:5173
   - Check for console errors
   - Test key features
   - Review any deployment notes in commit messages

#### **22.2 Updating Dependencies**

**Check for Outdated Packages:**

```bash
cd ~/npdi-app/server
npm outdated

cd ~/npdi-app/client
npm outdated
```

**Update Specific Package:**

```bash
# Update a specific package
npm update package-name

# Or update to latest version (may have breaking changes)
npm install package-name@latest
```

**Update All Packages:**

```bash
# Update within semver ranges (safe)
npm update

# Update to latest (may break things!)
npm install -g npm-check-updates
ncu -u
npm install
```

**Test After Updates:**

```bash
# Run tests (if available)
npm test

# Run build to check for errors
cd ~/npdi-app/client
npm run build

# Start dev server and verify
npm run dev
```

#### **22.3 Running Database Migrations**

If code changes include database schema updates:

1. **Check for Migration Scripts**
   ```bash
   ls ~/npdi-app/server/migrations/
   # Look for new migration files
   ```

2. **Run Migration**
   ```bash
   cd ~/npdi-app/server
   node migrations/migration-name.js
   ```

3. **Verify Migration Success**
   ```bash
   # Check migration log
   cat ~/npdi-app/server/migrations/migration.log
   
   # Or check database directly
   mongosh npdi-portal
   db.collection.findOne()  # Verify new fields exist
   ```

**Example Migration Script:**

```javascript
// migrations/add-priority-field.js
const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Add priority field to all tickets without one
  const result = await mongoose.connection.db.collection('productticketes').updateMany(
    { priority: { $exists: false } },
    { $set: { priority: 'MEDIUM' } }
  );
  
  console.log(`Updated ${result.modifiedCount} tickets`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
```

#### **22.4 Deploying to Production**

**Pre-Deployment Checklist:**

- [ ] Code tested in development
- [ ] All tests passing
- [ ] Database backed up
- [ ] Dependencies updated
- [ ] Environment variables configured
- [ ] Deployment notes prepared

**Deployment Steps:**

1. **Merge to Main Branch**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

2. **Tag Release**
   ```bash
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```

3. **On Production Server, Pull Code**
   ```bash
   ssh production-server
   cd /var/www/npdi-app
   git pull origin main
   ```

4. **Install Dependencies**
   ```bash
   cd /var/www/npdi-app/server && npm install --production
   cd /var/www/npdi-app/client && npm install
   ```

5. **Build Frontend**
   ```bash
   cd /var/www/npdi-app/client
   npm run build
   # Builds to client/dist folder
   ```

6. **Run Migrations**
   ```bash
   cd /var/www/npdi-app/server
   node migrations/*.js
   ```

7. **Restart Application**
   ```bash
   # Using PM2 (recommended)
   pm2 restart npdi-app
   
   # Or systemd
   sudo systemctl restart npdi-app
   ```

8. **Verify Deployment**
   - Check application URL
   - Test critical features
   - Monitor error logs
   - Check database connections

9. **Monitor Post-Deployment**
   ```bash
   # Watch logs
   pm2 logs npdi-app
   
   # Or
   sudo journalctl -u npdi-app -f
   ```

#### **22.5 Rolling Back a Deployment**

If deployment fails:

1. **Revert to Previous Version**
   ```bash
   git checkout v1.1.0  # Previous good version
   ```

2. **Rebuild and Restart**
   ```bash
   cd /var/www/npdi-app/client && npm run build
   pm2 restart npdi-app
   ```

3. **Restore Database** (if migration failed)
   ```bash
   mongorestore --db npdi-portal ~/backups/pre-deployment-backup/npdi-portal
   ```

4. **Verify Rollback**
   - Test application
   - Verify data integrity

5. **Investigate Issue**
   - Review deployment logs
   - Identify what went wrong
   - Fix in development
   - Try deployment again

---


## PART 6: TROUBLESHOOTING & MAINTENANCE

This part helps you diagnose and fix common issues with the NPDI Portal.

---

### **23. Common Issues and Solutions**

#### **23.1 Application Won't Start**

**Symptom:** Server or client fails to start

**Possible Causes & Solutions:**

**1. Port Already in Use**

```bash
# Check what's using port 5000 (server)
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use pkill
pkill -f "node.*server"

# Check port 5173 (client)
lsof -i :5173
pkill -f "vite"
```

**2. MongoDB Not Running**

```bash
# Check MongoDB status
sudo service mongodb status

# If not running, start it
sudo service mongodb start

# Enable auto-start on boot
sudo systemctl enable mongodb
```

**3. Missing Environment Variables**

```bash
# Check .env file exists
ls -la ~/npdi-app/server/.env

# If missing, copy from example
cd ~/npdi-app/server
cp .env.example .env
nano .env  # Edit with correct values
```

**4. Missing Dependencies**

```bash
# Reinstall all dependencies
cd ~/npdi-app/server
rm -rf node_modules package-lock.json
npm install

cd ~/npdi-app/client
rm -rf node_modules package-lock.json
npm install
```

**5. Wrong Node Version**

```bash
# Check Node version
node --version
# Should be v18.x or v20.x

# If wrong version, use nvm
nvm install 18
nvm use 18
```

#### **23.2 "Cannot Connect to Database"**

**Symptom:** Error: "MongoNetworkError" or "ECONNREFUSED"

**Solutions:**

**1. Start MongoDB**
```bash
sudo service mongodb start
```

**2. Check MongoDB is listening**
```bash
sudo netstat -tlnp | grep 27017
# Should show mongod listening on port 27017
```

**3. Verify connection string**
```bash
# In server/.env
cat ~/npdi-app/server/.env | grep MONGODB_URI

# Should be:
# MONGODB_URI=mongodb://localhost:27017/npdi-portal
```

**4. Check MongoDB logs**
```bash
sudo tail -50 /var/log/mongodb/mongodb.log
# Look for error messages
```

**5. Repair MongoDB (if corrupted)**
```bash
# Stop MongoDB
sudo service mongodb stop

# Repair
sudo mongod --repair --dbpath /var/lib/mongodb

# Start MongoDB
sudo service mongodb start
```

#### **23.3 "401 Unauthorized" or "403 Forbidden"**

**Symptom:** API requests fail with auth errors

**Solutions:**

**1. Profile not selected**
- Go to http://localhost:5173/select-profile
- Select a profile
- Try again

**2. Session expired**
- Log out (clear localStorage)
- Log back in
- Or in browser console:
  ```javascript
  localStorage.clear()
  location.reload()
  ```

**3. User not in database**
- Verify user exists in devProfiles.json
- Check user is active (isActive: true)

**4. Role doesn't have permission**
- Check permissions for that role
- Admin Dashboard → Permissions
- Grant necessary permissions

#### **23.4 Form Data Not Saving**

**Symptom:** Form submits but data doesn't appear in database

**Solutions:**

**1. Check browser console for errors**
- Open DevTools (F12)
- Look for red errors in Console tab
- Check Network tab for failed requests

**2. Check server logs**
```bash
# View server console output
# Look for error messages when form submits
```

**3. Validation errors**
- Required fields not filled
- Check for error messages in form
- Verify all red-highlighted fields have values

**4. Database write permissions**
```bash
# Check MongoDB can write
mongosh npdi-portal

db.productticketes.insert({ test: "test" })
# Should succeed

db.productticketes.deleteOne({ test: "test" })
```

**5. Schema validation**
- Data doesn't match schema requirements
- Check server logs for validation errors
- Review ProductTicket schema in models

#### **23.5 PubChem/SAP Integration Not Working**

**Symptom:** "Auto-fill from PubChem" or SAP import fails

**Solutions:**

**1. PubChem Issues:**

```bash
# Test PubChem API directly
curl "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/50-81-7/JSON"

# If fails, check:
# - Internet connection
# - Firewall blocking PubChem
# - PubChem API is up (check pubchem.ncbi.nlm.nih.gov status)
```

**2. CORS Issues:**
- Check browser console for CORS errors
- Verify server CORS configuration allows client URL
- In server/index.js, check cors() settings

**3. SAP/Palantir Issues:**
- Check Palantir URL in System Settings
- Verify API key is correct
- Test API endpoint:
  ```bash
  curl -H "Authorization: Bearer YOUR_API_KEY" \
    https://palantir.example.com/api/mara/search
  ```

**4. Rate Limiting:**
- Too many requests to PubChem
- Wait a minute and try again
- Check System Settings → PubChem rate limit

#### **23.6 UI Not Updating / Stale Data**

**Symptom:** Changes made but UI shows old data

**Solutions:**

**1. Hard refresh browser**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**2. Clear browser cache**
- DevTools → Application tab → Clear storage
- Or browser settings → Clear cache

**3. React state not updating**
- Check if page needs manual refresh
- Click refresh button if available
- Navigate away and back

**4. Client build is cached**
```bash
# Rebuild client
cd ~/npdi-app/client
rm -rf dist
npm run build
npm run dev
```

**5. Server cache**
```bash
# Restart server to clear any caching
pkill -f "node.*server"
cd ~/npdi-app/server && npm start
```

#### **23.7 Export Fails / Download Not Working**

**Symptom:** Export button doesn't download file

**Solutions:**

**1. Check browser console**
- Look for JavaScript errors
- Check Network tab for failed API call

**2. Check server logs**
- Look for export errors
- May be Excel generation failure

**3. Large export timeout**
- Too many tickets to export at once
- Try smaller subset (filter by date range)
- Increase timeout in code

**4. File permissions**
- Server can't write temp file
- Check /tmp folder permissions:
  ```bash
  ls -la /tmp
  sudo chmod 1777 /tmp
  ```

**5. ExcelJS error**
- Corrupted data causing Excel generation to fail
- Check server logs for specific error
- Try exporting single ticket to isolate issue

---

### **24. Performance Optimization**

#### **24.1 Slow Page Load**

**Diagnose:**

1. **Check browser DevTools → Network tab**
   - Identify slow requests
   - Look for large file downloads
   - Check for failed requests causing retries

2. **Check server response times**
   - Use browser Network tab
   - Look for API calls taking >1 second

**Solutions:**

**1. Database Query Optimization**

```javascript
// Add indexes for commonly queried fields
mongosh npdi-portal

db.productticketes.createIndex({ status: 1, createdAt: -1 })
db.productticketes.createIndex({ createdBy: 1 })
db.productticketes.createIndex({ "chemicalProperties.casNumber": 1 })
```

**2. Pagination**

Ensure ticket list uses pagination:
```javascript
// In API call, use limit and skip
const params = {
  page: 1,
  limit: 50,  // Don't load more than 50 at once
  sortBy: 'createdAt',
  sortOrder: 'desc'
};
```

**3. Lazy Loading**

Only load data when needed:
```javascript
// Don't load all tickets on dashboard
// Load stats separately
// Load recent tickets separately (limit 5)
```

**4. Code Splitting**

Build client with code splitting:
```bash
cd ~/npdi-app/client
npm run build
# Vite automatically splits code
```

**5. Image Optimization**

If using images:
- Compress images
- Use appropriate formats (WebP for photos, SVG for icons)
- Lazy load images below fold

**6. Minimize Bundle Size**

```bash
# Analyze bundle
cd ~/npdi-app/client
npm run build -- --analyze

# Remove unused dependencies
npm prune
```

#### **24.2 Slow Form Submission**

**Solutions:**

**1. Reduce payload size**
- Don't send unnecessary fields
- Remove large arrays from submission if not changed

**2. Async processing**
- For large operations (e.g., PubChem lookup), use async
- Show loading spinner
- Don't block UI

**3. Database write optimization**
```javascript
// Use lean() for faster writes
const ticket = await ProductTicket.create(ticketData);

// Instead of:
const ticket = new ProductTicket(ticketData);
await ticket.save();
```

**4. Validation optimization**
- Move complex validation to background
- Do basic validation client-side
- Only validate changed fields

#### **24.3 High Memory Usage**

**Check memory usage:**

```bash
# Server memory
ps aux | grep node

# MongoDB memory
ps aux | grep mongod

# System memory
free -h
```

**Solutions:**

**1. Restart services**
```bash
# Restart server
pkill -f "node.*server"
cd ~/npdi-app/server && npm start

# Restart MongoDB
sudo service mongodb restart
```

**2. Limit MongoDB memory**

Edit `/etc/mongod.conf`:
```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1  # Limit to 1GB
```

Restart MongoDB:
```bash
sudo service mongodb restart
```

**3. Node memory limit**

Start server with memory limit:
```bash
node --max-old-space-size=512 index.js
# Limits Node to 512MB
```

**4. Find memory leaks**

```bash
# Use Node inspector
node --inspect index.js

# Open chrome://inspect in Chrome
# Take heap snapshots to find leaks
```

---

### **25. Logs and Debugging**

#### **25.1 Server Logs**

**View logs:**

```bash
# If server running in terminal, logs appear there

# If using PM2:
pm2 logs npdi-app

# If using systemd:
sudo journalctl -u npdi-app -f

# Or output to file:
cd ~/npdi-app/server
npm start > server.log 2>&1
tail -f server.log
```

**Log levels:**

```javascript
// In server code
console.log('Info message');      // General info
console.warn('Warning message');  // Warnings
console.error('Error message');   // Errors
console.debug('Debug message');   // Debug (verbose)
```

**Enable debug logging:**

```bash
# In .env
DEBUG=*
# Or specific namespace:
DEBUG=express:*,mongodb:*
```

#### **25.2 MongoDB Logs**

**View logs:**

```bash
sudo tail -f /var/log/mongodb/mongodb.log
```

**Enable query logging:**

```javascript
mongosh npdi-portal

// Enable profiling (logs slow queries)
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().limit(10).sort({ ts: -1 }).pretty()

// Disable profiling
db.setProfilingLevel(0)
```

**Check for errors:**

```bash
sudo grep -i error /var/log/mongodb/mongodb.log
```

#### **25.3 Client Debugging**

**Browser Console:**

Open DevTools (F12):
- **Console tab:** JavaScript errors and logs
- **Network tab:** API calls and responses
- **Application tab:** localStorage, session storage
- **Sources tab:** Set breakpoints in code

**React DevTools:**

Install browser extension:
- Chrome: React Developer Tools
- View component tree
- Inspect props and state
- Profile performance

**Enable verbose logging:**

```javascript
// In client code, add console.logs
console.log('Form data:', formData);
console.log('API response:', response);
```

**Debug API calls:**

```javascript
// In api.js, log all requests/responses
apiClient.interceptors.request.use(request => {
  console.log('Request:', request);
  return request;
});

apiClient.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

#### **25.4 Network Debugging**

**Check API connectivity:**

```bash
# Test server endpoint from command line
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","timestamp":"2024-01-15T10:30:00.000Z","version":"1.0.0"}
```

**Test from client to server:**

```javascript
// In browser console
fetch('http://localhost:5000/api/profiles')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Check CORS:**

```javascript
// If CORS error, check server cors config
// In server/index.js:
app.use(cors({
  origin: 'http://localhost:5173',  // Should match client URL
  credentials: true
}));
```

**Proxy Issues:**

```javascript
// In client/vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

---

### **26. Security Best Practices**

#### **26.1 Environment Variables**

**Never commit .env files:**

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore

# Check .env not in git
git status
# Should not show .env
```

**Secure sensitive values:**

```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Use in .env
SESSION_SECRET=<generated_secret>
```

**Environment-specific configs:**

```bash
# Development: .env.development
# Production: .env.production
# Never mix environments
```

#### **26.2 Database Security**

**Enable authentication:**

```bash
# Create admin user
mongosh

use admin
db.createUser({
  user: "admin",
  pwd: "strong_password_here",
  roles: ["root"]
})

use npdi-portal
db.createUser({
  user: "npdi_user",
  pwd: "strong_password_here",
  roles: ["readWrite"]
})
```

**Enable auth in mongod.conf:**

```yaml
security:
  authorization: enabled
```

**Update connection string:**

```bash
# In .env
MONGODB_URI=mongodb://npdi_user:strong_password_here@localhost:27017/npdi-portal
```

**Backup encryption:**

```bash
# Encrypt backup
tar -czf - backup/ | openssl enc -aes-256-cbc -salt -out backup.tar.gz.enc

# Decrypt backup
openssl enc -d -aes-256-cbc -in backup.tar.gz.enc | tar -xzf -
```

#### **26.3 Application Security**

**HTTPS in Production:**

Use nginx or Apache as reverse proxy with SSL:

```nginx
server {
  listen 443 ssl;
  server_name npdi.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**Security Headers:**

Already configured in server/index.js with Helmet:

```javascript
app.use(helmet());
// Sets various HTTP headers for security
```

**Rate Limiting:**

Already configured:

```javascript
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // Limit each IP to 100 requests per windowMs
}));
```

**Input Validation:**

Always validate user input:

```javascript
// In models, use validators
email: {
  type: String,
  validate: {
    validator: function(v) {
      return /^\S+@\S+\.\S+$/.test(v);
    },
    message: 'Invalid email format'
  }
}
```

**SQL/NoSQL Injection Prevention:**

Mongoose handles this automatically with:
- Parameterized queries
- Schema validation
- Type casting

But still be careful with raw queries:

```javascript
// GOOD (Mongoose handles escaping)
ProductTicket.find({ status: userInput })

// BAD (raw query with user input)
db.collection.find({ $where: userInput })  // Never do this!
```

**XSS Prevention:**

React escapes by default, but be careful with:
- `dangerouslySetInnerHTML` - avoid when possible
- User-generated content - sanitize before rendering

```javascript
import DOMPurify from 'dompurify';

// Sanitize HTML before rendering
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userContent) 
}} />
```

#### **26.4 Access Control**

**Verify permissions:**

Always check permissions server-side:

```javascript
// In route handler
const hasPermission = await checkUserPermission(userId, 'tickets', 'edit');
if (!hasPermission) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

**Audit logging:**

Log security-relevant events:

```javascript
console.log(`User ${userId} accessed ${resource} at ${new Date()}`);

// For production, use proper logging library
logger.info('User action', {
  userId,
  action: 'delete_ticket',
  ticketId,
  timestamp: new Date()
});
```

**Session management:**

```javascript
// Set session timeout
const SESSION_TIMEOUT = 60 * 60 * 1000;  // 1 hour

// Check session age
if (Date.now() - sessionStart > SESSION_TIMEOUT) {
  // Force logout
  logout();
}
```

---


## PART 7: DEPLOYMENT & DEVOPS

This part covers production deployment and operational practices.

---

### **27. Production Deployment**

#### **27.1 Production Environment Setup**

**Server Requirements:**
- **OS:** Ubuntu 22.04 LTS or similar Linux
- **CPU:** 4+ cores recommended
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 50GB+ SSD
- **Network:** Static IP, domain name

**Software Requirements:**
- Node.js 18.x LTS
- MongoDB 6.0+
- Nginx (reverse proxy)
- PM2 (process manager)
- Git
- SSL certificate (Let's Encrypt)

**Initial Server Setup:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

#### **27.2 Deploying the Application**

**1. Clone Repository:**

```bash
# Create app directory
sudo mkdir -p /var/www
cd /var/www

# Clone repo (use deploy key or HTTPS)
sudo git clone https://github.com/your-org/npdi-app.git
sudo chown -R www-data:www-data npdi-app

# Or as your user
cd /home/deploy
git clone https://github.com/your-org/npdi-app.git
```

**2. Configure Environment:**

```bash
cd /var/www/npdi-app/server

# Create .env file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/npdi-portal
CLIENT_URL=https://npdi.example.com

# Session secret (generate with: openssl rand -hex 64)
SESSION_SECRET=your_generated_secret_here

# PubChem (optional)
PUBCHEM_API_URL=https://pubchem.ncbi.nlm.nih.gov/rest/pug

# SAP/Palantir (if applicable)
PALANTIR_URL=https://your-palantir-url.com
PALANTIR_API_KEY=your_api_key_here
ENVEOF

chmod 600 .env  # Secure the file
```

**3. Install Dependencies:**

```bash
# Server dependencies
cd /var/www/npdi-app/server
npm install --production

# Client dependencies and build
cd /var/www/npdi-app/client
npm install
npm run build
# Creates optimized production build in client/dist
```

**4. Initialize Database:**

```bash
cd /var/www/npdi-app/server

# Run seed script to create initial data
node scripts/seedFormConfig.js

# Create database indexes
mongosh npdi-portal < scripts/create-indexes.js
```

**5. Configure PM2:**

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'npdi-app',
    cwd: '/var/www/npdi-app/server',
    script: 'index.js',
    instances: 2,  // Use 2 instances for load balancing
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/npdi-app/error.log',
    out_file: '/var/log/npdi-app/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

Start app with PM2:

```bash
# Create log directory
sudo mkdir -p /var/log/npdi-app
sudo chown $USER:$USER /var/log/npdi-app

# Start with PM2
pm2 start ecosystem.config.js

# Configure PM2 to start on boot
pm2 startup systemd
pm2 save
```

**6. Configure Nginx:**

Create `/etc/nginx/sites-available/npdi-app`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name npdi.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name npdi.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/npdi.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/npdi.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve static files from React build
    root /var/www/npdi-app/client/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve React app for all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/npdi-app /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

**7. SSL Certificate (Let's Encrypt):**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d npdi.example.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

**8. Firewall Configuration:**

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify
sudo ufw status
```

#### **27.3 Deployment Checklist**

Before deploying:

- [ ] Code tested thoroughly in development
- [ ] All environment variables configured
- [ ] Database backed up
- [ ] SSL certificate obtained
- [ ] DNS pointing to server
- [ ] Firewall configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan prepared
- [ ] Team notified of deployment window

After deploying:

- [ ] Application accessible at domain
- [ ] SSL certificate valid (check with https://www.ssllabs.com/ssltest/)
- [ ] All API endpoints working
- [ ] Database connections working
- [ ] Forms submitting correctly
- [ ] Exports working
- [ ] External integrations (PubChem, SAP) working
- [ ] Error logs checked
- [ ] Performance acceptable
- [ ] Team notified deployment complete

---

### **28. Monitoring and Logging**

#### **28.1 Application Monitoring**

**PM2 Monitoring:**

```bash
# View running processes
pm2 list

# Monitor in real-time
pm2 monit

# View logs
pm2 logs npdi-app

# View specific app
pm2 show npdi-app
```

**PM2 Plus (Advanced Monitoring):**

```bash
# Link to PM2 Plus dashboard (optional, free tier available)
pm2 link <secret_key> <public_key>

# Features:
# - Real-time metrics
# - Error tracking
# - Custom metrics
# - Alerts
```

**System Monitoring with htop:**

```bash
sudo apt install htop
htop
# Monitor CPU, memory, processes
```

**Disk Space Monitoring:**

```bash
# Check disk usage
df -h

# Check large directories
du -h --max-depth=1 /var/www/npdi-app | sort -h

# Alert if disk >80% full
DISK_USAGE=$(df -h | grep '/$' | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "WARNING: Disk usage is ${DISK_USAGE}%"
  # Send alert email
fi
```

#### **28.2 Database Monitoring**

**MongoDB Stats:**

```bash
# Connect to MongoDB
mongosh npdi-portal

# Database stats
db.stats()

# Collection stats
db.productticketes.stats()

# Current operations
db.currentOp()

# Server status
db.serverStatus()
```

**Slow Query Monitoring:**

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(10)

// Disable profiling
db.setProfilingLevel(0)
```

#### **28.3 Log Management**

**Centralized Logging:**

All logs in one place:

```bash
# Create log directory
sudo mkdir -p /var/log/npdi-app

# PM2 logs
pm2 logs --format --lines 100 > /var/log/npdi-app/pm2.log

# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log

# MongoDB log
tail -f /var/log/mongodb/mongod.log
```

**Log Rotation:**

Configure logrotate for PM2 logs:

Create `/etc/logrotate.d/npdi-app`:

```
/var/log/npdi-app/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

Test:
```bash
sudo logrotate -f /etc/logrotate.d/npdi-app
```

**Structured Logging (Winston):**

For better production logging, use Winston:

```bash
cd /var/www/npdi-app/server
npm install winston
```

Configure in `server/utils/logger.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

Usage:

```javascript
const logger = require('./utils/logger');

logger.info('User logged in', { userId: user.id });
logger.error('Database error', { error: error.message });
```

#### **28.4 Alerts and Notifications**

**Microsoft Teams Alerts:**

The application supports Teams notifications via webhooks. Configure in System Settings:

```javascript
// Send Teams notification
const teamsNotificationService = require('./services/teamsNotificationService');

// Usage - notify on status change
await teamsNotificationService.notifyStatusChange(
  ticket,
  oldStatus,
  newStatus,
  user
);

// Notify on ticket creation
await teamsNotificationService.notifyTicketCreated(ticket, creator);

// Notify on comment
await teamsNotificationService.notifyCommentAdded(ticket, comment, commenter);
```

**Health Check Endpoint:**

```javascript
// In server/index.js
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'OK',
      timestamp: new Date(),
      uptime: process.uptime(),
      mongodb: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message
    });
  }
});
```

**External Monitoring:**

Use services like:
- **UptimeRobot** - Monitor health endpoint
- **Pingdom** - Website uptime monitoring
- **New Relic** - Application performance monitoring
- **Sentry** - Error tracking

---

### **29. Backup and Recovery**

#### **29.1 Automated Backups**

**Daily Database Backup Script:**

Create `/home/deploy/backup-npdi.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR=/home/deploy/npdi-backups
DB_NAME=npdi-portal
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Dump database
mongodump --db "$DB_NAME" --out "$BACKUP_DIR/temp-$DATE"

# Compress
tar -czf "$BACKUP_DIR/npdi-backup-$DATE.tar.gz" -C "$BACKUP_DIR" "temp-$DATE"
rm -rf "$BACKUP_DIR/temp-$DATE"

# Delete old backups
find "$BACKUP_DIR" -name "npdi-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Backup completed - npdi-backup-$DATE.tar.gz" >> "$BACKUP_DIR/backup.log"

# Optional: Upload to S3 or cloud storage
# aws s3 cp "$BACKUP_DIR/npdi-backup-$DATE.tar.gz" s3://your-bucket/backups/
```

Make executable:
```bash
chmod +x /home/deploy/backup-npdi.sh
```

**Schedule with Cron:**

```bash
crontab -e

# Add line (runs daily at 2 AM):
0 2 * * * /home/deploy/backup-npdi.sh
```

#### **29.2 Application Code Backup**

**Git Repository:**

Ensure code is committed and pushed:

```bash
cd /var/www/npdi-app
git status  # Should be clean
git push origin main
```

**File System Backup:**

```bash
# Backup entire application directory
tar -czf /home/deploy/npdi-app-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='*.log' \
  /var/www/npdi-app

# Backup environment files separately (secure location)
sudo tar -czf /root/npdi-env-backup-$(date +%Y%m%d).tar.gz \
  /var/www/npdi-app/server/.env
```

#### **29.3 Recovery Procedures**

**Restore Database:**

```bash
# Stop application
pm2 stop npdi-app

# Extract backup
cd /home/deploy/npdi-backups
tar -xzf npdi-backup-20240115-020000.tar.gz

# Restore to MongoDB
mongorestore --db npdi-portal --drop temp-20240115-020000/npdi-portal

# Start application
pm2 start npdi-app

# Verify
curl http://localhost:5000/api/health
```

**Restore Application:**

```bash
# Stop application
pm2 stop npdi-app

# Backup current state
sudo mv /var/www/npdi-app /var/www/npdi-app.old

# Extract backup
sudo tar -xzf /home/deploy/npdi-app-backup-20240115.tar.gz -C /var/www/

# Restore environment file
sudo tar -xzf /root/npdi-env-backup-20240115.tar.gz -C /

# Reinstall dependencies (if needed)
cd /var/www/npdi-app/server && npm install
cd /var/www/npdi-app/client && npm run build

# Start application
pm2 start npdi-app
```

**Disaster Recovery Plan:**

1. **Incident Detection:** Monitoring alerts indicate critical failure
2. **Assessment:** Determine scope and cause of failure
3. **Communication:** Notify stakeholders of outage
4. **Isolation:** Stop affected services
5. **Recovery:** Restore from most recent backup
6. **Verification:** Test all functionality
7. **Resume:** Bring system back online
8. **Post-Mortem:** Document incident and prevention measures

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours (daily backups)

#### **29.4 Backup Testing**

**Regularly test backups:**

```bash
# Monthly backup restoration test (in test environment)

# 1. Create test MongoDB instance
mongod --dbpath /tmp/test-mongo --port 27018 &

# 2. Restore backup to test instance
mongorestore --port 27018 --db npdi-portal-test \
  /home/deploy/npdi-backups/temp-20240115-020000/npdi-portal

# 3. Verify data
mongosh --port 27018 npdi-portal-test

db.productticketes.countDocuments()  # Should match production count
db.users.find().limit(5)             # Spot check data

# 4. Clean up
mongosh --port 27018
use npdi-portal-test
db.dropDatabase()
exit

pkill -f "mongod --dbpath /tmp/test-mongo"
```

---


## PART 8: REFERENCE MATERIALS

This part provides quick reference information and resources.

---

### **30. Command Reference**

Quick reference for common commands.

#### **30.1 NPM Commands**

**Server:**
```bash
cd ~/npdi-app/server

npm install              # Install dependencies
npm start                # Start server (port 5000)
npm run dev              # Start with nodemon (auto-restart)
npm test                 # Run tests
npm run lint             # Run ESLint
```

**Client:**
```bash
cd ~/npdi-app/client

npm install              # Install dependencies
npm run dev              # Start dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run tests
npm run lint             # Run ESLint
```

#### **30.2 Git Commands**

```bash
# Check status
git status

# View recent commits
git log --oneline -10

# Pull latest code
git pull origin dev

# Create new branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/my-feature

# Merge branches
git checkout main
git merge dev
git push origin main

# View differences
git diff
git diff HEAD~1  # Compare with previous commit

# Stash changes
git stash save "Work in progress"
git stash list
git stash pop

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all uncommitted changes
git reset --hard HEAD
```

#### **30.3 MongoDB Commands**

```bash
# Start/stop MongoDB
sudo service mongodb start
sudo service mongodb stop
sudo service mongodb restart
sudo service mongodb status

# Connect to database
mongosh npdi-portal

# Inside mongosh:
show collections                          # List collections
db.productticketes.countDocuments()      # Count documents
db.productticketes.findOne()             # View one document
db.productticketes.find().limit(5)       # View 5 documents
db.productticketes.find({status:"DRAFT"}) # Query

# Indexes
db.productticketes.getIndexes()          # List indexes
db.productticketes.createIndex({status:1}) # Create index

# Stats
db.stats()                               # Database stats
db.productticketes.stats()               # Collection stats

# Export/Import
mongoexport --db npdi-portal --collection productticketes --out tickets.json
mongoimport --db npdi-portal --collection productticketes --file tickets.json

# Backup/Restore
mongodump --db npdi-portal --out ./backup
mongorestore --db npdi-portal ./backup/npdi-portal
```

#### **30.4 PM2 Commands**

```bash
# Start application
pm2 start ecosystem.config.js

# Stop/restart
pm2 stop npdi-app
pm2 restart npdi-app
pm2 reload npdi-app  # Zero-downtime restart

# Status
pm2 list
pm2 show npdi-app
pm2 monit

# Logs
pm2 logs npdi-app
pm2 logs npdi-app --lines 100
pm2 flush  # Clear logs

# Startup
pm2 startup systemd
pm2 save

# Delete
pm2 delete npdi-app
```

#### **30.5 System Commands**

```bash
# Processes
ps aux | grep node       # Find Node processes
kill -9 <PID>           # Kill process
pkill -f "node.*server" # Kill by name
lsof -i :5000           # What's using port 5000

# Disk space
df -h                   # Disk usage
du -h --max-depth=1     # Directory sizes

# Memory
free -h                 # Memory usage
top                     # Process monitor
htop                    # Better process monitor

# Network
netstat -tlnp           # Listening ports
curl http://localhost:5000/api/health  # Test endpoint
wget http://example.com/file.zip       # Download file

# System info
uname -a                # Kernel info
lsb_release -a          # OS version
uptime                  # System uptime
```

---

### **31. Environment Variables**

Complete reference for `.env` configuration.

#### **31.1 Server Environment Variables**

**File:** `server/.env`

```bash
# ====================
# REQUIRED
# ====================

# Node environment (development | production)
NODE_ENV=development

# Server port
PORT=5000

# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/npdi-portal

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# ====================
# SECURITY
# ====================

# Session secret (generate with: openssl rand -hex 64)
SESSION_SECRET=your_secret_key_here

# JWT secret (if using JWT auth)
JWT_SECRET=your_jwt_secret_here

# ====================
# EXTERNAL APIS
# ====================

# PubChem
PUBCHEM_API_URL=https://pubchem.ncbi.nlm.nih.gov/rest/pug

# SAP/Palantir
PALANTIR_URL=https://your-palantir-instance.com
PALANTIR_API_KEY=your_api_key_here
PALANTIR_TIMEOUT=30000

# ====================
# EMAIL (SMTP) - NOT IMPLEMENTED
# ====================
# Email functionality is not currently implemented in this application
# Use Microsoft Teams integration for notifications instead

# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=NPDI Portal <noreply@example.com>

# ====================
# LOGGING
# ====================

# Log level (error | warn | info | debug)
LOG_LEVEL=info

# ====================
# RATE LIMITING
# ====================

# Max requests per window
RATE_LIMIT_MAX=100

# Window in milliseconds (15 min = 900000)
RATE_LIMIT_WINDOW=900000

# ====================
# FILE UPLOADS (if applicable)
# ====================

MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# ====================
# FEATURE FLAGS
# ====================

ENABLE_PUBCHEM=true
ENABLE_SAP_INTEGRATION=true
ENABLE_NOTIFICATIONS=false
```

#### **31.2 Client Environment Variables**

**File:** `client/.env`

```bash
# API URL (usually handled by Vite proxy in dev)
VITE_API_URL=http://localhost:5000/api

# App version
VITE_APP_VERSION=1.0.0

# Environment
VITE_APP_ENV=development

# Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

**Accessing in React:**
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const version = import.meta.env.VITE_APP_VERSION;
```

---

### **32. Database Schema Quick Reference**

#### **32.1 Collections**

| Collection | Document Count | Purpose |
|------------|---------------|---------|
| `productticketes` | Varies | Product development tickets |
| `users` | ~50 | User profiles |
| `permissions` | 3 | Role permissions (one per role) |
| `formconfigurations` | 1 | Dynamic form configuration |
| `systemsettings` | 1 | Application settings |
| `userpreferences` | ~50 | User preferences |
| `tickettemplates` | ~10 | Ticket templates |

#### **32.2 Key Fields**

**ProductTicket:**
```javascript
{
  _id: ObjectId,
  ticketNumber: "NPDI-2024-001",
  productName: "Ascorbic Acid 99%",
  status: "DRAFT" | "SUBMITTED" | "IN_PROCESS" | "NPDI_INITIATED" | "COMPLETED" | "CANCELED",
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  sbu: "Life Science" | "Process Solutions" | "Electronics" | "Healthcare",
  createdBy: String,  // Email
  assignedTo: String,  // Email
  chemicalProperties: {
    casNumber: String,
    molecularFormula: String,
    molecularWeight: Number
  },
  skuVariants: [
    {
      type: "BULK" | "VAR" | "SPEC" | "CONF" | "PREPACK",
      sku: String,
      packageSize: { value: Number, unit: String },
      pricing: {
        standardCost: Number,
        listPrice: Number
      }
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**User:**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  firstName: String,
  lastName: String,
  role: "PRODUCT_MANAGER" | "PM_OPS" | "ADMIN",
  sbu: String,
  isActive: Boolean,
  createdAt: Date
}
```

#### **32.3 Indexes**

```javascript
// Recommended indexes for performance
db.productticketes.createIndex({ ticketNumber: 1 })
db.productticketes.createIndex({ status: 1 })
db.productticketes.createIndex({ status: 1, createdAt: -1 })
db.productticketes.createIndex({ createdBy: 1 })
db.productticketes.createIndex({ "chemicalProperties.casNumber": 1 })

db.users.createIndex({ email: 1 }, { unique: true })
db.permissions.createIndex({ role: 1 }, { unique: true })
```

---

### **33. API Endpoints Quick Reference**

**Base URL:** `http://localhost:5000/api`

#### **33.1 Authentication**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/profiles` | GET | Get all available profiles |

#### **33.2 Tickets**

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/products` | GET | List all tickets | Yes |
| `/products/:id` | GET | Get ticket by ID | Yes |
| `/products` | POST | Create new ticket | Yes |
| `/products/:id` | PUT | Update ticket | Yes |
| `/products/:id` | DELETE | Delete ticket | Yes (ADMIN) |
| `/products/:id/comments` | POST | Add comment | Yes |
| `/products/:id/status` | POST | Change status | Yes (PM_OPS/ADMIN) |
| `/products/:id/export/data` | GET | Export ticket data (Excel) | Yes |
| `/products/export/csv` | GET | Export tickets (CSV) | Yes |

**Query Parameters for GET /products:**
- `status` - Filter by status
- `sbu` - Filter by SBU
- `priority` - Filter by priority
- `createdBy` - Filter by creator
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - asc | desc (default: desc)

#### **33.3 Other Endpoints**

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/form-config` | GET | Get form configuration | Yes |
| `/form-config` | PUT | Update form config | ADMIN |
| `/users` | GET | List users | ADMIN |
| `/users` | POST | Create user | ADMIN |
| `/permissions/:role` | GET | Get role permissions | Yes |
| `/permissions/:role` | PUT | Update permissions | ADMIN |
| `/system-settings` | GET | Get system settings | ADMIN |
| `/system-settings` | PUT | Update settings | ADMIN |
| `/health` | GET | Health check | No |

---

### **34. External Resources**

#### **34.1 Documentation Links**

**Official Documentation:**
- **React:** https://react.dev/
- **React Router:** https://reactrouter.com/
- **React Hook Form:** https://react-hook-form.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Node.js:** https://nodejs.org/docs/
- **Express:** https://expressjs.com/
- **MongoDB:** https://www.mongodb.com/docs/
- **Mongoose:** https://mongoosejs.com/docs/

**APIs:**
- **PubChem REST API:** https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
- **PubChem Tutorial:** https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest-tutorial

**Tools:**
- **PM2:** https://pm2.keymetrics.io/docs/
- **Nginx:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Git:** https://git-scm.com/doc

#### **34.2 Useful Tools**

**Development:**
- **Postman:** API testing - https://www.postman.com/
- **MongoDB Compass:** MongoDB GUI - https://www.mongodb.com/products/compass
- **VSCode Extensions:**
  - ESLint
  - Prettier
  - MongoDB for VS Code
  - GitLens

**Monitoring:**
- **PM2 Plus:** https://pm2.io/
- **UptimeRobot:** https://uptimerobot.com/
- **Sentry:** https://sentry.io/

#### **34.3 Learning Resources**

**Tutorials:**
- **MERN Stack Tutorial:** https://www.mongodb.com/languages/mern-stack-tutorial
- **React Tutorial:** https://react.dev/learn
- **MongoDB University:** https://university.mongodb.com/ (free courses)

**Community:**
- **Stack Overflow:** https://stackoverflow.com/ (tag: mern, react, mongodb)
- **Reddit:** r/reactjs, r/node, r/mongodb

---

## APPENDICES

---

### **Appendix A: Glossary**

**API (Application Programming Interface):** Interface for software components to communicate.

**CAS Number (Chemical Abstracts Service Registry Number):** Unique identifier for chemical compounds.

**CORS (Cross-Origin Resource Sharing):** Security feature allowing/blocking web requests from different origins.

**CRUD (Create, Read, Update, Delete):** Basic database operations.

**CSV (Comma-Separated Values):** Simple file format for tabular data.

**DevOps:** Practices combining development and IT operations.

**Environment Variables:** Configuration values stored outside code.

**GHS (Globally Harmonized System):** International standard for chemical hazard classification.

**JWT (JSON Web Token):** Secure way to transmit information as JSON object.

**MERN Stack:** MongoDB, Express, React, Node.js - web development stack.

**Middleware:** Software that acts as bridge between OS/database and applications.

**MongoDB:** NoSQL document database.

**Mongoose:** MongoDB object modeling for Node.js.

**NPDI (New Product Development & Introduction):** Process for bringing new products to market.

**PM Ops (Product Management Operations):** Team handling operational aspects of product management.

**REST (Representational State Transfer):** Architectural style for web APIs.

**SBU (Strategic Business Unit):** Division of company focused on specific product/market.

**SDK (Software Development Kit):** Tools for developing software applications.

**SKU (Stock Keeping Unit):** Unique identifier for product variant.

**SMTP (Simple Mail Transfer Protocol):** Email transmission protocol.

**SQL/NoSQL:** Relational vs non-relational database types.

**SSL/TLS (Secure Sockets Layer / Transport Layer Security):** Protocols for secure communication.

**WSL (Windows Subsystem for Linux):** Linux environment on Windows.

---

### **Appendix B: Troubleshooting Flowchart**

```
Application Not Working?
         │
         ├─ Can't access website?
         │   ├─ Check Nginx running: sudo systemctl status nginx
         │   ├─ Check firewall: sudo ufw status
         │   └─ Check DNS: ping npdi.example.com
         │
         ├─ 502 Bad Gateway?
         │   ├─ Check backend running: pm2 list
         │   ├─ Check backend logs: pm2 logs
         │   └─ Check MongoDB: sudo service mongodb status
         │
         ├─ 500 Internal Server Error?
         │   ├─ Check server logs: pm2 logs npdi-app
         │   ├─ Check MongoDB logs: sudo tail /var/log/mongodb/mongod.log
         │   └─ Check disk space: df -h
         │
         ├─ Data not saving?
         │   ├─ Check browser console for errors
         │   ├─ Check network tab for failed requests
         │   ├─ Verify MongoDB connection
         │   └─ Check form validation
         │
         ├─ Slow performance?
         │   ├─ Check MongoDB indexes: db.productticketes.getIndexes()
         │   ├─ Check server resources: htop
         │   ├─ Enable query profiling
         │   └─ Check network latency
         │
         └─ Integration not working (PubChem/SAP)?
             ├─ Check internet connectivity
             ├─ Verify API keys in System Settings
             ├─ Check CORS configuration
             └─ Test API endpoint directly with curl
```

---

### **Appendix C: File Structure**

```
npdi-app/
├── client/                      # React frontend
│   ├── dist/                   # Production build output
│   ├── public/                 # Static files
│   │   ├── background2.png     # Login background
│   │   └── vite.svg           # Favicon
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── admin/         # Admin-only components
│   │   │   │   ├── MARASearchPopup.jsx
│   │   │   │   ├── SimilarProductsPopup.jsx
│   │   │   │   └── SystemSettings.jsx
│   │   │   ├── forms/         # Form components
│   │   │   │   ├── ChemicalPropertiesForm.jsx
│   │   │   │   ├── DynamicFormSection.jsx
│   │   │   │   └── QualitySpecificationsForm.jsx
│   │   │   ├── badges.jsx     # Status/priority badges
│   │   │   ├── Layout.jsx     # Main layout wrapper
│   │   │   └── Loading.jsx    # Loading spinner
│   │   ├── pages/             # Page components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CreateTicket.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DraftsView.jsx
│   │   │   ├── PMOPSDashboard.jsx
│   │   │   ├── ProfileSelection.jsx
│   │   │   ├── TicketDetails.jsx
│   │   │   └── TicketList.jsx
│   │   ├── services/          # API services
│   │   │   └── api.js         # API client (axios)
│   │   ├── utils/             # Utilities
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── .env                    # Environment variables
│   ├── .env.example            # Example env file
│   ├── package.json            # Dependencies
│   ├── vite.config.js          # Vite configuration
│   └── tailwind.config.js      # Tailwind configuration
│
├── server/                      # Express backend
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── controllers/           # Route controllers
│   │   ├── adminController.js
│   │   ├── productController.js
│   │   ├── permissionController.js
│   │   └── ...
│   ├── models/                # Mongoose models
│   │   ├── ProductTicket.js
│   │   ├── User.js
│   │   ├── Permission.js
│   │   ├── FormConfiguration.js
│   │   └── ...
│   ├── routes/                # Express routes
│   │   ├── products.js
│   │   ├── users.js
│   │   ├── formConfig.js
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── dataExportService.js
│   │   ├── pdpChecklistExportService.js
│   │   └── pifExportService.js
│   ├── scripts/               # Utility scripts
│   │   ├── seedFormConfig.js  # Database seeding
│   │   ├── assignTicketsToUser.js
│   │   └── fixCreatedByField.js
│   ├── data/                  # Data files
│   │   └── devProfiles.json   # Development profiles
│   ├── .env                   # Environment variables
│   ├── .env.example           # Example env file
│   ├── package.json           # Dependencies
│   └── index.js               # Server entry point
│
├── docs/                       # Documentation
│   ├── architecture/
│   │   └── ARCHITECTURE.md
│   └── archive/
│
├── .gitignore                  # Git ignore rules
├── README.md                   # Project README
├── MAINTENANCE_GUIDE.md        # This file!
└── package.json                # Root package.json
```

---

### **Appendix D: Keyboard Shortcuts**

**Browser (Chrome/Firefox):**
- `Ctrl + Shift + R` - Hard refresh (clear cache)
- `F12` - Open DevTools
- `Ctrl + Shift + C` - Inspect element
- `Ctrl + Shift + J` - Open Console
- `Ctrl + Shift + I` - Open DevTools
- `Ctrl + K` - Clear console

**VSCode:**
- `Ctrl + P` - Quick file open
- `Ctrl + Shift + P` - Command palette
- `Ctrl + `` ` `` - Toggle terminal
- `Ctrl + /` - Toggle comment
- `Ctrl + D` - Select next occurrence
- `Alt + ↑/↓` - Move line up/down
- `Shift + Alt + ↑/↓` - Copy line up/down
- `Ctrl + F` - Find in file
- `Ctrl + Shift + F` - Find in project

**Terminal:**
- `Ctrl + C` - Stop running process
- `Ctrl + Z` - Suspend process
- `Ctrl + L` - Clear screen
- `Ctrl + R` - Search command history
- `Ctrl + A` - Move to beginning of line
- `Ctrl + E` - Move to end of line
- `Tab` - Auto-complete
- `↑/↓` - Navigate command history

---

### **Appendix E: Quick Start Cheat Sheet**

**Starting the Application (Development):**

```bash
# Terminal 1: Start MongoDB
sudo service mongodb start

# Terminal 2: Start Server
cd ~/npdi-app/server
npm start

# Terminal 3: Start Client
cd ~/npdi-app/client
npm run dev

# Open browser: http://localhost:5173
```

**Common Tasks:**

```bash
# Pull latest code
cd ~/npdi-app
git pull origin dev
cd server && npm install
cd ../client && npm install

# View logs
pm2 logs npdi-app  # Production
# Or check terminal output in dev

# Restart everything
pkill -f "node.*server"
pkill -f "vite"
cd ~/npdi-app/server && npm start
cd ~/npdi-app/client && npm run dev

# Backup database
mongodump --db npdi-portal --out ~/backup-$(date +%Y%m%d)

# Check if services running
lsof -i :5000  # Server
lsof -i :5173  # Client
lsof -i :27017 # MongoDB
```

---

### **Appendix F: Version History**

**Version 1.0.0** (Initial Release)
- Profile-based authentication
- Dynamic form system
- Product ticket management
- SKU variant tracking
- Dashboard for each role
- PubChem integration
- SAP/Palantir integration
- Excel/CSV export
- Permission management
- Form configuration editor

**Version 1.1.0** (Feature additions)
- Similar Products search
- Enhanced SAP import with green highlighting
- Radio button field type support
- Improved dashboard statistics
- Activity feed enhancements

**Version 1.2.0** (December 2025 - SAP Search, UX Enhancements & Code Quality)
- Intelligent multi-criteria SAP search (automatic type detection)
- Case-insensitive prefix matching for product name searches
- Pagination with "Load More" functionality (10 results at a time)
- Base -BULK SKU filtering (excludes variants like -VAR, -SPEC)
- Enhanced result display with SBU instead of Unit
- Missing CAS indicator with visual feedback
- Improved loading UX with immediate spinner feedback
- Dynamic currency support (14 currencies)
- Pricing form simplification
- ROW_NUMBER() pagination for Palantir SQL compatibility
- **Code Quality Improvements:**
  - Created 6 reusable utilities and components (errorHandler, dateFormatters, LoadingSpinner, EmptyState, Badge, GenericCRUDManager)
  - Refactored admin CRUD managers reducing duplicate code by ~69% per component
  - Eliminated ~320 lines of unused code across frontend and backend
  - Total impact: ~1,000+ lines of duplicate code reduced
  - Improved maintainability and consistency across application

---

## CONCLUSION

This maintenance guide has covered everything you need to maintain and support the NPDI Portal application, from basic setup to advanced troubleshooting.

**Remember:**
- Always backup before making changes
- Test in development before deploying to production
- Document any custom changes
- Keep dependencies updated
- Monitor logs regularly
- Ask for help when needed

**For additional support:**
- Check Claude Code documentation
- Review application logs
- Consult the development team
- Refer to official documentation for libraries used

**Good luck maintaining the NPDI Portal! 🚀**

---

*This guide was created with assistance from Claude Code by Anthropic.*
*Last Updated: December 2025*

