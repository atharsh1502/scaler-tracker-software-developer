import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white border border-slate-200 shadow-sm rounded-3xl ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, className = "", variant, ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-900";
  const variantClass = variant === "destructive"
    ? "bg-slate-900 text-white hover:bg-slate-800"
    : "bg-yellow-400 text-slate-900 hover:bg-yellow-500";
  return (
    <button {...props} className={`${base} ${variantClass} ${className}`}>
      {children}
    </button>
  );
};

const Progress = ({ value = 0 }) => (
  <div className="w-full bg-slate-800/40 h-3 rounded-full overflow-hidden shadow-inner">
    <div className="h-3 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 transition-all duration-300" style={{ width: `${value}%` }} />
  </div>
);

// ---- ULTRA DETAILED CURRICULUM (expanded granularity) ----
const topics = [
  ["DSA","Time Complexity"],["DSA","Arrays - Basics"],["DSA","Prefix Sum"],["DSA","Carry Forward"],["DSA","2D Arrays"],["DSA","Bit Manipulation"],["DSA","Strings"],["DSA","Recursion"],["DSA","Sorting - Merge"],["DSA","Sorting - Quick"],["DSA","Hashing"],["DSA","Binary Search"],["DSA","Linked List"],["DSA","Stacks"],["DSA","Queues"],["DSA","Trees"],["DSA","BST"],["DSA","Backtracking"],["DSA","Heaps"],["DSA","Greedy"],["DSA","DP - 1D"],["DSA","DP - 2D"],["DSA","Knapsack"],["DSA","Graphs - DFS"],["DSA","Graphs - BFS"],["DSA","Dijkstra"],["DSA","Topological Sort"],
  ["AI","Prompt Engineering"],["AI","Advanced Prompting"],["AI","RAG"],["AI","AI Agents"],["AI","Multi-Agent Systems"],["AI","n8n Workflows"],
  ["SQL","CRUD"],["SQL","Joins"],["SQL","Aggregates"],["SQL","Subqueries"],["SQL","Indexing"],["SQL","Transactions"],["SQL","Window Functions"],["SQL","Schema Design"],
  ["Backend","OOP"],["Backend","Concurrency"],["Backend","Design Patterns"],["Backend","Spring Boot"],["Backend","JWT Auth"],["Backend","Microservices"],["Backend","Redis"],["Backend","Kafka"],["Backend","Docker"],
  ["Frontend","HTML"],["Frontend","CSS"],["Frontend","Flexbox/Grid"],["Frontend","JavaScript Core"],["Frontend","Closures"],["Frontend","Promises"],["Frontend","Async/Await"],["Frontend","React"],["Frontend","Redux"],["Frontend","Next.js"],
  ["System Design","Load Balancing"],["System Design","Caching"],["System Design","CDN"],["System Design","Sharding"],["System Design","Messaging Queues"],["System Design","Microservices"],["System Design","Rate Limiter"],
].map(([category, topic]) => ({ category, topic, status: "Not Started", date: "" }));

const techNews = [
  {
    title: "OpenAI launches GPT-4o with multimodal AI improvements",
    summary: "OpenAI releases GPT-4o, expanding AI capabilities for image, text, and code generation.",
    url: "https://openai.com/research/gpt-4o",
  },
  {
    title: "Oracle updates Java 21 roadmap for cloud-native apps",
    summary: "Java 21 brings new performance and observability features for modern backend development.",
    url: "https://www.oracle.com/java/technologies/java-se-glance.html",
  },
  {
    title: "Spring Boot 3.3 preview arrives with smarter configuration",
    summary: "Spring Boot 3.3 makes building microservices easier with improved startup and metrics.",
    url: "https://spring.io/blog/2024/11/12/spring-boot-3-3-0-m1",
  },
  {
    title: "GitHub Copilot for Developers adds AI-powered code reviews",
    summary: "Copilot now helps developers catch bugs earlier and write better code faster.",
    url: "https://github.com/features/copilot",
  },
  {
    title: "TensorFlow 3.0 beta boosts AI model performance",
    summary: "TensorFlow 3.0 introduces faster training and enhanced model debugging tools.",
    url: "https://blog.tensorflow.org/",
  },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [view, setView] = useState("Home");
  const [topicSearch, setTopicSearch] = useState("");
  const [newsIndex, setNewsIndex] = useState(0);
  const [newsItems, setNewsItems] = useState(techNews);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");
  const [lastNewsRefresh, setLastNewsRefresh] = useState(new Date());
  const [loadingData, setLoadingData] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [todayPlan, setTodayPlan] = useState([]);

  useEffect(() => {
    const restoreSession = async () => {
      if (!hasSupabase) return;
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.warn("Supabase session restore failed:", error);
        return;
      }

      if (session?.user) {
        const sessionUser = session.user;
        const userData = {
          name: sessionUser.user_metadata?.full_name || sessionUser.email,
          email: sessionUser.email,
        };
        sessionStorage.setItem("ultraTrackerUser", JSON.stringify(userData));
        setUser(userData);
      } else {
        const savedUser = sessionStorage.getItem("ultraTrackerUser");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
    };

    restoreSession();

    if (!hasSupabase) return;
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const sessionUser = session.user;
        loadProfileFromSupabase(sessionUser.id, sessionUser.email);
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe?.();
  }, []);

const loadProfileFromSupabase = async (userId, email) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();

    if (!error && profile?.full_name) {
      const userData = {
        name: profile.full_name,
        email,
      };
      sessionStorage.setItem("ultraTrackerUser", JSON.stringify(userData));
      setUser(userData);
      return userData;
    }

    return {
      name: email,
      email,
    };

  } catch (err) {
    console.warn("Profile fetch failed:", err);
    return {
      name: email,
      email,
    };
  }
};

  const loadUserData = async (userEmail) => {
    setLoadingData(true);
    try {
      if (hasSupabase) {
        const { data: rows, error } = await supabase
          .from("tracker_topics")
          .select("*")
          .eq("user_email", userEmail)
          .order("id", { ascending: true });

        if (error) {
          throw error;
        }

        if (rows?.length) {
          setData(
            rows.map((row) => ({
              id: row.id,
              category: row.category,
              topic: row.topic,
              status: row.status || "Not Started",
              date: row.date || "",
            }))
          );
          return;
        }

        const initialRows = topics.map((item) => ({
          ...item,
          user_email: userEmail,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from("tracker_topics")
          .insert(initialRows);

        if (insertError) {
          throw insertError;
        }

        setData(
          inserted.map((row) => ({
            id: row.id,
            category: row.category,
            topic: row.topic,
            status: row.status || "Not Started",
            date: row.date || "",
          }))
        );
        return;
      }
    } catch (error) {
      console.warn("Supabase load failed:", error);
    } finally {
      setLoadingData(false);
    }

    const key = `ultraTracker_${userEmail}`;
    const saved = localStorage.getItem(key);
    setData(saved ? JSON.parse(saved) : topics);
  };

  useEffect(() => {
    if (!user) return;
    loadUserData(user.email);
  }, [user]);

  useEffect(() => {
    if (!user || !data.length) return;
    const key = `ultraTracker_${user.email}`;
    localStorage.setItem(key, JSON.stringify(data));
  }, [data, user]);

  const updateStatus = async (i, status) => {
    const copy = [...data];
    copy[i].status = status;
    copy[i].date = new Date().toLocaleDateString();
    setData(copy);

    if (hasSupabase && copy[i]?.id) {
      const { error } = await supabase
        .from("tracker_topics")
        .update({ status: copy[i].status, date: copy[i].date })
        .eq("id", copy[i].id);

      if (error) {
        console.warn("Supabase update failed:", error);
      }
    }
  };

const handleLogin = async (event) => {
  event.preventDefault();

  // ✅ FIXED VALIDATION
  if (!loginEmail.trim() || !loginPassword.trim() || (isSignUp && !loginName.trim())) {
    setLoginError(
      isSignUp
        ? "Please enter name, email, and password."
        : "Please enter email and password."
    );
    return;
  }

  setAuthLoading(true);
  setLoginError("");

  const normalizedEmail = loginEmail.trim().toLowerCase();

  try {
    if (hasSupabase) {

      // =========================
      // ✅ SIGN UP
      // =========================
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: loginPassword,
          options: {
            data: {
              full_name: loginName.trim(),
            },
          },
        });

        if (error) {
          setLoginError(error.message || "Sign up failed.");
          return;
        }

        if (data?.user) {
          // ✅ safer insert
          await supabase.from("profiles").upsert({
            user_id: data.user.id,
            email: normalizedEmail,
            full_name: loginName.trim(),
          });

          const userData = {
            name: loginName.trim(),
            email: data.user.email,
          };

          sessionStorage.setItem("ultraTrackerUser", JSON.stringify(userData));
          setUser(userData);
          return;
        }

        setLoginError("Account created. Please verify email and login.");
        return;
      }

      // =========================
      // ✅ LOGIN
      // =========================
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: loginPassword,
      });

      if (error) {
        setLoginError("Invalid email or password.");
        return;
      }

      if (data?.user) {
        const profileUser = await loadProfileFromSupabase(
          data.user.id,
          data.user.email
        );

        sessionStorage.setItem("ultraTrackerUser", JSON.stringify(profileUser));
        setUser(profileUser);
        return;
      }
    }

    // =========================
    // ✅ FALLBACK (NO SUPABASE)
    // =========================
    const userData = {
      name: loginName.trim() || "User",
      email: normalizedEmail,
    };

    sessionStorage.setItem("ultraTrackerUser", JSON.stringify(userData));
    setUser(userData);

  } catch (error) {
    setLoginError(error.message || "Authentication failed.");
  } finally {
    setAuthLoading(false);
  }
};

  const handleLogout = async () => {
    if (hasSupabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem("ultraTrackerUser");
    setUser(null);
    setData([]);
    setView("Home");
    setFilter("All");
    setCategoryFilter("All");
    setTopicSearch("");
  };

  const loadNews = async () => {
    setNewsLoading(true);
    setNewsError("");

    try {
      const response = await fetch(
        "https://hn.algolia.com/api/v1/search_by_date?query=technology&tags=story&hitsPerPage=6"
      );

      if (!response.ok) {
        throw new Error("Unable to fetch live news.");
      }

      const json = await response.json();
      const items = json.hits.map((hit) => ({
        title: hit.title || hit.story_title || "Tech update",
        summary:
          (hit.comment_text && hit.comment_text.replace(/<[^>]+>/g, "").slice(0, 120)) ||
          `By ${hit.author || "unknown"} · ${hit.points || 0} points`,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      }));

      setNewsItems(items.length ? items : techNews);
      setNewsIndex(0);
      setLastNewsRefresh(new Date());
    } catch (error) {
      setNewsError("Unable to refresh news. Showing cached stories.");
      setNewsItems(techNews);
      setNewsIndex(0);
    } finally {
      setNewsLoading(false);
    }
  };

  const previousNews = () => {
    setNewsIndex((prev) => (prev === 0 ? newsItems.length - 1 : prev - 1));
  };

  const nextNews = () => {
    setNewsIndex((prev) => (newsItems.length ? (prev + 1) % newsItems.length : 0));
  };

  useEffect(() => {
    if (!newsItems.length) return;
    const interval = setInterval(() => {
      setNewsIndex((prev) => (newsItems.length ? (prev + 1) % newsItems.length : 0));
    }, 6000);

    return () => clearInterval(interval);
  }, [newsItems]);

  const completed = data.filter((d) => d.status === "Completed").length;
  const progress = Math.round((completed / data.length) * 100);
  const categories = [...new Set(data.map((d) => d.category))];

  const catProgress = (c) => {
    const items = data.filter((d) => d.category === c);
    const done = items.filter((i) => i.status === "Completed").length;
    return Math.round((done / items.length) * 100);
  };

  useEffect(() => {
    const pending = data.filter((d) => d.status === "Not Started").slice(0, 5);
    setTodayPlan(pending);
  }, [data]);

  useEffect(() => {
    loadNews();
  }, []);

  const statusCounts = {
    All: data.length,
    "Not Started": data.filter((d) => d.status === "Not Started").length,
    "In Progress": data.filter((d) => d.status === "In Progress").length,
    Completed: data.filter((d) => d.status === "Completed").length,
  };

  const topicResults = data
    .map((d, index) => ({ ...d, index }))
    .filter((d) => d.topic.toLowerCase().includes(topicSearch.toLowerCase()))
    .filter((d) => categoryFilter === "All" || d.category === categoryFilter)
    .filter((d) => filter === "All" || d.status === filter);

  const currentState = filter === "All" ? "All topics" : `${filter} topics`;
  const currentStateProgress = filter === "All" ? progress : Math.round((statusCounts[filter] / data.length) * 100);

  const filtered = data
    .filter((d) => filter === "All" || d.status === filter)
    .filter((d) => categoryFilter === "All" || d.category === categoryFilter);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-slate-900 px-8 py-10 text-center text-white">
            <h1 className="text-3xl font-bold">Scalar Tracker - Software Engineering <br></br>
               Sign-In</h1>
            <p className="mt-2 text-sm text-slate-300">Sign in to access your learning tracker.</p>
          </div>
          <div className="px-8 py-10">
            {loginError && (
              <div className="mb-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              {isSignUp && (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
    <input
      value={loginName}
      onChange={(e) => setLoginName(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-600 focus:outline-none"
      placeholder="Your name"
    />
  </div>
)}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-600 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-600 focus:outline-none"
                  placeholder="Enter password"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {authLoading ? (isSignUp ? "Creating account..." : "Signing in...") : isSignUp ? "Create account securely" : "Sign in securely"}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <button
                type="button"
                onClick={() => setIsSignUp((prev) => !prev)}
                className="font-semibold text-yellow-400 hover:text-yellow-300"
              >
                {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {hasSupabase
                ? "Your login is secured with Supabase auth."
                : "This is a client-side login flow for GitHub Pages deployment. Your session is stored in the browser."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white shadow-sm">
        <div className="mx-auto max-w-[1200px] px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-extrabold tracking-tight">Scalar Tracker - Software Engineering <br></br></div>
            <span className="hidden text-sm text-slate-300 md:inline">Learning</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-300">Hello, {user.name}</div>
            <button onClick={handleLogout} className="rounded-full bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700">
              Sign out
            </button>
          </div>
        </div>
        <div className="border-t border-slate-800/70">
          <div className="mx-auto max-w-[1200px] px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <button onClick={() => setView("Home")} className={`rounded-full px-3 py-2 transition ${view === "Home" ? "bg-yellow-400 text-slate-900" : "hover:bg-slate-700"}`}>
                Home
              </button>
              <button onClick={() => setView("Topics")} className={`rounded-full px-3 py-2 transition ${view === "Topics" ? "bg-yellow-400 text-slate-900" : "hover:bg-slate-700"}`}>
                Topics
              </button>
              <button onClick={() => setView("Progress")} className={`rounded-full px-3 py-2 transition ${view === "Progress" ? "bg-yellow-400 text-slate-900" : "hover:bg-slate-700"}`}>
                Progress
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
              <span>Current state:</span>
              <span className="font-semibold text-white">{currentState}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em]">{currentStateProgress}%</span>
            </div>
          </div>
        </div>
          <div className="mx-auto max-w-[1360px] px-4 py-6 grid gap-5 xl:grid-cols-[1.6fr_2fr_1fr]">
            <div className="rounded-3xl bg-slate-800 p-6 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">Prime Learning</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Ultra Learning Dashboard</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">View your progress with compact filters, quick insights, and live headlines.</p>
            </div>
            <div className="rounded-3xl border border-yellow-200/20 bg-slate-950/95 p-5 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">Tech news</p>
                  <p className="mt-1 text-sm text-slate-300">Browse the latest dev headlines.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-slate-900/70 px-2 py-1 text-slate-300">
                  <button
                    onClick={previousNews}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-base text-white transition hover:border-yellow-300"
                  >
                    ⟵
                  </button>
                  <button
                    onClick={nextNews}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-base text-white transition hover:border-yellow-300"
                  >
                    ⟶
                  </button>
                </div>
              </div>
              {newsError && <p className="mt-3 text-sm text-rose-300">{newsError}</p>}
              <div className="mt-4">
                {newsItems[newsIndex] ? (
                  <a
                    href={newsItems[newsIndex].url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-3xl border border-slate-700 bg-slate-950/90 p-5 transition hover:border-yellow-300"
                  >
                    <p className="text-sm font-semibold text-white">{newsItems[newsIndex].title}</p>
                    <p className="mt-3 text-sm text-slate-300 line-clamp-4">{newsItems[newsIndex].summary}</p>
                    <p className="mt-5 text-xs uppercase tracking-[0.2em] text-yellow-300">Read full story</p>
                  </a>
                ) : (
                  <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5 text-sm text-slate-300">
                    No news available.
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{newsItems.length ? `${newsIndex + 1} / ${newsItems.length}` : "0 / 0"}</span>
                <div className="flex items-center gap-3">
                  <span>Last refreshed: {lastNewsRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button
                    onClick={loadNews}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-slate-900 transition hover:bg-yellow-300"
                    aria-label="Refresh news"
                  >
                    ⟳
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <Card className="bg-gradient-to-br from-yellow-500 via-orange-500 to-amber-400 text-slate-950 shadow-2xl ring-1 ring-yellow-200/30">
                <CardContent>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-900/70">Overall progress</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">{progress}%</p>
                  <p className="mt-2 text-sm text-slate-950/80">Your completed tracker score updates live.</p>
                  <div className="mt-5">
                    <Progress value={progress} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-950 text-white">
                <CardContent>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Pending topics</p>
                  <p className="mt-3 text-3xl font-bold">{todayPlan.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Next tasks from your quick plan.</p>
                </CardContent>
              </Card>
            </div>
          </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
        {view === "Home" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Today’s learning picks</p>
                      <h2 className="mt-2 text-3xl font-bold">Your plan</h2>
                    </div>
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">{todayPlan.length} items</div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {todayPlan.map((t, i) => (
                      <div key={i} className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{t.topic}</p>
                          <p className="text-sm text-slate-500">{t.category}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card>
                  <CardContent>
                    <h3 className="text-xl font-bold">Summary</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-5 shadow-sm">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Overall progress</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{progress}%</p>
                        <div className="mt-4">
                          <Progress value={progress} />
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Status breakdown</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p>Not Started: {statusCounts["Not Started"]}</p>
                          <p>In Progress: {statusCounts["In Progress"]}</p>
                          <p>Completed: {statusCounts.Completed}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <h3 className="text-xl font-bold">Category progress</h3>
                    <div className="mt-4 space-y-4">
                      {categories.map((c) => (
                        <div key={c}>
                          <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                            <span>{c}</span>
                            <span>{catProgress(c)}%</span>
                          </div>
                          <Progress value={catProgress(c)} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {view === "Topics" && (
          <div className="space-y-6">
            <Card>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">Topics</h2>
                    <p className="mt-2 text-sm text-slate-500">Search, filter, and browse all available tracker topics.</p>
                  </div>
                  <input
                    type="search"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    placeholder="Search topics..."
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none sm:w-auto"
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {["All", "Not Started", "In Progress", "Completed"].map((f) => (
                    <Button key={f} onClick={() => setFilter(f)} className={filter === f ? "shadow-lg" : "opacity-90"}>{f}</Button>
                  ))}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-slate-600 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Topic list</p>
                  <h2 className="text-3xl font-bold">Search results</h2>
                </div>
                <p className="text-sm text-slate-500">Showing {topicResults.length} of {data.length} topics</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {topicResults.map((item) => (
                  <Card key={item.index} className="transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardContent>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">{item.topic}</h3>
                          <p className="mt-1 text-sm text-slate-500">{item.category}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "Completed" ? "bg-emerald-100 text-emerald-700" : item.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-slate-500">Last update: {item.date || "Not started yet"}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button onClick={() => updateStatus(item.index, "In Progress")} className="min-w-[110px]">Start</Button>
                        <Button onClick={() => updateStatus(item.index, "Completed")} className="min-w-[110px]">Done</Button>
                        <Button variant="destructive" onClick={() => updateStatus(item.index, "Not Started")} className="min-w-[110px]">Reset</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === "Progress" && (
          <div className="space-y-6">
            <Card>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">Progress dashboard</h2>
                    <p className="mt-2 text-sm text-slate-500">See state-level progress and current tracker performance.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold">Current state</p>
                    <p className="mt-2 text-lg font-bold">{currentState}</p>
                    <p className="mt-1">{currentStateProgress}% of all topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardContent>
                  <h3 className="text-xl font-bold">State breakdown</h3>
                  <div className="mt-6 space-y-4">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status}>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                          <span>{status}</span>
                          <span>{count} topics</span>
                        </div>
                        <Progress value={Math.round((count / data.length) * 100)} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <h3 className="text-xl font-bold">Category progress</h3>
                  <div className="mt-4 space-y-4">
                    {categories.map((c) => (
                      <div key={c}>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                          <span>{c}</span>
                          <span>{catProgress(c)}%</span>
                        </div>
                        <Progress value={catProgress(c)} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
