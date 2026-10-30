import ErrorDialog from "@/src/site/errorHandling/ErrorDialog";
import { theme } from "@/src/styles/theme";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router";

export default function RootLayout() {

  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Playground City</title>
        <meta name="application-name" content="Playground City" />
        <meta name="apple-mobile-web-app-title" content="Playground City" />
        <meta property="og:site_name" content="Playground City" />
        <meta property="og:title" content="Playground City" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Afacad:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Metrophobic&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=Metrophobic&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚇</text></svg>"></link>
        <ColorSchemeScript />
      </head>
      <body style={{ backgroundColor: theme.white }}>
        <ErrorBoundary FallbackComponent={ErrorDialog}>
          <Outlet />
        </ErrorBoundary>
      </body>
    </>
  );
}


