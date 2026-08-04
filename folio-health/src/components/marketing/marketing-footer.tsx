import Link from "next/link"
import { Logo } from "@/components/common/logo"
import { MailIcon, PhoneIcon } from "lucide-react"

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Modules", href: "#modules" },
      { label: "Patient Portal", href: "/portal" },
      { label: "Sign In", href: "/login" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "/help" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "/help" },
      { label: "Support", href: "/help" },
    ],
  },
]

function MarketingFooter() {
  return (
    <footer className="bg-[#0a1224] text-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-14 sm:px-8 lg:flex-row lg:justify-between">
        <div className="flex max-w-xs flex-col gap-4">
          <Logo size={26} tone="inverted" />
          <p className="text-sm text-white/50">
            A modern hospital information system built to make patient care simpler for every
            department, every role.
          </p>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <a href="mailto:hello@foliohealth.example" className="flex items-center gap-2 hover:text-white">
              <MailIcon className="size-4" />
              hello@foliohealth.example
            </a>
            <a href="tel:+15551234567" className="flex items-center gap-2 hover:text-white">
              <PhoneIcon className="size-4" />
              +1 (555) 123-4567
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-white">{col.heading}</p>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/50 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/40 sm:px-8">
        &copy; {new Date().getFullYear()} Folio Health EMR. All rights reserved.
      </div>
    </footer>
  )
}

export { MarketingFooter }
