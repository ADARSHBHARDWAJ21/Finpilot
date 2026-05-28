function n(value) {
  return Number(value) || 0;
}

function formatInr(value) {
  return `₹${Math.round(n(value)).toLocaleString("en-IN")}`;
}

function parseFinancialYear(financialYear) {
  const [start, end] = String(financialYear || "2024-25").split("-");
  const startYear = Number(start) || new Date().getFullYear();
  const endYear = end?.length === 2 ? Number(`20${end}`) : Number(end) || startYear + 1;
  return { startYear, endYear };
}

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(from, to) {
  const ms = 24 * 60 * 60 * 1000;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((end - start) / ms);
}

function totalByKey(deductions, key) {
  return (deductions ?? [])
    .filter((d) => String(d.key || "").toUpperCase() === String(key).toUpperCase())
    .reduce((sum, d) => sum + n(d.amount), 0);
}

function section80cFromOnboarding(profile) {
  return (
    n(profile?.elss_investments) +
    n(profile?.ppf) +
    n(profile?.epf) +
    n(profile?.tax_saver_fd) +
    n(profile?.life_insurance)
  );
}

function normalizeEntryDate(raw) {
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d;
  const alt = new Date(`${raw} 01`);
  if (!Number.isNaN(alt.getTime())) return alt;
  return null;
}

export function buildReminderData(taxContext) {
  const profile = taxContext.onboardingProfile ?? {};
  const deductions = taxContext.deductions ?? [];
  const goalsWorkspace = profile?.documents?.goals_workspace ?? {};
  const goalCalendarEntries = goalsWorkspace?.calendarEntries ?? [];
  const { startYear, endYear } = parseFinancialYear(taxContext.financialYear);

  const today = new Date();

  const section80cUsed = Math.min(
    150000,
    Math.max(totalByKey(deductions, "80C"), section80cFromOnboarding(profile))
  );
  const section80dUsed = Math.min(
    50000,
    totalByKey(deductions, "80D") + n(profile.health_insurance) + n(profile.parents_health_insurance)
  );
  const npsUsed = Math.min(
    50000,
    totalByKey(deductions, "80CCD_1B") + n(profile.nps_contribution) + n(profile.employer_nps)
  );

  const tasks = [
    {
      id: "adv-q1",
      title: "Advance Tax (Q1)",
      sub: "Pay advance tax for Apr-Jun quarter",
      category: "tax",
      dueDate: new Date(startYear, 5, 15),
      priority: "High",
      impact: "Avoid interest u/s 234B",
    },
    {
      id: "adv-q2",
      title: "Advance Tax (Q2)",
      sub: "Review and pay cumulative advance tax",
      category: "tax",
      dueDate: new Date(startYear, 8, 15),
      priority: "Medium",
      impact: "Maintain tax compliance",
    },
    {
      id: "adv-q3",
      title: "Advance Tax (Q3)",
      sub: "Pay cumulative tax up to Q3",
      category: "tax",
      dueDate: new Date(startYear, 11, 15),
      priority: "Medium",
      impact: "Avoid year-end pressure",
    },
    {
      id: "adv-q4",
      title: "Advance Tax (Q4)",
      sub: "Final advance tax settlement",
      category: "tax",
      dueDate: new Date(endYear, 2, 15),
      priority: "High",
      impact: "Reduce final tax payable",
    },
    {
      id: "itr-file",
      title: "File ITR",
      sub: "Complete annual filing process",
      category: "compliance",
      dueDate: new Date(endYear, 6, 31),
      priority: "High",
      impact: "Avoid late filing penalties",
    },
    ...(profile.paying_rent
      ? [
          {
            id: "rent-proof",
            title: "Upload Rent Receipts",
            sub: "Keep rent proofs ready for HRA",
            category: "document",
            dueDate: new Date(today.getFullYear(), today.getMonth(), 28),
            priority: "Medium",
            impact: "Improve HRA claim accuracy",
          },
        ]
      : []),
    ...(section80cUsed < 150000
      ? [
          {
            id: "invest-80c",
            title: "Invest in 80C",
            sub: "Use remaining 80C deduction limit",
            category: "investments",
            dueDate: new Date(endYear, 2, 31),
            priority: "Medium",
            impact: `Potential save ${formatInr((150000 - section80cUsed) * 0.2)}`,
          },
        ]
      : []),
    ...(section80dUsed < 25000
      ? [
          {
            id: "invest-80d",
            title: "Health Insurance under 80D",
            sub: "Claim additional health deduction",
            category: "investments",
            dueDate: new Date(endYear, 2, 31),
            priority: "Low",
            impact: `Potential save ${formatInr((25000 - section80dUsed) * 0.2)}`,
          },
        ]
      : []),
    ...(npsUsed < 50000
      ? [
          {
            id: "nps-topup",
            title: "NPS Top-up (80CCD)",
            sub: "Optional voluntary NPS contribution",
            category: "investments",
            dueDate: new Date(endYear, 2, 31),
            priority: "Low",
            impact: `Potential save ${formatInr((50000 - npsUsed) * 0.2)}`,
          },
        ]
      : []),
    ...(profile.credit_card_usage && profile.credit_card_usage !== "none"
      ? [
          {
            id: "cc-payment",
            title: "Credit Card Payment",
            sub: "Pay monthly card bill on time",
            category: "bills",
            dueDate: new Date(today.getFullYear(), today.getMonth(), 28),
            priority: "Medium",
            impact: "Avoid late fee + interest",
          },
        ]
      : []),
    ...goalCalendarEntries
      .filter((entry) => entry.type === "emi")
      .slice(0, 4)
      .map((entry, idx) => ({
        id: `emi-${idx}-${entry.title}`,
        title: entry.title,
        sub: "Auto-generated from Goals planner",
        category: "bills",
        dueDate: normalizeEntryDate(entry.dueDate) || new Date(today.getFullYear(), today.getMonth(), 30),
        priority: "Medium",
        impact: entry.amount ? `EMI ${formatInr(entry.amount)}` : "EMI due",
      })),
  ]
    .map((task) => {
      const d = daysBetween(today, task.dueDate);
      return {
        ...task,
        dueDateLabel: formatDate(task.dueDate),
        daysDiff: d,
        daysLeftLabel: d < 0 ? `${Math.abs(d)} days overdue` : d === 0 ? "Due today" : `${d} days left`,
        overdue: d < 0,
      };
    })
    .sort((a, b) => a.dueDate - b.dueDate);

  const pending = tasks.filter((t) => !t.overdue).length;
  const overdue = tasks.filter((t) => t.overdue).length;
  const dueThisWeek = tasks.filter((t) => t.daysDiff >= 0 && t.daysDiff <= 7).length;
  const completed = goalCalendarEntries.filter((e) => e.type === "completed").length;

  const timelineNodes = tasks.slice(0, 5).map((t) => ({
    date: t.dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase(),
    title: t.title,
    desc: t.sub,
    days: t.daysLeftLabel,
    severity: t.overdue ? "high" : t.priority.toLowerCase(),
  }));

  const aiSuggestions = [
    { text: "Review your upcoming tax and EMI tasks to avoid penalties." },
    { text: "Use Goals planner scenarios to reduce EMI burden before purchase." },
    { text: "Complete pending deduction proofs before FY end for better savings." },
  ];

  return {
    userName: taxContext.userName,
    financialYear: taxContext.financialYear,
    summaryCards: [
      { label: "Pending Actions", value: pending, sub: `${dueThisWeek} due this week`, key: "pending" },
      { label: "Due This Week", value: dueThisWeek, sub: "Action required", key: "week" },
      { label: "Overdue", value: overdue, sub: overdue ? "Immediate attention" : "No overdue tasks", key: "overdue" },
      { label: "Completed This Month", value: completed, sub: "Tracked milestones", key: "completed" },
    ],
    tasks,
    timelineNodes,
    aiSuggestions,
    upcomingWeek: tasks.filter((t) => t.daysDiff >= 0 && t.daysDiff <= 14).slice(0, 3),
    completionData: [
      { name: "Completed", value: completed, color: "#22c55e" },
      { name: "Pending", value: pending, color: "#6366f1" },
      { name: "Overdue", value: overdue, color: "#ef4444" },
    ],
  };
}

export function buildCalendarData(taxContext) {
  const reminders = buildReminderData(taxContext);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const eventsByDay = {};
  reminders.tasks.forEach((task) => {
    const d = task.dueDate;
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const day = d.getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push({
      title: task.title,
      category:
        task.category === "tax"
          ? "tax"
          : task.category === "investments"
          ? "investment"
          : task.category === "compliance"
          ? "compliance"
          : task.category === "document"
          ? "document"
          : "other",
    });
  });

  return {
    ...reminders,
    monthLabel: today.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    selectedDay: today.getDate(),
    eventsByDay,
    taxReadiness: taxContext.taxHealthScore ?? 0,
    upcomingDeadlines: reminders.tasks.slice(0, 4),
  };
}

