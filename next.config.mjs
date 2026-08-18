import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Kein eslint-Setup in diesem Prototyp (kein .eslintrc, keine
  // eslint-Abhängigkeit in package.json) — ohne diese Zeile würde
  // `next build` beim ersten Lauf interaktiv nach einer ESLint-Konfig
  // fragen bzw. in CI/nicht-interaktiven Umgebungen daran scheitern.
  // Für den Prototyp bewusst deaktiviert statt ein Lint-Setup
  // nachzuziehen, das nicht angefragt war.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
