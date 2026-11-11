import "./global.css";
import "./media.css";
import { LanguageProvider, SiteHeader } from "./language";

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <title>IT-College</title>
      </head>

      <body>

        <LanguageProvider>
          <SiteHeader />
          {children}
        </LanguageProvider>

      </body>
    </html>
  );
}
