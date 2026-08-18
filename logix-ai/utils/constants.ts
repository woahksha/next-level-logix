export const BRAND = {
  name: "Logix AI",
  tagline: "Turn Empty Miles Into Profitable Miles.",
  description:
    "Logix AI is an intelligent logistics marketplace that matches shippers with available truck capacity in real time — cutting empty kilometres and helping transporters earn more on every route.",
} as const;

export const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For Transporters", href: "/transporter" },
  { label: "For Shippers", href: "/shipper" },
] as const;

// Realistic Indian freight corridors — used for mock data in later phases.
export const INDIAN_CITIES = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Surat",
  "Jaipur",
  "Lucknow",
  "Indore",
  "Nagpur",
  "Ludhiana",
  "Coimbatore",
  "Vadodara",
  "Visakhapatnam",
  "Guwahati",
  "Chandigarh",
  "Kochi",
] as const;
