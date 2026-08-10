import { PrismaClient, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo12345";

// Realistic but clearly fictional sample data. No real people.
const demoResumeContent = {
  personalInfo: {
    fullName: "Alex Rivera",
    title: "Senior Frontend Developer",
    email: DEMO_EMAIL,
    phone: "+1 (555) 010-2048",
    location: "Austin, TX",
    website: "alexrivera.dev",
    linkedin: "linkedin.com/in/alexrivera-demo",
    github: "github.com/alexrivera-demo",
    photoUrl: "",
  },
  summary: {
    text: "Senior Frontend Developer with 7+ years building accessible, performant web applications. Specializes in React, TypeScript, and design systems, partnering closely with product and design to ship polished user experiences.",
    yearsOfExperience: "7",
    targetJobTitle: "Senior Frontend Developer",
    industry: "SaaS",
  },
  experiences: [
    {
      id: "exp-1",
      company: "Northwind Labs",
      jobTitle: "Senior Frontend Developer",
      location: "Remote",
      startDate: "Jan 2021",
      endDate: "",
      current: true,
      description:
        "Led the frontend for a B2B analytics platform used by mid-market teams.",
      achievements: [
        "Rebuilt the dashboard with React and TypeScript, improving Lighthouse performance scores.",
        "Established a reusable component library adopted across three product teams.",
        "Mentored four engineers through code review and pairing.",
      ],
    },
    {
      id: "exp-2",
      company: "Brightside Software",
      jobTitle: "Frontend Developer",
      location: "Austin, TX",
      startDate: "Jun 2017",
      endDate: "Dec 2020",
      current: false,
      description:
        "Built customer-facing features for a subscription commerce product.",
      achievements: [
        "Shipped a redesigned checkout flow that reduced drop-off.",
        "Introduced automated accessibility checks into CI.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of Texas at Austin",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "2013",
      endDate: "2017",
      gpa: "3.8",
      description: "",
    },
  ],
  skills: {
    technical: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
    soft: ["Communication", "Mentoring"],
    tools: ["Git", "Figma", "Webpack"],
    frameworks: ["Next.js", "Tailwind CSS", "Node.js"],
    languages: [],
  },
  projects: [
    {
      id: "proj-1",
      name: "OpenSchedule",
      description:
        "An open-source scheduling widget with timezone-aware availability.",
      technologies: ["React", "TypeScript", "Vite"],
      url: "",
      githubUrl: "github.com/alexrivera-demo/openschedule",
      startDate: "2022",
      endDate: "",
    },
  ],
  certifications: [],
  languages: [
    { id: "lang-1", language: "English", proficiency: "Native" },
    { id: "lang-2", language: "Spanish", proficiency: "Fluent" },
  ],
  achievements: [
    {
      id: "ach-1",
      title: "Internal Hackathon Winner",
      description: "Built a prototype accessibility linter in 24 hours.",
      date: "2023",
    },
  ],
};

const DEMO_DOC_TEXT = `Quarterly Business Review — Q3 2024

Executive Overview
Revenue for Q3 2024 reached $4.2 million, a 18% increase over Q2. Net new customers grew by 240, bringing the total customer base to 3,120 accounts. Gross margin improved to 74%.

Key Initiatives
The team launched the new analytics dashboard on August 12, 2024, which contributed to a 9% increase in daily active users. Customer support response time decreased from 6 hours to 2 hours after hiring three additional agents.

Risks and Challenges
Churn among small-business accounts remains elevated at 4.1% monthly. The engineering team flagged technical debt in the billing service as a risk to the Q4 roadmap. A key vendor contract expires on December 31, 2024 and must be renegotiated.

Recommendations
1. Invest in onboarding to reduce small-business churn.
2. Allocate two engineers to refactor the billing service before the end of Q4.
3. Begin vendor renegotiation no later than November 15, 2024.

Financial Outlook
The finance team projects Q4 revenue of $4.9 million, contingent on closing the enterprise pipeline valued at $1.3 million.`;

async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Alex Rivera",
      hashedPassword,
      subscription: { create: { plan: Plan.FREE } },
    },
  });

  const resumeCount = await prisma.resume.count({ where: { userId: user.id } });
  if (resumeCount === 0) {
    await prisma.resume.create({
      data: {
        userId: user.id,
        name: "Senior Frontend Developer",
        template: "modern",
        content: demoResumeContent,
        atsScore: 88,
      },
    });
    console.log("Created demo resume.");
  }

  const docCount = await prisma.document.count({ where: { userId: user.id } });
  if (docCount === 0) {
    await prisma.document.create({
      data: {
        userId: user.id,
        filename: "Q3-2024-business-review.txt",
        fileType: "txt",
        fileSize: Buffer.byteLength(DEMO_DOC_TEXT, "utf-8"),
        extractedText: DEMO_DOC_TEXT,
        status: "READY",
      },
    });
    console.log("Created demo document.");
  }

  console.log(`\nSeed complete.\n  Login: ${DEMO_EMAIL}\n  Password: ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
