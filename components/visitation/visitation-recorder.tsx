"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Save,
  Users as UsersIcon,
  Phone,
  FileText,
  RefreshCw,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Member {
  id: string;
  name: string;
  phones: string[] | null;
  notes: string | null;
}

interface VisitRecord {
  member_id: string;
  status: "visited" | "not_visited";
  notes: string;
  visited_by?: string | null;
  created_at?: string | null;
}

interface VisitationRecorderProps {
  initialMembers: Member[];
  usersList: { id: string; name: string }[];
  initialAssignments: Record<string, string | null>;
}

export function VisitationRecorder({
  initialMembers,
  usersList,
  initialAssignments,
}: VisitationRecorderProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [assignments, setAssignments] =
    useState<Record<string, string | null>>(initialAssignments);
  const [visits, setVisits] = useState<Record<string, VisitRecord>>({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();
  const hasUnsavedChangesRef = useRef(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fallback data loading
  useEffect(() => {
    if (initialMembers.length > 0) {
      setMembers(initialMembers);
    } else {
      void loadMembers();
    }
    if (Object.keys(initialAssignments).length > 0) {
      setAssignments(initialAssignments);
    } else {
      void loadAssignments();
    }
  }, [initialMembers, initialAssignments]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error("Error loading members:", err);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("member_assignments")
        .select("member_id,servant_id");
      if (error) throw error;
      const map: Record<string, string | null> = {};
      (data || []).forEach(
        (row: { member_id: string; servant_id: string | null }) => {
          map[row.member_id] = row.servant_id;
        }
      );
      setAssignments(map);
    } catch (err) {
      console.error("Error loading assignments:", err);
    }
  };

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 250);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    loadVisits();
  }, [selectedDate]);

  // Load current user id
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted) setCurrentUserId(data.user?.id ?? null);
      } catch {
        if (mounted) setCurrentUserId(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .eq("date", selectedDate);
      if (error) throw error;
      const visitMap: Record<string, VisitRecord> = {};
      data?.forEach(
        (record: {
          member_id: string;
          status: "visited" | "not_visited";
          notes?: string | null;
          visited_by?: string | null;
          created_at?: string | null;
        }) => {
          visitMap[record.member_id] = {
            member_id: record.member_id,
            status: record.status,
            notes: record.notes || "",
            visited_by: record.visited_by ?? null,
            created_at: record.created_at ?? null,
          };
        }
      );
      setVisits(visitMap);
    } catch (err) {
      console.error("Error loading visits:", err);
      toast({
        variant: "destructive",
        description: "فشل تحميل بيانات الافتقاد",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVisit = async (
    memberId: string,
    status: "visited" | "not_visited"
  ) => {
    const currentRecord = visits[memberId];
    const isRemoving = currentRecord?.status === status;

    if (isRemoving) {
      setVisits((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
      hasUnsavedChangesRef.current = true;

      try {
        const { error } = await supabase
          .from("visits")
          .delete()
          .match({ member_id: memberId, date: selectedDate });
        if (error) throw error;
      } catch (err) {
        setVisits((prev) => ({ ...prev, [memberId]: currentRecord }));
        toast({ variant: "destructive", description: "فشل إلغاء الحالة" });
      }
    } else {
      setVisits((prev) => ({
        ...prev,
        [memberId]: {
          member_id: memberId,
          status,
          notes: prev[memberId]?.notes || "",
          visited_by: currentUserId ?? prev[memberId]?.visited_by ?? null,
        },
      }));

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const actorId = user?.id ?? null;
        const payload = {
          member_id: memberId,
          date: selectedDate,
          status,
          notes: visits[memberId]?.notes || null,
          visited_by: actorId,
        };
        const { error } = await supabase
          .from("visits")
          .upsert(payload, { onConflict: "member_id,date" });
        if (error) throw error;
        hasUnsavedChangesRef.current = false;
      } catch (err) {
        setVisits((prev) => ({ ...prev }));
        toast({ variant: "destructive", description: "فشل حفظ الحالة" });
      }
    }
  };

  const updateNotes = (memberId: string, notes: string) => {
    setVisits((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        member_id: memberId,
        status: prev[memberId]?.status || "not_visited",
        notes,
      },
    }));
    hasUnsavedChangesRef.current = true;
  };

  const saveVisits = async () => {
    if (Object.keys(visits).length === 0) return;
    const proceed = window.confirm(
      "سيتم استبدال سجلات هذا التاريخ. هل تريد المتابعة؟"
    );
    if (!proceed) return;
    setSaving(true);
    setMessage(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const records = Object.values(visits).map((record) => ({
        member_id: record.member_id,
        date: selectedDate,
        status: record.status,
        notes: record.notes || null,
      }));
      const { error } = await supabase
        .from("visits")
        .upsert(records, { onConflict: "member_id,date" });
      if (error) throw error;
      setMessage({ type: "success", text: "تم حفظ الافتقاد بنجاح" });
      hasUnsavedChangesRef.current = false;
      toast({ description: "تم الحفظ بنجاح" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "فشل حفظ الافتقاد" });
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = useMemo(
    () =>
      members.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [members, searchQuery]
  );

  // Group filtered members by assigned servant
  const groupedByServant = useMemo(() => {
    const groups: Record<string, Member[]> = {};
    filteredMembers.forEach((m) => {
      const sid = assignments[m.id] || "__unassigned__";
      if (!groups[sid]) groups[sid] = [];
      groups[sid].push(m);
    });
    // sort each group's members by name for consistent UI
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => a.name.localeCompare(b.name))
    );
    return groups;
  }, [filteredMembers, assignments]);

  // Determine up to 4 servant IDs to render sections for (equal separation UX)
  const servantSectionIds = useMemo(() => {
    const assignedServantIds = Object.keys(groupedByServant).filter(
      (k) => k !== "__unassigned__"
    );
    // Prefer the first 4 servants by users list order, falling back to discovered ids
    const preferred = usersList
      .map((u) => u.id)
      .filter((id) => assignedServantIds.includes(id))
      .slice(0, 4);
    if (preferred.length < 4) {
      const rest = assignedServantIds
        .filter((id) => !preferred.includes(id))
        .slice(0, 4 - preferred.length);
      return [...preferred, ...rest];
    }
    return preferred;
  }, [groupedByServant, usersList]);

  const bulkMark = (status: "visited" | "not_visited") => {
    if (filteredMembers.length === 0) return;
    setVisits((prev) => {
      const next = { ...prev };
      filteredMembers.forEach((m) => {
        next[m.id] = {
          member_id: m.id,
          status,
          notes: next[m.id]?.notes || "",
        };
      });
      return next;
    });
    hasUnsavedChangesRef.current = true;
  };

  const bulkReset = () => {
    if (filteredMembers.length === 0) return;
    setVisits((prev) => {
      const next = { ...prev };
      filteredMembers.forEach((m) => {
        delete next[m.id];
      });
      return next;
    });
    hasUnsavedChangesRef.current = true;
  };

  const stats = {
    total: members.length,
    visited: Object.values(visits).filter((a) => a.status === "visited").length,
    notVisited: Object.values(visits).filter((a) => a.status === "not_visited")
      .length,
  };

  // Equal distribution helper UI (admin-only usage, but UI available for all; RLS guards writes)
  const distributeEquallyToFour = async () => {
    // Check user role first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          description: "يجب تسجيل الدخول أولاً",
        });
        return;
      }

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError || userData?.role !== "admin") {
        toast({
          variant: "destructive",
          title: "غير مسموح ⛔",
          description: "هذه العملية متاحة فقط للمسؤولين (Admin)",
        });
        return;
      }

      // Show confirmation
      const confirmed = window.confirm(
        "هل تريد توزيع جميع الطلاب على الأربع خدام (أبانوب، مريم، مارينا، كيرلس)؟\n\nسيتم إعادة توزيع جميع الطلاب بالتساوي."
      );
      if (!confirmed) return;

      // Target specific servants: أبانوب, مريم, مارينا, كيرلس
      const targetNames = ["أبانوب", "مريم", "مارينا", "كيرلس"];

      // Find these servants in the users list
      let servantIds = usersList
        .filter((u) => targetNames.some((target) => u.name.includes(target)))
        .map((u) => u.id);

      // Remove duplicates if any
      servantIds = Array.from(new Set(servantIds));

      // Fallback: if we found none of them, revert to "any 4 servants" behavior
      if (servantIds.length === 0) {
        const { data: servants } = await supabase
          .from("users")
          .select("id")
          .eq("role", "servant")
          .limit(4);
        if (servants) servantIds = servants.map((s) => s.id);
      }

      if (servantIds.length === 0) {
        toast({
          variant: "destructive",
          description: "لا يوجد خدام لتوزيع الطلاب عليهم",
        });
        return;
      }

      // Sort members by name for deterministic assignment
      const sortedMembers = [...members].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      // Distribute
      const rows = sortedMembers.map((m, idx) => ({
        member_id: m.id,
        servant_id: servantIds[idx % servantIds.length],
      }));

      // Show loading toast
      toast({
        description: "جاري توزيع الطلاب...",
      });

      // Upsert assignments (requires admin per RLS)
      const { error } = await supabase
        .from("member_assignments")
        .upsert(rows, { onConflict: "member_id" });

      if (!error) {
        toast({
          title: "تم التوزيع بنجاح ✅",
          description: `تم توزيع ${sortedMembers.length} طالب على ${servantIds.length} خدام بالتساوي`,
        });
        await loadAssignments();
      } else {
        console.error("Distribution error:", error);
        toast({
          variant: "destructive",
          title: "فشل التوزيع ❌",
          description:
            error.message ||
            "حدث خطأ أثناء توزيع الطلاب. تحقق من الصلاحيات في Supabase",
        });
      }
    } catch (err: any) {
      console.error("Distribution error:", err);
      toast({
        variant: "destructive",
        title: "خطأ ❌",
        description: err.message || "حدث خطأ غير متوقع",
      });
    }
  };

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (isSave) {
        e.preventDefault();
        if (!saving && Object.keys(visits).length > 0) {
          void saveVisits();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, visits]);

  return (
    <div className="relative pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 -mx-4 px-4 lg:-mx-6 lg:px-6 mb-8">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-b-3xl p-4 sm:p-6 space-y-5 ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Date Picker */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-0 bg-transparent p-0 h-auto text-base font-semibold text-gray-800 focus-visible:ring-0 w-full sm:w-auto cursor-pointer"
                  />
                </div>
              </div>
              <Button
                onClick={distributeEquallyToFour}
                variant="outline"
                size="icon"
                className="rounded-xl border-gray-300 hover:bg-gray-100"
                title="توزيع على 4 خدام"
              >
                <UsersIcon className="h-5 w-5 text-gray-600" />
              </Button>
            </div>

            <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              <div className="flex-1 min-w-[100px] bg-white/60 rounded-2xl p-3 border border-white/50 shadow-sm flex flex-col items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  الكل
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {stats.total}
                </span>
              </div>
              <div className="flex-1 min-w-[100px] bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100 shadow-sm flex flex-col items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  تم الافتقاد
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {stats.visited}
                </span>
              </div>
              <div className="flex-1 min-w-[100px] bg-rose-50/60 rounded-2xl p-3 border border-rose-100 shadow-sm flex flex-col items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  لم يُفتقد
                </span>
                <span className="text-2xl font-black text-rose-700">
                  {stats.notVisited}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="بحث بالاسم..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pr-12 h-12 bg-white/90 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-teal-500 rounded-2xl shadow-sm text-base transition-shadow"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              <Button
                onClick={() => bulkMark("visited")}
                variant="outline"
                className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 whitespace-nowrap font-bold shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" /> كله تم
              </Button>
              <Button
                onClick={() => bulkMark("not_visited")}
                variant="outline"
                className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 whitespace-nowrap font-bold shadow-sm"
              >
                <XCircle className="w-4 h-4 ml-2" /> كله لم يتم
              </Button>
              <Button
                onClick={bulkReset}
                variant="ghost"
                size="icon"
                className="rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 px-1"
        >
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="rounded-2xl border-0 shadow-lg bg-white ring-1 ring-black/5"
          >
            <AlertDescription className="font-bold text-lg text-center">
              {message.text}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="space-y-10 pb-28">
        {filteredMembers.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-xl font-semibold text-gray-600">لا توجد نتائج</p>
            <p className="text-gray-400 mt-2">حاول البحث باسم آخر</p>
          </motion.div>
        )}

        {/* Render 4 servant sections, separated, then unassigned if any */}
        <AnimatePresence mode="popLayout">
          {servantSectionIds.map((servantId, idx) => {
            const sectionMembers = groupedByServant[servantId] || [];
            if (sectionMembers.length === 0) return null;
            const servantName =
              usersList.find((u) => u.id === servantId)?.name || "خادم";
            return (
              <motion.div
                key={servantId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-700">
                    {servantName}
                  </h4>
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-bold border border-teal-100 shadow-sm">
                    {sectionMembers.length} طالب
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {sectionMembers.map((member) => {
                    const record = visits[member.id];
                    const isVisited = record?.status === "visited";
                    const isNotVisited = record?.status === "not_visited";
                    const tel =
                      member.phones && member.phones.length > 0
                        ? member.phones[0].replace(/\s+/g, "")
                        : null;
                    return (
                      <motion.div
                        key={member.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Card
                          className={cn(
                            "h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-3xl ring-1",
                            isVisited
                              ? "bg-gradient-to-br from-emerald-50 to-white ring-emerald-200"
                              : isNotVisited
                              ? "bg-gradient-to-br from-rose-50 to-white ring-rose-200"
                              : "bg-white ring-gray-200 hover:ring-teal-200"
                          )}
                        >
                          <CardContent className="p-5 h-full flex flex-col">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-3 mb-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-gray-800 leading-tight group-hover:text-teal-700 transition-colors">
                                    {member.name}
                                  </h3>

                                  <div className="flex flex-col gap-1 mt-2">
                                    {member.phones &&
                                      member.phones.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                          <Phone className="w-3 h-3" />
                                          <span>{member.phones[0]}</span>
                                          {member.phones.length > 1 && (
                                            <span className="bg-gray-100 px-1 rounded text-[10px]">
                                              +{member.phones.length - 1}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    {member.notes && (
                                      <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg self-start mt-1 border border-amber-100">
                                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-1">
                                          {member.notes}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                  {tel && (
                                    <Button
                                      asChild
                                      size="icon"
                                      variant="ghost"
                                      className="rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 w-10 h-10"
                                    >
                                      <a
                                        href={`tel:${tel}`}
                                        aria-label={`اتصال بـ ${member.name}`}
                                      >
                                        <Phone className="h-5 w-5" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <Button
                                  onClick={() =>
                                    toggleVisit(member.id, "visited")
                                  }
                                  variant="ghost"
                                  className={cn(
                                    "flex-1 rounded-xl border-2 h-12 font-bold transition-all duration-300",
                                    isVisited
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 shadow-lg"
                                      : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                                  )}
                                >
                                  <CheckCircle2
                                    className={cn("w-5 h-5 ml-1.5")}
                                  />
                                  تم
                                </Button>
                                <Button
                                  onClick={() =>
                                    toggleVisit(member.id, "not_visited")
                                  }
                                  variant="ghost"
                                  className={cn(
                                    "flex-1 rounded-xl border-2 h-12 font-bold transition-all duration-300",
                                    isNotVisited
                                      ? "bg-rose-500 border-rose-500 text-white shadow-rose-200 shadow-lg"
                                      : "bg-white border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                                  )}
                                >
                                  <XCircle className={cn("w-5 h-5 ml-1.5")} />
                                  لم يتم
                                </Button>
                              </div>

                              {/* Notes Expandable Area */}
                              <div className="mt-auto">
                                <AnimatePresence>
                                  {record && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-3 border-t border-gray-100/50">
                                        <div className="relative">
                                          <Textarea
                                            value={record.notes}
                                            onChange={(e) =>
                                              updateNotes(
                                                member.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder="ملاحظات إضافية..."
                                            className="min-h-[60px] bg-white/50 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-teal-500 rounded-xl resize-none text-sm"
                                          />
                                        </div>
                                        {(record.visited_by ||
                                          record.created_at) && (
                                          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-gray-400 font-medium">
                                            {record.visited_by && (
                                              <span>
                                                بواسطة{" "}
                                                {usersList.find(
                                                  (u) =>
                                                    u.id === record.visited_by
                                                )?.name || "مستخدم"}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          {/* Unassigned group */}
          {groupedByServant["__unassigned__"] &&
            groupedByServant["__unassigned__"].length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4 px-2 mt-8">
                  <h4 className="text-xl font-black text-slate-500">
                    بدون مسؤول
                  </h4>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                    {groupedByServant["__unassigned__"].length} طالب
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {groupedByServant["__unassigned__"].map((member) => {
                    const record = visits[member.id];
                    const isVisited = record?.status === "visited";
                    const isNotVisited = record?.status === "not_visited";
                    const tel =
                      member.phones && member.phones.length > 0
                        ? member.phones[0].replace(/\s+/g, "")
                        : null;
                    return (
                      <motion.div
                        key={member.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Card
                          className={cn(
                            "h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-3xl ring-1",
                            isVisited
                              ? "bg-gradient-to-br from-emerald-50 to-white ring-emerald-200"
                              : isNotVisited
                              ? "bg-gradient-to-br from-rose-50 to-white ring-rose-200"
                              : "bg-white ring-gray-200 hover:ring-gray-300"
                          )}
                        >
                          <CardContent className="p-5 h-full flex flex-col">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-3 mb-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-gray-800 leading-tight">
                                    {member.name}
                                  </h3>
                                  <div className="flex flex-col gap-1 mt-2">
                                    {member.phones &&
                                      member.phones.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                          <Phone className="w-3 h-3" />
                                          <span>{member.phones[0]}</span>
                                          {member.phones.length > 1 && (
                                            <span className="bg-gray-100 px-1 rounded text-[10px]">
                                              +{member.phones.length - 1}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    {member.notes && (
                                      <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg self-start mt-1 border border-amber-100">
                                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-1">
                                          {member.notes}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                  {tel && (
                                    <Button
                                      asChild
                                      size="icon"
                                      variant="ghost"
                                      className="rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 w-10 h-10"
                                    >
                                      <a
                                        href={`tel:${tel}`}
                                        aria-label={`اتصال بـ ${member.name}`}
                                      >
                                        <Phone className="h-5 w-5" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <Button
                                  onClick={() =>
                                    toggleVisit(member.id, "visited")
                                  }
                                  variant="ghost"
                                  className={cn(
                                    "flex-1 rounded-xl border-2 h-12 font-bold transition-all duration-300",
                                    isVisited
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 shadow-lg"
                                      : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                                  )}
                                >
                                  <CheckCircle2
                                    className={cn("w-5 h-5 ml-1.5")}
                                  />
                                  تم
                                </Button>
                                <Button
                                  onClick={() =>
                                    toggleVisit(member.id, "not_visited")
                                  }
                                  variant="ghost"
                                  className={cn(
                                    "flex-1 rounded-xl border-2 h-12 font-bold transition-all duration-300",
                                    isNotVisited
                                      ? "bg-rose-500 border-rose-500 text-white shadow-rose-200 shadow-lg"
                                      : "bg-white border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                                  )}
                                >
                                  <XCircle className={cn("w-5 h-5 ml-1.5")} />
                                  لم يتم
                                </Button>
                              </div>

                              {/* Notes Expandable Area */}
                              <div className="mt-auto">
                                <AnimatePresence>
                                  {record && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-3 border-t border-gray-100/50">
                                        <div className="relative">
                                          <Textarea
                                            value={record.notes}
                                            onChange={(e) =>
                                              updateNotes(
                                                member.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder="ملاحظات إضافية..."
                                            className="min-h-[60px] bg-white/50 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-teal-500 rounded-xl resize-none text-sm"
                                          />
                                        </div>
                                        {(record.visited_by ||
                                          record.created_at) && (
                                          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-gray-400 font-medium">
                                            {record.visited_by && (
                                              <span>
                                                بواسطة{" "}
                                                {usersList.find(
                                                  (u) =>
                                                    u.id === record.visited_by
                                                )?.name || "مستخدم"}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {Object.keys(visits).length > 0 && !saving && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none"
          >
            <Button
              onClick={saveVisits}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-2xl hover:shadow-teal-500/50 border border-white/20 backdrop-blur-md text-lg font-bold transition-all duration-300 transform hover:scale-105 pointer-events-auto"
            >
              <Save className="w-5 h-5 ml-2" />
              حفظ الافتقاد ({Object.keys(visits).length})
            </Button>
          </motion.div>
        )}
        {saving && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-black/80 text-white backdrop-blur-xl rounded-full shadow-2xl flex items-center gap-3"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            <span className="font-medium">جاري الحفظ...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
