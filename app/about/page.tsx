import type { Metadata } from "next";
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { getAboutPage, getSiteSettings } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { PageHeader } from "../components/PageHeader";
import { Credit } from "../components/Credit";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPage();
  return { title: "About", description: about.intro };
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="mt-10 font-display text-xl font-semibold text-gray-900 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-6 font-display text-lg font-semibold text-gray-900">{children}</h3>,
    normal: ({ children }) => <p className="mt-3 text-[15px] leading-relaxed text-gray-700 md:text-base">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="mt-3 space-y-2.5">{children}</ul>,
    number: ({ children }) => <ol className="mt-3 list-decimal space-y-2.5 pl-5">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex gap-3 text-[15px] leading-relaxed text-gray-700 md:text-base">
        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" aria-hidden />
        <span>{children}</span>
      </li>
    ),
    number: ({ children }) => <li className="text-[15px] leading-relaxed text-gray-700 md:text-base">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#";
      const cls = "font-medium text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy";
      return href.startsWith("/") ? (
        <Link href={href} className={cls}>
          {children}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noreferrer" className={cls}>
          {children}
        </a>
      );
    },
  },
};

export default async function AboutPage() {
  const [about, settings] = await Promise.all([getAboutPage(), getSiteSettings()]);
  const { stats } = settings;

  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="About" />

      <div className="max-w-3xl">
        <section className="rounded-[20px] bg-navy p-6 text-white shadow-md md:p-8">
          <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">{about.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-indigo-100 md:text-lg">{about.intro}</p>
        </section>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          <Stat value="13" label="congresses since 1987" />
          <Stat value={stats.totalRecords} label="legislative records" />
          <Stat value={stats.currentCongressBills} label="bills this Congress" />
        </dl>
        {stats.asOf && <p className="mt-1.5 text-right text-[11px] text-gray-400">Figures as of {formatDate(stats.asOf)}</p>}

        <article className="mt-8">
          <PortableText value={about.body} components={components} />
        </article>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/receipts" className="rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900">
            Start searching
          </Link>
          <Link href="/press" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:ring-navy/40">
            Press kit
          </Link>
        </div>
        <Credit className="mt-8" />
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-gray-200/70 md:p-4">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-xl font-semibold text-navy md:text-2xl">{value}</span>
        <span className="mt-0.5 block text-[11px] leading-tight text-gray-500 md:text-xs">{label}</span>
      </dd>
    </div>
  );
}
