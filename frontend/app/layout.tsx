import "./globals.css";

import { AuthProvider } from "@/providers/auth-provider";

export const metadata = {

title: "Trade Journal",

description: "Modern trading dashboard",

};

export default function RootLayout({ children }: { children: React.ReactNode }) {

return (

<html lang="en" suppressHydrationWarning>

<body>

<AuthProvider>{children}</AuthProvider>

</body>

</html>

);

}