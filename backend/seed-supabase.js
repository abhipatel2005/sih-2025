// npm install @supabase/supabase-js uuid @faker-js/faker
import { supabase } from './config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';

// ---------------- Helper functions ----------------
function getRandomDateWithinLastMonths(months = 3) {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * (months * 30)));
    return pastDate;
}

function getRandomTime(baseHour, rangeHours) {
    const date = new Date();
    date.setHours(baseHour + Math.floor(Math.random() * rangeHours), Math.floor(Math.random() * 60), 0, 0);
    return date;
}

function createSessions(entryTime, exitTime) {
    const morningSession = faker.company.catchPhrase() + " Morning";
    const afternoonSession = faker.company.catchPhrase() + " Afternoon";

    const morningEnd = new Date(entryTime.getTime() + (1 + Math.floor(Math.random() * 2)) * 60 * 60 * 1000); // 1-2h
    const afternoonStart = new Date(entryTime.getTime() + (3 + Math.floor(Math.random() * 1)) * 60 * 60 * 1000); // 3-4h after entry
    const afternoonEnd = new Date(exitTime.getTime() - Math.floor(Math.random() * 60 * 60 * 1000)); // 0-1h before exit

    return [
        { session_name: morningSession, start: entryTime.toISOString(), end: morningEnd.toISOString() },
        { session_name: afternoonSession, start: afternoonStart.toISOString(), end: afternoonEnd.toISOString() },
    ];
}

async function getRandomUserId() {
    const { data: users, error } = await supabase.from('users').select('id');
    if (error) throw error;
    if (!users || users.length === 0) throw new Error('No users found in users table');

    const randomUser = users[Math.floor(Math.random() * users.length)];
    return randomUser.id;
}

// ---------------- Insert 100 rows ----------------
async function insertDummyAttendance() {
    const records = [];

    for (let i = 0; i < 100; i++) {
        const userId = await getRandomUserId();
        const date = getRandomDateWithinLastMonths();
        const entryTime = getRandomTime(8, 2);  // 8-10 AM
        const exitTime = getRandomTime(16, 3);  // 4-7 PM
        const sessions = createSessions(entryTime, exitTime);

        records.push({
            id: uuidv4(),
            user_id: userId,
            date: date.toISOString().split('T')[0],
            sessions,
            entry_time: entryTime.toISOString(),
            exit_time: exitTime.toISOString(),
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    }

    const { data, error } = await supabase.from('attendance').insert(records);
    if (error) console.error('Insert error:', error);
    else console.log('Inserted 100 realistic attendance records with faker!');
}

// Run the script
insertDummyAttendance().catch(console.error);
