## NAVIGATION ARCHITECTURE — CUSTOMER & ADMIN

Create two completely separate navigation systems.

### CUSTOMER MOBILE APP
Use a fixed bottom navigation with exactly five primary items:
1. Home
2. Wallet
3. Team
4. Activity
5. Profile

All secondary pages must be accessible through a beautifully designed More Menu or Navigation Drawer.

### ADMIN MOBILE APP
Use a fixed bottom navigation with exactly five primary items:
1. Dashboard
2. Users
3. Approvals
4. Reports
5. More

The More section must open a structured navigation drawer containing:
- Financial Management
- Wallet Management
- Investment Management
- Commission Management
- Binary Matching Management
- Genealogy Management
- Support Management
- Roles & Permissions
- System Settings
- Audit Logs
- Logout

### DESKTOP NAVIGATION
Use a fixed collapsible sidebar for both Customer and Admin applications. Each must have its own navigation hierarchy.

### RESPONSIVE BEHAVIOR
- Mobile: Fixed bottom navigation, compact header, drawer for secondary navigation.
- Tablet: Adaptive sidebar or navigation drawer.
- Desktop: Persistent collapsible sidebar.
- Active navigation must have a clear visual indicator.
- Use consistent icons and labels.
- Support notification badges where relevant.
- Never overcrowd mobile bottom navigation.
- All navigation links must lead to their respective functional screens.
- Hide admin-only features from customer accounts.
- Enforce role-based navigation visibility.

Do not include Rank, Rewards, or Leadership modules in the current scope.