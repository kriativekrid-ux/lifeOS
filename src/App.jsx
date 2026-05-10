import { useState, useRef, useEffect, useMemo } from "react";

const CATEGORIES = [
  { id: "health", label: "Health", icon: "🫀", color: "#e8d5b7" },
  { id: "food", label: "Food", icon: "🍽️", color: "#d4e8c2" },
  { id: "mood", label: "Mood", icon: "🌤", color: "#c2d4e8" },
  { id: "work", label: "Work", icon: "💼", color: "#e8c2d4" },
  { id: "fitness", label: "Fitness", icon: "🏃", color: "#d4c2e8" },
  { id: "social", label: "Social", icon: "🤝", color: "#e8e4c2" },
  { id: "travel", label: "Travel", icon: "✈️", color: "#c2e8e4" },
  { id: "sleep", label: "Sleep", icon: "😴", color: "#c6d4ff" },
  { id: "other", label: "Other", icon: "📌", color: "#e8cec2" },
];

const EMOJI_OPTIONS = [
  "⭐", "🌿", "🌞", "🕊️", "🧠", "💡", "💛", "✨", "🌸", "🍃",
  "📚", "🎶", "☕", "🥐", "🍎", "🌈", "🎨", "💪", "🛌", "🧘",
  "✈️", "🏞️", "🧑‍🍳", "🎉", "📍", "🗒️", "💬", "📌", "🫶", "🌙",
];

const HABIT_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COLOR_OPTIONS = [
  "#f7e8d3", "#f1d8c2", "#e8d5b7", "#f5e8d8", "#d8e8d9", "#d7e8f1", "#e8daf1", "#f1d8e8",
  "#f6e6d8", "#e8f1dc", "#e8f0f7", "#f0e8f1", "#f8e8f0", "#efe8d9", "#e8efe4",
];

const THEMES = {
  midnight: {
    label: "Midnight",
    bg: "#070816",
    bgCard: "#11142b",
    textPrimary: "#f4f5ff",
    textSecondary: "#b9b3ff",
    accent: "#9f5cff",
    border: "#2c2f5b",
    headerBg: "#0b1029",
  },
  bloom: {
    label: "Bloom",
    bg: "#f4ecf5",
    bgCard: "#fffafc",
    textPrimary: "#3d2f3c",
    textSecondary: "#8f718a",
    accent: "#a86fbf",
    border: "#e5d5e3",
    headerBg: "#f7eef6",
  },
  ink: {
    label: "Ink",
    bg: "#ffffff",
    bgCard: "#ffffff",
    textPrimary: "#050505",
    textSecondary: "#4a4a4a",
    accent: "#d00b1e",
    border: "#e5e5e5",
    headerBg: "#f8f8f8",
  },
  forest: {
    label: "Forest",
    bg: "#102d1f",
    bgCard: "#1e3f2e",
    textPrimary: "#f6ead7",
    textSecondary: "#c9b79a",
    accent: "#d67c5b",
    border: "#3b5b4b",
    headerBg: "#183a29",
  },
  candy: {
    label: "Candy",
    bg: "#ff2da0",
    bgCard: "#ffe8f7",
    textPrimary: "#24104a",
    textSecondary: "#3e2f64",
    accent: "#00d4ff",
    border: "#ff95d4",
    headerBg: "#ff5abf",
  },
};

const downscalePhoto = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 1200;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const downscaled = canvas.toDataURL('image/jpeg', 0.8);
      resolve(downscaled);
    };
    img.src = base64;
  });
};

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};
const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export default function LifeTracker() {
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lt_entries")) || [];
    } catch (err) {
      return [];
    }
  });
  const [view, setView] = useState("journal"); // journal | calendar | sleep | pixels | settings | add | detail
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [categories, setCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lt_categories")) || CATEGORIES;
    } catch (err) {
      return CATEGORIES;
    }
  });
  const [manageForm, setManageForm] = useState({ label: "", emoji: "⭐", color: "#e8d5b7" });
  const [categoryError, setCategoryError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarDay, setCalendarDay] = useState(null);
  const [sleepForm, setSleepForm] = useState({ bedtime: 22 * 60, wake: 6 * 60, mood: "😴", note: "" });
  const [draggingHandle, setDraggingHandle] = useState(null);
  const dialRef = useRef(null);
  const [themeName, setThemeName] = useState(() => {
    try {
      return localStorage.getItem("lifeTrackerTheme") || "bloom";
    } catch (err) {
      return "bloom";
    }
  });
  const theme = THEMES[themeName] || THEMES.bloom;
  const [pixelFilter, setPixelFilter] = useState("year");
  const [pixelSelectedDate, setPixelSelectedDate] = useState(null);
  const [habitsSubView, setHabitsSubView] = useState("today");
  const [habits, setHabits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lt_habits")) || [];
    } catch (err) {
      return [];
    }
  });
  const [habitCompletions, setHabitCompletions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lt_habit_completions")) || {};
    } catch (err) {
      return {};
    }
  });
  const [habitForm, setHabitForm] = useState({ name: "", emoji: "⭐", schedule: HABIT_WEEKDAYS.slice() });
  const [habitEmojiSheetOpen, setHabitEmojiSheetOpen] = useState(false);
  const [journalYearMode, setJournalYearMode] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState("home");
  const [sleepSubView, setSleepSubView] = useState("dial");
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const showBottomNav = ["journal", "calendar", "habits", "sleep", "settings"].includes(view);
  const tabs = [
    { id: "journal", icon: "📔", label: "Journal" },
    { id: "calendar", icon: "📅", label: "Day" },
    { id: "habits", icon: "✅", label: "Habits" },
    { id: "sleep", icon: "😴", label: "Sleep" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  useEffect(() => {
    localStorage.setItem("lifeTrackerTheme", themeName);
  }, [themeName]);

  useEffect(() => {
    if (view === "settings") {
      setSettingsSubView("home");
    }
    if (view === "sleep") {
      setSleepSubView("dial");
    }
    if (view === "habits") {
      setHabitsSubView("today");
    }
    if (view !== "journal") {
      setJournalYearMode(false);
    }
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem("lt_habits", JSON.stringify(habits));
    } catch (err) {
      console.warn("Failed to save habits", err);
    }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem("lt_habit_completions", JSON.stringify(habitCompletions));
    } catch (err) {
      console.warn("Failed to save habit completions", err);
    }
  }, [habitCompletions]);

  useEffect(() => {
    try {
      localStorage.setItem("lt_entries", JSON.stringify(entries));
    } catch (err) {
      console.error("Failed to save life tracker entries", err);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem("lt_categories", JSON.stringify(categories));
    } catch (err) {
      console.warn("Failed to save life tracker categories", err);
    }
  }, [categories]);

  // Form state
  const [form, setForm] = useState({ category: "health", title: "", note: "", photo: null, photoPreview: null });
  const fileRef = useRef();

  const suggestionCategories = useMemo(() => {
    const list = [...categories];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, 3);
  }, [categories]);

  const openAddForCategory = (categoryId) => {
    setForm({ category: categoryId, title: "", note: "", photo: null, photoPreview: null });
    setView("add");
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: ev.target.result, photoPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    let photo = form.photo;
    if (photo) {
      photo = await downscalePhoto(photo);
    }
    const entry = {
      id: Date.now(),
      category: form.category,
      title: form.title,
      note: form.note,
      photo: photo,
      timestamp: Date.now(),
    };
    setEntries((prev) => [entry, ...prev]);
    setForm({ category: "health", title: "", note: "", photo: null, photoPreview: null });
    setView("journal");
  };

  const categoryCount = (id) => entries.filter((entry) => entry.category === id).length;
  const activeCategoryChips = categories.filter((c) => categoryCount(c.id) > 0);

  useEffect(() => {
    if (filterCat !== "all" && categoryCount(filterCat) === 0) {
      setFilterCat("all");
    }
  }, [entries, filterCat]);

  const formatDateKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getCurrentWeekDays = () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    return HABIT_WEEKDAYS.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = formatDateKey(date);
      return {
        key,
        label: label.slice(0, 1),
        isToday: key === todayHabitKey,
        isFuture: date > now,
      };
    });
  };

  const todayHabitKey = formatDateKey(new Date());
  const todayHabitCompletions = habitCompletions[todayHabitKey] || [];
  const currentHabitDone = new Set(todayHabitCompletions);
  const completedHabitsCount = habits.filter((habit) => currentHabitDone.has(habit.id)).length;
  const currentWeekDays = getCurrentWeekDays();

  const toggleHabitCompletion = (habitId, dateKey = todayHabitKey) => {
    setHabitCompletions((prev) => {
      const current = prev[dateKey] || [];
      const alreadyDone = current.includes(habitId);
      const next = alreadyDone ? current.filter((id) => id !== habitId) : [...current, habitId];
      return { ...prev, [dateKey]: next };
    });
  };

  const getHabitStreak = (habit) => {
    const scheduleSet = new Set(habit.schedule);
    if (!habit.schedule.length) return 0;
    const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let streak = 0;
    const day = new Date();
    for (let i = 0; i < 366; i += 1) {
      const key = formatDateKey(day);
      const label = weekLabels[day.getDay()];
      if (scheduleSet.has(label)) {
        const completed = (habitCompletions[key] || []).includes(habit.id);
        if (!completed) break;
        streak += 1;
      }
      day.setDate(day.getDate() - 1);
    }
    return streak;
  };

  const formatHabitSchedule = (schedule) => {
    if (!schedule.length) return "No schedule";
    const count = schedule.length;
    const indices = schedule
      .map((day) => HABIT_WEEKDAYS.indexOf(day))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);
    const isConsecutive = indices.length > 1 && indices.every((value, index) => index === 0 || value === indices[index - 1] + 1);
    const range = isConsecutive
      ? `${HABIT_WEEKDAYS[indices[0]]}–${HABIT_WEEKDAYS[indices[indices.length - 1]]}`
      : schedule.join(", ");
    return `${count}x per week • ${range}`;
  };

  const addHabit = () => {
    const name = habitForm.name.trim();
    if (!name) return;
    const habit = {
      id: `${Date.now()}`,
      name,
      emoji: habitForm.emoji,
      schedule: habitForm.schedule,
    };
    setHabits((prev) => [habit, ...prev]);
    setHabitForm({ name: "", emoji: "⭐", schedule: HABIT_WEEKDAYS.slice() });
  };

  const toggleHabitScheduleDay = (day) => {
    setHabitForm((prev) => {
      const hasDay = prev.schedule.includes(day);
      const schedule = hasDay ? prev.schedule.filter((value) => value !== day) : [...prev.schedule, day];
      return { ...prev, schedule };
    });
  };

  const removeHabit = (habitId) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
    setHabitCompletions((prev) => {
      const entries = Object.entries(prev).map(([key, list]) => [key, list.filter((id) => id !== habitId)]);
      return Object.fromEntries(entries.filter(([, list]) => list.length > 0));
    });
  };

  const buildCalendar = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const weeks = [];
    let current = new Date(firstOfMonth);
    current.setDate(current.getDate() - startOffset);

    while (weeks.length < 6) {
      const week = [];
      for (let i = 0; i < 7; i += 1) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      if (current > lastOfMonth && current.getDay() === 1) break;
    }
    return weeks;
  };

  const calendarMap = entries.reduce((acc, entry) => {
    const key = formatDateKey(entry.timestamp);
    acc[key] = acc[key] || [];
    acc[key].push(entry);
    return acc;
  }, {});

  const calendarWeeks = buildCalendar(calendarMonth);

  const monthLabel = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const setCalendarPrev = () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const setCalendarNext = () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const openDayDetail = (date) => {
    setCalendarDay(date);
  };

  const closeDayDetail = () => setCalendarDay(null);

  const dayEntries = calendarDay ? calendarMap[calendarDay] || [] : [];

  const today = new Date();
  const todayKey = formatDateKey(today);
  const currentYear = today.getFullYear();
  const yearDays = [];
  for (let d = new Date(currentYear, 0, 1); d.getFullYear() === currentYear; d.setDate(d.getDate() + 1)) {
    yearDays.push(new Date(d));
  }
  const monthDays = [];
  for (let d = new Date(currentYear, today.getMonth(), 1); d.getMonth() === today.getMonth(); d.setDate(d.getDate() + 1)) {
    monthDays.push(new Date(d));
  }
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + index);
    return d;
  });
  const monthLabels = Array.from({ length: 12 }, (_, index) => new Date(currentYear, index, 1).toLocaleDateString("en-US", { month: "short" }));
  const daysPassed = yearDays.filter((date) => formatDateKey(date) <= todayKey).length;
  const pixelSelectedEntries = pixelSelectedDate ? entries.filter((entry) => formatDateKey(entry.timestamp) === pixelSelectedDate) : [];

  const sleepTotalMinutes = () => {
    const { bedtime, wake } = sleepForm;
    const diff = (wake - bedtime + 1440) % 1440;
    return diff === 0 ? 24 * 60 : diff;
  };

  const formatSleepDuration = () => {
    const mins = sleepTotalMinutes();
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  const snapTo30 = (minutes) => Math.round(minutes / 30) * 30 % 720;

  const resolveDialMinutes = (handle, minutes12) => {
    const normalized = minutes12 % 720;
    if (handle === "bedtime") {
      return normalized >= 360 ? normalized + 720 : normalized;
    }
    return normalized >= 240 ? normalized : normalized + 720;
  };

  const getDialMinutes = (clientX, clientY) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let degrees = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (degrees < 0) degrees += 360;
    const minutes12 = (degrees / 360) * 720;
    return snapTo30(minutes12);
  };

  const setHandleTime = (handle, clientX, clientY) => {
    const minutes12 = getDialMinutes(clientX, clientY);
    if (minutes12 === null) return;
    const minutes = resolveDialMinutes(handle, minutes12);
    setSleepForm((prev) => ({ ...prev, [handle]: minutes }));
  };

  const updateSleepHandle = (clientX, clientY) => {
    if (draggingHandle === null) return;
    setHandleTime(draggingHandle, clientX, clientY);
  };

  const startHandleDrag = (handle, event) => {
    event.preventDefault();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;
    setDraggingHandle(handle);
    setHandleTime(handle, clientX, clientY);
  };

  useEffect(() => {
    if (!draggingHandle) return undefined;
    const onMouseMove = (event) => {
      event.preventDefault();
      updateSleepHandle(event.clientX, event.clientY);
    };
    const onMouseUp = () => setDraggingHandle(null);
    const onTouchMove = (event) => {
      event.preventDefault();
      if (!event.touches[0]) return;
      updateSleepHandle(event.touches[0].clientX, event.touches[0].clientY);
    };
    const onTouchEnd = () => setDraggingHandle(null);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [draggingHandle]);

  const getHandlePosition = (minutes) => {
    const angle = (((minutes % 720) / 720) * 360 - 90) * (Math.PI / 180);
    const radius = 42;
    return {
      left: 50 + radius * Math.cos(angle),
      top: 50 + radius * Math.sin(angle),
    };
  };

  const clockArcPath = () => {
    const start = (sleepForm.bedtime / 1440) * 360 - 90;
    const end = (sleepForm.wake / 1440) * 360 - 90;
    const startRad = (start * Math.PI) / 180;
    const endRad = (end * Math.PI) / 180;
    const r = 40;
    const x1 = 50 + r * Math.cos(startRad);
    const y1 = 50 + r * Math.sin(startRad);
    const x2 = 50 + r * Math.cos(endRad);
    const y2 = 50 + r * Math.sin(endRad);
    const diff = ((end - start + 360) % 360) || 360;
    const largeArcFlag = diff > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  const setSleepTime = (minutes) => {
    setSleepForm((prev) => ({ ...prev, [prev.field]: minutes }));
  };

  const saveSleepEntry = () => {
    const entry = {
      id: Date.now(),
      category: "sleep",
      title: "Sleep",
      note: sleepForm.note,
      photo: null,
      timestamp: Date.now(),
      sleep: {
        bedtime: sleepForm.bedtime,
        wake: sleepForm.wake,
        duration: sleepTotalMinutes(),
        mood: sleepForm.mood,
      },
    };
    setEntries((prev) => [entry, ...prev]);
    setSleepForm({ bedtime: 22 * 60, wake: 6 * 60, mood: "😴", note: "" });
    setView("journal");
  };

  const addCategory = () => {
    const label = manageForm.label.trim();
    if (!label) {
      setCategoryError("Enter a category name.");
      return;
    }
    if (categories.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      setCategoryError("Category already exists.");
      return;
    }
    const id = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") || `cat-${Date.now()}`;
    setCategories((prev) => [...prev, { id, label, icon: manageForm.emoji, color: manageForm.color }]);
    setManageForm({ label: "", emoji: "⭐", color: "#e8d5b7" });
    setCategoryError("");
  };

  const deleteCategoryById = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setEntries((prev) => prev.map((entry) => (entry.category === id ? "other" : entry)));
    if (filterCat === id) setFilterCat("all");
  };

  const filtered = filterCat === "all" ? entries : entries.filter((e) => e.category === filterCat);

  const getCat = (id) => categories.find((c) => c.id === id) || categories.find((c) => c.id === "other") || categories[0];

  const formatDayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

  const sleepSummaryByDate = entries.reduce((acc, e) => {
    if (e.category !== "sleep") return acc;
    const day = formatDate(e.timestamp);
    const existing = acc[day];
    if (!existing || e.timestamp > existing.timestamp) acc[day] = e;
    return acc;
  }, {});

  const sleepEntriesByKey = entries.reduce((acc, e) => {
    if (e.category !== "sleep") return acc;
    const key = formatDayKey(e.timestamp);
    const existing = acc[key];
    if (!existing || e.timestamp > existing.timestamp) acc[key] = e;
    return acc;
  }, {});

  const sleepLast7Days = Array.from({ length: 7 }, (_, idx) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - idx));
    const key = formatDayKey(day);
    return {
      key,
      label: day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      entry: sleepEntriesByKey[key] || null,
    };
  });

  const sleepDurations = sleepLast7Days.map((item) => item.entry?.sleep?.duration || 0);
  const sleepEntryCount = sleepDurations.filter((d) => d > 0).length;
  const totalSleepThisWeek = sleepDurations.reduce((sum, d) => sum + d, 0);
  const averageSleepThisWeek = sleepEntryCount > 0 ? Math.round(totalSleepThisWeek / sleepEntryCount) : 0;
  const bestSleep = Math.max(...sleepDurations, 0);

  const formatHours = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

  const dialSize = typeof window !== "undefined" ? Math.min(window.innerWidth - 48, 300) : 300;

  const sleepEntries = entries.filter((e) => e.category === "sleep").sort((a, b) => b.timestamp - a.timestamp);

  const dayKeys = [...new Set(entries.map((e) => formatDayKey(e.timestamp)))].sort((a, b) => a.localeCompare(b));
  let currentStreak = 0;
  if (dayKeys.length > 0) {
    currentStreak = 1;
    let lastDay = new Date(dayKeys[dayKeys.length - 1]);
    for (let i = dayKeys.length - 2; i >= 0; i -= 1) {
      const nextDay = new Date(lastDay);
      nextDay.setDate(nextDay.getDate() - 1);
      if (dayKeys[i] === nextDay.toISOString().slice(0, 10)) {
        currentStreak += 1;
        lastDay = nextDay;
      } else {
        break;
      }
    }
  }

  const sortedFiltered = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  const grouped = sortedFiltered.reduce((acc, e) => {
    const d = formatDate(e.timestamp);
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", transition: "all 0.3s ease", background: theme.bg, color: theme.textPrimary, "--bg": theme.bg, "--bg-card": theme.bgCard, "--text-primary": theme.textPrimary, "--text-secondary": theme.textSecondary, "--accent": theme.accent, "--border": theme.border, "--header-bg": theme.headerBg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg: #f4ecf5; --bg-card: #fffafc; --text-primary: #3d2f3c; --text-secondary: #8f718a; --accent: #a86fbf; --border: #e5d5e3; --header-bg: #f7eef6; --pixel-future: rgba(150, 150, 150, 0.18); }
        body { background: var(--bg); }
        .app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
        .header { padding: 28px 24px 16px; border-bottom: 1.5px solid var(--border); background: var(--header-bg); position: sticky; top: 0; z-index: 10; }
        .header-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; color: var(--text-primary); }
        .header-sub { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px; }
                .filter-bar { display: flex; gap: 8px; padding: 14px 24px; overflow-x: auto; scrollbar-width: none; background: var(--header-bg); }
        .filter-bar::-webkit-scrollbar { display: none; }
        .chip { font-family: 'DM Sans', sans-serif; font-size: 11px; padding: 5px 12px; border-radius: 20px; border: 1.5px solid var(--border); background: transparent; cursor: pointer; color: var(--text-primary); white-space: nowrap; transition: all 0.15s; font-weight: 500; min-height: 44px; }
        .year-view-pill { font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center; gap: 8px; font-size: 12px; padding: 10px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; transition: all 0.18s; margin-top: 12px; }
        .year-view-pill.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .placeholder-screen { min-height: calc(100vh - 260px); display: flex; align-items: center; justify-content: center; }
        .placeholder-text { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--text-secondary); }
        .pixel-filter-bar { display: flex; gap: 10px; margin: 16px 0 12px; flex-wrap: wrap; }
        .pixel-filter-btn { font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 10px 14px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; transition: all 0.18s; min-height: 40px; }
        .pixel-filter-btn.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .habits-pill-row { display: flex; gap: 10px; margin: 12px 0 18px; }
        .habits-pill { font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 10px 16px; border: 1.5px solid var(--border); border-radius: 999px; background: var(--bg-card); color: var(--text-secondary); cursor: pointer; transition: background 0.18s, color 0.18s; }
        .habits-pill.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .habit-progress-card { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 18px; padding: 14px 16px; margin-bottom: 16px; }
        .habit-progress-label { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
        .habit-progress-track { width: 100%; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.6); overflow: hidden; }
        .habit-progress-fill { height: 100%; border-radius: 999px; background: var(--accent); transition: width 0.2s ease; }
        .habit-list { display: grid; gap: 12px; }
        .habit-row { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 18px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); }
        .habit-row.done { border-color: var(--accent); background: rgba(168,111,191,0.1); }
        .habit-row-meta { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
        .habit-info { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .habit-icon { width: 38px; height: 38px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; background: var(--header-bg); font-size: 18px; }
        .habit-name { font-family: 'Playfair Display', serif; font-size: 16px; color: var(--text-primary); }
        .habit-streak { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); }
        .habit-week-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
        .habit-day-button { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: none; background: transparent; cursor: pointer; min-width: 32px; min-height: 42px; padding: 6px 0; }
        .habit-day-button:disabled { opacity: 0.4; cursor: default; }
        .habit-day-label { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--text-secondary); }
        .habit-day-dot { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid var(--border); background: transparent; transition: transform 0.15s, background 0.15s, border-color 0.15s; }
        .habit-day-button.completed .habit-day-dot { background: var(--accent); border-color: transparent; }
        .habit-day-button.today .habit-day-dot { transform: scale(1.3); border-color: var(--accent); }
        .habit-day-button.today.completed .habit-day-dot { box-shadow: 0 0 0 4px rgba(168,111,191,0.15); }
        .habit-check { display: none; }
        .habits-manage .form-section { display: grid; gap: 12px; }
        .input-field { width: 100%; border-radius: 16px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 14px 16px; }
        .habit-schedule-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
        .habit-day-toggle { font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 12px 0; border-radius: 14px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; }
        .habit-day-toggle.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .habit-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 18px; border: 1.5px solid var(--border); background: var(--bg-card); }
        .habit-item-meta { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .habit-summary { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); }
        .habit-delete-btn { width: 36px; height: 36px; border: 1.5px solid var(--border); border-radius: 14px; background: transparent; color: var(--text-secondary); font-size: 18px; cursor: pointer; }
        .habit-empty { padding: 32px 0; text-align: center; color: var(--text-secondary); font-family: 'DM Sans', sans-serif; }
        .habit-empty-arrow { margin-top: 8px; font-size: 18px; }
        .pixels-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .pixels-title { font-family: 'Playfair Display', serif; font-size: 26px; color: var(--text-primary); }
        .pixels-sub { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
        .pixels-month-labels { display: none; }
        .pixels-grid { display: grid; gap: 6px; }
        .pixels-grid.year { grid-template-columns: 34px repeat(12, minmax(0, 1fr)); align-items: center; }
        .year-grid-label-header { width: 100%; height: 1px; }
        .year-grid-header-cell { font-family: 'DM Sans', sans-serif; font-size: 9px; text-transform: uppercase; color: var(--text-secondary); text-align: center; letter-spacing: 0.5px; }
        .year-grid-label { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--text-secondary); text-align: right; padding-right: 4px; }
        .year-grid-cell { display: flex; align-items: center; justify-content: center; min-height: 26px; }
        .pixels-grid.month, .pixels-grid.week { grid-template-columns: repeat(7, minmax(0, 1fr)); }
        .pixel-day { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .pixel-day.week .pixel-meta, .pixels-grid.month .pixel-meta { font-size: 11px; }
        .pixel-dot { width: var(--dot-size, 14px); height: var(--dot-size, 14px); border-radius: 50%; border: 1.5px solid var(--border); background: var(--pixel-future); box-shadow: 0 8px 18px rgba(0,0,0,0.08); transition: transform 0.2s, background 0.2s, border-color 0.2s; cursor: pointer; }
        .pixel-dot-button { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0; border: none; background: transparent; cursor: pointer; }
        .pixel-dot-button:disabled { cursor: default; }
        .pixels-grid.year .pixel-dot { --dot-size: 10px; }
        .pixels-grid.month .pixel-dot { --dot-size: 16px; }
        .pixels-grid.week .pixel-dot { --dot-size: 22px; }
        .pixel-dot.filled { background: var(--accent); border-color: transparent; }
        .pixel-day.today .pixel-dot { transform: scale(1.1); animation: pixel-pulse 1.8s ease-in-out infinite; }
        .pixel-meta { font-family: 'DM Sans', sans-serif; color: var(--text-secondary); text-align: center; line-height: 1.2; }
        .pixel-sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.28); display: flex; align-items: flex-end; justify-content: center; padding: 0 12px 12px; z-index: 40; }
        .pixel-sheet { width: 100%; max-width: 480px; background: var(--bg); border-radius: 24px 24px 14px 14px; padding: 16px 16px 24px; box-shadow: 0 32px 60px rgba(0,0,0,0.18); max-height: 80vh; overflow-y: auto; }
        .pixel-sheet-handle { width: 44px; height: 4px; background: var(--border); border-radius: 999px; margin: 0 auto 12px; }
        .pixel-sheet-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .pixel-sheet-title { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--text-primary); }
        .pixel-sheet-close { font-family: 'DM Sans', sans-serif; font-size: 12px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; }
        .pixel-sheet-empty { padding: 32px 0; text-align: center; }
        .pixel-sheet-empty .empty-icon { font-size: 40px; margin-bottom: 10px; }
        .pixel-sheet-empty .empty-title { font-family: 'Playfair Display', serif; font-size: 18px; color: var(--text-primary); }
        @keyframes pixel-pulse { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1.2); } }
        .chip.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .chip:active { transform: translateY(1px); }
        .content { flex: 1; padding: 0 24px calc(90px + env(safe-area-inset-bottom)); overflow-y: auto; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .header-actions { display: none; }
        .categories-btn,
        .theme-btn { font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 10px 14px; border-radius: 18px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; transition: transform 0.15s, background 0.15s; min-height: 44px; }
        .categories-btn:active,
        .theme-btn:active { transform: translateY(1px); background: var(--header-bg); }
        .bottom-tabs { position: fixed; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); background: var(--bg-card); border-top: 1px solid var(--border); padding: 8px 0 calc(8px + env(safe-area-inset-bottom)); z-index: 20; }
        .bottom-tab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: none; background: transparent; color: var(--text-secondary); font-family: 'DM Sans', sans-serif; font-size: 11px; padding: 8px 0 2px; cursor: pointer; transition: color 0.2s; }
        .bottom-tab.active { color: var(--accent); }
        .bottom-tab .tab-icon { font-size: 18px; line-height: 1; }
        .bottom-tab .tab-label { font-size: 11px; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .categories-btn,
        .theme-btn { font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 10px 14px; border-radius: 18px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; transition: transform 0.15s, background 0.15s; min-height: 44px; }
        .categories-btn:active,
        .theme-btn:active { transform: translateY(1px); background: var(--header-bg); }
        .manage-list { display: flex; flex-direction: column; gap: 12px; margin-top: 18px; }
        .category-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 14px; padding: 14px 16px; }
        .category-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .swatch { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border); }
        .category-details { min-width: 0; }
        .category-label { font-family: 'Playfair Display', serif; font-size: 15px; color: var(--text-primary); margin-bottom: 2px; }
        .category-count { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); letter-spacing: 0.4px; }
        .delete-btn { width: 38px; height: 38px; border-radius: 50%; border: none; background: rgba(255,255,255,0.18); color: var(--accent); font-size: 18px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: transform 0.15s; }
        .delete-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .delete-btn:active { transform: scale(0.96); }
        .manage-section { padding: 20px 0 0; }
        .settings-section { padding: 20px 0 0; }
        .settings-list { display: flex; flex-direction: column; gap: 12px; }
        .settings-row { width: 100%; text-align: left; background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 14px 16px; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text-primary); }
        .settings-row:hover { background: rgba(0,0,0,0.03); }
        .settings-row-title { font-family: 'Playfair Display', serif; font-size: 16px; }
        .settings-row-subtitle { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
        .settings-row-chevron { font-size: 18px; color: var(--text-secondary); }
        .settings-subscreen { display: flex; flex-direction: column; gap: 14px; }
        .settings-section { padding: 20px 0 0; }
        .section-header { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--text-primary); }
        .section-description { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
        .sleep-screen { display: flex; flex-direction: column; min-height: calc(100dvh - 160px - env(safe-area-inset-bottom)); gap: 14px; overflow-y: auto; }
        .sleep-top-bar { display: flex; justify-content: flex-end; gap: 10px; height: 50px; align-items: center; }
        .sleep-top-pill { font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 0.6px; padding: 10px 14px; height: 100%; border-radius: 999px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; transition: background 0.18s, color 0.18s, transform 0.18s; }
        .sleep-top-pill.active { background: rgba(255,255,255,0.9); color: var(--text-primary); border-color: var(--accent); }
        .sleep-dial-main { display: grid; grid-template-rows: 70px auto 80px minmax(120px, 1fr) 56px; gap: 14px; height: 100%; min-height: 0; padding-bottom: 120px; }
        .sleep-time-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: center; height: 70px; }
        .sleep-time-block { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 18px; padding: 16px; display: grid; gap: 6px; }
        .sleep-time-block.right { text-align: right; }
        .sleep-dial-container { display: flex; justify-content: center; align-items: center; }
        .sleep-dial-wrapper { width: 100%; max-width: 420px; aspect-ratio: 1 / 1; }
        .sleep-dial { position: relative; width: 100%; height: 100%; }
        .sleep-dial-markers { position: absolute; inset: 0; pointer-events: none; }
        .sleep-dial-marker { position: absolute; font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--text-secondary); white-space: nowrap; }
        .sleep-dial-marker.top { top: 6%; left: 50%; transform: translateX(-50%); }
        .sleep-dial-marker.right { right: 6%; top: 50%; transform: translateY(-50%); text-align: right; }
        .sleep-dial-marker.bottom { bottom: 6%; left: 50%; transform: translateX(-50%); }
        .sleep-dial-marker.left { left: 6%; top: 50%; transform: translateY(-50%); }
        .sleep-dial-tick { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: var(--text-secondary); }
        .sleep-dial-tick.tick-1 { right: 16%; top: 17%; transform: translate(50%, -50%); }
        .sleep-dial-tick.tick-2 { right: 17%; top: 32%; transform: translate(50%, -50%); }
        .sleep-dial-tick.tick-4 { right: 17%; bottom: 32%; transform: translate(50%, 50%); }
        .sleep-dial-tick.tick-5 { right: 16%; bottom: 17%; transform: translate(50%, 50%); }
        .sleep-dial-tick.tick-7 { left: 16%; bottom: 17%; transform: translate(-50%, 50%); }
        .sleep-dial-tick.tick-8 { left: 17%; bottom: 32%; transform: translate(-50%, 50%); }
        .sleep-dial-tick.tick-10 { left: 17%; top: 32%; transform: translate(-50%, -50%); }
        .sleep-dial-tick.tick-11 { left: 16%; top: 17%; transform: translate(-50%, -50%); }
        .sleep-arc-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .sleep-dial-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; pointer-events: none; text-align: center; }
        .sleep-dial-label { font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); }
        .sleep-dial-duration { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: var(--text-primary); }
        .sleep-dial-emoji { font-size: 24px; }
        .sleep-handle { position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--bg); background: var(--bg-card); color: var(--text-primary); display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); box-shadow: 0 12px 24px rgba(0,0,0,0.12); cursor: grab; }
        .sleep-handle.active { box-shadow: 0 14px 28px rgba(0,0,0,0.18); }
        .sleep-handle.bedtime, .sleep-handle.wake { background: rgba(255,255,255,0.95); }
        .sleep-mood-row { display: grid; gap: 12px; min-height: 80px; }
        .sleep-mood-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); }
        .sleep-mood-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
        .sleep-mood-button { font-size: 20px; width: 100%; aspect-ratio: 1; border-radius: 16px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; }
        .sleep-mood-button.selected { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .sleep-note-row { min-height: 120px; }
        .sleep-note { width: 100%; min-height: 120px; border-radius: 18px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 14px; resize: none; }
        .sleep-submit-button { align-self: stretch; }
        .sleep-panel { width: 100%; height: 100%; min-height: 0; }
        .back-btn-panel { margin-bottom: 0; }
        .sleep-stats-hero { padding: 18px 0 16px; text-align: center; }
        .sleep-stats-hero-label { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .sleep-stats-hero-value { font-family: 'Playfair Display', serif; font-size: 42px; color: var(--text-primary); line-height: 1; }
        .sleep-bar-chart { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; align-items: end; margin: 18px 0; padding: 0 2px; }
        .sleep-bar-column { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .sleep-bar { width: 100%; border-radius: 999px 999px 0 0; background: var(--accent); transition: height 0.25s ease; }
        .sleep-bar.ghost { background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6); }
        .sleep-bar-label { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--text-secondary); }
        .sleep-stats-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
        .sleep-stat-pill { padding: 14px 16px; border-radius: 18px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); display: flex; flex-direction: column; gap: 8px; }
        .sleep-stat-pill strong { font-family: 'Playfair Display', serif; font-size: 18px; color: var(--text-primary); }
        .sleep-stats-message { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); text-align: center; padding: 12px 0 4px; }
        .sleep-history-list { display: grid; gap: 10px; padding-bottom: 18px; }
        .sleep-history-row { width: 100%; text-align: left; background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 12px 14px; display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; color: var(--text-primary); cursor: pointer; }
        .sleep-history-row:hover { background: rgba(255,255,255,0.9); }
        .sleep-history-date { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-primary); }
        .sleep-history-duration { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); }
        .sleep-history-emoji { font-size: 16px; }
        .sleep-history-empty { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-secondary); text-align: center; padding: 28px 0; }
        .sleep-entry-card { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 20px; padding: 16px; }
        .sleep-entry-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
        .sleep-entry-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); margin-bottom: 6px; }
        .sleep-entry-date { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); }
        .sleep-entry-duration { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--text-primary); text-align: right; min-width: 88px; }
        .sleep-entry-body { display: grid; gap: 12px; }
        .sleep-entry-main { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .sleep-entry-timeline { display: inline-flex; align-items: center; gap: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-primary); }
        .sleep-entry-time { font-weight: 600; }
        .sleep-entry-quality { display: inline-flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px; border: 1px solid var(--border); background: rgba(255,255,255,0.18); color: var(--text-secondary); font-family: 'DM Sans', sans-serif; font-size: 12px; }
        .sleep-entry-emoji { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--accent); color: var(--bg); font-size: 18px; }
        .sleep-entry-subtext { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); }
        .emoji-grid, .color-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
        .emoji-picker-button { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 18px 16px; border-radius: 18px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; transition: border-color 0.15s, background 0.15s; text-align: center; }
        .emoji-picker-value { font-size: 36px; line-height: 1; }
        .emoji-picker-label { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; }
        .form-help { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); margin-top: 4px; margin-bottom: 10px; }
        .emoji-item, .color-swatch-item { border-radius: 12px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s, border-color 0.15s, background 0.15s; }
        .emoji-item { font-size: 18px; background: var(--bg-card); border: 1.5px solid var(--border); color: var(--text-primary); }
        .emoji-item.selected { border-color: var(--accent); background: var(--header-bg); }
        .emoji-item:active, .color-swatch-item:active { transform: translateY(1px); }
        .color-swatch-item { width: 100%; min-height: 44px; border: 2px solid transparent; }
        .color-swatch-item.selected { border-color: var(--accent); }
        .form-note { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); margin-top: 10px; }
        .btn-primary { width: 100%; padding: 15px; background: var(--accent); color: var(--bg); border: none; border-radius: 12px; font-family: 'Playfair Display', serif; font-size: 16px; cursor: pointer; transition: opacity 0.15s; letter-spacing: 0.3px; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:active { opacity: 0.8; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .date-block { margin-bottom: 20px; }
        .date-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 0 8px; }
        .date-heading { font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 1px; color: var(--text-secondary); text-transform: uppercase; }
        .date-sleep-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--bg-card); font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); }
        .date-sleep-chip span { font-size: 14px; }
        .header-streak { font-family: 'DM Sans', sans-serif; font-size: 11px; color: var(--text-secondary); margin-top: 6px; }
        .entry-card { background: var(--bg-card); border-radius: 18px; margin-bottom: 12px; border: 1.5px solid var(--border); overflow: hidden; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .entry-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .hero-card { padding: 0; }
        .hero-card .card-body { padding: 18px 18px 20px; }
        .hero-card .card-title { font-size: 20px; }
        .compact-card { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .compact-card-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .compact-card-icon { font-size: 18px; }
        .compact-card-title { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-primary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .compact-card-time { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
        .compact-card .card-cat { margin-bottom: 0; }
        .card-photo { width: 100%; height: 180px; object-fit: cover; display: block; }
        .card-body { padding: 14px 16px; }
        .card-cat { display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
        .cat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; line-height: 1.3; }
        .card-note { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-time { font-family: 'DM Sans', sans-serif; font-size: 11px; color: var(--text-secondary); margin-top: 8px; }
        .entry-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .card-photo { width: 100%; height: 180px; object-fit: cover; display: block; }
        .card-body { padding: 14px 16px; }
        .card-cat { display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
        .cat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; line-height: 1.3; }
        .card-note { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-time { font-family: 'DM Sans', sans-serif; font-size: 11px; color: var(--text-secondary); margin-top: 8px; }
        .fab { position: fixed; bottom: calc(80px + env(safe-area-inset-bottom) + 16px); right: calc(50% - 240px + 24px); width: 52px; height: 52px; border-radius: 50%; background: var(--accent); color: var(--bg); border: none; font-size: 24px; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.18); transition: transform 0.15s; display: flex; align-items: center; justify-content: center; z-index: 20; }
        .fab:hover { transform: scale(1.08); }
        .add-form { padding: 20px 24px; flex: 1; overflow-y: auto; }
        .form-section { margin-bottom: 22px; }
        .form-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 8px; display: block; font-weight: 500; }
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .cat-item { padding: 10px 6px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg-card); cursor: pointer; text-align: center; transition: all 0.15s; }
        .cat-item.selected { border-color: var(--accent); background: var(--accent); }
        .cat-item .icon { font-size: 20px; display: block; margin-bottom: 3px; }
        .cat-item .name { font-family: 'DM Sans', sans-serif; font-size: 9px; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
        .cat-item.selected .name { color: var(--bg); }
        .input { width: 100%; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 15px; background: var(--bg-card); color: var(--text-primary); outline: none; transition: border-color 0.15s; }
        .input:focus { border-color: var(--accent); }
        .textarea { width: 100%; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; background: var(--bg-card); color: var(--text-primary); outline: none; resize: none; transition: border-color 0.15s; line-height: 1.6; min-height: 100px; }
        .textarea:focus { border-color: var(--accent); }
        .photo-upload { border: 2px dashed var(--border); border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.65); transition: background 0.15s; }
        .photo-upload:hover { background: rgba(255,255,255,0.85); }
        .photo-preview { width: 100%; border-radius: 12px; overflow: hidden; position: relative; }
        .photo-preview img { width: 100%; max-height: 200px; object-fit: cover; display: block; }
        .photo-remove { position: absolute; top: 8px; right: 8px; background: rgba(42,32,22,0.7); color: #fff; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .btn-primary { width: 100%; padding: 15px; background: var(--accent); color: var(--bg); border: none; border-radius: 12px; font-family: 'Playfair Display', serif; font-size: 16px; cursor: pointer; transition: opacity 0.15s; letter-spacing: 0.3px; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:active { opacity: 0.8; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .back-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 4px; margin-bottom: 18px; }
        .detail-view { padding: 20px 24px; flex: 1; overflow-y: auto; }
        .detail-photo { width: 100%; max-height: 300px; object-fit: cover; border-radius: 14px; margin-bottom: 20px; }
        .detail-cat-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
        .detail-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: var(--text-primary); line-height: 1.2; margin-bottom: 8px; }
        .detail-time { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-secondary); margin-bottom: 20px; }
        .detail-divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
        .detail-note-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 10px; font-weight: 500; }
        .detail-note { font-family: 'Georgia', serif; font-size: 15px; line-height: 1.8; color: var(--text-primary); }
        .empty { padding: 60px 24px; text-align: center; }
        .empty-hero { position: relative; min-height: calc(100vh - 200px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px 140px; text-align: center; border-radius: 28px; overflow: hidden; background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.84)), linear-gradient(180deg, var(--accent), rgba(255,255,255,0.45)); }
        .empty-hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at top, rgba(255,255,255,0.45), transparent 40%), radial-gradient(circle at bottom, rgba(255,255,255,0.28), transparent 35%); pointer-events: none; }
        .empty-noise-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.12; }
        .empty-headline { font-family: 'Playfair Display', serif; font-size: 32px; color: var(--text-primary); line-height: 1.05; margin-bottom: 16px; max-width: 88%; }
        .empty-subline { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-secondary); max-width: 78%; line-height: 1.8; }
        .empty-suggestions { position: absolute; left: 50%; bottom: calc(90px + env(safe-area-inset-bottom) + 16px); transform: translateX(-50%); display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; width: min(100%, 440px); padding: 0 12px; }
        .empty-pill { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.7); background: rgba(255,255,255,0.58); backdrop-filter: blur(8px); color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: transform 0.15s, background 0.15s; }
        .empty-pill:hover { transform: translateY(-2px); background: rgba(255,255,255,0.82); }
        .empty-pill:nth-child(1) { animation: float-pill 5s ease-in-out infinite 0s; }
        .empty-pill:nth-child(2) { animation: float-pill 5s ease-in-out infinite 0.6s; }
        .empty-pill:nth-child(3) { animation: float-pill 5s ease-in-out infinite 1.2s; }
        @keyframes float-pill { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .fab.empty-pulse { overflow: visible; }
        .fab.empty-pulse::before { content: ""; position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 0 0 rgba(255,255,255,0.45); animation: fab-pulse 2s ease-out infinite; z-index: -1; }
        @keyframes fab-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.45); } 100% { box-shadow: 0 0 0 30px rgba(255,255,255,0); } }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--text-primary); margin-bottom: 8px; }
        .empty-sub { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        .calendar-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 0 12px; }
        .calendar-header button { font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 10px 14px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); cursor: pointer; min-height: 44px; transition: transform 0.15s, background 0.15s; }
        .calendar-header button:active { transform: translateY(1px); background: var(--header-bg); }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
        .calendar-day { min-height: 96px; padding: 12px 10px; border-radius: 16px; border: 1.5px solid transparent; background: var(--bg-card); color: var(--text-primary); display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.15s; }
        .calendar-day.inactive { opacity: 0.35; }
        .calendar-day:hover { transform: translateY(-1px); }
        .calendar-day.active { border-color: var(--accent); }
        .calendar-day-number { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .calendar-dot { width: 8px; height: 8px; border-radius: 50%; margin: 0 auto; }
        .calendar-weekday { font-family: 'DM Sans', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); text-align: center; padding-bottom: 8px; }
        .calendar-day-detail { margin-top: 18px; display: flex; flex-direction: column; gap: 12px; }
        .calendar-detail-header { font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 8px; color: var(--text-primary); }
        .calendar-empty { padding: 40px 0; text-align: center; }
        .calendar-empty-icon { font-size: 42px; margin-bottom: 14px; }
        .calendar-empty-title { font-family: 'Playfair Display', serif; font-size: 18px; color: var(--text-primary); margin-bottom: 8px; }
        .calendar-empty-sub { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        .theme-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 30; padding: 20px; }
        .theme-panel { width: min(420px, 100%); background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); position: relative; }
        .theme-panel h3 { font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 14px; color: var(--text-primary); }
        .theme-panel p { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; }
        .theme-swatch-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
        .theme-swatch { width: 56px; height: 56px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.15s, border-color 0.15s; }
        .theme-swatch.selected { transform: scale(1.05); border-color: var(--accent); }
        .theme-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer; }
        @media (max-width: 480px) { .fab { right: 24px; } }
      `}</style>

      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div>
              <div className="header-title">Life Tracker</div>
              <div className="header-sub">{todayLabel}</div>
              {view === "journal" && entries.length > 0 && (
                <button
                  type="button"
                  className={`year-view-pill ${journalYearMode ? "active" : ""}`}
                  onClick={() => setJournalYearMode((prev) => !prev)}
                >
                  📅 Year view
                </button>
              )}
              {currentStreak > 1 && <div className="header-streak">🔥 {currentStreak} day streak</div>}
            </div>
          </div>
        </div>

        {/* FILTER CHIPS */}
        {view === "journal" && entries.length > 0 && (
          <div className="filter-bar">
            <button
              type="button"
              className={`chip ${filterCat === "all" ? "active" : ""}`}
              onClick={() => setFilterCat("all")}
            >
              All
            </button>
            {activeCategoryChips.map((c) => (
              <button
                key={c.id}
                className={`chip ${filterCat === c.id ? "active" : ""}`}
                onClick={() => setFilterCat(filterCat === c.id ? "all" : c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        )}

        {/* JOURNAL VIEW */}
        {view === "journal" && !journalYearMode && (
          <div className="content">
            {filtered.length === 0 ? (
              <div className="empty empty-hero">
                <svg className="empty-noise-svg" aria-hidden="true">
                  <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
                  </filter>
                  <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="0.08" />
                </svg>
                <div>
                  <div className="empty-headline">Your story starts here</div>
                  <div className="empty-subline">Every great story begins with a single moment</div>
                </div>
                <div className="empty-suggestions">
                  {suggestionCategories.map((cat) => (
                    <button key={cat.id} type="button" className="empty-pill" onClick={() => openAddForCategory(cat.id)}>
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([date, dayEntries]) => {
                const sleepEntry = sleepSummaryByDate[date];
                const dayEntriesWithoutSleep = dayEntries.filter((entry) => entry.category !== "sleep");
                const heroEntry = dayEntriesWithoutSleep[0];
                const compactEntries = dayEntriesWithoutSleep.slice(1);
                return (
                  <div key={date} className="date-block">
                    <div className="date-header">
                      <div>
                        <div className="date-heading">{date}</div>
                        {sleepEntry && (
                          <div className="date-sleep-chip">
                            <span>{sleepEntry.sleep?.mood || "😴"}</span>
                            {Math.floor((sleepEntry.sleep?.duration || 0) / 60)}h {String((sleepEntry.sleep?.duration || 0) % 60).padStart(2, "0")}m
                          </div>
                        )}
                      </div>
                    </div>
                    {heroEntry && (
                      <div className="entry-card hero-card" onClick={() => { setSelectedEntry(heroEntry); setView("detail"); }}>
                        {heroEntry.photo && <img src={heroEntry.photo} alt="" className="card-photo" />}
                        <div className="card-body">
                          <div className="card-cat">
                            <span className="cat-dot" style={{ background: getCat(heroEntry.category).color, border: "1.5px solid var(--border)" }} />
                            {getCat(heroEntry.category).icon} {getCat(heroEntry.category).label}
                          </div>
                          <div className="card-title">{heroEntry.title}</div>
                          <div className="card-time">{formatTime(heroEntry.timestamp)}</div>
                        </div>
                      </div>
                    )}
                    {compactEntries.map((entry) => {
                      const cat = getCat(entry.category);
                      return (
                        <div key={entry.id} className="entry-card compact-card" onClick={() => { setSelectedEntry(entry); setView("detail"); }}>
                          <div className="compact-card-row">
                            <span className="compact-card-icon" style={{ color: cat.color }}>{cat.icon}</span>
                            <span className="compact-card-title">{entry.title}</span>
                          </div>
                          <span className="compact-card-time">{formatTime(entry.timestamp)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === "sleep" && (
          <div className="content">
            <button className="back-btn" onClick={() => setView("journal")}>← Back</button>
            <div className="sleep-screen">
              <div className="sleep-top-bar">
                <button type="button" className={`sleep-top-pill ${sleepSubView === "stats" ? "active" : ""}`} onClick={() => setSleepSubView("stats")}>📊 Stats</button>
                <button type="button" className={`sleep-top-pill ${sleepSubView === "history" ? "active" : ""}`} onClick={() => setSleepSubView("history")}>📋 History</button>
              </div>

              {sleepSubView === "dial" && (
                <div className="sleep-dial-main">
                  <div className="sleep-time-row">
                    <div className="sleep-time-block">
                      <div className="sleep-label">BEDTIME</div>
                      <div className="sleep-value">{Math.floor(sleepForm.bedtime / 60) || 12}:{String(sleepForm.bedtime % 60).padStart(2, "0")} {sleepForm.bedtime < 720 ? "AM" : "PM"}</div>
                    </div>
                    <div className="sleep-time-block right">
                      <div className="sleep-label">WAKE UP</div>
                      <div className="sleep-value">{Math.floor(sleepForm.wake / 60) % 12 || 12}:{String(sleepForm.wake % 60).padStart(2, "0")} {sleepForm.wake < 720 ? "AM" : "PM"}</div>
                    </div>
                  </div>

                  <div className="sleep-dial-container">
                    <div className="sleep-dial-wrapper" style={{ width: `${dialSize}px`, height: `${dialSize}px` }}>
                      <div className="sleep-dial" ref={dialRef}>
                        <svg width={dialSize} height={dialSize} viewBox="0 0 100 100" className="sleep-arc-svg">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                          <path d={clockArcPath()} stroke="var(--accent)" strokeWidth="8" fill="none" strokeLinecap="round" />
                        </svg>
                        <div className="sleep-dial-markers">
                          <span className="sleep-dial-marker top">12</span>
                          <span className="sleep-dial-marker right">3</span>
                          <span className="sleep-dial-marker bottom">6</span>
                          <span className="sleep-dial-marker left">9</span>
                          <span className="sleep-dial-tick tick-1" />
                          <span className="sleep-dial-tick tick-2" />
                          <span className="sleep-dial-tick tick-4" />
                          <span className="sleep-dial-tick tick-5" />
                          <span className="sleep-dial-tick tick-7" />
                          <span className="sleep-dial-tick tick-8" />
                          <span className="sleep-dial-tick tick-10" />
                          <span className="sleep-dial-tick tick-11" />
                        </div>
                        <div className="sleep-dial-center">
                          <div className="sleep-dial-label">SLEEP</div>
                          <div className="sleep-dial-duration">{formatSleepDuration()}</div>
                          <div className="sleep-dial-emoji">{sleepForm.mood}</div>
                        </div>
                        {['bedtime', 'wake'].map((handle) => {
                          const minutes = sleepForm[handle];
                          const pos = getHandlePosition(minutes);
                          const label = handle === 'bedtime' ? '🌙' : '☀️';
                          return (
                            <button
                              key={handle}
                              type="button"
                              className={`sleep-handle ${handle} ${draggingHandle === handle ? 'active' : ''}`}
                              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                              onMouseDown={(event) => startHandleDrag(handle, event)}
                              onTouchStart={(event) => startHandleDrag(handle, event)}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="sleep-mood-row">
                    <div className="sleep-mood-label">SLEEP QUALITY</div>
                    <div className="sleep-mood-grid">
                      {["😴", "😪", "😐", "🙂", "😁"].map((mood) => (
                        <button key={mood} type="button" className={`sleep-mood-button ${sleepForm.mood === mood ? "selected" : ""}`} onClick={() => setSleepForm((f) => ({ ...f, mood }))}>
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sleep-note-row">
                    <textarea className="textarea sleep-note" placeholder="How was your sleep?" value={sleepForm.note} onChange={(e) => setSleepForm((f) => ({ ...f, note: e.target.value }))} rows={4} />
                  </div>

                  <button className="btn-primary sleep-submit-button" type="button" onClick={saveSleepEntry}>
                    Log Sleep
                  </button>
                </div>
              )}

              {sleepSubView === "stats" && (
                <div className="sleep-panel sleep-panel-stats">
                  <button className="back-btn back-btn-panel" type="button" onClick={() => setSleepSubView("dial")}>← Back</button>
                  <div className="sleep-stats-hero">
                    <div className="sleep-stats-hero-label">Avg sleep this week</div>
                    <div className="sleep-stats-hero-value">{formatHours(averageSleepThisWeek)}</div>
                  </div>
                  <div className="sleep-bar-chart">
                    {sleepLast7Days.map((day) => {
                      const duration = day.entry?.sleep?.duration || 0;
                      const scale = Math.max(...sleepDurations, 480) || 480;
                      const height = Math.round((duration / scale) * 100);
                      return (
                        <div key={day.key} className="sleep-bar-column">
                          <div className={`sleep-bar ${duration > 0 ? "filled" : "ghost"}`} style={{ height: `${Math.max(height, duration > 0 ? 12 : 8)}%` }} />
                          <div className="sleep-bar-label">{day.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="sleep-stats-row">
                    <div className="sleep-stat-pill">
                      <div>Best night</div>
                      <strong>{formatHours(bestSleep)}</strong>
                    </div>
                    <div className="sleep-stat-pill">
                      <div>This week</div>
                      <strong>{formatHours(totalSleepThisWeek)}</strong>
                    </div>
                  </div>
                  {sleepEntryCount < 2 && (
                    <div className="sleep-stats-message">Log a few nights to see your patterns</div>
                  )}
                </div>
              )}

              {sleepSubView === "history" && (
                <div className="sleep-panel sleep-panel-history">
                  <button className="back-btn back-btn-panel" type="button" onClick={() => setSleepSubView("dial")}>← Back</button>
                  {sleepEntries.length === 0 ? (
                    <div className="sleep-history-empty">No sleep logged yet</div>
                  ) : (
                    <div className="sleep-history-list">
                      {sleepEntries.map((entry) => (
                        <button key={entry.id} type="button" className="sleep-history-row" onClick={() => { setSelectedEntry(entry); setView("detail"); }}>
                          <span className="sleep-history-date">{formatDate(entry.timestamp)}</span>
                          <span className="sleep-history-duration">{formatHours(entry.sleep?.duration || 0)}</span>
                          <span className="sleep-history-emoji">{entry.sleep?.mood || "😴"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "habits" && (
          <div className="content">
            <div className="habits-pill-row">
              <button type="button" className={`habits-pill ${habitsSubView === "today" ? "active" : ""}`} onClick={() => setHabitsSubView("today")}>Today</button>
              <button type="button" className={`habits-pill ${habitsSubView === "manage" ? "active" : ""}`} onClick={() => setHabitsSubView("manage")}>Manage</button>
            </div>

            {habitsSubView === "today" ? (
              <div className="habits-today">
                <div className="habit-progress-card">
                  <div className="habit-progress-label">{completedHabitsCount} of {habits.length} done</div>
                  <div className="habit-progress-track">
                    <div className="habit-progress-fill" style={{ width: habits.length ? `${Math.round((completedHabitsCount / habits.length) * 100)}%` : "0%" }} />
                  </div>
                </div>
                {habits.length === 0 ? (
                  <div className="habit-empty">
                    <div>Add your first habit below</div>
                    <div className="habit-empty-arrow">⬇️</div>
                  </div>
                ) : (
                  <div className="habit-list">
                    {habits.map((habit) => {
                      const done = currentHabitDone.has(habit.id);
                      return (
                        <div key={habit.id} className={`habit-row ${done ? "done" : ""}`}>
                          <div className="habit-row-meta">
                            <div className="habit-icon">{habit.emoji}</div>
                            <div className="habit-info">
                              <div className="habit-name">{habit.name}</div>
                              <div className="habit-week-strip">
                                {currentWeekDays.map((day) => {
                                  const completed = (habitCompletions[day.key] || []).includes(habit.id);
                                  return (
                                    <button
                                      key={day.key}
                                      type="button"
                                      className={`habit-day-button ${completed ? "completed" : ""} ${day.isToday ? "today" : ""}`}
                                      onClick={() => !day.isFuture && toggleHabitCompletion(habit.id, day.key)}
                                      disabled={day.isFuture}
                                    >
                                      <span className="habit-day-label">{day.label}</span>
                                      <span className="habit-day-dot" />
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="habit-streak">🔥 {getHabitStreak(habit)} days</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="habits-manage">
                <div className="form-section">
                  <span className="form-label">Habit name</span>
                  <input className="input-field" type="text" placeholder="What habit do you want?" value={habitForm.name} onChange={(e) => setHabitForm((prev) => ({ ...prev, name: e.target.value }))} />
                  <span className="form-label">Emoji</span>
                  <button type="button" className="emoji-picker-button" onClick={() => setHabitEmojiSheetOpen(true)}>
                    <span className="emoji-picker-value">{habitForm.emoji}</span>
                    <span className="emoji-picker-label">Tap to change icon</span>
                  </button>
                  <span className="form-label">Days</span>
                  <div className="form-help">Tap days you want to track this habit.</div>
                  <div className="habit-schedule-row">
                    {HABIT_WEEKDAYS.map((day) => (
                      <button key={day} type="button" className={`habit-day-toggle ${habitForm.schedule.includes(day) ? "active" : ""}`} onClick={() => toggleHabitScheduleDay(day)}>
                        {day.slice(0, 1)}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="btn-primary" onClick={addHabit}>Add Habit</button>
                </div>
                <div className="habit-list manage-list">
                  {habits.length === 0 ? (
                    <div className="habit-empty">No habits yet — add one to get started.</div>
                  ) : (
                    habits.map((habit) => (
                      <div key={habit.id} className="habit-item">
                        <div className="habit-item-meta">
                          <span className="habit-icon">{habit.emoji}</span>
                          <div>
                            <div className="habit-name">{habit.name}</div>
                            <div className="habit-summary">{formatHabitSchedule(habit.schedule)}</div>
                          </div>
                        </div>
                        <button type="button" className="habit-delete-btn" onClick={() => removeHabit(habit.id)}>×</button>
                      </div>
                    ))
                  )}
                </div>
                {habitEmojiSheetOpen && (
                  <div className="pixel-sheet-overlay" onClick={() => setHabitEmojiSheetOpen(false)}>
                    <div className="pixel-sheet" onClick={(e) => e.stopPropagation()}>
                      <div className="pixel-sheet-handle" />
                      <div className="pixel-sheet-header">
                        <div className="pixel-sheet-title">Choose an icon</div>
                        <button type="button" className="pixel-sheet-close" onClick={() => setHabitEmojiSheetOpen(false)}>Close</button>
                      </div>
                      <div className="emoji-grid">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className={`emoji-item ${habitForm.emoji === emoji ? "selected" : ""}`}
                            onClick={() => {
                              setHabitForm((prev) => ({ ...prev, emoji }));
                              setHabitEmojiSheetOpen(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === "calendar" && (
          <div className="content">
            <div className="calendar-header">
              <button type="button" onClick={setCalendarPrev}>←</button>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--text-primary)" }}>{monthLabel}</div>
              <button type="button" onClick={setCalendarNext}>→</button>
            </div>
            <div className="calendar-grid">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
              {calendarWeeks.flat().map((date) => {
                const key = formatDateKey(date);
                const hasEntries = calendarMap[key]?.length > 0;
                const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                const todayClass = calendarDay === key ? 'active' : '';
                const dotColor = hasEntries ? getCat(calendarMap[key][0].category).color : 'transparent';
                return (
                  <button
                    key={key}
                    type="button"
                    className={`calendar-day ${!isCurrentMonth ? 'inactive' : ''} ${todayClass}`}
                    onClick={() => openDayDetail(key)}
                  >
                    <div className="calendar-day-number">{date.getDate()}</div>
                    <div className="calendar-dot" style={{ background: dotColor }} />
                  </button>
                );
              })}
            </div>

            {calendarDay && (
              <div className="calendar-day-detail">
                <div className="calendar-detail-header">{new Date(calendarDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                {dayEntries.length === 0 ? (
                  <div className="calendar-empty">
                    <div className="calendar-empty-icon">📭</div>
                    <div className="calendar-empty-title">No moments here yet</div>
                    <div className="calendar-empty-sub">Tap another day or add a new entry to capture your next moment.</div>
                  </div>
                ) : (
                  dayEntries.map((entry) => {
                    const cat = getCat(entry.category);
                    return (
                      <div key={entry.id} className={`entry-card ${entry.category === "sleep" ? "sleep-entry-card" : ""}`} onClick={() => { setSelectedEntry(entry); setView('detail'); }}>
                        {entry.category === "sleep" ? (
                          <>
                            <div className="sleep-entry-header">
                              <div>
                                <div className="sleep-entry-label">Sleep entry</div>
                                <div className="sleep-entry-date">{formatDate(entry.timestamp)}</div>
                              </div>
                              <div className="sleep-entry-duration">
                                {Math.floor((entry.sleep?.duration || 0) / 60)}h {String((entry.sleep?.duration || 0) % 60).padStart(2, '0')}m
                              </div>
                            </div>
                            <div className="sleep-entry-body">
                              <div className="sleep-entry-main">
                                <div className="sleep-entry-timeline">
                                  <span className="sleep-entry-time">{formatTime(entry.sleep?.bedtime)}</span>
                                  <span>→</span>
                                  <span className="sleep-entry-time">{formatTime(entry.sleep?.wake)}</span>
                                </div>
                                <div className="sleep-entry-quality">
                                  <span className="sleep-entry-emoji">{entry.sleep?.mood || "😴"}</span>
                                  <span>Sleep quality</span>
                                </div>
                              </div>
                              <div className="sleep-entry-subtext">Tap to open full sleep details.</div>
                            </div>
                          </>
                        ) : (
                          <>
                            {entry.photo && <img src={entry.photo} alt="" className="card-photo" />}
                            <div className="card-body">
                              <div className="card-cat">
                                <span className="cat-dot" style={{ background: cat.color, border: '1.5px solid var(--border)' }} />
                                {cat.icon} {cat.label}
                              </div>
                              <div className="card-title">{entry.title}</div>
                              {entry.note && <div className="card-note">{entry.note}</div>}
                              <div className="card-time">{formatTime(entry.timestamp)}</div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
                <button className="back-btn" type="button" onClick={closeDayDetail}>← Close day</button>
              </div>
            )}
          </div>
        )}

        {(view === "pixels" || (view === "journal" && journalYearMode)) && (
          <div className="content">
            <div className="pixels-header">
              <div>
                <div className="pixels-title">{currentYear}</div>
                <div className="pixels-sub">{daysPassed} of {yearDays.length} days</div>
              </div>
            </div>

            <div className="pixel-filter-bar">
              {[
                { id: "year", label: "Year" },
                { id: "month", label: "Month" },
                { id: "week", label: "Week" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`pixel-filter-btn ${pixelFilter === filter.id ? "active" : ""}`}
                  onClick={() => setPixelFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className={`pixels-grid ${pixelFilter}`}>
              {pixelFilter === "year" ? (
                [
                  <span key="year-header-empty" className="year-grid-label-header" />,
                  ...monthLabels.map((label) => (
                    <span key={`header-${label}`} className="year-grid-header-cell">{label}</span>
                  )),
                  ...Array.from({ length: 31 }, (_, index) => index + 1).flatMap((dayNumber) => [
                    <span key={`label-${dayNumber}`} className="year-grid-label">{dayNumber}</span>,
                    ...monthLabels.map((monthLabel, monthIndex) => {
                      const date = new Date(currentYear, monthIndex, dayNumber);
                      const valid = date.getMonth() === monthIndex && date.getDate() === dayNumber;
                      const dateKey = valid ? formatDateKey(date) : null;
                      const isPastOrToday = valid && dateKey <= todayKey;
                      const isToday = valid && dateKey === todayKey;
                      return (
                        <div key={`cell-${monthIndex}-${dayNumber}`} className="year-grid-cell">
                          {valid ? (
                            <button
                              type="button"
                              className="pixel-dot-button"
                              onClick={() => isPastOrToday && setPixelSelectedDate(dateKey)}
                              disabled={!isPastOrToday}
                              aria-label={dateKey}
                            >
                              <span
                                className={`pixel-dot ${isPastOrToday ? "filled" : ""} ${isToday ? "today" : ""}`}
                              />
                            </button>
                          ) : null}
                        </div>
                      );
                    }),
                  ])
                ]
              ) : (
                (pixelFilter === "month" ? monthDays : weekDays).map((date) => {
                  const dateKey = formatDateKey(date);
                  const isPastOrToday = dateKey <= todayKey;
                  const isToday = dateKey === todayKey;
                  const dayLabel = pixelFilter === "week"
                    ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                    : date.toLocaleDateString("en-US", { weekday: "short" });
                  return (
                    <div key={dateKey} className={`pixel-day ${isToday ? "today" : ""} ${pixelFilter}`}>
                      <button
                        type="button"
                        className="pixel-dot-button"
                        onClick={() => isPastOrToday && setPixelSelectedDate(dateKey)}
                        disabled={!isPastOrToday}
                        aria-label={dateKey}
                      >
                        <span className={`pixel-dot ${isPastOrToday ? "filled" : ""} ${isToday ? "today" : ""}`} />
                      </button>
                      <span className="pixel-meta">{dayLabel}</span>
                    </div>
                  );
                })
              )}
            </div>

            {pixelSelectedDate && (
              <div className="pixel-sheet-overlay" onClick={() => setPixelSelectedDate(null)}>
                <div className="pixel-sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="pixel-sheet-handle" />
                  <div className="pixel-sheet-header">
                    <div className="pixel-sheet-title">{new Date(pixelSelectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
                    <button type="button" className="pixel-sheet-close" onClick={() => setPixelSelectedDate(null)}>Close</button>
                  </div>
                  {pixelSelectedEntries.length === 0 ? (
                    <div className="pixel-sheet-empty">
                      <div className="empty-icon">📭</div>
                      <div className="empty-title">Nothing logged</div>
                    </div>
                  ) : (
                    pixelSelectedEntries.map((entry) => {
                      const cat = getCat(entry.category);
                      return (
                        <div key={entry.id} className={`entry-card ${entry.category === "sleep" ? "sleep-entry-card" : ""}`}>
                          {entry.category === "sleep" ? (
                            <>
                              <div className="sleep-entry-header">
                                <div>
                                  <div className="sleep-entry-label">Sleep entry</div>
                                  <div className="sleep-entry-date">{formatDate(entry.timestamp)}</div>
                                </div>
                                <div className="sleep-entry-duration">
                                  {Math.floor((entry.sleep?.duration || 0) / 60)}h {String((entry.sleep?.duration || 0) % 60).padStart(2, "0")}m
                                </div>
                              </div>
                              <div className="sleep-entry-body">
                                <div className="sleep-entry-main">
                                  <div className="sleep-entry-timeline">
                                    <span className="sleep-entry-time">{formatTime(entry.sleep?.bedtime)}</span>
                                    <span>→</span>
                                    <span className="sleep-entry-time">{formatTime(entry.sleep?.wake)}</span>
                                  </div>
                                  <div className="sleep-entry-quality">
                                    <span className="sleep-entry-emoji">{entry.sleep?.mood || "😴"}</span>
                                    <span>Sleep quality</span>
                                  </div>
                                </div>
                                <div className="sleep-entry-subtext">Tap to open full sleep details.</div>
                              </div>
                            </>
                          ) : (
                            <>
                              {entry.photo && <img src={entry.photo} alt="" className="card-photo" />}
                              <div className="card-body">
                                <div className="card-cat">
                                  <span className="cat-dot" style={{ background: cat.color, border: "1.5px solid var(--border)" }} />
                                  {cat.icon} {cat.label}
                                </div>
                                <div className="card-title">{entry.title}</div>
                                {entry.note && <div className="card-note">{entry.note}</div>}
                                <div className="card-time">{formatTime(entry.timestamp)}</div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "settings" && (
          <div className="content">
            {settingsSubView === "home" && (
              <div className="settings-list">
                <button type="button" className="settings-row" onClick={() => setSettingsSubView("theme")}>
                  <div>
                    <div className="settings-row-title">🎨 Theme</div>
                    <div className="settings-row-subtitle">Customise your app's look</div>
                  </div>
                  <div className="settings-row-chevron">→</div>
                </button>
                <button type="button" className="settings-row" onClick={() => setSettingsSubView("categories")}>
                  <div>
                    <div className="settings-row-title">🗂️ Categories</div>
                    <div className="settings-row-subtitle">Add and remove categories</div>
                  </div>
                  <div className="settings-row-chevron">→</div>
                </button>
              </div>
            )}

            {settingsSubView === "theme" && (
              <div className="settings-subscreen">
                <button className="back-btn" onClick={() => setSettingsSubView("home")}>← Settings</button>
                <div className="settings-section">
                  <div className="section-header">
                    <div className="section-title">Theme</div>
                    <div className="section-description">Choose a look for your app.</div>
                  </div>
                  <div className="theme-swatch-grid">
                    {Object.entries(THEMES).map(([key, themeMeta]) => (
                      <button
                        key={key}
                        type="button"
                        className={`theme-swatch ${themeName === key ? "selected" : ""}`}
                        style={{ background: themeMeta.bg }}
                        onClick={() => setThemeName(key)}
                        aria-label={themeMeta.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {settingsSubView === "categories" && (
              <div className="settings-subscreen">
                <button className="back-btn" onClick={() => setSettingsSubView("home")}>← Settings</button>
                <div className="settings-section">
                  <div className="section-header">
                    <div className="section-title">Categories</div>
                    <div className="section-description">Add and remove categories used in Journal entries.</div>
                  </div>
                  <div className="manage-list">
                    {categories.map((c) => (
                      <div key={c.id} className="category-row">
                        <div className="category-info">
                          <span className="swatch" style={{ background: c.color }} />
                          <div className="category-details">
                            <div className="category-label">{c.icon} {c.label}</div>
                            <div className="category-count">{categoryCount(c.id)} entr{categoryCount(c.id) === 1 ? "y" : "ies"}</div>
                          </div>
                        </div>
                        <button className="delete-btn" type="button" onClick={() => deleteCategoryById(c.id)} disabled={c.id === "other" || c.id === "sleep" || categories.length === 1} aria-label={`Delete ${c.label}`}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="form-section">
                    <span className="form-label">Add category</span>
                    <input className="input" placeholder="Category name" value={manageForm.label} onChange={(e) => { setManageForm((f) => ({ ...f, label: e.target.value })); setCategoryError(""); }} />
                    {categoryError && <div className="form-note">{categoryError}</div>}
                  </div>

                  <div className="form-section">
                    <span className="form-label">Emoji</span>
                    <div className="emoji-grid">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button key={emoji} type="button" className={`emoji-item ${manageForm.emoji === emoji ? "selected" : ""}`} onClick={() => setManageForm((f) => ({ ...f, emoji }))}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-section">
                    <span className="form-label">Color</span>
                    <div className="color-grid">
                      {COLOR_OPTIONS.map((color) => (
                        <button key={color} type="button" className={`color-swatch-item ${manageForm.color === color ? "selected" : ""}`} style={{ background: color }} onClick={() => setManageForm((f) => ({ ...f, color }))} />
                      ))}
                    </div>
                  </div>

                  <button className="btn-primary" type="button" onClick={addCategory} disabled={!manageForm.label.trim()}>
                    Add Category
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD VIEW */}
        {view === "add" && (
          <div className="add-form">
            <button className="back-btn" onClick={() => setView("journal")}>← Back</button>

            <div className="form-section">
              <span className="form-label">Category</span>
              <div className="cat-grid">
                {categories.map((c) => (
                  <div key={c.id} className={`cat-item ${form.category === c.id ? "selected" : ""}`} onClick={() => setForm((f) => ({ ...f, category: c.id }))}>
                    <span className="icon">{c.icon}</span>
                    <span className="name">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <span className="form-label">Title</span>
              <input className="input" placeholder="What happened?" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="form-section">
              <span className="form-label">Photo (optional)</span>
              {form.photoPreview ? (
                <div className="photo-preview">
                  <img src={form.photoPreview} alt="preview" />
                  <button className="photo-remove" onClick={() => setForm((f) => ({ ...f, photo: null, photoPreview: null }))}>×</button>
                </div>
              ) : (
                <div className="photo-upload" onClick={() => fileRef.current.click()}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>Tap to add a photo</div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                </div>
              )}
            </div>

            <div className="form-section">
              <span className="form-label">Notes</span>
              <textarea className="textarea" placeholder="Add your thoughts, feelings, details..." value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={4} />
            </div>

            <button className="btn-primary" onClick={handleAdd} disabled={!form.title.trim()}>
              Save Entry
            </button>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedEntry && (() => {
          const cat = getCat(selectedEntry.category);
          return (
            <div className="detail-view">
              <button className="back-btn" onClick={() => setView("journal")}>← Back to journal</button>
              {selectedEntry.photo && <img src={selectedEntry.photo} alt="" className="detail-photo" />}
              <div className="detail-cat-badge" style={{ background: cat.color }}>
                {cat.icon} {cat.label}
              </div>
              <div className="detail-title">{selectedEntry.title}</div>
              <div className="detail-time">{formatDate(selectedEntry.timestamp)} · {formatTime(selectedEntry.timestamp)}</div>
              {selectedEntry.note && (
                <>
                  <hr className="detail-divider" />
                  <div className="detail-note-label">Notes</div>
                  <div className="detail-note">{selectedEntry.note}</div>
                </>
              )}
              <hr className="detail-divider" style={{ marginTop: 30 }} />
              <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}
                onClick={() => { setEntries((prev) => prev.filter((e) => e.id !== selectedEntry.id)); setView("journal"); }}>
                Delete entry
              </button>
            </div>
          );
        })()}

        {/* FAB */}
        {view === "journal" && !journalYearMode && (
          <button className={`fab${view === "journal" && filtered.length === 0 ? " empty-pulse" : ""}`} onClick={() => setView("add")}>+</button>
        )}

        {showBottomNav && (
          <div className="bottom-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`bottom-tab ${view === tab.id ? "active" : ""}`}
                onClick={() => {
                  setView(tab.id);
                  if (tab.id === "calendar") setCalendarDay(null);
                }}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
