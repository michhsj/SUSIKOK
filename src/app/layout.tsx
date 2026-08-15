import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// -----------------------------------------------
// 폰트 설정
// -----------------------------------------------
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
  preload: true,
});

// -----------------------------------------------
// 사이트 기본 정보
// -----------------------------------------------
const siteConfig = {
  name: "수시KOK",
  nameEn: "SusiKOK",
  tagline: "Admissions Strategy",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.susikok.kr",
  title: "수시KOK | 학생부 기반 대학별 환산점수 분석 서비스",
  shortTitle: "수시KOK",
  description:
    "수시KOK는 학교생활기록부 성적을 바탕으로 대학별 반영 기준에 맞는 환산점수를 계산하고, 대학 발표 기준과 비교하여 수시 지원 전략 수립에 필요한 참고 정보를 제공하는 입시 분석 서비스입니다.",
  keywords: [
    "수시KOK",
    "수시 분석",
    "학생부 성적",
    "학생부 환산점수",
    "대학별 환산점수",
    "학생부교과 분석",
    "대입 컨설팅",
    "입시 컨설팅",
    "수시 지원 전략",
    "수시 지원 가능성",
    "대학 지원 분석",
    "입시 분석 서비스",
    "학생부교과 전형",
    "수시 합격 가능성",
    "대학별 반영 기준",
  ],
  locale: "ko_KR",
  email: "michhsj@susikok.kr",
  phone: "02-1234-5678",
  businessHours: "평일 09:00 - 18:00",
  ogImage: "/images/og/susikok-main-og.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: "수시KOK - 학생부 기반 대학별 환산점수 분석 서비스",
  themeColorLight: "#0f172a",
  themeColorDark: "#020617",
};

// -----------------------------------------------
// Metadata
// -----------------------------------------------
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),

  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },

  description: siteConfig.description,
  applicationName: siteConfig.name,
  referrer: "origin-when-cross-origin",
  keywords: siteConfig.keywords,

  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],

  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "education",

  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
        alt: siteConfig.ogImageAlt,
        type: "image/jpeg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        alt: siteConfig.ogImageAlt,
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },

  manifest: "/site.webmanifest",

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? "",
    other: {
      "naver-site-verification":
        process.env.NEXT_PUBLIC_NAVER_VERIFICATION ?? "",
    },
  },

  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": siteConfig.name,
  },
};

// -----------------------------------------------
// Viewport
// -----------------------------------------------
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: siteConfig.themeColorLight,
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: siteConfig.themeColorDark,
    },
  ],
};

// -----------------------------------------------
// JSON-LD : Organization
// -----------------------------------------------
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  url: siteConfig.url,
  logo: {
    "@type": "ImageObject",
    url: `${siteConfig.url}/icon-512.png`,
    width: 512,
    height: 512,
  },
  description: siteConfig.description,
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: siteConfig.phone,
      contactType: "customer support",
      availableLanguage: ["Korean"],
      email: siteConfig.email,
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    },
  ],
  sameAs: [siteConfig.url],
};

// -----------------------------------------------
// JSON-LD : WebSite
// -----------------------------------------------
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#website`,
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: "ko-KR",
  publisher: {
    "@id": `${siteConfig.url}/#organization`,
  },
  potentialAction: [
    {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  ],
};

// -----------------------------------------------
// JSON-LD : WebPage
// -----------------------------------------------
const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${siteConfig.url}/#webpage`,
  url: siteConfig.url,
  name: siteConfig.title,
  description: siteConfig.description,
  inLanguage: "ko-KR",
  isPartOf: {
    "@id": `${siteConfig.url}/#website`,
  },
  publisher: {
    "@id": `${siteConfig.url}/#organization`,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: siteConfig.url,
      },
    ],
  },
};

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// -----------------------------------------------
// RootLayout
// -----------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ko" className={`${notoSansKr.variable} scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>

      <body
        className={`
          ${notoSansKr.className}
          min-h-screen
          bg-white
          text-slate-900
          antialiased
          selection:bg-blue-100
          selection:text-blue-900
        `}
      >
        {/* JSON-LD 구조화 데이터 */}
        <script
          id="jsonld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationJsonLd),
          }}
        />
        <script
          id="jsonld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(websiteJsonLd),
          }}
        />
        <script
          id="jsonld-webpage"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(webPageJsonLd),
          }}
        />

        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              id="ga-gtag"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                    send_page_view: true
                  });
                `,
              }}
            />
          </>
        )}

        {/* 접근성 : 본문 바로가기 */}
        <a
          href="#main-content"
          className="
            sr-only
            focus:not-sr-only
            focus:fixed
            focus:left-4
            focus:top-4
            focus:z-[100]
            focus:rounded-xl
            focus:bg-slate-950
            focus:px-4
            focus:py-3
            focus:text-sm
            focus:font-semibold
            focus:text-white
            focus:shadow-[0_8px_24px_rgba(15,23,42,0.30)]
          "
        >
          본문 바로가기
        </a>

        {/* 전역 래퍼 */}
        <div id="root-wrapper" className="relative isolate min-h-screen">
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
