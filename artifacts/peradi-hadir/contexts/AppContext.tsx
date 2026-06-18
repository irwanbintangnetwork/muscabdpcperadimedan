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
}

export interface AttendanceRecord {
  id: string;
  nia: string;
  name: string;
  photoUrl: string;
  timestamp: number;
  method: "offline" | "webview" | "manual";
}

interface Credentials {
  username: string;
  password: string;
}

interface AppContextType {
  isLoggedIn: boolean;
  members: Member[];
  attendance: AttendanceRecord[];
  eventName: string;
  totalSeats: number;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  importMembers: (members: Member[]) => void;
  markAttendance: (
    member: Pick<Member, "nia" | "name" | "photoUrl">,
    method: "offline" | "webview" | "manual"
  ) => "success" | "duplicate";
  removeAttendance: (nia: string) => void;
  clearAttendance: () => void;
  findMemberByUrlId: (urlId: string) => Member | undefined;
  findMemberByNia: (nia: string) => Member | undefined;
  updateEventName: (name: string) => void;
  updateTotalSeats: (total: number) => void;
  updateCredentials: (username: string, password: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  members: "@peradi_members",
  attendance: "@peradi_attendance",
  credentials: "@peradi_credentials",
  eventName: "@peradi_event_name",
  totalSeats: "@peradi_total_seats",
};

const DEFAULT_CREDENTIALS: Credentials = {
  username: "admin",
  password: "peradi2024",
};

function normalizeId(id: string): string {
  return id.replace(/[.\-\s]/g, "").toLowerCase();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [credentials, setCredentials] =
    useState<Credentials>(DEFAULT_CREDENTIALS);
  const [eventName, setEventName] = useState<string>(
    "Musyawarah Cabang DPC Peradi SAI"
  );
  const [totalSeats, setTotalSeats] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [membersData, attendanceData, credData, evName, seats] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.members),
            AsyncStorage.getItem(STORAGE_KEYS.attendance),
            AsyncStorage.getItem(STORAGE_KEYS.credentials),
            AsyncStorage.getItem(STORAGE_KEYS.eventName),
            AsyncStorage.getItem(STORAGE_KEYS.totalSeats),
          ]);

        if (membersData) setMembers(JSON.parse(membersData));
        if (attendanceData) setAttendance(JSON.parse(attendanceData));
        if (credData) setCredentials(JSON.parse(credData));
        if (evName) setEventName(evName);
        if (seats) setTotalSeats(parseInt(seats, 10));
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
    await AsyncStorage.setItem(
      STORAGE_KEYS.members,
      JSON.stringify(newMembers)
    );
  }, []);

  const markAttendance = useCallback(
    (
      member: Pick<Member, "nia" | "name" | "photoUrl">,
      method: "offline" | "webview" | "manual"
    ): "success" | "duplicate" => {
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

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        members,
        attendance,
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
