// Profile data — sourced from the Flutter project's lib/config.dart
export const PROFILE = {
  name: "Saksham Nirula",
  role: "Business Analyst | A.I. Enthusiast",
  email: "nirulasaksham@gmail.com",
  phone: "+1 (972) 951-9382",
  resumeUrl:
    "https://drive.google.com/file/d/1hZjV_jAI-RJr-kRGeIuAaMnFVqfvhV_Y/view?usp=sharing",
  linkedinUrl: "https://www.linkedin.com/in/sakshamn/",
  githubUrl: "https://github.com/saakibuilt",
  summary:
    "Business Analyst with hands-on experience delivering analytics, AI/ML, and process improvement solutions across operations and product environments. Skilled in translating business requirements into scalable technical solutions, managing cross-functional stakeholders, building KPI dashboards, optimizing SQL and reporting workflows, supporting Agile delivery, and driving measurable outcomes in efficiency, adoption, customer satisfaction, and revenue impact. Currently pursuing a Master's of Science in Business Analytics and Artificial Intelligence.",
};

export const EXPERIENCE = [
  {
    role: "Business Tuning Analyst",
    company: "TTA Systems",
    duration: "Nov 2024 — Feb 2026",
    details:
      "Optimized SQL queries and data pipelines, reducing execution time by 74% and improving data availability for operational decision-making. Developed predictive routing models that enhanced delivery efficiency by 15% and contributed to $8M+ in annual cost savings. Built anomaly detection solutions in Python to improve data accuracy by 30% and reduce operational disruptions by 20%. Delivered 5+ cross-functional analytics projects to improve shipment visibility and increase client satisfaction by 25%, while automating KPI dashboards in Power BI and Tableau to reduce manual reporting effort by 40%.",
    stats: [
      { percent: 74, title: "Query Time Reduction", color: "#5BFFA5" },
      { percent: 15, title: "Delivery Efficiency", color: "#4FC3F7" },
      { percent: 40, title: "Reporting Automation", color: "#B388FF" },
    ],
  },
  {
    role: "Business Analyst",
    company: "Micro A.I.",
    duration: "Feb 2022 — Oct 2024",
    details:
      "Managed 8+ end-to-end AI/ML projects with budgets exceeding $2M, delivering solutions that drove up to $20M+ in client revenue impact. Led Agile Scrum delivery to improve sprint velocity by 20% and reduce project timelines by 15%. Directed UAT and product validation to increase system adoption by 35%, translated business requirements into scalable technical solutions to improve process efficiency by 25% and reduce rework by 30%, and implemented workflow and UX enhancements that increased customer conversion rates by 10-15%.",
    stats: [
      { percent: 20, title: "Sprint Velocity Increase", color: "#FFB74D" },
      { percent: 35, title: "System Adoption Increase", color: "#64FFDA" },
      { percent: 25, title: "Process Efficiency", color: "#FFD166" },
    ],
  },
];

// Projects mirror the Flutter ProjectsConfig exactly: path + link + isMobile only.
// The Flutter app shows no text titles — the project name lives in the image itself.
export const PROJECTS = [
  { path: "assets/projects/1.png", link: "https://drive.google.com/file/d/1FtEHP2h_b5R09cXQCgkbLxd6klWOlCQ_/view?usp=drive_link", title: "", isMobile: false },
  { path: "assets/projects/mobile1.png", link: "https://apps.apple.com/us/app/rentudio/id6744241494", title: "", isMobile: true },
  { path: "assets/projects/2.png", link: "https://docs.google.com/document/d/1DfVDSOh_SCKetBoDFiEu0L-5JeCZE65YA_AiOn7wQNk/edit?usp=drive_link", title: "", isMobile: true },
  { path: "assets/projects/3.png", link: "https://docs.google.com/document/d/1uiGZ8P-rX6Ur9S79mSpVET7wa6E5fN5_shl-mY2HcHA/edit?usp=drive_link", title: "", isMobile: false },
  { path: "assets/projects/4.png", link: "https://docs.google.com/document/d/1Fc6tsG4kZ_5ku4gVKmjeCAsAYgJuT4BTEu_Kz3efBS4/edit?usp=drive_link", title: "", isMobile: false },
  { path: "assets/projects/5.png", link: "", title: "", isMobile: true },
  { path: "assets/projects/6.png", link: "", title: "", isMobile: false },
  { path: "assets/projects/7.png", link: "https://github.com/saakibuilt/SaakiAI/blob/main/README.md", title: "", isMobile: false },
  { path: "assets/projects/8.png", link: "https://github.com/saakibuilt/Kalshi-Bot", title: "", isMobile: false },
  { path: "assets/projects/9.png", link: "https://github.com/saakibuilt/Samar-A.I.", title: "", isMobile: false },
];

export const CERTIFICATIONS = [
  { path: "assets/certifications/1.png", title: "Certification", accent: "#FFD166" },
  { path: "assets/certifications/2.png", title: "Certification", accent: "#00E5FF" },
  { path: "assets/certifications/3.png", title: "Certification", accent: "#B388FF" },
];

export const CERT_NAMES = [
  "Tableau Desktop",
  "Microsoft Excel",
  "Salesforce Media Cloud Applications",
  "AWS Solutions Architect: Professional",
  "Databricks Data Engineer",
];

export const SKILLS = [
  "SQL", "Power BI", "Tableau", "Oracle", "MySQL", "ETL",
  "Predictive Analytics", "Statistical Analysis", "A/B Testing",
  "Forecasting", "Classification", "Clustering", "NLP", "Transformers",
  "Feature Engineering", "Data Mining", "Business Analysis",
  "Stakeholder Mgmt", "Agile Scrum", "Kanban", "SAFe", "JIRA",
  "Confluence", "Product Mgmt", "Roadmapping", "OKR / KPI",
  "Lean Six Sigma", "Root Cause Analysis", "Change Mgmt",
  "Risk Mgmt", "Data Governance", "UAT", "Automation",
];

export const EDUCATION = [
  {
    degree: "M.S. Business Analytics & Artificial Intelligence",
    school: "University of the Cumberlands",
    duration: "Aug 2026 — May 2027",
    location: "Denton, TX",
  },
  {
    degree: "Dual B.S. Business Analytics & Marketing",
    school: "University of North Texas (UNT)",
    duration: "Aug 2020 — Dec 2022",
    location: "Denton, TX",
  },
];

export const HOBBIES = [
  "Soccer", "Fitness", "Volleyball", "Traveling",
  "Restaurants", "Cooking", "Video Games", "Movies",
];
