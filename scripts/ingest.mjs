import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("chatbot");

const chunks = [
  {
    id: "intro",
    text: "Lauren Ruiz is a Computer Science graduate at Virginia Tech's College of Engineering. She is a first-generation college student and a Clark Scholar through the A. James & Alice B. Clark Foundation. She is passionate about technology, problem solving, software engineering, and creating opportunities for underrepresented students in STEM. Lauren grew up in Reston, Virginia and comes from a Bolivian family background. She has always enjoyed logic, math, and solving problems, which led her to pursue computer science.",
  },
  {
    id: "education",
    text: "Lauren attended Virginia Tech's College of Engineering, majoring in Computer Science with a GPA of 3.72, and graduated in May 2026. Relevant coursework includes Design & Data Structures (Java), Intro to Software Design (Java), Computer Organization (C/Linux), Problem Solving in Computer Science (Python/HTML), Statistics for Engineers, Foundations of Engineering (MATLAB).",
  },
  {
    id: "technical-skills",
    text: "Lauren's programming languages include Java, Python, C, JavaScript, HTML/CSS, SQL, and MATLAB. Her technologies and tools include React, Node.js, REST APIs, gRPC, Azure AI Services, Git/GitHub, Linux, Command Line Interfaces, Firebase/Firestore, and Netlify.",
  },
  {
    id: "parsons-experience",
    text: "Lauren interned as a Federal Intelligence Intern at Parsons Corporation in Centreville, VA during Summer 2024. She designed and implemented a command-line interface tool using Java, contributed to enterprise backend architecture, integrated gRPC for remote server communication, used dependency injection with Google Guice, worked with Apache Commons Exec, and developed experience with Linux environments and large-scale systems.",
  },
  {
    id: "project-mylabot",
    text: "Lauren built MylaBot, an AI chatbot using Azure AI Language Services and ChatGPT-based knowledge. She created a Python REST API backend, integrated the chatbot into her personal portfolio website, and designed it to answer questions about her background, experiences, and projects. Her personal website received 600+ unique visitors.",
  },
  {
    id: "project-portfolio",
    text: "Lauren built and deployed her personal portfolio website using React, HTML, CSS, and JavaScript. It features interactive animations, sidebar navigation with dynamic effects, GitHub and LinkedIn integration, custom loading animations, and an embedded AI chatbot. It is deployed on GitHub and Netlify.",
  },
  {
    id: "projects-other",
    text: "Lauren built BudgetBuddy, a Java Swing application focused on budgeting and personal finance management. She also built a Sunrise Lamp, an Arduino-based engineering project creating an automated sunrise simulation lamp.",
  },
  {
    id: "leadership-cs-careers",
    text: "Lauren is Social Media Chair for CS Careers at Virginia Tech, where she manages Instagram, LinkedIn, and Discord to share computer science opportunities and promote career development resources. She helps create inclusive spaces for women and underrepresented students in technology.",
  },
  {
    id: "leadership-consulting-mentor",
    text: "Lauren was selected as 1 of 12 associates from 90 applicants for the Consulting Group at Virginia Tech. She completed consulting associate training, participated in case competitions, and practiced 20+ mock case studies. She also serves as an Engineering Peer Mentor in the Hypatia Mentoring program, managing a group of 9 first-year engineering students with weekly check-ins.",
  },
  {
    id: "professional-programs",
    text: "Lauren has participated in several competitive professional programs: Google Latinx Student Leadership Summit, CodePath TIP Program, Deloitte First-Gen Mentorship Program, D.E. Shaw Latitude Fellowship, Standard Chartered Bank Spring Insight Program, and Walmart & Sam's Club Diversity Student Summit.",
  },
  {
    id: "career-interests",
    text: "Lauren is interested in software engineering, artificial intelligence, cloud computing, quantitative finance, technology consulting, and building products that have real-world impact. She enjoys combining technical skills with business strategy and communication.",
  },
  {
    id: "personal",
    text: "Outside of academics, Lauren enjoys traveling and sightseeing, hiking, reading, ceramics, baking, DIY projects, logic puzzles, fitness, and makeup and beauty. She loves her dog Myla, a Bichon Frise–Shih Tzu mix. Lauren describes herself as curious, driven, a problem solver, persistent, and someone who enjoys learning and challenging herself. Her personal motto is 'Never saying no to myself' — meaning she values perseverance and pushing herself toward opportunities.",
  },
];

async function ingest() {
  console.log("Generating embeddings with llama-text-embed-v2...");

  const texts = chunks.map((c) => c.text);
  const embeddings = await pc.inference.embed({
    model: "llama-text-embed-v2",
    inputs: texts,
    parameters: { inputType: "passage", truncate: "END" },
  });

  const vectors = chunks.map((chunk, i) => ({
    id: chunk.id,
    values: embeddings.data[i].values,
    metadata: { text: chunk.text },
  }));

  console.log(`Upserting ${vectors.length} vectors into Pinecone...`);
  await index.upsert({ records: vectors });
  console.log("Done! Knowledge base loaded into Pinecone.");
}

ingest().catch(console.error);
