import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Member {
  nia: string;
  name: string;
  photoUrl: string;
  urlId: string;
  status: string; // "Aktif" | "Tidak Aktif" | etc.
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description: string;
  status: "menunggu" | "berlangsung" | "selesai";
  order: number;
}

export interface AttendanceRecord {
  id: string;
  nia: string;
  name: string;
  photoUrl: string;
  timestamp: number;
  method: "offline" | "webview" | "manual";
}

export interface Candidate {
  id: string;
  name: string;
  nia: string;
  voteCount: number;
}

export interface Vote {
  voterNia: string;
  candidateId: string;
  timestamp: number;
}

interface Credentials {
  username: string;
  password: string;
}

interface AppContextType {
  isLoggedIn: boolean;
  members: Member[];
  attendance: AttendanceRecord[];
  candidates: Candidate[];
  votes: Vote[];
  votingOpen: boolean;
  eventName: string;
  totalSeats: number;
  agendaItems: AgendaItem[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  importMembers: (members: Member[]) => void;
  markAttendance: (
    member: Pick<Member, "nia" | "name" | "photoUrl">,
    method: "offline" | "webview" | "manual",
    status?: string
  ) => "success" | "duplicate" | "inactive";
  removeAttendance: (nia: string) => void;
  clearAttendance: () => void;
  findMemberByUrlId: (urlId: string) => Member | undefined;
  findMemberByNia: (nia: string) => Member | undefined;
  updateEventName: (name: string) => void;
  updateTotalSeats: (total: number) => void;
  updateCredentials: (username: string, password: string) => void;
  addCandidate: (name: string, nia: string) => void;
  removeCandidate: (id: string) => void;
  castVote: (voterNia: string, candidateId: string) => "success" | "duplicate" | "not_present" | "voting_closed";
  toggleVoting: () => void;
  clearVotes: () => void;
  updateAgendaStatus: (id: string, status: AgendaItem["status"]) => void;
  addAgendaItem: (item: Omit<AgendaItem, "id">) => void;
  removeAgendaItem: (id: string) => void;
  resetAgenda: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  members: "@peradi_members",
  attendance: "@peradi_attendance",
  credentials: "@peradi_credentials",
  eventName: "@peradi_event_name",
  totalSeats: "@peradi_total_seats",
  candidates: "@peradi_candidates",
  votes: "@peradi_votes",
  votingOpen: "@peradi_voting_open",
  agendaItems: "@peradi_agenda_items",
};

const DEFAULT_AGENDA: AgendaItem[] = [
  { id: "ag-01", order: 1, time: "08.00", title: "Pendaftaran & Registrasi Peserta", description: "Registrasi dan pengambilan kartu peserta", status: "menunggu" },
  { id: "ag-02", order: 2, time: "09.00", title: "Pembukaan Musyawarah Cabang", description: "Sambutan Ketua DPC PERADI SAI Medan & laporan kepanitian", status: "menunggu" },
  { id: "ag-03", order: 3, time: "09.30", title: "Sidang Pleno I — Pengesahan Kuorum", description: "Verifikasi kuorum 50%+1 dari peserta yang sah", status: "menunggu" },
  { id: "ag-04", order: 4, time: "10.00", title: "Sidang Pleno II — Tata Tertib", description: "Pengesahan tata tertib Musyawarah Cabang", status: "menunggu" },
  { id: "ag-05", order: 5, time: "10.30", title: "Sidang Pleno III — LPJ Pengurus", description: "Laporan Pertanggungjawaban Pengurus DPC periode 2019–2024", status: "menunggu" },
  { id: "ag-06", order: 6, time: "12.00", title: "Ishoma", description: "Istirahat, Sholat, dan Makan Siang", status: "menunggu" },
  { id: "ag-07", order: 7, time: "13.00", title: "Sidang Pleno IV — Program Kerja", description: "Penyusunan program kerja DPC periode berikutnya", status: "menunggu" },
  { id: "ag-08", order: 8, time: "14.00", title: "Pemilihan Ketua DPC (E-Voting)", description: "Pemilihan Ketua DPC PERADI SAI Medan periode 2025–2030", status: "menunggu" },
  { id: "ag-09", order: 9, time: "15.00", title: "Pelantikan & Serah Terima Jabatan", description: "Pelantikan Ketua terpilih dan serah terima jabatan", status: "menunggu" },
  { id: "ag-10", order: 10, time: "15.30", title: "Penutupan", description: "Doa penutup dan foto bersama", status: "menunggu" },
];

const DEFAULT_CREDENTIALS: Credentials = {
  username: "admin",
  password: "peradi2024",
};

const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: "cand-001",
    name: "Supriono, S.H.",
    nia: "24.10740",
    voteCount: 0,
  },
];

function normalizeId(id: string): string {
  return id.replace(/[.\-\s]/g, "").toLowerCase();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [credentials, setCredentials] = useState<Credentials>(DEFAULT_CREDENTIALS);
  const [eventName, setEventName] = useState<string>("Musyawarah Cabang DPC PERADI SAI Medan");
  const [totalSeats, setTotalSeats] = useState<number>(0);
  const [candidates, setCandidates] = useState<Candidate[]>(DEFAULT_CANDIDATES);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [votingOpen, setVotingOpen] = useState<boolean>(false);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(DEFAULT_AGENDA);

  useEffect(() => {
    const load = async () => {
      try {
        const [membersData, attendanceData, credData, evName, seats, candData, voteData, votingOpenData, agendaData] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.members),
            AsyncStorage.getItem(STORAGE_KEYS.attendance),
            AsyncStorage.getItem(STORAGE_KEYS.credentials),
            AsyncStorage.getItem(STORAGE_KEYS.eventName),
            AsyncStorage.getItem(STORAGE_KEYS.totalSeats),
            AsyncStorage.getItem(STORAGE_KEYS.candidates),
            AsyncStorage.getItem(STORAGE_KEYS.votes),
            AsyncStorage.getItem(STORAGE_KEYS.votingOpen),
            AsyncStorage.getItem(STORAGE_KEYS.agendaItems),
          ]);

        if (membersData) setMembers(JSON.parse(membersData));
        if (attendanceData) setAttendance(JSON.parse(attendanceData));
        if (credData) setCredentials(JSON.parse(credData));
        if (evName) setEventName(evName);
        if (seats) setTotalSeats(parseInt(seats, 10));
        if (candData) setCandidates(JSON.parse(candData));
        if (voteData) setVotes(JSON.parse(voteData));
        if (votingOpenData) setVotingOpen(votingOpenData === "true");
        if (agendaData) setAgendaItems(JSON.parse(agendaData));
      } catch {}
    };
    load();
  }, []);

  const login = useCallback(
    (username: string, password: string): boolean => {
      if (
        username.trim() === credentials.username &&
        password === credentials.password
      ) {
        setIsLoggedIn(true);
        return true;
      }
      return false;
    },
    [credentials]
  );

  const logout = useCallback(() => setIsLoggedIn(false), []);

  const importMembers = useCallback(async (newMembers: Member[]) => {
    setMembers(newMembers);
    await AsyncStorage.setItem(STORAGE_KEYS.members, JSON.stringify(newMembers));
  }, []);

  const markAttendance = useCallback(
    (
      member: Pick<Member, "nia" | "name" | "photoUrl">,
      method: "offline" | "webview" | "manual",
      status?: string
    ): "success" | "duplicate" | "inactive" => {
      // Check status from member record if not provided
      let memberStatus = status;
      if (!memberStatus) {
        setMembers((prev) => {
          const found = prev.find(
            (m) => normalizeId(m.nia) === normalizeId(member.nia)
          );
          if (found) memberStatus = found.status;
          return prev;
        });
      }

      if (
        memberStatus &&
        memberStatus.toLowerCase() !== "aktif" &&
        memberStatus !== ""
      ) {
        return "inactive";
      }

      let isDuplicate = false;
      setAttendance((prev) => {
        const exists = prev.some(
          (r) => normalizeId(r.nia) === normalizeId(member.nia)
        );
        if (exists) {
          isDuplicate = true;
          return prev;
        }
        const record: AttendanceRecord = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          nia: member.nia,
          name: member.name,
          photoUrl: member.photoUrl,
          timestamp: Date.now(),
          method,
        };
        const updated = [record, ...prev];
        AsyncStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(updated));
        return updated;
      });
      return isDuplicate ? "duplicate" : "success";
    },
    []
  );

  const removeAttendance = useCallback((nia: string) => {
    setAttendance((prev) => {
      const updated = prev.filter(
        (r) => normalizeId(r.nia) !== normalizeId(nia)
      );
      AsyncStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAttendance = useCallback(async () => {
    setAttendance([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.attendance);
  }, []);

  const findMemberByUrlId = useCallback(
    (urlId: string): Member | undefined => {
      const normalUrlId = normalizeId(urlId);
      return members.find(
        (m) =>
          normalizeId(m.urlId) === normalUrlId ||
          normalizeId(m.nia) === normalUrlId
      );
    },
    [members]
  );

  const findMemberByNia = useCallback(
    (nia: string): Member | undefined => {
      const norm = normalizeId(nia);
      return members.find(
        (m) => normalizeId(m.nia) === norm || normalizeId(m.urlId) === norm
      );
    },
    [members]
  );

  const updateEventName = useCallback(async (name: string) => {
    setEventName(name);
    await AsyncStorage.setItem(STORAGE_KEYS.eventName, name);
  }, []);

  const updateTotalSeats = useCallback(async (total: number) => {
    setTotalSeats(total);
    await AsyncStorage.setItem(STORAGE_KEYS.totalSeats, total.toString());
  }, []);

  const updateCredentials = useCallback(
    async (username: string, password: string) => {
      const cred: Credentials = { username, password };
      setCredentials(cred);
      await AsyncStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(cred));
    },
    []
  );

  const addCandidate = useCallback(async (name: string, nia: string) => {
    const newCand: Candidate = {
      id: Date.now().toString(),
      name,
      nia,
      voteCount: 0,
    };
    setCandidates((prev) => {
      const updated = [...prev, newCand];
      AsyncStorage.setItem(STORAGE_KEYS.candidates, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCandidate = useCallback(async (id: string) => {
    setCandidates((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.candidates, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const castVote = useCallback(
    (voterNia: string, candidateId: string): "success" | "duplicate" | "not_present" | "voting_closed" => {
      if (!votingOpen) return "voting_closed";

      let result: "success" | "duplicate" | "not_present" = "success";

      setAttendance((att) => {
        const isPresent = att.some((r) => normalizeId(r.nia) === normalizeId(voterNia));
        if (!isPresent) {
          result = "not_present";
          return att;
        }
        return att;
      });

      if (result === "not_present") return "not_present";

      setVotes((prev) => {
        const alreadyVoted = prev.some((v) => normalizeId(v.voterNia) === normalizeId(voterNia));
        if (alreadyVoted) {
          result = "duplicate";
          return prev;
        }
        const vote: Vote = { voterNia, candidateId, timestamp: Date.now() };
        const updated = [...prev, vote];
        AsyncStorage.setItem(STORAGE_KEYS.votes, JSON.stringify(updated));
        return updated;
      });

      if (result === "duplicate") return "duplicate";

      setCandidates((prev) => {
        const updated = prev.map((c) =>
          c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c
        );
        AsyncStorage.setItem(STORAGE_KEYS.candidates, JSON.stringify(updated));
        return updated;
      });

      return "success";
    },
    [votingOpen]
  );

  const toggleVoting = useCallback(async () => {
    setVotingOpen((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEYS.votingOpen, next.toString());
      return next;
    });
  }, []);

  const clearVotes = useCallback(async () => {
    setVotes([]);
    setCandidates((prev) => prev.map((c) => ({ ...c, voteCount: 0 })));
    await AsyncStorage.removeItem(STORAGE_KEYS.votes);
  }, []);

  const updateAgendaStatus = useCallback(async (id: string, status: AgendaItem["status"]) => {
    setAgendaItems((prev) => {
      const updated = prev.map((item) => item.id === id ? { ...item, status } : item);
      AsyncStorage.setItem(STORAGE_KEYS.agendaItems, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addAgendaItem = useCallback(async (item: Omit<AgendaItem, "id">) => {
    const newItem: AgendaItem = { ...item, id: `ag-${Date.now()}` };
    setAgendaItems((prev) => {
      const updated = [...prev, newItem].sort((a, b) => a.order - b.order);
      AsyncStorage.setItem(STORAGE_KEYS.agendaItems, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeAgendaItem = useCallback(async (id: string) => {
    setAgendaItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.agendaItems, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetAgenda = useCallback(async () => {
    setAgendaItems(DEFAULT_AGENDA);
    await AsyncStorage.setItem(STORAGE_KEYS.agendaItems, JSON.stringify(DEFAULT_AGENDA));
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        members,
        attendance,
        candidates,
        votes,
        votingOpen,
        eventName,
        totalSeats,
        agendaItems,
        login,
        logout,
        importMembers,
        markAttendance,
        removeAttendance,
        clearAttendance,
        findMemberByUrlId,
        findMemberByNia,
        updateEventName,
        updateTotalSeats,
        updateCredentials,
        addCandidate,
        removeCandidate,
        castVote,
        toggleVoting,
        clearVotes,
        updateAgendaStatus,
        addAgendaItem,
        removeAgendaItem,
        resetAgenda,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
