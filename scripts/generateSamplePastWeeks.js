/**
 * Generate Sample Past Weeks Data for Tyler Stewart
 * This script creates a realistic pastWeeks document with historical data
 * 
 * Run with: node scripts/generateSamplePastWeeks.js
 */

// Tyler Stewart's user ID
const TYLER_USER_ID = 'Tyler.Stewart@netsurit.com';

/**
 * Generate a week's data
 */
function generateWeekData(weekId, weekStartDate, totalGoals, completedGoals) {
  const score = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const weekStart = new Date(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    totalGoals,
    completedGoals,
    skippedGoals: Math.max(0, totalGoals - completedGoals),
    score,
    weekStartDate: weekStart.toISOString(),
    weekEndDate: weekEnd.toISOString(),
    archivedAt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString() // Archived day after week ends
  };
}

/**
 * Generate past weeks document with realistic data
 */
function generatePastWeeksDocument() {
  const weekHistory = {};
  
  // Generate 12 weeks of historical data (Sept - Nov 2025)
  const weekData = [
    // Week 37 - Sept 8-14 (Good week)
    { weekId: '2025-W37', date: '2025-09-08', total: 5, completed: 4 },
    // Week 38 - Sept 15-21 (Great week!)
    { weekId: '2025-W38', date: '2025-09-15', total: 6, completed: 6 },
    // Week 39 - Sept 22-28 (Struggling week)
    { weekId: '2025-W39', date: '2025-09-22', total: 7, completed: 3 },
    // Week 40 - Sept 29-Oct 5 (Okay week)
    { weekId: '2025-W40', date: '2025-09-29', total: 5, completed: 3 },
    // Week 41 - Oct 6-12 (Strong comeback)
    { weekId: '2025-W41', date: '2025-10-06', total: 6, completed: 5 },
    // Week 42 - Oct 13-19 (Perfect week!)
    { weekId: '2025-W42', date: '2025-10-13', total: 5, completed: 5 },
    // Week 43 - Oct 20-26 (Good week)
    { weekId: '2025-W43', date: '2025-10-20', total: 7, completed: 6 },
    // Week 44 - Oct 27-Nov 2 (Missed goals)
    { weekId: '2025-W44', date: '2025-10-27', total: 6, completed: 2 },
    // Week 45 - Nov 3-9 (Recovery week)
    { weekId: '2025-W45', date: '2025-11-03', total: 5, completed: 4 },
    // Week 46 - Nov 10-16 (Solid week)
    { weekId: '2025-W46', date: '2025-11-10', total: 6, completed: 5 },
  ];
  
  weekData.forEach(({ weekId, date, total, completed }) => {
    weekHistory[weekId] = generateWeekData(weekId, date, total, completed);
  });
  
  return {
    id: TYLER_USER_ID,
    userId: TYLER_USER_ID,
    weekHistory,
    totalWeeksTracked: Object.keys(weekHistory).length,
    createdAt: '2025-09-08T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  };
}

// Generate the document
const pastWeeksDoc = generatePastWeeksDocument();

// Output as formatted JSON
console.log('='.repeat(80));
console.log('SAMPLE PAST WEEKS DOCUMENT FOR TYLER STEWART');
console.log('='.repeat(80));
console.log();
console.log(JSON.stringify(pastWeeksDoc, null, 2));
console.log();
console.log('='.repeat(80));
console.log('SUMMARY:');
console.log('='.repeat(80));

// Calculate overall stats
const weeks = Object.values(pastWeeksDoc.weekHistory);
const totalGoals = weeks.reduce((sum, w) => sum + w.totalGoals, 0);
const completedGoals = weeks.reduce((sum, w) => sum + w.completedGoals, 0);
const avgScore = weeks.reduce((sum, w) => sum + w.score, 0) / weeks.length;
const bestWeek = Math.max(...weeks.map(w => w.score));
const worstWeek = Math.min(...weeks.map(w => w.score));

console.log(`Total Weeks Tracked: ${pastWeeksDoc.totalWeeksTracked}`);
console.log(`Total Goals Set: ${totalGoals}`);
console.log(`Total Goals Completed: ${completedGoals}`);
console.log(`Average Score: ${Math.round(avgScore)}%`);
console.log(`Best Week: ${bestWeek}%`);
console.log(`Worst Week: ${worstWeek}%`);
console.log();
console.log('Week-by-Week Breakdown:');
Object.entries(pastWeeksDoc.weekHistory).forEach(([weekId, data]) => {
  const emoji = data.score >= 80 ? '🟢' : data.score >= 60 ? '🟡' : data.score >= 40 ? '🟠' : '🔴';
  console.log(`  ${emoji} ${weekId}: ${data.completedGoals}/${data.totalGoals} goals (${data.score}%)`);
});
console.log();
console.log('='.repeat(80));
console.log('TO INSERT INTO COSMOS DB:');
console.log('='.repeat(80));
console.log('1. Go to Azure Portal > Cosmos DB > Data Explorer');
console.log('2. Navigate to "pastWeeks" container');
console.log(`3. Create new document with id: "${TYLER_USER_ID}"`);
console.log('4. Paste the JSON above');
console.log('5. Save the document');
console.log('='.repeat(80));

