/**
 * TargetRank – Phase 10.1 Step 2
 * Complete Exam Syllabus Database Seed
 * Covers: UPSC, BPSC, JPSC, UPPSC, SSC CGL, Banking, Railway, Defence
 * No questions added – syllabus skeleton only.
 *
 * Usage:
 *   node seeds/seedCompleteExamSyllabus.js            (upsert / idempotent)
 *   node seeds/seedCompleteExamSyllabus.js --reset    (wipe & re-seed)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam     from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject  from '../models/Subject.js';
import Topic    from '../models/Topic.js';
import Subtopic from '../models/Subtopic.js';
import User     from '../models/User.js';

dotenv.config();

const DO_RESET = process.argv.includes('--reset');

// ─── Slug helper ───────────────────────────────────────────────────────────────
const slugify = (t) =>
  t.toString().toLowerCase().trim()
   .replace(/\s+/g, '-')
   .replace(/[^\w\-]+/g, '')
   .replace(/\-\-+/g, '-');

// ─── Counters ─────────────────────────────────────────────────────────────────
let C = { exams: 0, phases: 0, subjects: 0, topics: 0, subtopics: 0 };

// ─── Upsert helpers ────────────────────────────────────────────────────────────
let ADMIN_ID;

async function upsertExam(data) {
  const slug = slugify(data.title);
  const doc  = await Exam.findOneAndUpdate(
    { slug },
    { ...data, slug, createdBy: ADMIN_ID, active: true, isPublished: true, isArchived: false },
    { upsert: true, new: true, runValidators: false }
  );
  C.exams++;
  return doc;
}

async function upsertPhase(examId, title, order) {
  const slug = slugify(title);
  const doc  = await ExamPhase.findOneAndUpdate(
    { examId, slug },
    { examId, title, slug, order, description: `${title} stage`, active: true, isPublished: true, isArchived: false, createdBy: ADMIN_ID },
    { upsert: true, new: true, runValidators: false }
  );
  C.phases++;
  return doc;
}

async function upsertSubject(examId, phaseId, title, order, weightage = 'medium') {
  const slug = slugify(title);
  const doc  = await Subject.findOneAndUpdate(
    { examId, phaseId, slug },
    { examId, phaseId, title, slug, description: title, order, estimatedWeightage: weightage,
      active: true, isPublished: true, isArchived: false, createdBy: ADMIN_ID },
    { upsert: true, new: true, runValidators: false }
  );
  C.subjects++;
  return doc;
}

/**
 * topics: array of { title, desc, weightage, hours, priority, subtopics: [{ title, desc, weightage, hours, priority }] }
 */
async function upsertTopics(examId, phaseId, subjectId, topics) {
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    const slug = slugify(t.title);
    const topicDoc = await Topic.findOneAndUpdate(
      { subjectId, slug },
      {
        examId, phaseId, subjectId, title: t.title, slug,
        description: t.desc || t.title,
        estimatedWeightage: t.weightage || 'medium',
        estimatedStudyHours: t.hours || 3,
        priority: t.priority || 5,
        questionTarget: t.qTarget || 80,
        pyqTarget: t.pyqTarget || 8,
        order: i + 1, displayOrder: i + 1,
        active: true, isPublished: true, isArchived: false, createdBy: ADMIN_ID,
      },
      { upsert: true, new: true, runValidators: false }
    );
    C.topics++;

    if (t.subtopics && t.subtopics.length) {
      for (let j = 0; j < t.subtopics.length; j++) {
        const st = typeof t.subtopics[j] === 'string'
          ? { title: t.subtopics[j] }
          : t.subtopics[j];
        const stSlug = slugify(st.title);
        await Subtopic.findOneAndUpdate(
          { topicId: topicDoc._id, slug: stSlug },
          {
            examId, phaseId, subjectId, topicId: topicDoc._id,
            title: st.title, slug: stSlug,
            description: st.desc || st.title,
            estimatedWeightage: st.weightage || t.weightage || 'medium',
            estimatedStudyHours: st.hours || 1,
            priority: st.priority || t.priority || 5,
            questionTarget: st.qTarget || 30,
            pyqTarget: st.pyqTarget || 3,
            order: j + 1, displayOrder: j + 1, recommendedStudyOrder: j + 1,
            active: true, isPublished: true, isArchived: false, createdBy: ADMIN_ID,
          },
          { upsert: true, new: true, runValidators: false }
        );
        C.subtopics++;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYLLABUS DATA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. UPSC ──────────────────────────────────────────────────────────────────
const UPSC_SUBJECTS = {
  History: {
    weightage: 'high', order: 1,
    topics: [
      { title: 'Ancient India', weightage: 'high', hours: 8, priority: 9, qTarget: 150, pyqTarget: 20,
        subtopics: [
          { title: 'Prehistoric Period & Stone Age', weightage: 'low', hours: 1 },
          { title: 'Indus Valley Civilization', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Vedic Age (Early & Later)', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Mahajanapadas & Republics', weightage: 'medium', hours: 1 },
          { title: 'Mauryan Empire', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Post-Mauryan Period', weightage: 'medium', hours: 1 },
          { title: 'Gupta Empire & Golden Age', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Post-Gupta Period & Harshavardhana', weightage: 'low', hours: 1 },
        ]},
      { title: 'Medieval India', weightage: 'high', hours: 7, priority: 8, qTarget: 120, pyqTarget: 15,
        subtopics: [
          { title: 'Delhi Sultanate', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Mughal Empire', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Vijayanagara & Bahmani Kingdoms', weightage: 'medium', hours: 1 },
          { title: 'Maratha Empire', weightage: 'medium', hours: 1 },
          { title: 'Bhakti & Sufi Movement', weightage: 'high', hours: 1, priority: 8 },
        ]},
      { title: 'Modern India', weightage: 'high', hours: 10, priority: 9, qTarget: 150, pyqTarget: 20,
        subtopics: [
          { title: 'European Advent & British East India Company', weightage: 'medium', hours: 1 },
          { title: 'British Land Revenue Policies', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Revolt of 1857', weightage: 'high', hours: 1, priority: 9 },
          { title: 'Social & Religious Reform Movements', weightage: 'high', hours: 2, priority: 9 },
          { title: 'Indian National Congress (Formation & Growth)', weightage: 'high', hours: 1 },
          { title: 'Moderates & Extremists', weightage: 'medium', hours: 1 },
          { title: 'Revolutionary Nationalism', weightage: 'medium', hours: 1 },
          { title: 'Gandhian Era & Mass Movements', weightage: 'high', hours: 2, priority: 9 },
        ]},
      { title: 'Freedom Struggle & Independence', weightage: 'high', hours: 6, priority: 9, qTarget: 100, pyqTarget: 15,
        subtopics: [
          { title: 'Non-Cooperation Movement (1920-22)', weightage: 'high', hours: 1 },
          { title: 'Civil Disobedience Movement (1930)', weightage: 'high', hours: 1 },
          { title: 'Quit India Movement (1942)', weightage: 'high', hours: 1 },
          { title: 'INA & Subhas Chandra Bose', weightage: 'medium', hours: 1 },
          { title: 'Cabinet Mission & Partition', weightage: 'high', hours: 1 },
          { title: 'Constitution Constituent Assembly', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Art & Culture', weightage: 'high', hours: 8, priority: 8, qTarget: 100, pyqTarget: 12,
        subtopics: [
          { title: 'Indian Architecture (Ancient, Medieval, Colonial)', weightage: 'high', hours: 2 },
          { title: 'Sculptures & Cave Architecture', weightage: 'medium', hours: 1 },
          { title: 'Paintings (Ajanta, Mughal, Rajput)', weightage: 'high', hours: 2 },
          { title: 'Classical Dance Forms', weightage: 'high', hours: 1 },
          { title: 'Music Forms (Hindustani & Carnatic)', weightage: 'medium', hours: 1 },
          { title: 'Fairs, Festivals & Folk Traditions', weightage: 'medium', hours: 1 },
        ]},
    ]},
  Geography: {
    weightage: 'high', order: 2,
    topics: [
      { title: 'Physical Geography', weightage: 'high', hours: 8, priority: 9, qTarget: 120,
        subtopics: [
          { title: 'Geomorphology (Origin of Earth, Rocks)', weightage: 'medium', hours: 2 },
          { title: 'Earthquakes & Volcanism', weightage: 'high', hours: 2 },
          { title: 'Atmosphere & Air Masses', weightage: 'high', hours: 1 },
          { title: 'Precipitation & Hydrological Cycle', weightage: 'medium', hours: 1 },
          { title: 'Oceans & Ocean Currents', weightage: 'high', hours: 2 },
        ]},
      { title: 'Indian Geography', weightage: 'high', hours: 10, priority: 9, qTarget: 140,
        subtopics: [
          { title: 'Physiographic Divisions of India', weightage: 'high', hours: 2 },
          { title: 'Indian River Systems (Himalayan & Peninsular)', weightage: 'high', hours: 2 },
          { title: 'Soils of India', weightage: 'high', hours: 1 },
          { title: 'Natural Vegetation & Forest Types', weightage: 'high', hours: 1 },
          { title: 'Indian Monsoon Mechanism', weightage: 'high', hours: 2 },
          { title: 'Coasts & Islands', weightage: 'medium', hours: 1 },
          { title: 'Mineral Resources Distribution', weightage: 'medium', hours: 1 },
        ]},
      { title: 'World Geography', weightage: 'medium', hours: 5, priority: 6, qTarget: 80,
        subtopics: [
          { title: 'Continents & Major Physical Features', weightage: 'medium', hours: 1 },
          { title: 'Major Rivers of World', weightage: 'medium', hours: 1 },
          { title: 'Global Climate Zones', weightage: 'medium', hours: 1 },
          { title: 'Important Straits & Water Bodies', weightage: 'medium', hours: 1 },
          { title: 'World Biomes', weightage: 'low', hours: 1 },
        ]},
      { title: 'Climatology', weightage: 'medium', hours: 4, priority: 7,
        subtopics: [
          { title: 'Atmospheric Pressure Belts & Wind Systems', weightage: 'medium', hours: 1 },
          { title: 'Types of Rainfall', weightage: 'medium', hours: 1 },
          { title: 'Climate Classification (Koppen)', weightage: 'medium', hours: 1 },
          { title: 'Global Warming & Climate Change', weightage: 'high', hours: 1 },
        ]},
      { title: 'Oceanography', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Ocean Floor Features', weightage: 'medium', hours: 1 },
          { title: 'Ocean Currents & Their Effects', weightage: 'high', hours: 1 },
          { title: 'Marine Resources & Pollution', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Agriculture Geography', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Cropping Patterns & Agricultural Seasons', weightage: 'high', hours: 1 },
          { title: 'Irrigation Techniques & Water Management', weightage: 'high', hours: 1 },
          { title: 'Food Production & Distribution', weightage: 'medium', hours: 1 },
          { title: 'Green Revolution & New Agricultural Policies', weightage: 'high', hours: 1 },
        ]},
      { title: 'Mapping', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'National Parks, Wildlife Sanctuaries Location', weightage: 'high', hours: 1 },
          { title: 'International Borders & Important Places', weightage: 'high', hours: 1 },
          { title: 'Rivers, Dams, Power Plants Location', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Indian Polity': {
    weightage: 'high', order: 3,
    topics: [
      { title: 'Constitution', weightage: 'high', hours: 6, priority: 10, qTarget: 150, pyqTarget: 25,
        subtopics: [
          { title: 'Historical Background & Constituent Assembly', weightage: 'high', hours: 1 },
          { title: 'Preamble', weightage: 'high', hours: 1 },
          { title: 'Features of the Constitution', weightage: 'high', hours: 1 },
          { title: 'Schedules (1st to 12th)', weightage: 'high', hours: 1 },
          { title: 'Constitutional Amendments', weightage: 'high', hours: 2 },
        ]},
      { title: 'Fundamental Rights', weightage: 'high', hours: 5, priority: 10, qTarget: 100,
        subtopics: [
          { title: 'Articles 12-35: Right to Equality', weightage: 'high', hours: 1 },
          { title: 'Right to Freedom (Articles 19-22)', weightage: 'high', hours: 1 },
          { title: 'Right Against Exploitation (Articles 23-24)', weightage: 'medium', hours: 1 },
          { title: 'Right to Constitutional Remedies (Article 32)', weightage: 'high', hours: 1 },
          { title: 'Directive Principles of State Policy', weightage: 'high', hours: 1 },
          { title: 'Fundamental Duties (Article 51A)', weightage: 'medium', hours: 0.5 },
        ]},
      { title: 'Parliament', weightage: 'high', hours: 5, priority: 9, qTarget: 100,
        subtopics: [
          { title: 'Composition of Lok Sabha & Rajya Sabha', weightage: 'high', hours: 1 },
          { title: 'Legislative Procedures & Types of Bills', weightage: 'high', hours: 1 },
          { title: 'Parliamentary Committees', weightage: 'high', hours: 1 },
          { title: 'Special Powers of Rajya Sabha', weightage: 'medium', hours: 0.5 },
          { title: 'Anti-Defection Law (Tenth Schedule)', weightage: 'high', hours: 0.5 },
          { title: 'Parliamentary Privileges', weightage: 'medium', hours: 1 },
        ]},
      { title: 'President & Vice President', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Election Process & Qualifications', weightage: 'medium', hours: 0.5 },
          { title: 'Powers & Functions of President', weightage: 'high', hours: 1 },
          { title: 'Veto Powers (Absolute, Suspensive, Pocket)', weightage: 'high', hours: 1 },
          { title: 'Vice President: Role & Functions', weightage: 'medium', hours: 0.5 },
        ]},
      { title: 'Judiciary', weightage: 'high', hours: 5, priority: 9, qTarget: 100,
        subtopics: [
          { title: 'Supreme Court: Composition & Jurisdiction', weightage: 'high', hours: 1 },
          { title: 'Judicial Review & Judicial Activism', weightage: 'high', hours: 1 },
          { title: 'Public Interest Litigation (PIL)', weightage: 'high', hours: 1 },
          { title: 'High Courts & Subordinate Courts', weightage: 'medium', hours: 1 },
          { title: 'Tribunals (NGT, CAT, SAT etc.)', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Constitutional Bodies', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Election Commission of India', weightage: 'high', hours: 1 },
          { title: 'UPSC (Union Public Service Commission)', weightage: 'high', hours: 1 },
          { title: 'CAG (Comptroller & Auditor General)', weightage: 'high', hours: 1 },
          { title: 'Finance Commission', weightage: 'high', hours: 1 },
          { title: 'Attorney General of India', weightage: 'medium', hours: 0.5 },
          { title: 'National Commissions (SC, ST, BC)', weightage: 'medium', hours: 0.5 },
        ]},
      { title: 'Local Government', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: '73rd Amendment & Panchayati Raj', weightage: 'high', hours: 1.5 },
          { title: '74th Amendment & Urban Local Bodies', weightage: 'high', hours: 1.5 },
        ]},
      { title: 'Emergency Provisions', weightage: 'high', hours: 3, priority: 9,
        subtopics: [
          { title: 'National Emergency (Article 352)', weightage: 'high', hours: 1 },
          { title: "President's Rule (Article 356)", weightage: 'high', hours: 1 },
          { title: 'Financial Emergency (Article 360)', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Centre-State Relations & Federalism', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Legislative Relations', weightage: 'high', hours: 1 },
          { title: 'Administrative Relations', weightage: 'medium', hours: 1 },
          { title: 'Financial Relations', weightage: 'high', hours: 1 },
          { title: 'Inter-State Relations & Article 263', weightage: 'medium', hours: 1 },
        ]},
    ]},
  Economy: {
    weightage: 'high', order: 4,
    topics: [
      { title: 'Basics of Economy', weightage: 'high', hours: 4, priority: 8, qTarget: 100,
        subtopics: [
          { title: 'National Income (GDP, GNP, NNP)', weightage: 'high', hours: 1 },
          { title: 'Economic Growth vs. Development', weightage: 'medium', hours: 1 },
          { title: 'Poverty & Poverty Lines', weightage: 'high', hours: 1 },
          { title: 'Unemployment & MNREGA', weightage: 'high', hours: 1 },
        ]},
      { title: 'Inflation', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Types of Inflation (WPI, CPI)', weightage: 'high', hours: 1 },
          { title: 'Causes & Effects of Inflation', weightage: 'medium', hours: 1 },
          { title: 'Anti-Inflationary Measures', weightage: 'medium', hours: 1 },
          { title: 'Stagflation & Deflation', weightage: 'low', hours: 1 },
        ]},
      { title: 'Banking & Finance', weightage: 'high', hours: 6, priority: 9, qTarget: 120,
        subtopics: [
          { title: 'Reserve Bank of India & Functions', weightage: 'high', hours: 2 },
          { title: 'Monetary Policy & Instruments (CRR, SLR, Repo)', weightage: 'high', hours: 1 },
          { title: 'Commercial Banking & Priority Sector Lending', weightage: 'high', hours: 1 },
          { title: 'Non-Performing Assets (NPA)', weightage: 'high', hours: 1 },
          { title: 'Digital Banking & Payment Systems', weightage: 'high', hours: 1 },
        ]},
      { title: 'Fiscal Policy & Budget', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Union Budget: Structure & Terminology', weightage: 'high', hours: 1 },
          { title: 'Types of Deficits (Fiscal, Revenue, Primary)', weightage: 'high', hours: 1 },
          { title: 'FRBM Act & Fiscal Consolidation', weightage: 'medium', hours: 1 },
          { title: 'Government Expenditure & Receipts', weightage: 'medium', hours: 1 },
          { title: 'Public Debt Management', weightage: 'low', hours: 1 },
        ]},
      { title: 'Taxation', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Direct Taxes (Income Tax, Corporate Tax)', weightage: 'high', hours: 1 },
          { title: 'Indirect Taxes (GST Reforms)', weightage: 'high', hours: 2 },
          { title: 'Tax Reforms & Committees', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Agriculture Economy', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'MSP (Minimum Support Price)', weightage: 'high', hours: 1 },
          { title: 'Land Reforms & Tenancy', weightage: 'high', hours: 1 },
          { title: 'Agricultural Credit & NABARD', weightage: 'medium', hours: 1 },
          { title: 'Food Security & PDS', weightage: 'high', hours: 1 },
          { title: 'E-Agriculture & Technology', weightage: 'medium', hours: 1 },
        ]},
      { title: 'External Sector', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Balance of Payments & Trade', weightage: 'high', hours: 1 },
          { title: 'FDI & FPI', weightage: 'high', hours: 1 },
          { title: 'Exchange Rate & Currency', weightage: 'medium', hours: 1 },
          { title: 'WTO, IMF, World Bank Roles', weightage: 'high', hours: 1 },
        ]},
    ]},
  Environment: {
    weightage: 'high', order: 5,
    topics: [
      { title: 'Biodiversity', weightage: 'high', hours: 5, priority: 9, qTarget: 100,
        subtopics: [
          { title: 'Types of Biodiversity & Hotspots', weightage: 'high', hours: 1 },
          { title: 'Threats to Biodiversity', weightage: 'high', hours: 1 },
          { title: 'Conservation Methods (In-situ, Ex-situ)', weightage: 'high', hours: 1 },
          { title: 'Biodiversity Act 2002', weightage: 'medium', hours: 1 },
          { title: 'IUCN Red List & Protected Categories', weightage: 'high', hours: 1 },
        ]},
      { title: 'Climate Change', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Greenhouse Gases & Global Warming', weightage: 'high', hours: 1 },
          { title: 'Carbon Credits & Carbon Trading', weightage: 'medium', hours: 1 },
          { title: 'UNFCCC, Kyoto Protocol, Paris Agreement', weightage: 'high', hours: 1 },
          { title: 'Renewable Energy & Transition', weightage: 'high', hours: 1 },
          { title: 'Climate Change Adaptation & Mitigation', weightage: 'medium', hours: 1 },
        ]},
      { title: 'National Parks & Wildlife Sanctuaries', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Tiger Reserves (Project Tiger)', weightage: 'high', hours: 1 },
          { title: 'Elephant Reserves (Project Elephant)', weightage: 'medium', hours: 1 },
          { title: 'Marine Protected Areas', weightage: 'medium', hours: 1 },
          { title: 'Biosphere Reserves', weightage: 'high', hours: 1 },
        ]},
      { title: 'Environmental Laws', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Environment Protection Act (1986)', weightage: 'high', hours: 1 },
          { title: 'Wildlife Protection Act (1972)', weightage: 'high', hours: 1 },
          { title: 'Forest Rights Act (2006)', weightage: 'high', hours: 1 },
          { title: 'Coastal Regulation Zone (CRZ)', weightage: 'medium', hours: 0.5 },
          { title: 'National Green Tribunal (NGT)', weightage: 'high', hours: 0.5 },
        ]},
      { title: 'International Conventions', weightage: 'high', hours: 3, priority: 7,
        subtopics: [
          { title: 'CITES (Convention on International Trade)', weightage: 'high', hours: 1 },
          { title: 'Ramsar Convention (Wetlands)', weightage: 'high', hours: 1 },
          { title: 'Basel, Rotterdam, Stockholm Conventions', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Science & Technology': {
    weightage: 'high', order: 6,
    topics: [
      { title: 'Space Technology', weightage: 'high', hours: 5, priority: 9, qTarget: 80,
        subtopics: [
          { title: 'ISRO Missions & Satellites', weightage: 'high', hours: 1 },
          { title: 'Launch Vehicles (PSLV, GSLV, LVM)', weightage: 'high', hours: 1 },
          { title: 'International Space Exploration', weightage: 'medium', hours: 1 },
          { title: 'Remote Sensing & GPS Applications', weightage: 'medium', hours: 1 },
          { title: 'Chandrayaan & Mangalyaan Missions', weightage: 'high', hours: 1 },
        ]},
      { title: 'Biotechnology', weightage: 'high', hours: 5, priority: 8,
        subtopics: [
          { title: 'Genetic Engineering & CRISPR', weightage: 'high', hours: 1 },
          { title: 'GMO Crops & Biosafety', weightage: 'high', hours: 1 },
          { title: 'Stem Cells & Cloning', weightage: 'medium', hours: 1 },
          { title: 'Vaccines & Immunology', weightage: 'high', hours: 1 },
          { title: 'Biofuels & Biotechnology Applications', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Artificial Intelligence & IT', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'AI, ML, and Deep Learning Basics', weightage: 'high', hours: 1 },
          { title: 'Blockchain & Cryptocurrency', weightage: 'medium', hours: 1 },
          { title: 'Cybersecurity & Data Privacy', weightage: 'high', hours: 1 },
          { title: '5G, Internet of Things (IoT)', weightage: 'high', hours: 1 },
        ]},
      { title: 'Defence Technology', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Missiles & Weapons Systems', weightage: 'medium', hours: 1 },
          { title: 'India-built Warships & Aircraft', weightage: 'medium', hours: 1 },
          { title: 'Nuclear Programme & Doctrine', weightage: 'high', hours: 1 },
        ]},
      { title: 'Nanotechnology', weightage: 'low', hours: 2, priority: 4,
        subtopics: [
          { title: 'Nanotechnology Basics & Applications', weightage: 'low', hours: 1 },
          { title: 'Nanomaterials in Medicine & Industry', weightage: 'low', hours: 1 },
        ]},
      { title: 'Health Science', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Major Diseases (Communicable & Non-Communicable)', weightage: 'medium', hours: 1 },
          { title: 'India Health Missions (NHM, Ayushman Bharat)', weightage: 'high', hours: 1 },
          { title: 'Drug Regulation & FSSAI', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Current Affairs': {
    weightage: 'high', order: 7,
    topics: [
      { title: 'National Affairs', weightage: 'high', hours: 6, priority: 9, qTarget: 200,
        subtopics: [
          { title: 'Government Bills, Acts & Policies', weightage: 'high', hours: 2 },
          { title: 'Centre-State Conflicts & Governance Issues', weightage: 'medium', hours: 1 },
          { title: 'Social Issues (CAA, Article 370, NRC)', weightage: 'high', hours: 2 },
          { title: 'Infrastructure & Development Projects', weightage: 'medium', hours: 1 },
        ]},
      { title: 'International Affairs', weightage: 'high', hours: 5, priority: 8,
        subtopics: [
          { title: 'Geopolitics & Conflicts', weightage: 'high', hours: 2 },
          { title: 'Bilateral & Multilateral Agreements', weightage: 'high', hours: 1 },
          { title: 'International Summits (G20, BRICS, SCO)', weightage: 'high', hours: 1 },
          { title: 'UN & Its Agencies', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Economy & Finance Current Affairs', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Economic Survey & Budget Highlights', weightage: 'high', hours: 1 },
          { title: 'Global Economic Organisations & Indices', weightage: 'medium', hours: 1 },
          { title: 'Policy Changes & New Schemes', weightage: 'high', hours: 1 },
        ]},
      { title: 'Science & Technology Current Affairs', weightage: 'high', hours: 2, priority: 7,
        subtopics: [
          { title: 'Recent Discoveries & Missions', weightage: 'high', hours: 1 },
          { title: 'Technology Policy & Regulations', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Awards & Recognition', weightage: 'medium', hours: 2, priority: 5,
        subtopics: [
          { title: 'Nobel Prizes', weightage: 'medium', hours: 0.5 },
          { title: 'Bharat Ratna & Padma Awards', weightage: 'medium', hours: 0.5 },
          { title: 'International Awards (Oscars, Booker, etc.)', weightage: 'low', hours: 0.5 },
          { title: 'Sports Awards (Arjuna, Dronacharya, Khel Ratna)', weightage: 'low', hours: 0.5 },
        ]},
      { title: 'Government Schemes', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Welfare Schemes (Housing, Food, Health)', weightage: 'high', hours: 1 },
          { title: 'Financial Inclusion Schemes', weightage: 'high', hours: 1 },
          { title: 'Employment Schemes (PM-KISAN, MUDRA)', weightage: 'high', hours: 1 },
          { title: 'Education Schemes (NEP, PM-POSHAN)', weightage: 'medium', hours: 1 },
        ]},
    ]},
  Ethics: {
    weightage: 'high', order: 8,
    topics: [
      { title: 'Ethics Fundamentals', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Essence of Ethics & Moral Philosophy', weightage: 'high', hours: 1 },
          { title: 'Attitude & Aptitude', weightage: 'high', hours: 1 },
          { title: 'Integrity & Impartiality', weightage: 'high', hours: 1 },
          { title: 'Emotional Intelligence', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Ethics in Public Administration', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Civil Services Values & Code of Conduct', weightage: 'high', hours: 1 },
          { title: 'Probity in Governance', weightage: 'high', hours: 1 },
          { title: 'Laws, Rules & Regulations', weightage: 'medium', hours: 1 },
          { title: 'Work Culture & Accountability', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Moral Thinkers', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Gandhi, Ambedkar, Vivekananda Views', weightage: 'high', hours: 1 },
          { title: 'Western Philosophers (Kant, Rawls, Bentham)', weightage: 'medium', hours: 1 },
          { title: 'Case Studies in Ethics', weightage: 'high', hours: 1 },
        ]},
    ]},
  Essay: {
    weightage: 'high', order: 9,
    topics: [
      { title: 'Essay Writing Techniques', weightage: 'high', hours: 5, priority: 8,
        subtopics: [
          { title: 'Structure & Flow of Essay', weightage: 'high', hours: 1 },
          { title: 'Introduction & Conclusion Techniques', weightage: 'high', hours: 1 },
          { title: 'Balancing Views & Arguments', weightage: 'high', hours: 1 },
        ]},
      { title: 'Essay Topics: Social', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Gender Equality & Women Empowerment', weightage: 'high', hours: 1 },
          { title: 'Education Reform & NEP 2020', weightage: 'medium', hours: 1 },
          { title: 'Technology & Society', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Essay Topics: Political', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Democracy & Federalism', weightage: 'high', hours: 1 },
          { title: 'Judiciary & Judicial Reforms', weightage: 'medium', hours: 1 },
          { title: 'Electoral Reforms', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'International Relations': {
    weightage: 'high', order: 10,
    topics: [
      { title: 'India & Neighbours', weightage: 'high', hours: 5, priority: 9, qTarget: 100,
        subtopics: [
          { title: 'India-Pakistan Relations', weightage: 'high', hours: 1 },
          { title: 'India-China Relations', weightage: 'high', hours: 1 },
          { title: 'India-Nepal, Bhutan, Sri Lanka, Bangladesh', weightage: 'medium', hours: 1 },
          { title: 'SAARC & BIMSTEC', weightage: 'medium', hours: 1 },
          { title: 'India-Afghanistan & Central Asia', weightage: 'low', hours: 1 },
        ]},
      { title: 'India & Major Powers', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'India-USA Relations', weightage: 'high', hours: 1 },
          { title: 'India-Russia Relations', weightage: 'high', hours: 1 },
          { title: 'India-EU Relations', weightage: 'medium', hours: 1 },
          { title: 'India in Multilateral Forums (UN, G20, SCO)', weightage: 'high', hours: 1 },
        ]},
    ]},
  Governance: {
    weightage: 'high', order: 11,
    topics: [
      { title: 'E-Governance & Digital India', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Digital India Programme', weightage: 'high', hours: 1 },
          { title: 'e-Governance Initiatives (DigiLocker, AADHAAR)', weightage: 'high', hours: 1 },
          { title: 'Right to Information (RTI Act)', weightage: 'high', hours: 1 },
        ]},
      { title: 'Civil Services Reforms', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Lateral Entry & Competency Framework', weightage: 'medium', hours: 1 },
          { title: 'Second Administrative Reforms Commission', weightage: 'medium', hours: 1 },
          { title: 'Citizen Charter & Service Delivery', weightage: 'medium', hours: 1 },
        ]},
    ]},
  Agriculture: {
    weightage: 'high', order: 12,
    topics: [
      { title: 'Agricultural Reforms', weightage: 'high', hours: 4, priority: 8, qTarget: 80,
        subtopics: [
          { title: 'Land Reforms Post-Independence', weightage: 'high', hours: 1 },
          { title: 'Contract Farming & FPOs', weightage: 'medium', hours: 1 },
          { title: 'Agriculture Market Reforms (APMC, eNAM)', weightage: 'high', hours: 2 },
        ]},
      { title: 'Horticulture & Allied Sectors', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Animal Husbandry & Dairy', weightage: 'medium', hours: 1 },
          { title: 'Fisheries & Aquaculture', weightage: 'medium', hours: 1 },
          { title: 'Horticulture Crops & Value Addition', weightage: 'low', hours: 1 },
        ]},
    ]},
  'Internal Security': {
    weightage: 'high', order: 13,
    topics: [
      { title: 'Terrorism & Left Wing Extremism', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Types of Terrorism in India', weightage: 'high', hours: 1 },
          { title: 'Naxalism & Left Wing Extremism', weightage: 'high', hours: 1 },
          { title: 'Counter Terrorism Agencies (NIA, NSG)', weightage: 'high', hours: 1 },
          { title: 'UAPA & Anti-Terror Laws', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Border Security & Cyber Security', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Border Security Forces & Challenges', weightage: 'medium', hours: 1 },
          { title: 'Cyber Crime & Digital Security', weightage: 'high', hours: 1 },
          { title: 'Critical Infrastructure Protection', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Disaster Management': {
    weightage: 'medium', order: 14,
    topics: [
      { title: 'Types of Disasters', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Natural Disasters (Earthquakes, Floods, Cyclones)', weightage: 'high', hours: 1 },
          { title: 'Man-made Disasters & Industrial Accidents', weightage: 'medium', hours: 1 },
          { title: 'Chemical & Biological Disasters', weightage: 'low', hours: 1 },
        ]},
      { title: 'Disaster Management Framework', weightage: 'high', hours: 3, priority: 7,
        subtopics: [
          { title: 'National Disaster Management Act 2005 & NDMA', weightage: 'high', hours: 1 },
          { title: 'NDRF, SDRF, Civil Defence', weightage: 'medium', hours: 1 },
          { title: 'Sendai Framework & DRR', weightage: 'medium', hours: 1 },
        ]},
    ]},
  Society: {
    weightage: 'high', order: 15,
    topics: [
      { title: 'Social Issues in India', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Caste System & Social Exclusion', weightage: 'high', hours: 1 },
          { title: 'Gender Issues & Women Empowerment', weightage: 'high', hours: 1 },
          { title: 'Child Labour & Rights', weightage: 'medium', hours: 1 },
          { title: 'Communalism & Secularism', weightage: 'high', hours: 1 },
        ]},
      { title: 'Population & Migration', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Indian Demographic Profile', weightage: 'medium', hours: 1 },
          { title: 'Rural-Urban Migration', weightage: 'medium', hours: 1 },
          { title: 'Urbanisation & Smart Cities', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Art & Culture': {
    weightage: 'high', order: 16,
    topics: [
      { title: 'Indian Heritage Sites', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'UNESCO World Heritage Sites in India', weightage: 'high', hours: 1 },
          { title: 'ASI Protected Monuments', weightage: 'medium', hours: 1 },
          { title: 'Intangible Cultural Heritage', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Crafts & Textiles', weightage: 'medium', hours: 2, priority: 5,
        subtopics: [
          { title: 'GI-Tagged Products of India', weightage: 'high', hours: 1 },
          { title: 'Handloom Traditions & Weaving', weightage: 'low', hours: 1 },
        ]},
    ]},
};

const UPSC_CSAT_TOPICS = [
  { title: 'Reading Comprehension', weightage: 'high', hours: 10, priority: 10,
    subtopics: [
      { title: 'Finding Main Idea & Central Theme', weightage: 'high', hours: 2 },
      { title: 'Inference & Assumption Based Questions', weightage: 'high', hours: 2 },
      { title: 'Tone, Style & Author Intent', weightage: 'medium', hours: 2 },
      { title: 'Vocabulary in Context', weightage: 'medium', hours: 2 },
      { title: 'Paragraph Ordering', weightage: 'low', hours: 2 },
    ]},
  { title: 'Logical Reasoning', weightage: 'high', hours: 8, priority: 9,
    subtopics: [
      { title: 'Syllogism & Deductive Reasoning', weightage: 'high', hours: 2 },
      { title: 'Analytical Reasoning (Seating, Blood Relations)', weightage: 'high', hours: 2 },
      { title: 'Critical Reasoning (Strengthen/Weaken)', weightage: 'high', hours: 2 },
      { title: 'Statement & Assumptions/Conclusions', weightage: 'high', hours: 2 },
    ]},
  { title: 'Quantitative Aptitude', weightage: 'high', hours: 10, priority: 9,
    subtopics: [
      { title: 'Arithmetic (Ratio, Percentage, Profit-Loss)', weightage: 'high', hours: 3 },
      { title: 'Algebra (Linear & Quadratic)', weightage: 'medium', hours: 2 },
      { title: 'Number System & Properties', weightage: 'high', hours: 2 },
      { title: 'Geometry & Mensuration', weightage: 'medium', hours: 2 },
      { title: 'Statistics (Mean, Median, Mode, SD)', weightage: 'medium', hours: 1 },
    ]},
  { title: 'Data Interpretation', weightage: 'high', hours: 6, priority: 9,
    subtopics: [
      { title: 'Bar Graphs & Histograms', weightage: 'high', hours: 1.5 },
      { title: 'Line Charts & Trend Analysis', weightage: 'high', hours: 1.5 },
      { title: 'Pie Charts & Percentage Analysis', weightage: 'high', hours: 1.5 },
      { title: 'Tables & Caselets', weightage: 'high', hours: 1.5 },
    ]},
  { title: 'Decision Making', weightage: 'medium', hours: 4, priority: 7,
    subtopics: [
      { title: 'Administrative Decision Making', weightage: 'high', hours: 2 },
      { title: 'Ethical & Situational Judgment', weightage: 'high', hours: 2 },
    ]},
];

const UPSC_MAINS_GS = [
  {
    title: 'GS Paper 1 – Indian Heritage, History & Geography',
    weightage: 'high', hours: 20, priority: 10,
    subtopics: [
      { title: 'Indian Culture (Art, Literature, Architecture)', weightage: 'high', hours: 4 },
      { title: 'Modern Indian History (1857–Independence)', weightage: 'high', hours: 4 },
      { title: 'Post-independence Consolidation', weightage: 'medium', hours: 3 },
      { title: 'World History (WWI, WWII, Decolonisation)', weightage: 'medium', hours: 4 },
      { title: 'Indian Society & Diversity Issues', weightage: 'high', hours: 3 },
      { title: 'Physical Geography & Geophysical Phenomena', weightage: 'high', hours: 2 },
    ]},
  {
    title: 'GS Paper 2 – Governance, Constitution, Polity, IR',
    weightage: 'high', hours: 20, priority: 10,
    subtopics: [
      { title: 'Indian Constitution, Features & Amendments', weightage: 'high', hours: 4 },
      { title: 'Functions & Responsibilities of Union, States', weightage: 'high', hours: 3 },
      { title: 'Governance, Transparency & Accountability', weightage: 'high', hours: 3 },
      { title: 'Welfare Schemes & Government Policies', weightage: 'high', hours: 3 },
      { title: 'International Relations & Agreements', weightage: 'high', hours: 4 },
      { title: 'Bilateral, Regional & Global Groupings', weightage: 'medium', hours: 3 },
    ]},
  {
    title: 'GS Paper 3 – Economy, Environment, Science, Security',
    weightage: 'high', hours: 20, priority: 10,
    subtopics: [
      { title: 'Economy: Growth, Development, Employment', weightage: 'high', hours: 4 },
      { title: 'Agriculture, Irrigation & Water Management', weightage: 'high', hours: 3 },
      { title: 'Science & Technology Innovations', weightage: 'high', hours: 3 },
      { title: 'Environment, Ecology & Climate Change', weightage: 'high', hours: 3 },
      { title: 'Internal Security, Terrorism, Border Issues', weightage: 'high', hours: 4 },
      { title: 'Disaster Management & Resilience', weightage: 'medium', hours: 3 },
    ]},
  {
    title: 'GS Paper 4 – Ethics, Integrity & Aptitude',
    weightage: 'high', hours: 15, priority: 10,
    subtopics: [
      { title: 'Human Values & Moral Attitude', weightage: 'high', hours: 3 },
      { title: 'Civil Services Values & Ethics', weightage: 'high', hours: 3 },
      { title: 'Emotional Intelligence in Administration', weightage: 'medium', hours: 2 },
      { title: 'Case Studies in Ethical Decision Making', weightage: 'high', hours: 5 },
      { title: 'Contribution of Moral Thinkers & Philosophers', weightage: 'medium', hours: 2 },
    ]},
  {
    title: 'Essay Paper',
    weightage: 'high', hours: 10, priority: 9,
    subtopics: [
      { title: 'Section A: Abstract & Philosophical Essays', weightage: 'high', hours: 5 },
      { title: 'Section B: Social, Political & Economic Essays', weightage: 'high', hours: 5 },
    ]},
];

const UPSC_INTERVIEW = [
  { title: 'DAF (Detailed Application Form) Analysis', weightage: 'high', hours: 6, priority: 10,
    subtopics: [
      { title: 'Educational Background & Projects', weightage: 'high', hours: 2 },
      { title: 'Hobbies & Extracurricular Activities', weightage: 'medium', hours: 1 },
      { title: 'Native District & State GK', weightage: 'high', hours: 3 },
    ]},
  { title: 'Personality & Leadership Questions', weightage: 'high', hours: 5, priority: 9,
    subtopics: [
      { title: 'Self-Introduction & Motivation for Civil Services', weightage: 'high', hours: 1 },
      { title: 'Strengths, Weaknesses & Self-Assessment', weightage: 'medium', hours: 1 },
      { title: 'Leadership Experiences', weightage: 'high', hours: 1 },
      { title: 'Hypothetical Situation Questions', weightage: 'high', hours: 2 },
    ]},
  { title: 'Current Affairs for Interview', weightage: 'high', hours: 4, priority: 9,
    subtopics: [
      { title: 'Recent Government Decisions', weightage: 'high', hours: 1 },
      { title: 'Social Issues & Government Response', weightage: 'high', hours: 1 },
      { title: 'International Affairs & India', weightage: 'medium', hours: 1 },
      { title: 'Opinion-based Questions', weightage: 'high', hours: 1 },
    ]},
  { title: 'Ethics in Interview', weightage: 'high', hours: 3, priority: 9,
    subtopics: [
      { title: 'Ethical Dilemmas & Your Approach', weightage: 'high', hours: 1.5 },
      { title: 'Probity & Anti-Corruption Stance', weightage: 'high', hours: 1.5 },
    ]},
];

// ─── 2. STATE PSC COMMON SUBJECTS ────────────────────────────────────────────
function makeStatePSCTopics(stateName, regions, rivers, stateCapital, famousDistricts) {
  return [
    { title: 'History', weightage: 'high', hours: 6, priority: 9,
      subtopics: [
        { title: `Ancient History of ${stateName}`, weightage: 'medium', hours: 1 },
        { title: `Medieval History of ${stateName}`, weightage: 'medium', hours: 1 },
        { title: `Modern History & Freedom Movement in ${stateName}`, weightage: 'high', hours: 2 },
        { title: `Post-Independence Development in ${stateName}`, weightage: 'medium', hours: 1 },
        { title: `Famous Historical Personalities of ${stateName}`, weightage: 'high', hours: 1 },
      ]},
    { title: 'Geography', weightage: 'high', hours: 5, priority: 8,
      subtopics: [
        { title: `Physiographic Features of ${stateName}`, weightage: 'high', hours: 1 },
        { title: `Rivers of ${stateName}: ${rivers.join(', ')}`, weightage: 'high', hours: 1 },
        { title: `Climate & Natural Vegetation`, weightage: 'medium', hours: 1 },
        { title: `Districts & Regions: ${regions.join(', ')}`, weightage: 'high', hours: 1 },
        { title: `Minerals & Natural Resources`, weightage: 'medium', hours: 1 },
      ]},
    { title: 'Economy', weightage: 'high', hours: 4, priority: 8,
      subtopics: [
        { title: `Agriculture in ${stateName}`, weightage: 'high', hours: 1 },
        { title: `Industries & Industrialisation in ${stateName}`, weightage: 'medium', hours: 1 },
        { title: `${stateName} Budget & Economic Survey`, weightage: 'high', hours: 1 },
        { title: `Poverty, Unemployment & Development Indicators`, weightage: 'medium', hours: 1 },
      ]},
    { title: 'Culture & Heritage', weightage: 'medium', hours: 4, priority: 7,
      subtopics: [
        { title: `Art, Craft & Handicrafts of ${stateName}`, weightage: 'medium', hours: 1 },
        { title: `Fairs & Festivals of ${stateName}`, weightage: 'medium', hours: 1 },
        { title: `Languages & Literature`, weightage: 'low', hours: 1 },
        { title: `Folk Dances & Music of ${stateName}`, weightage: 'low', hours: 1 },
      ]},
    { title: 'Government Schemes', weightage: 'high', hours: 3, priority: 9,
      subtopics: [
        { title: `Central Schemes applicable to ${stateName}`, weightage: 'high', hours: 1 },
        { title: `State-specific Schemes of ${stateName}`, weightage: 'high', hours: 1 },
        { title: `Social Welfare Programs`, weightage: 'medium', hours: 1 },
      ]},
    { title: 'Current Affairs', weightage: 'high', hours: 4, priority: 10,
      subtopics: [
        { title: `${stateName} Political Developments`, weightage: 'high', hours: 1 },
        { title: `${stateName} Economic News`, weightage: 'high', hours: 1 },
        { title: `National Current Affairs`, weightage: 'high', hours: 1 },
        { title: `International Affairs`, weightage: 'medium', hours: 1 },
      ]},
  ];
}

// ─── SSC CGL ──────────────────────────────────────────────────────────────────
const SSC_SUBJECTS = {
  'General Intelligence & Reasoning': {
    weightage: 'high', order: 1,
    topics: [
      { title: 'Analogy', weightage: 'high', hours: 3, priority: 9,
        subtopics: [
          { title: 'Word Analogy', weightage: 'high', hours: 1 },
          { title: 'Number Analogy', weightage: 'high', hours: 1 },
          { title: 'Letter Analogy', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Series', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Number Series', weightage: 'high', hours: 1 },
          { title: 'Letter Series', weightage: 'high', hours: 1 },
          { title: 'Mixed Series', weightage: 'medium', hours: 1 },
          { title: 'Missing Number', weightage: 'high', hours: 1 },
        ]},
      { title: 'Blood Relations', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Family Tree Problems', weightage: 'high', hours: 1 },
          { title: 'Coded Blood Relations', weightage: 'high', hours: 1 },
          { title: 'Pointing-Based Relations', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Directions & Distance', weightage: 'medium', hours: 2, priority: 7,
        subtopics: [
          { title: 'Shortest Distance', weightage: 'high', hours: 1 },
          { title: 'Final Direction', weightage: 'high', hours: 1 },
        ]},
      { title: 'Coding Decoding', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Letter Coding', weightage: 'high', hours: 1 },
          { title: 'Number Coding', weightage: 'high', hours: 1 },
          { title: 'Mixed Coding', weightage: 'medium', hours: 1 },
          { title: 'Operation Based Coding', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Puzzles', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Seating Arrangement (Linear)', weightage: 'high', hours: 1 },
          { title: 'Seating Arrangement (Circular)', weightage: 'high', hours: 1 },
          { title: 'Matrix & Grid Puzzles', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Syllogism', weightage: 'high', hours: 3, priority: 9,
        subtopics: [
          { title: 'All, Some, No – Possibilities', weightage: 'high', hours: 1 },
          { title: 'Venn Diagram Method', weightage: 'high', hours: 1 },
          { title: 'Negative Statements', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Venn Diagram', weightage: 'medium', hours: 2, priority: 7,
        subtopics: [
          { title: 'Identifying Relations Using Venn Diagram', weightage: 'high', hours: 1 },
          { title: 'Triple Set Venn Diagram', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Non-Verbal Reasoning', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Mirror Images', weightage: 'high', hours: 1 },
          { title: 'Paper Folding & Cutting', weightage: 'medium', hours: 1 },
          { title: 'Embedded Figures', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'General Awareness': {
    weightage: 'high', order: 2,
    topics: [
      { title: 'History (Static GK)', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Ancient Civilizations & Indian History', weightage: 'high', hours: 2 },
          { title: 'Medieval & Mughal Period', weightage: 'high', hours: 1 },
          { title: 'Freedom Movement & Important Events', weightage: 'high', hours: 1 },
        ]},
      { title: 'Geography (Static GK)', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'India & World Geography Basics', weightage: 'high', hours: 1.5 },
          { title: 'Important Rivers, Mountains, Cities', weightage: 'medium', hours: 1.5 },
        ]},
      { title: 'Polity & Constitution', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Constitutional Bodies & Articles', weightage: 'high', hours: 1.5 },
          { title: 'Government Structure & Schemes', weightage: 'medium', hours: 1.5 },
        ]},
      { title: 'Economy (Static GK)', weightage: 'medium', hours: 2, priority: 6,
        subtopics: [
          { title: 'Budget Basics & Economic Terms', weightage: 'medium', hours: 1 },
          { title: 'Banking, Taxation & Schemes', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Science (Static GK)', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Physics: Fundamental Laws & Units', weightage: 'high', hours: 1 },
          { title: 'Chemistry: Periodic Table, Acids & Bases', weightage: 'high', hours: 1 },
          { title: 'Biology: Human Body, Diseases, Plants', weightage: 'high', hours: 1 },
          { title: 'Computer Fundamentals', weightage: 'medium', hours: 1 },
          { title: 'Space, Environment & Recent Discoveries', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Current Affairs', weightage: 'high', hours: 3, priority: 10,
        subtopics: [
          { title: 'Awards & Honours', weightage: 'medium', hours: 1 },
          { title: 'Government Schemes & Initiatives', weightage: 'high', hours: 1 },
          { title: 'International Events', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Quantitative Aptitude': {
    weightage: 'high', order: 3,
    topics: [
      { title: 'Number System', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'HCF & LCM', weightage: 'high', hours: 1 },
          { title: 'Divisibility Rules', weightage: 'high', hours: 1 },
          { title: 'Unit Digit & Last Two Digits', weightage: 'medium', hours: 1 },
          { title: 'Cyclicity & Remainder Theorem', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Percentage & Applications', weightage: 'high', hours: 3, priority: 9,
        subtopics: [
          { title: 'Basic Percentage Calculations', weightage: 'high', hours: 1 },
          { title: 'Population Growth & Depreciation', weightage: 'medium', hours: 1 },
          { title: 'Successive Percentage Change', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Ratio & Proportion', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Ratio Basics & Applications', weightage: 'high', hours: 1 },
          { title: 'Proportion: Direct & Inverse', weightage: 'high', hours: 1 },
          { title: 'Mixtures & Alligation', weightage: 'high', hours: 1 },
        ]},
      { title: 'Average', weightage: 'medium', hours: 2, priority: 7,
        subtopics: [
          { title: 'Simple Average', weightage: 'high', hours: 1 },
          { title: 'Weighted Average', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Profit & Loss', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Basic Profit-Loss Calculations', weightage: 'high', hours: 1 },
          { title: 'Marked Price & Discount', weightage: 'high', hours: 1 },
          { title: 'Dishonest Dealer Problems', weightage: 'medium', hours: 1 },
          { title: 'Successive Profit-Loss', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Simple Interest & Compound Interest', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Simple Interest Formula & Applications', weightage: 'high', hours: 1 },
          { title: 'Compound Interest: Annual, Half-Yearly', weightage: 'high', hours: 1 },
          { title: 'Difference Between SI & CI', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Time, Work & Pipes', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Work Done in Fixed Time', weightage: 'high', hours: 1 },
          { title: 'Efficiency-Based Problems', weightage: 'high', hours: 1 },
          { title: 'Pipes & Cisterns', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Time, Speed & Distance', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Basic Speed-Distance Calculations', weightage: 'high', hours: 1 },
          { title: 'Trains & Relative Speed', weightage: 'high', hours: 1 },
          { title: 'Boats & Streams', weightage: 'medium', hours: 1 },
          { title: 'Average Speed Problems', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Algebra', weightage: 'medium', hours: 4, priority: 7,
        subtopics: [
          { title: 'Linear Equations', weightage: 'high', hours: 1 },
          { title: 'Quadratic Equations', weightage: 'medium', hours: 1 },
          { title: 'Algebraic Identities', weightage: 'high', hours: 1 },
          { title: 'Inequalities', weightage: 'low', hours: 1 },
        ]},
      { title: 'Geometry', weightage: 'high', hours: 5, priority: 8,
        subtopics: [
          { title: 'Lines, Angles & Triangles', weightage: 'high', hours: 2 },
          { title: 'Circles & Tangents', weightage: 'high', hours: 1 },
          { title: 'Quadrilaterals & Polygons', weightage: 'medium', hours: 1 },
          { title: 'Congruence & Similarity', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Mensuration', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: '2D Shapes (Triangle, Circle, Rectangle)', weightage: 'high', hours: 2 },
          { title: '3D Shapes (Cube, Cylinder, Cone)', weightage: 'high', hours: 2 },
        ]},
      { title: 'Data Interpretation', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Bar Graph & Histogram', weightage: 'high', hours: 1 },
          { title: 'Line Graph & Tabular DI', weightage: 'high', hours: 1 },
          { title: 'Pie Chart & Mixed DI', weightage: 'high', hours: 2 },
        ]},
    ]},
  'English Comprehension': {
    weightage: 'high', order: 4,
    topics: [
      { title: 'Grammar', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Parts of Speech', weightage: 'high', hours: 1 },
          { title: 'Subject-Verb Agreement', weightage: 'high', hours: 1 },
          { title: 'Tenses (Present, Past, Future)', weightage: 'high', hours: 1 },
          { title: 'Active & Passive Voice', weightage: 'high', hours: 1 },
          { title: 'Direct & Indirect Speech', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Vocabulary', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Synonyms & Antonyms', weightage: 'high', hours: 1 },
          { title: 'One Word Substitution', weightage: 'high', hours: 1 },
          { title: 'Idioms & Phrases', weightage: 'high', hours: 1 },
          { title: 'Word Usage in Context', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Error Detection & Correction', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Grammatical Error Spotting', weightage: 'high', hours: 2 },
          { title: 'Sentence Improvement & Correction', weightage: 'high', hours: 2 },
        ]},
      { title: 'Reading Comprehension', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Factual Questions from Passage', weightage: 'high', hours: 1 },
          { title: 'Inference-Based Questions', weightage: 'high', hours: 1 },
          { title: 'Vocabulary in Passage', weightage: 'medium', hours: 1 },
          { title: 'Title & Central Idea', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Fill in the Blanks', weightage: 'medium', hours: 2, priority: 7,
        subtopics: [
          { title: 'Single Blank (Vocabulary Based)', weightage: 'high', hours: 1 },
          { title: 'Double Blank (Contextual)', weightage: 'medium', hours: 1 },
        ]},
    ]},
};

// ─── Banking ──────────────────────────────────────────────────────────────────
const BANKING_SUBJECTS = {
  'Reasoning Ability': {
    weightage: 'high', order: 1,
    topics: [
      { title: 'Puzzles & Seating Arrangement', weightage: 'high', hours: 8, priority: 10,
        subtopics: [
          { title: 'Linear Seating Arrangement (1 row / 2 rows)', weightage: 'high', hours: 2 },
          { title: 'Circular Seating Arrangement', weightage: 'high', hours: 2 },
          { title: 'Floor & Box Puzzles', weightage: 'high', hours: 2 },
          { title: 'Scheduling & Month Puzzles', weightage: 'high', hours: 2 },
        ]},
      { title: 'Logical Reasoning', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Input-Output', weightage: 'high', hours: 1 },
          { title: 'Data Sufficiency', weightage: 'high', hours: 1 },
          { title: 'Coding Inequalities', weightage: 'high', hours: 1 },
          { title: 'Syllogism (Definite, Possibility)', weightage: 'high', hours: 2 },
        ]},
      { title: 'Blood Relations & Directions', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Blood Relation Problems', weightage: 'medium', hours: 1.5 },
          { title: 'Direction & Distance Problems', weightage: 'medium', hours: 1.5 },
        ]},
      { title: 'Alphabet & Number Test', weightage: 'medium', hours: 2, priority: 6,
        subtopics: [
          { title: 'Alphanumeric Series', weightage: 'medium', hours: 1 },
          { title: 'Ranking & Order Tests', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Quantitative Aptitude': {
    weightage: 'high', order: 2,
    topics: [
      { title: 'Data Interpretation', weightage: 'high', hours: 10, priority: 10,
        subtopics: [
          { title: 'Bar Graph DI', weightage: 'high', hours: 2 },
          { title: 'Line Chart DI', weightage: 'high', hours: 2 },
          { title: 'Pie Chart DI', weightage: 'high', hours: 2 },
          { title: 'Tabular DI', weightage: 'high', hours: 2 },
          { title: 'Caselet / Paragraph DI', weightage: 'high', hours: 2 },
        ]},
      { title: 'Arithmetic Word Problems', weightage: 'high', hours: 8, priority: 9,
        subtopics: [
          { title: 'Partnership Problems', weightage: 'high', hours: 2 },
          { title: 'Averages, Mixtures & Alligation', weightage: 'high', hours: 2 },
          { title: 'Probability Basics', weightage: 'medium', hours: 2 },
          { title: 'Permutation & Combination', weightage: 'medium', hours: 2 },
        ]},
      { title: 'Data Sufficiency', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Statement Sufficiency Problems', weightage: 'high', hours: 1.5 },
          { title: 'Data Comparison Problems', weightage: 'medium', hours: 1.5 },
        ]},
      { title: 'Approximation & Simplification', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'BODMAS & Simplification', weightage: 'high', hours: 1 },
          { title: 'Approximation Techniques', weightage: 'high', hours: 1 },
          { title: 'Quadratic Equations', weightage: 'high', hours: 1 },
        ]},
    ]},
  'English Language': {
    weightage: 'high', order: 3,
    topics: [
      { title: 'Reading Comprehension', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'RC Passage: Theme & Main Idea', weightage: 'high', hours: 2 },
          { title: 'RC Passage: Inference & Tone', weightage: 'high', hours: 2 },
          { title: 'Vocabulary from Passage', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Grammar & Sentence Correction', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Spotting Errors', weightage: 'high', hours: 2 },
          { title: 'Sentence Improvement', weightage: 'high', hours: 1 },
          { title: 'Para Jumbles', weightage: 'high', hours: 1 },
        ]},
      { title: 'Cloze Test', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Traditional Cloze Test', weightage: 'high', hours: 1.5 },
          { title: 'New Pattern Cloze Test', weightage: 'high', hours: 1.5 },
        ]},
      { title: 'Vocabulary', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Fill in the Blanks (Single/Double)', weightage: 'high', hours: 1 },
          { title: 'Word Usage & Appropriateness', weightage: 'medium', hours: 1 },
          { title: 'Idioms & Phrases', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'General Awareness': {
    weightage: 'high', order: 4,
    topics: [
      { title: 'Banking & Financial Awareness', weightage: 'high', hours: 8, priority: 10,
        subtopics: [
          { title: 'RBI & Monetary Policy', weightage: 'high', hours: 2 },
          { title: 'Types of Banks (Public, Private, RRB)', weightage: 'high', hours: 1 },
          { title: 'Financial Instruments (Bonds, Derivatives)', weightage: 'medium', hours: 1 },
          { title: 'Basel Norms & Banking Regulation', weightage: 'high', hours: 2 },
          { title: 'Payment Systems (UPI, RTGS, NEFT, IMPS)', weightage: 'high', hours: 2 },
        ]},
      { title: 'Economy & Finance Current Affairs', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'Budget Highlights & Economic Survey', weightage: 'high', hours: 1 },
          { title: 'New Financial Schemes', weightage: 'high', hours: 1 },
          { title: 'Banking Mergers & Policy Changes', weightage: 'high', hours: 1 },
          { title: 'Index Numbers (Sensex, Nifty, WPI, CPI)', weightage: 'high', hours: 1 },
        ]},
      { title: 'Static GK', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Capitals, Currencies & Leaders', weightage: 'medium', hours: 1 },
          { title: 'Headquarters of Financial Bodies', weightage: 'high', hours: 1 },
          { title: 'Important Days & Events', weightage: 'low', hours: 1 },
        ]},
    ]},
  'Computer Awareness': {
    weightage: 'medium', order: 5,
    topics: [
      { title: 'Computer Fundamentals', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Hardware & Software Basics', weightage: 'high', hours: 1 },
          { title: 'Input / Output Devices', weightage: 'medium', hours: 1 },
          { title: 'Memory Units (RAM, ROM, HDD)', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Operating Systems & Networking', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Windows, Linux & OS Concepts', weightage: 'medium', hours: 1 },
          { title: 'Network Types (LAN, WAN, MAN)', weightage: 'medium', hours: 1 },
          { title: 'Internet & Cybersecurity Basics', weightage: 'medium', hours: 1 },
        ]},
    ]},
};

// ─── Railway ──────────────────────────────────────────────────────────────────
const RAILWAY_SUBJECTS = {
  Mathematics: {
    weightage: 'high', order: 1,
    topics: [
      { title: 'Number System', weightage: 'high', hours: 3, priority: 8,
        subtopics: [
          { title: 'Integers, Fractions & Decimals', weightage: 'high', hours: 1 },
          { title: 'LCM & HCF', weightage: 'high', hours: 1 },
          { title: 'Square & Cube Roots', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Arithmetic', weightage: 'high', hours: 6, priority: 9,
        subtopics: [
          { title: 'Ratio, Proportion & Percentage', weightage: 'high', hours: 2 },
          { title: 'Profit & Loss', weightage: 'high', hours: 1 },
          { title: 'Time, Work & Speed', weightage: 'high', hours: 2 },
          { title: 'Average & Ages', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Algebra & Geometry', weightage: 'medium', hours: 3, priority: 6,
        subtopics: [
          { title: 'Basic Algebraic Equations', weightage: 'medium', hours: 1 },
          { title: 'Geometry Basics (Lines, Angles, Triangles)', weightage: 'medium', hours: 1 },
          { title: 'Mensuration (Area, Volume)', weightage: 'medium', hours: 1 },
        ]},
    ]},
  Reasoning: {
    weightage: 'high', order: 2,
    topics: [
      { title: 'Verbal Reasoning', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Analogy & Classification', weightage: 'high', hours: 1 },
          { title: 'Series (Alphabetical & Numerical)', weightage: 'high', hours: 1 },
          { title: 'Blood Relations', weightage: 'medium', hours: 1 },
          { title: 'Coding & Decoding', weightage: 'high', hours: 1 },
          { title: 'Directions & Distances', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Non-Verbal Reasoning', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Mirror Images', weightage: 'medium', hours: 1 },
          { title: 'Pattern Completion', weightage: 'medium', hours: 1 },
          { title: 'Figure Matrix', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'General Science': {
    weightage: 'high', order: 3,
    topics: [
      { title: 'Physics', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Units, Measurements & Kinematics', weightage: 'high', hours: 1 },
          { title: 'Force, Motion & Work-Energy', weightage: 'high', hours: 1 },
          { title: 'Light, Sound & Electricity', weightage: 'high', hours: 1 },
          { title: 'Heat & Thermodynamics', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Chemistry', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Periodic Table & Elements', weightage: 'high', hours: 1 },
          { title: 'Acids, Bases & Salts', weightage: 'high', hours: 1 },
          { title: 'Metals & Non-metals', weightage: 'high', hours: 1 },
          { title: 'Carbon Compounds & Chemistry of Everyday Life', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Life Sciences (Biology)', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Cell Structure & Division', weightage: 'medium', hours: 1 },
          { title: 'Human Body Systems (Digestive, Circulatory)', weightage: 'high', hours: 1 },
          { title: 'Diseases, Pathogens & Immunity', weightage: 'high', hours: 1 },
          { title: 'Plant Kingdom & Photosynthesis', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'General Awareness': {
    weightage: 'high', order: 4,
    topics: [
      { title: 'Static GK', weightage: 'medium', hours: 4, priority: 7,
        subtopics: [
          { title: 'Indian History & Freedom Struggle', weightage: 'medium', hours: 1 },
          { title: 'Indian Geography & Physical Features', weightage: 'medium', hours: 1 },
          { title: 'National Symbols, Culture & Sports', weightage: 'medium', hours: 1 },
          { title: 'Indian Polity & Constitution Basics', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Current Affairs (Railway-specific)', weightage: 'high', hours: 3, priority: 9,
        subtopics: [
          { title: 'Railway Budget & Projects', weightage: 'high', hours: 1 },
          { title: 'New Train Services & Routes', weightage: 'high', hours: 1 },
          { title: 'National & International Events', weightage: 'medium', hours: 1 },
        ]},
    ]},
};

// ─── Defence ──────────────────────────────────────────────────────────────────
const DEFENCE_SUBJECTS = {
  Mathematics: {
    weightage: 'high', order: 1,
    topics: [
      { title: 'Algebra', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Sets, Relations & Functions', weightage: 'high', hours: 1 },
          { title: 'Quadratic Equations & Polynomials', weightage: 'high', hours: 1 },
          { title: 'Sequence & Series (AP & GP)', weightage: 'high', hours: 1 },
          { title: 'Logarithms & Exponentials', weightage: 'medium', hours: 1 },
          { title: 'Permutation & Combination', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Calculus', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Limits & Continuity', weightage: 'high', hours: 1 },
          { title: 'Differentiation Rules', weightage: 'high', hours: 1 },
          { title: 'Applications of Differentiation', weightage: 'high', hours: 1 },
          { title: 'Integration Techniques', weightage: 'high', hours: 1 },
          { title: 'Differential Equations Basics', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Trigonometry & Coordinate Geometry', weightage: 'high', hours: 5, priority: 8,
        subtopics: [
          { title: 'Trigonometric Ratios & Identities', weightage: 'high', hours: 1 },
          { title: 'Heights & Distances', weightage: 'high', hours: 1 },
          { title: 'Straight Lines & Conic Sections', weightage: 'medium', hours: 1 },
          { title: '3D Geometry Basics', weightage: 'medium', hours: 1 },
          { title: 'Vectors & Matrices', weightage: 'medium', hours: 1 },
        ]},
      { title: 'Statistics & Probability', weightage: 'medium', hours: 3, priority: 7,
        subtopics: [
          { title: 'Mean, Median, Mode & Standard Deviation', weightage: 'medium', hours: 1 },
          { title: 'Probability Theorems', weightage: 'medium', hours: 1 },
          { title: 'Binomial Distribution', weightage: 'low', hours: 1 },
        ]},
    ]},
  English: {
    weightage: 'high', order: 2,
    topics: [
      { title: 'Grammar & Sentence Structure', weightage: 'high', hours: 5, priority: 9,
        subtopics: [
          { title: 'Parts of Speech & Sentence Types', weightage: 'high', hours: 1 },
          { title: 'Tense, Voice & Narration', weightage: 'high', hours: 2 },
          { title: 'Prepositions, Articles & Conjunctions', weightage: 'medium', hours: 1 },
          { title: 'Error Detection & Correction', weightage: 'high', hours: 1 },
        ]},
      { title: 'Vocabulary & Reading', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Synonyms, Antonyms & Fill in the Blanks', weightage: 'high', hours: 2 },
          { title: 'Comprehension Passages', weightage: 'high', hours: 2 },
        ]},
    ]},
  'General Knowledge': {
    weightage: 'high', order: 3,
    topics: [
      { title: 'Indian History & Culture', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Freedom Movement & Post-Independence India', weightage: 'high', hours: 2 },
          { title: 'Indian Culture & Heritage', weightage: 'medium', hours: 2 },
        ]},
      { title: 'Geography & Science', weightage: 'high', hours: 4, priority: 8,
        subtopics: [
          { title: 'Indian Geography – Physical Features', weightage: 'high', hours: 2 },
          { title: 'General Science – Physics, Chemistry, Biology', weightage: 'high', hours: 2 },
        ]},
      { title: 'Defence Current Affairs', weightage: 'high', hours: 3, priority: 9,
        subtopics: [
          { title: 'Indian Armed Forces: Structure & Commands', weightage: 'high', hours: 1 },
          { title: 'Recent Defence Exercises & Acquisitions', weightage: 'high', hours: 1 },
          { title: 'Strategic & Security Affairs', weightage: 'medium', hours: 1 },
        ]},
    ]},
  'Current Affairs': {
    weightage: 'high', order: 4,
    topics: [
      { title: 'National & International Events', weightage: 'high', hours: 4, priority: 9,
        subtopics: [
          { title: 'National Political & Economic Events', weightage: 'high', hours: 2 },
          { title: 'International Geopolitics & Conflicts', weightage: 'high', hours: 2 },
        ]},
    ]},
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════
const run = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
  console.log(`🔌 Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected.\n');

  if (DO_RESET) {
    console.log('⚠️  --reset flag detected. Wiping all syllabus data...');
    await Promise.all([
      Exam.deleteMany({}),
      ExamPhase.deleteMany({}),
      Subject.deleteMany({}),
      Topic.deleteMany({}),
      Subtopic.deleteMany({}),
    ]);
    console.log('✅ Cleared.\n');
  }

  // Ensure admin user
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Seed Admin', email: 'admin@targetrank.com',
      password: 'Test@123', role: 'admin', active: true,
    });
    console.log('👤 Created seed admin user.');
  }
  ADMIN_ID = admin._id;

  // ─── UPSC ─────────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding UPSC...');
  const upscExam = await upsertExam({
    title: 'UPSC CSE',
    shortDescription: 'Union Public Service Commission Civil Services Examination',
    fullDescription: 'Premier competitive exam for IAS, IPS, IFS, and central Group A/B services.',
    conductingBody: 'Union Public Service Commission', eligibility: 'Graduate, Age 21-32',
    examPattern: 'Prelims (MCQ) → Mains (Written) → Interview', category: 'civil_services', displayOrder: 1,
  });

  const upscPhases = [
    { name: 'UPSC Foundation', order: 1 },
    { name: 'UPSC Prelims GS', order: 2 },
    { name: 'UPSC CSAT', order: 3 },
    { name: 'UPSC Mains', order: 4 },
    { name: 'UPSC Interview', order: 5 },
  ];

  for (const ph of upscPhases) {
    const phase = await upsertPhase(upscExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);

    if (ph.name === 'UPSC CSAT') {
      const csatSub = await upsertSubject(upscExam._id, phase._id, 'CSAT – Paper 2', 1, 'high');
      await upsertTopics(upscExam._id, phase._id, csatSub._id, UPSC_CSAT_TOPICS);
    } else if (ph.name === 'UPSC Mains') {
      const mainsSub = await upsertSubject(upscExam._id, phase._id, 'GS Papers (1-4) & Essay', 1, 'high');
      await upsertTopics(upscExam._id, phase._id, mainsSub._id, UPSC_MAINS_GS);
    } else if (ph.name === 'UPSC Interview') {
      const intSub = await upsertSubject(upscExam._id, phase._id, 'Personality Test', 1, 'high');
      await upsertTopics(upscExam._id, phase._id, intSub._id, UPSC_INTERVIEW);
    } else {
      // Foundation & Prelims GS: all 16 subjects
      let subOrder = 1;
      for (const [subName, subData] of Object.entries(UPSC_SUBJECTS)) {
        const sub = await upsertSubject(upscExam._id, phase._id, subName, subOrder++, subData.weightage);
        await upsertTopics(upscExam._id, phase._id, sub._id, subData.topics);
      }
    }
  }

  // ─── BPSC ─────────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding BPSC...');
  const bpscExam = await upsertExam({
    title: 'BPSC', shortDescription: 'Bihar Public Service Commission Examination',
    fullDescription: 'State civil services exam for Group A/B posts in Bihar government.',
    conductingBody: 'Bihar Public Service Commission', eligibility: 'Graduate, Age 21-37',
    examPattern: 'Prelims → Mains → Interview', category: 'state_psc', displayOrder: 2,
  });
  const bpscPhaseNames = [
    { name: 'BPSC Foundation', order: 1 }, { name: 'BPSC Prelims', order: 2 },
    { name: 'BPSC Mains', order: 3 }, { name: 'BPSC Interview', order: 4 },
  ];
  const biharTopics = makeStatePSCTopics('Bihar', ['Kosi', 'Tirhut', 'Magadh', 'Saran'], ['Ganga', 'Gandak', 'Kosi', 'Son'], 'Patna', ['Patna', 'Gaya', 'Muzaffarpur']);

  for (const ph of bpscPhaseNames) {
    const phase = await upsertPhase(bpscExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);
    // Add general UPSC core subjects at lighter level
    const gsSubjects = ['History', 'Geography', 'Indian Polity', 'Economy', 'Science & Technology', 'Current Affairs'];
    let order = 1;
    for (const sname of gsSubjects) {
      const sd = UPSC_SUBJECTS[sname] || { weightage: 'medium', topics: [{ title: `${sname} Basics`, weightage: 'medium', hours: 3, subtopics: [] }] };
      const sub = await upsertSubject(bpscExam._id, phase._id, sname, order++, sd.weightage);
      await upsertTopics(bpscExam._id, phase._id, sub._id, sd.topics.slice(0, 4)); // top 4 topics for each subject
    }
    const biharSub = await upsertSubject(bpscExam._id, phase._id, 'Bihar General Knowledge', order++, 'high');
    await upsertTopics(bpscExam._id, phase._id, biharSub._id, biharTopics);
  }

  // ─── JPSC ─────────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding JPSC...');
  const jpscExam = await upsertExam({
    title: 'JPSC', shortDescription: 'Jharkhand Public Service Commission Examination',
    fullDescription: 'State civil services exam for Group A/B posts in Jharkhand government.',
    conductingBody: 'Jharkhand Public Service Commission', eligibility: 'Graduate, Age 21-35',
    examPattern: 'Prelims → Mains → Interview', category: 'state_psc', displayOrder: 3,
  });
  const jpscPhaseNames = [
    { name: 'JPSC Foundation', order: 1 }, { name: 'JPSC Prelims', order: 2 },
    { name: 'JPSC Mains', order: 3 }, { name: 'JPSC Interview', order: 4 },
  ];
  const jharkhandTopics = makeStatePSCTopics(
    'Jharkhand',
    ['Chhota Nagpur Plateau', 'Santhal Pargana', 'North Chhota Nagpur', 'Kolhan'],
    ['Damodar', 'Subarnarekha', 'Koel', 'Kanchi'],
    'Ranchi',
    ['Ranchi', 'Dhanbad', 'Jamshedpur']
  );
  // Add extra Jharkhand-specific topics
  jharkhandTopics.push(
    { title: 'Minerals & Mining in Jharkhand', weightage: 'high', hours: 3, priority: 9,
      subtopics: [
        { title: 'Coal, Iron, Copper & Mica Resources', weightage: 'high', hours: 1 },
        { title: 'Mining Industry & Challenges', weightage: 'high', hours: 1 },
        { title: 'Mineral Policy & JSEB', weightage: 'medium', hours: 1 },
      ]},
    { title: 'Tribes & Tribal Affairs in Jharkhand', weightage: 'high', hours: 3, priority: 9,
      subtopics: [
        { title: 'Major Tribes of Jharkhand (Santhal, Oraon, Munda)', weightage: 'high', hours: 1 },
        { title: 'Tribal Uprisings & Revolts', weightage: 'high', hours: 1 },
        { title: 'Panchayat Extension to Scheduled Areas (PESA)', weightage: 'medium', hours: 1 },
      ]}
  );
  for (const ph of jpscPhaseNames) {
    const phase = await upsertPhase(jpscExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);
    const gsSubjects = ['History', 'Geography', 'Indian Polity', 'Economy', 'Science & Technology', 'Current Affairs'];
    let order = 1;
    for (const sname of gsSubjects) {
      const sd = UPSC_SUBJECTS[sname] || { weightage: 'medium', topics: [] };
      const sub = await upsertSubject(jpscExam._id, phase._id, sname, order++, sd.weightage);
      await upsertTopics(jpscExam._id, phase._id, sub._id, sd.topics.slice(0, 4));
    }
    const jhSub = await upsertSubject(jpscExam._id, phase._id, 'Jharkhand General Knowledge', order++, 'high');
    await upsertTopics(jpscExam._id, phase._id, jhSub._id, jharkhandTopics);
  }

  // ─── UPPSC ────────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding UPPSC...');
  const uppscExam = await upsertExam({
    title: 'UPPSC', shortDescription: 'Uttar Pradesh Public Service Commission Examination',
    fullDescription: 'State civil services exam for PCS/Group B posts in Uttar Pradesh government.',
    conductingBody: 'Uttar Pradesh Public Service Commission', eligibility: 'Graduate, Age 21-40',
    examPattern: 'Prelims → Mains → Interview', category: 'state_psc', displayOrder: 4,
  });
  const uppscPhaseNames = [
    { name: 'UPPSC Foundation', order: 1 }, { name: 'UPPSC Prelims', order: 2 },
    { name: 'UPPSC Mains', order: 3 }, { name: 'UPPSC Interview', order: 4 },
  ];
  const upTopics = makeStatePSCTopics(
    'Uttar Pradesh',
    ['Agra', 'Awadh', 'Braj', 'Varanasi', 'Bundelkhand'],
    ['Ganga', 'Yamuna', 'Saryu', 'Gomti', 'Ghaghra'],
    'Lucknow',
    ['Lucknow', 'Varanasi', 'Agra', 'Allahabad']
  );
  upTopics.push(
    { title: 'One District One Product (ODOP) Scheme', weightage: 'high', hours: 2, priority: 9,
      subtopics: [
        { title: 'ODOP Background & Objectives', weightage: 'high', hours: 1 },
        { title: 'District-wise Products', weightage: 'high', hours: 1 },
      ]},
    { title: 'UP Agriculture & Irrigation', weightage: 'high', hours: 2, priority: 8,
      subtopics: [
        { title: 'Cropping Pattern & Major Crops in UP', weightage: 'high', hours: 1 },
        { title: 'Irrigation Canals & Water Management in UP', weightage: 'medium', hours: 1 },
      ]}
  );
  for (const ph of uppscPhaseNames) {
    const phase = await upsertPhase(uppscExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);
    const gsSubjects = ['History', 'Geography', 'Indian Polity', 'Economy', 'Science & Technology', 'Current Affairs'];
    let order = 1;
    for (const sname of gsSubjects) {
      const sd = UPSC_SUBJECTS[sname] || { weightage: 'medium', topics: [] };
      const sub = await upsertSubject(uppscExam._id, phase._id, sname, order++, sd.weightage);
      await upsertTopics(uppscExam._id, phase._id, sub._id, sd.topics.slice(0, 4));
    }
    const upSub = await upsertSubject(uppscExam._id, phase._id, 'Uttar Pradesh General Knowledge', order++, 'high');
    await upsertTopics(uppscExam._id, phase._id, upSub._id, upTopics);
  }

  // ─── SSC CGL ──────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding SSC CGL...');
  const sscExam = await upsertExam({
    title: 'SSC CGL', shortDescription: 'Staff Selection Commission Combined Graduate Level Exam',
    fullDescription: 'National-level exam for recruitment to Group B & C posts in central ministries.',
    conductingBody: 'Staff Selection Commission', eligibility: 'Graduate, Age 18-30',
    examPattern: 'Tier I (CBT) → Tier II (CBT) → Skill/Document Verification', category: 'ssc', displayOrder: 5,
  });
  const sscPhaseNames = [
    { name: 'SSC CGL Tier 1', order: 1 }, { name: 'SSC CGL Tier 2', order: 2 },
  ];
  for (const ph of sscPhaseNames) {
    const phase = await upsertPhase(sscExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);
    let order = 1;
    for (const [subName, subData] of Object.entries(SSC_SUBJECTS)) {
      const sub = await upsertSubject(sscExam._id, phase._id, subName, order++, subData.weightage);
      await upsertTopics(sscExam._id, phase._id, sub._id, subData.topics);
    }
  }

  // ─── Banking ──────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding Banking...');
  const bankExam = await upsertExam({
    title: 'Banking Exams', shortDescription: 'IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B exams',
    fullDescription: 'Competitive exams for Probationary Officers and Clerks in PSU banks.',
    conductingBody: 'IBPS / SBI / RBI', eligibility: 'Graduate, Age 20-30',
    examPattern: 'Prelims → Mains → Group Discussion & Interview', category: 'banking', displayOrder: 6,
  });
  const bankPhaseNames = [
    { name: 'Banking Foundation', order: 1 }, { name: 'Banking Prelims', order: 2 },
    { name: 'Banking Mains', order: 3 }, { name: 'Banking Interview', order: 4 },
  ];
  for (const ph of bankPhaseNames) {
    const phase = await upsertPhase(bankExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);
    let order = 1;
    for (const [subName, subData] of Object.entries(BANKING_SUBJECTS)) {
      const sub = await upsertSubject(bankExam._id, phase._id, subName, order++, subData.weightage);
      await upsertTopics(bankExam._id, phase._id, sub._id, subData.topics);
    }
  }

  // ─── Railway ──────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding Railway...');
  const railExam = await upsertExam({
    title: 'Railway Exams', shortDescription: 'RRB NTPC, RRB Group D, RRB ALP Exams',
    fullDescription: 'Railway Recruitment Board exams for various non-technical and technical posts.',
    conductingBody: 'Railway Recruitment Board (RRB)', eligibility: '10th/12th/Graduate, Age 18-33',
    examPattern: 'CBT Stage 1 → CBT Stage 2 → Skill/Medical Test', category: 'railway', displayOrder: 7,
  });
  const railPhaseNames = [
    { name: 'Railway Stage 1 (CBT 1)', order: 1 }, { name: 'Railway Stage 2 (CBT 2)', order: 2 },
  ];
  for (const ph of railPhaseNames) {
    const phase = await upsertPhase(railExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);
    let order = 1;
    for (const [subName, subData] of Object.entries(RAILWAY_SUBJECTS)) {
      const sub = await upsertSubject(railExam._id, phase._id, subName, order++, subData.weightage);
      await upsertTopics(railExam._id, phase._id, sub._id, subData.topics);
    }
  }

  // ─── Defence ──────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding Defence...');
  const defExam = await upsertExam({
    title: 'Defence Exams', shortDescription: 'CDS, NDA, CAPF, AFCAT Exams',
    fullDescription: 'Exams for entry into Indian Army, Navy, Air Force and Central Armed Police Forces.',
    conductingBody: 'UPSC / CDS / NDA / CAPF', eligibility: '12th/Graduate, Age 16.5-25',
    examPattern: 'Written Exam → SSB Interview (Personality & Intelligence Test)', category: 'defence', displayOrder: 8,
  });
  const defPhaseNames = [
    { name: 'Defence Foundation', order: 1 }, { name: 'Defence Written Exam', order: 2 },
    { name: 'Defence SSB Interview', order: 3 },
  ];
  for (const ph of defPhaseNames) {
    const phase = await upsertPhase(defExam._id, ph.name, ph.order);
    console.log(`  ⚡ ${ph.name}`);
    let order = 1;
    for (const [subName, subData] of Object.entries(DEFENCE_SUBJECTS)) {
      const sub = await upsertSubject(defExam._id, phase._id, subName, order++, subData.weightage);
      await upsertTopics(defExam._id, phase._id, sub._id, subData.topics);
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════');
  console.log('🎉 Phase 10.1 Step 2 – Complete Syllabus Seeding Done!');
  console.log(`   Exams    : ${C.exams}`);
  console.log(`   Phases   : ${C.phases}`);
  console.log(`   Subjects : ${C.subjects}`);
  console.log(`   Topics   : ${C.topics}`);
  console.log(`   Subtopics: ${C.subtopics}`);
  console.log('════════════════════════════════════════════════════════');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
