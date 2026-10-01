import { redirect } from "next/navigation";

// Root admin: langsung arahkan ke login. Dashboard & halaman lain di-handle
// oleh guard masing-masing setelah autentikasi.
export default function HomePage() {
  redirect("/login");
}
