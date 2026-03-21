import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate Q4 2025 dates (October 1 - December 31, 2025)
const generateDates = () => {
  const dates = [];
  const startDate = new Date(2025, 9, 1); // October 1, 2025 (month is 0-indexed)
  const endDate = new Date(2025, 11, 31); // December 31, 2025
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    dates.push(`${day}-${month}-${year}`);
  }
  return dates;
};

const allDates = generateDates();
const numDates = allDates.length;

// Helper function to generate random sample data
const generateSampleData = (baseValue, variance = 0.2) => {
  return Array.from({ length: numDates }, () => {
    const variation = (Math.random() * 2 - 1) * variance; // -variance to +variance
    return Math.max(0, Math.round(baseValue * (1 + variation)));
  });
};

// Helper function to calculate removal rate
const calculateRemovalRate = (approved, removed) => {
  return approved > 0 ? ((removed / approved) * 100).toFixed(2) : '0.00';
};

// Generate sample data for each platform
// YouTube Data
const ytScanned = generateSampleData(150, 0.3);
const ytApproved = ytScanned.map(val => Math.max(0, Math.round(val * (0.85 + Math.random() * 0.1)))); // 85-95% of scanned
const ytRemoved = ytApproved.map((val, i) => Math.max(0, Math.round(val * (0.90 + Math.random() * 0.08)))); // 90-98% of approved

// YouTube TAT Data (distributed across 1-4 days, sum should roughly equal Approved)
const ytTAT1Day = ytApproved.map(approved => {
  const total = approved || 0;
  return Math.max(0, Math.round(total * (0.35 + Math.random() * 0.15))); // 35-50% in 1 day
});
const ytTAT2Day = ytApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - ytTAT1Day[i];
  return Math.max(0, Math.round(remaining * (0.40 + Math.random() * 0.20))); // 40-60% of remaining
});
const ytTAT3Day = ytApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - ytTAT1Day[i] - ytTAT2Day[i];
  return Math.max(0, Math.round(remaining * (0.50 + Math.random() * 0.30))); // 50-80% of remaining
});
const ytTAT4Day = ytApproved.map((approved, i) => {
  const total = approved || 0;
  return Math.max(0, total - ytTAT1Day[i] - ytTAT2Day[i] - ytTAT3Day[i]); // Remaining
});

// Instagram Data
const instaScanned = generateSampleData(25, 0.25);
const instaApproved = instaScanned.map(val => Math.max(0, Math.round(val * (0.88 + Math.random() * 0.10)))); // 88-98% of scanned
const instaRemoved = instaApproved.map((val, i) => Math.max(0, Math.round(val * (0.92 + Math.random() * 0.06)))); // 92-98% of approved

// Instagram TAT Data (distributed across 1-4 days, sum should roughly equal Approved)
const instaTAT1Day = instaApproved.map(approved => {
  const total = approved || 0;
  return Math.max(0, Math.round(total * (0.40 + Math.random() * 0.20))); // 40-60% in 1 day
});
const instaTAT2Day = instaApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - instaTAT1Day[i];
  return Math.max(0, Math.round(remaining * (0.45 + Math.random() * 0.25))); // 45-70% of remaining
});
const instaTAT3Day = instaApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - instaTAT1Day[i] - instaTAT2Day[i];
  return Math.max(0, Math.round(remaining * (0.55 + Math.random() * 0.35))); // 55-90% of remaining
});
const instaTAT4Day = instaApproved.map((approved, i) => {
  const total = approved || 0;
  return Math.max(0, total - instaTAT1Day[i] - instaTAT2Day[i] - instaTAT3Day[i]); // Remaining
});

// Weblink Data
const webScanned = generateSampleData(70, 0.3);
const webApproved = webScanned.map(val => Math.max(0, Math.round(val * (0.86 + Math.random() * 0.12)))); // 86-98% of scanned
const webRemoved = webApproved.map((val, i) => Math.max(0, Math.round(val * (0.91 + Math.random() * 0.07)))); // 91-98% of approved

// Weblink TAT Data (distributed across 1-4 days, sum should roughly equal Approved)
const webTAT1Day = webApproved.map(approved => {
  const total = approved || 0;
  return Math.max(0, Math.round(total * (0.38 + Math.random() * 0.18))); // 38-56% in 1 day
});
const webTAT2Day = webApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - webTAT1Day[i];
  return Math.max(0, Math.round(remaining * (0.42 + Math.random() * 0.22))); // 42-64% of remaining
});
const webTAT3Day = webApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - webTAT1Day[i] - webTAT2Day[i];
  return Math.max(0, Math.round(remaining * (0.52 + Math.random() * 0.32))); // 52-84% of remaining
});
const webTAT4Day = webApproved.map((approved, i) => {
  const total = approved || 0;
  return Math.max(0, total - webTAT1Day[i] - webTAT2Day[i] - webTAT3Day[i]); // Remaining
});

// Facebook Data
const fbScanned = generateSampleData(60, 0.3);
const fbApproved = fbScanned.map(val => Math.max(0, Math.round(val * (0.87 + Math.random() * 0.11)))); // 87-98% of scanned
const fbRemoved = fbApproved.map((val, i) => Math.max(0, Math.round(val * (0.90 + Math.random() * 0.08)))); // 90-98% of approved

// Facebook TAT Data (distributed across 1-4 days, sum should roughly equal Approved)
const fbTAT1Day = fbApproved.map(approved => {
  const total = approved || 0;
  return Math.max(0, Math.round(total * (0.36 + Math.random() * 0.16))); // 36-52% in 1 day
});
const fbTAT2Day = fbApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - fbTAT1Day[i];
  return Math.max(0, Math.round(remaining * (0.41 + Math.random() * 0.21))); // 41-62% of remaining
});
const fbTAT3Day = fbApproved.map((approved, i) => {
  const total = approved || 0;
  const remaining = total - fbTAT1Day[i] - fbTAT2Day[i];
  return Math.max(0, Math.round(remaining * (0.50 + Math.random() * 0.30))); // 50-80% of remaining
});
const fbTAT4Day = fbApproved.map((approved, i) => {
  const total = approved || 0;
  return Math.max(0, total - fbTAT1Day[i] - fbTAT2Day[i] - fbTAT3Day[i]); // Remaining
});

// Build transposed data: dates as columns, metrics as rows
const buildTransposedData = () => {
  const rows = [];
  
  // First row: Date header + all dates
  const headerRow = ['Date', ...allDates];
  rows.push(headerRow);
  
  // YouTube metrics rows
  rows.push(['YouTube_Scanned', ...ytScanned.map(v => v || 0)]);
  rows.push(['YouTube_Approved', ...ytApproved.map(v => v || 0)]);
  rows.push(['YouTube_Removed', ...ytRemoved.map(v => v || 0)]);
  rows.push(['YouTube_RemovalRate', ...ytApproved.map((approved, i) => 
    calculateRemovalRate(approved || 0, ytRemoved[i] || 0)
  )]);
  rows.push(['YouTube_TAT_1Day', ...ytTAT1Day.map(v => v || 0)]);
  rows.push(['YouTube_TAT_2Day', ...ytTAT2Day.map(v => v || 0)]);
  rows.push(['YouTube_TAT_3Day', ...ytTAT3Day.map(v => v || 0)]);
  rows.push(['YouTube_TAT_4Day', ...ytTAT4Day.map(v => v || 0)]);
  
  // Instagram metrics rows
  rows.push(['Instagram_Scanned', ...instaScanned.map(v => v || 0)]);
  rows.push(['Instagram_Approved', ...instaApproved.map(v => v || 0)]);
  rows.push(['Instagram_Removed', ...instaRemoved.map(v => v || 0)]);
  rows.push(['Instagram_RemovalRate', ...instaApproved.map((approved, i) => 
    calculateRemovalRate(approved || 0, instaRemoved[i] || 0)
  )]);
  rows.push(['Instagram_TAT_1Day', ...instaTAT1Day.map(v => v || 0)]);
  rows.push(['Instagram_TAT_2Day', ...instaTAT2Day.map(v => v || 0)]);
  rows.push(['Instagram_TAT_3Day', ...instaTAT3Day.map(v => v || 0)]);
  rows.push(['Instagram_TAT_4Day', ...instaTAT4Day.map(v => v || 0)]);
  
  // Weblink metrics rows
  rows.push(['Weblink_Scanned', ...webScanned.map(v => v || 0)]);
  rows.push(['Weblink_Approved', ...webApproved.map(v => v || 0)]);
  rows.push(['Weblink_Removed', ...webRemoved.map(v => v || 0)]);
  rows.push(['Weblink_RemovalRate', ...webApproved.map((approved, i) => 
    calculateRemovalRate(approved || 0, webRemoved[i] || 0)
  )]);
  rows.push(['Weblink_TAT_1Day', ...webTAT1Day.map(v => v || 0)]);
  rows.push(['Weblink_TAT_2Day', ...webTAT2Day.map(v => v || 0)]);
  rows.push(['Weblink_TAT_3Day', ...webTAT3Day.map(v => v || 0)]);
  rows.push(['Weblink_TAT_4Day', ...webTAT4Day.map(v => v || 0)]);
  
  // Facebook metrics rows
  rows.push(['Facebook_Scanned', ...fbScanned.map(v => v || 0)]);
  rows.push(['Facebook_Approved', ...fbApproved.map(v => v || 0)]);
  rows.push(['Facebook_Removed', ...fbRemoved.map(v => v || 0)]);
  rows.push(['Facebook_RemovalRate', ...fbApproved.map((approved, i) => 
    calculateRemovalRate(approved || 0, fbRemoved[i] || 0)
  )]);
  rows.push(['Facebook_TAT_1Day', ...fbTAT1Day.map(v => v || 0)]);
  rows.push(['Facebook_TAT_2Day', ...fbTAT2Day.map(v => v || 0)]);
  rows.push(['Facebook_TAT_3Day', ...fbTAT3Day.map(v => v || 0)]);
  rows.push(['Facebook_TAT_4Day', ...fbTAT4Day.map(v => v || 0)]);
  
  return rows;
};

// Helper function to get month index from date string (DD-MM-YYYY or DD/MM/YYYY)
const getMonthFromDate = (dateStr) => {
  const parts = dateStr.split(/[-/]/);
  if (parts.length < 2) return -1;
  return parseInt(parts[1], 10) - 1; // 0-indexed month (9=Oct, 10=Nov, 11=Dec)
};

// Helper function to calculate monthly totals for a platform
const calculateMonthlyTotals = (dataArray, monthIndex) => {
  let total = 0;
  allDates.forEach((date, i) => {
    const dateMonth = getMonthFromDate(date);
    if (dateMonth === monthIndex) {
      total += dataArray[i] || 0;
    }
  });
  return total;
};

// Generate Overall Reports data for Q4 2025
const generateReportsData = () => {
  const rows = [];
  
  // Define Q4 2025 weeks
  const months = [
    {
      name: 'Oct',
      fullName: 'October',
      monthIndex: 9, // 0-indexed (October = 9)
      weeks: [
        { range: '1 Oct - 7 Oct', days: 7 },
        { range: '8 Oct - 14 Oct', days: 7 },
        { range: '15 Oct - 21 Oct', days: 7 },
        { range: '22 Oct - 31 Oct', days: 10 }
      ]
    },
    {
      name: 'Nov',
      fullName: 'November',
      monthIndex: 10, // 0-indexed (November = 10)
      weeks: [
        { range: '1 Nov - 7 Nov', days: 7 },
        { range: '8 Nov - 14 Nov', days: 7 },
        { range: '15 Nov - 21 Nov', days: 7 },
        { range: '22 Nov - 30 Nov', days: 9 }
      ]
    },
    {
      name: 'Dec',
      fullName: 'December',
      monthIndex: 11, // 0-indexed (December = 11)
      weeks: [
        { range: '1 Dec - 7 Dec', days: 7 },
        { range: '8 Dec - 14 Dec', days: 7 },
        { range: '15 Dec - 21 Dec', days: 7 },
        { range: '22 Dec - 31 Dec', days: 10 }
      ]
    }
  ];

  // Generate sample data for each month
  months.forEach(month => {
    const weekData = [];
    
    // Calculate monthly totals from daily metrics (sum of all platforms)
    const monthlyScanned = calculateMonthlyTotals(ytScanned, month.monthIndex) +
                          calculateMonthlyTotals(instaScanned, month.monthIndex) +
                          calculateMonthlyTotals(webScanned, month.monthIndex) +
                          (month.name === 'Dec' ? calculateMonthlyTotals(fbScanned, month.monthIndex) : 0);
    
    const monthlyApproved = calculateMonthlyTotals(ytApproved, month.monthIndex) +
                           calculateMonthlyTotals(instaApproved, month.monthIndex) +
                           calculateMonthlyTotals(webApproved, month.monthIndex) +
                           (month.name === 'Dec' ? calculateMonthlyTotals(fbApproved, month.monthIndex) : 0);
    
    const monthlyRemoved = calculateMonthlyTotals(ytRemoved, month.monthIndex) +
                          calculateMonthlyTotals(instaRemoved, month.monthIndex) +
                          calculateMonthlyTotals(webRemoved, month.monthIndex) +
                          (month.name === 'Dec' ? calculateMonthlyTotals(fbRemoved, month.monthIndex) : 0);
    
    const monthlyPending = monthlyApproved - monthlyRemoved;
    const monthlyRemovalRate = monthlyApproved > 0 
      ? ((monthlyRemoved / monthlyApproved) * 100).toFixed(2) 
      : '0.00';

    // Generate data for each week (distribute monthly totals across weeks)
    let remainingApproved = monthlyApproved;
    let remainingRemoved = monthlyRemoved;
    let remainingSent = monthlyScanned;
    
    month.weeks.forEach((week, weekIndex) => {
      const isLastWeek = weekIndex === month.weeks.length - 1;
      
      // Distribute totals proportionally, with last week getting remainder
      let weekSent, weekApproved, weekRemoved;
      if (isLastWeek) {
        weekSent = remainingSent;
        weekApproved = remainingApproved;
        weekRemoved = remainingRemoved;
      } else {
        const weekRatio = week.days / month.weeks.reduce((sum, w) => sum + w.days, 0);
        weekSent = Math.round(monthlyScanned * weekRatio);
        weekApproved = Math.round(monthlyApproved * weekRatio);
        weekRemoved = Math.round(monthlyRemoved * weekRatio);
        remainingSent -= weekSent;
        remainingApproved -= weekApproved;
        remainingRemoved -= weekRemoved;
      }
      
      const weekPending = weekApproved - weekRemoved;
      const weekRemovalRate = weekApproved > 0 ? ((weekRemoved / weekApproved) * 100).toFixed(2) : '0.00';

      weekData.push({
        range: week.range,
        sent: weekSent,
        approved: weekApproved,
        removed: weekRemoved,
        pending: Math.max(0, weekPending),
        removalRate: weekRemovalRate
      });
    });

    // Add rows for each week
    weekData.forEach((week, weekIndex) => {
      const weekNum = weekIndex + 1;
      rows.push([`Report_${month.name}_Week${weekNum}_DateRange`, week.range]);
      rows.push([`Report_${month.name}_Week${weekNum}_Sent`, week.sent]);
      rows.push([`Report_${month.name}_Week${weekNum}_Approved`, week.approved]);
      rows.push([`Report_${month.name}_Week${weekNum}_Removed`, week.removed]);
      rows.push([`Report_${month.name}_Week${weekNum}_Pending`, week.pending]);
      rows.push([`Report_${month.name}_Week${weekNum}_RemovalRate`, week.removalRate]);
    });

    // Add monthly summary rows (calculated from daily metrics)
    rows.push([`Report_${month.name}_Monthly_DateRange`, `${month.fullName} 2025`]);
    rows.push([`Report_${month.name}_Monthly_Sent`, monthlyScanned]); // Sent = Scanned
    rows.push([`Report_${month.name}_Monthly_Approved`, monthlyApproved]);
    rows.push([`Report_${month.name}_Monthly_Removed`, monthlyRemoved]);
    rows.push([`Report_${month.name}_Monthly_Pending`, monthlyPending]);
    rows.push([`Report_${month.name}_Monthly_RemovalRate`, monthlyRemovalRate]);

    // Add platform-wise monthly data rows (calculated from daily metrics)
    // October and November: YouTube, Instagram, Weblink
    // December: YouTube, Instagram, Weblink, Facebook
    const platforms = month.name === 'Dec' 
      ? ['YouTube', 'Instagram', 'Weblink', 'Facebook']
      : ['YouTube', 'Instagram', 'Weblink'];

    platforms.forEach(platform => {
      const platformKey = platform === 'Weblink' ? 'Weblink' : platform;
      
      // Calculate monthly totals from daily data
      let scanned, approved, removed, removalRate;
      
      if (platform === 'YouTube') {
        scanned = calculateMonthlyTotals(ytScanned, month.monthIndex);
        approved = calculateMonthlyTotals(ytApproved, month.monthIndex);
        removed = calculateMonthlyTotals(ytRemoved, month.monthIndex);
      } else if (platform === 'Instagram') {
        scanned = calculateMonthlyTotals(instaScanned, month.monthIndex);
        approved = calculateMonthlyTotals(instaApproved, month.monthIndex);
        removed = calculateMonthlyTotals(instaRemoved, month.monthIndex);
      } else if (platform === 'Weblink') {
        scanned = calculateMonthlyTotals(webScanned, month.monthIndex);
        approved = calculateMonthlyTotals(webApproved, month.monthIndex);
        removed = calculateMonthlyTotals(webRemoved, month.monthIndex);
      } else if (platform === 'Facebook') {
        scanned = calculateMonthlyTotals(fbScanned, month.monthIndex);
        approved = calculateMonthlyTotals(fbApproved, month.monthIndex);
        removed = calculateMonthlyTotals(fbRemoved, month.monthIndex);
      }
      
      removalRate = approved > 0 ? ((removed / approved) * 100).toFixed(2) : '0.00';
      
      rows.push([`Report_${month.name}_Platform_${platformKey}_Scanned`, scanned]);
      rows.push([`Report_${month.name}_Platform_${platformKey}_Approved`, approved]);
      rows.push([`Report_${month.name}_Platform_${platformKey}_Removed`, removed]);
      rows.push([`Report_${month.name}_Platform_${platformKey}_RemovalRate`, removalRate]);
    });
  });

  return rows;
};

// Create workbook with single sheet
const workbook = XLSX.utils.book_new();
const transposedData = buildTransposedData();
const reportsData = generateReportsData();

console.log(`\n📊 Generating Excel template with sample data for Q4 2025...`);
console.log(`Total rows: ${transposedData.length} (${transposedData.length - 1} metric rows + 1 header row)`);
console.log(`Total columns: ${transposedData[0].length} (1 Date column + ${allDates.length} date columns)`);
console.log(`Date range: ${allDates[0]} to ${allDates[allDates.length - 1]} (Q4 2025: Oct 1 - Dec 31, 2025)`);
console.log(`Total days: ${allDates.length} days`);

// Create worksheet from array of arrays
const worksheet = XLSX.utils.aoa_to_sheet(transposedData);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics Data');

// Add Overall Reports data to the same sheet (append rows)
const reportsRows = reportsData.map(row => {
  // Pad row to match the number of columns in the main data
  const paddedRow = [...row];
  while (paddedRow.length < transposedData[0].length) {
    paddedRow.push('');
  }
  return paddedRow;
});
// Append reports data rows
reportsRows.forEach(row => {
  XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: -1 });
});

// Write the file to public folder
// Try to write to analytics-data.xlsx, if locked, write to template file
const outputPath = join(__dirname, 'public', 'analytics-data.xlsx');
const templatePath = join(__dirname, 'public', 'analytics-data-template.xlsx');

let finalPath = outputPath;
try {
  XLSX.writeFile(workbook, outputPath);
  console.log(`\n✅ Excel template created successfully at: ${outputPath}`);
} catch (error) {
  if (error.code === 'EBUSY' || error.code === 'EACCES') {
    console.log(`\n⚠️  Warning: ${outputPath} is locked (probably open in Excel)`);
    console.log(`   Creating template file instead: ${templatePath}`);
    XLSX.writeFile(workbook, templatePath);
    finalPath = templatePath;
    console.log(`\n✅ Excel template created successfully at: ${templatePath}`);
    console.log(`   Please close ${outputPath} and rename the template file if needed.`);
  } else {
    throw error;
  }
}

console.log('\n📋 Template includes:');
console.log('  ✓ YouTube: Scanned, Approved, Removed, RemovalRate, TAT (1-4 Days)');
console.log('  ✓ Instagram: Scanned, Approved, Removed, RemovalRate, TAT (1-4 Days)');
console.log('  ✓ Weblink: Scanned, Approved, Removed, RemovalRate, TAT (1-4 Days)');
console.log('  ✓ Facebook: Scanned, Approved, Removed, RemovalRate, TAT (1-4 Days)');
console.log('  ✓ Overall Reports: Q4 2025 (Oct, Nov, Dec) with weekly and monthly breakdowns');
console.log('\n📐 Format:');
console.log('  - First column: Metric names (Date, YouTube_Scanned, etc.)');
console.log('  - Remaining columns: Dates (DD-MM-YYYY format)');
console.log('  - Each row represents one metric across all dates');
console.log(`  - Total dates: ${allDates.length} days`);
console.log(`  - Reports data: ${reportsData.length} rows for Q4 2025`);
