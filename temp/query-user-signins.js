"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function queryUserSignIns() {
    try {
        console.log('🔍 Querying User Sign-in Information...\n');
        // Query all users with their sign-in information
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                lastSignIn: true,
                status: true
            },
            orderBy: [
                { role: 'asc' },
                { lastSignIn: 'desc' },
                { name: 'asc' }
            ]
        });
        console.log(`📊 Found ${users.length} users in the database\n`);
        if (users.length === 0) {
            console.log('⚠️  No users found in the database.');
            return;
        }
        // Display formatted table
        displayUserSignInTable(users);
        // Display summary statistics
        displaySignInSummary(users);
    }
    catch (error) {
        console.error('❌ Error querying user sign-ins:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
function displayUserSignInTable(users) {
    console.log('👥 User Sign-in Report');
    console.log('='.repeat(120));
    // Table header
    const header = '│ Name'.padEnd(25) +
        '│ Email'.padEnd(35) +
        '│ Role'.padEnd(12) +
        '│ Department'.padEnd(20) +
        '│ Last Sign-in'.padEnd(20) +
        '│ Status'.padEnd(8) + '│';
    console.log(header);
    console.log('├' + '─'.repeat(24) + '┼' + '─'.repeat(34) + '┼' + '─'.repeat(11) + '┼' + '─'.repeat(19) + '┼' + '─'.repeat(19) + '┼' + '─'.repeat(7) + '┤');
    // Table rows
    for (const user of users) {
        const name = (user.name || 'N/A').padEnd(24);
        const email = user.email.padEnd(34);
        const role = user.role.padEnd(11);
        const department = (user.department || 'N/A').padEnd(19);
        const lastSignIn = formatDateTime(user.lastSignIn).padEnd(19);
        const status = user.status.padEnd(7);
        console.log(`│ ${name}│ ${email}│ ${role}│ ${department}│ ${lastSignIn}│ ${status}│`);
    }
    console.log('└' + '─'.repeat(24) + '┴' + '─'.repeat(34) + '┴' + '─'.repeat(11) + '┴' + '─'.repeat(19) + '┴' + '─'.repeat(19) + '┴' + '─'.repeat(7) + '┘');
}
function displaySignInSummary(users) {
    console.log('\n📈 Sign-in Summary');
    console.log('─'.repeat(50));
    const totalUsers = users.length;
    const usersWithSignIn = users.filter(u => u.lastSignIn !== null).length;
    const usersNeverSignedIn = users.filter(u => u.lastSignIn === null).length;
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
    const inactiveUsers = users.filter(u => u.status === 'INACTIVE').length;
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users who have signed in: ${usersWithSignIn}`);
    console.log(`Users who never signed in: ${usersNeverSignedIn}`);
    console.log(`Active Users: ${activeUsers}`);
    console.log(`Inactive Users: ${inactiveUsers}`);
    // Calculate sign-in rate
    const signInRate = totalUsers > 0 ? ((usersWithSignIn / totalUsers) * 100).toFixed(1) : '0.0';
    console.log(`Sign-in Rate: ${signInRate}%`);
    // Show recent sign-ins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignIns = users.filter(u => u.lastSignIn && u.lastSignIn >= sevenDaysAgo).length;
    console.log(`Recent Sign-ins (last 7 days): ${recentSignIns}`);
}
function formatDateTime(date) {
    if (!date) {
        return 'Never';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    // Format the date
    const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    // Add relative time
    let relativeTime = '';
    if (diffMinutes < 1) {
        relativeTime = ' (just now)';
    }
    else if (diffMinutes < 60) {
        relativeTime = ` (${diffMinutes}m ago)`;
    }
    else if (diffHours < 24) {
        relativeTime = ` (${diffHours}h ago)`;
    }
    else if (diffDays < 7) {
        relativeTime = ` (${diffDays}d ago)`;
    }
    else {
        relativeTime = ` (${Math.floor(diffDays / 7)}w ago)`;
    }
    return dateStr + relativeTime;
}
// Run the script
queryUserSignIns() < /instructions>
    < /edit_file>;
