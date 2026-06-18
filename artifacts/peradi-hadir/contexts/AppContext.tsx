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
};

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

  useEffect(() => {
    const load = async () => {
      try {
        const [membersData, attendanceData, credData, evName, seats, candData, voteData, votingOpenData] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.members),
            AsyncStorage.getItem(STORAGE_KEYS.attendance),
            AsyncStorage.getItem(STORAGE_KEYS.credentials),
            AsyncStorage.getItem(STORAGE_KEYS.eventName),
            AsyncStorage.getItem(STORAGE_KEYS.totalSeats),
            AsyncStorage.getItem(STORAGE_KEYS.candidates),
            AsyncStorage.getItem(STORAGE_KEYS.votes),
            AsyncStorage.getItem(STORAGE_KEYS.votingOpen),
          ]);

        if (membersData) setMembers(JSON.parse(membersData));
        if (attendanceData) setAttendance(JSON.parse(attendanceData));
        if (credData) setCredentials(JSON.parse(credData));
        if (evName) setEventName(evName);
        if (seats) setTotalSeats(parseInt(seats, 10));
        if (candData) setCandidates(JSON.parse(candData));
        if (voteData) setVotes(JSON.parse(voteData));
        if (votingOpenData) setVotingOpen(votingOpenData === "true");
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
