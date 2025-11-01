# MVP Navigation Flow (24-Hour Build)

```mermaid
graph TD
    %% Public Access
    Landing[Landing Page<br/>"/"]
    Login[Login Page<br/>"/login"]

    %% Protected MVP App (4 pages only)
    subgraph "Protected Application (MVP)"
        Dashboard[Dashboard<br/>"/dashboard"]
        AddConsumption[Add Consumption<br/>"/add"]
        ConsumptionList[Consumption List<br/>"/list"]
        Profile[Profile<br/>"/profile"]
    end

    %% Error Handling (Minimal)
    subgraph "Error Pages"
        NotFound[404 Page<br/>"/404"]
        Unauthorized[Login Required<br/>"/unauthorized"]
    end

    %% MVP Navigation Flow
    Landing -->|"Login Button"| Login
    Login -->|"Valid Credentials"| Dashboard
    Login -->|"Invalid Credentials"| Login
    
    %% Main App Navigation (Header Menu)
    Dashboard <-->|"Header Navigation"| AddConsumption
    Dashboard <-->|"Header Navigation"| ConsumptionList
    Dashboard <-->|"User Menu"| Profile
    
    %% Quick Actions from Dashboard
    Dashboard -->|"Add New Record"| AddConsumption
    Dashboard -->|"View All Records"| ConsumptionList
    
    %% Form Flow
    AddConsumption -->|"Save Success"| ConsumptionList
    AddConsumption -->|"Cancel"| Dashboard
    
    %% List Actions (Minimal)
    ConsumptionList -->|"Add New"| AddConsumption
    ConsumptionList -->|"Back to Dashboard"| Dashboard
    
    %% Profile Management
    Profile -->|"Back to Dashboard"| Dashboard
    
    %% Logout Flow (from any page)
    Dashboard -->|"Logout"| Landing
    Profile -->|"Logout"| Landing
    
    %% Error Handling
    Dashboard -->|"Session Expired"| Login
    AddConsumption -->|"No Auth"| Unauthorized
    ConsumptionList -->|"No Auth"| Unauthorized
    Unauthorized -->|"Login"| Login
    
    %% 404 Fallback
    Landing -.->|"Invalid URL"| NotFound
    NotFound -->|"Go Home"| Landing

    %% Styling
    classDef publicPage fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef mvpPage fill:#e8f5e8,stroke:#388e3c,stroke-width:3px
    classDef errorPage fill:#ffebee,stroke:#d32f2f,stroke-width:2px

    class Landing,Login publicPage
    class Dashboard,AddConsumption,ConsumptionList,Profile mvpPage
    class NotFound,Unauthorized errorPage
```

## MVP Page Structure (4 Pages Maximum)

### 🎯 Page Hierarchy & Development Priority

#### **Priority 1: Core Functionality (16 hours)**

##### 1. Login Page (`/login`) - **2 hours**
**Purpose:** Single authentication entry point  
**Components:**
- LoginForm (email + password)
- Error message display
- Simple branding header

**Features:**
- React Hook Form + Zod validation
- JWT token storage (localStorage)
- Redirect to dashboard on success
- Professional styling with Tailwind

**Code Structure:**
```tsx
// /pages/login.tsx
export default function LoginPage() {
  // Form handling
  // API call to /auth/login
  // Token storage
  // Redirect logic
}
```

##### 2. Dashboard (`/dashboard`) - **4 hours**
**Purpose:** Main hub with overview and navigation  
**Components:**
- Header with navigation
- Stats cards (3 metrics)
- Recent consumption preview
- Quick action buttons

**Features:**
- Protected route (JWT required)
- Basic statistics from API
- Navigation to other pages
- Responsive grid layout

**Stats Display:**
- Total consumption this month
- Average daily consumption
- Number of records
- Simple chart (if time permits)

##### 3. Add Consumption (`/add`) - **3 hours**
**Purpose:** Single form for adding consumption data  
**Components:**
- ConsumptionForm with validation
- Success/error feedback
- Navigation back to list

**Form Fields (4 only):**
- Date picker (required)
- Consumption value (number, required)
- Type dropdown (electricity/water/gas)
- Notes (optional text area)

**Features:**
- Client + server validation
- Auto-redirect after save
- Loading states
- Mobile-friendly form

##### 4. Consumption List (`/list`) - **3 hours**
**Purpose:** Simple table of user's consumption records  
**Components:**
- ConsumptionTable
- Basic pagination (20 per page)
- Add new button

**Features:**
- User-filtered data only
- Sort by date (newest first)
- Responsive table design
- Loading/empty states

#### **Priority 2: Essential UX (4 hours)**

##### Profile Page (`/profile`) - **2 hours**
**Purpose:** Basic user info display  
**Features:**
- Display user name and email
- Logout button
- Simple account info
- No editing (MVP scope)

##### Error Pages - **1 hour**
- 404 page with home link
- Unauthorized page with login link
- Basic error boundaries

##### Navigation Polish - **1 hour**
- Header component with menu
- Mobile hamburger menu
- Active page indicators

### 🎨 MVP Design System (30 minutes setup)

#### Color Palette (Tailwind Classes):
```css
/* Primary: Blue */
.bg-primary { @apply bg-blue-600; }
.text-primary { @apply text-blue-600; }

/* Success: Green */
.bg-success { @apply bg-green-600; }
.text-success { @apply text-green-600; }

/* Warning: Orange */
.bg-warning { @apply bg-orange-500; }

/* Neutral: Gray */
.bg-neutral { @apply bg-gray-100; }
.text-neutral { @apply text-gray-600; }
```

#### Typography:
```css
.heading-1 { @apply text-2xl font-bold text-gray-800; }
.heading-2 { @apply text-xl font-semibold text-gray-700; }
.body-text { @apply text-base text-gray-600; }
.small-text { @apply text-sm text-gray-500; }
```

#### Component Standards:
```css
.btn-primary { @apply bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700; }
.btn-secondary { @apply bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300; }
.input-field { @apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500; }
.card { @apply bg-white rounded-lg shadow-md p-6; }
```

### 📱 Responsive Design Strategy

#### Breakpoints (Tailwind):
- **Mobile**: 320px - 640px (sm)
- **Tablet**: 640px - 1024px (md) 
- **Desktop**: 1024px+ (lg)

#### Layout Patterns:
```tsx
// Mobile-first responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Stats cards */}
</div>

// Responsive navigation
<nav className="hidden md:flex md:space-x-6">
  {/* Desktop menu */}
</nav>
<button className="md:hidden">
  {/* Mobile hamburger */}
</button>
```

### 🔄 Navigation Patterns

#### Header Navigation (All Pages):
```tsx
// /components/Layout.tsx
<header className="bg-white shadow-sm border-b">
  <nav className="max-w-7xl mx-auto px-4">
    <div className="flex justify-between items-center h-16">
      <Logo />
      <div className="hidden md:flex space-x-6">
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/add">Add Record</NavLink>
        <NavLink href="/list">View All</NavLink>
      </div>
      <UserMenu />
    </div>
  </nav>
</header>
```

#### Mobile Navigation:
```tsx
// Hamburger menu for mobile
<div className="md:hidden">
  <button onClick={toggleMobileMenu}>
    {/* Hamburger icon */}
  </button>
  {mobileMenuOpen && (
    <div className="absolute top-16 left-0 right-0 bg-white shadow-lg">
      <MobileNavLinks />
    </div>
  )}
</div>
```

### 🔐 Route Protection Strategy

#### Auth Context (15 minutes):
```tsx
// /context/AuthContext.tsx
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false
});

// Auth wrapper for protected routes
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

#### Route Structure:
```tsx
// /pages/_app.tsx
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
```

### 📊 User Experience Flow

#### New User Journey:
1. **Landing** → View app overview
2. **Login** → Enter demo credentials  
3. **Dashboard** → See overview + demo data
4. **Add** → Create first consumption record
5. **List** → View saved data
6. **Dashboard** → See updated stats

#### Returning User Journey:
1. **Login** → Quick authentication
2. **Dashboard** → Check recent activity
3. **Add/List** → Manage consumption data
4. **Profile** → Account management

### ⚡ Performance Optimizations

#### Page Load Strategy:
- **Static generation** for public pages
- **Client-side routing** for app pages
- **Lazy loading** for non-critical components
- **Image optimization** (Next.js built-in)

#### Bundle Optimization:
```js
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true
  },
  webpack: (config) => {
    config.optimization.splitChunks.chunks = 'all';
    return config;
  }
};
```

### 🎯 MVP Success Criteria

#### Functional Requirements:
- [ ] User can login with demo credentials
- [ ] Dashboard displays basic consumption stats
- [ ] User can add new consumption records
- [ ] User can view list of their records
- [ ] Navigation works on mobile and desktop
- [ ] System handles errors gracefully

#### User Experience Requirements:
- [ ] Professional visual design
- [ ] Responsive layout (mobile + desktop)
- [ ] Fast page transitions (< 200ms)
- [ ] Clear feedback for all actions
- [ ] Intuitive navigation flow

#### Technical Requirements:
- [ ] Protected routes work correctly
- [ ] JWT authentication functions
- [ ] Form validation prevents bad data
- [ ] API calls handle errors
- [ ] No console errors in production

This MVP navigation strategy ensures a **professional, functional application** that can be built within the 24-hour constraint while providing all essential user flows for a consumption data management system.