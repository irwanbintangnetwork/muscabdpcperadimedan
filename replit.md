# Peradi Hadir

Aplikasi mobile presensi digital untuk Musyawarah Cabang DPC Peradi SAI — scan barcode KTA anggota, catat kehadiran, pantau kuorum real-time.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- **Mobile: Expo SDK 54 (React Native) — artifacts/peradi-hadir**

## Where things live

- `artifacts/peradi-hadir/` — Expo mobile app (presensi Peradi)
- `artifacts/peradi-hadir/contexts/AppContext.tsx` — Global state (auth, members, attendance)
- `artifacts/peradi-hadir/app/(tabs)/index.tsx` — QR Scanner screen
- `artifacts/peradi-hadir/app/(tabs)/dashboard.tsx` — Kuorum dashboard
- `artifacts/peradi-hadir/app/(tabs)/log.tsx` — Daftar presensi
- `artifacts/peradi-hadir/app/(tabs)/settings.tsx` — Pengaturan + impor CSV

## Architecture decisions

- **Frontend-only (AsyncStorage)**: Tidak ada backend DB — semua data tersimpan lokal di perangkat via AsyncStorage
- **Hybrid offline/webview**: Jika member ditemukan di CSV lokal → tampil langsung; jika tidak → fallback buka website DPN via expo-web-browser
- **URL ID extraction**: NIA/ID diekstrak dari URL barcode (path segment terakhir), dicocokkan dengan atau tanpa titik
- **Double-scan protection**: Sistem cek NIA yang sudah tercatat sebelum konfirmasi hadir
- **expo-camera CameraView**: Barcode scanner menggunakan expo-camera v17 (Expo Go compatible)

## Product

- **Login Panitia**: Username/password (default: admin/peradi2024), bisa diubah
- **Scan QR Barcode**: Kamera real-time, auto-detect QR code dari KTA Peradi
- **Database Lokal (Opsi 2)**: Import CSV berisi NIA, Nama, Foto URL, URL ID
- **WebView Fallback (Opsi 3)**: Jika member tidak ada di CSV, buka website DPN
- **Dashboard Kuorum**: Total terdaftar, hadir, persentase, status kuorum 50%
- **Log Presensi**: Daftar semua yang hadir, bisa search, hapus, ekspor CSV
- **Proteksi Double Scan**: Anggota yang sudah hadir ditandai dengan warning

## Format CSV Import

```
NIA,NAMA,FOTO_URL,URL_ID
24.10136,Irwan SH,https://example.com/foto.jpg,12345
```

FOTO_URL dan URL_ID opsional. Jika URL_ID kosong, NIA digunakan sebagai pencocokan.

## User preferences

- Bahasa Indonesia untuk UI aplikasi
- Fokus pada kelancaran presensi Muscab DPC Peradi SAI
- Output ke GitHub (push kode), bukan build APK langsung

## Gotchas

- Scan QR hanya berfungsi di perangkat Android/iOS (via Expo Go). Di web preview hanya tersedia input manual NIA.
- Untuk scan real di perangkat: download Expo Go → scan QR code dari menu Replit
- expo-camera versi ~17.0.10 untuk kompatibilitas Expo SDK 54/55
- expo-file-system diimpor secara dinamis di log.tsx (export function) untuk menghindari error web

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
